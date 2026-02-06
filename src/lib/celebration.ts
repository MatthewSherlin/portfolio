const CELEBRATION_STORAGE_KEY = "portfolio_celebration_shown";

export function hasCelebrationBeenShown(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(CELEBRATION_STORAGE_KEY) === "true";
}

export function markCelebrationShown(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CELEBRATION_STORAGE_KEY, "true");
}

export function getCelebrationSequence(elapsed: string): string[] {
  return [
    [
      "",
      "  +------------------------------------------+",
      "  |                                          |",
      "  |         SYSTEM OVERRIDE DETECTED         |",
      "  |                                          |",
      "  |         FULL ACCESS GRANTED              |",
      "  |                                          |",
      "  +------------------------------------------+",
      "",
    ].join("\n"),

    [
      "",
      "                ___________",
      "               '._==_==_=_.'",
      "               .-\\\\:      /-.",
      "              | (|:.     |) |",
      "               '-|:.     |-'",
      "                 \\\\::.    /",
      "                  '::. .'",
      "                    ) (",
      "                  _.' '._",
      "                 '-------'",
      "",
      "        ★  100% COMPLETION ACHIEVED  ★",
      "",
    ].join("\n"),

    `  Completion time this session: ${elapsed}`,

    [
      "",
      "  New content unlocked:",
      "",
      "  Themes:   hotdog, vaporwave, c64, cga",
      "  Commands: disco, iddqd",
      "",
      "  Type 'theme --list' or 'help' to see them.",
      "",
    ].join("\n"),
  ];
}
