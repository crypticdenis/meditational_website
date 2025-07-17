document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");

  const toggle = document.getElementById("toggleInterval");
  const intervalInput = document.getElementById("interval");

  intervalInput.addEventListener("input", () => {
    const maxInterval = parseInt(minuteInput.value, 10) || 0;
    const intervalValue = parseInt(intervalInput.value, 10) || 0;
    if (intervalValue > maxInterval) {
      intervalInput.value = maxInterval;
    }
    intervalDuration = parseInt(intervalInput.value, 10) * 60 || 0;
    intervalTime = intervalDuration;
    console.log("Interval duration set to:", intervalDuration, "seconds");
  });

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      intervalInput.classList.remove("hidden");
      intervalDuration = parseInt(intervalInput.value, 10) * 60 || 0;
      intervalTime = intervalDuration;
    } else {
      intervalInput.classList.add("hidden");
    }
  });
});

const minuteInput = document.getElementById("minutes");
const playPauseButton = document.getElementById("playPause");
const resetbutton = document.getElementById("reset");
const countdowndisplay = document.getElementById("countdown");
const settings = document.getElementById("timerContainer");
const musicOnOff = document.getElementById("musicOn");
const musicSelect = document.getElementById("musicSelect");

let countdowninterval;
let timeleft = 0;
let isPaused;
let intervalTime = 0;
let intervalDuration = 1;
let soundMenuTimeout;
let audioUnlocked = false;
let audioCtx;
let hasPlayedStartBell = false;

const GongAudio = new Audio("sounds/untitled.mp3");
const finishedAudio = new Audio("sounds/gong.mp3");
const silentAudio = new Audio("sounds/silent.mp3");

finishedAudio.volume = 1;
GongAudio.volume = 1;

const audioFiles = {
  "river.mp3": new Audio("sounds/river.mp3"),
  "woods.mp3": new Audio("sounds/woods.mp3"),
  "white_noise.mp3": new Audio("sounds/white_noise.mp3"),
};

for (const a of Object.values(audioFiles)) {
  a.loop = true;
  a.volume = 0.5;
}

let audio = audioFiles[musicSelect.value];

playPauseButton.addEventListener("click", playPause);
minuteInput.addEventListener("input", updateDisplayFromInput);
musicOnOff.addEventListener("click", musicOnOffClick);

musicSelect.addEventListener("change", function () {
  const wasPlaying = !audio.paused;
  audio.pause();
  audio.currentTime = 0;
  audio = audioFiles[this.value];
  if (musicOnOff.src.includes("volume.png") && wasPlaying) {
    audio.play();
  }
});

function musicOnOffClick() {
  const musicIcon = document.getElementById("musicOn");
  if (musicIcon.src.includes("volume.png")) {
    musicIcon.src = "img/volume-mute.png";
    audio.pause();
  } else {
    musicIcon.src = "img/volume.png";
    audio.play();
  }
}

function unlockAllAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx
      .resume()
      .catch((e) => console.warn("AudioContext resume failed:", e));
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  }
  silentAudio.volume = 0;
  silentAudio.play().catch((e) => console.warn("Silent unlock failed:", e));
}

function hideSoundMenu() {
  document.getElementById("soundMenu").classList.remove("show");
}

function resetSoundMenuTimeout() {
  clearTimeout(soundMenuTimeout);
  soundMenuTimeout = setTimeout(hideSoundMenu, 4000);
}

document.getElementById("soundToggle").addEventListener("click", () => {
  const menu = document.getElementById("soundMenu");
  menu.classList.toggle("show");
  if (menu.classList.contains("show")) {
    resetSoundMenuTimeout();
  } else {
    clearTimeout(soundMenuTimeout);
  }
});

["mousemove", "mousedown", "touchstart", "keydown"].forEach((event) => {
  document
    .getElementById("soundMenu")
    .addEventListener(event, resetSoundMenuTimeout);
});

function changeVolume() {
  const volume = document.getElementById("volumeSlider").value / 100;
  musicOnOff.src = volume === 0 ? "img/volume-mute.png" : "img/volume.png";
  if (volume > 0) audio.play();
  for (const a of Object.values(audioFiles)) a.volume = volume;
}

function changeToGuided() {
  window.location.href = "guidedSection.html";
}

function playPause() {
  if (!audioUnlocked) {
    audioUnlocked = true;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
    }
    silentAudio.volume = 0;
    silentAudio.play().catch((e) => console.warn("Silent unlock failed:", e));
  }

  if (!countdowninterval || isPaused) {
    if (timeleft === 0) {
      const minutes = parseInt(minuteInput.value, 10) || 0;
      timeleft = minutes * 60;
    }
    playPauseButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>`;
    isPaused = false;
    settings.classList.add("hidden");
    countdowndisplay.classList.add("move-up");
    if (!hasPlayedStartBell) {
      playSound();
      hasPlayedStartBell = true;
    }
    if (!countdowninterval) {
      countdowninterval = setInterval(updateTimer, 1000);
    }
  } else {
    playPauseButton.textContent = "▶";
    isPaused = true;
  }
}

resetbutton.addEventListener("click", () => {
  resetTimer();
  settings.classList.remove("hidden");
  countdowndisplay.classList.remove("move-up");
  intervalTime = 0;
  intervalDuration = 0;
  hasPlayedStartBell = false;
});

function playSound() {
  GongAudio.play().catch((e) => console.warn("GongAudio failed:", e));
}

function playFinished() {
  finishedAudio.play().catch((e) => console.warn("FinishedAudio failed:", e));
}

function updateTimer() {
  console.log("updateTimer running", timeleft);
  if (!isPaused) {
    timeleft--;
    if (timeleft <= 0) {
      playSound();
      settings.classList.remove("hidden");
      countdowndisplay.classList.remove("move-up");
      clearInterval(countdowninterval);
      countdowninterval = null;
      const minutes = parseInt(minuteInput.value, 10) || 0;
      timeleft = minutes * 60;
      displayTime();
      playPauseButton.textContent = "▶";
      isPaused = false;
      hasPlayedStartBell = false;
      playFinished();
    }
    if (
      document.getElementById("toggleInterval").checked &&
      intervalDuration > 0
    ) {
      intervalTime--;
      console.log("Interval time left:", intervalTime);
      if (intervalTime <= 0) {
        playSound();
        intervalTime = intervalDuration;
      }
    }
    displayTime();
  }
}

function displayTime() {
  const minutes = Math.floor(timeleft / 60);
  const seconds = timeleft % 60;
  countdowndisplay.innerHTML = `<p>${minutes}:${String(seconds).padStart(
    2,
    "0"
  )}</p>`;
}

function resetTimer() {
  clearInterval(countdowninterval);
  countdowninterval = null;
  const minutes = parseInt(minuteInput.value, 10) || 0;
  timeleft = minutes * 60;
  isPaused = false;
  playPauseButton.textContent = "▶";
  displayTime();
  settings.style.visibility = "visible";
  settings.classList.remove("hidden");
}

function updateDisplayFromInput() {
  const minutes = parseInt(minuteInput.value, 10) || 0;
  timeleft = minutes * 60;
  const displayMinutes = Math.floor(timeleft / 60);
  const displaySeconds = timeleft % 60;
  countdowndisplay.innerText = `${displayMinutes}:${
    displaySeconds < 10 ? "0" : ""
  }${displaySeconds}`;
}
