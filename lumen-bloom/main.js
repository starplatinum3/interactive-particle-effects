const canvas = document.getElementById('bloom');
const ctx = canvas.getContext('2d');
const controls = {
  count: document.getElementById('count'),
  gravity: document.getElementById('gravity'),
  trail: document.getElementById('trail'),
  palette: document.getElementById('palette'),
  sparkle: document.getElementById('sparkle'),
};

const palettes = {
  sunrise: ['#ff9a6a', '#ffc46a', '#ffe9b3', '#ff8fb1'],
  ocean: ['#66e4ff', '#9fd6ff', '#5bd5ff', '#c0f2ff'],
  amethyst: ['#c09bff', '#9ec0ff', '#ffb3f5', '#d7d2ff'],
};

const state = {
  w: window.innerWidth,
  h: window.innerHeight,
  particles: [],
  mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false },
  palette: palettes[controls.palette.value],
  targetCount: Number(controls.count.value),
  trail: Number(controls.trail.value),
  gravity: Number(controls.gravity.value),
  sparkle: controls.sparkle.checked,
  time: 0,
};

canvas.width = state.w;
canvas.height = state.h;

class Particle {
  constructor(index) {
    this.reset(index);
  }

  reset(i) {
    const angle = (i / state.targetCount) * Math.PI * 2;
    const radius = Math.min(state.w, state.h) * 0.08 + Math.random() * 40;
    this.x = state.w / 2 + Math.cos(angle) * radius;
    this.y = state.h / 2 + Math.sin(angle) * radius;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.size = 1.5 + Math.random() * 2.5;
    this.halo = 0;
    this.color = state.palette[Math.floor(Math.random() * state.palette.length)];
    this.noiseSeed = Math.random() * 1000;
  }

  update(index) {
    const t = state.time * 0.006 + this.noiseSeed;
    const swirl = 0.35 + 0.25 * Math.sin(t * 1.2);
    const centerX = state.w / 2;
    const centerY = state.h / 2;

    // Polar swirl
    const dx = this.x - centerX;
    const dy = this.y - centerY;
    const dist = Math.max(12, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx) + swirl / dist * 24;

    this.vx += Math.cos(angle) * 0.16;
    this.vy += Math.sin(angle) * 0.16;

    // Mouse attraction
    if (state.mouse.active) {
      const mx = state.mouse.x - this.x;
      const my = state.mouse.y - this.y;
      const mDist = Math.hypot(mx, my) || 1;
      const pull = state.gravity / mDist;
      this.vx += mx * pull * 0.08;
      this.vy += my * pull * 0.08;
    }

    // Gentle return to center
    this.vx += (centerX - this.x) * 0.0004;
    this.vy += (centerY - this.y) * 0.0004;

    // Damping and motion
    this.vx *= 0.985;
    this.vy *= 0.985;
    this.x += this.vx;
    this.y += this.vy;

    // Soft bounds
    if (this.x < -100 || this.x > state.w + 100 || this.y < -100 || this.y > state.h + 100) {
      this.reset(index);
    }

    // Sparkle glow
    if (state.sparkle) {
      this.halo = Math.max(0, Math.sin(state.time * 0.02 + this.noiseSeed) * 0.8);
    } else {
      this.halo *= 0.92;
    }
  }

  draw() {
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5 + this.halo * 12);
    grad.addColorStop(0, this.color + 'cc');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3 + this.halo * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  state.particles = Array.from({ length: state.targetCount }, (_, i) => new Particle(i));
}

function resize() {
  state.w = window.innerWidth;
  state.h = window.innerHeight;
  canvas.width = state.w;
  canvas.height = state.h;
}

function burst(x, y) {
  for (let i = 0; i < 24; i++) {
    const p = state.particles[i % state.particles.length];
    const angle = (Math.PI * 2 * i) / 24;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * (2 + Math.random() * 1.8);
    p.vy = Math.sin(angle) * (2 + Math.random() * 1.8);
    p.halo = 1.4;
  }
}

function loop() {
  state.time += 1;
  ctx.fillStyle = `rgba(8, 10, 22, ${1 - state.trail / 60})`;
  ctx.fillRect(0, 0, state.w, state.h);

  state.particles.forEach((p, i) => {
    p.update(i);
    p.draw();
  });

  requestAnimationFrame(loop);
}

// UI wiring
controls.count.addEventListener('input', (e) => {
  state.targetCount = Number(e.target.value);
  initParticles();
});

controls.trail.addEventListener('input', (e) => {
  state.trail = Number(e.target.value);
});

controls.gravity.addEventListener('input', (e) => {
  state.gravity = Number(e.target.value);
});

controls.palette.addEventListener('change', (e) => {
  state.palette = palettes[e.target.value];
  state.particles.forEach((p) => (p.color = state.palette[Math.floor(Math.random() * state.palette.length)]));
});

controls.sparkle.addEventListener('change', (e) => {
  state.sparkle = e.target.checked;
});

canvas.addEventListener('pointermove', (e) => {
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
  state.mouse.active = true;
});

canvas.addEventListener('pointerleave', () => {
  state.mouse.active = false;
});

canvas.addEventListener('click', (e) => {
  burst(e.clientX, e.clientY);
});

window.addEventListener('resize', resize);

resize();
initParticles();
loop();

