const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const state = {
  count: 160,
  speed: 0.7,
  rippleSpan: 160,
  glow: true,
  trail: true,
  palette: 'tide',
};

const palettes = {
  tide: ['#7be2ff', '#8cf8d7', '#b5c7ff', '#6fc2ff', '#8be9ff'],
  neon: ['#ff9bd1', '#9ad4ff', '#ffe47d', '#a3ffb3', '#8ce7ff'],
  dusk: ['#ffb8a3', '#ffd28f', '#c5a1ff', '#87b6ff', '#f7b5ff'],
};

let particles = [];
let ripples = [];
let w = 0;
let h = 0;
let time = 0;

const pointer = { x: 0, y: 0, active: false };

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(randomPos = false) {
    this.x = randomPos ? Math.random() * w : w * 0.5 + (Math.random() - 0.5) * 80;
    this.y = randomPos ? Math.random() * h : h * 0.5 + (Math.random() - 0.5) * 80;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.35 + Math.random() * 0.6;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.scale = 0.6 + Math.random() * 0.9;
    this.hue = Math.floor(Math.random() * palettes[state.palette].length);
    this.orbit = 22 + Math.random() * 60;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.phase += dt * 0.8;
    const swirl = Math.sin(this.phase) * 0.35;
    this.vx += swirl * 0.02;
    this.vy += Math.cos(this.phase) * 0.02;

    if (pointer.active) {
      const dx = pointer.x - this.x;
      const dy = pointer.y - this.y;
      const dist = Math.hypot(dx, dy) + 0.001;
      const force = Math.min(1.6, 32 / dist);
      this.vx += (dx / dist) * force * 0.02;
      this.vy += (dy / dist) * force * 0.02;
    } else {
      const cx = w * 0.5 + Math.cos(time * 0.0004 + this.phase) * this.orbit;
      const cy = h * 0.5 + Math.sin(time * 0.0006 + this.phase) * this.orbit;
      const dx = cx - this.x;
      const dy = cy - this.y;
      this.vx += dx * 0.0004;
      this.vy += dy * 0.0004;
    }

    this.vx *= 0.99;
    this.vy *= 0.99;

    this.x += this.vx * state.speed * 1.2;
    this.y += this.vy * state.speed * 1.2;

    if (this.x < -50 || this.x > w + 50 || this.y < -50 || this.y > h + 50) {
      this.reset(true);
    }
  }

  draw() {
    const colors = palettes[state.palette];
    const color = colors[this.hue % colors.length];
    const size = 2.4 * this.scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = state.glow ? color : 'transparent';
    ctx.shadowBlur = state.glow ? 12 * this.scale : 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, size * 1.6, size, this.phase, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.alpha = 0.6;
    this.thickness = 2.2;
    this.color = palettes[state.palette][Math.floor(Math.random() * palettes[state.palette].length)];
  }

  update(dt) {
    this.radius += dt * state.rippleSpan * 0.35;
    this.alpha -= dt * 0.15;
    this.thickness += dt * 8;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color + Math.floor(this.alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = this.thickness;
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.shadowColor = state.glow ? this.color : 'transparent';
    ctx.shadowBlur = state.glow ? 16 : 0;
    ctx.stroke();
    ctx.restore();
  }
}

function initParticles() {
  particles = new Array(state.count).fill(0).map(() => new Particle());
}

initParticles();

function spawnRipple(x = w * 0.5, y = h * 0.5) {
  ripples.push(new Ripple(x, y));
}

window.addEventListener('mousemove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
});

window.addEventListener('mouseleave', () => {
  pointer.active = false;
});

window.addEventListener('click', (e) => {
  spawnRipple(e.clientX, e.clientY);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    spawnRipple(pointer.x || w * 0.5, pointer.y || h * 0.5);
  }
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt * 1000;

  if (state.trail) {
    ctx.fillStyle = 'rgba(5, 7, 16, 0.14)';
  } else {
    ctx.fillStyle = 'rgba(5, 7, 16, 0.36)';
  }
  ctx.fillRect(0, 0, w, h);

  ripples.forEach((r) => r.update(dt));
  ripples = ripples.filter((r) => r.alpha > 0);
  ripples.forEach((r) => r.draw());

  particles.forEach((p) => {
    p.update(dt);
    p.draw();
  });

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// UI bindings
const count = document.getElementById('count');
const speed = document.getElementById('speed');
const ripple = document.getElementById('ripple');
const countValue = document.getElementById('countValue');
const speedValue = document.getElementById('speedValue');
const rippleValue = document.getElementById('rippleValue');
const glow = document.getElementById('glow');
const trail = document.getElementById('trail');
const pulse = document.getElementById('pulse');
const chips = Array.from(document.querySelectorAll('.chip'));

count.addEventListener('input', (e) => {
  state.count = Number(e.target.value);
  countValue.textContent = state.count;
  initParticles();
});

speed.addEventListener('input', (e) => {
  state.speed = Number(e.target.value);
  speedValue.textContent = state.speed.toFixed(2);
});

ripple.addEventListener('input', (e) => {
  state.rippleSpan = Number(e.target.value);
  rippleValue.textContent = state.rippleSpan;
});

glow.addEventListener('change', (e) => {
  state.glow = e.target.checked;
});

trail.addEventListener('change', (e) => {
  state.trail = e.target.checked;
});

pulse.addEventListener('click', () => spawnRipple(pointer.x || w * 0.5, pointer.y || h * 0.5));

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.palette = chip.dataset.palette;
    particles.forEach((p) => (p.hue = Math.floor(Math.random() * palettes[state.palette].length)));
  });
});

spawnRipple(w * 0.5, h * 0.5);
spawnRipple(w * 0.5 + 60, h * 0.5 - 30);
