const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on("connection", function connection(ws) {
  ws.send("Oh hello there!");
  ws.on("message", function incoming(data) {
    console.log("[socket] recieved", data, "from", ws);
  });
});
