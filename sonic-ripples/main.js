const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const audioEl = document.getElementById('audio');
const fileInput = document.getElementById('fileInput');
const playPause = document.getElementById('playPause');
const micBtn = document.getElementById('micBtn');
const densitySlider = document.getElementById('density');
const spreadSlider = document.getElementById('spread');
const glowToggle = document.getElementById('glow');
const autoPaletteToggle = document.getElementById('autoPalette');

let audioCtx;
let analyser;
let sourceNode;
let micStream;
let elementSource;
let freqData;
let lastPaletteSwitch = 0;
let analyserConnected = false;

const palettes = [
  ['#7ae7ff', '#f6a8ff', '#ffd08d'],
  ['#7af7c4', '#b4ff6b', '#f8f7ff'],
  ['#c7a0ff', '#7fd0ff', '#ff95c8'],
  ['#fffb96', '#ffa5c0', '#8dd5ff'],
];
let paletteIndex = 0;

const ripples = [];
const sparks = [];
let mouse = { x: 0, y: 0, active: false };

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function setupAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    analyserConnected = false;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function connectSource(node) {
  if (sourceNode) {
    sourceNode.disconnect();
  }
  node.connect(analyser);
  if (!analyserConnected) {
    analyser.connect(audioCtx.destination);
    analyserConnected = true;
  }
  sourceNode = node;
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setupAudio();
  const url = URL.createObjectURL(file);
  audioEl.src = url;
  audioEl.play();
  if (!elementSource) {
    elementSource = audioCtx.createMediaElementSource(audioEl);
  }
  connectSource(elementSource);
});

playPause.addEventListener('click', () => {
  setupAudio();
  if (!audioEl.src) return;
  if (audioEl.paused) {
    audioEl.play();
    playPause.textContent = '暂停';
  } else {
    audioEl.pause();
    playPause.textContent = '播放';
  }
});

audioEl.addEventListener('play', () => {
  playPause.textContent = '暂停';
});
audioEl.addEventListener('pause', () => {
  playPause.textContent = '播放';
});

audioEl.addEventListener('ended', () => {
  playPause.textContent = '播放';
});

micBtn.addEventListener('click', async () => {
  try {
    setupAudio();
    if (!micStream) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
    const micSource = audioCtx.createMediaStreamSource(micStream);
    connectSource(micSource);
  } catch (err) {
    console.warn('无法获取麦克风：', err);
  }
});

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
});
canvas.addEventListener('pointerleave', () => {
  mouse.active = false;
});

function spawnRipple(energy) {
  const hueScale = palettes[paletteIndex];
  const color = hueScale[Math.floor(Math.random() * hueScale.length)];
  const spread = parseFloat(spreadSlider.value);
  ripples.push({
    x: mouse.active ? mouse.x : canvas.clientWidth / 2 + (Math.random() - 0.5) * 140,
    y: mouse.active ? mouse.y : canvas.clientHeight / 2 + (Math.random() - 0.5) * 140,
    radius: 0,
    maxRadius: Math.max(120, energy * 1.1 * spread),
    lineWidth: 2 + Math.random() * 2,
    alpha: 1,
    color,
  });
}

function spawnSpark(energy) {
  const hueScale = palettes[paletteIndex];
  const color = hueScale[(Math.random() * hueScale.length) | 0];
  sparks.push({
    x: canvas.clientWidth / 2 + (Math.random() - 0.5) * 260,
    y: canvas.clientHeight / 2 + (Math.random() - 0.5) * 260,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    radius: 2 + Math.random() * 2,
    life: 1,
    color,
    glow: Math.random() * 6 + 8 + energy * 0.04,
  });
}

function drawRipples() {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.radius += 2.2;
    r.alpha -= 0.008;
    if (r.alpha <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = r.alpha * 0.8;
    ctx.lineWidth = r.lineWidth;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawSparks() {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.01;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.glow);
    grd.addColorStop(0, `${s.color}dd`);
    grd.addColorStop(1, `${s.color}00`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render(time) {
  requestAnimationFrame(render);
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  ctx.fillStyle = '#0b1026';
  ctx.globalAlpha = glowToggle.checked ? 0.16 : 0.08;
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.globalAlpha = 1;

  if (analyser) {
    analyser.getByteFrequencyData(freqData);

    const avg = freqData.reduce((a, b) => a + b, 0) / freqData.length;
    const density = parseFloat(densitySlider.value);
    if (avg > 40) {
      spawnRipple(avg * density * 0.9);
      if (Math.random() < 0.35) spawnSpark(avg * 0.4);
    }

    const beat = Math.max(...freqData.slice(0, 80)) / 255;

    ctx.save();
    ctx.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const swirl = beat * 0.08 + 0.01;
    ctx.rotate(time * 0.00005 + swirl);

    const radius = 220 + avg * 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = palettes[paletteIndex][i % palettes[paletteIndex].length];
      ctx.globalAlpha = 0.2 + beat * 0.3;
      ctx.lineWidth = 3 - i * 0.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1 + i * 0.06), radius * 0.5 * (1 + i * 0.03), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = glowToggle.checked ? 'lighter' : 'source-over';
    drawSparks();
    drawRipples();
    ctx.restore();

    if (autoPaletteToggle.checked && time - lastPaletteSwitch > 12000 && avg > 35) {
      paletteIndex = (paletteIndex + 1) % palettes.length;
      lastPaletteSwitch = time;
    }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 37 + time * 0.02) % canvas.clientWidth;
    const y = (i * 71 + time * 0.014) % canvas.clientHeight;
    ctx.fillRect(x, y, 2, 2);
  }
}

canvas.addEventListener('click', () => {
  spawnRipple(260);
  for (let i = 0; i < 12; i++) spawnSpark(200);
});

render(0);
