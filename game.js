#!/usr/bin/env node

const EventEmitter = require("events");

class __MyEmitter extends EventEmitter {}

const mainEmitter = new __MyEmitter();

// const colors = ["red", "orange", "#f7ec4f", "green", "blue", "black", "purple"];



let speed = 5;

const width = 100;
const height = 100;
const bombSize = 5;
const bombSpeed = 20;
const maxShotCooldown = 375;// ms
const bombTime = 100;

const doLog = false;
const log = (...args) => {
  if(doLog){
    console.log(...args);// eslint-disable-line no-console
  }
};

const roundToTheNearest = (num, nearest) => Math.round(num / nearest) * nearest;

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
  destroy(){
    console.log("removing block");
    if(this.x === 0 || this.y === 0 || this.x === (width - 1) * blockWidth || this.y === (height - 1) * blockWidth){//on the edge of the map
      return false;
    }
    let index = blocks.indexOf(this);
    if (index > -1) {
      blocks.splice(index, 1);
      console.log("removed block");
    }
    mainEmitter.emit("removeBlock", [this.x, this.y]);
    return true;
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
    this.lastShot = Date.now();
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

  bomb(){
    if(Date.now() - this.lastShot < maxShotCooldown) return;
    this.lastShot = Date.now();
    log("bomb");
    bombs.push(new Bomb(roundToTheNearest(this.x, blockWidth), roundToTheNearest(this.y, blockWidth), this));
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

class Bomb {
  constructor(x, y, player){
    this.realX = x;
    this.realY = y;
    this.size = bombSize;
    this.speed = bombSpeed;
    this.fillColor = player.fillColor;
    this.collisionBoxes = [[-this.size / 2, -this.size / 2, this.size / 2, this.size / 2]];
    this.player = player;
    this.timeLeft = bombTime;
    this.explosionSize = 3;
  }
  draw(){
    this.timeLeft --;
    if(this.timeLeft === 0){
      console.log("EXPLODING");
      this.explode();
    }
    // if(this.player.isDead) return this.remove();

    if(this.x <= 0 || this.y <= 0 || this.x > (width * blockWidth) + 100  || this.y > (height * blockWidth) + 100){
      return this.remove();
    }
  }

  remove(){
    log("remove");
    if(bombs.length === 1){
      bombs.pop();
    }else{
      bombs.splice(bombs.indexOf(this), 1);
    }
  }

  get x() {
    return this.realX;
  }

  get y() {
    return this.realY;
  }

  set x(newVal) {
    return this.realX = newVal;
  }

  set y(newVal) {
    return this.realY = newVal;
  }

  explode(){
    const masks = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];

    let blocksDestroyed = [];
    masks.forEach(mask => {
      let startX = this.x;
      let startY = this.y;
      let tries = 0;

      let blockFound = false;
      while(!blockFound && tries < this.explosionSize){
        tries++;
        console.log("my coords are", startX, startY);
        const found = blocks.filter(block => {
            console.log(block.x, block.y);
            return block.x === startX && block.y === startY;
        });
        if(found && found.length){
          console.log("FOUND BLOWN BLOCKS", found.length);
          blockFound = true;
          blocksDestroyed.push(...found.map(block => [block.x, block.y]));
          found.forEach(block => block.destroy());
        }else{
          startX += mask[0] * blockWidth;
          startY += mask[1] * blockWidth;
        }
      }
    });
    console.log("destroyed", blocksDestroyed);
    mainEmitter.emit("explosion", {size: this.explosionSize, x: this.x, y: this.y, blocksDestroyed});
    this.remove();
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

const bombs = [];


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

  players.forEach(player => {
    if(keys[player.id]){
      Object.keys(keys[player.id]).forEach(key => {
        if(key && keys[player.id][key]) player.onKeyDown(key);
      });
    }
  });
  bombs.forEach(bomb => bomb.draw());

  isRunning = false;

  mainEmitter.emit("tick");
};

setInterval(draw, 1000 / 60);

module.exports = mainEmitter;

mainEmitter.on("ready", () => {
  setTimeout(() => {
    mainEmitter.emit("map", {
      blocks: blocks.reduce((acc, block) => acc.concat([[block.x, block.y, block.width, block.height]]), [])
    });
    mainEmitter.emit("players", players);
    mainEmitter.emit("bombs", bombs);
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

const arrowKeys = ["up", "down", "left", "right"];

const getEmitterFunc = (isKeyDown) => {
  return data => {
    if(arrowKeys.includes(data.key)){
      getPlayerById(data.id).direction = data.key;
      return;
    }

    const map = {
      w: "up",
      s: "down",
      a: "left",
      d: "right"
    };

    const key = map[data.key];
    if(!key) console.log(data.key, "not recognized");
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

mainEmitter.on("bomb", data => {
  const player = getPlayerById(data);
  if(player) player.bomb();
});
