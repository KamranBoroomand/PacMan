(function (scope) {
  function createAudioEngine({ getSettings, canPlay, sfx, music, stepMs = 250, baseGain = 0.25 }) {
    let context = null;
    let master = null;
    let effects = null;
    let soundtrack = null;
    let paused = false;
    let lastStepAt = 0;
    let step = 0;
    let duckUntil = 0;

    function applySettings() {
      if (!context) return;
      const settings = getSettings();
      master.gain.setValueAtTime(settings.muted || paused ? 0 : baseGain * settings.volume / 100, context.currentTime);
      effects.gain.setValueAtTime(settings.sfxVolume / 100, context.currentTime);
      const duck = context.currentTime < duckUntil ? 0.35 : 1;
      soundtrack.gain.setValueAtTime(settings.musicEnabled ? settings.musicVolume / 100 * duck : 0, context.currentTime);
    }

    function prime() {
      const Context = scope.AudioContext || scope.webkitAudioContext;
      if (!Context) return null;
      if (!context) {
        context = new Context();
        master = context.createGain();
        effects = context.createGain();
        soundtrack = context.createGain();
        effects.connect(master); soundtrack.connect(master); master.connect(context.destination);
      }
      if (!paused && context.state === "suspended") context.resume().catch(() => {});
      applySettings();
      return context;
    }

    function tone(note, channel) {
      if (paused || !canPlay() || getSettings().muted) return;
      const ctx = prime();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + (note.offset || 0);
      const end = start + note.duration;
      osc.type = note.wave || "square";
      osc.frequency.setValueAtTime(note.frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(note.volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain); gain.connect(channel === "music" ? soundtrack : effects);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(start); osc.stop(end + 0.01);
    }

    return {
      prime,
      applySettings,
      setPaused(value) {
        paused = Boolean(value);
        applySettings();
        if (context) {
          const transition = paused ? context.suspend() : context.resume();
          transition.catch(() => {});
        }
      },
      play(type) {
        if (!Array.isArray(sfx[type]) || !canPlay() || paused) return;
        if (context) duckUntil = context.currentTime + 0.2;
        for (const note of sfx[type]) tone(note, "sfx");
        applySettings();
      },
      tick(now, active) {
        if (!active || !context || !canPlay() || paused) return;
        applySettings();
        const settings = getSettings();
        if (!settings.musicEnabled || settings.muted || now - lastStepAt < stepMs) return;
        lastStepAt = now;
        const note = music[step++ % music.length];
        if (note) tone(note, "music");
      },
      reset() { lastStepAt = 0; step = 0; duckUntil = 0; },
      dispose() {
        if (context) context.close().catch(() => {});
        context = null; master = null; effects = null; soundtrack = null;
      },
    };
  }
  const api = { createAudioEngine };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  scope.GameAudio = api;
})(globalThis);
