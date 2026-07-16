"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Palette = "default" | "dunkin";

const THEME_KEY = "ryc-theme";
const PALETTE_KEY = "ryc-palette";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return getSystemTheme();
}

function getInitialPalette(): Palette {
  if (typeof window === "undefined") return "default";
  const stored = localStorage.getItem(PALETTE_KEY);
  if (stored === "dunkin") return "dunkin";
  return "default";
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function applyPalette(palette: Palette): void {
  document.documentElement.setAttribute("data-palette", palette);
}

export function useTheme(): {
  theme: Theme;
  palette: Palette;
  toggle: () => void;
  togglePalette: () => void;
} {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [palette, setPalette] = useState<Palette>(getInitialPalette);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    applyPalette(palette);
    localStorage.setItem(PALETTE_KEY, palette);
  }, [palette]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const togglePalette = useCallback(() => {
    setPalette((prev) => (prev === "dunkin" ? "default" : "dunkin"));
  }, []);

  return { theme, palette, toggle, togglePalette };
}
