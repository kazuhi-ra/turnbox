import React, { useRef, useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@turnbox/react";
import type { TurnBoxRootHandle } from "@turnbox/react";

const PALETTE = [
  "#e74c3c", "#c0392b", "#e67e22", "#d35400", "#f1c40f", "#f39c12",
  "#2ecc71", "#27ae60", "#1abc9c", "#16a085", "#3498db", "#2980b9",
  "#9b59b6", "#8e44ad", "#217ac0", "#1a6ba0", "#ecf0f1", "#bdc3c7",
  "#95a5a6", "#7f8c8d", "#2c3e50", "#34495e", "#ffffff", "#000000",
];

const isLight = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r + g + b > (255 * 3) / 2;
};

const ColorPicker = () => {
  const [color, setColor] = useState("#217ac0");
  const ref = useRef<TurnBoxRootHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pickColor = (c: string) => {
    setColor(c);
    ref.current?.goTo(1);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        ref.current?.goTo(1);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={containerRef}>
    <TurnBox.Root faces={2} width={340} height={87} even={200} duration={300} ref={ref}>
      <TurnBox.Face style={{ background: color, position: "relative" }}>
        <TurnBox.Button
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            cursor: "pointer",
            background: "none",
            fontSize: 18,
            color: isLight(color) ? "#2b2b2b" : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {color.toUpperCase()}
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: "#2b2b2b",
          padding: 16,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              style={{
                background: c,
                width: 32,
                height: 32,
                border: c === color ? "3px solid white" : "2px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                borderRadius: 4,
                boxSizing: "border-box",
              }}
              onClick={() => pickColor(c)}
            />
          ))}
        </div>
      </TurnBox.Face>
    </TurnBox.Root>
    </div>
  );
};

const meta: Meta = {
  title: "examples/color-picker",
  parameters: { controls: { disable: true } },
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#3a3a3a",
      }}
    >
      <ColorPicker />
    </div>
  ),
};
