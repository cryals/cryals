import { useEffect, useRef, useState } from 'react';
import type { AudioPlayerState } from '../hooks/useAudioPlayer';
import type { tracks } from '../data/media.generated';

type Track = (typeof tracks)[number];

type MusicPlayerProps = {
  player: AudioPlayerState;
  track: Track | null;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export function MusicPlayer({ player, track }: MusicPlayerProps) {
  const volumeRef = useRef<HTMLInputElement>(null);
  const [coverState, setCoverState] = useState<'loading' | 'ready' | 'error'>('loading');
  const setVolumeRef = useRef(player.setVolume);
  setVolumeRef.current = player.setVolume;
  useEffect(() => {
    const input = volumeRef.current;
    if (!input) return;
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      setVolumeRef.current(Number(input.value) + (event.deltaY < 0 ? 0.05 : -0.05));
    };
    input.addEventListener('wheel', handleWheel, { passive: false });
    return () => input.removeEventListener('wheel', handleWheel);
  }, []);
  const displayedVolume = player.muted ? 0 : player.volume;
  return (
    <section className="music-panel panel" aria-labelledby="music-title">
      <audio ref={player.audioRef} src={track ? import.meta.env.BASE_URL + track.src.replace(/^\//, '') : undefined} preload="metadata" />
      <div className="panel-kicker">AUDIO</div>
      <div className="player-layout"><div className="player-main">
      <div className="track-row">
        <button className="icon-button play-button" type="button" onClick={() => void player.togglePlay()} aria-label={player.isPlaying ? 'Пауза' : 'Воспроизвести'} disabled={!track}>
          {coverState !== 'ready' && <span className="cover-fallback" aria-hidden="true">{coverState === 'loading' ? '···' : '♪'}</span>}
          {coverState !== 'error' && <img className="track-cover" src={import.meta.env.BASE_URL + 'music/cover.jpg'} alt="" onLoad={() => setCoverState('ready')} onError={() => setCoverState('error')} />}
          <span className="material-symbols-sharp" aria-hidden="true">{player.isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        {track?.externalUrl ? <a className="track-copy track-link" href={track.externalUrl} target="_blank" rel="noreferrer noopener">
          <strong id="music-title">{track.title}</strong><small>{track.artist}</small>
        </a> : <div className="track-copy">
          <strong id="music-title">{track?.title ?? 'AUDIO UNAVAILABLE'}</strong>
          <small>{track?.artist ?? 'NO MEDIA SOURCE'}</small>
        </div>}
      </div>
      <div className="timeline-row">
        <span>{formatTime(player.currentTime)}</span>
        <input
          aria-label="Позиция трека"
          type="range"
          min="0"
          max={player.duration || 0}
          step="0.1"
          value={Math.min(player.currentTime, player.duration || 0)}
          style={{ '--progress-fill': `${player.duration ? (player.currentTime / player.duration) * 100 : 0}%` } as React.CSSProperties}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => player.seek(Number(event.currentTarget.value))}
          disabled={!player.duration}
        />
        <span>{formatTime(player.duration)}</span>
      </div>
      </div>
      <div className="volume-row">
        <input ref={volumeRef} className="volume-slider"
          aria-label="Громкость"
          aria-valuetext={`${Math.round(displayedVolume * 100)}%`}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={displayedVolume}
          style={{ '--volume-fill': `${displayedVolume * 100}%` } as React.CSSProperties}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => player.setVolume(Number(event.currentTarget.value))}
          disabled={!track}
        />
        <span className="volume-value" aria-hidden="true">{Math.round(displayedVolume * 100)}%</span>
        {player.error ? <span className="audio-error" role="status">{player.error}</span> : null}
      </div>
      </div>
    </section>
  );
}
