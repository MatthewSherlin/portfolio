"use client";

import { useState, useEffect } from "react";

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isTouch: boolean;
  width: number;
  height: number;
}

function getState(): ResponsiveState {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isPortrait: false,
      isTouch: false,
      width: 1280,
      height: 800,
    };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  return {
    isMobile: w < 640,
    isTablet: w >= 640 && w <= 1024,
    isDesktop: w > 1024,
    isPortrait: h > w,
    isTouch,
    width: w,
    height: h,
  };
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(getState);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setState(getState()), 100);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return state;
}
