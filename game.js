const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const countdownEl = document.getElementById('countdown');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const joystick = document.getElementById('joystick');
const joystickStick = document.getElementById('joystick-stick');

const grid = 20;
const tileCount = canvas.width / grid;
const countdownSeconds = 3;
const inputQueueLimit = 3;

let speed = 160;
let selectedSpeed = 160;
let snake;
let food;
let direction;
let inputQueue;
let score;
let gameStarted;
let gameOver;
let preparing;
let timer;
let countdownTimer;
let countdownStartTimer;
let joystickPointerId = null;

function resetGame() {
  clearInterval(timer);
  clearInterval(countdownTimer);
  clearTimeout(countdownStartTimer);
  resetJoystickVisual();

  snake = [{ x: 10, y: 10 }];
  food = randomFood();
  direction = { x: 0, y: 0 };
  inputQueue = [];
  score = 0;
  gameStarted = false;
  gameOver = false;
  preparing = false;
  speed = selectedSpeed;

  scoreEl.textContent = score;
  messageEl.textContent = '난이도를 선택하고 START 버튼을 눌러 게임을 시작하세요.';
  startScreen.hidden = false;
  countdownEl.hidden = true;
  countdownEl.textContent = '';
  startBtn.textContent = 'START';
  draw();
}

function startGame(event) {
  if (event) event.preventDefault();
  if (gameStarted || preparing) return;

  if (gameOver) {
    resetGame();
  }

  speed = selectedSpeed;
  preparing = true;
  startScreen.hidden = true;
  direction = { x: 1, y: 0 };
  inputQueue = [];
  messageEl.textContent = '준비하세요!';
  runCountdown();
}

function runCountdown() {
  let remaining = countdownSeconds;
  countdownEl.hidden = false;
  countdownEl.textContent = remaining;

  countdownTimer = setInterval(() => {
    remaining -= 1;

    if (remaining > 0) {
      countdownEl.textContent = remaining;
      return;
    }

    clearInterval(countdownTimer);
    countdownTimer = null;
    countdownEl.textContent = 'START!';

    countdownStartTimer = setTimeout(() => {
      countdownEl.hidden = true;
      gameStarted = true;
      preparing = false;
      gameOver = false;
      messageEl.textContent = '먹이를 먹어보세요!';
      clearInterval(timer);
      timer = setInterval(update, speed);
      draw();
    }, 500);
  }, 1000);
}

function randomFood() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake && snake.some(segment => segment.x === position.x && segment.y === position.y));
  return position;
}

function sameDirection(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOppositeDirection(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function getLastQueuedDirection() {
  return inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;
}

function setDirection(newDirection) {
  if (!gameStarted || gameOver || preparing) return;

  const lastDirection = getLastQueuedDirection();
  if (sameDirection(newDirection, lastDirection) || isOppositeDirection(newDirection, lastDirection)) return;

  if (inputQueue.length < inputQueueLimit) {
    inputQueue.push({ x: newDirection.x, y: newDirection.y });
  }
}

function applyNextDirection() {
  if (inputQueue.length === 0) return;
  direction = inputQueue.shift();
}

function update() {
  if (!gameStarted || gameOver) return;

  applyNextDirection();

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (
    head.x < 0 || head.x >= tileCount ||
    head.y < 0 || head.y >= tileCount ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreEl.textContent = score;
    food = randomFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(food.x * grid, food.y * grid, grid - 1, grid - 1);

  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#2e7d32' : '#4caf50';
    ctx.fillRect(segment.x * grid, segment.y * grid, grid - 1, grid - 1);
  });
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  preparing = false;
  clearInterval(timer);
  clearInterval(countdownTimer);
  clearTimeout(countdownStartTimer);
  inputQueue = [];
  resetJoystickVisual();
  countdownTimer = null;
  countdownStartTimer = null;
  countdownEl.hidden = true;
  countdownEl.textContent = '';
  messageEl.textContent = `게임 오버! 최종 점수: ${score}`;
  startScreen.hidden = false;
  startBtn.textContent = '다시 시작';
}

function selectDifficulty(button) {
  if (gameStarted || preparing) return;

  selectedSpeed = Number(button.dataset.speed);
  difficultyButtons.forEach(item => item.classList.toggle('active', item === button));
  messageEl.textContent = `${button.textContent.trim()} 난이도를 선택했습니다. START 버튼을 눌러 시작하세요.`;
}

function handleKeydown(event) {
  const keyDirections = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyW: { x: 0, y: -1 },
    KeyS: { x: 0, y: 1 },
    KeyA: { x: -1, y: 0 },
    KeyD: { x: 1, y: 0 }
  };

  const newDirection = keyDirections[event.code];
  if (!newDirection) return;

  event.preventDefault();
  setDirection(newDirection);
}

function getJoystickDirection(event) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = event.clientX - centerX;
  const deltaY = event.clientY - centerY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const maxDistance = 52;
  const rawDistance = Math.hypot(deltaX, deltaY);
  const distance = Math.min(rawDistance, maxDistance);

  if (rawDistance > 0) {
    const ratio = distance / rawDistance;
    joystickStick.style.transform = `translate(${deltaX * ratio}px, ${deltaY * ratio}px)`;
  }

  if (Math.max(absX, absY) < 14) return null;

  if (absX > absY) {
    return deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
  }

  return deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
}

function handleJoystickPointerDown(event) {
  if (!gameStarted || gameOver || preparing) return;
  if (joystickPointerId !== null) return;

  joystickPointerId = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  event.preventDefault();
  const newDirection = getJoystickDirection(event);
  if (newDirection) setDirection(newDirection);
}

function handleJoystickPointerMove(event) {
  if (event.pointerId !== joystickPointerId) return;

  event.preventDefault();
  const newDirection = getJoystickDirection(event);
  if (newDirection) setDirection(newDirection);
}

function handleJoystickPointerUp(event) {
  if (event.pointerId !== joystickPointerId) return;

  event.preventDefault();
  resetJoystickVisual(event.pointerId);
}

function handleJoystickPointerCancel(event) {
  if (event.pointerId !== joystickPointerId) return;
  resetJoystickVisual(event.pointerId);
}

function resetJoystickVisual(pointerId = null) {
  if (pointerId !== null && joystickPointerId !== pointerId) return;

  if (joystickPointerId !== null && joystick.releasePointerCapture) {
    try {
      joystick.releasePointerCapture(joystickPointerId);
    } catch (error) {
      // Pointer capture가 이미 해제된 경우에는 무시한다.
    }
  }

  joystickPointerId = null;
  if (joystickStick) joystickStick.style.transform = 'translate(0, 0)';
}

document.addEventListener('keydown', handleKeydown);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);

difficultyButtons.forEach(button => {
  button.addEventListener('click', () => selectDifficulty(button));
});

joystick.addEventListener('pointerdown', handleJoystickPointerDown, { passive: false });
joystick.addEventListener('pointermove', handleJoystickPointerMove, { passive: false });
joystick.addEventListener('pointerup', handleJoystickPointerUp, { passive: false });
joystick.addEventListener('pointercancel', handleJoystickPointerCancel, { passive: false });
joystick.addEventListener('lostpointercapture', () => resetJoystickVisual());

resetGame();
