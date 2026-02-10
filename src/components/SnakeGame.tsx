"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useResponsive } from "@/hooks/useResponsive";

interface SnakeGameProps {
  onExit: (score: number) => void;
}

type Direction = "up" | "down" | "left" | "right";
type Point = [number, number];

const GRID_W = 44;
const GRID_H = 22;
const TICK_MS = 100;

function randomPos(exclude: Point[]): Point {
  let pos: Point;
  do {
    pos = [
      Math.floor(Math.random() * GRID_W),
      Math.floor(Math.random() * GRID_H),
    ];
  } while (exclude.some(([x, y]) => x === pos[0] && y === pos[1]));
  return pos;
}

export function SnakeGame({ onExit }: SnakeGameProps) {
  const initialSnake: Point[] = [[22, 11], [21, 11], [20, 11]];
  const [snake, setSnake] = useState<Point[]>(initialSnake);
  const [food, setFood] = useState<Point>(() => randomPos(initialSnake));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const dirRef = useRef<Direction>("right");
  const nextDirRef = useRef<Direction>("right");
  const scoreRef = useRef(0);

  const handleExit = useCallback(() => {
    onExit(scoreRef.current);
  }, [onExit]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const d = dirRef.current;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (d !== "down") nextDirRef.current = "up";
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (d !== "up") nextDirRef.current = "down";
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (d !== "right") nextDirRef.current = "left";
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (d !== "left") nextDirRef.current = "right";
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

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleExit]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setSnake((prev) => {
        // Apply queued direction
        dirRef.current = nextDirRef.current;
        const dir = dirRef.current;

        const head: Point = [...prev[0]];
        switch (dir) {
          case "up":
            head[1]--;
            break;
          case "down":
            head[1]++;
            break;
          case "left":
            head[0]--;
            break;
          case "right":
            head[0]++;
            break;
        }

        // Wall collision
        if (
          head[0] < 0 ||
          head[0] >= GRID_W ||
          head[1] < 0 ||
          head[1] >= GRID_H
        ) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some(([x, y]) => x === head[0] && y === head[1])) {
          setGameOver(true);
          return prev;
        }

        const newSnake: Point[] = [head, ...prev];

        // Food collision
        if (head[0] === food[0] && head[1] === food[1]) {
          const newScore = scoreRef.current + 10;
          scoreRef.current = newScore;
          setScore(newScore);
          setFood(randomPos(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [gameOver, food]);

  // Render the grid
  const lines: string[] = [];
  lines.push("+" + "-".repeat(GRID_W) + "+");

  for (let y = 0; y < GRID_H; y++) {
    let row = "|";
    for (let x = 0; x < GRID_W; x++) {
      const isHead = snake[0][0] === x && snake[0][1] === y;
      const isBody =
        !isHead && snake.some(([sx, sy]) => sx === x && sy === y);
      const isFood = food[0] === x && food[1] === y;

      if (isHead) row += "@";
      else if (isBody) row += "o";
      else if (isFood) row += "*";
      else row += " ";
    }
    row += "|";
    lines.push(row);
  }

  lines.push("+" + "-".repeat(GRID_W) + "+");

  const { isMobile } = useResponsive();

  return (
    <div className={`flex flex-col h-full ${isMobile ? "p-1" : "p-4"} terminal-text overflow-hidden`}>
      <pre className={`font-mono ${isMobile ? "text-crt-small" : "text-crt-base"} leading-tight m-0`}>
        {`  SNAKE  |  Score: ${score}  |  WASD/Arrows: move, Q: quit\n\n`}
        {lines.join("\n")}
        {gameOver
          ? `\n\n  GAME OVER! Final score: ${score}\n  Press Q to return to terminal.`
          : ""}
      </pre>
    </div>
  );
}
