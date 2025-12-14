const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

const controls = {
  count: document.getElementById('count'),
  flow: document.getElementById('flow'),
  sway: document.getElementById('sway'),
  pulse: document.getElementById('pulse'),
  glow: document.getElementById('glow'),
  trail: document.getElementById('trail'),
  shimmer: document.getElementById('shimmer'),
  flare: document.getElementById('flare'),
  paletteChips: document.getElementById('paletteChips'),
  labels: {
    count: document.getElementById('countVal'),
    flow: document.getElementById('flowVal'),
    sway: document.getElementById('swayVal'),
    pulse: document.getElementById('pulseVal'),
  },
};

const palettes = [
  ['#6de6ff', '#a0b5ff', '#ffc9ff', '#ffe18f'],
  ['#8ef7d0', '#5dd7ff', '#a1a8ff', '#f6b8ff'],
  ['#ffb996', '#ffd2f1', '#9cdcff', '#8fffd0'],
  ['#7cd5ff', '#97f5ff', '#ffb8f6', '#ffd477'],
];
let paletteIndex = 0;

const state = {
  particles: [],
  ripples: [],
  sparkles: [],
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false },
  config: {
    count: parseInt(controls.count.value, 10),
    flow: parseFloat(controls.flow.value),
    sway: parseFloat(controls.sway.value),
    pulse: parseFloat(controls.pulse.value),
    glow: controls.glow.checked,
    trail: controls.trail.checked,
    shimmer: controls.shimmer.checked,
  },
};

function resize() {
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resize);
resize();

function createParticles() {
  state.particles = new Array(state.config.count).fill(null).map(() => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(innerWidth, innerHeight) * 0.5;
    return {
      x: innerWidth / 2 + Math.cos(angle) * radius,
      y: innerHeight / 2 + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      baseAngle: angle,
      wobble: Math.random() * Math.PI * 2,
      hueIndex: Math.floor(Math.random() * palettes[paletteIndex].length),
      life: Math.random() * 120,
      size: 1 + Math.random() * 2,
    };
  });
}

createParticles();

function createPaletteChips() {
  controls.paletteChips.innerHTML = '';
  palettes.forEach((colors, idx) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (idx === paletteIndex ? ' active' : '');
    chip.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[3]})`;
    chip.textContent = `色盘 ${idx + 1}`;
    chip.addEventListener('click', () => {
      paletteIndex = idx;
      updateChips();
      refreshColors();
    });
    controls.paletteChips.appendChild(chip);
  });
}

function updateChips() {
  [...controls.paletteChips.children].forEach((chip, idx) => {
    chip.classList.toggle('active', idx === paletteIndex);
  });
}

createPaletteChips();

function refreshColors() {
  state.particles.forEach((p) => {
    if (Math.random() > 0.55) return;
    p.hueIndex = Math.floor(Math.random() * palettes[paletteIndex].length);
  });
}

function addRipple(x, y, burst = false) {
  state.ripples.push({ x, y, r: 6, alpha: burst ? 0.4 : 0.25, burst });
}

function addSparkles(x, y, intensity = 1) {
  const count = 20 * intensity;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    state.sparkles.push({
      x,
      y,
      vx: Math.cos(angle) * (1 + Math.random() * 1.5),
      vy: Math.sin(angle) * (1 + Math.random() * 1.5),
      alpha: 0.8,
      size: 1 + Math.random() * 2,
      hueIndex: Math.floor(Math.random() * palettes[paletteIndex].length),
    });
  }
}

function updateValues() {
  state.config.count = parseInt(controls.count.value, 10);
  state.config.flow = parseFloat(controls.flow.value);
  state.config.sway = parseFloat(controls.sway.value);
  state.config.pulse = parseFloat(controls.pulse.value);
  state.config.glow = controls.glow.checked;
  state.config.trail = controls.trail.checked;
  state.config.shimmer = controls.shimmer.checked;

  controls.labels.count.textContent = state.config.count;
  controls.labels.flow.textContent = state.config.flow.toFixed(1);
  controls.labels.sway.textContent = state.config.sway.toFixed(1);
  controls.labels.pulse.textContent = state.config.pulse.toFixed(1);

  if (state.particles.length !== state.config.count) {
    createParticles();
  }
}

['count', 'flow', 'sway', 'pulse'].forEach((key) => {
  controls[key].addEventListener('input', updateValues);
});
['glow', 'trail', 'shimmer'].forEach((key) => {
  controls[key].addEventListener('change', updateValues);
});

controls.flare.addEventListener('click', () => {
  const cx = state.pointer.x;
  const cy = state.pointer.y;
  addRipple(cx, cy, true);
  addSparkles(cx, cy, 2);
  refreshColors();
});

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
  addSparkles(e.clientX, e.clientY, 1);
});

window.addEventListener('dblclick', () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  updateChips();
  refreshColors();
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    addRipple(state.pointer.x, state.pointer.y, true);
    addSparkles(state.pointer.x, state.pointer.y, 1.5);
  }
});

function step() {
  const flow = state.config.flow * 0.7;
  const sway = state.config.sway;
  const pulse = state.config.pulse;

  if (!state.config.trail) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  } else {
    ctx.fillStyle = 'rgba(10, 14, 28, 0.12)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }

  const time = performance.now() * 0.001;

  state.particles.forEach((p) => {
    const pullX = state.pointer.active ? state.pointer.x : innerWidth / 2;
    const pullY = state.pointer.active ? state.pointer.y : innerHeight / 2;
    const dx = pullX - p.x;
    const dy = pullY - p.y;
    const dist = Math.hypot(dx, dy) + 0.001;

    const swing = Math.sin(time * pulse + p.wobble) * sway;
    const angle = Math.atan2(dy, dx) + swing * 0.05;

    p.vx += Math.cos(angle) * (flow / dist) * 16;
    p.vy += Math.sin(angle) * (flow / dist) * 16;

    p.vx *= 0.94;
    p.vy *= 0.94;

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -50) p.x = innerWidth + 50;
    if (p.x > innerWidth + 50) p.x = -50;
    if (p.y < -50) p.y = innerHeight + 50;
    if (p.y > innerHeight + 50) p.y = -50;

    const color = palettes[paletteIndex][p.hueIndex % palettes[paletteIndex].length];
    ctx.save();
    ctx.globalCompositeOperation = state.config.glow ? 'lighter' : 'source-over';
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = color;
    ctx.lineWidth = p.size * (state.config.glow ? 1.8 : 1.1);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8);
    ctx.stroke();
    ctx.restore();

    if (state.config.shimmer && Math.random() < 0.05) {
      state.sparkles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        alpha: 0.6,
        size: p.size,
        hueIndex: p.hueIndex,
      });
    }
  });

  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    r.r += r.burst ? 6 : 4;
    r.alpha *= 0.96;
    if (r.alpha < 0.02) {
      state.ripples.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = palettes[paletteIndex][Math.floor(Math.random() * palettes[paletteIndex].length)];
    ctx.lineWidth = r.burst ? 2.5 : 1.5;
    ctx.globalAlpha = r.alpha;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = state.sparkles.length - 1; i >= 0; i--) {
    const s = state.sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.alpha *= 0.94;
    s.vx *= 0.96;
    s.vy *= 0.96;
    if (s.alpha < 0.02) {
      state.sparkles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = palettes[paletteIndex][s.hueIndex % palettes[paletteIndex].length];
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(step);
}

updateValues();
step();
