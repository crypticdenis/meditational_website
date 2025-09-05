document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");
});

// TimerApp encapsulates all timer logic and UI interactions
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

    // Timer State
    this.countdownInterval = null;
    this.timeLeft = 0;
    this.isPaused = false;
    this.intervalTime = 0;
    this.intervalDuration = 1;
    this.hasPlayedStartBell = false;

    // Audio State
    this.audioUnlocked = false;
    this.audioCtx = null;
    this.GongAudio = new Audio("sounds/untitled.mp3");
    this.finishedAudio = new Audio("sounds/gong.mp3");
    this.silentAudio = new Audio("sounds/silent.mp3");
    this.finishedAudio.volume = 1;
    this.GongAudio.volume = 1;
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

    // Sound menu state
    this.soundMenuTimeout = null;

    // Bind event listeners
    this.bindEvents();
    this.updateDisplayFromInput();
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

  updateIntervalSettings() {
    const maxInterval = parseInt(this.minuteInput.value, 10) || 0;
    let intervalValue = parseInt(this.intervalInput.value, 10) || 0;
    if (intervalValue > maxInterval) {
      intervalValue = maxInterval;
      this.intervalInput.value = maxInterval;
    }
    this.intervalDuration = intervalValue * 60 || 0;
    this.intervalTime = this.intervalDuration;
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
    if (this.musicOnOff.src.includes("volume.png") && wasPlaying) {
      this.audio.play();
    }
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
    if (volume > 0) this.audio.play();
    for (const a of Object.values(this.audioFiles)) a.volume = volume;
  }

  hideSoundMenu() {
    this.soundMenu.classList.remove("show");
  }

  resetSoundMenuTimeout() {
    clearTimeout(this.soundMenuTimeout);
    this.soundMenuTimeout = setTimeout(() => this.hideSoundMenu(), 4000);
  }

  unlockAllAudioOnce() {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx
          .resume()
          .catch((e) => console.warn("AudioContext resume failed:", e));
      }
    } catch (e) {
      console.warn("AudioContext init failed:", e);
    }

    // Preload everything
    this.silentAudio.load();
    this.GongAudio.load();
    this.finishedAudio.load();
    for (const a of Object.values(this.audioFiles)) a.load();

    // Play silent unlock – must be in user gesture context
    this.silentAudio.volume = 0;
    this.silentAudio.play().catch((e) => {
      console.warn("Silent unlock failed:", e);
      // Retry after small delay if blocked
      setTimeout(() => {
        this.silentAudio.play().catch(() => {});
      }, 200);
    });
  }

  playPause() {
    // Unlock audio first (Safari requirement)
    this.unlockAllAudioOnce();

    if (!this.countdownInterval || this.isPaused) {
      if (this.timeLeft === 0) {
        const minutes = parseInt(this.minuteInput.value, 10) || 0;
        this.timeLeft = minutes * 60;
      }
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
      }
      if (!this.countdownInterval) {
        this.countdownInterval = setInterval(() => this.updateTimer(), 1000);
      }
    } else {
      this.playPauseButton.textContent = "▶";
      this.isPaused = true;
    }
  }

  playSound() {
    // Interval gong
    this.GongAudio.currentTime = 0;
    this.GongAudio.play().catch((e) => {
      console.warn("GongAudio failed:", e);
      // Retry once if blocked
      setTimeout(() => this.GongAudio.play().catch(() => {}), 200);
    });
  }

  playFinished() {
    // Final gong
    this.finishedAudio.currentTime = 0;
    this.finishedAudio.play().catch((e) => {
      console.warn("FinishedAudio failed:", e);
      // Retry once if blocked
      setTimeout(() => this.finishedAudio.play().catch(() => {}), 200);
    });
  }

  resetTimer() {
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
    const minutes = parseInt(this.minuteInput.value, 10) || 0;
    this.timeLeft = minutes * 60;
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

    const now = Date.now();

    if (!this.lastTick) {
      this.lastTick = now;
      return;
    }

    const delta = Math.floor((now - this.lastTick) / 1000);
    if (delta <= 0) return;

    this.lastTick = now;

    // Subtract delta seconds from timeLeft
    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.displayTime();
      this.handleFinish();
      return;
    }

    // Handle interval bell
    if (this.toggleInterval.checked && this.intervalDuration > 0) {
      this.intervalTime -= delta;
      if (this.intervalTime <= 0 && this.timeLeft > 1) {
        this.playSound();
        // Keep remainder to prevent drift
        this.intervalTime += this.intervalDuration;
      }
    }

    this.displayTime();
  }

  handleFinish() {
    this.settings.classList.remove("hidden");
    this.countdownDisplay.classList.remove("move-up");
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
    this.playPauseButton.textContent = "▶";
    this.isPaused = false;
    this.hasPlayedStartBell = false;
    this.playFinished();
    this.lastTick = null;
    this.intervalTime = this.intervalDuration; // reset for next run
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
    const minutes = parseInt(this.minuteInput.value, 10) || 0;
    this.timeLeft = minutes * 60;
    const displayMinutes = Math.floor(this.timeLeft / 60);
    const displaySeconds = this.timeLeft % 60;
    this.countdownDisplay.innerText = `${displayMinutes}:${
      displaySeconds < 10 ? "0" : ""
    }${displaySeconds}`;
  }
}

// Initialize the app
window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");
  new TimerApp();
});
