// src/pages/Log.jsx
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { listArchives, getArchiveContent } from '../utils/archive';

export default function Log() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track which entries are expanded
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function fetchArchives() {
      try {
        const dates = await listArchives();
        const archives = await Promise.all(
          dates.map(async (date) => {
            const content = await getArchiveContent(date);
            return { date, content: content || '*Empty entry*' };
          })
        );
        setLogs(archives);
      } catch (e) {
        console.error('Failed to fetch archives:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchArchives();
  }, []);

  const toggleExpand = (date) => {
    setExpanded(prev => ({ ...prev, [date]: !prev[date] }));
  };

  if (loading) return <div className="container"><h1>THE ARCHIVE</h1><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>THE ARCHIVE</h1>
      {logs.length === 0 ? <p>No archives yet.</p> : (
        logs.map((log) => (
          <div key={log.date} className="archive-box">
            <h2 onClick={() => toggleExpand(log.date)} style={{ cursor: 'pointer' }}>
              {log.date} {expanded[log.date] ? '▼' : '▶'}
            </h2>
            {expanded[log.date] && (
              <div 
                className="doc-content" 
                dangerouslySetInnerHTML={{ __html: marked.parse(log.content) }} 
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}