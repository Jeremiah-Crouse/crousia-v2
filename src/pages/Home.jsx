// src/pages/Home.jsx
import React, { useEffect } from 'react';
import Editor from '../components/Editor';
import { checkAndArchive } from '../utils/archive';

export default function Home() {
  useEffect(() => {
    checkAndArchive();
  }, []);

  return (
    <div className="container">
      <h1>The Daily Thoughts</h1>
      <p className="date-display">{new Date().toLocaleDateString()}</p>
      <div className="thoughts-label">TODAY'S ENTRY</div>
      <Editor uniqueId={location.pathname} />
    </div>
  );
}
