// src/components/PinModal.jsx
import React, { useState } from "react";
import "./PinModal.css";

export default function PinModal({ currentPinLength, onInput, onClose }) {
  const [display, setDisplay] = useState(["", "", "", ""]);

  const handleDigit = (d) => {
    if (display.filter(Boolean).length >= 4) return;
    const next = [...display];
    next[next.findIndex((v) => !v)] = d;
    setDisplay(next);
    onInput(d);
  };

  const handleBack = () => {
    const filled = display.filter(Boolean).length;
    if (filled === 0) return;
    const next = [...display];
    next[filled - 1] = "";
    setDisplay(next);
    onInput(null); // ← hier das löschen kommunizieren
  };

  return (
    <div className="pin-overlay" onClick={onClose}>
      <div className="pin-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Gib deine PIN ein</h2>
        <div className="pin-display">
          {display.map((d, i) => (
            <div key={i} className="pin-dot">
              {d ? "●" : ""}
            </div>
          ))}
        </div>
        <div className="pin-keypad">
          {["1","2","3","4","5","6","7","8","9","←","0"].map((k) =>
            k === "←" ? (
              <button key={k} className="key key-back" onClick={handleBack}>
                ←
              </button>
            ) : (
              <button key={k} className="key" onClick={() => handleDigit(k)}>
                {k}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
