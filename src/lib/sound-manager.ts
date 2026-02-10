class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted: boolean = true; // Start muted, user opts in
  private _volume: number = 0.3;

  // Monitor hum nodes
  private humGain: GainNode | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private humRunning = false;

  get muted() {
    return this._muted;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  mute() {
    this._muted = true;
    this.stopHum();
  }

  unmute() {
    this._muted = false;
    this.startHum();
  }

  toggle(): boolean {
    this._muted = !this._muted;
    if (this._muted) {
      this.stopHum();
    } else {
      this.startHum();
    }
    return !this._muted;
  }

  // --- Monitor hum: continuous 60Hz + 120Hz harmonic ---
  private startHum() {
    if (this.humRunning || this._muted) return;
    try {
      const ctx = this.getContext();
      this.humGain = ctx.createGain();
      this.humGain.gain.value = 0.012;
      this.humGain.connect(ctx.destination);

      // 60Hz fundamental
      this.humOsc1 = ctx.createOscillator();
      this.humOsc1.type = "sine";
      this.humOsc1.frequency.value = 60;
      this.humOsc1.connect(this.humGain);
      this.humOsc1.start();

      // 120Hz harmonic (quieter)
      this.humOsc2 = ctx.createOscillator();
      this.humOsc2.type = "sine";
      this.humOsc2.frequency.value = 120;
      const harmGain = ctx.createGain();
      harmGain.gain.value = 0.4;
      this.humOsc2.connect(harmGain);
      harmGain.connect(this.humGain);
      this.humOsc2.start();

      this.humRunning = true;
    } catch {
      // Audio context may not be available
    }
  }

  private stopHum() {
    try {
      this.humOsc1?.stop();
      this.humOsc2?.stop();
    } catch {
      // Already stopped
    }
    this.humOsc1 = null;
    this.humOsc2 = null;
    this.humGain?.disconnect();
    this.humGain = null;
    this.humRunning = false;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = this._volume
  ) {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration
      );

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context may not be available
    }
  }

  // Shared noise buffer (reused across keypress calls)
  private noiseBuffer: AudioBuffer | null = null;

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      // Create ~50ms of white noise, reused for all key sounds
      const size = Math.floor(ctx.sampleRate * 0.05);
      this.noiseBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < size; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuffer;
  }

  // --- Foam-dampened linear switch keypress ---
  keypress() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const vol = this._volume;

      // --- Layer 1: Deep thock (key bottoming out on foam) ---
      const thockSource = ctx.createBufferSource();
      thockSource.buffer = this.getNoiseBuffer(ctx);

      const thockBP = ctx.createBiquadFilter();
      thockBP.type = "bandpass";
      thockBP.frequency.value = 350 + Math.random() * 150;
      thockBP.Q.value = 1.2;

      const thockLP = ctx.createBiquadFilter();
      thockLP.type = "lowpass";
      thockLP.frequency.value = 1200;
      thockLP.Q.value = 0.7;

      const thockGain = ctx.createGain();
      thockGain.gain.setValueAtTime(vol * 0.55, now);
      thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      thockSource.connect(thockBP);
      thockBP.connect(thockLP);
      thockLP.connect(thockGain);
      thockGain.connect(ctx.destination);
      thockSource.start(now);
      thockSource.stop(now + 0.035);

      // --- Layer 2: Sub bass body (warm low rumble) ---
      const bodySource = ctx.createBufferSource();
      bodySource.buffer = this.getNoiseBuffer(ctx);

      const bodyBP = ctx.createBiquadFilter();
      bodyBP.type = "bandpass";
      bodyBP.frequency.value = 150 + Math.random() * 80;
      bodyBP.Q.value = 1.5;

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(vol * 0.35, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      bodySource.connect(bodyBP);
      bodyBP.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      bodySource.start(now);
      bodySource.stop(now + 0.045);

      // --- Layer 3: Touch of presence (just enough definition) ---
      const topSource = ctx.createBufferSource();
      topSource.buffer = this.getNoiseBuffer(ctx);

      const topBP = ctx.createBiquadFilter();
      topBP.type = "bandpass";
      topBP.frequency.value = 900 + Math.random() * 200;
      topBP.Q.value = 1.5;

      const topGain = ctx.createGain();
      topGain.gain.setValueAtTime(vol * 0.06, now);
      topGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      topSource.connect(topBP);
      topBP.connect(topGain);
      topGain.connect(ctx.destination);
      topSource.start(now);
      topSource.stop(now + 0.015);
    } catch {
      // Audio context may not be available
    }
  }

  enter() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const vol = this._volume;

      // --- Layer 1: Deep thock (big stabilized key bottoming out) ---
      const thockSource = ctx.createBufferSource();
      thockSource.buffer = this.getNoiseBuffer(ctx);

      const thockBP = ctx.createBiquadFilter();
      thockBP.type = "bandpass";
      thockBP.frequency.value = 250;
      thockBP.Q.value = 1.0;

      const thockLP = ctx.createBiquadFilter();
      thockLP.type = "lowpass";
      thockLP.frequency.value = 900;
      thockLP.Q.value = 0.7;

      const thockGain = ctx.createGain();
      thockGain.gain.setValueAtTime(vol * 0.7, now);
      thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      thockSource.connect(thockBP);
      thockBP.connect(thockLP);
      thockLP.connect(thockGain);
      thockGain.connect(ctx.destination);
      thockSource.start(now);
      thockSource.stop(now + 0.045);

      // --- Layer 2: Sub bass thump (heavy keycap mass) ---
      const bodySource = ctx.createBufferSource();
      bodySource.buffer = this.getNoiseBuffer(ctx);

      const bodyBP = ctx.createBiquadFilter();
      bodyBP.type = "bandpass";
      bodyBP.frequency.value = 100;
      bodyBP.Q.value = 1.2;

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(vol * 0.4, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      bodySource.connect(bodyBP);
      bodyBP.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      bodySource.start(now);
      bodySource.stop(now + 0.06);

      // --- Layer 3: Muted stabilizer thud ---
      const stabSource = ctx.createBufferSource();
      stabSource.buffer = this.getNoiseBuffer(ctx);

      const stabBP = ctx.createBiquadFilter();
      stabBP.type = "bandpass";
      stabBP.frequency.value = 600;
      stabBP.Q.value = 1.2;

      const stabLP = ctx.createBiquadFilter();
      stabLP.type = "lowpass";
      stabLP.frequency.value = 1000;
      stabLP.Q.value = 0.5;

      const stabGain = ctx.createGain();
      stabGain.gain.setValueAtTime(0.001, now);
      stabGain.gain.setValueAtTime(vol * 0.12, now + 0.004);
      stabGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      stabSource.connect(stabBP);
      stabBP.connect(stabLP);
      stabLP.connect(stabGain);
      stabGain.connect(ctx.destination);
      stabSource.start(now);
      stabSource.stop(now + 0.04);
    } catch {
      // Audio context may not be available
    }
  }

  error() {
    this.playTone(200, 0.15, "sawtooth", this._volume * 0.5);
    setTimeout(
      () => this.playTone(150, 0.2, "sawtooth", this._volume * 0.5),
      80
    );
  }

  boot() {
    if (this._muted) return;
    this.playTone(60, 0.5, "sine", 0.15);
    setTimeout(() => this.playTone(120, 0.3, "sine", 0.1), 200);
    setTimeout(() => this.playTone(2000, 0.08, "sine", 0.08), 400);
  }

  achievement() {
    if (this._muted) return;
    [523, 659, 784].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, "square", 0.2), i * 100);
    });
  }

  gameOver() {
    if (this._muted) return;
    [400, 300, 200].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, "square", 0.15), i * 150);
    });
  }

  /** CRT power-on: relay thunk, capacitor charge whine, hum fade-in. */
  powerOn() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // --- Layer 1: Relay / degauss thunk ---
      const thunkSrc = ctx.createBufferSource();
      thunkSrc.buffer = this.getNoiseBuffer(ctx);
      const thunkBP = ctx.createBiquadFilter();
      thunkBP.type = "bandpass";
      thunkBP.frequency.value = 120;
      thunkBP.Q.value = 0.8;
      const thunkGain = ctx.createGain();
      thunkGain.gain.setValueAtTime(0.5, now);
      thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      thunkSrc.connect(thunkBP);
      thunkBP.connect(thunkGain);
      thunkGain.connect(ctx.destination);
      thunkSrc.start(now);
      thunkSrc.stop(now + 0.15);

      // --- Layer 2: Low-mid capacitor charge hum (rising pitch, warm) ---
      const whineOsc = ctx.createOscillator();
      whineOsc.type = "sine";
      whineOsc.frequency.setValueAtTime(80, now + 0.08);
      whineOsc.frequency.exponentialRampToValueAtTime(400, now + 0.6);
      const whineGain = ctx.createGain();
      whineGain.gain.setValueAtTime(0.001, now);
      whineGain.gain.linearRampToValueAtTime(0.0, now + 0.08);
      whineGain.gain.linearRampToValueAtTime(0.08, now + 0.25);
      whineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      whineOsc.connect(whineGain);
      whineGain.connect(ctx.destination);
      whineOsc.start(now + 0.08);
      whineOsc.stop(now + 0.7);

      // --- Layer 3: Electrical buzz building ---
      const buzzOsc = ctx.createOscillator();
      buzzOsc.type = "sawtooth";
      buzzOsc.frequency.value = 60;
      const buzzGain = ctx.createGain();
      buzzGain.gain.setValueAtTime(0.001, now);
      buzzGain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      buzzOsc.connect(buzzGain);
      buzzGain.connect(ctx.destination);
      buzzOsc.start(now);
      buzzOsc.stop(now + 0.6);
    } catch {
      // Audio context may not be available
    }
  }

  /** CRT power-down: descending whine, degauss buzz, low thump. */
  powerDown() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // --- Layer 1: Descending high-voltage whine ---
      const whineOsc = ctx.createOscillator();
      whineOsc.type = "sine";
      whineOsc.frequency.setValueAtTime(15500, now);
      whineOsc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
      const whineGain = ctx.createGain();
      whineGain.gain.setValueAtTime(0.07, now);
      whineGain.gain.linearRampToValueAtTime(0.04, now + 0.2);
      whineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      whineOsc.connect(whineGain);
      whineGain.connect(ctx.destination);
      whineOsc.start(now);
      whineOsc.stop(now + 0.6);

      // --- Layer 2: Degauss buzz (60Hz sawtooth dying off) ---
      const buzzOsc = ctx.createOscillator();
      buzzOsc.type = "sawtooth";
      buzzOsc.frequency.value = 60;
      const buzzGain = ctx.createGain();
      buzzGain.gain.setValueAtTime(0.05, now);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      buzzOsc.connect(buzzGain);
      buzzGain.connect(ctx.destination);
      buzzOsc.start(now);
      buzzOsc.stop(now + 0.45);

      // --- Layer 3: Low power-supply thump ---
      const thumpOsc = ctx.createOscillator();
      thumpOsc.type = "sine";
      thumpOsc.frequency.setValueAtTime(80, now + 0.05);
      thumpOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(0.001, now);
      thumpGain.gain.setValueAtTime(0.35, now + 0.05);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thumpOsc.start(now + 0.05);
      thumpOsc.stop(now + 0.3);

      // --- Layer 4: Noise crackle as CRT discharges ---
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.getNoiseBuffer(ctx);
      const noiseHP = ctx.createBiquadFilter();
      noiseHP.type = "highpass";
      noiseHP.frequency.value = 3000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noiseSrc.connect(noiseHP);
      noiseHP.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.1);
    } catch {
      // Audio context may not be available
    }
  }

  /** Light mouse-click for GUI interactions. */
  guiClick() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Short, crisp click transient
      const clickOsc = ctx.createOscillator();
      clickOsc.type = "square";
      clickOsc.frequency.setValueAtTime(2400, now);
      clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.008);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.15, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.02);

      // Tiny noise texture
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.getNoiseBuffer(ctx);
      const noiseLP = ctx.createBiquadFilter();
      noiseLP.type = "bandpass";
      noiseLP.frequency.value = 3000;
      noiseLP.Q.value = 1.0;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
      noiseSrc.connect(noiseLP);
      noiseLP.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.015);
    } catch {
      // Audio context may not be available
    }
  }

  /** System restore complete — ascending triumphant tone. */
  restoreComplete() {
    if (this._muted) return;
    [330, 440, 550, 660, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, "square", 0.15), i * 80);
    });
  }

  /** TV channel change — brief static burst. */
  channelChange() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // White noise burst
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.getNoiseBuffer(ctx);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noiseSrc.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.2);

      // Low thump
      const thump = ctx.createOscillator();
      thump.type = "sine";
      thump.frequency.setValueAtTime(80, now);
      thump.frequency.exponentialRampToValueAtTime(30, now + 0.1);
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(0.2, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thump.start(now);
      thump.stop(now + 0.15);
    } catch {
      // Audio context may not be available
    }
  }

  /** Konami code unlocked — triumphant retro jingle. */
  konamiUnlock() {
    if (this._muted) return;
    const notes = [523, 523, 784, 784, 1047, 1047, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, "square", 0.18), i * 80);
    });
  }

  /** Chunky CRT monitor button click — mechanical ka-chunk. */
  buttonClick() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // --- Layer 1: Click transient (the switch snapping) ---
      const clickOsc = ctx.createOscillator();
      clickOsc.type = "square";
      clickOsc.frequency.setValueAtTime(1800, now);
      clickOsc.frequency.exponentialRampToValueAtTime(400, now + 0.015);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.035);

      // --- Layer 2: Plastic body thud ---
      const thudOsc = ctx.createOscillator();
      thudOsc.type = "sine";
      thudOsc.frequency.setValueAtTime(300, now);
      thudOsc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.15, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.08);

      // --- Layer 3: Noise texture (plastic rattle) ---
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.getNoiseBuffer(ctx);

      const noiseLP = ctx.createBiquadFilter();
      noiseLP.type = "lowpass";
      noiseLP.frequency.value = 2000;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noiseSrc.connect(noiseLP);
      noiseLP.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.05);
    } catch {
      // Audio context may not be available
    }
  }

  /** System meltdown — chaotic descending noise + distortion. */
  meltdown() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Harsh noise burst with distortion
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.getNoiseBuffer(ctx);
      noiseSrc.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.linearRampToValueAtTime(0.05, now + 2.5);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      const distortion = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = Math.tanh(x * 5);
      }
      distortion.curve = curve;

      noiseSrc.connect(distortion);
      distortion.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 3.0);

      // Descending alarm tone
      const alarmOsc = ctx.createOscillator();
      alarmOsc.type = "sawtooth";
      alarmOsc.frequency.setValueAtTime(800, now);
      alarmOsc.frequency.exponentialRampToValueAtTime(60, now + 2.5);
      const alarmGain = ctx.createGain();
      alarmGain.gain.setValueAtTime(0.1, now);
      alarmGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      alarmOsc.connect(alarmGain);
      alarmGain.connect(ctx.destination);
      alarmOsc.start(now);
      alarmOsc.stop(now + 2.5);
    } catch {
      // Audio context may not be available
    }
  }
}

export const soundManager = new SoundManager();
