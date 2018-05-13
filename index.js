#!/usr/bin/env node

const EventEmitter = require("events");

class __MyEmitter extends EventEmitter {}

const mainEmitter = new __MyEmitter();

let speed = 2.5;

const width = 100;
const height = 100;
const bulletSize = 5;
const bulletSpeed = 5;

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
          log("COLLISION");
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

class Player {
  constructor(x, y, width, height, color, id) {
    this.shotCooldown = 10;
    this.collisionBoxes = [[0, 0, width, height]];
    this.width = width;
    this.height = height;
    this.realX = x;
    this.realY = y;
    this.fillColor = color;
    this.id = id;
    this.direction = "up";
  }
  draw() {
    // TODO: add code?
  }
  kill(){
    // alert("RIP " + this.fillColor);
    if(players.length === 1){
      players.pop();
    }else{
      players.splice(players.indexOf(this), 1);
    }
  }

  // onkeydown should be called every tick for each key that is down.
  onKeyDown(key) {
    switch (key) {
    case "up":
      this.direction = "up";
      this.y-=speed;
      break;
    case "down":
      this.direction = "down";
      this.y+=speed;
      break;
    case "left":
      this.direction = "left";
      this.x-=speed;
      break;
    case "right":
      this.direction = "right";
      this.x+=speed;
      break;
    }
  }

  shoot(){
    log("shoot");
    bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, this.direction, this));
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

  let joined = [].concat(players/*.map((player, idx) => ({
    collisionBoxes: realCollisionBoxes(player),
    idx
  }))*/);
  joined = joined.concat(blocks);

  const collision = playerCollisionCheck(mapped, joined);

  if(collision){
    if(typeof collision.idx === "number"){
      // console.warn(players.indexOf(bullet.player), collision.idx);
      if(players.indexOf(bullet.player) !== collision.idx){
        players[collision.idx].kill();
        bullet.remove();
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
    this.collisionBoxes = [[-this.size / 2, -this.size / 2, this.size / 2, this.size / 2]];
    this.player = player;
  }
  draw(){
    if(this.x < -100 || this.y < -100 || this.x > (width * blockWidth) + 100  || this.y > (height * blockWidth) + 100){
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
const map = `
   #           ##
    #          #         #
    #          #         #
     #         #  #####  #
#              #      #  #
#              #      #  #
#              #####  #  #
#

   #####
   #####
   #####
   #####
   #####
`.slice(1, -1);

const blockWidth = 20;

map.split("\n").forEach((line, lineNumber) => {
  line.split("").forEach((char, idx) => {
    log(char);
    if(char === "##"){
      log(idx, lineNumber);
      blocks.push(new Block(idx * blockWidth, lineNumber * blockWidth, blockWidth, blockWidth));
    }
  });
});

const players = [];

let isRunning = false;

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
        blocks.push(new Block(i * blockWidth + (x * blockWidth), i2 * blockWidth + (y * blockWidth), blockWidth, blockWidth));
        players.forEach(player => {
          if(playerCollisionCheck(realCollisionBoxes(player))){
            blocks.pop();
          }
        });
      }
    }
  }
};

// for(var x = 0; x < width; x ++){
//   for(var y = 0; y < height; y ++){
//     if(playerCollisionCheck({
//       collisionBoxes: [[x * blockWidth, y * blockWidth, (x + 1) * blockWidth, (y + 1) * blockWidth]]
//     }, blocks)){
//
//     }
// }
// }

drawBorder(0, 0, width, height);
drawNoise(1, 1, width - 2, height - 2, 0.2);

const bullets = [];

onkeypress = e => {
  e.preventDefault();
  return false;
};

const draw = () => {
  if(isRunning){
    throw new Error("OOF");
  }
  isRunning = true;

  players.forEach(player => player.draw());
  blocks.forEach(block => block.draw());
  bullets.forEach(bullet => bullet.draw());

  isRunning = false;

  mainEmitter.emit("tick");
};

setInterval(draw, 1000 / 60);

module.exports = mainEmitter;

mainEmitter.on("ready", () => {
  console.log("ready");
  setTimeout(() => {
    console.log("emit");
    mainEmitter.emit("map", {
      blocks: blocks.reduce((acc, block) => acc.concat([[block.x, block.y, block.width, block.height]]), [])
    });
    mainEmitter.emit("players", players);
  }, 1);
});

mainEmitter.on("newUser", id => {
  console.log("new user", id);
  players.push(new Player(blockWidth, blockWidth, blockWidth, blockWidth, "red", id));
  console.log(players);
});
