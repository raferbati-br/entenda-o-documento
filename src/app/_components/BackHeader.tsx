"use client";

import type { ReactNode } from "react";
import type { IconButtonProps } from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PageHeader from "./PageHeader";

type BackHeaderProps = {
  onBack: () => void;
  title: ReactNode;
  endContent?: ReactNode;
  icon?: ReactNode;
  headerSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  iconButtonSx?: SxProps<Theme>;
  iconButtonProps?: Partial<IconButtonProps>;
};

type SxPrimitive = SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);

function mergeSx(base: SystemStyleObject<Theme>, extra?: SxProps<Theme>): SxProps<Theme> {
  if (!extra) return base;
  if (Array.isArray(extra)) return [base, ...extra];
  return [base, extra as SxPrimitive];
}

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
  const iconSx = mergeSx({ mr: 1 }, iconButtonSx);
  const titleBoxSx = mergeSx({ flexGrow: 1, display: "flex", alignItems: "center" }, titleSx);

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
