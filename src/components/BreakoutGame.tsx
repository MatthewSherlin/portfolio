"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useResponsive } from "@/hooks/useResponsive";

interface BreakoutGameProps {
  onExit: (score: number) => void;
}

const GRID_W = 44;
const GRID_H = 22;
const PADDLE_W = 9;
const TICK_MS = 55;
const BRICK_ROWS = 6;
const BRICK_CHARS = ["@", "#", "%", "=", "+", "-"];
const ROW_POINTS = [50, 40, 30, 20, 15, 10];
const TOTAL_LEVELS = 3;

interface GameState {
  ballX: number;
  ballY: number;
  ballDX: number;
  ballDY: number;
  paddleX: number;
  bricks: Set<string>;
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  won: boolean;
  paused: boolean;
}

function createBricks(): Set<string> {
  const b = new Set<string>();
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 2; c < GRID_W - 2; c++) {
      b.add(`${c},${r + 2}`);
    }
  }
  return b;
}

function createInitialState(): GameState {
  return {
    ballX: Math.floor(GRID_W / 2),
    ballY: GRID_H - 5,
    ballDX: 1,
    ballDY: -1,
    paddleX: Math.floor(GRID_W / 2),
    bricks: createBricks(),
    score: 0,
    lives: 4,
    level: 1,
    gameOver: false,
    won: false,
    paused: true,
  };
}

export function BreakoutGame({ onExit }: BreakoutGameProps) {
  const gs = useRef<GameState>(createInitialState());
  const dirRef = useRef(0);
  const [, setTick] = useState(0);

  const handleExit = useCallback(() => {
    onExit(gs.current.score);
  }, [onExit]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          dirRef.current = -3;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dirRef.current = 3;
          e.preventDefault();
          break;
        case " ":
          if (gs.current.paused && !gs.current.gameOver) {
            gs.current.paused = false;
          }
          e.preventDefault();
          break;
        case "q":
        case "Q":
        case "Escape":
          e.preventDefault();
          handleExit();
          break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A", "ArrowRight", "d", "D"].includes(e.key)) {
        dirRef.current = 0;
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleExit]);

  useEffect(() => {
    const interval = setInterval(() => {
      const g = gs.current;
      if (g.gameOver) return;

      // Move paddle
      const half = Math.floor(PADDLE_W / 2);
      g.paddleX = Math.max(
        half + 1,
        Math.min(GRID_W - half - 2, g.paddleX + dirRef.current)
      );

      if (g.paused) {
        setTick((t) => t + 1);
        return;
      }

      // Move ball
      let nx = g.ballX + g.ballDX;
      let ny = g.ballY + g.ballDY;
      let ndx = g.ballDX;
      let ndy = g.ballDY;

      // Wall bounces
      if (nx <= 0 || nx >= GRID_W - 1) {
        ndx = -ndx;
        nx = g.ballX + ndx;
      }
      if (ny <= 0) {
        ndy = -ndy;
        ny = g.ballY + ndy;
      }

      // Brick collision
      const brickKey = `${nx},${ny}`;
      if (g.bricks.has(brickKey)) {
        g.bricks.delete(brickKey);
        ndy = -ndy;
        ny = g.ballY + ndy;
        const brickRow = parseInt(brickKey.split(",")[1]) - 2;
        g.score += ROW_POINTS[Math.max(0, Math.min(brickRow, BRICK_ROWS - 1))] || 10;

        // Also check and clear adjacent brick if ball came from horizontal
        const adjacentKey = `${g.ballX + ndx},${ny}`;
        if (g.bricks.has(adjacentKey) && ndx !== 0) {
          // Only side-clear on fast approach
        }

        if (g.bricks.size === 0) {
          g.level++;
          if (g.level > TOTAL_LEVELS) {
            g.won = true;
            g.gameOver = true;
          } else {
            g.bricks = createBricks();
            g.ballX = Math.floor(GRID_W / 2);
            g.ballY = GRID_H - 5;
            g.ballDX = Math.random() > 0.5 ? 1 : -1;
            g.ballDY = -1;
            g.paused = true;
            setTick((t) => t + 1);
            return;
          }
        }
      }

      // Paddle collision
      if (ny === GRID_H - 3 && nx >= g.paddleX - half && nx <= g.paddleX + half) {
        ndy = -1;
        ny = GRID_H - 4;
        // Angle based on where ball hits paddle
        const offset = nx - g.paddleX;
        if (Math.abs(offset) <= 1) {
          ndx = ndx !== 0 ? ndx : 1; // straight — keep current
        } else {
          ndx = offset > 0 ? 1 : -1;
        }
      }

      // Ball fell below paddle
      if (ny >= GRID_H - 1) {
        g.lives--;
        if (g.lives <= 0) {
          g.gameOver = true;
        } else {
          g.ballX = Math.floor(GRID_W / 2);
          g.ballY = GRID_H - 5;
          g.ballDX = Math.random() > 0.5 ? 1 : -1;
          g.ballDY = -1;
          g.paused = true;
        }
        setTick((t) => t + 1);
        return;
      }

      g.ballX = nx;
      g.ballY = ny;
      g.ballDX = ndx;
      g.ballDY = ndy;

      setTick((t) => t + 1);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  // Render
  const g = gs.current;

  const grid: string[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    grid[y] = new Array(GRID_W).fill(" ");
  }

  // Draw bricks
  for (const key of g.bricks) {
    const [x, y] = key.split(",").map(Number);
    if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) {
      const row = Math.min(y - 2, BRICK_ROWS - 1);
      grid[y][x] = BRICK_CHARS[Math.max(0, row)];
    }
  }

  // Draw paddle
  const half = Math.floor(PADDLE_W / 2);
  for (let i = -half; i <= half; i++) {
    const px = g.paddleX + i;
    if (px >= 0 && px < GRID_W) {
      if (i === -half) grid[GRID_H - 2][px] = "[";
      else if (i === half) grid[GRID_H - 2][px] = "]";
      else grid[GRID_H - 2][px] = "=";
    }
  }

  // Draw ball
  if (g.ballX >= 0 && g.ballX < GRID_W && g.ballY >= 0 && g.ballY < GRID_H) {
    grid[g.ballY][g.ballX] = "O";
  }

  const lines: string[] = [];
  lines.push("+" + "-".repeat(GRID_W) + "+");
  for (let y = 0; y < GRID_H; y++) {
    lines.push("|" + grid[y].join("") + "|");
  }
  lines.push("+" + "-".repeat(GRID_W) + "+");

  const livesStr = "\u2665".repeat(Math.max(0, g.lives));

  const { isMobile } = useResponsive();

  return (
    <div className={`flex flex-col h-full ${isMobile ? "p-1" : "p-4"} terminal-text overflow-hidden`}>
      <pre className={`font-mono ${isMobile ? "text-crt-small" : "text-crt-base"} leading-tight m-0`}>
        {`  BREAKOUT  |  Score: ${String(g.score).padStart(5, "0")}  |  Level: ${g.level}/${TOTAL_LEVELS}  |  Lives: ${livesStr}\n`}
        {`  A/D or Arrows: move  |  Space: launch  |  Q: quit\n\n`}
        {lines.join("\n")}
        {g.gameOver
          ? g.won
            ? `\n\n  VICTORY! All bricks destroyed! Final score: ${g.score}\n  Press Q to return to terminal.`
            : `\n\n  GAME OVER! Final score: ${g.score}\n  Press Q to return to terminal.`
          : g.paused
            ? "\n\n  Press SPACE to launch ball..."
            : ""}
      </pre>
    </div>
  );
}
