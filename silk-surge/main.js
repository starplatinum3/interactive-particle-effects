const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const controls = {
  count: document.getElementById('count'),
  countVal: document.getElementById('countVal'),
  flow: document.getElementById('flow'),
  flowVal: document.getElementById('flowVal'),
  twist: document.getElementById('twist'),
  twistVal: document.getElementById('twistVal'),
  glow: document.getElementById('glow'),
  trail: document.getElementById('trail'),
  spark: document.getElementById('spark'),
  bloom: document.getElementById('bloom'),
  paletteChips: document.getElementById('paletteChips'),
};

let w = window.innerWidth;
let h = window.innerHeight;
let particles = [];
let ripples = [];
let sparkles = [];
let paletteIndex = 0;

const palettes = [
  ['#8de1ff', '#d9b4ff', '#f0f6ff', '#99ffe1'],
  ['#ffc6ff', '#8cc7ff', '#9ef1c9', '#fff7c5'],
  ['#9df2ff', '#fba0c2', '#8bb6ff', '#fcd380'],
  ['#8ef0d1', '#69a8ff', '#d6c4ff', '#ff9ed1'],
];

const pointer = { x: w / 2, y: h / 2, down: false };

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function createParticle() {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 1.5) * (Math.min(w, h) * 0.45) + 40;
  return {
    x: w / 2 + Math.cos(angle) * radius,
    y: h / 2 + Math.sin(angle) * radius,
    angle,
    radius,
    spin: rand(0.0018, 0.0032),
    drift: rand(-0.8, 0.8),
    wobble: Math.random() * Math.PI * 2,
    size: rand(1.2, 3.2),
    hueShift: Math.random(),
  };
}

function buildParticles() {
  particles = Array.from({ length: parseInt(controls.count.value, 10) }, createParticle);
}

function drawRipple(ripple) {
  const alpha = 1 - ripple.life / ripple.duration;
  const radius = ripple.life * ripple.speed;
  ctx.beginPath();
  ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,${0.22 * alpha})`;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ripple.life += 1;
}

function spawnRipple(x, y, strength = 1) {
  ripples.push({ x, y, life: 0, speed: rand(3.6, 7.2) * strength, duration: 120 });
}

function spawnSpark(x, y) {
  sparkles.push({
    x,
    y,
    life: 0,
    duration: rand(30, 70),
    size: rand(1, 2.4),
  });
}

function updateSparkles() {
  sparkles = sparkles.filter((s) => s.life < s.duration);
  sparkles.forEach((s) => {
    const alpha = 1 - s.life / s.duration;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * alpha})`;
    ctx.beginPath();
    ctx.arc(s.x + rand(-4, 4), s.y + rand(-4, 4), s.size, 0, Math.PI * 2);
    ctx.fill();
    s.life += 1;
  });
}

function updateParticles(time) {
  const flow = parseFloat(controls.flow.value);
  const twist = parseFloat(controls.twist.value);
  const glowOn = controls.glow.checked;
  const trailOn = controls.trail.checked;
  const sparkOn = controls.spark.checked;

  if (!trailOn) {
    ctx.clearRect(0, 0, w, h);
  } else {
    ctx.fillStyle = 'rgba(8, 10, 20, 0.08)';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowBlur = glowOn ? 16 : 0;
  ctx.shadowColor = 'rgba(255,255,255,0.45)';

  const palette = palettes[paletteIndex % palettes.length];
  const t = time * 0.0012;

  particles.forEach((p, i) => {
    p.angle += p.spin * flow + Math.sin(t + p.wobble) * 0.0008 * twist;
    const swirl = Math.sin(t * 0.8 + p.wobble * 2) * twist * 22;
    const band = 70 + (i % 60) * 0.8 + Math.sin(t * 0.6 + p.hueShift * Math.PI * 2) * 28;
    const tx = w / 2 + Math.cos(p.angle) * (p.radius + swirl) + Math.sin(t * 0.7 + p.wobble) * band * 0.12;
    const ty = h / 2 + Math.sin(p.angle) * (p.radius + swirl) + Math.cos(t * 0.9 + p.wobble) * band * 0.12;

    p.x += (tx - p.x) * 0.08 * flow + p.drift * 0.04;
    p.y += (ty - p.y) * 0.08 * flow + p.drift * 0.04;

    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 220) {
      const pull = (1 - dist / 220) * 0.6;
      p.x += (dx / dist) * pull * (flow + 0.3);
      p.y += (dy / dist) * pull * (flow + 0.3);
    }

    ripples.forEach((r) => {
      const rx = p.x - r.x;
      const ry = p.y - r.y;
      const rd = Math.hypot(rx, ry);
      if (rd < r.life * r.speed) {
        const force = (1 - rd / (r.life * r.speed + 0.001)) * 1.2;
        p.x += (rx / (rd || 1)) * force;
        p.y += (ry / (rd || 1)) * force;
      }
    });

    const color = palette[Math.floor(p.hueShift * palette.length) % palette.length];
    const pulse = 1 + Math.sin(t * 1.4 + p.hueShift * Math.PI * 2) * 0.28;
    const size = p.size * pulse;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();

    if (sparkOn && Math.random() < 0.006) {
      spawnSpark(p.x, p.y);
    }
  });

  ctx.restore();
}

function render(time) {
  ripples = ripples.filter((r) => r.life < r.duration);
  ripples.forEach(drawRipple);
  updateParticles(time);
  if (controls.spark.checked) {
    updateSparkles();
  }
}

function animate(time) {
  render(time);
  requestAnimationFrame(animate);
}

function setupPalette() {
  palettes.forEach((set, idx) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.background = `linear-gradient(135deg, ${set[0]}, ${set[1]})`;
    if (idx === paletteIndex) chip.classList.add('active');
    chip.addEventListener('click', () => {
      paletteIndex = idx;
      document.querySelectorAll('.chip').forEach((el) => el.classList.remove('active'));
      chip.classList.add('active');
    });
    controls.paletteChips.appendChild(chip);
  });
}

function cyclePalette() {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  document.querySelectorAll('.chip').forEach((el, i) => {
    el.classList.toggle('active', i === paletteIndex);
  });
}

function bindControls() {
  controls.count.addEventListener('input', () => {
    controls.countVal.textContent = controls.count.value;
    buildParticles();
  });
  controls.flow.addEventListener('input', () => {
    controls.flowVal.textContent = controls.flow.value;
  });
  controls.twist.addEventListener('input', () => {
    controls.twistVal.textContent = controls.twist.value;
  });

  controls.bloom.addEventListener('click', () => {
    spawnRipple(pointer.x, pointer.y, 1.4);
    for (let i = 0; i < 24; i += 1) {
      spawnSpark(pointer.x + rand(-40, 40), pointer.y + rand(-40, 40));
    }
  });
}

function bindInteractions() {
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });
  window.addEventListener('pointerdown', (e) => {
    pointer.down = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    spawnRipple(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', () => {
    pointer.down = false;
  });
  window.addEventListener('dblclick', cyclePalette);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      spawnRipple(pointer.x, pointer.y);
    }
  });
}

function init() {
  resize();
  setupPalette();
  buildParticles();
  bindControls();
  bindInteractions();
  requestAnimationFrame(animate);
}

init();
