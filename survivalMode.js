// survivalMode.js
// ============================
// CHAOS KEYBOARD BATTLE - SURVIVAL MODE (Upgraded)
// ============================

let canvas, ctx;
let paused = false;
let gameOverState = false;
let startTime = 0;
let enemySpawnInterval, powerUpSpawnInterval;
let backgroundColor = "black";

const enemyBullets = [];
const enemies = [];
const powerUps = [];

const keys = {};
const player = {
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  baseSpeed: 5,
  speed: 5,
  health: 100,
  score: 0,
  bullets: [],
  bulletSpeed: 6,
  shieldActive: false,
  lastShot: 0,
  color: "blue",
};

let playerName = "Player";
let colorChosen = false;

function attachEventListeners() {
  document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "CapsLock") {
      showCapsLockWarning(true);
    }
  });

  document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key === "CapsLock") {
      showCapsLockWarning(false);
    }
  });
}

function showCapsLockWarning(state) {
  const caps = document.getElementById("capsWarning");
  if (caps) {
    caps.classList.toggle("hidden", !state);
  }
}

function shootBullet(dirX = 0, dirY = -1) {
  const magnitude = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const vx = (dirX / magnitude) * player.bulletSpeed;
  const vy = (dirY / magnitude) * player.bulletSpeed;

  player.bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y + player.height / 2 - 5,
    width: 10,
    height: 10,
    vx,
    vy,
  });
}

function handleShooting() {
  if (Date.now() - player.lastShot > 300) {
    if (keys["w"]) shootBullet(0, -1);
    if (keys["a"]) shootBullet(-1, 0);
    if (keys["s"]) shootBullet(0, 1);
    if (keys["d"]) shootBullet(1, 0);
    if (keys["q"]) shootBullet(-1, -1);
    if (keys["e"]) shootBullet(1, -1);
    if (keys["z"]) shootBullet(-1, 1);
    if (keys["c"]) shootBullet(1, 1);
    player.lastShot = Date.now();
  }
}

function spawnEnemy() {
  const wave = getWave();
  const types = ["normal", "fast", "tank", "shielded"];
  const type = types[Math.floor(Math.random() * types.length)];

  let enemy = {
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: 2 + wave * 0.2,
    health: 30 + wave * 5,
    lastShot: Date.now(),
    type,
    shielded: false,
  };

  if (type === "fast") enemy.speed *= 1.5;
  if (type === "tank") enemy.health *= 2;
  if (type === "shielded") enemy.shielded = true;

  enemies.push(enemy);
}

function spawnPowerUp() {
  const types = ["health", "shield", "speed", "bullet"];
  const type = types[Math.floor(Math.random() * types.length)];
  const powerUp = {
    x: Math.random() * (canvas.width - 30),
    y: Math.random() * (canvas.height - 30),
    width: 30,
    height: 30,
    type,
    spawnTime: Date.now(),
  };
  powerUps.push(powerUp);

  // Remove after 10 seconds
  setTimeout(() => {
    const index = powerUps.indexOf(powerUp);
    if (index !== -1) powerUps.splice(index, 1);
  }, 10000);
}

function getWave() {
  return Math.floor((Date.now() - startTime) / 30000) + 1;
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update() {
  if (paused || gameOverState) return;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  handleMovement();
  handleShooting();
  updateBullets();
  updateEnemies();
  updateEnemyBullets();
  updatePowerUps();

  drawPlayer();
  drawUI();

  if (player.health <= 0) {
    gameOver();
    return;
  }

  requestAnimationFrame(update);
}

function handleMovement() {
  if (keys["arrowleft"] && player.x > 0) player.x -= player.speed;
  if (keys["arrowright"] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys["arrowup"] && player.y > 0) player.y -= player.speed;
  if (keys["arrowdown"] && player.y + player.height < canvas.height) player.y += player.speed;
}

function updateBullets() {
  player.bullets = player.bullets.filter((b) => {
    b.x += b.vx;
    b.y += b.vy;
    return b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height;
  });

  player.bullets.forEach((bullet) => {
    enemies.forEach((enemy, i) => {
      if (isColliding(bullet, enemy)) {
        if (enemy.shielded) return;
        enemy.health -= 20;
        player.score += 5;
        bullet.vx = bullet.vy = 0; // stop bullet
        if (enemy.health <= 0) {
          enemies.splice(i, 1);
          player.score += 10;
        }
      }
    });
  });
}

function updateEnemies() {
  enemies.forEach((enemy, index) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);
    enemy.x += Math.cos(angle) * enemy.speed;
    enemy.y += Math.sin(angle) * enemy.speed;

    if (Date.now() - enemy.lastShot > 2000) {
      enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 5,
        y: enemy.y + enemy.height / 2 - 5,
        width: 10,
        height: 10,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
      });
      enemy.lastShot = Date.now();
    }

    if (isColliding(player, enemy)) {
      if (!player.shieldActive) {
        player.health -= 10;
        backgroundColor = "darkred";
        setTimeout(() => (backgroundColor = "black"), 100);
      }
      enemies.splice(index, 1);
    }
  });
}

