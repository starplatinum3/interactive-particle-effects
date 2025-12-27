const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const controls = {
  count: document.getElementById('count'),
  countLabel: document.getElementById('countLabel'),
  drift: document.getElementById('drift'),
  driftLabel: document.getElementById('driftLabel'),
  bloom: document.getElementById('bloom'),
  bloomLabel: document.getElementById('bloomLabel'),
  turbulence: document.getElementById('turbulence'),
  turbulenceLabel: document.getElementById('turbulenceLabel'),
  paletteGroup: document.getElementById('paletteGroup'),
  glow: document.getElementById('glow'),
  trails: document.getElementById('trails'),
  pulse: document.getElementById('pulse'),
};

const palettes = {
  mist: ['#9fe7ff', '#b8f3ff', '#e8fffb', '#c7d4ff', '#7cefd1'],
  dusk: ['#ff9fb5', '#ffd1ff', '#a6a6ff', '#7cd1ff', '#fff1c1'],
  coral: ['#ffb787', '#ff7e9e', '#ffc28b', '#ffd8c2', '#ffedd6'],
};

let activePalette = palettes.mist;
let petals = [];
const ripples = [];
let width = 0;
let height = 0;
const pointer = { x: 0, y: 0, active: false };
let time = 0;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnPetal() {
  const angle = Math.random() * Math.PI * 2;
  const radius = rand(40, Math.min(width, height) * 0.55);
  const x = width / 2 + Math.cos(angle) * radius;
  const y = height / 2 + Math.sin(angle) * radius;
  const size = rand(1, 4);
  petals.push({
    x,
    y,
    vx: rand(-0.3, 0.3),
    vy: rand(-0.3, 0.3),
    hue: activePalette[Math.floor(Math.random() * activePalette.length)],
    size,
    seed: rand(0.5, 4),
    drift: rand(0.6, 1.4),
  });
}

function initPetals() {
  petals = [];
  const target = Number(controls.count.value);
  for (let i = 0; i < target; i += 1) {
    spawnPetal();
  }
}

function updateLabels() {
  controls.countLabel.textContent = controls.count.value;
  controls.driftLabel.textContent = Number(controls.drift.value).toFixed(2);
  controls.bloomLabel.textContent = Number(controls.bloom.value).toFixed(1);
  controls.turbulenceLabel.textContent = Number(controls.turbulence.value).toFixed(2);
}

function createRipple(x, y) {
  ripples.push({
    x,
    y,
    radius: 0,
    alpha: 0.5,
    hue: activePalette[Math.floor(Math.random() * activePalette.length)],
  });
}

function handlePointer(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = e.clientX - rect.left;
  pointer.y = e.clientY - rect.top;
  pointer.active = true;
}

function clearScene() {
  const alpha = controls.trails.checked ? 0.12 : 0.4;
  ctx.fillStyle = `rgba(5, 6, 12, ${alpha})`;
  ctx.fillRect(0, 0, width, height);
}

function drawPetal(petal) {
  const bloom = Number(controls.bloom.value);
  const glowOn = controls.glow.checked;
  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(Math.atan2(petal.vy, petal.vx) + Math.PI / 2);
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = petal.hue;
  if (glowOn) {
    ctx.shadowColor = petal.hue;
    ctx.shadowBlur = 16 * bloom;
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, petal.size * bloom * 0.8, petal.size * bloom * 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function updatePetal(petal, dt) {
  const drift = Number(controls.drift.value);
  const turbulence = Number(controls.turbulence.value);
  const pulseOn = controls.pulse.checked;
  const flow = Math.sin((petal.x + petal.seed * 100) * 0.002 + time * 0.6) * 0.6;
  const swirl = Math.cos((petal.y + petal.seed * 80) * 0.0025 + time * 0.7) * 0.6;
  const attraction = pointer.active ? 0.7 : 0.2;
  const dx = pointer.x - petal.x;
  const dy = pointer.y - petal.y;
  const dist = Math.hypot(dx, dy) || 1;
  const pull = Math.min(120 / dist, 0.8) * attraction;

  petal.vx += (flow + swirl * 0.6) * turbulence * 0.08;
  petal.vy += (swirl - flow * 0.6) * turbulence * 0.08;

  petal.vx += (dx / dist) * pull * 0.5;
  petal.vy += (dy / dist) * pull * 0.5;

  petal.vx *= 0.98;
  petal.vy *= 0.98;

  petal.x += petal.vx * (1 + drift * 0.4) * dt;
  petal.y += petal.vy * (1 + drift * 0.4) * dt;

  if (pulseOn) {
    const beat = Math.sin(time * 1.5 + petal.seed * 3) * 0.5 + 0.5;
    petal.size = 1 + beat * 2.4;
  }

  if (petal.x < -40) petal.x = width + 40;
  if (petal.x > width + 40) petal.x = -40;
  if (petal.y < -40) petal.y = height + 40;
  if (petal.y > height + 40) petal.y = -40;
}

function drawRipples(dt) {
  for (let i = ripples.length - 1; i >= 0; i -= 1) {
    const ripple = ripples[i];
    ripple.radius += dt * 140;
    ripple.alpha *= 0.98;
    if (ripple.alpha <= 0.01) {
      ripples.splice(i, 1);
      continue;
    }
    const grd = ctx.createRadialGradient(ripple.x, ripple.y, ripple.radius * 0.4, ripple.x, ripple.y, ripple.radius);
    grd.addColorStop(0, `${ripple.hue}22`);
    grd.addColorStop(1, `${ripple.hue}00`);
    ctx.beginPath();
    ctx.fillStyle = grd;
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 16.67, 2);
  last = now;
  time = now / 1000;

  clearScene();
  drawRipples(dt);

  const target = Number(controls.count.value);
  if (petals.length < target) {
    for (let i = petals.length; i < target; i += 1) spawnPetal();
  } else if (petals.length > target) {
    petals.length = target;
  }

  petals.forEach((p) => {
    updatePetal(p, dt);
    drawPetal(p);
  });

  requestAnimationFrame(loop);
}

function bindUI() {
  controls.count.addEventListener('input', () => {
    updateLabels();
    const target = Number(controls.count.value);
    if (petals.length > target) {
      petals.length = target;
    } else {
      const diff = target - petals.length;
      for (let i = 0; i < diff; i += 1) spawnPetal();
    }
  });

  ['drift', 'bloom', 'turbulence'].forEach((key) => {
    controls[key].addEventListener('input', updateLabels);
  });

  controls.paletteGroup.addEventListener('click', (e) => {
    if (e.target.matches('.chip')) {
      controls.paletteGroup.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('chip--active'));
      e.target.classList.add('chip--active');
      const palette = e.target.dataset.palette;
      activePalette = palettes[palette] || palettes.mist;
      petals.forEach((p) => {
        p.hue = activePalette[Math.floor(Math.random() * activePalette.length)];
      });
    }
  });

  window.addEventListener('pointermove', handlePointer);
  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  window.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    createRipple(x, y);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      createRipple(pointer.x || width / 2, pointer.y || height / 2);
    }
  });
}

resize();
updateLabels();
initPetals();
bindUI();
requestAnimationFrame(loop);

window.addEventListener('resize', resize);
