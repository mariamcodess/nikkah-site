const WEDDING_DATE = new Date("2026-08-22T15:00:00-04:00");

const body = document.body;
const site = document.getElementById("site");
const gateCopy = document.getElementById("gate-copy");
const passwordForm = document.getElementById("password-form");
const passwordInput = document.getElementById("password");
const passwordError = document.getElementById("password-error");
const showReturning = document.getElementById("show-returning");
const showPassword = document.getElementById("show-password");
const returningGuest = document.getElementById("returning-guest");
const returningForm = document.getElementById("returning-form");
const returningError = document.getElementById("returning-error");
const rsvpForm = document.getElementById("rsvp-form");
const rsvpMessage = document.getElementById("rsvp-message");
const days = document.getElementById("days");
const audioToggle = document.getElementById("audio-toggle");
const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.getElementById("site-nav");
const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const forceGate = new URLSearchParams(window.location.search).has("gate");

let audioContext;
let beatTimer;

function unlockSite() {
  body.classList.remove("locked");
  body.classList.add("unlocked");
  site.setAttribute("aria-hidden", "false");
  sessionStorage.setItem("nikkahUnlocked", "true");

  if (sessionStorage.getItem("nikkahRsvpConfirmed") === "true") {
    body.classList.remove("rsvp-required");
    body.classList.add("rsvp-confirmed");
    requestAnimationFrame(() => {
      if (window.location.hash) {
        document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }

      document.getElementById("home")?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    return;
  }

  body.classList.add("rsvp-required");
  requestAnimationFrame(() => {
    document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (isLocalPreview && !forceGate) {
  sessionStorage.setItem("nikkahUnlocked", "true");
  sessionStorage.setItem("nikkahRsvpConfirmed", "true");
  unlockSite();
} else if (sessionStorage.getItem("nikkahUnlocked") === "true") {
  unlockSite();
}

menuToggle.addEventListener("click", () => {
  const isOpen = topbar.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    topbar.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

showReturning.addEventListener("click", () => {
  passwordForm.classList.add("hidden");
  showReturning.classList.add("hidden");
  returningGuest.classList.remove("hidden");
  gateCopy.classList.add("hidden");
  returningError.textContent = "";
});

showPassword.addEventListener("click", () => {
  returningGuest.classList.add("hidden");
  passwordForm.classList.remove("hidden");
  showReturning.classList.remove("hidden");
  gateCopy.classList.remove("hidden");
  gateCopy.textContent = "Please enter the guest password from your invitation to confirm your RSVP.";
  passwordError.textContent = "";
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  passwordError.textContent = "";
  const enteredPassword = passwordInput.value.trim();

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: enteredPassword }),
    });

    if (!response.ok) {
      throw new Error("Invalid password");
    }

    sessionStorage.setItem("nikkahGuestPassword", enteredPassword);
    unlockSite();
  } catch {
    passwordError.textContent = "That password did not match. Please try again.";
    passwordInput.select();
  }
});

returningForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  returningError.textContent = "Checking your RSVP...";

  const formData = new FormData(returningForm);
  const payload = {
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  };

  try {
    const response = await fetch("/api/rsvp-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.confirmed) {
      throw new Error(result.error || "We could not find a confirmed RSVP with those details.");
    }

    sessionStorage.setItem("nikkahUnlocked", "true");
    sessionStorage.setItem("nikkahRsvpConfirmed", "true");
    unlockSite();
  } catch (error) {
    returningError.textContent = error.message || "Please try again or use the guest password.";
  }
});

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  rsvpMessage.textContent = "Confirming your RSVP...";

  const formData = new FormData(rsvpForm);
  const payload = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    attendance: formData.get("attendance"),
  };

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-site-password": sessionStorage.getItem("nikkahGuestPassword") || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Unable to submit RSVP");
    }

    rsvpForm.reset();
    sessionStorage.setItem("nikkahRsvpConfirmed", "true");
    body.classList.remove("rsvp-required");
    body.classList.add("rsvp-confirmed");
    rsvpMessage.textContent = "Thank you. Your RSVP is confirmed, insha'Allah.";
    requestAnimationFrame(() => {
      document.getElementById("home")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } catch (error) {
    rsvpMessage.textContent = error.message || "Something went wrong. Please try again.";
  }
});

function updateCountdown() {
  const difference = WEDDING_DATE.getTime() - Date.now();
  const dayCount = Math.max(0, Math.ceil(difference / 86400000));
  days.textContent = String(dayCount);
}

function playTone(frequency, startTime, duration, gainValue) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playBeatPattern() {
  const now = audioContext.currentTime;
  playTone(174.61, now, 1.8, 0.018);
  playTone(220, now + 0.08, 1.6, 0.014);
  playTone(261.63, now + 1.9, 1.7, 0.014);
  playTone(196, now + 2.02, 1.5, 0.012);
}

audioToggle.addEventListener("click", async () => {
  if (beatTimer) {
    clearInterval(beatTimer);
    beatTimer = undefined;
    audioToggle.setAttribute("aria-label", "Play soft background sound");
    audioToggle.setAttribute("aria-pressed", "false");
    return;
  }

  audioContext = audioContext || new AudioContext();
  await audioContext.resume();
  playBeatPattern();
  beatTimer = setInterval(playBeatPattern, 4200);
  audioToggle.setAttribute("aria-label", "Pause soft background sound");
  audioToggle.setAttribute("aria-pressed", "true");
});

updateCountdown();