function updateEnemyBullets() {
  enemyBullets.forEach((b, i) => {
    b.x += b.vx;
    b.y += b.vy;
    if (isColliding(player, b)) {
      if (!player.shieldActive) {
        player.health -= 10;
        backgroundColor = "darkred";
        setTimeout(() => (backgroundColor = "black"), 100);
      }
      enemyBullets.splice(i, 1);
    }
  });
}

function updatePowerUps() {
  powerUps.forEach((p, i) => {
    if (isColliding(player, p)) {
      if (p.type === "health") {
        player.health = Math.min(100, player.health + 20);
        backgroundColor = "green";
      }
      if (p.type === "shield") {
        player.shieldActive = true;
        setTimeout(() => (player.shieldActive = false), 5000);
      }
      if (p.type === "speed") {
        player.speed += 2;
        setTimeout(() => (player.speed = player.baseSpeed), 5000);
      }
      if (p.type === "bullet") {
        player.bulletSpeed += 2;
        setTimeout(() => (player.bulletSpeed = 6), 5000);
      }
      powerUps.splice(i, 1);
      setTimeout(() => (backgroundColor = "black"), 100);
    }
  });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  if (player.shieldActive) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "red";
  player.bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.width, b.height));

  ctx.fillStyle = "green";
  enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.width, e.height));

  ctx.fillStyle = "orange";
  enemyBullets.forEach((b) => ctx.fillRect(b.x, b.y, b.width, b.height));

  powerUps.forEach((p) => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.fillText(p.type, p.x + 2, p.y + 20);
  });
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`Name: ${playerName}`, 10, 30);
  ctx.fillText(`Health: ${player.health}`, 10, 60);
  ctx.fillText(`Score: ${player.score}`, 10, 90);
  ctx.fillText(`Wave: ${getWave()}`, 10, 120);
  ctx.fillText(`Time: ${Math.floor((Date.now() - startTime) / 1000)}s`, 10, 150);
}

function gameOver() {
  gameOverState = true;
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  const screen = document.getElementById("gameOverScreen");
  if (screen) screen.classList.remove("hidden");
  ctx.fillStyle = "red";
  ctx.font = "40px Arial";
  ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
}

function survivalStartGame(name = "Player", color = "blue") {
  playerName = name;
  player.color = color;
  colorChosen = true;

  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  attachEventListeners();

  Object.assign(player, {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    health: 100,
    score: 0,
    bullets: [],
    shieldActive: false,
    speed: player.baseSpeed,
    bulletSpeed: 6,
  });

  enemies.length = 0;
  enemyBullets.length = 0;
  powerUps.length = 0;
  gameOverState = false;
  paused = false;

  startTime = Date.now();
  enemySpawnInterval = setInterval(spawnEnemy, 2000);
  powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);

  update();
}

function togglePause() {
  paused = !paused;
  const pauseScreen = document.getElementById("pauseScreen");
  if (pauseScreen) pauseScreen.classList.toggle("hidden", !paused);
  if (!paused && !gameOverState) requestAnimationFrame(update);
}

function playAgain() {
  const screen = document.getElementById("gameOverScreen");
  if (screen) screen.classList.add("hidden");
  survivalStartGame(playerName, player.color);
}

window.survivalStartGame = survivalStartGame;
window.togglePause = togglePause;
window.playAgain = playAgain;
