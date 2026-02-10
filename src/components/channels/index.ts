export interface Channel {
  id: number;
  name: string;
  label: string;
}

export const CHANNELS: Channel[] = [
  { id: 1, name: "terminal", label: "TERMINAL" },
  { id: 2, name: "dvd", label: "DVD LOGO" },
  { id: 3, name: "banjo", label: "BANJO-KAZOOIE" },
  { id: 4, name: "bars", label: "COLOR BARS" },
  { id: 5, name: "static", label: "STATIC" },
];

export function getChannelById(id: number): Channel | undefined {
  return CHANNELS.find((c) => c.id === id);
}

export function getChannelByName(name: string): Channel | undefined {
  return CHANNELS.find((c) => c.name === name.toLowerCase());
}
