const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

const controls = {
  count: document.getElementById('count'),
  flow: document.getElementById('flow'),
  spread: document.getElementById('spread'),
  pulse: document.getElementById('pulse'),
  glow: document.getElementById('glow'),
  trail: document.getElementById('trail'),
  warp: document.getElementById('warp'),
  spark: document.getElementById('spark'),
  paletteChips: document.getElementById('paletteChips'),
  surge: document.getElementById('surge'),
  labels: {
    count: document.getElementById('countVal'),
    flow: document.getElementById('flowVal'),
    spread: document.getElementById('spreadVal'),
    pulse: document.getElementById('pulseVal'),
  },
};

const palettes = [
  ['#ffdba2', '#9ddcff', '#fff2d7', '#9be0ff'],
  ['#ffcba0', '#8ad6ff', '#ffd6e8', '#b1d3ff'],
  ['#fff0c2', '#b0f3ff', '#ffd3b4', '#9bc5ff'],
  ['#ffc49c', '#99e7ff', '#ffd8ff', '#b6d5ff'],
];
let paletteIndex = 0;

const state = {
  ribbons: [],
  ripples: [],
  sparks: [],
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false },
  config: {
    count: parseInt(controls.count.value, 10),
    flow: parseFloat(controls.flow.value),
    spread: parseFloat(controls.spread.value),
    pulse: parseFloat(controls.pulse.value),
    glow: controls.glow.checked,
    trail: controls.trail.checked,
    warp: controls.warp.checked,
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

function createRibbons() {
  state.ribbons = new Array(state.config.count).fill(null).map(() => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(innerWidth, innerHeight) * 0.42 + 40;
    return {
      angle,
      baseRadius: radius,
      radius,
      x: innerWidth / 2 + Math.cos(angle) * radius,
      y: innerHeight / 2 + Math.sin(angle) * radius,
      wobble: Math.random() * Math.PI * 2,
      drift: 0,
      thickness: 0.6 + Math.random() * 1.6,
      hueIndex: Math.floor(Math.random() * palettes[paletteIndex].length),
    };
  });
}

createRibbons();

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
  state.ribbons.forEach((p) => {
    if (Math.random() > 0.55) return;
    p.hueIndex = Math.floor(Math.random() * palettes[paletteIndex].length);
  });
}

function addRipple(x, y, burst = false) {
  state.ripples.push({ x, y, r: 6, alpha: burst ? 0.38 : 0.24, burst });
}

function addSparks(x, y, intensity = 1) {
  const count = 14 * intensity + Math.random() * 10 * intensity;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2.1;
    state.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 0.9,
      size: 1 + Math.random() * 2.3,
      hueIndex: Math.floor(Math.random() * palettes[paletteIndex].length),
    });
  }
}

function surge() {
  addRipple(state.pointer.x, state.pointer.y, true);
  if (state.config.spark) addSparks(state.pointer.x, state.pointer.y, 3);
  state.ribbons.forEach((p) => {
    p.drift = Math.random() * 30 + 12;
  });
  refreshColors();
}

function updateValues() {
  state.config.count = parseInt(controls.count.value, 10);
  state.config.flow = parseFloat(controls.flow.value);
  state.config.spread = parseFloat(controls.spread.value);
  state.config.pulse = parseFloat(controls.pulse.value);
  state.config.glow = controls.glow.checked;
  state.config.trail = controls.trail.checked;
  state.config.warp = controls.warp.checked;
  state.config.spark = controls.spark.checked;

  controls.labels.count.textContent = state.config.count;
  controls.labels.flow.textContent = state.config.flow.toFixed(1);
  controls.labels.spread.textContent = state.config.spread.toFixed(1);
  controls.labels.pulse.textContent = state.config.pulse.toFixed(1);

  if (state.ribbons.length !== state.config.count) {
    createRibbons();
  }
}

['count', 'flow', 'spread', 'pulse'].forEach((key) => {
  controls[key].addEventListener('input', updateValues);
});
['glow', 'trail', 'warp', 'spark'].forEach((key) => {
  controls[key].addEventListener('change', updateValues);
});

controls.surge.addEventListener('click', surge);

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
  const cx = lerp(innerWidth / 2, state.pointer.x, state.pointer.active ? 0.16 : 0.05);
  const cy = lerp(innerHeight / 2, state.pointer.y, state.pointer.active ? 0.16 : 0.05);

  if (!state.config.trail) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  } else {
    ctx.fillStyle = 'rgba(8, 10, 20, 0.12)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }

  state.ribbons.forEach((p) => {
    const spread = state.config.spread;
    const pulse = state.config.pulse;

    p.wobble += 0.015 * (1 + spread * 0.3);
    p.angle += (state.config.flow * 0.006 + Math.sin(time * 0.6 + p.wobble) * 0.0025 * spread) * (1 + pulse * 0.12);
    const wave = Math.sin(time * 0.9 + p.wobble) * 26 * spread + Math.sin(time * 0.4 + p.wobble) * 12 * pulse;
    const targetRadius = p.baseRadius * (1 + spread * 0.05) + wave + p.drift;
    p.radius = lerp(p.radius, targetRadius, 0.1);
    p.drift *= 0.93;

    const prevX = p.x;
    const prevY = p.y;
    p.x = cx + Math.cos(p.angle) * p.radius;
    p.y = cy + Math.sin(p.angle) * p.radius;

    const color = palettes[paletteIndex][p.hueIndex % palettes[paletteIndex].length];
    ctx.save();
    ctx.globalCompositeOperation = state.config.warp ? 'lighter' : 'source-over';
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = (p.thickness * (state.config.glow ? 1.8 : 1.1)) * (1 + pulse * 0.08);
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();

    if (state.config.spark && Math.random() < 0.04) {
      state.sparks.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        alpha: 0.65,
        size: 0.9 + Math.random() * 1.9,
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
