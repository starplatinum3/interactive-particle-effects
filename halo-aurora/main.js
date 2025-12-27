const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

const controls = {
  intensity: document.getElementById('intensity'),
  spread: document.getElementById('spread'),
  pulse: document.getElementById('pulse'),
  spin: document.getElementById('spin'),
  glow: document.getElementById('glow'),
  grain: document.getElementById('grain'),
  bloom: document.getElementById('bloom'),
  labels: {
    intensity: document.getElementById('intensityVal'),
    spread: document.getElementById('spreadVal'),
    pulse: document.getElementById('pulseVal'),
    spin: document.getElementById('spinVal'),
  },
};

const state = {
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false },
  ripples: [],
  grains: [],
  haloPhase: 0,
  config: {
    intensity: parseFloat(controls.intensity.value),
    spread: parseFloat(controls.spread.value),
    pulse: parseFloat(controls.pulse.value),
    spin: parseFloat(controls.spin.value),
    glow: controls.glow.checked,
    grain: controls.grain.checked,
  },
};

function resize() {
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resize);
resize();

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function addRipple(x, y, burst = false) {
  state.ripples.push({
    x,
    y,
    r: 8,
    alpha: burst ? 0.5 : 0.3,
    burst,
  });
}

function scatterGrain(x, y, count = 26) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.6;
    state.grains.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 0.9,
      size: Math.random() * 1.8 + 0.6,
      hue: Math.random() < 0.5 ? '#ffffff' : '#b8d8ff',
    });
  }
}

function bloom() {
  state.haloPhase += 0.6;
  addRipple(state.pointer.x, state.pointer.y, true);
  scatterGrain(state.pointer.x, state.pointer.y, 40);
}

function updateValues() {
  state.config.intensity = parseFloat(controls.intensity.value);
  state.config.spread = parseFloat(controls.spread.value);
  state.config.pulse = parseFloat(controls.pulse.value);
  state.config.spin = parseFloat(controls.spin.value);
  state.config.glow = controls.glow.checked;
  state.config.grain = controls.grain.checked;

  controls.labels.intensity.textContent = state.config.intensity.toFixed(2);
  controls.labels.spread.textContent = state.config.spread.toFixed(2);
  controls.labels.pulse.textContent = state.config.pulse.toFixed(1);
  controls.labels.spin.textContent = state.config.spin.toFixed(2);
}

['intensity', 'spread', 'pulse', 'spin'].forEach((key) => {
  controls[key].addEventListener('input', updateValues);
});
['glow', 'grain'].forEach((key) => {
  controls[key].addEventListener('change', updateValues);
});

controls.bloom.addEventListener('click', bloom);

window.addEventListener('pointermove', (e) => {
  state.pointer.x = e.clientX;
  state.pointer.y = e.clientY;
  state.pointer.active = true;
});
window.addEventListener('pointerleave', () => {
  state.pointer.active = false;
});
window.addEventListener('click', (e) => {
  addRipple(e.clientX, e.clientY, false);
  if (state.config.grain) scatterGrain(e.clientX, e.clientY, 24);
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    addRipple(state.pointer.x, state.pointer.y, true);
    if (state.config.grain) scatterGrain(state.pointer.x, state.pointer.y, 36);
  }
});

function drawHalo(time) {
  const { intensity, spread, pulse, spin, glow } = state.config;
  const cx = lerp(innerWidth / 2, state.pointer.x, state.pointer.active ? 0.14 : 0.02);
  const cy = lerp(innerHeight / 2, state.pointer.y, state.pointer.active ? 0.14 : 0.02);
  const baseRadius = Math.min(innerWidth, innerHeight) * 0.24;
  const radius = baseRadius * (1 + Math.sin(time * 0.8) * 0.04 * pulse);
  const thickness = 16 * intensity;

  // main halo gradient
  const grd = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius * (1.3 + spread * 0.08));
  grd.addColorStop(0, `rgba(255,255,255,${0.12 * intensity})`);
  grd.addColorStop(0.35, `rgba(255,220,180,${0.18 * intensity})`);
  grd.addColorStop(0.7, `rgba(150,200,255,${0.18 * intensity})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = glow ? 'lighter' : 'source-over';
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * (1.25 + spread * 0.05), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // white arcs
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(255,255,255,${0.85 * intensity})`;
  ctx.lineWidth = thickness;
  const offset = state.haloPhase + time * spin;
  const arc1Start = offset + Math.PI * -0.15;
  const arc1End = offset + Math.PI * 0.35;
  const arc2Start = offset + Math.PI * 0.55;
  const arc2End = offset + Math.PI * 1.05;
  [ [arc1Start, arc1End], [arc2Start, arc2End] ].forEach(([s, e]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, s, e);
    ctx.stroke();
  });
  ctx.restore();
}

function step() {
  const time = performance.now() * 0.001;
  ctx.fillStyle = 'rgba(5,7,15,0.22)';
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  drawHalo(time);

  // ripples
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    r.r += r.burst ? 7 : 5;
    r.alpha *= 0.962;
    if (r.alpha < 0.015) {
      state.ripples.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,255,255,${r.alpha})`;
    ctx.lineWidth = r.burst ? 2.5 : 1.6;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // grains
  if (state.config.grain && Math.random() < 0.08) {
    scatterGrain(Math.random() * innerWidth, Math.random() * innerHeight, 6);
  }

  for (let i = state.grains.length - 1; i >= 0; i--) {
    const g = state.grains[i];
    g.x += g.vx;
    g.y += g.vy;
    g.alpha *= 0.96;
    g.vx *= 0.98;
    g.vy *= 0.98;
    if (g.alpha < 0.02) {
      state.grains.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g.hue;
    ctx.globalAlpha = g.alpha;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(step);
}

updateValues();
step();
