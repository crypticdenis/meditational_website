document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");
});

const minuteInput = document.getElementById("minutes");
const interval = document.getElementById("intervalInput");
const playPauseButton = document.getElementById("playPause");
const resetbutton = document.getElementById("reset");
const countdowndisplay = document.getElementById("countdown");
const settings = document.getElementById("settings");
const musicOnOff = document.getElementById("musicOn");
const musicSelect = document.getElementById("musicSelect");
const volumeSlider = document.getElementById("volumeSlider");

let countdowninterval;
let timeleft = 0;
let isPaused;
let intervalTime = 0;
let intervalDuration = 0;

const audioFiles = {
  "river.mp3": new Audio("river.mp3"),
  "woods.mp3": new Audio("woods.mp3"),
  "white_noise.mp3": new Audio("white_noise.mp3"),
};

// Initialize audio settings
for (const a of Object.values(audioFiles)) {
  a.loop = true;
  a.volume = volumeSlider.value / 100;
}

let audio = audioFiles[musicSelect.value];

// Event listeners
playPauseButton.addEventListener("click", playPause);
minuteInput.addEventListener("input", updateDisplayFromInput);
musicOnOff.addEventListener("click", toggleMusic);
musicSelect.addEventListener("change", handleMusicChange);
volumeSlider.addEventListener("input", changeVolume);

function toggleMusic() {
  if (audio.paused) {
    musicOnOff.src = "volume.png";
    audio.play();
  } else {
    musicOnOff.src = "volume-mute.png";
    audio.pause();
  }
}

function handleMusicChange() {
  const wasPlaying = !audio.paused;
  audio.pause();
  audio = audioFiles[this.value];
  audio.volume = volumeSlider.value / 100;
  if (wasPlaying) {
    audio.play();
    musicOnOff.src = "volume.png";
  }
}

function changeVolume() {
  const volume = volumeSlider.value / 100;
  // Update all audio volumes
  for (const a of Object.values(audioFiles)) {
    a.volume = volume;
  }
  // Update music icon based on volume
  if (volume === 0) {
    musicOnOff.src = "volume-mute.png";
  } else if (audio.paused) {
    musicOnOff.src = "volume-mute.png";
  } else {
    musicOnOff.src = "volume.png";
  }
}

function changeToGuided() {
  window.location.href = "guidedSection.html";
}

function playPause() {
  if (!countdowninterval || isPaused) {
    if (timeleft === 0) {
      playSound();
      const minutes = parseInt(minuteInput.value, 10) || 0;
      timeleft = minutes * 60;
    }
    playPauseButton.textContent = "⏸";
    isPaused = false;
    settings.classList.add("hidden");
    countdowndisplay.classList.add("move-up");

    if (!countdowninterval) {
      playSound();
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
});

function playSound() {
  const audio = new Audio("gong.mp3");
  audio.volume = volumeSlider.value / 100;
  audio.play();
}

document.addEventListener("DOMContentLoaded", () => {
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
  });

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      intervalInput.classList.remove("hidden");
    } else {
      intervalInput.classList.add("hidden");
    }
  });
});

function updateTimer() {
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
    }

    if (
      document.getElementById("toggleInterval").checked &&
      intervalDuration > 0
    ) {
      intervalTime--;
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
