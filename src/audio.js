export function createAudio() {
  let ctx;
  let enabled = true;
  const voices = new Set();
  const stopAll = () => {
    for (const oscillator of voices) oscillator.stop();
    voices.clear();
  };
  return {
    setEnabled(value) { enabled = value; if (!value) stopAll(); },
    unlock() { ctx ??= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); },
    play(event) {
      const config = {fire:[650,220,.07,.025],kill:[160,45,.15,.06],hit:[110,30,.35,.09],wave:[320,820,.4,.045],bonus:[500,1000,.3,.05]}[event];
      if (!ctx || !enabled || !config) return;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      voices.add(oscillator);
      oscillator.onended = () => {
        voices.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };
      const time = ctx.currentTime;
      oscillator.type = event === 'fire' ? 'triangle' : 'square';
      oscillator.frequency.setValueAtTime(config[0], time);
      oscillator.frequency.exponentialRampToValueAtTime(config[1], time + config[2]);
      gain.gain.setValueAtTime(config[3], time);
      gain.gain.exponentialRampToValueAtTime(.001, time + config[2]);
      oscillator.start();
      oscillator.stop(time + config[2]);
    },
    dispose() { stopAll(); if (ctx) ctx.close(); },
  };
}
