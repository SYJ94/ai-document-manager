const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const countdownEl = document.getElementById('countdown');
const controlButtons = document.querySelectorAll('.control-btn');

const grid = 20;
const tileCount = canvas.width / grid;
const speed = 110;
const countdownSeconds = 3;
let snake;
let food;
let direction;
let nextDirection;
let score;
let gameStarted;
let gameOver;
let preparing;
let timer;
let countdownTimer;
let countdownStartTimer;

function resetGame() {
  clearInterval(timer);
  clearInterval(countdownTimer);
  clearTimeout(countdownStartTimer);
  snake = [{ x: 10, y: 10 }];
  food = randomFood();
  direction = { x: 0, y: 0 };
  nextDirection = { x: 0, y: 0 };
  score = 0;
  gameStarted = false;
  gameOver = false;
  preparing = false;
  scoreEl.textContent = score;
  messageEl.textContent = 'START 버튼을 눌러 게임을 시작하세요.';
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

  preparing = true;
  startScreen.hidden = true;
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
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

function setDirection(newDirection) {
  if (!gameStarted || gameOver || preparing) return;
  if (newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0) return;
  nextDirection = newDirection;
}

function update() {
  if (!gameStarted || gameOver) return;

  direction = nextDirection;
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
  countdownTimer = null;
  countdownStartTimer = null;
  countdownEl.hidden = true;
  countdownEl.textContent = '';
  messageEl.textContent = `게임 오버! 최종 점수: ${score}`;
  startScreen.hidden = false;
  startBtn.textContent = '다시 시작';
}

function handleKeydown(event) {
  const keyDirections = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
  };

  const newDirection = keyDirections[event.key];
  if (!newDirection) return;

  event.preventDefault();
  setDirection(newDirection);
}

document.addEventListener('keydown', handleKeydown);
startBtn.addEventListener('click', startGame);
startBtn.addEventListener('pointerup', startGame);
restartBtn.addEventListener('click', resetGame);

controlButtons.forEach(button => {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const handleControl = (event) => {
    event.preventDefault();
    setDirection(directions[button.dataset.direction]);
  };

  button.addEventListener('pointerdown', handleControl);
  button.addEventListener('click', handleControl);
});

resetGame();
