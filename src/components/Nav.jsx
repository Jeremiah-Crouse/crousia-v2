import React from 'react';
import { clearSharedData } from '../utils/collaboration';

export default function Nav({ currentView, setView }) {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <img src="/crousia.png" alt="CROUSIA" className="nav-logo" />
      </div>
      <div className="nav-links">
        <a className={currentView === 'home' ? 'active' : ''} onClick={() => setView('home')}>HOME</a>
        <a className={currentView === 'log' ? 'active' : ''} onClick={() => setView('log')}>LOG</a>
        <a className={currentView === 'links' ? 'active' : ''} onClick={() => setView('links')}>LINKS</a>
      </div>
    </nav>
  );
}

