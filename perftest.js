const WebSocket = require("uws");

function clock(start) {
  if ( !start ) return process.hrtime();
  var end = process.hrtime(start);
  return Math.round((end[0]*1000) + (end[1]/1000000));
}

const times = [];

const connect = () => {
  const ws = new WebSocket("ws://" + process.env.SERVER_IP + ":8080");
  console.log("connecting to", "ws://" + process.env.SERVER_IP + ":8080");

  ws.on("open", () => {
    console.log("open");
    const send = data => ws.send(JSON.stringify(data));

    send([{type: "hello"}]);

  });

  let lastTime = clock();

  ws.on("message", msg => {
    if(msg[0] !== "?" && msg[0] !== "!") return;
    const time = clock(lastTime);
    if(time === 0) return;
    times.push(time);
    // console.log(time);
    lastTime = clock();
  });

  ws.on("error", console.error);
  ws.on("unexpected-response", console.error);

};

process.on("SIGINT", () => {
  const average = times.reduce((a, b) => a + b) / times.length;
  console.log(average + "ms");
  process.exit();
});

connect();
