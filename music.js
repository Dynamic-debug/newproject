const songs = [
    ["Aankhon Mein Teri Ajab Si", "Aankhon-Mein-Teri-Ajab-Si.mp3"],
    ["Aarzu", "Aarzu.mp3"],
    ["Bulleya", "Bulleya.mp3"],
    ["Can't Help Falling in Love", "Can-t-Help-Falling-In-Love-with.mp3"],
    ["Die With A Smile", "Die-With-A-Smile.mp3"],
    ["Dooron Dooron", "Dooron-Dooron.mp3"],
    ["Fitoor", "Fitoor.mp3"],
    ["Her", "her.mp3"],
    ["I Like Me Better", "I-Like-Me-Better.mp3"],
    ["I Think They Call This Love", "I-Think-They-Call-This-Love.mp3"],
    ["I Wanna Be Yours", "I-Wanna-Be-Yours.mp3"],
    ["Ik Kudi", "Ik-Kudi.mp3"],
    ["It's You", "It-s-You.mp3"],
    ["Kyon", "Kyon.mp3"],
    ["Main Agar Kahoon", "Main-Agar-Kahoon.mp3"],
    ["Naam Tera", "NAAM-TERA.mp3"],
    ["Perfect", "Perfect.mp3"],
    ["Samjho Na Nasamajh", "SAMJHO-NA-NASAMAJH.mp3"],
    ["Subhanallah", "Subhanallah.mp3"],
    ["Those Eyes", "Those-Eyes.mp3"],
    ["Tu Chahiye", "Tu-Chahiye.mp3"],
    ["Tum Se Hi", "Tum-Se-Hi.mp3"],
    ["Zulfein", "Zulfein.mp3"]
];

const audioPlayer = document.querySelector("#audio-player");
const songSelect = document.querySelector("#song-select");
const songName = document.querySelector("#song-name");
const playButton = document.querySelector("#play-song");
const previousButton = document.querySelector("#previous-song");
const nextButton = document.querySelector("#next-song");
const audioStatus = document.querySelector("#audio-status");
const artwork = document.querySelector("#artwork");
const seek = document.querySelector("#seek");
const timeCurrent = document.querySelector("#time-current");
const timeTotal = document.querySelector("#time-total");

/* the song the curtain opens on */
const OPENING_SONG = "Zulfein";

let currentSongIndex = Math.max(0, songs.findIndex(([title]) => title === OPENING_SONG));
let isSeeking = false;

for (const [title] of songs) {
    const option = document.createElement("option");
    option.value = title;
    option.textContent = title;
    songSelect.append(option);
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return "0:00";
    }
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function paintProgress() {
    const percent = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0;
    seek.value = percent;
    seek.style.setProperty("--played", `${percent}%`);
    timeCurrent.textContent = formatTime(audioPlayer.currentTime);
    timeTotal.textContent = formatTime(audioPlayer.duration);
}

function loadSong(index) {
    currentSongIndex = (index + songs.length) % songs.length;
    const [title, fileName] = songs[currentSongIndex];
    audioPlayer.src = `/audio/${encodeURIComponent(fileName)}`;
    audioPlayer.load();
    songName.textContent = title;
    songSelect.selectedIndex = currentSongIndex;
    audioStatus.textContent = "";
    paintProgress();
}

function playSong() {
    audioPlayer.play().catch(() => {
        audioStatus.textContent = "Tap play to start the song.";
    });
}

playButton.addEventListener("click", () => {
    if (audioPlayer.paused) {
        playSong();
    } else {
        audioPlayer.pause();
    }
});

previousButton.addEventListener("click", () => {
    loadSong(currentSongIndex - 1);
    playSong();
});

nextButton.addEventListener("click", () => {
    loadSong(currentSongIndex + 1);
    playSong();
});

songSelect.addEventListener("change", () => {
    loadSong(songSelect.selectedIndex);
    playSong();
});

seek.addEventListener("input", () => {
    isSeeking = true;
    seek.style.setProperty("--played", `${seek.value}%`);
    if (audioPlayer.duration) {
        timeCurrent.textContent = formatTime((seek.value / 100) * audioPlayer.duration);
    }
});

seek.addEventListener("change", () => {
    if (audioPlayer.duration) {
        audioPlayer.currentTime = (seek.value / 100) * audioPlayer.duration;
    }
    isSeeking = false;
});

audioPlayer.addEventListener("timeupdate", () => {
    if (!isSeeking) {
        paintProgress();
    }
});

audioPlayer.addEventListener("loadedmetadata", paintProgress);

audioPlayer.addEventListener("play", () => {
    playButton.classList.add("is-playing");
    playButton.setAttribute("aria-label", "Pause");
    artwork.classList.add("is-spinning");
});

audioPlayer.addEventListener("pause", () => {
    playButton.classList.remove("is-playing");
    playButton.setAttribute("aria-label", "Play");
    artwork.classList.remove("is-spinning");
});

audioPlayer.addEventListener("ended", () => {
    loadSong(currentSongIndex + 1);
    playSong();
});

audioPlayer.addEventListener("error", () => {
    audioStatus.textContent = "This song could not be loaded.";
});

loadSong(currentSongIndex);

/* ---------- curtain: tap to reveal the page and start the opening song ----------
   The song starts inside this click handler on purpose — it is the user gesture
   mobile browsers require before audio may play. */
const curtain = document.querySelector("#curtain");

if (curtain) {
    let opened = false;

    const openCurtain = () => {
        if (opened) {
            return;
        }
        opened = true;

        playSong(); /* already loaded with OPENING_SONG above */

        curtain.classList.add("is-open");
        document.body.classList.remove("is-curtained");

        const finish = () => {
            curtain.classList.add("is-gone");
            curtain.setAttribute("hidden", "");
        };

        /* not `once`: the CTA fades out first, so wait for a panel specifically */
        curtain.addEventListener("transitionend", (event) => {
            if (event.target.classList.contains("curtain-panel")) {
                finish();
            }
        });

        /* belt and braces: if the transition never fires, still clear the curtain */
        window.setTimeout(finish, 2000);
    };

    curtain.addEventListener("click", openCurtain);
} else {
    document.body.classList.remove("is-curtained");
}

/* ---------- tap-to-flip: notes and the portrait need to work on touch ---------- */
function makeFlippable(element) {
    element.addEventListener("click", () => {
        const flipped = element.classList.toggle("is-flipped");
        element.setAttribute("aria-pressed", String(flipped));
    });
}

document.querySelectorAll(".flip, #portrait").forEach(makeFlippable);

/* ---------- reveal sections as they scroll into view ---------- */
const revealables = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });

    revealables.forEach((element) => observer.observe(element));
} else {
    revealables.forEach((element) => element.classList.add("is-visible"));
}

/* ---------- falling petals (skipped when motion is reduced) ---------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const petalLayer = document.querySelector(".petals");

if (petalLayer && !prefersReducedMotion) {
    const petalCount = window.innerWidth < 600 ? 10 : 18;

    for (let i = 0; i < petalCount; i += 1) {
        const petal = document.createElement("span");
        const size = 8 + Math.random() * 10;
        petal.className = "petal";
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;
        petal.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
        petal.style.animationDuration = `${9 + Math.random() * 10}s`;
        petal.style.animationDelay = `${-Math.random() * 12}s`;
        petal.style.setProperty("--drift", `${Math.random() * 140 - 70}px`);
        petalLayer.append(petal);
    }
}
