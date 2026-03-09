// src/components/Gatekeeper.jsx
import React, { useState, useEffect, useRef } from 'react';
import { UserContext } from '../context/UserContext';

export default function Gatekeeper({ children }) {
  const [name, setName] = useState(() => localStorage.getItem("crousia_user") || '');
  const [authorized, setAuthorized] = useState(() => !!localStorage.getItem("crousia_user"));
  
  // 1. Create a ref to attach to the input
  const inputRef = useRef(null);

  // 2. Autofocus on mount
  useEffect(() => {
    if (!authorized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [authorized]);

  const isPublicSite = window.location.hostname === "crousia.com";

  const handleLogin = () => {
    const validNames = ["King Jeremiah", "Queen Lauren"];
    if (validNames.includes(name)) {
      setAuthorized(true);
      localStorage.setItem("crousia_user", name);
    } else {
      window.location.href = "https://crousia.com";
    }
  };

  // 3. Trigger login on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogout = () => {
    setName('');
    setAuthorized(false);
    localStorage.removeItem("crousia_user");
    window.location.reload();
  };

  if (isPublicSite) {
    return (
        <UserContext.Provider value={{ name: name || "guest", handleLogout }}>
            {children}
        </UserContext.Provider>
    );
  }

  if (!authorized) {
    return (
      <div className="login-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2>Welcome to Crousia</h2>
        <input 
          ref={inputRef} // Attaching the ref here
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          onKeyDown={handleKeyDown} // Listen for Enter
          placeholder="Who are you?" 
          style={{ padding: '10px', marginBottom: '10px' }}
        />
        <button onClick={handleLogin} style={{ padding: '10px 20px' }}>Enter</button>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ name: authorized ? name : "guest", handleLogout }}>
        {children}
    </UserContext.Provider>
  );
}