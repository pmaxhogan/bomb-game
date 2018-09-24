const admin = require("firebase-admin");
var serviceAccount = process.env.SERVICE_ACCOUNT ? JSON.parse(process.env.SERVICE_ACCOUNT) : require("./service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
db.settings({timestampsInSnapshots: true});

// the most time to wait for a pong before closing the connection.
const MAX_CONNECTION_BROKEN_WAIT = 5 * 1000;

// 1 out of every n ticks is sent to the client.
const tickSkip = 1;
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 8080, host: process.env.HOST || "0.0.0.0" });

const mainEmitter = require("./game.js");

const convertBase = (value, from_base, to_base) => {
  value = value.toString();
  var range = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
  var from_range = range.slice(0, from_base);
  var to_range = range.slice(0, to_base);

  var dec_value = value.split("").reverse().reduce(function (carry, digit, index) {
    if (from_range.indexOf(digit) === -1){
      throw new Error("Invalid digit `"+digit+"` for base "+from_base+".");
    }
    return carry += from_range.indexOf(digit) * (Math.pow(from_base, index));
  }, 0);

  var new_value = "";
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = (dec_value - (dec_value % to_base)) / to_base;
  }
  return new_value || "0";
};

const stringifyResponse = (players, bombs, bullets) => {
  let str = "";

  str += players.reduce((str, player) => {
    str += "!";
    str += convertBase(Math.floor(Math.max(player.x, 0)), 10, 64) + "=";
    str += convertBase(Math.floor(Math.max(player.y, 0)), 10, 64) + "=";
    str += convertBase(Math.floor(player.id), 10, 64) + "=";
    str += ({
      "up": "u",
      "down": "d",
      "left": "l",
      "right": "r"
    })[player.direction];
    return str;
  }, "");

  str += bombs.reduce((str, bomb) => {
    if(bomb.x < 0 || bomb.y < 0) return;
    str += "?";
    str += convertBase(Math.floor(bomb.x), 10, 64) + "=";
    str += convertBase(Math.floor(bomb.y), 10, 64);
    return str;
  }, "");

  str += bullets.reduce((str, bullet) => {
    if(bullet.x < 0 || bullet.y < 0) return;
    str += ".";
    str += convertBase(Math.floor(bullet.x), 10, 64) + "=";
    str += convertBase(Math.floor(bullet.y), 10, 64);
    return str;
  }, "");

  return str;
};

const authenticate = (token) =>
  admin.auth().verifyIdToken(token).then(user => {
    return user;
  });

// Broadcast to all.
wss.broadcast = function broadcast(...data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      if(!JSON.stringify(data).trim()) throw data;
      client.send(JSON.stringify(data));
    }
  });
};

let map;
let players;
let bombs;
let bullets;

mainEmitter.emit("ready");

mainEmitter.on("map", newMap => {
  map = newMap;
});

mainEmitter.on("removeBlock", destroyed => {
  const broken = map.blocks.filter(block => destroyed[0] === block[0] && destroyed[1] === block[1])[0];
  const index = map.blocks.indexOf(broken);
  if(index) map.blocks.splice(index, 1);
});

mainEmitter.on("players", newPlayers => {
  players = newPlayers;
});
mainEmitter.on("bombs", newbombs => bombs = newbombs);
mainEmitter.on("bullets", newbullets => bullets = newbullets);

let tickCounter = 0;

mainEmitter.prependListener("removeUser", id => {
  wss.broadcast({
    type: "removePlayer",
    data: id
  });
});

mainEmitter.on("explosion", data => {
  wss.broadcast({
    type: "explosion",
    data
  });
});

mainEmitter.on("mapResetPending", data => {
  wss.broadcast({
    type: "mapResetPending",
    data
  });
});

let lastResponse;

mainEmitter.on("tick", () => {
  if(!players) return;

  let response = stringifyResponse(players, bombs, bullets);

  if(response === lastResponse) return;

  lastResponse = response;

  if(tickCounter % tickSkip === 0){
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if(!response.trim()) return;
        client.send(response);
      }
    });
  }

  tickCounter ++;
});

mainEmitter.on("userAdded", newUser => {
  console.log("new user added", newUser.username);
  wss.clients.forEach(c => {
    if(c && c.id && c.id === newUser.id){
      c.send(JSON.stringify([
        {
          type: "players",
          data: players.map(player => ({
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height,
            fillColor: player.fillColor,
            id: player.id,
            direction: player.direction,
            username: player.username,
            killStreak: player.killStreak
          }))
        }
      ]));
    }else{
      c.send(JSON.stringify([{
        type: "newUser",
        data: {
          x: newUser.x,
          y: newUser.y,
          width: newUser.width,
          height: newUser.height,
          fillColor: newUser.fillColor,
          id: newUser.id,
          direction: newUser.direction,
          username: newUser.username,
          killStreak: newUser.killStreak
        }
      }]));
    }
  });
});

mainEmitter.on("kill", data => wss.broadcast(data));

mainEmitter.on("mapReset", () => wss.broadcast(
  {
    type: "mapReset",
    data: map
  }));

wss.on("connection", function connection(ws) {
  const send = (...data) => {
    if(ws.readyState !== WebSocket.OPEN) return;

    //there might not be data
    if(!JSON.stringify(data).trim()) return;
    ws.send(JSON.stringify(data));
  };
  ws.on("message", function incoming(data) {
    try{
      JSON.parse(data).forEach(data => {
        try{
          const token = data.data && data.data.token;
          switch(data.type){
          case "hello":
            (async function() {
              let username;

              if(token){
                try {
                  ws.user = await authenticate(token);
                  console.log("user:", ws.user);
                } catch (e) {
                  console.log("Invalid token", token, e);
                  ws.close();
                  return;
                }

                try {
                  const ref = await db.collection("users").doc(ws.user.uid).get();
                  if(!ref.exists) throw new Error("Ref does not exist!");
                  data = ref.data();
                  console.log(data);
                  username = data.username;
                } catch (e) {
                  console.error("Could not get username for user", ws.user.uid, e);
                }
              }

              ws.id = Math.floor(Math.random() * 32768);
              send(
                {
                  type: "map",
                  data: map
                }, {
                  type: "playerinfo",
                  data: {
                    id: ws.id
                  }
                }
              );

              console.log("hello new user!", ws.id, username);
              mainEmitter.emit("newUser", {id: ws.id, username});

            })();
            break;
          case "keyDown":
            mainEmitter.emit("keyDown", {
              key: data.data,
              id: ws.id
            });
            break;
          case "keyUp":
            mainEmitter.emit("keyUp", {
              key: data.data,
              id: ws.id
            });
            break;
          case "bomb":
            mainEmitter.emit("bomb", ws.id);
            break;
          case "bullet":
            mainEmitter.emit("bullet", ws.id);
            break;
          default:
            throw new Error("Unknown WS protocol type", data.type);
          }
        }catch(err){
          console.error("Unexpected error in message processing", err);
        }
      });
    }catch(err){
      console.error("Unexpected error in JSON parsing", err);
    }
  });
  ws.on("close", () => {
    console.log("removing user due to connection close", ws.id);
    mainEmitter.emit("removeUser", ws.id);
  });
  ws.on("error", err => console.error("ERROR", err));
});

// detect and close broken connections.
function noop() {}

function heartbeat() {
  this.isAlive = true;
}

wss.on("connection", function connection(ws) {
  ws.isAlive = true;
  ws.on("pong", heartbeat);
});

setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED){
      if(ws.id) mainEmitter.emit("removeUser", ws.id);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(noop);
  });
}, MAX_CONNECTION_BROKEN_WAIT);
