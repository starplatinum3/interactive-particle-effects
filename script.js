const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const densityInput = document.getElementById("density");
const meteorToggle = document.getElementById("meteors");
const themeToggle = document.getElementById("themeToggle");

let particles = [];
let meteors = [];
let lastMeteor = 0;
let isNight = true;
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };

const colors = {
  night: ["#72d2ff", "#ff9cf2", "#9ff3c9"],
  dawn: ["#f5d76e", "#ffa7a6", "#9fdaff"],
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = randomRange(-0.4, 0.4);
    this.vy = randomRange(-0.5, 0.2);
    this.size = randomRange(1, 3.4);
    this.alpha = randomRange(0.4, 1);
    this.color = colors[isNight ? "night" : "dawn"][Math.floor(Math.random() * 3)];
  }

  update(delta) {
    const followSpeed = 0.06;
    if (pointer.active) {
      const dx = pointer.x - this.x;
      const dy = pointer.y - this.y;
      this.vx += (dx * followSpeed) / 1000;
      this.vy += (dy * followSpeed) / 1000;
    }

    this.x += this.vx * delta;
    this.y += this.vy * delta;

    if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
      this.reset();
      this.y = -5;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = `${this.color}${Math.floor(this.alpha * 255).toString(16).padStart(2, "0")}`;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Meteor {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = randomRange(-canvas.width * 0.2, canvas.width * 0.8);
    this.y = randomRange(-40, canvas.height * 0.25);
    this.vx = randomRange(0.8, 1.8);
    this.vy = randomRange(0.4, 1.2);
    this.length = randomRange(120, 200);
    this.alpha = 1;
    this.color = colors[isNight ? "night" : "dawn"][Math.floor(Math.random() * 3)];
  }

  update(delta) {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.alpha -= 0.0025 * delta;
    if (this.alpha <= 0) {
      this.reset();
    }
  }

  draw() {
    const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.length, this.y - this.length * 0.3);
    grad.addColorStop(0, `${this.color}88`);
    grad.addColorStop(1, `${this.color}00`);
    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.2;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.length, this.y - this.length * 0.3);
    ctx.stroke();
  }
}

function createParticles(count) {
  particles = Array.from({ length: count }, () => new Particle());
}

function createMeteors(count) {
  meteors = Array.from({ length: count }, () => new Meteor());
}

function toggleTheme() {
  isNight = !isNight;
  document.documentElement.style.setProperty("--bg-top", isNight ? "#0b1026" : "#f8c6a6");
  document.documentElement.style.setProperty("--bg-bottom", isNight ? "#0d1b3d" : "#5e7bb6");
  document.documentElement.style.setProperty("--accent", isNight ? "#72d2ff" : "#ffa7a6");
  themeToggle.textContent = isNight ? "切换到黎明" : "切换到夜空";
  particles.forEach((p) => {
    p.color = colors[isNight ? "night" : "dawn"][Math.floor(Math.random() * 3)];
  });
  meteors.forEach((m) => {
    m.color = colors[isNight ? "night" : "dawn"][Math.floor(Math.random() * 3)];
  });
}

function burst(x, y) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x,
      y,
      vx: Math.cos((Math.PI * 2 * i) / 18) * randomRange(0.4, 1.2),
      vy: Math.sin((Math.PI * 2 * i) / 18) * randomRange(0.4, 1.2),
      size: randomRange(1.5, 3.4),
      alpha: 1,
      color: colors[isNight ? "night" : "dawn"][Math.floor(Math.random() * 3)],
      draw() {
        ctx.beginPath();
        ctx.fillStyle = `${this.color}${Math.floor(this.alpha * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      },
      update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.alpha -= 0.002 * delta;
      },
    });
  }
}

let lastTime = 0;
function animate(timestamp) {
  const delta = Math.min(32, timestamp - lastTime || 16);
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, index) => {
    p.update(delta);
    if (p.alpha !== undefined && p.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      p.draw();
    }
  });

  if (meteorToggle.checked) {
    meteors.forEach((m) => {
      m.update(delta);
      m.draw();
    });
    lastMeteor += delta;
    if (lastMeteor > 2000) {
      meteors.push(new Meteor());
      lastMeteor = 0;
    }
  }

  requestAnimationFrame(animate);
}

resize();
createParticles(Number(densityInput.value));
createMeteors(1);
requestAnimationFrame(animate);

window.addEventListener("resize", resize);

densityInput.addEventListener("input", (e) => {
  createParticles(Number(e.target.value));
});

meteorToggle.addEventListener("change", () => {
  if (!meteorToggle.checked) {
    meteors.length = 1;
    lastMeteor = 0;
  }
});

themeToggle.addEventListener("click", toggleTheme);

canvas.addEventListener("pointermove", (e) => {
  pointer = { x: e.clientX, y: e.clientY, active: true };
});
canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});

canvas.addEventListener("click", (e) => {
  burst(e.clientX, e.clientY);
});
