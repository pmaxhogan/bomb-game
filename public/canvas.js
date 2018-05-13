const game = (map) => {//eslint-disable-line no-unused-vars
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  const setSize = () => {
    canvas.setAttribute("width", innerWidth.toString());
    canvas.setAttribute("height", innerHeight.toString());
  };
  onresize = setSize;
  setSize();

  const draw = function(){
    map.blocks.forEach(block => {
      ctx.fillRect(block[0], block[1], block[2], block[3]);
    });
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
