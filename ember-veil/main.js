const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

const controls = {
  count: document.getElementById('count'),
  swirl: document.getElementById('swirl'),
  drift: document.getElementById('drift'),
  bloom: document.getElementById('bloom'),
  glow: document.getElementById('glow'),
  trail: document.getElementById('trail'),
  prism: document.getElementById('prism'),
  spark: document.getElementById('spark'),
  paletteChips: document.getElementById('paletteChips'),
  ignite: document.getElementById('ignite'),
  labels: {
    count: document.getElementById('countVal'),
    swirl: document.getElementById('swirlVal'),
    drift: document.getElementById('driftVal'),
    bloom: document.getElementById('bloomVal'),
  },
};

const palettes = [
  ['#9fd2ff', '#cfe6ff', '#ffc3ff', '#ffb48f'],
  ['#7cf0ff', '#6ec6ff', '#d0a6ff', '#ffd38a'],
  ['#9ef7d6', '#73d6ff', '#b4c8ff', '#ffadc2'],
  ['#ffb78d', '#ffd9a3', '#d6c0ff', '#8fd8ff'],
];
let paletteIndex = 0;

const state = {
  embers: [],
  ripples: [],
  sparks: [],
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false },
  config: {
    count: parseInt(controls.count.value, 10),
    swirl: parseFloat(controls.swirl.value),
    drift: parseFloat(controls.drift.value),
    bloom: parseFloat(controls.bloom.value),
    glow: controls.glow.checked,
    trail: controls.trail.checked,
    prism: controls.prism.checked,
    spark: controls.spark.checked,
  },
};

function resize() {
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resize);
resize();

function createEmbers() {
  state.embers = new Array(state.config.count).fill(null).map(() => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(innerWidth, innerHeight) * 0.35 + 30;
    return {
      angle,
      baseRadius: radius,
      radius,
      speed: 0.002 + Math.random() * 0.003,
      offset: Math.random() * Math.PI * 2,
      x: innerWidth / 2 + Math.cos(angle) * radius,
      y: innerHeight / 2 + Math.sin(angle) * radius,
      thickness: 0.6 + Math.random() * 1.8,
      hueIndex: Math.floor(Math.random() * palettes[paletteIndex].length),
      burst: 0,
    };
  });
}

createEmbers();

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
  state.embers.forEach((p) => {
    if (Math.random() > 0.6) return;
    p.hueIndex = Math.floor(Math.random() * palettes[paletteIndex].length);
  });
}

function addRipple(x, y, burst = false) {
  state.ripples.push({
    x,
    y,
    r: 8,
    alpha: burst ? 0.4 : 0.24,
    burst,
  });
}

function addSparks(x, y, intensity = 1) {
  const count = 12 * intensity + Math.random() * 10 * intensity;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2.4;
    state.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 0.9,
      size: 1 + Math.random() * 2.2,
      hueIndex: Math.floor(Math.random() * palettes[paletteIndex].length),
    });
  }
}

function ignite() {
  const x = state.pointer.x;
  const y = state.pointer.y;
  addRipple(x, y, true);
  addSparks(x, y, 3);
  state.embers.forEach((p) => {
    p.burst = Math.random() * 24;
  });
  refreshColors();
}

function updateValues() {
  state.config.count = parseInt(controls.count.value, 10);
  state.config.swirl = parseFloat(controls.swirl.value);
  state.config.drift = parseFloat(controls.drift.value);
  state.config.bloom = parseFloat(controls.bloom.value);
  state.config.glow = controls.glow.checked;
  state.config.trail = controls.trail.checked;
  state.config.prism = controls.prism.checked;
  state.config.spark = controls.spark.checked;

  controls.labels.count.textContent = state.config.count;
  controls.labels.swirl.textContent = state.config.swirl.toFixed(1);
  controls.labels.drift.textContent = state.config.drift.toFixed(1);
  controls.labels.bloom.textContent = state.config.bloom.toFixed(1);

  if (state.embers.length !== state.config.count) {
    createEmbers();
  }
}

['count', 'swirl', 'drift', 'bloom'].forEach((key) => {
  controls[key].addEventListener('input', updateValues);
});
['glow', 'trail', 'prism', 'spark'].forEach((key) => {
  controls[key].addEventListener('change', updateValues);
});

controls.ignite.addEventListener('click', ignite);

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
  if (state.config.spark) addSparks(e.clientX, e.clientY, 1.4);
});
window.addEventListener('dblclick', () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  updateChips();
  refreshColors();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    addRipple(state.pointer.x, state.pointer.y, true);
    if (state.config.spark) addSparks(state.pointer.x, state.pointer.y, 2);
  }
});

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function step() {
  const time = performance.now() * 0.001;
  const cx = lerp(innerWidth / 2, state.pointer.x, state.pointer.active ? 0.18 : 0.04);
  const cy = lerp(innerHeight / 2, state.pointer.y, state.pointer.active ? 0.18 : 0.04);

  if (!state.config.trail) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  } else {
    ctx.fillStyle = 'rgba(10, 12, 24, 0.12)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }

  state.embers.forEach((p) => {
    const drift = state.config.drift;
    const bloom = state.config.bloom;

    p.angle += (state.config.swirl * 0.006 + p.speed) * (1 + bloom * 0.15) + Math.sin(time * 0.5 + p.offset) * 0.0025 * drift;
    const wave = Math.sin(time * 0.8 + p.offset) * 24 * drift;
    const targetRadius = p.baseRadius * (1 + bloom * 0.04) + wave + p.burst;
    p.radius = lerp(p.radius, targetRadius, 0.12);
    p.burst *= 0.94;

    const px = p.x;
    const py = p.y;
    p.x = cx + Math.cos(p.angle) * p.radius;
    p.y = cy + Math.sin(p.angle) * p.radius;

    const color = palettes[paletteIndex][p.hueIndex % palettes[paletteIndex].length];
    ctx.save();
    ctx.globalCompositeOperation = state.config.prism ? 'lighter' : 'source-over';
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = color;
    ctx.lineWidth = (p.thickness * (state.config.glow ? 1.7 : 1.1)) * (1 + bloom * 0.1);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();

    if (state.config.spark && Math.random() < 0.035) {
      state.sparks.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        alpha: 0.65,
        size: 0.8 + Math.random() * 1.8,
        hueIndex: p.hueIndex,
      });
    }
  });

  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    r.r += r.burst ? 7 : 5;
    r.alpha *= 0.964;
    if (r.alpha < 0.02) {
      state.ripples.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = palettes[paletteIndex][Math.floor(Math.random() * palettes[paletteIndex].length)];
    ctx.globalAlpha = r.alpha;
    ctx.lineWidth = r.burst ? 2.6 : 1.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const s = state.sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.97;
    s.vy *= 0.97;
    s.alpha *= 0.94;
    if (s.alpha < 0.02) {
      state.sparks.splice(i, 1);
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
