document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");

  // Detect iOS
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Show iOS notice if needed
  if (isIOS) {
    const notice = document.createElement("div");
    notice.className = "ios-notice";
    notice.innerHTML =
      "For best experience on iOS, keep your device unlocked and not on silent mode.";
    document.querySelector(".container").appendChild(notice);
    notice.style.display = "block";
  }
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

    // Audio State - iOS compatible approach
    this.audioUnlocked = false;
    this.audioContext = null;
    this.GongAudio = null;
    this.finishedAudio = null;
    this.audioFiles = {};
    this.audio = null;

    // iOS detection
    this.isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Initialize audio in a way that works with iOS
    this.initAudio();

    // Sound menu state
    this.soundMenuTimeout = null;

    // Bind event listeners
    this.bindEvents();
    this.updateDisplayFromInput();
  }

  initAudio() {
    // Create audio elements with proper attributes for iOS
    this.GongAudio = new Audio();
    this.GongAudio.preload = "auto";

    this.finishedAudio = new Audio();
    this.finishedAudio.preload = "auto";

    // Background audio files
    const audioSources = {
      "river.mp3": "sounds/river.mp3",
      "woods.mp3": "sounds/woods.mp3",
      "white_noise.mp3": "sounds/white_noise.mp3",
    };

    // Create audio elements for each background sound
    for (const [name, src] of Object.entries(audioSources)) {
      const audio = new Audio();
      audio.src = src;
      audio.preload = "metadata";
      audio.loop = true;
      audio.volume = 0.5;
      this.audioFiles[name] = audio;
    }

    // Set default audio
    this.audio = this.audioFiles[this.musicSelect.value];

    // iOS requires direct user interaction to play audio
    if (this.isIOS) {
      // Add a one-time unlock button for iOS
      const unlockButton = document.createElement("button");
      unlockButton.textContent = "Tap to enable sound";
      unlockButton.style.marginTop = "10px";
      unlockButton.style.padding = "10px";
      unlockButton.style.borderRadius = "5px";
      unlockButton.style.backgroundColor = "rgba(255,255,255,0.2)";
      unlockButton.style.color = "white";
      unlockButton.style.border = "none";

      unlockButton.addEventListener("click", () => {
        this.unlockAllAudioOnce();
        unlockButton.style.display = "none";
      });

      document.querySelector(".sound-controls").appendChild(unlockButton);
    }
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

    // Add touch events for mobile
    ["mousemove", "mousedown", "touchstart", "keydown"].forEach((event) => {
      this.soundMenu.addEventListener(event, () =>
        this.resetSoundMenuTimeout()
      );
    });

    // Preload sounds on iOS after user interaction
    if (this.isIOS) {
      document.addEventListener(
        "touchstart",
        () => {
          this.preloadAudio();
        },
        { once: true }
      );
    }
  }

  preloadAudio() {
    // Preload audio files for iOS
    this.GongAudio.src = "sounds/untitled.mp3";
    this.finishedAudio.src = "sounds/gong.mp3";

    // Load but don't play
    this.GongAudio.load();
    this.finishedAudio.load();

    // Preload background sounds
    for (const audio of Object.values(this.audioFiles)) {
      audio.load();
    }
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
      this.audio.play().catch((e) => console.log("Audio play failed:", e));
    }
  }

  musicOnOffClick() {
    if (this.musicOnOff.src.includes("volume.png")) {
      this.musicOnOff.src = "img/volume-mute.png";
      this.audio.pause();
    } else {
      this.musicOnOff.src = "img/volume.png";
      this.audio.play().catch((e) => console.log("Audio play failed:", e));
    }
  }

  changeVolume() {
    const volume = this.volumeSlider.value / 100;
    this.musicOnOff.src =
      volume === 0 ? "img/volume-mute.png" : "img/volume.png";
    if (volume > 0 && !this.audio.paused)
      this.audio.play().catch((e) => console.log("Audio play failed:", e));
    for (const a of Object.values(this.audioFiles)) a.volume = volume;
  }

  unlockAllAudioOnce() {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;

    // iOS requires creating and playing a sound to unlock audio
    if (this.isIOS) {
      // Create a silent audio context
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();

        // Create a tiny silent sound to unlock audio
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);

        // Resume the audio context
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }
      } catch (e) {
        console.warn("AudioContext failed:", e);
      }
    }

    // Preload all audio files
    this.preloadAudio();
  }

  toggleSoundMenu() {
    this.soundMenu.classList.toggle("show");
    if (this.soundMenu.classList.contains("show")) {
      this.resetSoundMenuTimeout();
    } else {
      clearTimeout(this.soundMenuTimeout);
    }
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
      this.playPauseButton.innerHTML = "▶";
      this.isPaused = true;
    }
  }

  resetTimer() {
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
    const minutes = parseInt(this.minuteInput.value, 10) || 0;
    this.timeLeft = minutes * 60;
    this.isPaused = false;
    this.playPauseButton.innerHTML = "▶";
    this.displayTime();
    this.settings.style.visibility = "visible";
    this.settings.classList.remove("hidden");
    this.countdownDisplay.classList.remove("move-up");
    this.intervalTime = 0;
    this.intervalDuration = 0;
    this.hasPlayedStartBell = false;
  }

  playSound() {
    if (!this.audioUnlocked) return;

    // Reset the audio to start from beginning
    this.GongAudio.currentTime = 0;

    // Play the sound
    this.GongAudio.play().catch((e) => {
      console.log("GongAudio failed:", e);
      // Try to unlock audio again if it failed
      this.unlockAllAudioOnce();
    });
  }

  playFinished() {
    if (!this.audioUnlocked) return;

    // Reset the audio to start from beginning
    this.finishedAudio.currentTime = 0;

    // Play the sound
    this.finishedAudio.play().catch((e) => {
      console.log("FinishedAudio failed:", e);
      // Try to unlock audio again if it failed
      this.unlockAllAudioOnce();
    });
  }

  updateTimer() {
    if (!this.isPaused) {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.settings.classList.remove("hidden");
        this.countdownDisplay.classList.remove("move-up");
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        const minutes = parseInt(this.minuteInput.value, 10) || 0;
        this.timeLeft = minutes * 60;
        this.displayTime();
        this.playPauseButton.innerHTML = "▶";
        this.isPaused = false;
        this.hasPlayedStartBell = false;
        this.playFinished();
      }
      if (this.toggleInterval.checked && this.intervalDuration > 0) {
        this.intervalTime--;
        // Only play interval bell if timer is not ending
        if (this.intervalTime <= 0 && this.timeLeft > 1) {
          this.playSound();
          this.intervalTime = this.intervalDuration;
        }
      }
      this.displayTime();
    }
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
