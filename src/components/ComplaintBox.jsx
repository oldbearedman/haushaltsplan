import React, { useState } from 'react';

export default function ComplaintBox({ onSubmit }) {
  const [message, setMessage] = useState('');

  return (
    <div className="complaint-box">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Beschwerde hier eingeben..."
      />
      <button
        onClick={() => {
          onSubmit(message);
          setMessage('');
        }}
      >
        Abschicken
      </button>
    </div>
  );
}