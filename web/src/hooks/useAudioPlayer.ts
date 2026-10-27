import { useEffect, useRef, useState } from 'react';

export type AudioPlayerState = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  error: string | null;
  isPlaying: boolean;
  muted: boolean;
  volume: number;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlay: () => Promise<void>;
};

export function useAudioPlayer(source: string | null): AudioPlayerState {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  // The slider is perceptual; the media element receives squared gain.
  const [volume, setVolumeState] = useState(0.2);
  const lastAudibleVolume = useRef(0.2);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(source ? null : 'AUDIO UNAVAILABLE');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.04;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => setError('AUDIO UNAVAILABLE');

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('loadedmetadata', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('loadedmetadata', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [source]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !source) return;
    setError(null);
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setError(audio.error ? 'AUDIO UNAVAILABLE' : 'PRESS PLAY TO START');
      }
    } else {
      audio.pause();
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    if (volume === 0) {
      setVolume(lastAudibleVolume.current);
      return;
    }
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  function setVolume(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const nextVolume = Math.min(1, Math.max(0, value));
    audio.volume = nextVolume * nextVolume;
    if (nextVolume > 0) lastAudibleVolume.current = nextVolume;
    audio.muted = false;
    setMuted(false);
    setVolumeState(nextVolume);
  }

  function seek(time: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }

  return { audioRef, currentTime, duration, error, isPlaying, muted, volume, seek, setVolume, toggleMute, togglePlay };
}
