class SoundManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = false;
    this.init();
  }

  init() {
    // Preload sounds
    this.loadSound(
      "hover",
      "https://assets.codepen.io/7558/click-reverb-001.mp3"
    );
    this.loadSound(
      "click",
      "https://assets.codepen.io/7558/shutter-fx-001.mp3"
    );
    this.loadSound(
      "textChange",
      "https://assets.codepen.io/7558/whoosh-fx-001.mp3"
    );
  }

  loadSound(name, url) {
    const audio = new Audio(url);
    audio.preload = "auto";
    if (name === "hover") {
      audio.volume = 0.15;
    } else {
      audio.volume = 0.3;
    }
    this.sounds[name] = audio;
  }

  enableAudio() {
    if (!this.isEnabled) {
      this.isEnabled = true;
      // console.log("Audio enabled");
    }
  }

  play(soundName, delay = 0) {
    if (this.isEnabled && this.sounds[soundName]) {
      const playFn = () => {
        try {
          this.sounds[soundName].currentTime = 0;
          this.sounds[soundName].play().catch(() => {});
        } catch {}
      };
      if (delay > 0) {
        setTimeout(playFn, delay);
      } else {
        playFn();
      }
    }
  }

  addSound(name, url, volume = 0.3) {
    this.loadSound(name, url);
    if (this.sounds[name]) {
      this.sounds[name].volume = volume;
    }
  }
}

export default SoundManager;