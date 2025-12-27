const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const palettes = [
  ['#7EE8FA', '#EEC0C6', '#9AE6FF', '#F5D6FF'],
  ['#A1FFCE', '#FAFFD1', '#7BD5F5', '#9AA5FF'],
  ['#FFD3A5', '#FD6585', '#F5F7FA', '#A18CD1'],
  ['#8EC5FC', '#E0C3FC', '#F2F5FF', '#FFDEE9'],
  ['#A9F1DF', '#FFBBBB', '#C6FFDD', '#FBD786'],
];

const state = {
  shards: [],
  ripples: [],
  count: 240,
  flow: 0.36,
  warp: 0.24,
  trail: 0.08,
  paletteIndex: 0,
  glow: true,
  spark: true,
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2, down: false },
  time: 0,
};

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

function createShard() {
  const palette = palettes[state.paletteIndex];
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    size: 6 + Math.random() * 10,
    hue: palette[Math.floor(Math.random() * palette.length)],
    angle: Math.random() * Math.PI * 2,
    seed: Math.random() * 1000,
  };
}

function seedShards() {
  state.shards = Array.from({ length: state.count }, createShard);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wrap(value, max) {
  if (value < -50) return max + value + 50;
  if (value > max + 50) return value - max - 50;
  return value;
}

function drawShard(s) {
  const { x, y, size, angle, hue } = s;
  const alpha = 0.75;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const gradient = ctx.createLinearGradient(-size, -size, size, size);
  gradient.addColorStop(0, `${hue}80`);
  gradient.addColorStop(0.5, `${hue}ff`);
  gradient.addColorStop(1, `${hue}60`);
  ctx.fillStyle = gradient;
  if (state.glow) {
    ctx.shadowColor = hue;
    ctx.shadowBlur = 22;
  }
  ctx.beginPath();
  ctx.moveTo(-size, size * 0.4);
  ctx.lineTo(size * 0.3, 0);
  ctx.lineTo(-size * 0.6, -size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSpark(s) {
  const alpha = 0.35 + Math.random() * 0.25;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `${s.hue}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 1.5 + Math.random() * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRipple(ripple) {
  const palette = palettes[state.paletteIndex];
  ctx.save();
  ctx.strokeStyle = palette[(ripple.index + 1) % palette.length] + '66';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function updateShard(s, dt) {
  const t = state.time * 0.0008 + s.seed;
  const noise = Math.sin(t * 2) + Math.cos((s.x + s.seed) * 0.002) * 0.6;
  const warpAngle = noise * state.warp * Math.PI;
  const flowMag = 20 * state.flow;

  s.vx += Math.cos(warpAngle) * state.flow * 0.4;
  s.vy += Math.sin(warpAngle) * state.flow * 0.4;

  const dx = state.pointer.x - s.x;
  const dy = state.pointer.y - s.y;
  const dist = Math.hypot(dx, dy) + 0.001;
  const attract = Math.min(0.35 / dist, 0.12);
  s.vx += dx * attract * 0.2;
  s.vy += dy * attract * 0.2;

  state.ripples.forEach(r => {
    const dr = Math.hypot(s.x - r.x, s.y - r.y);
    if (dr < r.radius + 20) {
      const push = (r.radius - dr) * 0.0025;
      s.vx += Math.cos(r.phase) * push;
      s.vy += Math.sin(r.phase) * push;
    }
  });

  s.vx *= 0.985;
  s.vy *= 0.985;

  s.x += s.vx * flowMag * dt;
  s.y += s.vy * flowMag * dt;

  s.angle = lerp(s.angle, warpAngle, 0.05);
  s.x = wrap(s.x, window.innerWidth);
  s.y = wrap(s.y, window.innerHeight);
}

function loop(timestamp) {
  const dt = Math.min(0.05, timestamp - state.time) / 16.67;
  state.time = timestamp;

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(8, 12, 22, ${state.trail})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  state.ripples = state.ripples.filter(r => {
    r.radius += 180 * r.speed * dt;
    r.phase += 0.12;
    return r.radius < Math.max(window.innerWidth, window.innerHeight) * 0.8;
  });
  state.ripples.forEach(drawRipple);

  state.shards.forEach(s => {
    updateShard(s, dt);
    drawShard(s);
    if (state.spark && Math.random() < 0.18) drawSpark(s);
  });

  requestAnimationFrame(loop);
}

function bindControls() {
  const countInput = document.getElementById('count');
  const flowInput = document.getElementById('flow');
  const warpInput = document.getElementById('warp');
  const trailInput = document.getElementById('trail');
  const glowInput = document.getElementById('glow');
  const sparkInput = document.getElementById('spark');
  const countValue = document.getElementById('countValue');
  const flowValue = document.getElementById('flowValue');
  const warpValue = document.getElementById('warpValue');
  const trailValue = document.getElementById('trailValue');
  const palettesRow = document.getElementById('palettes');

  countInput.addEventListener('input', e => {
    state.count = Number(e.target.value);
    countValue.textContent = state.count;
    const diff = state.count - state.shards.length;
    if (diff > 0) {
      state.shards.push(...Array.from({ length: diff }, createShard));
    } else if (diff < 0) {
      state.shards.splice(diff);
    }
  });

  flowInput.addEventListener('input', e => {
    state.flow = Number(e.target.value);
    flowValue.textContent = state.flow.toFixed(2);
  });

  warpInput.addEventListener('input', e => {
    state.warp = Number(e.target.value);
    warpValue.textContent = state.warp.toFixed(2);
  });

  trailInput.addEventListener('input', e => {
    state.trail = Number(e.target.value);
    trailValue.textContent = state.trail.toFixed(2);
  });

  glowInput.addEventListener('change', e => {
    state.glow = e.target.checked;
  });

  sparkInput.addEventListener('change', e => {
    state.spark = e.target.checked;
  });

  palettes.forEach((palette, idx) => {
    const swatch = document.createElement('button');
    swatch.className = 'palette' + (idx === state.paletteIndex ? ' active' : '');
    swatch.style.background = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
    swatch.addEventListener('click', () => {
      state.paletteIndex = idx;
      document.querySelectorAll('.palette').forEach(el => el.classList.remove('active'));
      swatch.classList.add('active');
      seedShards();
    });
    palettesRow.appendChild(swatch);
  });
}

function spawnRipple(x, y) {
  state.ripples.push({
    x,
    y,
    radius: 12,
    speed: 0.8 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    index: state.paletteIndex,
  });
}

function randomFlash() {
  state.shards.forEach(s => {
    s.vx += (Math.random() - 0.5) * 2;
    s.vy += (Math.random() - 0.5) * 2;
    s.hue = palettes[state.paletteIndex][Math.floor(Math.random() * palettes[state.paletteIndex].length)];
  });
}

function setupInteractions() {
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', e => {
    state.pointer.x = e.clientX;
    state.pointer.y = e.clientY;
  });

  window.addEventListener('pointerdown', e => {
    state.pointer.down = true;
    spawnRipple(e.clientX, e.clientY);
  });

  window.addEventListener('pointerup', () => {
    state.pointer.down = false;
  });

  window.addEventListener('click', e => {
    spawnRipple(e.clientX, e.clientY);
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      spawnRipple(state.pointer.x, state.pointer.y);
    }
  });

  document.getElementById('reshuffle').addEventListener('click', () => {
    seedShards();
    randomFlash();
  });

  document.getElementById('burst').addEventListener('click', () => {
    spawnRipple(state.pointer.x, state.pointer.y);
  });
}

resize();
seedShards();
bindControls();
setupInteractions();
requestAnimationFrame(loop);
