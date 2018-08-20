const WebSocket = require("uws");
const connect = () => {
  const ws = new WebSocket("ws://" + process.env.SERVER_IP + ":8080");
  console.log("connecting to", "ws://" + process.env.SERVER_IP + ":8080");
  let id = null;

  ws.on("open", () => {
    console.log("open");
    const send = data => ws.send(JSON.stringify(data));

    send([{type: "hello"}]);

    const keys = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
    const pressKey = (key, duration) => {
      send([{type: "keyDown", data: key}]);
      setTimeout(()=>send([{type: "keyUp", data: key}]), duration);
    };
    setInterval(() => pressKey(keys[Math.floor(Math.random() * keys.length)], Math.floor(Math.random() * 500)), 250);

    setInterval(() => send([{type: "keyPress", data: "q"}]), 150);


    let players = null;
    ws.on("message", msg => {
      if(msg.toString()[0] === "!"){
        return;
      }
      const data = JSON.parse(msg);

      data.forEach(message => {
        switch(message.type){
        case "playerinfo":
          id = message.data.id;
          console.log(id);
          break;
        case "players":
          players = message.data;
          break;
        case "kill":
          players.some(player => {
            if(player.id === id){
              if(message.data.victim === player.username){
                ws.close();
                setTimeout(connect, 750);
              }
              return true;
            }
          });
          break;
        }
      });
    });
  });


  ws.on("error", () => {
    console.log("reconnecting...");
    ws.close();
    setTimeout(connect, 750);
  });
  ws.on("unexpected-response", console.error);
};

connect();
