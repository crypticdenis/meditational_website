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

    // Mobile background notice
    this.mobileBgNotice = document.getElementById("mobileBgNotice");
    this.dismissBgNotice = document.getElementById("dismissBgNotice");

    // Guided button
    const guidedBtn = document.getElementById("btn-guided");
    if (guidedBtn) {
      guidedBtn.addEventListener("click", () => this.changeToGuided());
    }

    // Ambient button and dropdown
    const ambientBtn = document.getElementById("btn-ambient");
    const dropdown = document.getElementById("ambient-dropdown");
    if (ambientBtn && dropdown) {
      let dropdownOpen = false;
      ambientBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.style.display = dropdownOpen ? "none" : "flex";
        dropdownOpen = !dropdownOpen;
      });

      // Hide dropdown when clicking outside
      document.addEventListener("click", function (e) {
        if (
          dropdownOpen &&
          !dropdown.contains(e.target) &&
          e.target !== ambientBtn
        ) {
          dropdown.style.display = "none";
          dropdownOpen = false;
        }
      });

      // Handle ambient option selection
      dropdown.querySelectorAll(".ambient-option-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          const video = btn.getAttribute("data-video");
          if (video) {
            window.location.href = `ind.html?video=${encodeURIComponent(
              video
            )}`;
          }
          dropdown.style.display = "none";
          dropdownOpen = false;
        });
      });
    }

    // Device detection
    this.isMobile =
      /iPhone|iPad|iPod|Android/.test(navigator.userAgent) &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 1);
    this.timerStarted = false;

    // Restore only minutes from localStorage before using values
    this.restoreMinutes();

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
    this.ambientBuffers = {}; // Web Audio buffers for ambient
    this.ambientSource = null;
    this.ambientGain = this.audioCtx.createGain();
    this.ambientGain.gain.value = 0.5;
    this.ambientGain.connect(this.audioCtx.destination);

    this.audio = null; // currently active ambient

    this.soundMenuTimeout = null;

    this.loadAllBuffers(); // Preload bells
    this.loadAmbientBuffers(); // Preload ambient tracks
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
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.buffers[key] = await this.audioCtx.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error(`Error loading audio file ${url}:`, error);
      }
    }
  }

  async loadAmbientBuffers() {
    const ambientFiles = {
      "river.mp3": "sounds/river.mp3",
      "woods.mp3": "sounds/woods.mp3",
      "white_noise.mp3": "sounds/white_noise.mp3",
      "stalactite_cave.mp3": "sounds/stalactite_cave.mp3",
    };

    for (const [key, url] of Object.entries(ambientFiles)) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.ambientBuffers[key] = await this.audioCtx.decodeAudioData(
          arrayBuffer
        );
      } catch (error) {
        console.error(`Error loading ambient file ${url}:`, error);
      }
    }
  }

  playBell(type) {
    if (!this.buffers[type]) return;

    this.audioCtx.resume().catch(() => {});
    const source = this.audioCtx.createBufferSource();
    source.buffer = this.buffers[type];
    source.connect(this.audioCtx.destination);
    source.start();
  }

  unlockAllAudioOnce() {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    this.audioCtx.resume().catch(console.warn);
  }

  updateIntervalSettings() {
    const timerVal = parseInt(this.minuteInput.value, 10) || 0;
    let intervalVal = parseInt(this.intervalInput.value, 10) || 0;

    if (intervalVal > timerVal) {
      intervalVal = timerVal;
      this.intervalInput.value = timerVal;
    }

    this.intervalDuration = intervalVal * 60;
    this.intervalTime = this.intervalDuration;
  }

  bindEvents() {
    this.playPauseButton.addEventListener("click", (e) => {
      if (
        this.isMobile &&
        this.mobileBgNotice &&
        this.mobileBgNotice.style.display !== "none"
      ) {
        return;
      }

      if (this.isMobile && this.mobileBgNotice && !this.timerStarted) {
        e.preventDefault();
        this.mobileBgNotice.style.display = "flex";
        document.body.style.overflow = "hidden";

        this.dismissBgNotice.onclick = () => {
          this.mobileBgNotice.style.display = "none";
          document.body.style.overflow = "";
          this.timerStarted = true;
          this.playPause();
        };
        return;
      }

      this.playPause();
    });

    this.resetButton.addEventListener("click", () => {
      this.timerStarted = false;
      this.resetTimer();
    });

    this.minuteInput.addEventListener("input", () => {
      this.updateDisplayFromInput();
      this.saveMinutes();

      const timerVal = parseInt(this.minuteInput.value, 10) || 0;
      this.intervalInput.max = timerVal;

      if (parseInt(this.intervalInput.value, 10) > timerVal) {
        this.intervalInput.value = timerVal;
      }

      this.updateIntervalSettings();
    });

    this.musicOnOff.addEventListener("click", () => {
      this.musicOnOffClick();
      this.saveSettings();
    });

    this.musicSelect.addEventListener("change", () => {
      this.changeMusic();
      this.saveSettings();
    });

    this.toggleInterval.addEventListener("change", () => {
      this.toggleIntervalInput();
      this.saveSettings();
    });

    this.intervalInput.addEventListener("input", () => {
      this.updateIntervalSettings();
      this.saveSettings();
    });

    this.soundToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSoundMenu();
      this.soundToggle.blur();
    });

    document.addEventListener("click", (e) => {
      if (
        this.soundMenu.classList.contains("show") &&
        !this.soundMenu.contains(e.target) &&
        e.target !== this.soundToggle
      ) {
        this.hideSoundMenu();
      }
    });

    this.volumeSlider.addEventListener("input", () => {
      this.changeVolume();
      this.saveSettings();
    });

    ["mousemove", "mousedown", "touchstart", "keydown"].forEach((event) => {
      this.soundMenu.addEventListener(event, () =>
        this.resetSoundMenuTimeout()
      );
    });
  }

  saveMinutes() {
    localStorage.setItem("meditational_minutes", this.minuteInput.value);
  }

  restoreMinutes() {
    const minutes = localStorage.getItem("meditational_minutes");
    if (minutes !== null) this.minuteInput.value = minutes;
  }

  toggleIntervalInput() {
    if (this.toggleInterval.checked) {
      this.intervalInput.classList.remove("hidden");
      this.intervalInput.disabled = false;
      this.updateIntervalSettings();
    } else {
      this.intervalInput.classList.add("hidden");
    }
  }

  changeMusic() {
    const selected = this.musicSelect.value;
    this.stopAmbient();
    if (this.musicOnOff.src.includes("volume.png")) {
      this.startAmbient(selected);
    }
  }

  startAmbient(key) {
    if (!this.ambientBuffers[key]) return;
    this.stopAmbient();

    const source = this.audioCtx.createBufferSource();
    source.buffer = this.ambientBuffers[key];
    source.loop = true;
    source.connect(this.ambientGain);
    source.start(0);

    this.ambientSource = source;
    this.audio = key;
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch {}
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }
  }

  musicOnOffClick() {
    if (this.musicOnOff.src.includes("volume.png")) {
      this.musicOnOff.src = "img/volume-mute.png";
      this.stopAmbient();
    } else {
      this.musicOnOff.src = "img/volume.png";
      this.startAmbient(this.musicSelect.value);
    }
  }

  changeVolume() {
    const volume = this.volumeSlider.value / 100;
    this.musicOnOff.src =
      volume === 0 ? "img/volume-mute.png" : "img/volume.png";
    this.ambientGain.gain.value = volume;
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
      if (this.timeLeft === 0) {
        this.timeLeft = (parseInt(this.minuteInput.value, 10) || 0) * 60;
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
        this.playBell("start");
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
    this.timeLeft = (parseInt(this.minuteInput.value, 10) || 0) * 60;
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

  updateTimer() {
    if (this.isPaused) return;

    this.timeLeft--;

    if (this.toggleInterval.checked && this.intervalDuration > 0) {
      this.intervalTime--;
      if (this.intervalTime <= 0 && this.timeLeft > 1) {
        this.unlockAllAudioOnce();
        this.playBell("interval");
        this.intervalTime = this.intervalDuration;
      }
    }

    if (this.timeLeft <= 0) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
      this.timeLeft = (parseInt(this.minuteInput.value, 10) || 0) * 60;
      this.displayTime();
      this.playPauseButton.innerHTML = "▶";
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

  changeToGuided() {
    this.isPaused = true;
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
    window.location.href = "guidedSection.html";
  }

  saveSettings() {
    // placeholder
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new TimerApp();

  function isMobileDevice() {
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/.test(ua);
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 1;
    return isMobile && isTouch;
  }

  const muteNotice = document.getElementById("muteNotice");
  const dismissBtn = document.getElementById("dismissMuteNotice");
  const intervalToggle = document.getElementById("toggleInterval");

  if (muteNotice) {
    muteNotice.style.display = "none";
    document.body.style.overflow = "";
  }

  if (muteNotice && dismissBtn && intervalToggle && isMobileDevice()) {
    intervalToggle.addEventListener("change", function () {
      if (intervalToggle.checked) {
        muteNotice.style.display = "flex";
        document.body.style.overflow = "hidden";
      }
    });

    dismissBtn.addEventListener("click", () => {
      muteNotice.style.display = "none";
      document.body.style.overflow = "";
    });
  }
});
