"use client";

import React from "react";

interface IonIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: string;
}

export function IonIcon({ icon, className, style, ...props }: IonIconProps) {
  if (!icon) return null;

  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ""}`}
      style={{
        WebkitMaskImage: `url("${icon}")`,
        maskImage: `url("${icon}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        backgroundColor: "currentColor",
        width: "1em",
        height: "1em",
        display: "inline-block",
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}
