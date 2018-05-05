console.log("hello world");
let socket = new WebSocket("ws://localhost:8080");
socket.onopen = () => {
  console.log("[socket] connected");
  socket.send(Uint8Array.from([0b11111111, 0b11111111, 0b11111111]));
};
socket.onmessage = (e) => {
  console.log("[socket] recieved data", e);
};
