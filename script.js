document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");
});

class TimerApp {
  constructor() {
    // DOM Elements
    this.minuteInput = document.getElementById("minutes");
    this.playPauseButton = document.getElementById("playPause");
    this.resetButton = document.getElementById("reset");
    this.countdownDisplay = document.getElementById("countdown");
    this.settings = document.getElementById("timerContainer");
    this.musicOnOff = document.getElementById("musicOn");
    this.musicSelect = document.getElementById("musicSelect");
    this.toggleInterval = document.getElementById("toggleInterval");
    this.intervalInput = document.getElementById("interval");
    this.soundMenu = document.getElementById("soundMenu");
    this.soundToggle = document.getElementById("soundToggle");
    this.volumeSlider = document.getElementById("volumeSlider");
    document.getElementById("btn-guided").addEventListener("click", () => {
      this.changeToGuided();
    });

    // Timer State
    this.countdownInterval = null;
    this.timeLeft = 0;
    this.isPaused = false;
    this.intervalTime = 0;
    this.intervalDuration = 1;
    this.hasPlayedStartBell = false;

    // Audio State
    this.audioUnlocked = false;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.buffers = {}; // Web Audio buffers for bells

    this.audioFiles = {
      "river.mp3": new Audio("sounds/river.mp3"),
      "woods.mp3": new Audio("sounds/woods.mp3"),
      "white_noise.mp3": new Audio("sounds/white_noise.mp3"),
    };
    for (const a of Object.values(this.audioFiles)) {
      a.loop = true;
      a.volume = 0.5;
    }
    this.audio = this.audioFiles[this.musicSelect.value];

    this.soundMenuTimeout = null;

    this.loadAllBuffers(); // Preload bells
    this.bindEvents();
    this.updateDisplayFromInput();

    // Unlock AudioContext on any user gesture
    ["click", "keydown", "touchstart"].forEach((event) =>
      document.addEventListener(event, () => this.unlockAllAudioOnce(), {
        once: true,
      })
    );
  }

  async loadAllBuffers() {
    const bellFiles = {
      start: "sounds/untitled.mp3",
      interval: "sounds/untitled.mp3",
      finish: "sounds/gong.mp3",
    };
    for (const [key, url] of Object.entries(bellFiles)) {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.buffers[key] = await this.audioCtx.decodeAudioData(arrayBuffer);
    }
  }

  playBell(type) {
    if (!this.buffers[type]) return;
    const source = this.audioCtx.createBufferSource();
    source.buffer = this.buffers[type];
    source.connect(this.audioCtx.destination);
    source.start();
  }
  unlockAllAudioOnce() {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    this.audioCtx.resume().catch(console.warn);
    // Do not play any bell on first click; only unlock/resume AudioContext
  }

  bindEvents() {
    this.playPauseButton.addEventListener("click", () => this.playPause());
    this.resetButton.addEventListener("click", () => this.resetTimer());
    this.minuteInput.addEventListener("input", () =>
      this.updateDisplayFromInput()
    );
    this.musicOnOff.addEventListener("click", () => this.musicOnOffClick());
    this.musicSelect.addEventListener("change", () => this.changeMusic());
    this.toggleInterval.addEventListener("change", () =>
      this.toggleIntervalInput()
    );
    this.intervalInput.addEventListener("input", () =>
      this.updateIntervalSettings()
    );
    this.soundToggle.addEventListener("click", () => this.toggleSoundMenu());
    this.volumeSlider.addEventListener("input", () => this.changeVolume());
    ["mousemove", "mousedown", "touchstart", "keydown"].forEach((event) => {
      this.soundMenu.addEventListener(event, () =>
        this.resetSoundMenuTimeout()
      );
    });
  }

  changeToGuided() {
    // Optionally pause/stop the timer first
    this.isPaused = true;
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;

    // Navigate to guided screen page
    window.location.href = "guidedSection.html"; // put your guided page filename here
  }

  updateIntervalSettings() {
    const maxInterval = parseInt(this.minuteInput.value, 10) || 0;
    let intervalValue = parseInt(this.intervalInput.value, 10) || 0;
    if (intervalValue > maxInterval) intervalValue = maxInterval;

    this.intervalDuration = intervalValue * 60 || 0;

    // Only set intervalTime if intervalDuration > 0
    if (this.intervalDuration > 0) {
      this.intervalTime = this.intervalDuration;
    }
  }

