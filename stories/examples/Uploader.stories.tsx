import React, { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@turnbox/react";
import type { TurnBoxRootHandle } from "@turnbox/react";

const Uploader = () => {
  const rootRef = useRef<TurnBoxRootHandle>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = () => {
    const barEl = barRef.current;
    if (!barEl) return;

    const barWidth = barEl.parentElement?.offsetWidth ?? 340;
    let loading = 0;
    let time = 1000 / 600;

    const tick = () => {
      if (loading > barWidth * 0.65) time *= 1.1;
      if (loading > barWidth * 0.75) {
        time = 1;
        loading += 2;
      } else {
        loading += 1;
      }

      barEl.style.width = `${loading}px`;

      if (loading >= barWidth) {
        rootRef.current?.goTo(3);
        setTimeout(() => {
          barEl.style.width = "0px";
        }, 450);
        return;
      }

      timerRef.current = setTimeout(tick, time);
    };

    timerRef.current = setTimeout(tick, time);
  };

  const handleChange = (face: number) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (face === 2) {
      timerRef.current = setTimeout(startLoading, 1000);
    }
  };

  return (
    <TurnBox.Root
      faces={3}
      width={340}
      height={87}
      even={5}
      duration={450}
      type="repeat"
      direction="negative"
      ref={rootRef}
      onChange={handleChange}
    >
      <TurnBox.Face style={{ background: "#ed4100", color: "white" }}>
        <TurnBox.Button
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            color: "white",
          }}
        >
          UPLOAD
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face style={{ background: "#ba3300", overflow: "hidden" }}>
        <div
          ref={barRef}
          style={{
            width: 0,
            height: "100%",
            background: "#db1716",
          }}
        />
      </TurnBox.Face>

      <TurnBox.Face style={{ background: "#83d912", color: "white" }}>
        <TurnBox.Button
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            color: "white",
          }}
        >
          COMPLETE
        </TurnBox.Button>
      </TurnBox.Face>
    </TurnBox.Root>
  );
};

const meta: Meta = {
  title: "examples/uploader",
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
      <Uploader />
    </div>
  ),
};
