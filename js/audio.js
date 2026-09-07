/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * 100% Offline Procedural Sound Engine & Synth Music via Web Audio API
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isInitialized = false;
    this.isMuted = false;

    // Music State
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmTempo = 118; // BPM
    this.bgmBaseKey = 44; // F minor / synth root
    this.tensionMode = false;

    this.settings = {
      master: CONFIG.AUDIO.MASTER_VOLUME,
      sfx: CONFIG.AUDIO.SFX_VOLUME,
      music: CONFIG.AUDIO.MUSIC_VOLUME
    };
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Node
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.settings.sfx, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.settings.music, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;

      // Resume context if suspended by browser
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes(master, sfx, music) {
    this.settings.master = Utils.clamp(master, 0, 1);
    this.settings.sfx = Utils.clamp(sfx, 0, 1);
    this.settings.music = Utils.clamp(music, 0, 1);

    if (this.isInitialized && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.settings.master, now, 0.05);
      this.sfxGain.gain.setTargetAtTime(this.settings.sfx, now, 0.05);
      this.musicGain.gain.setTargetAtTime(this.settings.music, now, 0.05);
    }
  }

  // ==========================================
  // PROCEDURAL SOUND EFFECTS
  // ==========================================

  playShoot(isPlayer = true) {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = isPlayer ? 'sawtooth' : 'triangle';
      const startFreq = isPlayer ? 680 : 540;
      const endFreq = isPlayer ? 140 : 110;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.14);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playHit(isShield = false) {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (isShield) {
        // Metallic shield deflection
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.13);
      } else {
        // Physical hit / impact thud with noise
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.Q.setValueAtTime(3.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.08);
      }
    } catch (e) {}
  }

  playDash() {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.10);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.18);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.18);
    } catch (e) {}
  }

  playAbilityShockwave() {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Low sub bass drop
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(240, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 0.45);

      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.46);

      // Resonant sweep
      const sweep = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(80, now);
      sweep.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      sweep.frequency.exponentialRampToValueAtTime(40, now + 0.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      sweepGain.gain.setValueAtTime(0.25, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      sweep.connect(filter);
      filter.connect(sweepGain);
      sweepGain.connect(this.sfxGain);

      sweep.start(now);
      sweep.stop(now + 0.42);
    } catch (e) {}
  }

  playItemPickup(isSuper = false) {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = isSuper ? [440, 554, 659, 880, 1108] : [523.25, 659.25, 783.99];
      const duration = isSuper ? 0.08 : 0.06;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * duration);

        gain.gain.setValueAtTime(0, now + idx * duration);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * duration + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * duration + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * duration);
        osc.stop(now + idx * duration + 0.14);
      });
    } catch (e) {}
  }

  playBaseCapture(isPlayerTeam = true) {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const root = isPlayerTeam ? 440 : 330; // High harmonic for Blue, Deeper for Red
      const chord = isPlayerTeam ? [root, root * 1.25, root * 1.5, root * 2.0] : [root, root * 1.2, root * 1.4, root * 1.8];

      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0.01, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.55);
      });
    } catch (e) {}
  }

  playBaseAlarm() {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.setValueAtTime(950, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  playCountdownTick(isFinal = false) {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1760 : 880, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.12));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + (isFinal ? 0.36 : 0.13));
    } catch (e) {}
  }

  playElimination() {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  playUIClick() {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  playUIHover() {
    if (!this.isInitialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  // ==========================================
  // PROCEDURAL CYBERPUNK BGM SYNTHESIZER
  // ==========================================

  startMusic() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this._scheduleNextBeat();
  }

  stopMusic() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  setTensionMode(active) {
    this.tensionMode = active;
  }

  _scheduleNextBeat() {
    if (!this.bgmPlaying || !this.ctx) return;

    const secondsPerBeat = 60 / (this.tensionMode ? this.bgmTempo * 1.15 : this.bgmTempo);
    const stepDuration = secondsPerBeat / 4; // 16th notes

    this._synthesizeStep(this.bgmStep);
    this.bgmStep = (this.bgmStep + 1) % 32;

    this.bgmTimer = setTimeout(() => {
      this._scheduleNextBeat();
    }, stepDuration * 1000);
  }

  _synthesizeStep(step) {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    // Bassline (Classic Cyberpunk Rolling 16th Synth Bass)
    // Scale: D minor / F / G / A#
    const bassScale = [
      73.42, 73.42, 87.31, 73.42, 98.00, 73.42, 87.31, 110.00,
      73.42, 73.42, 87.31, 73.42, 98.00, 73.42, 116.54, 98.00
    ];
    const bassNote = bassScale[step % bassScale.length] * (this.tensionMode ? 1.0594 : 1.0);

    if (step % 2 === 0 || this.tensionMode) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassNote, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.tensionMode ? 1200 : 650, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.12);
        filter.Q.setValueAtTime(4.0, now);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.13);
      } catch (e) {}
    }

    // Drums: Kick on 0, 4, 8, 12... (Four-on-the-floor)
    if (step % 4 === 0) {
      try {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();

        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.08);

        kickGain.gain.setValueAtTime(0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.11);
      } catch (e) {}
    }

    // Drums: Snare/Clap on 4, 12, 20, 28
    if (step % 8 === 4) {
      try {
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(now);
        noise.stop(now + 0.11);
      } catch (e) {}
    }

    // Drums: Hi-Hat on offbeats (2, 6, 10, 14)
    if (step % 2 === 1) {
      try {
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(now);
        noise.stop(now + 0.05);
      } catch (e) {}
    }

    // Atmospheric synth chord on bar boundaries (step 0, 16)
    if (step === 0 || step === 16) {
      const chordNotes = (step === 0) ? [146.83, 220.00, 261.63, 349.23] : [130.81, 196.00, 261.63, 329.63];
      chordNotes.forEach(freq => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.linearRampToValueAtTime(1400, now + 1.0);
          filter.frequency.linearRampToValueAtTime(600, now + 2.0);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);

          osc.start(now);
          osc.stop(now + 2.0);
        } catch (e) {}
      });
    }
  }
}

// Global Sound Instance
const Sound = new SoundEngine();

if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
  window.Sound = Sound;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SoundEngine = SoundEngine;
  globalThis.Sound = Sound;
}
