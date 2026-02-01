"use client";

import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { UI_TEXTS } from "@/lib/constants";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import Notice from "./Notice";

type FeedbackActionsProps = Readonly<{
  label?: string;
  canCopy: boolean;
  canSpeak: boolean;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  onCopy: () => void;
  onShare?: () => void;
  feedbackChoice: "up" | "down" | null;
  feedbackValue: "up" | "down" | null;
  feedbackReason?: string | null;
  feedbackSent: boolean;
  feedbackLoading: boolean;
  feedbackError?: string | null;
  onFeedbackUp: () => void;
  onFeedbackDown: () => void;
  onFeedbackReason: (reason: string) => void;
  reasons?: string[];
}>;

const DEFAULT_REASONS = ["Incompleta", "Confusa", "Errada", "Outro"];

export default function FeedbackActions({
  label,
  canCopy,
  canSpeak,
  isSpeaking,
  onToggleSpeak,
  onCopy,
  onShare,
  feedbackChoice,
  feedbackValue,
  feedbackReason,
  feedbackSent,
  feedbackLoading,
  feedbackError,
  onFeedbackUp,
  onFeedbackDown,
  onFeedbackReason,
  reasons = DEFAULT_REASONS,
}: FeedbackActionsProps) {
  const disableFeedback = feedbackLoading || feedbackSent;
  const showReasons = feedbackChoice === "down" && !feedbackSent;
  const speakLabel = isSpeaking ? UI_TEXTS.SPEAK_STOP : UI_TEXTS.SPEAK_START;
  const isUpSelected = feedbackChoice === "up" || feedbackValue === "up";
  const isDownSelected = feedbackChoice === "down" || feedbackValue === "down";

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: "wrap" }}>
        {label && (
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {label}
          </Typography>
        )}
        <Tooltip title="Marcar como positivo">
          <IconButton
            size="small"
            onClick={onFeedbackUp}
            aria-label="Marcar como positivo"
            disabled={disableFeedback}
            color={feedbackValue === "up" ? "success" : "default"}
          >
            {isUpSelected ? (
              <ThumbUpAltRoundedIcon fontSize="small" />
            ) : (
              <ThumbUpOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Marcar como negativo">
          <IconButton
            size="small"
            onClick={onFeedbackDown}
            aria-label="Marcar como negativo"
            disabled={disableFeedback}
            color={feedbackValue === "down" ? "error" : "default"}
          >
            {isDownSelected ? (
              <ThumbDownAltRoundedIcon fontSize="small" />
            ) : (
              <ThumbDownOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Copiar resposta">
          <span>
            <IconButton
              size="small"
              onClick={onCopy}
              disabled={!canCopy}
              aria-label="Copiar resposta"
            >
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        {onShare && (
          <Tooltip title="Compartilhar">
            <span>
              <IconButton size="small" onClick={onShare} aria-label="Compartilhar">
                <IosShareRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip title={speakLabel}>
          <span>
            <IconButton
              size="small"
              onClick={onToggleSpeak}
              disabled={!canSpeak && !isSpeaking}
              aria-label={speakLabel}
            >
              {isSpeaking ? (
                <StopCircleRoundedIcon fontSize="small" />
              ) : (
                <VolumeUpRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        {feedbackLoading && <CircularProgress size={14} />}
      </Stack>
      {showReasons && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
          {reasons.map((reason) => (
            <Chip
              key={reason}
              label={reason}
              size="small"
              variant={feedbackReason === reason ? "filled" : "outlined"}
              onClick={() => onFeedbackReason(reason)}
              disabled={feedbackLoading}
            />
          ))}
        </Box>
      )}
      {feedbackSent && (
        <Typography variant="caption" color="text.secondary">
          Obrigado pelo feedback.
        </Typography>
      )}
      {feedbackError && <Notice severity="warning">{feedbackError}</Notice>}
    </Stack>
  );
}
