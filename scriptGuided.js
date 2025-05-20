document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");

  // Initialize with all cards visible and controls hidden
  document.getElementById("session-controls").classList.add("hidden");
});

let currentSessionAudio = null;

function startMeditationSession(audioFile) {
  // Hide all meditation cards
  document.querySelectorAll(".meditation-card").forEach((card) => {
    card.classList.add("hidden");
  });

  // Show session controls
  const sessionControls = document.getElementById("session-controls");
  sessionControls.classList.remove("hidden");

  // Stop any existing audio
  if (currentSessionAudio) {
    currentSessionAudio.pause();
    currentSessionAudio = null;
  }

  // Start new audio
  currentSessionAudio = new Audio(audioFile);
  currentSessionAudio.addEventListener("ended", endSession);
  currentSessionAudio.play();

  // Update button to show pause icon
  document.getElementById("play-pause-btn").textContent = "⏸";
}

function togglePlayPause() {
  const btn = document.getElementById("play-pause-btn");

  if (currentSessionAudio.paused) {
    currentSessionAudio.play();
    btn.textContent = "⏸";
  } else {
    currentSessionAudio.pause();
    btn.textContent = "▶";
  }
}

function exitSession() {
  if (currentSessionAudio) {
    currentSessionAudio.pause();
    currentSessionAudio.currentTime = 0;
    currentSessionAudio = null;
  }

  // Show cards again
  document.querySelectorAll(".meditation-card").forEach((card) => {
    card.classList.remove("hidden");
  });

  // Hide controls
  document.getElementById("session-controls").classList.add("hidden");
}

function endSession() {
  exitSession(); // Same behavior as exiting manually
}

function changeToIndex() {
  window.location.href = "index.html";
}
