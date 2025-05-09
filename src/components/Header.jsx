import React from "react";

export default function Header({ selectedUser, onBack, onOpenAdmin }) {
  return (
    <header>
      {selectedUser && (
        <button className="back-button" onClick={onBack}>
          ←
        </button>
      )}
      <h1>Haushaltsplan</h1>
      {selectedUser && (
        <button className="menu-button" onClick={onOpenAdmin}>
          ☰
        </button>
      )}
    </header>
  );
}
