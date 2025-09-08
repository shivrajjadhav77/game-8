// Tower Builder — improved movement & drop logic
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 500;

const blockHeight = 30;
let baseWidth = 200;
let speed = 3;
let score = 0;
let blocks = [];
let gameRunning = false;
let animId = null;

// DOM
const scoreEl = document.getElementById("score");

// ---------- Game setup ----------


// ---------- Floating background emojis ----------
let bgEmojis = [];
const emojiList = ["🌟", "✨", "💫", "🔥", "🌈", "⭐", "💎", "🎇", "🎆", "⚡"];


function spawnBgEmoji() {
    size: 24 + Math.random() * 20 // bigger emojis

  const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
  bgEmojis.push({
    emoji: emoji,
    x: Math.random() * canvas.width,
    y: canvas.height + 20,
    speed: 0.5 + Math.random() * 1.2,
    size: 18 + Math.random() * 10
  });
}

// Draw background emojis
function drawBgEmojis() {
  ctx.font = "20px Arial";
  ctx.textAlign = "center";

  bgEmojis.forEach((e, i) => {
    ctx.font = `${e.size}px Arial`;
    ctx.fillText(e.emoji, e.x, e.y);
    e.y -= e.speed;

    // Remove if goes off top
    if (e.y < -20) {
      bgEmojis.splice(i, 1);
    }
  });
}
    

function startGame() {
  cancelAnimationFrame(animId);
  blocks = [];
  score = 0;
  speed = 3;
  gameRunning = true;
  scoreEl.innerText = "Score: 0";

  // Base block centered at bottom (fixed)
  const baseX = Math.round((canvas.width - baseWidth) / 2);
  const baseY = canvas.height - blockHeight;
  blocks.push({ x: baseX, y: baseY, width: baseWidth, moving: false, dx: 0 });

  // First moving block on top of base
  addMovingBlock(baseWidth, baseY - blockHeight);

  animId = requestAnimationFrame(gameLoop);
}

// Add a new moving block with its own dx
function addMovingBlock(width, y) {
  // start at left edge moving right
  blocks.push({ x: 0, y: y, width: width, moving: true, dx: speed });
}

// ---------- Game loop ----------
function gameLoop() {
    if (Math.random() < 0.05) { // 5% chance per frame
  spawnBgEmoji();
}

    ctx.clearRect(0, 0, canvas.width, canvas.height);

// 🟢 Draw emojis first (behind blocks)
drawBgEmojis();

// 🟡 Draw blocks on top
blocks.forEach(block => {
  ctx.fillStyle = block.color;
  ctx.fillRect(block.x, block.y, block.width, block.height);
});

// 🔵 Draw score or texts after
ctx.fillStyle = "white";
ctx.font = "20px Arial";
ctx.fillText("Score: " + score, 60, 30);

    // Draw floating background emojis
drawBgEmojis();

// Occasionally spawn new ones
if (Math.random() < 0.02) { // smaller number = fewer spawns
  spawnBgEmoji();
}

  animId = requestAnimationFrame(gameLoop);
  if (!gameRunning) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all blocks
  for (const b of blocks) {
    ctx.fillStyle = "#ffeb3b";
    ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.width), blockHeight);

    // subtle border for clarity
    ctx.strokeStyle = "#222";
    ctx.strokeRect(Math.round(b.x), Math.round(b.y), Math.round(b.width), blockHeight);
  }

  // Move only the top moving block
  const top = blocks[blocks.length - 1];
  if (top && top.moving) {
    top.x += top.dx;

    // bounce off edges correctly
    if (top.x <= 0) {
      top.x = 0;
      top.dx = Math.abs(top.dx);
    } else if (top.x + top.width >= canvas.width) {
      top.x = canvas.width - top.width;
      top.dx = -Math.abs(top.dx);
    }
  }
}

