import { grantUnlock } from "./unlocks";

export interface EasterEggResult {
  output: string;
  eggId: string;
  startMeltdown?: boolean;
}

export function handleEasterEgg(
  command: string,
  args: string[]
): EasterEggResult | null {
  switch (command) {
    case "sudo": {
      return {
        output:
          "  [sudo] password for visitor: ********\n  Sorry, visitor is not in the sudoers file.\n  This incident will be reported.",
        eggId: "sudo",
      };
    }

    case "rm": {
      if (args.join(" ").includes("-rf") && args.some((a) => a.includes("/"))) {
        grantUnlock("glitch_theme");
        return {
          output: [
            "  rm: removing /system32/...",
            "  rm: removing /boot/kernel...",
            "  rm: fatal: filesystem corruption detected",
          ].join("\n"),
          eggId: "rm_rf",
          startMeltdown: true,
        };
      }
      return null;
    }

    case "exit": {
      return {
        output: [
          "  Logout denied.",
          "",
          "  You can check out any time you like,",
          "  but you can never leave.",
          "",
          "  (Try exploring with 'help' or 'cd ~/projects')",
        ].join("\n"),
        eggId: "exit",
      };
    }

    case "cowsay": {
      const message = args.join(" ") || "Moo! Check out this portfolio!";
      return {
        output: cowsay(message),
        eggId: "cowsay",
      };
    }

    case "whoami": {
      return {
        output:
          "  visitor\n\n  (But the real question is... who are we all, really?)",
        eggId: "whoami",
      };
    }

    case "ping": {
      const host = args[0] || "localhost";
      return {
        output: [
          `  PING ${host} (127.0.0.1): 56 data bytes`,
          `  64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.042 ms`,
          `  64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.038 ms`,
          `  64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.041 ms`,
          "",
          `  --- ${host} ping statistics ---`,
          `  3 packets transmitted, 3 packets received, 0% packet loss`,
        ].join("\n"),
        eggId: "ping",
      };
    }

    case "date": {
      return {
        output: `  ${new Date().toString()}`,
        eggId: "date",
      };
    }

    default:
      return null;
  }
}

function cowsay(message: string): string {
  const maxLen = 40;
  const words = message.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length + 1 > maxLen) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);

  const width = Math.max(...lines.map((l) => l.length));
  const border = "-".repeat(width + 2);

  const body =
    lines.length === 1
      ? `< ${lines[0].padEnd(width)} >`
      : lines
          .map((l, i) => {
            const open = i === 0 ? "/" : i === lines.length - 1 ? "\\" : "|";
            const close = i === 0 ? "\\" : i === lines.length - 1 ? "/" : "|";
            return `${open} ${l.padEnd(width)} ${close}`;
          })
          .join("\n");

  return [
    `   ${border}`,
    body,
    `   ${border}`,
    "          \\   ^__^",
    "           \\  (oo)\\_______",
    "              (__)\\       )\\/\\",
    "                  ||----w |",
    "                  ||     ||",
  ].join("\n");
}

export class KonamiTracker {
  private sequence = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  private progress = 0;

  handleKey(key: string): boolean {
    if (key === this.sequence[this.progress]) {
      this.progress++;
      if (this.progress === this.sequence.length) {
        this.progress = 0;
        return true;
      }
    } else {
      this.progress = key === this.sequence[0] ? 1 : 0;
    }
    return false;
  }
}
