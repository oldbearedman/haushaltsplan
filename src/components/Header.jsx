export default function Header({ selectedUser, onBack, onOpenAdmin }) {
  return (
    <header>
      <button
        className="back-button"
        onClick={onBack}
        style={{ visibility: selectedUser ? "visible" : "hidden" }}
      >
        ←
      </button>

      <h1>Haushaltsplan</h1>

      <button
        className="menu-button"
        onClick={onOpenAdmin}
        style={{ visibility: selectedUser ? "visible" : "hidden" }}
      >
        ☰
      </button>
    </header>
  );
}
