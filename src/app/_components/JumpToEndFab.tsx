"use client";

import { Fab, SvgIcon } from "@mui/material";
import { alpha } from "@mui/material/styles";

type JumpToEndFabProps = {
  show: boolean;
  onClick: () => void;
  bottom: number;
  ariaLabel?: string;
};

export default function JumpToEndFab({ show, onClick, bottom, ariaLabel }: JumpToEndFabProps) {
  if (!show) return null;

  return (
    <Fab
      size="small"
      aria-label={ariaLabel || "Ir para o fim"}
      onClick={onClick}
      sx={(theme) => ({
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom,
        zIndex: theme.zIndex.appBar + 2,
        width: 28,
        height: 28,
        minWidth: 28,
        minHeight: 28,
        padding: 0,
        borderRadius: "50%",
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
        boxShadow: "none",
        "&:hover": {
          bgcolor: theme.palette.background.paper,
          borderColor: alpha(theme.palette.text.primary, 0.18),
        },
      })}
    >
      <SvgIcon viewBox="0 0 24 24" sx={{ fontSize: 22, opacity: 0.9 }} fill="none">
        <path d="M12 3.5v10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path
          d="M5.5 12.5L12 19l6.5-6.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </SvgIcon>
    </Fab>
  );
}
