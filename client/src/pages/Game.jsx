import { useRef, useEffect, useState, useCallback } from 'react';

const CELL = 20;
const COLS = 20;
const ROWS = 20;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;

const DIR = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function randomFood(snake) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function Game() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle'); // idle | playing | over
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('haven_snake_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const dirRef = useRef(DIR.RIGHT);
  const nextDirRef = useRef(DIR.RIGHT);
  const foodRef = useRef({ x: 15, y: 10 });
  const loopRef = useRef(null);
  const scoreRef = useRef(0);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Grid lines (subtle)
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= WIDTH; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      const brightness = Math.max(0.4, 1 - i * 0.03);
      if (isHead) {
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = `rgba(34, 197, 94, ${brightness})`;
        ctx.shadowBlur = 0;
      }
      const pad = isHead ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        isHead ? 4 : 3
      );
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }, []);

  const reset = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = DIR.RIGHT;
    nextDirRef.current = DIR.RIGHT;
    foodRef.current = { x: 15, y: 10 };
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const tick = useCallback(() => {
    const snake = snakeRef.current;
    dirRef.current = nextDirRef.current;
    const dir = dirRef.current;

    const head = {
      x: (snake[0].x + dir.x + COLS) % COLS,
      y: (snake[0].y + dir.y + ROWS) % ROWS,
    };

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      clearInterval(loopRef.current);
      loopRef.current = null;
      setGameState('over');
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem('haven_snake_highscore', String(scoreRef.current));
      }
      draw();
      return;
    }

    const newSnake = [head, ...snake];

    // Eat food?
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foodRef.current = randomFood(newSnake);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    draw();
  }, [draw, highScore]);

  const startGame = useCallback(() => {
    reset();
    setGameState('playing');
    draw();
    loopRef.current = setInterval(tick, 120);
  }, [reset, draw, tick]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (gameState === 'idle' || gameState === 'over') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startGame();
          return;
        }
      }

      if (gameState !== 'playing') return;

      const dir = dirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (dir !== DIR.DOWN) nextDirRef.current = DIR.UP;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (dir !== DIR.UP) nextDirRef.current = DIR.DOWN;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (dir !== DIR.RIGHT) nextDirRef.current = DIR.LEFT;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (dir !== DIR.LEFT) nextDirRef.current = DIR.RIGHT;
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, startGame]);

  // Draw initial state
  useEffect(() => {
    draw();
  }, [draw]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, []);

  // Touch controls for mobile
  const touchStart = useRef(null);
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dir = dirRef.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && dir !== DIR.LEFT) nextDirRef.current = DIR.RIGHT;
      else if (dx < -30 && dir !== DIR.RIGHT) nextDirRef.current = DIR.LEFT;
    } else {
      if (dy > 30 && dir !== DIR.UP) nextDirRef.current = DIR.DOWN;
      else if (dy < -30 && dir !== DIR.DOWN) nextDirRef.current = DIR.UP;
    }
    touchStart.current = null;
  };

  return (
    <div className="game-page">
      <h2>Snake</h2>
      <div className="game-scores">
        <span>Score: <strong>{score}</strong></span>
        <span>Best: <strong>{highScore}</strong></span>
      </div>
      <div
        className="game-canvas-wrapper"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="game-canvas"
        />
        {gameState === 'idle' && (
          <div className="game-overlay">
            <p className="game-overlay-title">Snake</p>
            <p>Use arrow keys or WASD to move</p>
            <p>Swipe on mobile</p>
            <button className="btn-primary" onClick={startGame}>
              Play
            </button>
            <p className="game-hint">or press Space / Enter</p>
          </div>
        )}
        {gameState === 'over' && (
          <div className="game-overlay">
            <p className="game-overlay-title">Game Over</p>
            <p>Score: {score}</p>
            {score > 0 && score >= highScore && <p className="game-new-record">New Record!</p>}
            <button className="btn-primary" onClick={startGame}>
              Play Again
            </button>
            <p className="game-hint">or press Space / Enter</p>
          </div>
        )}
      </div>
      <div className="game-mobile-controls">
        <div className="game-dpad">
          <button className="dpad-btn dpad-up" onClick={() => {
            if (gameState === 'playing' && dirRef.current !== DIR.DOWN) nextDirRef.current = DIR.UP;
            else if (gameState !== 'playing') startGame();
          }}>&#9650;</button>
          <div className="dpad-middle">
            <button className="dpad-btn dpad-left" onClick={() => {
              if (gameState === 'playing' && dirRef.current !== DIR.RIGHT) nextDirRef.current = DIR.LEFT;
            }}>&#9664;</button>
            <div className="dpad-center" />
            <button className="dpad-btn dpad-right" onClick={() => {
              if (gameState === 'playing' && dirRef.current !== DIR.LEFT) nextDirRef.current = DIR.RIGHT;
            }}>&#9654;</button>
          </div>
          <button className="dpad-btn dpad-down" onClick={() => {
            if (gameState === 'playing' && dirRef.current !== DIR.UP) nextDirRef.current = DIR.DOWN;
          }}>&#9660;</button>
        </div>
      </div>
    </div>
  );
}
