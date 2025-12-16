// ============================
// Canvas setup
// ============================
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ============================
// Vector utilities (manual)
// ============================
function vec(x, y) { return { x, y }; }
function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function mul(v, s) { return { x: v.x * s, y: v.y * s }; }
function len(v) { return Math.hypot(v.x, v.y); }
function normalize(v) {
  const l = len(v) || 1;
  return { x: v.x / l, y: v.y / l };
}

// ============================
// Control points
// ============================
const P0 = vec(100, canvas.height / 2);

let P1 = vec(canvas.width * 0.35, canvas.height * 0.4);
let P2 = vec(canvas.width * 0.65, canvas.height * 0.6);

let V1 = vec(0, 0);
let V2 = vec(0, 0);

let target = vec(P1.x, P1.y);

// Physics constants
const k = 18.0;
const damping = 6.0;

// ============================
// Mouse input
// ============================
let dragging = false;
canvas.addEventListener('mousedown', e => {
  dragging = true;
  target = vec(e.clientX, e.clientY);
});
canvas.addEventListener('mousemove', e => {
  if (dragging) target = vec(e.clientX, e.clientY);
});
canvas.addEventListener('mouseup', () => dragging = false);
canvas.addEventListener('mouseleave', () => dragging = false);

// ============================
// Bézier math
// ============================
function bezier(t, P0, P1, P2, P3) {
  const u = 1 - t;
  return {
    x: u*u*u*P0.x + 3*u*u*t*P1.x + 3*u*t*t*P2.x + t*t*t*P3.x,
    y: u*u*u*P0.y + 3*u*u*t*P1.y + 3*u*t*t*P2.y + t*t*t*P3.y
  };
}

function bezierTangent(t, P0, P1, P2, P3) {
  const u = 1 - t;
  return {
    x: 3*u*u*(P1.x-P0.x) + 6*u*t*(P2.x-P1.x) + 3*t*t*(P3.x-P2.x),
    y: 3*u*u*(P1.y-P0.y) + 6*u*t*(P2.y-P1.y) + 3*t*t*(P3.y-P2.y)
  };
}

// ============================
// Physics update
// ============================
let last = performance.now();
function update(dt) {
  let a1 = sub(target, P1);
  a1 = sub(mul(a1, k), mul(V1, damping));
  V1 = add(V1, mul(a1, dt));
  P1 = add(P1, mul(V1, dt));

  let desiredP2 = add(P1, vec(120, 0));
  let a2 = sub(desiredP2, P2);
  a2 = sub(mul(a2, k * 0.6), mul(V2, damping));
  V2 = add(V2, mul(a2, dt));
  P2 = add(P2, mul(V2, dt));
}

// ============================
// Rendering
// ============================
function drawPoint(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const P3 = vec(canvas.width - 100, canvas.height / 2);

  ctx.beginPath();
  for (let t = 0; t <= 1.001; t += 0.01) {
    const p = bezier(t, P0, P1, P2, P3);
    t === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = '#4fd1ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
  ctx.lineWidth = 1;
  for (let t = 0; t <= 1.001; t += 0.1) {
    const p = bezier(t, P0, P1, P2, P3);
    const tan = normalize(bezierTangent(t, P0, P1, P2, P3));
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + tan.x * 25, p.y + tan.y * 25);
    ctx.stroke();
  }

  drawPoint(P0.x, P0.y, '#ff6b6b');
  drawPoint(P1.x, P1.y, '#ffd93d');
  drawPoint(P2.x, P2.y, '#ffd93d');
  drawPoint(P3.x, P3.y, '#ff6b6b');
}

// ============================
// Main loop
// ============================
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
