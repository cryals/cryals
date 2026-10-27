import { useEffect, useState } from 'react';
import { CursorEffects } from './components/CursorEffects';
import { CursorTrail } from './components/CursorTrail';
import { GithubStats } from './components/GithubStats';
import { MusicPlayer } from './components/MusicPlayer';
import { NeuralGlow } from './components/NeuralGlow';
import { SocialLinks } from './components/SocialLinks';
import { backgrounds, avatars, tracks } from './data/media.generated';
import { profile } from './data/profile';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { randomImage, randomItem } from './lib/media-randomizer';

// Select once per page load, including in React Strict Mode.
const assetUrl = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');
const initialAvatar = randomImage(avatars.map(assetUrl), 'als-previous-avatar');
const initialBackground = randomImage(backgrounds.map(assetUrl), 'als-previous-background');

export default function App() {
  const [avatar] = useState(initialAvatar);
  const [background, setBackground] = useState(initialBackground);
  const [track] = useState(() => randomItem(tracks));
  const player = useAudioPlayer(track ? assetUrl(track.src) : null);
  const [locked, setLocked] = useState(true);
  const [entering, setEntering] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  function enter() {
    if (entering) return;
    setEntering(true);
    if (track) void player.togglePlay();
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600;
    window.setTimeout(() => setLocked(false), delay);
  }

  return (
    <main className="page-shell" onCopy={(event) => event.preventDefault()} onCut={(event) => event.preventDefault()}>
      {background ? <img className="page-background" src={background} alt="" onError={() => setBackground(null)} /> : null}
      <div className="background-overlay" aria-hidden="true" />
      <NeuralGlow />
      <CursorTrail />
      <CursorEffects />

      {locked && <button className={`entry-screen${entering ? ' is-entering' : ''}`} type="button" onClick={enter} aria-label="Открыть страницу и включить музыку">
        <span className="entry-scan" aria-hidden="true" />
        <span className="entry-center">
          <span className="entry-clock">{new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(clock)}</span>
          <span className="entry-logo" role="img" aria-label="STOPCO" />
        </span>
      </button>}

      <button className="global-sound icon-button" type="button" onClick={player.toggleMute} aria-label={player.muted ? 'Включить звук' : 'Выключить звук'} disabled={!track || locked}>
        <span className="material-symbols-sharp" aria-hidden="true">{player.muted ? 'volume_off' : 'volume_up'}</span>
      </button>

      <article className={`identity-card${locked ? '' : ' is-unlocked'}`} inert={locked}>
        <header className="profile-header">
          <div className="avatar-frame">
            {avatar ? <img src={avatar} alt="AL-S avatar" /> : <span>AL</span>}
            <i aria-hidden="true" />
          </div>
          <div className="identity-copy">
            <h1>{profile.displayName}</h1>
            <p>СОЗДАЮ ШТУКИ. ИНОГДА ОНИ РАБОТАЮТ.</p>
          </div>
          <div className="location-badge">
            <span className="material-symbols-sharp" aria-hidden="true">location_on</span>
            <span>{profile.location}</span>
          </div>
        </header>

        <div className="card-rule"><span>КОНТАКТЫ</span></div>
        <SocialLinks />
        <MusicPlayer player={player} track={track} />
        <GithubStats username={profile.github} />

        <footer className="card-footer">
          <span>© {new Date().getFullYear()} AL-S</span>
          <span>STOPCO.RU</span>
        </footer>
      </article>
    </main>
  );
}
