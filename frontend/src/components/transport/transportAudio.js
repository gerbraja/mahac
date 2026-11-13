// Audio notifications using Web Audio API (zero external assets required)
class TransportAudioManager {
  constructor() {
    this.ctx = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenInterval = null;
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Timbre sonoro para nuevo viaje entrante al Radar (armónico suave tipo timbre de hotel / llegada)
   */
  playNewTripChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Nota 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Nota 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);

      // Nota 3: 1174.66 Hz (D6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1174.66, now + 0.35);
      gain3.gain.setValueAtTime(0.3, now + 0.35);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.35);
      osc3.stop(now + 0.9);

      // Vibración de teléfono móvil
      if (navigator.vibrate) {
        navigator.vibrate([250, 100, 250]);
      }
    } catch (e) {
      console.warn("Error reproduciendo sonido de nuevo viaje:", e);
    }
  }

  /**
   * Alerta sonora de Contraoferta / Subasta (doble beep rápido tipo campana de negociación)
   */
  playCounterOfferBeep() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Beep 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(740, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Beep 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.4);

      if (navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
    } catch (e) {
      console.warn("Error reproduciendo sonido de contraoferta:", e);
    }
  }

  /**
   * Sirena de alarma SOS / Pánico (sonido oscilante agudo de emergencia)
   */
  startPanicSiren() {
    try {
      this.stopPanicSiren();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.sirenOsc = osc;
      this.sirenGain = gain;

      let high = false;
      this.sirenInterval = setInterval(() => {
        if (!this.sirenOsc || !this.ctx) return;
        high = !high;
        const targetFreq = high ? 950 : 650;
        this.sirenOsc.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.25);
      }, 300);

      if (navigator.vibrate) {
        navigator.vibrate([400, 150, 400, 150, 400]);
      }
    } catch (e) {
      console.warn("Error iniciando sirena de pánico:", e);
    }
  }

  stopPanicSiren() {
    try {
      if (this.sirenInterval) {
        clearInterval(this.sirenInterval);
        this.sirenInterval = null;
      }
      if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
        this.sirenOsc = null;
      }
      if (this.sirenGain) {
        this.sirenGain.disconnect();
        this.sirenGain = null;
      }
    } catch (e) {
      // Ignorar errores al detener
    }
  }
}

export const transportAudio = new TransportAudioManager();
