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
const rsvpBack = document.getElementById("rsvp-back");
const days = document.getElementById("days");
const audioToggle = document.getElementById("audio-toggle");
const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.getElementById("site-nav");
const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const forceGate = new URLSearchParams(window.location.search).has("gate");
const YOUTUBE_AUDIO_ID = "mrPG1PWsqpk";
const YOUTUBE_AUDIO_VOLUME = 14;

let youtubePlayer;
let youtubeReady = false;
let shouldPlayAudio = false;

function unlockSite() {
  body.classList.remove("locked");
  body.classList.add("unlocked");
  site.setAttribute("aria-hidden", "false");
  sessionStorage.setItem("nikkahUnlocked", "true");
  startSoftAudio();

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

function returnToInvitation() {
  sessionStorage.removeItem("nikkahUnlocked");
  sessionStorage.removeItem("nikkahGuestPassword");
  body.classList.add("locked");
  body.classList.remove("unlocked", "rsvp-required", "rsvp-confirmed");
  site.setAttribute("aria-hidden", "true");
  rsvpMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  passwordInput.focus();
}

if (forceGate) {
  sessionStorage.removeItem("nikkahUnlocked");
  sessionStorage.removeItem("nikkahRsvpConfirmed");
  sessionStorage.removeItem("nikkahGuestPassword");
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

rsvpBack.addEventListener("click", returnToInvitation);

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

function setAudioToggle(isPlaying) {
  audioToggle.setAttribute("aria-label", isPlaying ? "Pause soft background sound" : "Play soft background sound");
  audioToggle.setAttribute("aria-pressed", String(isPlaying));
}

function createYouTubePlayer() {
  youtubePlayer = new YT.Player("youtube-player", {
    height: "1",
    width: "1",
    videoId: YOUTUBE_AUDIO_ID,
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: YOUTUBE_AUDIO_ID,
      playsinline: 1,
      rel: 0,
    },
    events: {
      onReady: (event) => {
        youtubeReady = true;
        event.target.setVolume(YOUTUBE_AUDIO_VOLUME);
        if (shouldPlayAudio) {
          event.target.playVideo();
          setAudioToggle(true);
        }
      },
    },
  });
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    createYouTubePlayer();
    return;
  }

  window.onYouTubeIframeAPIReady = createYouTubePlayer;

  if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
}

function startSoftAudio() {
  shouldPlayAudio = true;

  if (youtubeReady && youtubePlayer?.playVideo) {
    youtubePlayer.setVolume(YOUTUBE_AUDIO_VOLUME);
    youtubePlayer.playVideo();
    setAudioToggle(true);
  }
}

function pauseSoftAudio() {
  shouldPlayAudio = false;

  if (youtubePlayer?.pauseVideo) {
    youtubePlayer.pauseVideo();
  }

  setAudioToggle(false);
}

audioToggle.addEventListener("click", () => {
  const isPlaying = audioToggle.getAttribute("aria-pressed") === "true";

  if (isPlaying) {
    pauseSoftAudio();
    return;
  }

  startSoftAudio();
});

loadYouTubeApi();
updateCountdown();
