document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pulsate");

  const guidedButton = document.getElementById("guided-start");
  const rakshitButton = document.getElementById("rakshit");
  const stopButton = document.getElementById("guided-stop");

  if (guidedButton && rakshitButton && stopButton) {
    guidedButton.addEventListener("click", playPauseGuidedSession);
    rakshitButton.addEventListener("click", startGuidedSession);
    stopButton.addEventListener("click", stopGuidedSession);
  }
});

let guidedSessionAudio = null;

function startGuidedSession() {
  const rakshitButton = document.getElementById("rakshit");
  const stopButton = document.getElementById("guided-stop");
  const guidedButton = document.getElementById("guided-start");

  if (!guidedSessionAudio) {
    guidedSessionAudio = new Audio("guidedSession.mp3");

    guidedSessionAudio.addEventListener("ended", () => {
      guidedButton.textContent = "▶";
      guidedButton.classList.add("hidden"); // <-- hide again when done
      rakshitButton.classList.remove("hidden");
      stopButton.classList.add("hidden");
      guidedSessionAudio = null;
    });
  }

  guidedSessionAudio.play();
  guidedButton.textContent = "⏸";
  guidedButton.classList.remove("hidden"); // <-- SHOW play/pause button

  rakshitButton.classList.add("hidden");
  stopButton.classList.remove("hidden");
}

function stopGuidedSession() {
  const rakshitButton = document.getElementById("rakshit");
  const stopButton = document.getElementById("guided-stop");
  const guidedButton = document.getElementById("guided-start");

  if (guidedSessionAudio) {
    guidedSessionAudio.pause();
    guidedSessionAudio.currentTime = 0;
    guidedSessionAudio = null;
  }

  guidedButton.textContent = "▶";
  guidedButton.classList.add("hidden"); // <-- HIDE when stopped
  stopButton.classList.add("hidden");
  rakshitButton.classList.remove("hidden");
}

function playPauseGuidedSession() {
  const guidedButton = document.getElementById("guided-start");

  if (!guidedSessionAudio) {
    guidedSessionAudio = new Audio("guidedSession.mp3");
    guidedSessionAudio.addEventListener("ended", () => {
      guidedButton.textContent = "▶";
      guidedSessionAudio = null;
    });
  }

  if (guidedSessionAudio.paused) {
    guidedSessionAudio.play();
    guidedButton.textContent = "⏸";
  } else {
    guidedSessionAudio.pause();
    guidedButton.textContent = "▶";
  }
}

function changeToIndex() {
  window.location.href = "index.html";
}