// ---------- Drop logic ----------
function dropBlock() {
  if (!gameRunning) return;

  const top = blocks[blocks.length - 1];
  const below = blocks[blocks.length - 2];

  // Only drop if top is moving
  if (!top || !top.moving || !below) return;

  const leftTop = top.x;
  const rightTop = top.x + top.width;
  const leftBelow = below.x;
  const rightBelow = below.x + below.width;

  const overlap = Math.min(rightTop, rightBelow) - Math.max(leftTop, leftBelow);

  if (overlap <= 0) {
    // No overlap -> game over
    gameOver();
    return;
  }

  // Perfect alignment detection (small tolerance)
  const offset = Math.abs(leftTop - leftBelow);
  const PERFECT_TOLERANCE = 6;
  let bonus = 0;
  if (offset <= PERFECT_TOLERANCE) {
    // Perfect — snap to exactly the below block (reward)
    top.x = below.x;
    top.width = below.width;
    bonus = 1;
    spawnFloatingText("Perfect! ✨", top.x + top.width / 2, top.y);
  } else {
    // Trim to overlap
    top.width = overlap;
    top.x = Math.max(leftTop, leftBelow);
  }

  // Lock this block in place
  top.moving = false;
  top.dx = 0;

  // Update score and UI
  score += 1 + bonus;
  scoreEl.innerText = "Score: " + score;

  // Prepare next moving block on top
  const newY = top.y - blockHeight;
  // If the tower is too close to top, shift everything down so player can keep stacking
  if (newY < 40) {
    const shift = 40 - newY;
    for (const b of blocks) b.y += shift;
  }
  // New block width is equal to current top block width
  addMovingBlock(top.width, top.y - blockHeight);

  // Slightly increase speed to ramp difficulty
  speed = Math.min(10, speed + 0.12);
}

// ---------- Game over ----------
function gameOver() {
  setTimeout(() => {
  const again = confirm(`😭 Game Over! Your score: ${score}\nPlay again?`);
  if (again) startGame();
}, 80);

}

// ---------- Floating text helper ----------
function spawnFloatingText(text, canvasX, canvasY) {
  // create a small DOM note over canvas (positioned using canvas bounding box)
  const rect = canvas.getBoundingClientRect();
  const div = document.createElement("div");
  div.textContent = text;
  div.style.position = "absolute";
  div.style.left = `${Math.round(rect.left + canvasX)}px`;
  div.style.top = `${Math.round(rect.top + canvasY)}px`;
  div.style.transform = "translate(-50%, -120%)";
  div.style.padding = "6px 10px";
  div.style.background = "rgba(0,0,0,0.7)";
  div.style.color = "#fff";
  div.style.borderRadius = "8px";
  div.style.fontWeight = "700";
  div.style.pointerEvents = "none";
  div.style.zIndex = 9999;
  document.body.appendChild(div);
  // fade out
  setTimeout(() => { div.style.transition = "opacity .6s, transform .6s"; div.style.opacity = "0"; div.style.transform = "translate(-50%, -160%)"; }, 700);
  setTimeout(() => div.remove(), 1400);
}

// ---------- Input handlers ----------
document.body.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault(); // avoid page scroll
    dropBlock();

if (offset <= PERFECT_TOLERANCE) {
  // Perfect drop
  top.x = below.x;
  top.width = below.width;
  bonus = 1;
  spawnFloatingText("Perfect!", top.x + top.width / 2, top.y, "✨🎉");
} else {
  // Normal cut
  top.width = overlap;
  top.x = Math.max(leftTop, leftBelow);
}


}
});

canvas.addEventListener("click", () => dropBlock());
// ---------- Floating emoji + text ----------
function spawnFloatingText(text, canvasX, canvasY, emoji = "") {
  const rect = canvas.getBoundingClientRect();
  const div = document.createElement("div");

  div.innerHTML = emoji ? `${emoji} ${text}` : text;
  div.style.position = "absolute";
  div.style.left = `${Math.round(rect.left + canvasX)}px`;
  div.style.top = `${Math.round(rect.top + canvasY)}px`;
  div.style.transform = "translate(-50%, -120%)";
  div.style.padding = "6px 10px";
  div.style.background = "rgba(0,0,0,0.7)";
  div.style.color = "#fff";
  div.style.borderRadius = "8px";
  div.style.fontWeight = "700";
  div.style.pointerEvents = "none";
  div.style.zIndex = 9999;
  div.style.fontSize = "1.1rem";
  document.body.appendChild(div);

  // Fade + float animation
  setTimeout(() => {
    div.style.transition = "opacity .6s, transform .6s";
    div.style.opacity = "0";
    div.style.transform = "translate(-50%, -160%)";
  }, 700);

  setTimeout(() => div.remove(), 1400);
}
