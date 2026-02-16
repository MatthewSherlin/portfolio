import { getTimeGreeting } from "./time-utils";

export interface BootMessage {
  text: string;
  delay: number;
  typeSpeed: number;
}

export function getBootSequence(): BootMessage[] {
  return [
    {
      text: "BIOS v2.4.1 ... OK",
      delay: 300,
      typeSpeed: 0,
    },
    {
      text: "Memory check ... 640K OK",
      delay: 200,
      typeSpeed: 0,
    },
    {
      text: "Loading portfolio.sys ...",
      delay: 400,
      typeSpeed: 0,
    },
    {
      text: "",
      delay: 500,
      typeSpeed: 0,
    },
    {
      text: [
        "+--------------------------------------+",
        "|                                      |",
        "|   MATTHEW SHERLIN                    |",
        "|   Senior Software Engineer           |",
        "|                                      |",
        "|   Portfolio Terminal v2.0             |",
        "|                                      |",
        "+--------------------------------------+",
      ].join("\n"),
      delay: 200,
      typeSpeed: 0,
    },
    {
      text: "",
      delay: 100,
      typeSpeed: 0,
    },
    {
      text: getTimeGreeting(),
      delay: 200,
      typeSpeed: 0,
    },
    {
      text: 'System ready. Type "help" to see available commands.\nTip: Try Tab for autocomplete, or cd ~/projects to explore.',
      delay: 300,
      typeSpeed: 20,
    },
  ];
}

// Keep backward-compatible export for the boot sequence
export const bootSequence = getBootSequence();