  toggleIntervalInput() {
    if (this.toggleInterval.checked) {
      this.intervalInput.classList.remove("hidden");
      this.updateIntervalSettings();
    } else {
      this.intervalInput.classList.add("hidden");
    }
  }

  changeMusic() {
    const wasPlaying = !this.audio.paused;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio = this.audioFiles[this.musicSelect.value];
    if (this.musicOnOff.src.includes("volume.png") && wasPlaying)
      this.audio.play();
  }

  musicOnOffClick() {
    if (this.musicOnOff.src.includes("volume.png")) {
      this.musicOnOff.src = "img/volume-mute.png";
      this.audio.pause();
    } else {
      this.musicOnOff.src = "img/volume.png";
      this.audio.play();
    }
  }

  changeVolume() {
    const volume = this.volumeSlider.value / 100;
    this.musicOnOff.src =
      volume === 0 ? "img/volume-mute.png" : "img/volume.png";
    for (const a of Object.values(this.audioFiles)) a.volume = volume;
  }

  toggleSoundMenu() {
    this.soundMenu.classList.toggle("show");
    if (this.soundMenu.classList.contains("show")) this.resetSoundMenuTimeout();
    else clearTimeout(this.soundMenuTimeout);
  }

  hideSoundMenu() {
    this.soundMenu.classList.remove("show");
  }
  resetSoundMenuTimeout() {
    clearTimeout(this.soundMenuTimeout);
    this.soundMenuTimeout = setTimeout(() => this.hideSoundMenu(), 4000);
  }

  playPause() {
    this.unlockAllAudioOnce();

    if (!this.countdownInterval || this.isPaused) {
      if (this.timeLeft === 0)
        this.timeLeft = (parseInt(this.minuteInput.value, 10) || 0) * 60;

      this.playPauseButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>`;
      this.isPaused = false;
      this.settings.classList.add("hidden");
      this.countdownDisplay.classList.add("move-up");

      if (!this.hasPlayedStartBell) {
        this.hasPlayedStartBell = true;
        this.playBell("start");
      }

      if (!this.countdownInterval)
        this.countdownInterval = setInterval(() => this.updateTimer(), 1000);
    } else {
      this.playPauseButton.textContent = "▶";
      this.isPaused = true;
    }
  }

  resetTimer() {
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
    this.timeLeft = (parseInt(this.minuteInput.value, 10) || 0) * 60;
    this.isPaused = false;
    this.playPauseButton.textContent = "▶";
    this.displayTime();
    this.settings.style.visibility = "visible";
    this.settings.classList.remove("hidden");
    this.countdownDisplay.classList.remove("move-up");
    this.intervalTime = 0;
    this.intervalDuration = 0;
    this.hasPlayedStartBell = false;
  }

  updateTimer() {
    if (this.isPaused) return;

    this.timeLeft--;

    // Interval bell
    if (this.toggleInterval.checked && this.intervalDuration > 0) {
      this.intervalTime--;
      if (this.intervalTime <= 0 && this.timeLeft > 1) {
        this.playBell("interval");
        this.intervalTime = this.intervalDuration;
      }
    }

    // Timer finished
    if (this.timeLeft <= 0) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
      this.timeLeft = (parseInt(this.minuteInput.value, 10) || 0) * 60;
      this.displayTime();
      this.playPauseButton.textContent = "▶";
      this.isPaused = false;
      this.hasPlayedStartBell = false;
      this.playBell("finish");
      this.settings.classList.remove("hidden");
      this.countdownDisplay.classList.remove("move-up");
    }

    this.displayTime();
  }

  displayTime() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.countdownDisplay.innerHTML = `<p>${minutes}:${String(seconds).padStart(
      2,
      "0"
    )}</p>`;
  }

  updateDisplayFromInput() {
    this.timeLeft = (parseInt(this.minuteInput.value, 10) || 0) * 60;
    const displayMinutes = Math.floor(this.timeLeft / 60);
    const displaySeconds = this.timeLeft % 60;
    this.countdownDisplay.innerText = `${displayMinutes}:${
      displaySeconds < 10 ? "0" : ""
    }${displaySeconds}`;
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", () => new TimerApp());
