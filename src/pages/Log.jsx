import React, { useEffect, useState } from 'react';
import { marked } from 'marked';

export default function Log() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // We assume the editor saves to 'crousia_logs' in localStorage
    const saved = JSON.parse(localStorage.getItem('crousia_logs') || '[]');
    setLogs(saved);
  }, []);

  return (
    <div className="container">
      <h1>THE ARCHIVE</h1>
      {logs.map((log, i) => (
        <div key={i} className="doc-item">
          <div className="doc-date">{log.date}</div>
          {/* This injects the rendered Markdown */}
          <div 
            className="doc-content" 
            dangerouslySetInnerHTML={{ __html: marked.parse(log.content) }} 
          />
        </div>
      ))}
    </div>
  );
}

