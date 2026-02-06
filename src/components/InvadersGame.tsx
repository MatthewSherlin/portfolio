"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface InvadersGameProps {
  onExit: (score: number) => void;
}

type Point = [number, number];

const GRID_W = 44;
const GRID_H = 22;
const TICK_MS = 65;
const ALIEN_COLS = 10;
const ALIEN_ROWS = 4;
// Two frames per row for animation
const ALIEN_FRAMES: [string, string][] = [
  ["{o}", "{O}"],
  ["<X>", "<+>"],
  ["/M\\", "/W\\"],
  ["-v-", "-^-"],
];
// Points per row (top rows worth more)
const ROW_POINTS = [40, 30, 20, 10];

// Shields: arrays of [x,y] positions
function createShields(): Set<string> {
  const shields = new Set<string>();
  const shieldXPositions = [6, 16, 26, 36];
  for (const sx of shieldXPositions) {
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 4; dx++) {
        // Cut out the bottom-middle for the classic shield shape
        if (dy === 2 && (dx === 1 || dx === 2)) continue;
        shields.add(`${sx + dx},${GRID_H - 6 + dy}`);
      }
    }
  }
  return shields;
}

export function InvadersGame({ onExit }: InvadersGameProps) {
  const [playerX, setPlayerX] = useState(Math.floor(GRID_W / 2));
  const [aliens, setAliens] = useState<Point[]>(() => {
    const a: Point[] = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        a.push([c * 4 + 2, r * 2 + 1]);
      }
    }
    return a;
  });
  const [bullets, setBullets] = useState<Point[]>([]);
  const [alienBullets, setAlienBullets] = useState<Point[]>([]);
  const [shields, setShields] = useState<Set<string>>(createShields);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(4);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [alienDir, setAlienDir] = useState(1);

  const scoreRef = useRef(0);
  const dirRef = useRef(0);
  const shootRef = useRef(false);
  const tickRef = useRef(0);
  const alienSpeedRef = useRef(35); // ticks between alien moves (lower = faster)

  const handleExit = useCallback(() => {
    onExit(scoreRef.current);
  }, [onExit]);

  // Spawn next wave
  const spawnWave = useCallback((waveNum: number) => {
    const a: Point[] = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        a.push([c * 4 + 2, r * 2 + 1]);
      }
    }
    setAliens(a);
    setAlienDir(1);
    alienSpeedRef.current = Math.max(8, 18 - waveNum * 2);
    setBullets([]);
    setAlienBullets([]);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          dirRef.current = -2;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dirRef.current = 2;
          e.preventDefault();
          break;
        case " ":
          shootRef.current = true;
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
    if (gameOver) return;

    const interval = setInterval(() => {
      tickRef.current++;

      // Move player
      setPlayerX((px) => {
        const nx = px + dirRef.current;
        return Math.max(2, Math.min(GRID_W - 3, nx));
      });

      // Player shoot (max 2 on screen)
      if (shootRef.current) {
        shootRef.current = false;
        setPlayerX((px) => {
          setBullets((prev) => {
            if (prev.length < 3) {
              return [...prev, [px, GRID_H - 4] as Point];
            }
            return prev;
          });
          return px;
        });
      }

      // Move bullets up
      setBullets((prev) =>
        prev.map(([x, y]) => [x, y - 1] as Point).filter(([, y]) => y >= 0)
      );

      // Move alien bullets down
      setAlienBullets((prev) =>
        prev
          .map(([x, y]) => [x, y + 1] as Point)
          .filter(([, y]) => y < GRID_H)
      );

      // Alien shooting
      const shootChance = 24 - Math.min(wave * 3, 10);
      if (tickRef.current % Math.max(10, shootChance) === 0) {
        setAliens((currentAliens) => {
          if (currentAliens.length > 0) {
            const shooter =
              currentAliens[Math.floor(Math.random() * currentAliens.length)];
            setAlienBullets((prev) => [
              ...prev,
              [shooter[0], shooter[1] + 1] as Point,
            ]);
          }
          return currentAliens;
        });
      }

      // Move aliens — speed up as fewer remain
      setAliens((prevAliens) => {
        const dynamicSpeed = Math.max(
          8,
          alienSpeedRef.current - Math.floor((ALIEN_COLS * ALIEN_ROWS - prevAliens.length) / 12)
        );
        if (tickRef.current % dynamicSpeed !== 0) return prevAliens;

        setAlienDir((dir) => {
          const minX = Math.min(...prevAliens.map(([x]) => x));
          const maxX = Math.max(...prevAliens.map(([x]) => x));

          if ((dir > 0 && maxX >= GRID_W - 3) || (dir < 0 && minX <= 1)) {
            setAliens((a) => a.map(([x, y]) => [x, y + 1] as Point));
            return -dir;
          }
          setAliens((a) => a.map(([x, y]) => [x + dir, y] as Point));
          return dir;
        });
        return prevAliens;
      });

      // Collision: bullets hit aliens
      setBullets((currentBullets) => {
        const remainingBullets: Point[] = [];

        for (const b of currentBullets) {
          let hit = false;
          setAliens((currentAliens) => {
            for (let i = 0; i < currentAliens.length; i++) {
              const a = currentAliens[i];
              if (Math.abs(b[0] - a[0]) <= 1 && b[1] === a[1]) {
                hit = true;
                const row = Math.min(
                  ALIEN_ROWS - 1,
                  Math.floor((a[1] - 1) / 2)
                );
                const points = ROW_POINTS[Math.max(0, row)] || 10;
                const newScore = scoreRef.current + points;
                scoreRef.current = newScore;
                setScore(newScore);
                const next = [...currentAliens];
                next.splice(i, 1);
                return next;
              }
            }
            return currentAliens;
          });
          if (!hit) remainingBullets.push(b);
        }
        return remainingBullets;
      });

      // Bullets hit shields
      setBullets((prev) =>
        prev.filter((b) => {
          const key = `${b[0]},${b[1]}`;
          if (shields.has(key)) {
            setShields((s) => {
              const next = new Set(s);
              next.delete(key);
              return next;
            });
            return false;
          }
          return true;
        })
      );

      // Alien bullets hit shields
      setAlienBullets((prev) =>
        prev.filter((b) => {
          const key = `${b[0]},${b[1]}`;
          if (shields.has(key)) {
            setShields((s) => {
              const next = new Set(s);
              next.delete(key);
              return next;
            });
            return false;
          }
          return true;
        })
      );

      // Alien bullets hit player
      setAlienBullets((currentABullets) =>
        currentABullets.filter((b) => {
          let hitPlayer = false;
          setPlayerX((px) => {
            if (b[1] === GRID_H - 2 && Math.abs(b[0] - px) <= 1) {
              hitPlayer = true;
              setLives((l) => {
                const nl = l - 1;
                if (nl <= 0) setGameOver(true);
                return nl;
              });
            }
            return px;
          });
          return !hitPlayer;
        })
      );

      // Check win / loss
      setAliens((a) => {
        if (a.length === 0) {
          // Next wave!
          setWave((w) => {
            const nw = w + 1;
            if (nw > 3) {
              setWon(true);
              setGameOver(true);
            } else {
              spawnWave(nw);
            }
            return nw;
          });
        }
        if (a.some(([, y]) => y >= GRID_H - 5)) setGameOver(true);
        return a;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [gameOver, wave, shields, spawnWave]);

  // Render
  const animFrame = Math.floor(tickRef.current / 8) % 2;
  const grid: string[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    grid[y] = new Array(GRID_W).fill(" ");
  }

  // Draw shields
  for (const key of shields) {
    const [x, y] = key.split(",").map(Number);
    if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) {
      grid[y][x] = "#";
    }
  }

  // Draw aliens (3-char wide sprites)
  for (const [ax, ay] of aliens) {
    if (ay >= 0 && ay < GRID_H) {
      const row = Math.min(ALIEN_ROWS - 1, Math.floor((ay - 1) / 2));
      const sprite = ALIEN_FRAMES[Math.max(0, row)][animFrame];
      for (let i = 0; i < sprite.length; i++) {
        const x = ax - 1 + i;
        if (x >= 0 && x < GRID_W) {
          grid[ay][x] = sprite[i];
        }
      }
    }
  }

  // Draw bullets
  for (const [x, y] of bullets) {
    if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) grid[y][x] = "|";
  }

  // Draw alien bullets
  for (const [x, y] of alienBullets) {
    if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) grid[y][x] = ":";
  }

  // Draw player ship (5-char wide)
  const py = GRID_H - 2;
  if (playerX >= 2 && playerX < GRID_W - 2) {
    grid[py][playerX - 2] = "_";
    grid[py][playerX - 1] = "/";
    grid[py][playerX] = "A";
    grid[py][playerX + 1] = "\\";
    grid[py][playerX + 2] = "_";
  }

  const lines: string[] = [];
  lines.push("+" + "-".repeat(GRID_W) + "+");
  for (let y = 0; y < GRID_H; y++) {
    lines.push("|" + grid[y].join("") + "|");
  }
  lines.push("+" + "-".repeat(GRID_W) + "+");

  const livesStr = "\u2665".repeat(Math.max(0, lives));

  return (
    <div className="flex flex-col h-full p-4 terminal-text overflow-hidden">
      <pre className="font-mono text-sm leading-tight m-0">
        {`  SPACE INVADERS  |  Score: ${String(score).padStart(5, "0")}  |  Wave: ${wave}/3  |  Lives: ${livesStr}\n`}
        {`  A/D or Arrows: move  |  Space: fire  |  Q: quit\n\n`}
        {lines.join("\n")}
        {gameOver
          ? won
            ? `\n\n  VICTORY! You defended Earth! Final score: ${score}\n  Press Q to return to terminal.`
            : `\n\n  GAME OVER! Final score: ${score}\n  Press Q to return to terminal.`
          : ""}
      </pre>
    </div>
  );
}
