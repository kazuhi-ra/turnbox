import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@turnbox/react";
import type { TurnBoxRootHandle } from "@turnbox/react";

const SNS_LABELS = ["G+", "tw", "fb", "gh"];
const SNS_COLORS = ["#dd4b39", "#1da1f2", "#1877f2", "#333"];

type SnsState = "idle" | "loading";

const LoginForm = () => {
  const outerRef = useRef<TurnBoxRootHandle>(null);
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [snsState, setSnsState] = useState<SnsState[]>(["idle", "idle", "idle", "idle"]);

  const handleGo = () => {
    outerRef.current?.goTo(3);
    setTimeout(() => {
      setId("");
      setPass("");
    }, 450);
  };

  const handleSnsLogin = (index: number) => {
    setSnsState((prev) => prev.map((s, i) => (i === index ? "loading" : s)));
    setTimeout(() => {
      outerRef.current?.goTo(3);
      setTimeout(() => {
        setSnsState(["idle", "idle", "idle", "idle"]);
        setId("");
        setPass("");
      }, 450);
    }, 1000);
  };

  const inputStyle: React.CSSProperties = {
    width: "62%",
    padding: "7px 10px",
    border: "none",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  };

  return (
    <TurnBox.Root faces={3} width={340} height={87} even={320} duration={450} type="repeat" ref={outerRef}>
      <TurnBox.Face style={{ background: "#db0069", color: "white" }}>
        <TurnBox.Button
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            cursor: "pointer",
            background: "none",
            color: "white",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          LOGIN
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: "#ea0070",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "35px 0 0",
            width: "100%",
            textAlign: "center",
          }}
        >
          <li style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: "13%", fontSize: 14, textAlign: "right", marginRight: 17, color: "white" }}>
              ID
            </span>
            <input type="text" value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
          </li>
          <li style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: "13%", fontSize: 14, textAlign: "right", marginRight: 17, color: "white" }}>
              PASS
            </span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              style={inputStyle}
            />
          </li>
        </ul>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            margin: "15px 20px 0",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "white" }}>
            <TurnBox.Root faces={2} width={119} height={30} duration={300}>
              <TurnBox.Face style={{ background: "#b70058" }}>
                <TurnBox.Button
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    cursor: "pointer",
                    background: "none",
                    color: "white",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Remember Me
                </TurnBox.Button>
              </TurnBox.Face>
              <TurnBox.Face style={{ background: "#9e004b" }}>
                <TurnBox.Button
                  direction="prev"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    cursor: "pointer",
                    background: "none",
                    color: "white",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  ✓ Remember Me
                </TurnBox.Button>
              </TurnBox.Face>
            </TurnBox.Root>
          </div>

          <button
            type="button"
            style={{
              width: 136,
              height: 50,
              border: "none",
              cursor: "pointer",
              background: "#d80546",
              color: "white",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleGo}
          >
            GO
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            width: "100%",
            bottom: 0,
            background: "#d80546",
            padding: "10px 0",
            display: "flex",
            justifyContent: "center",
            gap: 20,
            boxSizing: "border-box",
          }}
        >
          {SNS_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                border: "none",
                cursor: snsState[i] === "loading" ? "default" : "pointer",
                background: snsState[i] === "loading" ? "#eee" : SNS_COLORS[i],
                color: "white",
                fontSize: snsState[i] === "loading" ? 11 : 13,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 100ms ease-in-out",
              }}
              onClick={() => snsState[i] === "idle" && handleSnsLogin(i)}
            >
              {snsState[i] === "loading" ? "..." : label}
            </button>
          ))}
        </div>
      </TurnBox.Face>

      <TurnBox.Face style={{ background: "#db0069", color: "white" }}>
        <TurnBox.Button
          direction="prev"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            cursor: "pointer",
            background: "none",
            color: "white",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          LOGIN SUCCEEDED
        </TurnBox.Button>
      </TurnBox.Face>
    </TurnBox.Root>
  );
};

const meta: Meta = {
  title: "examples/login-form",
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
      <LoginForm />
    </div>
  ),
};
