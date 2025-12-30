"use client";

import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

export function SecondaryButton({ label, className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={[
        "w-full rounded-xl px-4 py-4 text-lg font-semibold",
        "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300",
        "disabled:opacity-50 disabled:cursor-not-allowed transition",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}
