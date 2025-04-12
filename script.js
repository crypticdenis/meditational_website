const minuteInput = document.getElementById("minutes");
const interval = document.getElementById("intervalInput");
const playPauseButton = document.getElementById("playPause");
const resetbutton = document.getElementById("reset");
const countdowndisplay = document.getElementById("countdown");
const settings = document.getElementById("settings");

let countdowninterval;
let timeleft = 0;
let isPaused;

playPauseButton.addEventListener("click", playPause);
minuteInput.addEventListener("input", updateDisplayFromInput);

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
});

function playSound() {
  const audio = new Audio("gong.mp3"); // Replace with your sound file path
  audio.play();
  audio.volume = 0.5; // Set volume to 50%
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggleInterval");
  const intervalInput = document.getElementById("interval");

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
      timeleft = 0;
      playPauseButton.textContent = "▶"; // Play icon
      isPaused = false;
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
