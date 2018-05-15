/* global players: false, myId: false */

const translateCanvas = (x, y, width, height, canvasWidth, canvasHeight, ctx) => {
  const xToTranslate = Math.round(-(x + (width / 2) - (canvasWidth / 2)));
  const yToTranslate = Math.round(-(y + (height / 2) - (canvasHeight / 2)));
  console.log(xToTranslate, yToTranslate);
  ctx.translate(xToTranslate, yToTranslate);
};

const game = (map) => {//eslint-disable-line no-unused-vars
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  const setSize = () => {
    canvas.setAttribute("width", innerWidth.toString());
    canvas.setAttribute("height", innerHeight.toString());
  };
  onresize = setSize;
  setSize();

  let player = players.filter(player => player.id === myId)[0];

  const draw = function(){
    if(!player){
      console.log("none");
      player = players.filter(player => player.id === myId)[0];
    }else{
      ctx.save();
      translateCanvas(player.x, player.y, player.width, player.width, innerWidth, innerHeight, ctx);
      map.blocks.forEach(block => {
        ctx.fillStyle = "black";
        ctx.fillRect(block[0], block[1], block[2], block[3]);
      });
      players.forEach(player => {
        ctx.fillStyle = player.fillColor;
        ctx.fillRect(player.x, player.y, player.width, player.height);
      });

      ctx.restore();
    }

    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
};

/*const drawBullet = (ctx, x, y, radius) => {
  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  console.log(x, this.y);
  ctx.fill();
};

const translateCanvas = (ctx, x, y, width, height) => {
  ctx.translate(Math.round(-(x + (width / 2) - (ctx.canvas.offsetWidth / 2))), Math.round(-(y + (height / 2) - (ctx.canvas.offsetHeight / 2))));
};
*/
