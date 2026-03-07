// src/pages/Log.jsx
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { listArchives, getArchiveContent } from '../utils/archive';

export default function Log() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArchives() {
      try {
        const dates = await listArchives();
        console.log('📦 Archive dates:', dates);
        
        const archives = await Promise.all(
          dates.map(async (date) => {
            const content = await getArchiveContent(date);
            return {
              date,
              content: content || '*Empty entry*'
            };
          })
        );
        
        setLogs(archives);
      } catch (e) {
        console.error('Failed to fetch archives:', e);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchArchives();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h1>THE ARCHIVE</h1>
        <p>Loading archives...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>THE ARCHIVE</h1>
      {logs.length === 0 ? (
        <p>No archives yet.</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="doc-item">
            <div className="doc-date">{log.date}</div>
            <div 
              className="doc-content" 
              dangerouslySetInnerHTML={{ __html: marked.parse(log.content) }} 
            />
          </div>
        ))
      )}
    </div>
  );
}
