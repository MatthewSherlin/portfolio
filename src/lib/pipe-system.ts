export interface PipeableResult {
  text: string;
}

export function parsePipeline(input: string): string[] {
  const segments: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (const ch of input) {
    if ((ch === '"' || ch === "'") && !inQuote) {
      inQuote = true;
      quoteChar = ch;
      current += ch;
    } else if (ch === quoteChar && inQuote) {
      inQuote = false;
      current += ch;
    } else if (ch === "|" && !inQuote) {
      segments.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  segments.push(current.trim());
  return segments.filter(Boolean);
}

export function applyFilter(
  filter: string,
  input: PipeableResult
): PipeableResult {
  const parts = filter.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "grep": {
      const pattern = args.join(" ").toLowerCase();
      if (!pattern) return { text: "grep: no pattern provided" };
      const lines = input.text
        .split("\n")
        .filter((line) => line.toLowerCase().includes(pattern));
      return { text: lines.join("\n") || "(no matches)" };
    }

    case "head": {
      const n = parseInt(args[0]) || 10;
      const lines = input.text.split("\n").slice(0, n);
      return { text: lines.join("\n") };
    }

    case "tail": {
      const n = parseInt(args[0]) || 10;
      const lines = input.text.split("\n").slice(-n);
      return { text: lines.join("\n") };
    }

    case "sort": {
      const lines = input.text.split("\n").sort();
      return { text: lines.join("\n") };
    }

    case "wc": {
      const lines = input.text.split("\n");
      const words = input.text.split(/\s+/).filter(Boolean);
      return {
        text: `  ${lines.length} lines  ${words.length} words  ${input.text.length} chars`,
      };
    }

    case "uniq": {
      const lines = input.text.split("\n");
      const unique = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
      return { text: unique.join("\n") };
    }

    default:
      return { text: `pipe: command not found: ${cmd}` };
  }
}
