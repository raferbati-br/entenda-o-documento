"use client";

import type { ReactNode } from "react";
import type { ButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import { Button, Stack } from "@mui/material";

import ActionBar from "./ActionBar";

type FooterAction = {
  label: string;
  startIcon?: ReactNode;
  onClick?: ButtonProps["onClick"];
  href?: ButtonProps["href"];
  component?: ButtonProps["component"];
  disabled?: boolean;
  disableRipple?: boolean;
  disableFocusRipple?: boolean;
  variant?: "contained" | "outlined";
  sx?: SxProps<Theme>;
};

type FooterActionsProps = {
  primary: FooterAction;
  secondary?: FooterAction;
  leadingContent?: ReactNode;
  actionBarSx?: SxProps<Theme>;
};

const BASE_BUTTON_SX: SxProps<Theme> = {
  flex: 1,
  height: 56,
  fontWeight: 700,
};

const OUTLINED_SX: SxProps<Theme> = {
  borderWidth: 2,
  "&:hover": { borderWidth: 2 },
};

const CONTAINED_SX: SxProps<Theme> = {
  fontSize: "1rem",
  boxShadow: "0 8px 16px rgba(0,102,204,0.2)",
};

function buildButtonSx(variant: "contained" | "outlined", extra?: SxProps<Theme>) {
  const variantSx = variant === "outlined" ? OUTLINED_SX : CONTAINED_SX;
  if (!extra) return [BASE_BUTTON_SX, variantSx];
  return Array.isArray(extra) ? [BASE_BUTTON_SX, variantSx, ...extra] : [BASE_BUTTON_SX, variantSx, extra];
}

export default function FooterActions({ primary, secondary, leadingContent, actionBarSx }: FooterActionsProps) {
  const primaryVariant = primary.variant ?? "contained";
  const secondaryVariant = secondary?.variant ?? "outlined";
  const secondaryComponentProps = secondary?.component ? { component: secondary.component } : {};
  const primaryComponentProps = primary.component ? { component: primary.component } : {};

  return (
    <ActionBar sx={actionBarSx}>
      <Stack spacing={2}>
        {leadingContent}
        <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
          {secondary && (
            <Button
              variant={secondaryVariant}
              size="large"
              startIcon={secondary.startIcon}
              onClick={secondary.onClick}
              href={secondary.href}
              disabled={secondary.disabled}
              disableRipple={secondary.disableRipple}
              disableFocusRipple={secondary.disableFocusRipple}
              sx={buildButtonSx(secondaryVariant, secondary.sx)}
              {...secondaryComponentProps}
            >
              {secondary.label}
            </Button>
          )}
          <Button
            variant={primaryVariant}
            size="large"
            startIcon={primary.startIcon}
            onClick={primary.onClick}
            href={primary.href}
            disabled={primary.disabled}
            disableRipple={primary.disableRipple}
            disableFocusRipple={primary.disableFocusRipple}
            sx={buildButtonSx(primaryVariant, primary.sx)}
            {...primaryComponentProps}
          >
            {primary.label}
          </Button>
        </Stack>
      </Stack>
    </ActionBar>
  );
}
