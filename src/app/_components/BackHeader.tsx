"use client";

import type { ReactNode } from "react";
import type { IconButtonProps } from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PageHeader from "./PageHeader";

type BackHeaderProps = Readonly<{
  onBack: () => void;
  title: ReactNode;
  endContent?: ReactNode;
  icon?: ReactNode;
  headerSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  iconButtonSx?: SxProps<Theme>;
  iconButtonProps?: Partial<IconButtonProps>;
}>;

export default function BackHeader({
  onBack,
  title,
  endContent,
  icon,
  headerSx,
  titleSx,
  iconButtonSx,
  iconButtonProps,
}: BackHeaderProps) {
  const titleNode =
    typeof title === "string" ? (
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    ) : (
      title
    );
  const iconSx: SxProps<Theme> = [
    { mr: 1 },
    ...(Array.isArray(iconButtonSx) ? iconButtonSx : iconButtonSx ? [iconButtonSx] : []),
  ];
  const titleBoxSx: SxProps<Theme> = [
    { flexGrow: 1, display: "flex", alignItems: "center" },
    ...(Array.isArray(titleSx) ? titleSx : titleSx ? [titleSx] : []),
  ];

  return (
    <PageHeader sx={headerSx}>
      <IconButton edge="start" onClick={onBack} sx={iconSx} {...iconButtonProps}>
        {icon ?? <ArrowBackRoundedIcon />}
      </IconButton>
      <Box sx={titleBoxSx}>{titleNode}</Box>
      {endContent}
    </PageHeader>
  );
}
