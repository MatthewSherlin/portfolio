export function getTimeGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning! Early birds catch the bugs.";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon! Hope your day is compiling smoothly.";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening! Time for some after-hours hacking.";
  } else if (hour >= 21 || hour < 2) {
    return "Burning the midnight oil? Welcome, fellow night owl.";
  } else {
    return "It's late... or early? Either way, welcome.";
  }
}

export function getSessionUptime(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
