"use client";

import React, { useMemo } from "react";
import r6operators from "r6operators";

type OperatorIconProps = {
  name: string;
  size?: number;
  className?: string;
  showFallbackText?: boolean;
};

export function normalizeOpKey(opName: string): string {
  if (!opName) return "";
  let key = opName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  if (key === "nkk") return "nokk";
  if (key === "skpos" || key === "skops") return "skopos";
  return key;
}

export function OperatorIcon({
  name,
  size = 24,
  className = "",
  showFallbackText = true,
}: OperatorIconProps) {
  const svgHtml = useMemo(() => {
    const key = normalizeOpKey(name);
    const opObj = (r6operators as Record<string, any>)[key];
    if (opObj && typeof opObj.toSVG === "function") {
      try {
        return opObj.toSVG({
          width: size,
          height: size,
          class: `r6-op-svg ${className}`,
        });
      } catch (e) {
        console.error(`Error rendering SVG for ${name}:`, e);
      }
    }
    return null;
  }, [name, size, className]);

  if (!svgHtml) {
    if (!showFallbackText) return null;
    return (
      <span
        className={`op-icon-badge-fallback ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, Math.floor(size * 0.4)) }}
        title={name}
      >
        {name ? name.slice(0, 2).toUpperCase() : "?"}
      </span>
    );
  }

  return (
    <span
      className="r6-op-icon-wrapper"
      style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      title={name}
    />
  );
}
