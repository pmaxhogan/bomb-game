/* global game: false */

console.log("hello world");
let socket = new WebSocket("ws://localhost:8080");
socket.onopen = () => {
  console.log("[socket] connected");
  send({type: "hello", data: {}});
};

let tickCounter = 0;
let players = [];

let myId = null;//eslint-disable-line no-unused-vars

socket.onmessage = (e) => {
  // console.log("[socket] recieved data", e.data);
  try{
    JSON.parse(e.data).forEach(data => {
      try{
        switch(data.type){
        case "map":
          console.log("got map", data.data);
          game(data.data);
          break;
        case "playerinfo":
          console.log("info about me", data.data);
          myId = data.data.id;
          break;
        case "tick":
          players = data.data.players;
          if(tickCounter % 10 === 0){
            console.log("Players are", players);
          }
          tickCounter ++;
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

const send = (...data) => {
  socket.send(JSON.stringify(data));
};
