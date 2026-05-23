import React, { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";

const TAB_LABELS = ["TAB1", "TAB2", "TAB3"];
const CONTENT_LABELS = ["CONTENT 1", "CONTENT 2", "CONTENT 3"];

const Tab = () => {
  const contentRef = useRef<TurnBoxRootHandle>(null);
  const tabRef0 = useRef<TurnBoxRootHandle>(null);
  const tabRef1 = useRef<TurnBoxRootHandle>(null);
  const tabRef2 = useRef<TurnBoxRootHandle>(null);
  const tabRefs = [tabRef0, tabRef1, tabRef2];

  useEffect(() => {
    tabRef0.current?.goTo(2);
  }, []);

  const handleTabChange = (tabIndex: number, face: number) => {
    if (face === 2) {
      tabRefs.forEach((ref, i) => {
        if (i !== tabIndex) ref.current?.goTo(1);
      });
      contentRef.current?.goTo(tabIndex + 1);
    }
  };

  const tabBtnStyle: React.CSSProperties = {
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
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 0 }}>
        {tabRefs.map((ref, i) => (
          <TurnBox.Root
            key={i}
            faces={2}
            width={264}
            height={60}
            duration={350}
            ref={ref}
            onChange={(face) => handleTabChange(i, face)}
          >
            <TurnBox.Face style={{ background: "rgba(0,0,0,0.5)" }}>
              <TurnBox.Button style={tabBtnStyle}>{TAB_LABELS[i]}</TurnBox.Button>
            </TurnBox.Face>
            <TurnBox.Face
              style={{
                background: "#0094ef",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {TAB_LABELS[i]}
            </TurnBox.Face>
          </TurnBox.Root>
        ))}
      </div>

      <TurnBox.Root faces={3} width={796} height={150} duration={350} type="skip" axis="Y" ref={contentRef}>
        {CONTENT_LABELS.map((label) => (
          <TurnBox.Face
            key={label}
            style={{
              background: "#e2e2e2",
              color: "#3f3f3f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            {label}
          </TurnBox.Face>
        ))}
      </TurnBox.Root>
    </div>
  );
};

const meta: Meta = {
  title: "examples/tab",
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
      }}
    >
      <Tab />
    </div>
  ),
};
