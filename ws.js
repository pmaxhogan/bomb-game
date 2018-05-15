// the most time to wait for a pong before closing the connection.
const MAX_CONNECTION_BROKEN_WAIT = 5 * 1000;
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const mainEmitter = require("./index.js");

// Broadcast to all.
wss.broadcast = function broadcast(...data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

let map;
let players;

mainEmitter.emit("ready");

mainEmitter.on("map", newMap => {
  console.log("got map", newMap);
  map = newMap;
});

mainEmitter.on("players", newPlayers => players = newPlayers);

mainEmitter.on("tick", () => {
  wss.broadcast({
    type: "tick",
    data: {
      players: players.map(player => ({
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height,
        direction: player.direction,
        fillColor: player.fillColor,
        id: player.id
      }))
    }
  });
});

wss.on("connection", function connection(ws) {
  const send = (...data) => {
    if(ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(data));
  };
  ws.on("message", function incoming(data) {
    console.log("[socket] recieved", data);
    try{
      JSON.parse(data).forEach(data => {
        try{
          switch(data.type){
          case "hello":
            ws.id = Math.random();
            send({type: "map", data: map}, {type: "playerinfo", data: {
              id: ws.id
            }});
            mainEmitter.emit("newUser", ws.id);
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
    console.log("removing user", ws.id);
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
      console.log("Terminating", ws.id);
      if(ws.id) mainEmitter.emit("removeUser", ws.id);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(noop);
  });
}, MAX_CONNECTION_BROKEN_WAIT);
