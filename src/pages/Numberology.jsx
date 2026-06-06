import React, { useState, useEffect } from 'react';
import CrousianText from '../components/CrousianText';

const CROUSIAN_ORDER = {
  'N': 1, 'A': 2, 'G': 3, 'B': 4, 'D': 5, 'H': 6, 'P': 7, 'E': 8, 'W': 9,
  'O': 10, 'F': 11, 'S': 12, 'C': 13, 'J': 14, 'K': 15, 'Q': 16, 'I': 17,
  'Y': 18, 'T': 19, 'Z': 20, 'U': 21, 'X': 22, 'V': 23, 'M': 24, 'R': 25, 'L': 26
};

function compute(word) {
  const upper = word.toUpperCase();
  let total = 0;
  for (const ch of upper) {
    if (CROUSIAN_ORDER[ch]) total += CROUSIAN_ORDER[ch];
  }
  let root = total;
  while (root > 9) {
    let s = 0;
    let t = root;
    while (t > 0) { s += t % 10; t = Math.floor(t / 10); }
    root = s;
  }
  return { total, root };
}

const EXAMPLES = ['Crousmark', 'Crousia', 'Breath', 'Lauren', 'Jeremiah', 'Gold'];

export default function Numberology() {
  const [word, setWord] = useState('Crousmark');
  const [result, setResult] = useState(() => compute('Crousmark'));

  useEffect(() => {
    setResult(compute(word.trim() || ''));
  }, [word]);

  return (
    <div style={{
      maxWidth: '650px', margin: '2rem auto', padding: '0 1.5rem'
    }}>
      <CrousianText text="Numberology" size={0.8} />
      <p style={{ color: '#8f9bb3', fontStyle: 'italic', margin: '0.5rem 0 1.8rem 0', fontSize: '0.9rem' }}>
        positions of the Crousian alphabet
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.6rem' }}>
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => setWord(ex)}
            style={{
              background: '#1e2538', padding: '0.4rem 1rem', borderRadius: '2rem',
              fontSize: '0.8rem', cursor: 'pointer', color: '#c9b578', border: 'none'
            }}>
            {ex}
          </button>
        ))}
      </div>

      <label style={{ display: 'block', color: '#e4d9c5', marginBottom: '0.5rem' }}>
        enter a word or name
      </label>
      <input type="text" value={word} onChange={e => setWord(e.target.value)}
        placeholder="e.g., Crousmark, Queen, Breath"
        style={{
          width: '100%', padding: '0.9rem 1rem', fontSize: '1.2rem',
          background: '#0f111a', border: '1px solid #2c3245', borderRadius: '1.5rem',
          color: '#f5efdf', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box'
        }} />

      {word.trim() && (
        <div style={{
          background: '#0c0f17', borderRadius: '1.5rem', padding: '1.2rem 1.5rem',
          border: '1px solid #2e3548', marginTop: '2rem'
        }}>
          <div style={{
            fontSize: '1.5rem', fontWeight: 500, wordBreak: 'break-word',
            color: '#f2e8cf', borderBottom: '1px dashed #3a415a',
            paddingBottom: '0.5rem', marginBottom: '1rem',
            display: 'flex', justifyContent: 'space-between'
          }}>
            <span>{word.trim()}</span>
            <span style={{ fontSize: '0.8rem', color: '#8f9bb3' }}>Crousian</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', margin: '0.8rem 0' }}>
            <span>full sum (positional)</span>
            <span style={{ fontFamily: 'monospace', fontSize: '1.7rem', fontWeight: 700, color: '#fff' }}>
              {result.total}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', margin: '0.8rem 0' }}>
            <span>reduced digital root</span>
            <span style={{
              fontFamily: 'monospace', fontSize: '2.2rem', fontWeight: 800,
              background: '#1e2538', padding: '0.3rem 1rem', borderRadius: '3rem'
            }}>
              {result.root}
            </span>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', fontSize: '0.7rem', color: '#5a647f', marginTop: '1.8rem' }}>
        Crousian numberology · breath standard · kingdom of Crousia
      </footer>
    </div>
  );
}
