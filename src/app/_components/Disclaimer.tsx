"use client";

import { Box, Stack, Typography } from "@mui/material";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";

type DisclaimerProps = {
  text?: string;
  variant?: "default" | "beforeFooter";
  withNotice?: boolean;
};

const DEFAULT_TEXT =
  "Este aplicativo é informativo e pode cometer erros. Consulte um profissional para orientações.";

export default function Disclaimer({
  text = DEFAULT_TEXT,
  variant = "default",
  withNotice = false,
}: DisclaimerProps) {
  const spacing =
    variant === "beforeFooter"
      ? { mt: withNotice ? 3 : 5, mb: 4 }
      : { mt: 5, mb: 2 };

  return (
    <Box sx={{ ...spacing, p: 2, bgcolor: "action.hover", borderRadius: 1.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <InfoRoundedIcon sx={{ fontSize: 20, color: "text.secondary", mt: 0.2 }} />
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, fontSize: "0.7rem" }}>
          {text}
        </Typography>
      </Stack>
    </Box>
  );
}
