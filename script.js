document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");
});

const minuteInput = document.getElementById("minutes");
const playPauseButton = document.getElementById("playPause");
const resetbutton = document.getElementById("reset");
const countdowndisplay = document.getElementById("countdown");
const settings = document.getElementById("settings");
const musicOnOff = document.getElementById("musicOn");
const musicSelect = document.getElementById("musicSelect"); // >>> ADDED

let countdowninterval;
let timeleft = 0;
let isPaused;
let intervalTime = 0; // Time left for the interval
let intervalDuration = 1; // Duration of the interval
let soundMenuTimeout;
const GongAudio = new Audio("untitled.mp3");
const finishedAudio = new Audio("gong.mp3");
finishedAudio.volume = 1;
GongAudio.volume = 1;

const audioFiles = {
  "river.mp3": new Audio("river.mp3"),
  "woods.mp3": new Audio("woods.mp3"),
  "white_noise.mp3": new Audio("white_noise.mp3"),
};

for (const a of Object.values(audioFiles)) {
  a.loop = true;
  a.volume = 0.5;
}

let audio = audioFiles[musicSelect.value];

playPauseButton.addEventListener("click", playPause);
minuteInput.addEventListener("input", updateDisplayFromInput);
musicOnOff.addEventListener("click", musicOnOffClick);

// >>> ADDED: handle music selection change
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
    // Switch to music-off image
    musicIcon.src = "volume-mute.png";
    audio.pause(); // Stop the music
  } else {
    // Switch to music-on image
    musicIcon.src = "volume.png";
    audio.play(); // Play and loop the music
  }
}

function hideSoundMenu() {
  const menu = document.getElementById("soundMenu");
  menu.classList.remove("show");
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

// Hide menu after 5s of no interaction
["mousemove", "mousedown", "touchstart", "keydown"].forEach((event) => {
  document
    .getElementById("soundMenu")
    .addEventListener(event, resetSoundMenuTimeout);
});

function changeVolume() {
  const volumeSlider = document.getElementById("volumeSlider");
  const volume = volumeSlider.value / 100; // Convert to a value between 0 and 1
  if (volume === 0) {
    musicOnOff.src = "volume-mute.png"; // Change icon to mute
  } else {
    musicOnOff.src = "volume.png"; // Change icon to volume
    audio.play(); // Play the audio if it was paused
  }
  for (const a of Object.values(audioFiles)) {
    a.volume = volume;
  }
}

function changeToGuided() {
  window.location.href = "guidedSection.html";
}
function playPause() {
  // Check if the timer is already running
  if (!countdowninterval || isPaused) {
    // Start or resume timer
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

    // Hide settings with a smooth fade-out
    settings.classList.add("hidden");

    // Move the countdown up
    countdowndisplay.classList.add("move-up");

    if (!countdowninterval) {
      countdowninterval = setInterval(updateTimer, 1000);
    }
  } else {
    // Pause timer
    playPauseButton.textContent = "▶"; // Play icon
    isPaused = true;
  }
}

resetbutton.addEventListener("click", () => {
  resetTimer();

  // Show settings with a smooth fade-in
  settings.classList.remove("hidden");

  // Reset the countdown position
  countdowndisplay.classList.remove("move-up");

  intervalTime = 0;
  intervalDuration = 0;
});

function playFinished() {
  finishedAudio.play();
}

function playSound() {
  GongAudio.play();
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM fully loaded and script initialized");
  const toggle = document.getElementById("toggleInterval");
  const intervalInput = document.getElementById("interval");

  intervalInput.addEventListener("input", () => {
    const maxInterval = parseInt(minuteInput.value, 10) || 0;
    const intervalValue = parseInt(intervalInput.value, 10) || 0;

    if (intervalValue > maxInterval) {
      intervalInput.value = maxInterval;
    }

    intervalDuration = parseInt(intervalInput.value, 10) * 60 || 0; // Convert to seconds
    intervalTime = intervalDuration;
    console.log("Interval duration set to:", intervalDuration, "seconds");
  });

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      intervalInput.classList.remove("hidden");
      intervalDuration = parseInt(intervalInput.value, 10) * 60 || 0; // Convert to seconds
      intervalTime = intervalDuration; // Reset interval time
      console.log("Interval duration set to:", intervalDuration, "seconds");
    } else {
      intervalInput.classList.add("hidden");
    }
  });
});

function updateTimer() {
  console.log("updateTimer running", timeleft);

  if (!isPaused) {
    timeleft--;
    if (timeleft <= 0) {
      playFinished();
      settings.classList.remove("hidden");
      countdowndisplay.classList.remove("move-up");
      clearInterval(countdowninterval);
      countdowninterval = null;

      const minutes = parseInt(minuteInput.value, 10) || 0;
      timeleft = minutes * 60; // Reset timeleft
      displayTime(); // Update the display

      playPauseButton.textContent = "▶"; // Reset play button to play icon
      isPaused = false;
    }

    if (
      document.getElementById("toggleInterval").checked &&
      intervalDuration > 0
    ) {
      intervalTime--;
      console.log("Interval time left:", intervalTime);
      if (intervalTime <= 0) {
        playSound(); // Play gong for interval
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
  playPauseButton.textContent = "▶"; // Play icon
  displayTime();
  settings.style.visibility = "visible";
  settings.classList.remove("hidden");
}

function updateDisplayFromInput() {
  const minutes = parseInt(minuteInput.value, 10) || 0;
  timeleft = minutes * 60;

  // Update the display without starting timer
  const displayMinutes = Math.floor(timeleft / 60);
  const displaySeconds = timeleft % 60;

  countdowndisplay.innerText = `${displayMinutes}:${
    displaySeconds < 10 ? "0" : ""
  }${displaySeconds}`;
}
