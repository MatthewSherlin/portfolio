"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  onComplete?: () => void;
  enabled?: boolean;
}

export function useTypewriter({
  text,
  speed = 10,
  onComplete,
  enabled = true,
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(!enabled);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }
    setDisplayedText("");
    setIsComplete(false);
  }, [text, enabled]);

  useEffect(() => {
    if (!enabled || isComplete) return;
    if (displayedText.length >= text.length) {
      setIsComplete(true);
      onCompleteRef.current?.();
      return;
    }

    const nextChar = text[displayedText.length];
    let delay = speed;
    if (nextChar === "\n") delay = speed * 2;
    else if (nextChar === "." || nextChar === ":") delay = speed * 1.3;
    else delay = speed + Math.random() * speed * 0.25;

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, displayedText.length + 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [displayedText, text, speed, enabled, isComplete]);

  const skip = useCallback(() => {
    setDisplayedText(text);
    setIsComplete(true);
    onCompleteRef.current?.();
  }, [text]);

  return { displayedText, isComplete, skip };
}
