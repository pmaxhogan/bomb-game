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
