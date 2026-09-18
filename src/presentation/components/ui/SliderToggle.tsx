"use client";

import { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import { useTheme } from "@/presentation/hooks/useTheme";
import { Icon } from "@/presentation/components/ui/Icon";

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
        <Icon name="sun" size={14} />
        <AntSwitch checked={false} disabled />
        <Icon name="moon" size={14} />
      </Stack>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <Icon name="sun" size={14} />
        <AntSwitch
          checked={theme === "dark"}
          onChange={() => toggle()}
          slotProps={{ input: { "aria-label": "Cambiar tema claro/oscuro" } }}
        />
        <Icon name="moon" size={14} />
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <Icon name="person-man" size={14} strokeWidth={1.2} />
        <AntSwitch
          checked={palette === "dunkin"}
          onChange={() => togglePalette()}
          slotProps={{ input: { "aria-label": "Cambiar paleta de colores" } }}
        />
        <Icon name="person-woman" size={14} strokeWidth={1.2} />
      </Stack>
    </div>
  );
}
