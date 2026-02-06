import { getResumeData } from "./resume-data";

export function generateNeofetch(
  sessionStart: number,
  themeLabel: string
): string {
  const d = getResumeData();
  const uptime = getUptime(sessionStart);

  const ascii = [
    "   .--------------.   ",
    "   |  .--------.  |   ",
    "   |  |M.SHERLN|  |   ",
    "   |  '--------'  |   ",
    "   '--------------'   ",
    "       |======|       ",
    "   ====+------+====   ",
  ];

  const res =
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}`
      : "unknown";

  const info = [
    "visitor@portfolio",
    "------------------",
    "OS: Portfolio OS v1.0",
    "Host: Next.js 16",
    "Kernel: React 19",
    `Uptime: ${uptime}`,
    "Packages: 18 (npm)",
    "Shell: portfolio-sh",
    `Terminal: CRT-${themeLabel.split(" ")[0]}`,
    `Resolution: ${res}`,
    `Theme: ${themeLabel}`,
    `Languages: ${d.skills[0].items.join(", ")}`,
  ];

  const maxAsciiLen = Math.max(...ascii.map((l) => l.length));
  const lines: string[] = [];
  const totalLines = Math.max(ascii.length, info.length);

  for (let i = 0; i < totalLines; i++) {
    const art = (ascii[i] || "").padEnd(maxAsciiLen + 3);
    const inf = info[i] || "";
    lines.push(art + inf);
  }

  return lines.join("\n");
}

function getUptime(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m} mins`;
  return `${s} secs`;
}
