const num = parseInt(process.argv[2]);
const cluster = require("cluster");

if (cluster.isMaster) {
  for(let i = 0; i < num; i ++){
    console.log("creating new one", num);
    cluster.fork();
  }
}else{
  require("./random.js");
}
