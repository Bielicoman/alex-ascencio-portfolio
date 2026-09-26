// A small displacement texture bends the live backdrop in an expanding ring.
// Its size is independent of screen DPR; the browser interpolates the map.
export function createWarpWave(image, x, y, width, height) {
  const filter = image.parentElement;
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("x", "-100"); filter.setAttribute("y", "-100");
  filter.setAttribute("width", String(width+200)); filter.setAttribute("height", String(height+200));
  image.setAttribute("width", String(width)); image.setAttribute("height", String(height));
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = Math.max(64, Math.round(160 * height / width));
  const ctx = canvas.getContext("2d"), frame = ctx.createImageData(canvas.width, canvas.height);
  const reach = Math.max(Math.hypot(x,y),Math.hypot(width-x,y),Math.hypot(x,height-y),Math.hypot(width-x,height-y));
  const points = [];
  for (let j=0;j<canvas.height;j++) for (let i=0;i<canvas.width;i++) {
    const dx=i/canvas.width*width-x,dy=j/canvas.height*height-y,d=Math.hypot(dx,dy);
    points.push([d,dx/(d||1),dy/(d||1)]);
  }
  let last=-1;
  return progress => {
    const step=Math.round(progress*40);
    if(step===last)return;
    last=step;
    const radius=progress*reach*1.15, band=Math.max(65,Math.min(width,height)*.18);
    for(let i=0;i<points.length;i++) {
      const [d,nx,ny]=points[i], phase=(d-radius)/band;
      const wave=Math.sin(phase*Math.PI*2)*Math.exp(-phase*phase*2);
      const k=i*4;
      frame.data[k]=128+wave*nx*124; frame.data[k+1]=128+wave*ny*124;
      frame.data[k+2]=128;frame.data[k+3]=255;
    }
    ctx.putImageData(frame,0,0);
    image.setAttribute("href",canvas.toDataURL());
  };
}
