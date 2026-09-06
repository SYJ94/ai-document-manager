const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const countdownEl = document.getElementById('countdown');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const gameBoard = document.getElementById('game-board');

const grid = 20;
const tileCount = canvas.width / grid;
const countdownSeconds = 3;
const swipeThreshold = 24;

let speed = 110;
let selectedSpeed = 110;
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
let pointerStartX = null;
let pointerStartY = null;
let activePointerId = null;

function resetGame() {
  clearInterval(timer);
  clearInterval(countdownTimer);
  clearTimeout(countdownStartTimer);
  resetPointerTracking();

  snake = [{ x: 10, y: 10 }];
  food = randomFood();
  direction = { x: 0, y: 0 };
  nextDirection = { x: 0, y: 0 };
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

  // 같은 틱에서 여러 번 입력해도 가장 최근의 다음 방향을 기준으로 역주행을 막는다.
  if (newDirection.x + nextDirection.x === 0 && newDirection.y + nextDirection.y === 0) return;

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
  resetPointerTracking();
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
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 }
  };

  const newDirection = keyDirections[event.key];
  if (!newDirection) return;

  event.preventDefault();
  setDirection(newDirection);
}

function handlePointerDown(event) {
  if (!gameStarted || gameOver || preparing) return;
  if (activePointerId !== null) return;

  activePointerId = event.pointerId;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;

  if (gameBoard.setPointerCapture) {
    gameBoard.setPointerCapture(event.pointerId);
  }

  event.preventDefault();
}

function handlePointerMove(event) {
  if (event.pointerId !== activePointerId) return;
  event.preventDefault();
}

function handlePointerUp(event) {
  if (event.pointerId !== activePointerId || pointerStartX === null || pointerStartY === null) return;

  const deltaX = event.clientX - pointerStartX;
  const deltaY = event.clientY - pointerStartY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (Math.max(absX, absY) >= swipeThreshold) {
    if (absX > absY) {
      setDirection(deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    } else {
      setDirection(deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    }
  }

  resetPointerTracking(event.pointerId);
  event.preventDefault();
}

function handlePointerCancel(event) {
  if (event.pointerId !== activePointerId) return;
  resetPointerTracking(event.pointerId);
}

function resetPointerTracking(pointerId = null) {
  if (pointerId !== null && activePointerId !== pointerId) return;

  pointerStartX = null;
  pointerStartY = null;

  if (activePointerId !== null && gameBoard.releasePointerCapture) {
    try {
      gameBoard.releasePointerCapture(activePointerId);
    } catch (error) {
      // Pointer capture가 이미 해제된 경우에는 무시한다.
    }
  }

  activePointerId = null;
}

document.addEventListener('keydown', handleKeydown);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);

difficultyButtons.forEach(button => {
  button.addEventListener('click', () => selectDifficulty(button));
});

gameBoard.addEventListener('pointerdown', handlePointerDown, { passive: false });
gameBoard.addEventListener('pointermove', handlePointerMove, { passive: false });
gameBoard.addEventListener('pointerup', handlePointerUp, { passive: false });
gameBoard.addEventListener('pointercancel', handlePointerCancel, { passive: false });
gameBoard.addEventListener('lostpointercapture', () => resetPointerTracking());

resetGame();
