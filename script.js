const minuteInput = document.getElementById("minutes");
const playPause = document.getElementById("playPause");
const resetbutton = document.getElementById("reset");
const countdowndisplay = document.getElementById("countdown");

let countdowninterval;
let timeleft = 0;
let isPaused;

playPause.addEventListener("click", () => {
  if (!countdowninterval || isPaused) {
    // Start or resume timer
    if (timeleft === 0) {
      playSound(); // Play sound when starting the timer
      const minutes = parseInt(minuteInput.value, 10) || 0;
      timeleft = minutes * 60;
    }
    playPause.textContent = "⏸"; // Pause icon
    isPaused = false;
    minuteInput.style.visibility = "hidden"; // Make input invisible

    // Start interval if not running
    if (!countdowninterval) {
      playSound(); // Play sound when starting the timer
      countdowninterval = setInterval(updateTimer, 1000);
    }
  } else {
    // Pause timer
    playPause.textContent = "▶"; // Play icon
    isPaused = true;
  }
});

resetbutton.addEventListener("click", () => {
  resetTimer();
});

function playSound() {
  const audio = new Audio("gong.mp3"); // Replace with your sound file path
  audio.play();
  audio.volume = 0.5; // Set volume to 50%
}

function updateTimer() {
  if (!isPaused) {
    timeleft--;
    if (timeleft <= 0) {
      playSound();
      minuteInput.style.visibility = "visible"; // Make input invisible
      clearInterval(countdowninterval);
      countdowninterval = null;
      timeleft = 0;
      playPause.textContent = "▶"; // Play icon
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
  playPause.textContent = "▶"; // Play icon
  displayTime();
  minuteInput.style.visibility = "visible"; // Make input invisible
}

// Add this event listener for the input element
minuteInput.addEventListener("input", updateDisplayFromInput);

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
