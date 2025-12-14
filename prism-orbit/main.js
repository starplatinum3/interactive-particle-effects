const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const ringCountInput = document.getElementById('ringCount');
const driftInput = document.getElementById('drift');
const thicknessInput = document.getElementById('thickness');
const pulseCheckbox = document.getElementById('pulse');
const sparkCheckbox = document.getElementById('spark');
const ringCountLabel = document.getElementById('ringCountLabel');
const driftLabel = document.getElementById('driftLabel');
const thicknessLabel = document.getElementById('thicknessLabel');
const paletteGroup = document.getElementById('paletteGroup');

const palettes = {
  aurora: ['#7cfbff', '#6ad5ff', '#b0a5ff', '#ffbdf3'],
  sunrise: ['#ffdf94', '#ff9a7a', '#ff5f8a', '#ffd7e6'],
  violet: ['#c0a0ff', '#8fd2ff', '#f0b6ff', '#7de9ff']
};

const state = {
  w: 0,
  h: 0,
  rings: [],
  palette: 'aurora',
  mouse: { x: null, y: null },
  ripple: null
};

function resize() {
  state.w = canvas.width = window.innerWidth * devicePixelRatio;
  state.h = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createRings(count) {
  state.rings = [];
  const baseRadius = Math.min(state.w, state.h) * 0.07;
  for (let i = 0; i < count; i++) {
    state.rings.push({
      radius: baseRadius + i * baseRadius * 0.55,
      angle: Math.random() * Math.PI * 2,
      speed: randomBetween(0.002, 0.006) * (1 + i * 0.05),
      wobble: randomBetween(0.4, 0.9),
      jitter: randomBetween(0.002, 0.007),
      hueIndex: Math.floor(Math.random() * palettes[state.palette].length)
    });
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function updateLabels() {
  ringCountLabel.textContent = ringCountInput.value;
  driftLabel.textContent = Number(driftInput.value).toFixed(2);
  thicknessLabel.textContent = Number(thicknessInput.value).toFixed(1);
}

function drawRipple() {
  if (!state.ripple) return;
  const { x, y, r, life, maxLife } = state.ripple;
  const alpha = 1 - life / maxLife;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
  ctx.lineWidth = Math.max(1, 4 * alpha);
  ctx.stroke();
  state.ripple.r += 6;
  state.ripple.life += 1;
  if (state.ripple.life >= maxLife) state.ripple = null;
}

function drawSparkles() {
  if (!sparkCheckbox.checked) return;
  const sparkCount = 18;
  for (let i = 0; i < sparkCount; i++) {
    const angle = (Math.PI * 2 * i) / sparkCount;
    const r = Math.min(state.w, state.h) * 0.45;
    const x = state.w / 2 + Math.cos(angle) * r;
    const y = state.h / 2 + Math.sin(angle) * r;
    const flicker = 0.4 + Math.sin(Date.now() * 0.003 + i) * 0.25;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.08 * flicker})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + flicker * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function update() {
  ctx.clearRect(0, 0, state.w, state.h);

  const centerX = state.w / 2;
  const centerY = state.h / 2;

  drawSparkles();
  drawRipple();

  const palette = palettes[state.palette];
  const drift = Number(driftInput.value);
  const thickness = Number(thicknessInput.value);

  for (const ring of state.rings) {
    ring.angle += ring.speed;
    ring.angle += (Math.random() - 0.5) * ring.jitter * drift;

    const wobbleAmp = ring.wobble * 12;
    const wobble = Math.sin(Date.now() * 0.001 + ring.angle * 3) * wobbleAmp * drift;
    const pulseScale = pulseCheckbox.checked
      ? 1 + Math.sin(Date.now() * 0.002 + ring.angle) * 0.04
      : 1;

    const targetX = state.mouse.x ?? centerX;
    const targetY = state.mouse.y ?? centerY;
    const attractX = lerp(centerX, targetX, 0.08);
    const attractY = lerp(centerY, targetY, 0.08);

    const r = ring.radius * pulseScale + wobble;
    const x = attractX + Math.cos(ring.angle) * r;
    const y = attractY + Math.sin(ring.angle) * r;

    const color = palette[ring.hueIndex % palette.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.globalAlpha = 0.7;

    ctx.beginPath();
    ctx.arc(attractX, attractY, r, ring.angle, ring.angle + Math.PI * 1.2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, 2.6 + thickness * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(update);
}

function setPalette(name) {
  state.palette = name;
  for (const chip of paletteGroup.querySelectorAll('.chip')) {
    chip.classList.toggle('chip--active', chip.dataset.palette === name);
  }
  createRings(Number(ringCountInput.value));
}

function handlePointer(e) {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = (e.clientX - rect.left) * devicePixelRatio;
  state.mouse.y = (e.clientY - rect.top) * devicePixelRatio;
}

function handleLeave() {
  state.mouse.x = state.mouse.y = null;
}

function handleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * devicePixelRatio;
  const y = (e.clientY - rect.top) * devicePixelRatio;
  state.ripple = { x, y, r: 6, life: 0, maxLife: 40 };
}

window.addEventListener('resize', () => {
  resize();
  createRings(Number(ringCountInput.value));
});

canvas.addEventListener('pointermove', handlePointer);
canvas.addEventListener('pointerdown', handleClick);
canvas.addEventListener('pointerleave', handleLeave);

ringCountInput.addEventListener('input', () => {
  createRings(Number(ringCountInput.value));
  updateLabels();
});

[driftInput, thicknessInput].forEach((input) =>
  input.addEventListener('input', updateLabels)
);

paletteGroup.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-palette]');
  if (!button) return;
  setPalette(button.dataset.palette);
});

updateLabels();
resize();
createRings(Number(ringCountInput.value));
requestAnimationFrame(update);
