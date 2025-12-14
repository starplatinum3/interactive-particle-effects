const canvas = document.getElementById("garden");
const ctx = canvas.getContext("2d");

const flowControl = document.getElementById("flow");
const countControl = document.getElementById("count");
const paletteBtn = document.getElementById("paletteBtn");
const trailsToggle = document.getElementById("trails");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const palettes = [
  ["#7ae7ff", "#8af0c0", "#ffd166", "#f38bff"],
  ["#9be5ff", "#7f9cff", "#c58aff", "#ffb6c8"],
  ["#5ef0ff", "#5ef1b4", "#b6ff7d", "#ffd4a7"],
];
let paletteIndex = 0;

let glowPoints = [];
let ripples = [];
let flowSpeed = Number(flowControl.value);
let trailEnabled = trailsToggle.checked;

const pointer = { x: width / 2, y: height / 2, active: false };

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

class Glow {
  constructor() {
    this.reset();
  }

  reset() {
    this.radius = random(60, Math.min(width, height) * 0.35);
    this.angle = random(0, Math.PI * 2);
    this.speed = random(0.006, 0.022);
    this.offset = random(0.5, 1.6);
    this.size = random(2.2, 4.4);
    this.hueShift = random(0, 0.8);
    this.color = palettes[paletteIndex][Math.floor(random(0, palettes[paletteIndex].length))];
  }

  update(delta) {
    this.angle += this.speed * (flowSpeed / 10) * (pointer.active ? 1.2 : 1);

    const breathing = Math.sin((Date.now() * 0.001 + this.offset) * 1.2) * 10;
    const swayX = Math.cos((Date.now() * 0.001 + this.offset) * 0.6) * 8;
    const swayY = Math.sin((Date.now() * 0.001 + this.offset) * 0.75) * 8;

    const baseX = width / 2 + Math.cos(this.angle) * (this.radius + breathing) + swayX;
    const baseY = height / 2 + Math.sin(this.angle) * (this.radius + breathing) + swayY;

    const attraction = pointer.active ? 0.08 : 0.02;
    this.x = baseX + (pointer.x - baseX) * attraction;
    this.y = baseY + (pointer.y - baseY) * attraction;
  }

  draw() {
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 16);
    gradient.addColorStop(0, `${this.color}dd`);
    gradient.addColorStop(1, `${this.color}00`);
    ctx.fillStyle = gradient;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 22;
    ctx.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.alpha = 0.45;
  }

  update(delta) {
    this.radius += delta * 0.3;
    this.alpha -= delta * 0.00035;
  }

  draw() {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
    ctx.lineWidth = 1.8;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function init(count) {
  glowPoints = Array.from({ length: count }, () => new Glow());
}

let lastTime = 0;
function animate(timestamp) {
  const delta = Math.min(32, timestamp - lastTime || 16);
  lastTime = timestamp;

  if (trailEnabled) {
    ctx.fillStyle = "rgba(10, 12, 26, 0.06)";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  const glowComposite = trailEnabled ? "lighter" : "screen";
  ctx.globalCompositeOperation = glowComposite;
  glowPoints.forEach((g) => {
    g.update(delta);
    g.draw();
  });

  ctx.globalCompositeOperation = "lighter";
  for (let i = ripples.length - 1; i >= 0; i -= 1) {
    const r = ripples[i];
    r.update(delta);
    r.draw();
    if (r.alpha <= 0) {
      ripples.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

canvas.addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
});

canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});

canvas.addEventListener("click", (e) => {
  ripples.push(new Ripple(e.clientX, e.clientY));
});

window.addEventListener("resize", resize);

flowControl.addEventListener("input", (e) => {
  flowSpeed = Number(e.target.value);
});

countControl.addEventListener("input", (e) => {
  init(Number(e.target.value));
});

paletteBtn.addEventListener("click", () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  glowPoints.forEach((g) => (g.color = palettes[paletteIndex][Math.floor(random(0, palettes[paletteIndex].length))]));
  paletteBtn.textContent = `切换色盘 · ${paletteIndex + 1}`;
});

trailsToggle.addEventListener("change", (e) => {
  trailEnabled = e.target.checked;
});

init(Number(countControl.value));
requestAnimationFrame(animate);
