/** Multi-phase recovery sequence for the `restore` command. */

interface RecoveryLine {
  text: string;
  delay: number;
}

export function getRecoverySequence(): RecoveryLine[] {
  const sectors = Math.floor(Math.random() * 9000) + 1000;
  const checksum = Math.random().toString(16).slice(2, 10);

  return [
    { text: "  SYSTEM RECOVERY v2.1", delay: 0 },
    { text: "  ====================", delay: 100 },
    { text: "", delay: 200 },
    { text: "  [PHASE 1] Scanning disk sectors...", delay: 400 },
    { text: `  Sectors scanned: ${sectors}/` + sectors, delay: 800 },
    { text: "  Filesystem integrity: COMPROMISED", delay: 400 },
    { text: "", delay: 200 },
    { text: "  [PHASE 2] Rebuilding filesystem...", delay: 600 },
    { text: "  ░░░░░░░░░░░░░░░░░░░░ 0%", delay: 300 },
    { text: "  ████░░░░░░░░░░░░░░░░ 20%", delay: 400 },
    { text: "  ████████░░░░░░░░░░░░ 40%", delay: 350 },
    { text: "  ████████████░░░░░░░░ 60%", delay: 300 },
    { text: "  ████████████████░░░░ 80%", delay: 350 },
    { text: "  ████████████████████ 100%", delay: 300 },
    { text: "", delay: 200 },
    { text: "  [PHASE 3] Restoring system configs...", delay: 500 },
    { text: `  Checksum: 0x${checksum} ... VERIFIED`, delay: 600 },
    { text: "  Theme subsystem: RESTORED", delay: 300 },
    { text: "  Filesystem: REBUILT", delay: 300 },
    { text: "  Permissions: RESET", delay: 300 },
    { text: "", delay: 200 },
    { text: "  [PHASE 4] Rebooting...", delay: 600 },
    { text: "", delay: 400 },
    { text: "  ✓ System restored successfully.", delay: 500 },
    { text: "  All data recovered. Welcome back.", delay: 300 },
  ];
}
