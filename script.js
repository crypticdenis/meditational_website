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
const musicSelect = document.getElementById("musicSelect"); // >>> ADDED

let countdowninterval;
let timeleft = 0;
let isPaused;
let intervalTime = 0; // Time left for the interval
let intervalDuration = 0; // Duration of the interval

const audioFiles = {
  "river.mp3": new Audio("river.mp3"),
  "woods.mp3": new Audio("woods.mp3"),
  "white_noise.mp3": new Audio("white_noise.mp3"),
};

for (const a of Object.values(audioFiles)) {
  a.loop = true;
  a.volume = 0.025;
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

function changeToGuided() {
  window.location.href = "guidedSection.html";
}
function playPause() {
  // Check if the timer is already running
  if (!countdowninterval || isPaused) {
    // Start or resume timer
    if (timeleft === 0) {
      playSound(); // Play sound when starting the timer
      const minutes = parseInt(minuteInput.value, 10) || 0;
      timeleft = minutes * 60;
    }
    playPauseButton.textContent = "⏸"; // Pause icon
    isPaused = false;

    // Hide settings with a smooth fade-out
    settings.classList.add("hidden");

    // Move the countdown up
    countdowndisplay.classList.add("move-up");

    // Start interval if not running
    if (!countdowninterval) {
      playSound(); // Play sound when starting the timer
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

  // Reset interval time
  intervalTime = 0;
  intervalDuration = 0;
});

function playSound() {
  const audio = new Audio("gong.mp3"); // Replace with your sound file path
  audio.play();
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggleInterval");
  const intervalInput = document.getElementById("interval");

  // Ensure interval duration is valid
  intervalInput.addEventListener("input", () => {
    const maxInterval = parseInt(minuteInput.value, 10) || 0;
    const intervalValue = parseInt(intervalInput.value, 10) || 0;

    if (intervalValue > maxInterval) {
      intervalInput.value = maxInterval; // Restrict interval to timer duration
    }

    intervalDuration = parseInt(intervalInput.value, 10) * 60 || 0; // Convert to seconds
    intervalTime = intervalDuration; // Reset interval time
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
      playSound(); // Play sound when the timer ends
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

    // Handle interval gong
    if (
      document.getElementById("toggleInterval").checked &&
      intervalDuration > 0
    ) {
      intervalTime--;
      if (intervalTime <= 0) {
        playSound(); // Play gong for interval
        intervalTime = intervalDuration; // Reset interval time
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
