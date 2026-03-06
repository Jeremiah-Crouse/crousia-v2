import React, { useState, useRef } from 'react';

export default function Audio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src="/Deepdeep.m4a" onEnded={() => setIsPlaying(false)} />
      <button className="audio-toggle" onClick={togglePlay}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <span className="audio-label">Deepdeep</span>
    </div>
  );
}
