#!/usr/bin/env node

const EventEmitter = require("events");

class __MyEmitter extends EventEmitter {}

const mainEmitter = new __MyEmitter();

// const colors = ["red", "orange", "#f7ec4f", "green", "blue", "black", "purple"];

let speed = 5;

const width = 100;
const height = 100;
const bulletSize = 5;
const bulletSpeed = 20;
const maxShotCooldown = 7;

const doLog = false;
const log = (...args) => {
  if(doLog){
    console.log(...args);// eslint-disable-line no-console
  }
};

const isCollision = (rect1, rect2) => {
  if (
    rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.height + rect1.y > rect2.y
  ) {
    return true;
  }
  return false;
};

class Block {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.collisionBoxes = [[0, 0, width, height]];
  }
  draw(){
    // TODO: code here?
  }
}

const playerCollisionCheck = (playerCollisionBoxes, objsToTest = blocks) => {
  let objCollidedWith = null;
  playerCollisionBoxes.some(playerBox => {
    return objsToTest.some(block => {
      if(!block || !block.collisionBoxes){
        throw block;
      }
      const isCollided = block.collisionBoxes.some(blockBox => {
        if(isCollision({
          x: playerBox[0],
          y: playerBox[1],
          width: playerBox[2],
          height: playerBox[3]
        }, {
          x: blockBox[0] + block.x,
          y: blockBox[1] + block.y,
          width: blockBox[2],
          height: blockBox[3]
        })){
          objCollidedWith = block;
          log("COLLISION", block);
          return true;
        }
      });
      return isCollided;
    });
  });
  return objCollidedWith;
};

const clone = arr => {
  let returnArr = [];
  arr.forEach(elem => {
    if(elem instanceof Array){
      return returnArr.push(clone(elem));
    }
    returnArr.push(elem);
  });
  return returnArr;
};

const realCollisionBoxes = player => {
  return clone(player.collisionBoxes).map(box => {
    box[0] += player.realX;
    box[1] += player.realY;
    return box;
  });
};

const userData = require("./users.json");

const randUsername = () => userData.reduce((acc, row) => acc + row.data[Math.floor(Math.random() * row.data.length)], "");

class Player {
  constructor(x, y, width, height, id) {
    this.killStreak = 0;
    this.shotCooldown = maxShotCooldown;
    this.collisionBoxes = [[0, 0, width, height]];
    this.width = width;
    this.height = height;
    this.realX = x;
    this.realY = y;
    this.fillColor = "hsl(" + Math.floor(Math.random() * 255) + ", 100%, 50%)";
    this.id = id;
    this.direction = "up";
    this.shotCooldown = 0;
    this.username = randUsername();
  }
  draw() {
    this.shotCooldown --;
  }
  kill(){
    this.isDead = true;
    if(players.length === 1){
      players.pop();
    }else{
      if(players.indexOf(this) < 0) return;
      players.splice(players.indexOf(this), 1);
    }
  }

  // onkeydown should be called every tick for each key that is down.
  onKeyDown(key) {
    switch (key) {
    case "up":
      this.y-=speed;
      break;
    case "down":
      this.y+=speed;
      break;
    case "left":
      this.x-=speed;
      break;
    case "right":
      this.x+=speed;
      break;
    }
  }

  shoot(){
    if(this.shotCooldown > 0) return;
    log("shoot");
    bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, this.direction, this));
    this.shotCooldown = maxShotCooldown;
  }

  get x() {
    return this.realX;
  }

  get y() {
    return this.realY;
  }

  set x(newVal) {
    if(playerCollisionCheck(clone(this.collisionBoxes).map(box => {
      box[0] += newVal;
      box[1] += this.realY;
      return box;
    }))){
      return newVal;
    }
    this.realX = newVal;
    return newVal;
  }

  set y(newVal) {
    if(playerCollisionCheck(clone(this.collisionBoxes).map(box => {
      box[0] += this.realX;
      box[1] += newVal;
      return box;
    }))){
      return newVal;
    }
    this.realY = newVal;
    return newVal;
  }
}

const bulletOnCoordChange = (bullet, isX, newVal) => {
  let mapped;
  if(isX){
    mapped = clone(bullet.collisionBoxes).map(box => {
      box[0] += newVal;
      box[1] += bullet.realY;
      return box;
    });
  }else{
    mapped = clone(bullet.collisionBoxes).map(box => {
      box[0] += bullet.realX;
      box[1] += newVal;
      return box;
    });
  }

  let joined = players.concat(blocks);

  const collision = playerCollisionCheck(mapped, joined);

  if(collision){
    if(collision instanceof Player){
      if(bullet.player !== collision){
        bullet.player.killStreak ++;
        collision.kill();
        bullet.remove();
        mainEmitter.emit("kill", {
          type: "kill",
          data: {
            killer: {
              id: bullet.player.id,
              killStreak: bullet.player.killStreak
            },
            victim: collision.username
          }
        });
        return newVal;
      }else{
        log("Bullet hit owner.");
      }
    }else{
      bullet.remove();
      return newVal;
    }
  }
  if(isX){
    bullet.realX = newVal;
  }else{
    bullet.realY = newVal;
  }
  return newVal;
};

class Bullet {
  constructor(x, y, direction, player){
    this.realX = x;
    this.realY = y;
    this.size = bulletSize;
    this.direction = direction;
    this.speed = bulletSpeed;
    this.fillColor = player.fillColor;
    this.collisionBoxes = [[-this.size / 2, -this.size / 2, this.size / 2, this.size / 2]];
    this.player = player;
  }
  draw(){
    if(this.player.isDead) return this.remove();

    if(this.x <= 0 || this.y <= 0 || this.x > (width * blockWidth) + 100  || this.y > (height * blockWidth) + 100){
      return this.remove();
    }

    switch(this.direction){
    case "up":
      this.y -= bulletSpeed;
      break;
    case "down":
      this.y += bulletSpeed;
      break;
    case "left":
      this.x -= bulletSpeed;
      break;
    case "right":
      this.x += bulletSpeed;
      break;
    default:
      throw this;
    }
  }

