// src/components/Gatekeeper.jsx
import React, { useState } from 'react';

export default function Gatekeeper({ children }) {
  const [name, setName] = useState('');
  const [authorized, setAuthorized] = useState(false);
  
  // Check if we are already on the public site
  const isPublicSite = window.location.hostname === "crousia.com";

  // If public site, allow access immediately
  if (isPublicSite) {
    return children;
  }

  const handleLogin = () => {
    const validNames = ["King Jeremiah", "Queen Lauren"];
    if (validNames.includes(name)) {
      setAuthorized(true);
    } else {
      // Redirect unauthorized attempts on admin.crousia.com to public site
      window.location.href = "https://crousia.com";
    }
  };

  if (!authorized) {
    return (
      <div className="login-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2>Welcome to Crousia</h2>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Who are you?" 
          style={{ padding: '10px', marginBottom: '10px' }}
        />
        <button onClick={handleLogin} style={{ padding: '10px 20px' }}>Enter</button>
      </div>
    );
  }

  return children;
}