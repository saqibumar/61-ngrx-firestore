const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d", { alpha: true });
let width, height, dpr;
function resize(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth = window.innerWidth;
  height = canvas.clientHeight = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize", resize);
resize();

// Particle system with flow fields
const particles = [];
const MAX = 260;
const palette = ["#67e8f9","#a78bfa","#ff6584","#34d399","#fbbf24"]; 
function rand(a,b){return Math.random()*(b-a)+a}
for(let i=0;i<MAX;i++){
  particles.push({
    x: rand(0,width),
    y: rand(0,height),
    vx: 0, vy: 0,
    size: rand(1,3.2),
    hue: palette[(Math.random()*palette.length)|0],
    life: rand(40,200)
  })
}
let tick=0, mouse={x:width/2,y:height/2,down:false};
window.addEventListener("mousemove", e=>{mouse.x=e.clientX;mouse.y=e.clientY});
window.addEventListener("mousedown", ()=>{mouse.down=true});
window.addEventListener("mouseup", ()=>{mouse.down=false});
window.addEventListener("click", burst);

function burst(x=mouse.x,y=mouse.y){
  for(let i=0;i<80;i++){
    particles.push({x,y,vx:rand(-4,4),vy:rand(-4,4),size:rand(1,3),hue:palette[(Math.random()*palette.length)|0],life:rand(40,120)});
  }
  while(particles.length>MAX*2) particles.shift();
}

function fieldForce(x,y,t){
  const s = 0.0009;
  const n = Math.sin(x*s+t*0.015)+Math.cos(y*s*1.3-t*0.01);
  return n*2.2; // angle
}

function step(){
  tick++;
  ctx.clearRect(0,0,width,height);
  ctx.globalCompositeOperation = "lighter";
  for(let p of particles){
    const ang = fieldForce(p.x,p.y,tick);
    p.vx += Math.cos(ang)*0.12;
    p.vy += Math.sin(ang)*0.12;

    const dx = mouse.x-p.x, dy = mouse.y-p.y;
    const dist = Math.hypot(dx,dy)+0.0001;
    const pull = mouse.down ? 0.35 : 0.08;
    p.vx += dx/dist*pull;
    p.vy += dy/dist*pull;

    p.vx *= 0.94; p.vy *= 0.94;
    p.x += p.vx; p.y += p.vy;

    if(p.x<0||p.x>width||p.y<0||p.y>height){ p.x=rand(0,width); p.y=rand(0,height);}    

    ctx.beginPath();
    ctx.fillStyle = p.hue;
    ctx.globalAlpha = 0.08;
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(p.x,p.y,0.8,0.8);
  }
  requestAnimationFrame(step);
}
step();

// Tilt + glare on card
const card = document.getElementById("card");
const avatar = document.getElementById("avatar");
const fileInput = document.getElementById("file");
const shuffle = document.getElementById("shuffle");

function setTilt(e){
  const rect = card.getBoundingClientRect();
  const px = (e.clientX-rect.left)/rect.width - .5;
  const py = (e.clientY-rect.top)/rect.height - .5;
  const tiltX = py * -10;
  const tiltY = px * 10;
  card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  card.dataset.tilt = "1";
  card.style.setProperty("--angle", `${(px+0.5)*1}turn`);
}
function resetTilt(){ card.style.transform = "perspective(800px)"; card.removeAttribute("data-tilt"); }
card.addEventListener("mousemove", setTilt);
card.addEventListener("mouseleave", resetTilt);

// Upload avatar/photo
fileInput.addEventListener("change", e=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  avatar.src = url;
});
card.addEventListener("dragover", e=>{e.preventDefault(); card.classList.add("dragging")});
card.addEventListener("dragleave", ()=>card.classList.remove("dragging"));
card.addEventListener("drop", e=>{
  e.preventDefault(); card.classList.remove("dragging");
  const file = e.dataTransfer?.files?.[0];
  if(file){ avatar.src = URL.createObjectURL(file);} });

document.querySelector(".upload").addEventListener("click", ()=> fileInput.click());

// Shuffle palette
shuffle.addEventListener("click", ()=>{
  palette.sort(()=>Math.random()-.5);
  burst(width*Math.random(), height*Math.random());
});