  remove(){
    log("remove");
    if(bullets.length === 1){
      bullets.pop();
    }else{
      bullets.splice(bullets.indexOf(this), 1);
    }
  }

  get x() {
    return this.realX;
  }

  get y() {
    return this.realY;
  }

  set x(newVal) {
    return bulletOnCoordChange(this, true, newVal);
  }

  set y(newVal) {
    return bulletOnCoordChange(this, false, newVal);
  }
}

const blocks = [];

const blockWidth = 20;

const map = require("fs").readFileSync(__dirname + "/maps/map1.txt").toString();

map.split("\n").forEach((line, lineNumber) => {
  line.split("").forEach((char, idx) => {
    if(char === "#"){
      log(idx, lineNumber);
      blocks.push(new Block(idx * blockWidth, lineNumber * blockWidth, blockWidth, blockWidth));
    }
  });
});

const players = [];

let isRunning = false;

/*
const drawBorder = (x, y, w, h) => {
  for(let i = 0; i < w; i++){
    blocks.push(new Block(x + i * blockWidth, y, blockWidth, blockWidth));
    blocks.push(new Block(x + i * blockWidth, y + (h - 1) * blockWidth, blockWidth, blockWidth));
  }
  for(let i = 0; i < h; i++){
    blocks.push(new Block(x, y + i * blockWidth, blockWidth, blockWidth));
    blocks.push(new Block(x + (w - 1) * blockWidth, y + i * blockWidth, blockWidth, blockWidth));
  }
};
const drawNoise = (x, y, w, h, density) => {
  for(let i = 0; i < w; i++){
    for(let i2 = 0; i2 < h; i2++){
      if(Math.random() < density){
        blocks.push(new Block(
          i * blockWidth + (x * blockWidth),
          i2 * blockWidth + (y * blockWidth),
          blockWidth,
          blockWidth
        ));
        players.forEach(player => {
          if(playerCollisionCheck(realCollisionBoxes(player))){
            blocks.pop();
          }
        });
      }
    }
  }
};
*/

// drawBorder(0, 0, width, height);
// drawNoise(1, 1, width - 2, height - 2, 0.1);

const bullets = [];


const _cache = {};
const getPlayerById = id => {
  if(_cache[id] && process.hrtime(_cache[id].time)[0] < 30){
    return _cache[id].player;
  }else{
    let foundPlayer;
    players.some(player => {
      if(player.id === id){
        foundPlayer = player;
        return true;
      }
    });
    _cache[id] = {
      player: foundPlayer,
      time: process.hrtime()
    };
    return foundPlayer;
  }
};

const draw = () => {
  if(isRunning){
    console.error("frame skipping");
  }
  isRunning = true;

  const promises = [];

  promises.push(new Promise(resolve =>
    setImmediate(() => {
      players.forEach(player => {
        if(keys[player.id]){
          Object.keys(keys[player.id]).forEach(key => {
            if(key && keys[player.id][key]) player.onKeyDown(key);
          });
        }
        player.draw();
      });
      resolve();
    })
  ));
  promises.push(new Promise(resolve =>
    setImmediate(() => {
      blocks.forEach(block => block.draw());
      resolve();
    })
  ));
  promises.push(new Promise(resolve =>
    setImmediate(() => {
      bullets.forEach(bullet => bullet.draw());
      resolve();
    })
  ));

  Promise.all(promises).then(() => {

    isRunning = false;

    mainEmitter.emit("tick");
  });
};

setInterval(draw, 1000 / 60);

module.exports = mainEmitter;

mainEmitter.on("ready", () => {
  setTimeout(() => {
    mainEmitter.emit("map", {
      blocks: blocks.reduce((acc, block) => acc.concat([[block.x, block.y, block.width, block.height]]), [])
    });
    mainEmitter.emit("players", players);
    mainEmitter.emit("bullets", bullets);
  }, 1);
});

mainEmitter.on("newUser", id => {
  let validLocation = false;
  while(!validLocation){
    const x = Math.round((Math.random() * (width - 2) + 1)) * blockWidth;
    const y = Math.round((Math.random() * (height - 2) + 1)) * blockWidth;
    const player = new Player(x, y, blockWidth, blockWidth, id);
    if(playerCollisionCheck(realCollisionBoxes(player))){
      validLocation = false;
    }else{
      validLocation = true;
      players.push(player);
    }
  }
  mainEmitter.emit("userAdded", players[players.length - 1]);
});

mainEmitter.on("removeUser", id => {
  const player = getPlayerById(id);
  if(player) player.kill();
});

const keys = {};

const getEmitterFunc = (isKeyDown) => {
  return data => {
    if(data.key.slice(0, 5) === "arrow"){
      getPlayerById(data.id).direction = data.key.slice(5);
      return;
    }

    const map = {
      w: "up",
      s: "down",
      a: "left",
      d: "right"
    };

    const key = map[data.key];
    try {
      if(!keys[data.id]){
        keys[data.id] = {};
      }
      keys[data.id][key] = isKeyDown;
    } catch (e) {
      console.error("could not get player.", e.message);
    }
  };
};

mainEmitter.on("keyDown", getEmitterFunc(true));

mainEmitter.on("keyUp", getEmitterFunc(false));

mainEmitter.on("keyPress", data => {
  if(data.key === "q"){
    const player = getPlayerById(data.id);
    if(player) player.shoot();
  }
});
