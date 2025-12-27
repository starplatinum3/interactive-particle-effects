const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const controls = {
  count: document.getElementById('count'),
  countVal: document.getElementById('countVal'),
  flow: document.getElementById('flow'),
  flowVal: document.getElementById('flowVal'),
  warp: document.getElementById('warp'),
  warpVal: document.getElementById('warpVal'),
  glow: document.getElementById('glow'),
  trail: document.getElementById('trail'),
  pulse: document.getElementById('pulse'),
  flash: document.getElementById('flash'),
  paletteChips: document.getElementById('paletteChips'),
};

let w = window.innerWidth;
let h = window.innerHeight;
let particles = [];
let ripples = [];
let paletteIndex = 0;
let lastFlash = 0;

const palettes = [
  ['#8ed0ff', '#d4b4ff', '#f7c39a', '#9cf5e5'],
  ['#7ff5d4', '#4ec0ff', '#6f8bff', '#ffc6ff'],
  ['#ffe08a', '#ff9bb5', '#b7a4ff', '#8ef1ff'],
  ['#b8ffde', '#6bd6ff', '#f2a1ff', '#ffc48f'],
];

const pointer = { x: w / 2, y: h / 2, down: false };

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * devicePixelRatio;
  canvas.height = h * devicePixelRatio;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createParticle() {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 1.4) * (Math.min(w, h) * 0.45);
  return {
    x: w / 2 + Math.cos(angle) * radius,
    y: h / 2 + Math.sin(angle) * radius,
    baseAngle: angle,
    speed: randRange(0.4, 1.2),
    wobble: randRange(0.4, 1.4),
    size: randRange(1.2, 3),
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
  ctx.strokeStyle = `rgba(255,255,255,${0.25 * alpha})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ripple.life += 1;
}

function updateParticles(time) {
  const flow = parseFloat(controls.flow.value);
  const warp = parseFloat(controls.warp.value);
  const glowOn = controls.glow.checked;
  const trailOn = controls.trail.checked;
  const pulseOn = controls.pulse.checked;

  if (!trailOn) {
    ctx.clearRect(0, 0, w, h);
  } else {
    ctx.fillStyle = 'rgba(5,7,18,0.08)';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.save();
  if (glowOn) {
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
  } else {
    ctx.shadowBlur = 0;
  }

  const palette = palettes[paletteIndex % palettes.length];
  const timeFactor = time * 0.0008;

  particles.forEach((p, i) => {
    const theta = p.baseAngle + Math.sin(timeFactor + p.wobble) * warp;
    const radius = 90 + (i % 70) * 0.6 + Math.sin(timeFactor * 1.2 + p.wobble) * 30;
    const tx = w / 2 + Math.cos(theta) * radius;
    const ty = h / 2 + Math.sin(theta) * radius;

    p.x += (tx - p.x) * 0.02 * flow;
    p.y += (ty - p.y) * 0.02 * flow;

    // pointer attraction
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 240) {
      const pull = (1 - dist / 240) * 0.6;
      p.x += dx / dist * pull * (flow + 0.4);
      p.y += dy / dist * pull * (flow + 0.4);
    }

    // ripple push
    ripples.forEach((r) => {
      const rx = p.x - r.x;
      const ry = p.y - r.y;
      const rd = Math.hypot(rx, ry);
      if (rd < r.life * r.speed) {
        const strength = (1 - rd / (r.life * r.speed + 0.01)) * 1.4;
        p.x += rx / (rd || 1) * strength;
        p.y += ry / (rd || 1) * strength;
      }
    });

    const pulse = pulseOn ? 1 + Math.sin(time * 0.002 + p.hueShift * Math.PI * 2) * 0.3 : 1;
    const size = p.size * pulse;
    const color = palette[Math.floor(p.hueShift * palette.length) % palette.length];
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function render(time) {
  ripples = ripples.filter((r) => r.life < r.duration);
  ripples.forEach(drawRipple);
  updateParticles(time);
}

function spawnRipple(x, y) {
  ripples.push({ x, y, life: 0, speed: randRange(4, 7), duration: 100 });
}

function randomFlash() {
  lastFlash = performance.now();
}

function handleFlash(time) {
  if (time - lastFlash < 180) {
    ctx.save();
    const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.max(w, h) * 0.6);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(5,7,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function animate(time) {
  render(time);
  handleFlash(time);
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

function bindControls() {
  controls.count.addEventListener('input', () => {
    controls.countVal.textContent = controls.count.value;
    buildParticles();
  });
  controls.flow.addEventListener('input', () => {
    controls.flowVal.textContent = controls.flow.value;
  });
  controls.warp.addEventListener('input', () => {
    controls.warpVal.textContent = controls.warp.value;
  });
  document.addEventListener('mousemove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });
  canvas.addEventListener('click', (e) => {
    spawnRipple(e.clientX, e.clientY);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      spawnRipple(pointer.x, pointer.y);
    }
  });
  document.addEventListener('dblclick', () => {
    paletteIndex = (paletteIndex + 1) % palettes.length;
    document.querySelectorAll('.chip').forEach((c, idx) => c.classList.toggle('active', idx === paletteIndex));
  });
  controls.flash.addEventListener('click', () => randomFlash());
}

function init() {
  resize();
  setupPalette();
  bindControls();
  buildParticles();
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  resize();
});

init();
