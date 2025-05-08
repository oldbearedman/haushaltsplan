// src/components/NetworkIndicator.jsx
import React, { useState, useEffect } from "react";
import "./NetworkIndicator.css";

export default function NetworkIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <div className={`network-indicator ${online ? 'online' : 'offline'}`}>
      {online ? "🟢 Online" : "🔴 Offline"}
    </div>
  );
}
