const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const mainEmitter = require("./index.js");

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

let map;

mainEmitter.emit("ready");

mainEmitter.on("map", newMap => {
  console.log("got map", newMap);
  map = newMap;
});

wss.on("connection", function connection(ws) {
  const send = (...data) => {
    ws.send(JSON.stringify(data));
  };
  ws.on("message", function incoming(data) {
    console.log("[socket] recieved", data);
    try{
      JSON.parse(data).forEach(data => {
        try{
          switch(data.type){
          case "hello":
            send({type: "map", data: map});
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
});
