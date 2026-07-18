"use client";

import { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import { useTheme } from "@/presentation/hooks/useTheme";

/* ── SVG inline components ── */

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ManIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="3.2" r="2.5" />
      <line x1="10" y1="5.7" x2="10" y2="12.5" />
      <line x1="5.5" y1="9.5" x2="14.5" y2="9.5" />
      <line x1="10" y1="12.5" x2="7" y2="18" />
      <line x1="10" y1="12.5" x2="13" y2="18" />
      <line x1="7" y1="18" x2="6" y2="19.5" />
      <line x1="13" y1="18" x2="14" y2="19.5" />
    </svg>
  );
}

function WomanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="3.5" r="2.5" />
      <path d="M7.5,2 Q4.5,-0.5 4,5" />
      <path d="M12.5,2 Q15.5,-0.5 16,5" />
      <path d="M6.5,18 L10,7 L13.5,18 Z" />
      <line x1="5" y1="10" x2="7.5" y2="9" />
      <line x1="15" y1="10" x2="12.5" y2="9" />
      <line x1="7.5" y1="18" x2="6" y2="19.5" />
      <line x1="12.5" y1="18" x2="14" y2="19.5" />
    </svg>
  );
}

/* ── AntSwitch-style base ── */

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
  padding: 0,
  display: "flex",
  "&:active": {
    "& .MuiSwitch-thumb": {
      width: 15,
    },
    "& .MuiSwitch-switchBase.Mui-checked": {
      transform: "translateX(9px)",
    },
  },
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(12px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "var(--accent)",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
    width: 12,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(["width"], {
      duration: 200,
    }),
  },
  "& .MuiSwitch-track": {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: "var(--border)",
  },
}));

/* ── Component ── */

export function SliderToggle() {
  const { theme, palette, toggle, togglePalette } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }} suppressHydrationWarning>
        <SunIcon />
        <AntSwitch checked={false} disabled />
        <MoonIcon />
      </Stack>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <SunIcon />
        <AntSwitch
          checked={theme === "dark"}
          onChange={() => toggle()}
          slotProps={{ input: { "aria-label": "Cambiar tema claro/oscuro" } }}
        />
        <MoonIcon />
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <ManIcon />
        <AntSwitch
          checked={palette === "dunkin"}
          onChange={() => togglePalette()}
          slotProps={{ input: { "aria-label": "Cambiar paleta de colores" } }}
        />
        <WomanIcon />
      </Stack>
    </div>
  );
}
