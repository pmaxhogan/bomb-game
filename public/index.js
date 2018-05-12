console.log("hello world");
let socket = new WebSocket("ws://localhost:8080");
socket.onopen = () => {
  console.log("[socket] connected");
  send({type: "hello", data: {}});
};
socket.onmessage = (e) => {
  console.log("[socket] recieved data", e);
  try{
    JSON.parse(e).forEach(data => {
      try{
        switch(data.type){
        case "map":
          console.log("got map", data.data);
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
};

let send = data => {
  socket.send(JSON.stringify([data]));
};
