"use client";

/** SMPTE color bar test pattern. */
export function ColorBars() {
  // Standard SMPTE color bars
  const topBars = [
    { color: "#c0c0c0", flex: 1 }, // Gray
    { color: "#c0c000", flex: 1 }, // Yellow
    { color: "#00c0c0", flex: 1 }, // Cyan
    { color: "#00c000", flex: 1 }, // Green
    { color: "#c000c0", flex: 1 }, // Magenta
    { color: "#c00000", flex: 1 }, // Red
    { color: "#0000c0", flex: 1 }, // Blue
  ];

  // Reverse mini bars (bottom section)
  const midBars = [
    { color: "#0000c0", flex: 1 },
    { color: "#131313", flex: 1 },
    { color: "#c000c0", flex: 1 },
    { color: "#131313", flex: 1 },
    { color: "#00c0c0", flex: 1 },
    { color: "#131313", flex: 1 },
    { color: "#c0c0c0", flex: 1 },
  ];

  const bottomBars = [
    { color: "#00214c", flex: 3 },
    { color: "#ffffff", flex: 2 },
    { color: "#32006a", flex: 3 },
    { color: "#131313", flex: 6 },
    { color: "#090909", flex: 1 },
    { color: "#131313", flex: 1 },
    { color: "#1d1d1d", flex: 1 },
    { color: "#131313", flex: 3 },
  ];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#000" }}>
      {/* Top 67% — main color bars */}
      <div className="flex flex-1" style={{ flex: "67" }}>
        {topBars.map((bar, i) => (
          <div key={i} style={{ flex: bar.flex, background: bar.color }} />
        ))}
      </div>

      {/* Middle 8% — reverse bars */}
      <div className="flex" style={{ flex: "8" }}>
        {midBars.map((bar, i) => (
          <div key={i} style={{ flex: bar.flex, background: bar.color }} />
        ))}
      </div>

      {/* Bottom 25% — PLUGE + gradient */}
      <div className="flex" style={{ flex: "25" }}>
        {bottomBars.map((bar, i) => (
          <div key={i} style={{ flex: bar.flex, background: bar.color }} />
        ))}
      </div>
    </div>
  );
}
