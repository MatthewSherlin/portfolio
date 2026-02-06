export function handleEasterEgg(
  command: string,
  args: string[]
): { output: string; eggId: string } | null {
  switch (command) {
    case "sudo": {
      const sub = args.join(" ").toLowerCase();
      if (sub.startsWith("hire")) {
        return {
          output: [
            "  [sudo] password for visitor: ********",
            "",
            "  REQUEST APPROVED.",
            "",
            "  Initiating hiring sequence...",
            "  ████████████████████████ 100%",
            "",
            "  Just kidding! But I appreciate the enthusiasm.",
            "  Feel free to reach out: type 'contact' for details.",
          ].join("\n"),
          eggId: "sudo_hire",
        };
      }
      return {
        output:
          "  [sudo] password for visitor: ********\n  Sorry, visitor is not in the sudoers file.\n  This incident will be reported.",
        eggId: "sudo",
      };
    }

    case "rm": {
      if (args.join(" ").includes("-rf") && args.some((a) => a.includes("/"))) {
        return {
          output: [
            "  Deleting system32...",
            "  Removing all node_modules/ (this may take a while)...",
            "  Erasing browser history...",
            "  Deleting photos of your cat...",
            "  Purging embarrassing search history...",
            "  rm: cannot remove '/dev/humor': Device or resource busy",
            "",
            "  Just kidding! This is a virtual filesystem.",
            "  Nothing was harmed in the making of this easter egg.",
            "",
            "  Try 'tree' to see what's actually here.",
          ].join("\n"),
          eggId: "rm_rf",
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

    case "vim":
    case "emacs":
    case "nano": {
      const rival = command === "vim" ? "emacs" : "vim";
      return {
        output: `  Nice try. This terminal only supports ${rival}.\n  (Just kidding. Type 'help' for available commands.)`,
        eggId: `editor_${command}`,
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
