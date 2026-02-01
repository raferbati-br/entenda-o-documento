"use client";

import { useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { ERROR_MESSAGES } from "@/lib/constants";

type PinchZoomImageProps = Readonly<{
  src?: string | null;
  alt: string;
  errorMessage?: string;
  minZoom?: number;
  maxZoom?: number;
  containerSx?: SxProps<Theme>;
}>;

function getPinchDistance(touches: TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function normalizeContainerSx(containerSx?: SxProps<Theme>) {
  if (!containerSx) return [];
  return Array.isArray(containerSx) ? containerSx : [containerSx];
}

export default function PinchZoomImage({
  src,
  alt,
  errorMessage,
  minZoom = 1,
  maxZoom = 3,
  containerSx,
}: PinchZoomImageProps) {
  const [zoom, setZoom] = useState(1);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);

  function clampZoom(nextZoom: number) {
    return Math.min(maxZoom, Math.max(minZoom, nextZoom));
  }

  return (
    <Box
      onTouchStart={(e) => {
        if (e.touches.length !== 2) return;
        pinchStartDistanceRef.current = getPinchDistance(e.touches as unknown as TouchList);
        pinchStartScaleRef.current = zoom;
      }}
      onTouchMove={(e) => {
        if (e.touches.length !== 2 || !pinchStartDistanceRef.current) return;
        e.preventDefault();
        const distance = getPinchDistance(e.touches as unknown as TouchList);
        const nextZoom = clampZoom(pinchStartScaleRef.current * (distance / pinchStartDistanceRef.current));
        setZoom(Number(nextZoom.toFixed(2)));
      }}
      onTouchEnd={(e) => {
        if (e.touches.length < 2) {
          pinchStartDistanceRef.current = null;
        }
      }}
      onTouchCancel={() => {
        pinchStartDistanceRef.current = null;
      }}
      sx={[
        {
          flexGrow: 1,
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          pt: 7,
          pb: 12,
          bgcolor: "#000",
          position: "relative",
          touchAction: "none",
        },
        ...normalizeContainerSx(containerSx),
      ]}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        />
      ) : (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {errorMessage || ERROR_MESSAGES.DOCUMENT_UNAVAILABLE_SHORT}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
