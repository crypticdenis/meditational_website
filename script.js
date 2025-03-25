const minuteInput = document.getElementById("minutes");
const startbutton = document.getElementById("start");
const resetbutton = document.getElementById("reset");
const countdowndisplay = document.getElementById("countdown");
let countdowninterval;

startbutton.addEventListener("click", () => {
  const minutes = minuteInput.value;

  startbutton.disabled = true;
  timeleft = minutes * 60;

  countdownInterval = setInterval(() => {
    const minutes = Math.floor(timeleft / 60);
    const seconds = timeleft % 60;

    countdowndisplay.innerText = `${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
    clearInterval(countdowninterval);
    timeleft--;
    if (timeleft < 0) {
      clearInterval(countdownInterval);
      countdowndisplay.textContent = "Time's up";
    }
  }, 1000);
});
resetbutton.addEventListener("click", () => {
  startbutton.disabled = false;
  clearInterval(countdownInterval);
  countdowndisplay.textContent = "00:00";
  minuteInput.value = "";
});
