"use client";

import type { ReactNode } from "react";
import { AppBar, Toolbar } from "@mui/material";
import { alpha } from "@mui/material/styles";

type PageHeaderProps = {
  children: ReactNode;
};

export default function PageHeader({ children }: PageHeaderProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={(theme) => ({
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: alpha(theme.palette.background.default, 0.95),
        backdropFilter: "blur(10px)",
      })}
    >
      <Toolbar>{children}</Toolbar>
    </AppBar>
  );
}
