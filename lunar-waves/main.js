const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const palettes = [
  ['#b5f1ff', '#a7b8ff', '#ffd3fb', '#80f8ff'],
  ['#a7ffe4', '#b5d8ff', '#e7d5ff', '#7effd1'],
  ['#72d7ff', '#6e9fff', '#bfa8ff', '#9df3ff']
];

let particles = [];
let ripples = [];
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
let settings = {
  count: 620,
  flow: 0.9,
  warp: 0.55,
  glow: true,
  trails: true,
  paletteIndex: 0
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function createParticles() {
  particles = Array.from({ length: settings.count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * Math.min(canvas.width, canvas.height) * 0.55;
    const cx = canvas.width / 2 + Math.cos(angle) * radius * 0.4;
    const cy = canvas.height / 2 + Math.sin(angle) * radius * 0.35;

    return {
      x: cx,
      y: cy,
      ox: cx,
      oy: cy,
      speed: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      amp: 8 + Math.random() * 22,
      trail: 0,
      color: palettes[settings.paletteIndex][Math.floor(Math.random() * palettes[settings.paletteIndex].length)]
    };
  });
}

createParticles();

function spawnRipple(x, y) {
  ripples.push({ x, y, r: 0, strength: 1 });
}

canvas.addEventListener('pointermove', (e) => {
  pointer = { x: e.clientX, y: e.clientY, active: true };
});

canvas.addEventListener('pointerleave', () => {
  pointer.active = false;
});

canvas.addEventListener('click', (e) => {
  spawnRipple(e.clientX, e.clientY);
});

canvas.addEventListener('dblclick', () => {
  settings.paletteIndex = (settings.paletteIndex + 1) % palettes.length;
  updateChips();
  createParticles();
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    spawnRipple(pointer.x, pointer.y);
  }
});

function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

let lastTime = 0;

function draw(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.06);
  lastTime = now;

  const fade = settings.trails ? 0.1 : 0.32;
  ctx.fillStyle = `rgba(3,6,22,${fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (settings.glow) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(160, 220, 255, 0.35)';
  } else {
    ctx.shadowBlur = 0;
  }

  ripples = ripples.filter((r) => r.strength > 0.02);
  ripples.forEach((ripple) => {
    ripple.r += 220 * dt;
    ripple.strength *= 0.92;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(140, 215, 255, ${ripple.strength * 0.35})`;
    ctx.lineWidth = 2;
    ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  for (const p of particles) {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const attract = pointer.active ? Math.min(12000 / (dist * dist), 0.25) : 0;

    const flow = Math.sin((p.phase + now * 0.0006 * settings.flow) + p.y * 0.01) * p.amp * settings.warp;
    const swirl = Math.cos((p.phase + now * 0.0008 * settings.flow) + p.x * 0.007) * p.amp * 0.6 * settings.warp;

    p.ox = p.x;
    p.oy = p.y;

    p.x += flow + swirl + dx * attract * dt * 60;
    p.y += Math.cos(p.phase + now * 0.0004 * settings.flow) * p.speed + dy * attract * dt * 60;

    const rippleInfluence = ripples.reduce((acc, r) => {
      const d = Math.hypot(p.x - r.x, p.y - r.y);
      if (d < r.r + 40) {
        const force = easeOutExpo(Math.max(0, 1 - d / (r.r + 40))) * r.strength;
        return acc + force * 1.2;
      }
      return acc;
    }, 0);

    p.x += Math.cos(p.phase) * rippleInfluence * 8;
    p.y += Math.sin(p.phase) * rippleInfluence * 8;

    // wrap around edges softly
    if (p.x < -50) p.x = canvas.width + 50;
    if (p.x > canvas.width + 50) p.x = -50;
    if (p.y < -50) p.y = canvas.height + 50;
    if (p.y > canvas.height + 50) p.y = -50;

    const alpha = 0.4 + Math.sin(now * 0.002 + p.phase) * 0.25;
    ctx.strokeStyle = `${hexToRgba(p.color, alpha)}`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(p.ox, p.oy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

function hexToRgba(hex, alpha) {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

requestAnimationFrame(draw);

// UI wiring
const countInput = document.getElementById('count');
const flowInput = document.getElementById('flow');
const warpInput = document.getElementById('warp');
const glowInput = document.getElementById('glow');
const trailsInput = document.getElementById('trails');
const chips = Array.from(document.querySelectorAll('.chip'));

countInput.addEventListener('input', () => {
  settings.count = Number(countInput.value);
  document.getElementById('count-label').textContent = settings.count;
  createParticles();
});

flowInput.addEventListener('input', () => {
  settings.flow = Number(flowInput.value);
  document.getElementById('flow-label').textContent = `${settings.flow.toFixed(1)}x`;
});

warpInput.addEventListener('input', () => {
  settings.warp = Number(warpInput.value);
  document.getElementById('warp-label').textContent = settings.warp.toFixed(2);
});

glowInput.addEventListener('change', () => {
  settings.glow = glowInput.checked;
});

trailsInput.addEventListener('change', () => {
  settings.trails = trailsInput.checked;
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    settings.paletteIndex = Number(chip.dataset.index);
    updateChips();
    createParticles();
  });
});

function updateChips() {
  chips.forEach((chip) => {
    chip.classList.toggle('active', Number(chip.dataset.index) === settings.paletteIndex);
  });
}

updateChips();
