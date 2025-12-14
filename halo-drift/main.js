const canvas = document.getElementById("haloCanvas");
const ctx = canvas.getContext("2d");
let w, h;

const controls = {
  count: document.getElementById("count"),
  flow: document.getElementById("flow"),
  curl: document.getElementById("curl"),
  trail: document.getElementById("trail"),
  glow: document.getElementById("glow"),
  tails: document.getElementById("tails"),
  palettes: document.getElementById("palettes"),
};

const palettes = [
  ["#7ce7ff", "#d0b3ff", "#ffa5d2", "#9cfff2"],
  ["#b5ff6b", "#7ee0ff", "#f5e663", "#ffd7ff"],
  ["#8da2ff", "#f5b1ff", "#ffefc1", "#8fffe4"],
  ["#ff9b9b", "#ffd199", "#9ad8ff", "#c5a3ff"],
];
let paletteIndex = 0;
let particles = [];
let pointer = { x: 0, y: 0, active: false };
let ripples = [];
let time = 0;

function resize() {
  w = canvas.width = window.innerWidth * 2;
  h = canvas.height = window.innerHeight * 2;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}

function rand(a, b) {
  return Math.random() * (b - a) + a;
}

function createParticles() {
  particles = new Array(parseInt(controls.count.value, 10)).fill(null).map(() => ({
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-0.5, 0.5),
    vy: rand(-0.5, 0.5),
    life: rand(0.4, 1),
  }));
}

function spawnRipple(x, y, energy = 1) {
  ripples.push({ x, y, radius: 0, life: 1, energy });
}

function drawParticle(p, i) {
  const palette = palettes[paletteIndex];
  const noise = Math.sin(time * 0.002 + i) * 0.5 + 0.5;
  const color = palette[i % palette.length];
  const size = 1.3 + noise * 2.1;
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6 + noise * 0.3;
  ctx.shadowBlur = controls.glow.classList.contains("active") ? 14 + noise * 10 : 0;
  ctx.shadowColor = color;
  ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
  ctx.fill();
}

function updateParticles() {
  const flow = parseFloat(controls.flow.value);
  const curl = parseFloat(controls.curl.value);
  particles.forEach((p, i) => {
    const angle = Math.sin(p.y * 0.0008 + time * 0.002) * curl + Math.cos(p.x * 0.0007 - time * 0.002) * curl;
    const gx = Math.cos(angle) * flow;
    const gy = Math.sin(angle) * flow;
    p.vx += gx * 0.02;
    p.vy += gy * 0.02;

    if (pointer.active) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const dist = Math.max(60, Math.hypot(dx, dy));
      const strength = 0.12 * (1 / dist);
      p.vx += dx * strength;
      p.vy += dy * strength;
    }

    ripples.forEach((r) => {
      const dx = p.x - r.x;
      const dy = p.y - r.y;
      const dist = Math.hypot(dx, dy);
      if (dist < r.radius + 40) {
        const force = (r.energy * (1 - dist / (r.radius + 40))) * 0.6;
        p.vx += (dx / dist || 0) * force;
        p.vy += (dy / dist || 0) * force;
      }
    });

    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x += w;
    if (p.x > w) p.x -= w;
    if (p.y < 0) p.y += h;
    if (p.y > h) p.y -= h;

    drawParticle(p, i);
  });
}

function updateRipples() {
  ripples = ripples.filter((r) => r.life > 0.02);
  ripples.forEach((r) => {
    r.radius += 12 + r.energy * 6;
    r.life -= 0.008;
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(r.x, r.y, r.radius * 0.3, r.x, r.y, r.radius);
    gradient.addColorStop(0, `rgba(255,255,255,${0.15 * r.life})`);
    gradient.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 1;
    ctx.fillRect(r.x - r.radius, r.y - r.radius, r.radius * 2, r.radius * 2);
  });
}

function render() {
  requestAnimationFrame(render);
  time += 1;
  const tailFade = parseFloat(controls.trail.value);
  if (controls.tails.classList.contains("active")) {
    ctx.fillStyle = `rgba(5, 8, 18, ${tailFade})`;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
  updateRipples();
  updateParticles();
}

function buildPaletteChips() {
  controls.palettes.innerHTML = "";
  palettes.forEach((palette, idx) => {
    const chip = document.createElement("div");
    chip.className = `chip ${idx === paletteIndex ? "active" : ""}`;
    chip.style.background = `linear-gradient(120deg, ${palette.join(",")})`;
    chip.addEventListener("click", () => {
      paletteIndex = idx;
      buildPaletteChips();
    });
    controls.palettes.appendChild(chip);
  });
}

function toggleButton(btn) {
  btn.classList.toggle("active");
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (e) => {
  pointer = { x: e.clientX * 2, y: e.clientY * 2, active: true };
});
window.addEventListener("pointerleave", () => (pointer.active = false));
window.addEventListener("click", (e) => spawnRipple(e.clientX * 2, e.clientY * 2, 1));
window.addEventListener("dblclick", () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  buildPaletteChips();
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    spawnRipple(pointer.x || w / 2, pointer.y || h / 2, 1.6);
  }
});

controls.count.addEventListener("input", () => createParticles());
controls.flow.addEventListener("input", () => {});
controls.curl.addEventListener("input", () => {});
controls.trail.addEventListener("input", () => {});
controls.glow.addEventListener("click", () => toggleButton(controls.glow));
controls.tails.addEventListener("click", () => toggleButton(controls.tails));

function init() {
  resize();
  buildPaletteChips();
  createParticles();
  ctx.fillStyle = "#050812";
  ctx.fillRect(0, 0, w, h);
  render();
}

init();
