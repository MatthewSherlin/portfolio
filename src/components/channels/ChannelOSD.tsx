"use client";

import { useEffect, useState } from "react";

interface ChannelOSDProps {
  channelId: number;
  channelLabel: string;
  show: boolean;
}

/** On-screen display showing channel number + name, fades after 2s. */
export function ChannelOSD({ channelId, channelLabel, show }: ChannelOSDProps) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!show) return;

    setVisible(true);
    setOpacity(1);

    // Start fade after 1.5s
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 1500);

    // Hide completely after 2.5s
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show, channelId]);

  if (!visible) return null;

  return (
    <div
      className="absolute top-4 right-4 font-mono text-white pointer-events-none"
      style={{
        zIndex: 15,
        opacity,
        transition: "opacity 1s ease-out",
        textShadow: "0 0 10px rgba(255,255,255,0.5), 2px 2px 0 rgba(0,0,0,0.8)",
      }}
    >
      <div className="text-3xl font-bold tracking-wider">CH {channelId}</div>
      <div className="text-sm tracking-widest mt-1">{channelLabel}</div>
    </div>
  );
}
