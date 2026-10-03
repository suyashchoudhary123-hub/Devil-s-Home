/**
 * High-fidelity Procedural Horror Sound Engine powered by Web Audio API.
 * Eliminates external MP3 dependencies, prevents 404s, and provides
 * responsive audio tailored to Unreal Engine 5 aesthetic.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;
  private heartbeatInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain) {
      this.ambientGain.gain.value = muted ? 0 : 0.15;
    }
    if (muted && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // --- AMBIENT SOUNDSCAPES ---
  public startAmbient(theme: 'volcano' | 'arena' | 'forest') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopAmbient();

    try {
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.01, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.12, now + 2);
      this.ambientGain.connect(this.ctx.destination);

      // Low frequency drone
      const freq = theme === 'volcano' ? 55 : theme === 'arena' ? 65 : 45;
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientOsc.type = theme === 'forest' ? 'sine' : 'sawtooth';
      this.ambientOsc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      this.ambientOsc.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientOsc.start();

      // Atmospheric filtered pink/brown noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      this.ambientNoise = this.ctx.createBufferSource();
      this.ambientNoise.buffer = noiseBuffer;
      this.ambientNoise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(theme === 'forest' ? 320 : 180, now);
      noiseFilter.Q.setValueAtTime(1.5, now);

      this.ambientNoise.connect(noiseFilter);
      noiseFilter.connect(this.ambientGain);
      this.ambientNoise.start();
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  public stopAmbient() {
    if (this.ambientOsc) {
      try { this.ambientOsc.stop(); } catch (e) {}
      this.ambientOsc = null;
    }
    if (this.ambientNoise) {
      try { this.ambientNoise.stop(); } catch (e) {}
      this.ambientNoise = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
  }

  // --- HEARTBEAT TENSION ---
  public setHeartbeatActive(active: boolean, isCritical: boolean = false) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (!active || this.isMuted) return;

    const rate = isCritical ? 620 : 1100;
    this.playHeartbeatThump();
    this.heartbeatInterval = window.setInterval(() => {
      this.playHeartbeatThump();
    }, rate);
  }

  private playHeartbeatThump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Lub
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Dub
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(70, now + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.28);
      gain2.gain.setValueAtTime(0.35, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.29);
    } catch (e) {}
  }

  // --- WEAPON SLASH / WHOOSH ---
  public playSlash(weaponId: string = 'runic_blade') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';

      if (weaponId === 'demon_greatsword') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        filter.frequency.setValueAtTime(350, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (weaponId === 'twin_daggers') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        filter.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
      } else {
        // Runic Blade & Axe
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
        filter.frequency.setValueAtTime(650, now);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      }
    } catch (e) {}
  }

  // --- RANGED / PLASMA SHOT ---
  public playRangedShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // --- MONSTER SOUNDS ---
  public playMonsterHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  public playBossSlam() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Seismic sub rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.7);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.72);
    } catch (e) {}
  }

  // --- COIN PICKUP ---
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1975.53, now); // B6
      osc2.frequency.setValueAtTime(2637.02, now + 0.08); // E7

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.26);
      osc2.stop(now + 0.26);
    } catch (e) {}
  }

  // --- HEART LOSS SHATTER ---
  public playHeartShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dissonant crunch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch (e) {}
  }

  // --- POWER UP ABILITY BURST ---
  public playAbilityBurst() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch (e) {}
  }

  // --- JUMP / DODGE ---
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // --- GAME OVER ---
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
    } catch (e) {}
  }
}

export const sound = new SoundEngine();
