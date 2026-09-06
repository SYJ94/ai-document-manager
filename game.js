const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

const grid = 20;
const tileCount = canvas.width / grid;
let snake;
let food;
let direction;
let nextDirection;
let score;
let gameOver;
let timer;

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  food = randomFood();
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  scoreEl.textContent = score;
  messageEl.textContent = '방향키로 지렁이를 움직여보세요!';
  clearInterval(timer);
  timer = setInterval(update, 110);
  draw();
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

function update() {
  if (gameOver) return;

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

  ctx.fillStyle = '#4caf50';
  snake.forEach(segment => {
    ctx.fillRect(segment.x * grid, segment.y * grid, grid - 1, grid - 1);
  });
}

function endGame() {
  gameOver = true;
  clearInterval(timer);
  messageEl.textContent = `게임 오버! 최종 점수: ${score}`;
}

window.addEventListener('keydown', event => {
  const keyDirections = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
  };

  const newDirection = keyDirections[event.key];
  if (!newDirection) return;

  event.preventDefault();
  if (newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0) return;
  nextDirection = newDirection;
});

restartBtn.addEventListener('click', resetGame);
resetGame();
