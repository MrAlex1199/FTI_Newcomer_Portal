/**
 * Native Web Audio API Sound Synthesizer for FTI Chat
 * 
 * Provides crisp, zero-dependency sound effects for message events
 * with user-controllable mute preferences stored in localStorage.
 */

const STORAGE_KEY = 'fti_chat_sound_muted';

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const isSoundMuted = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

export const setSoundMuted = (muted) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
};

export const toggleSoundMuted = () => {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
};

/**
 * Play synthesized sound effect
 * @param {'send' | 'receive' | 'pop'} type
 */
export const playNotificationSound = (type = 'receive') => {
  if (isSoundMuted()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'send') {
      // Gentle soft swoosh-pop on outgoing message
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'receive') {
      // Two-tone friendly crystal chime on incoming message
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.07); // A5

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.08, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.18);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.28);
    } else {
      // Generic subtle click/pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (err) {
    // Gracefully ignore audio errors (e.g., autoplay restrictions before first user gesture)
  }
};
