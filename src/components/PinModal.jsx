// src/components/PinModal.jsx
import React from "react";
import "./PinModal.css";

export default function PinModal({ onClose, onInput, pinLength = 4, currentPinLength = 0 }) {
  // Anzeige: currentPinLength gefüllte Punkte
  const dots = Array.from({ length: pinLength }, (_, i) => (
    <span key={i} className="pin-dot">
      {i < currentPinLength ? "•" : ""}
    </span>
  ));

  const handleKey = (digit) => {
    onInput(digit);
  };

  return (
    <div className="menu-modal-overlay" onClick={onClose}>
      <div className="menu-modal pin-modal" onClick={e => e.stopPropagation()}>
        <div className="pin-display">{dots}</div>
        <div className="pin-keypad">
          {["1","2","3","4","5","6","7","8","9"].map(d => (
            <button
              key={d}
              className="pin-key"
              onClick={() => handleKey(d)}
            >
              {d}
            </button>
          ))}
          {/* Leere Stellen, damit 0 unter der 8 steht */}
          <div className="pin-key empty" />
          <button className="pin-key" onClick={() => handleKey("0")}>0</button>
          <div className="pin-key empty" />
        </div>
      </div>
    </div>
  );
}
