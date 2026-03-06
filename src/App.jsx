import React, { useState } from 'react';
import Nav from './components/Nav';
import Audio from './components/Audio';
import Home from './pages/Home';
import Log from './pages/Log';
import Links from './pages/Links';
import './App.css';

export default function App() {
  const [view, setView] = useState('home');

  return (
    <div className="site-wrapper">
      <Nav currentView={view} setView={setView} />
      <Audio />
      <main className="container">
        {view === 'home' && <Home />}
        {view === 'log' && <Log />}
        {view === 'links' && <Links />}
      </main>
    </div>
  );
}

