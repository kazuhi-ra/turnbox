import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";

const inputStyle: React.CSSProperties = {
  width: "65%",
  height: 20,
  padding: "8px 10px",
  border: "1px solid transparent",
  outline: "none",
  fontSize: 16,
  boxSizing: "border-box",
  background: "rgba(255,255,255,1)",
  transition: "all 240ms ease-in-out",
};

const inputLockStyle: React.CSSProperties = {
  ...inputStyle,
  background: "rgba(255,255,255,0)",
  borderColor: "rgba(0,0,0,0.15)",
};

const ContactForm = () => {
  const outerRef = useRef<TurnBoxRootHandle>(null);
  const confirmRef = useRef<TurnBoxRootHandle>(null);
  const [locked, setLocked] = useState(false);
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [message, setMessage] = useState("");

  const handleConfirm = () => {
    setLocked(true);
  };

  const handleCancel = () => {
    setLocked(false);
  };

  const handleSend = () => {
    outerRef.current?.goTo(3);
    setTimeout(() => {
      confirmRef.current?.goTo(1);
      setName("");
      setMail("");
      setMessage("");
      setLocked(false);
    }, 450);
  };

  return (
    <TurnBox.Root faces={3} width={340} height={87} even={400} duration={450} type="repeat" ref={outerRef}>
      <TurnBox.Face style={{ background: "#66b30d", color: "white" }}>
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
          CONTACT
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: "#6ec10e",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "30px 0 0",
            width: "100%",
            textAlign: "center",
          }}
        >
          <li style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: "13%", fontSize: 14, textAlign: "right", marginRight: 10, color: "white" }}>
              NAME
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={locked}
              style={locked ? inputLockStyle : inputStyle}
            />
          </li>
          <li style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: "13%", fontSize: 14, textAlign: "right", marginRight: 10, color: "white" }}>
              MAIL
            </span>
            <input
              type="text"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              disabled={locked}
              style={locked ? inputLockStyle : inputStyle}
            />
          </li>
        </ul>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={locked}
          style={{
            marginTop: 30,
            width: 306,
            height: 150,
            resize: "none",
            padding: "10px 20px",
            fontSize: 18,
            boxSizing: "border-box",
            border: "1px solid transparent",
            outline: "none",
            background: locked ? "rgba(255,255,255,0)" : "rgba(255,255,255,1)",
            borderColor: locked ? "rgba(0,0,0,0.15)" : "transparent",
            transition: "all 240ms ease-in-out",
          }}
        />

        <div style={{ marginTop: 23 }}>
          <TurnBox.Root
            faces={2}
            width={306}
            height={60}
            duration={300}
            ref={confirmRef}
            onChange={(face) => {
              if (face === 2) handleConfirm();
              if (face === 1) handleCancel();
            }}
          >
            <TurnBox.Face style={{ background: "#08870c" }}>
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
                CONFIRM
              </TurnBox.Button>
            </TurnBox.Face>

            <TurnBox.Face style={{ background: "#055708", display: "flex" }}>
              <TurnBox.Button
                direction="prev"
                style={{
                  width: "50%",
                  height: "100%",
                  border: "none",
                  cursor: "pointer",
                  background: "#444",
                  color: "white",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                CANCEL
              </TurnBox.Button>
              <button
                type="button"
                style={{
                  width: "50%",
                  height: "100%",
                  border: "none",
                  cursor: "pointer",
                  background: "#ad0505",
                  color: "white",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={handleSend}
              >
                SEND
              </button>
            </TurnBox.Face>
          </TurnBox.Root>
        </div>
      </TurnBox.Face>

      <TurnBox.Face style={{ background: "#66b30d", color: "white" }}>
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
          THANKS
        </TurnBox.Button>
      </TurnBox.Face>
    </TurnBox.Root>
  );
};

const meta: Meta = {
  title: "examples/contact-form",
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
      <ContactForm />
    </div>
  ),
};
