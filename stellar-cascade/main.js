const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const dpr = Math.min(window.devicePixelRatio || 1, 2);

const state = {
  count: 160,
  flow: 0.52,
  warp: 0.36,
  glow: true,
  trail: true,
  pulse: true,
  palette: 0,
};

const palettes = [
  ['#6ddcff', '#7f60f9', '#f7b2ff', '#9de1ff'],
  ['#ff9a8b', '#ff6a88', '#ff99ac', '#ffd1a9'],
  ['#7af5d3', '#5fd4ff', '#a3b9ff', '#71ffea'],
  ['#ffd479', '#ff9f6b', '#ff6f91', '#ffe0c7'],
];

let particles = [];
let ripples = [];
let width = 0;
let height = 0;
let center = { x: 0, y: 0 };
let pointer = { x: 0, y: 0, active: false };
let lastPaletteShift = 0;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  center = { x: width / 2, y: height / 2 };
}

function createParticle() {
  const radius = Math.random() * Math.min(width, height) * 0.35 + 40;
  const angle = Math.random() * Math.PI * 2;
  return {
    angle,
    radius,
    noise: Math.random() * Math.PI * 2,
    speed: 0.0008 + Math.random() * 0.0018,
    offset: Math.random() * 120 + 40,
  };
}

function rebuildParticles() {
  particles = new Array(Math.floor(state.count)).fill(0).map(createParticle);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function updateUI() {
  document.getElementById('count-value').textContent = state.count;
  document.getElementById('flow-value').textContent = state.flow.toFixed(2);
  document.getElementById('warp-value').textContent = state.warp.toFixed(2);
}

function drawRipple(ripple, time) {
  const progress = ripple.life / ripple.duration;
  const alpha = lerp(0.4, 0, progress);
  const radius = ripple.radius * (0.2 + progress * 1.6);
  ctx.beginPath();
  ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `${ripple.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
  ctx.lineWidth = lerp(2, 0.5, progress);
  ctx.stroke();
  ripple.life += time;
}

function addRipple(x, y) {
  const color = palettes[state.palette][Math.floor(Math.random() * palettes[state.palette].length)];
  ripples.push({
    x,
    y,
    radius: 80 + Math.random() * 90,
    life: 0,
    duration: 1200 + Math.random() * 800,
    color,
  });
}

function cyclePalette() {
  state.palette = (state.palette + 1) % palettes.length;
  document.querySelectorAll('.chip').forEach((chip, idx) => {
    chip.classList.toggle('active', idx === state.palette);
  });
}

function loop(now) {
  ctx.globalCompositeOperation = 'source-over';
  const fade = state.trail ? 0.12 : 0.2;
  ctx.fillStyle = `rgba(6, 10, 24, ${fade})`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = state.glow ? 'lighter' : 'source-over';

  const time = now * 0.0015;
  particles.forEach((p, i) => {
    const baseSpeed = p.speed + state.flow * 0.005;
    const warp = Math.sin(time * 0.8 + p.noise) * state.warp * 0.25;
    p.angle += baseSpeed + warp;
    p.radius += Math.sin(time + p.noise) * 0.4 * state.flow;

    const pulse = state.pulse ? 1 + Math.sin(time * 1.3 + p.noise) * 0.28 : 1;
    const wobble = Math.cos(time * 1.6 + i * 0.12) * (16 + state.warp * 18);

    let x = center.x + Math.cos(p.angle) * (p.radius * pulse) + Math.cos(p.angle * 2.2) * wobble;
    let y = center.y + Math.sin(p.angle) * (p.radius * pulse) + Math.sin(p.angle * 2.2) * wobble;

    if (pointer.active) {
      const dx = pointer.x - x;
      const dy = pointer.y - y;
      x += dx * 0.04;
      y += dy * 0.04;
    }

    const color = palettes[state.palette][i % palettes[state.palette].length];
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.65 + Math.sin(time + p.noise) * 0.2;
    ctx.arc(x, y, 2.4 + state.flow * 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ripples = ripples.filter((r) => {
    drawRipple(r, 16);
    return r.life < r.duration;
  });

  requestAnimationFrame(loop);
}

function bindUI() {
  const count = document.getElementById('count');
  const flow = document.getElementById('flow');
  const warp = document.getElementById('warp');
  const glow = document.getElementById('glow');
  const trail = document.getElementById('trail');
  const pulse = document.getElementById('pulse');

  count.addEventListener('input', (e) => {
    state.count = parseInt(e.target.value, 10);
    updateUI();
    rebuildParticles();
  });

  flow.addEventListener('input', (e) => {
    state.flow = parseFloat(e.target.value);
    updateUI();
  });

  warp.addEventListener('input', (e) => {
    state.warp = parseFloat(e.target.value);
    updateUI();
  });

  glow.addEventListener('change', (e) => (state.glow = e.target.checked));
  trail.addEventListener('change', (e) => (state.trail = e.target.checked));
  pulse.addEventListener('change', (e) => (state.pulse = e.target.checked));

  document.getElementById('burst').addEventListener('click', () => addRipple(center.x, center.y));

  document.querySelectorAll('.chip').forEach((chip, idx) => {
    chip.addEventListener('click', () => {
      state.palette = idx;
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

function bindPointer() {
  canvas.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  });

  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  canvas.addEventListener('click', (e) => {
    addRipple(e.clientX, e.clientY);
  });

  canvas.addEventListener('dblclick', () => {
    const now = performance.now();
    if (now - lastPaletteShift > 300) {
      cyclePalette();
      lastPaletteShift = now;
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      addRipple(pointer.x || center.x, pointer.y || center.y);
    }
  });
}

function init() {
  resize();
  rebuildParticles();
  bindUI();
  bindPointer();
  updateUI();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
init();
