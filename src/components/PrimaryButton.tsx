"use client";

import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

export function PrimaryButton({ label, className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={[
        "w-full rounded-xl px-4 py-4 text-lg font-semibold",
        "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
        "disabled:opacity-50 disabled:cursor-not-allowed transition",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}
