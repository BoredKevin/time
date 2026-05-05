import { database } from './firebase-config.js';
import { ref, onValue, set, get, remove } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { setupThemeToggle } from './utils.js';

export function initTV() {
    setupThemeToggle();

    const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    let scheduleData = {};
    let isStarted = false;

    const startBtn = document.getElementById('start-btn');
    if(startBtn) {
        startBtn.addEventListener('click', () => {
            document.getElementById('tap-to-start').classList.add('hidden');
            isStarted = true;
        });
    }

    function timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function getCurrentSchedule(dayName, h, m) {
        const now = h * 60 + m;
        const schedule = scheduleData[dayName] || [{ start: "00:00", sub: "Memuat jadwal..." }];
        
        for (let i = 0; i < schedule.length; i++) {
            const current = schedule[i];
            const next = schedule[i + 1];

            if (next) {
                if (now >= timeToMinutes(current.start) && now < timeToMinutes(next.start)) {
                    return { current, next };
                }
            } else {
                if (now >= timeToMinutes(current.start)) {
                    let tomorrowIdx = (DAYS_ID.indexOf(dayName) + 1) % 7;
                    let tomorrowName = DAYS_ID[tomorrowIdx];
                    let tomorrowSchedule = scheduleData[tomorrowName] || [{ start: "00:00", sub: "..." }];
                    return { current, next: tomorrowSchedule[0] };
                }
            }
        }
        return { current: schedule[0], next: schedule[1] || schedule[0] };
    }

    function pad(n) { return String(n).padStart(2, '0'); }

    const clockEl = document.getElementById('clock');
    const secBar = document.getElementById('sec-bar');
    const secLabel = document.getElementById('sec-label');
    const dayNameEl = document.getElementById('day-name');
    const dateFullEl = document.getElementById('date-full');

    const currentBox = document.getElementById('current-schedule-box');
    const scheduleText = document.getElementById('schedule-text');
    const nextBox = document.getElementById('next-schedule-box');
    const nextScheduleText = document.getElementById('next-schedule-text');

    const yearEl = document.getElementById('current-year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    let lastScheduleKey = '';

    function tick() {
        if(!clockEl) return;
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        const dayName = DAYS_ID[now.getDay()];

        clockEl.innerHTML = `${pad(h)}<span class="separator">:</span>${pad(m)}<span class="separator">:</span>${pad(s)}`;
        const pct = (s / 60) * 100;
        secBar.style.width = pct + '%';
        secLabel.textContent = pad(s);

        dayNameEl.textContent = dayName;
        dateFullEl.textContent = `${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;

        if (Object.keys(scheduleData).length === 0) return;

        const { current, next } = getCurrentSchedule(dayName, h, m);
        const key = dayName + '-' + current.sub;

        if (key !== lastScheduleKey) {
            if (lastScheduleKey !== '') {
                showToast("Jadwal Berubah: " + current.sub);
            }
            lastScheduleKey = key;

            scheduleText.textContent = current.sub;
            currentBox.style.setProperty('--schedule-accent', 'var(--color-primary)');

            nextScheduleText.textContent = next.sub + ` (${next.start})`;
            nextBox.style.setProperty('--schedule-accent', 'var(--color-primary)');
        }
    }

    setInterval(tick, 1000);

    const toastContainer = document.getElementById('toast-container');
    function showToast(message, isError = false, duration = 5000) {
        if(!toastContainer) return;
        const t = document.createElement('div');
        t.className = `toast ${isError ? 'error' : ''}`;
        t.textContent = message;
        toastContainer.appendChild(t);
        if (duration > 0) {
            setTimeout(() => {
                t.style.opacity = '0';
                setTimeout(() => t.remove(), 400);
            }, duration);
        }
        return t; 
    }

    let ytPlayer = null;
    window.onYouTubeIframeAPIReady = function() {
        ytPlayer = new YT.Player('youtube-player', {
            height: '100%', width: '100%',
            playerVars: { 'autoplay': 1, 'controls': 0, 'modestbranding': 1, 'rel': 0 },
            events: { 'onStateChange': onPlayerStateChange }
        });
    };

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    async function playNextInQueue() {
        const snap = await get(ref(database, 'queue'));
        const data = snap.val();
        if (data) {
            const keys = Object.keys(data);
            const nextKey = keys[0];
            const nextMedia = data[nextKey];
            await set(ref(database, 'state/currentlyPlaying'), nextMedia);
            await remove(ref(database, `queue/${nextKey}`));
        } else {
            await set(ref(database, 'state/currentlyPlaying'), null);
        }
    }

    function onPlayerStateChange(event) {
        if (event.data === 0) playNextInQueue();
    }

    const mediaContainer = document.getElementById('media-player-container');
    const fallback = document.getElementById('media-fallback');
    const vdoPlayer = document.getElementById('vdo-player');
    const timeBox = document.getElementById('time-box');

    onValue(ref(database, 'state/currentlyPlaying'), (snapshot) => {
        const media = snapshot.val();
        
        fallback.classList.add('hidden');
        const ytElem = document.getElementById('youtube-player');
        if (ytElem && ytElem.tagName === 'IFRAME') {
            ytElem.classList.add('hidden');
        }
        vdoPlayer.classList.add('hidden');
        vdoPlayer.src = '';

        if (!media) {
            fallback.classList.remove('hidden');
            if (ytPlayer && typeof ytPlayer.stopVideo === 'function') ytPlayer.stopVideo();
        } else if (media.type === 'youtube') {
            if (ytElem) ytElem.classList.remove('hidden');
            if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
                ytPlayer.loadVideoById(media.id);
            } else {
                setTimeout(() => {
                    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') ytPlayer.loadVideoById(media.id);
                }, 1000);
            }
        } else if (media.type === 'vdo') {
            if (ytPlayer && typeof ytPlayer.stopVideo === 'function') ytPlayer.stopVideo();
            vdoPlayer.src = media.url;
            vdoPlayer.classList.remove('hidden');
        }
    });

    onValue(ref(database, 'state/isFullscreen'), (snapshot) => {
        const isFs = snapshot.val() === true;
        if (isFs) {
            mediaContainer.classList.add('fullscreen');
            timeBox.classList.add('overlay-mode');
        } else {
            mediaContainer.classList.remove('fullscreen');
            timeBox.classList.remove('overlay-mode');
        }
    });

    onValue(ref(database, 'state/isBlackout'), (snapshot) => {
        const bOverlay = document.getElementById('blackout-overlay');
        if(bOverlay) bOverlay.style.display = snapshot.val() === true ? 'block' : 'none';
    });

    let lastBroadcastTs = 0;
    onValue(ref(database, 'state/broadcast'), (snapshot) => {
        const data = snapshot.val();
        if (data && data.timestamp > lastBroadcastTs) {
            showToast(data.message);
            lastBroadcastTs = data.timestamp;
        }
    });

    onValue(ref(database, 'scheduleData'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            scheduleData = data;
            tick();
        } else {
            seedDefaultSchedule();
        }
    });

    let connToast = null;
    onValue(ref(database, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) {
            if (!connToast) connToast = showToast("Koneksi Terputus / Tidak Stabil", true, 0);
        } else {
            if (connToast) {
                connToast.remove();
                connToast = null;
                showToast("Koneksi Kembali Stabil");
            }
        }
    });

    function seedDefaultSchedule() {
        const def = {
            "Senin": [
                { start: "00:00", sub: "Di Luar Jam Sekolah" },
                { start: "07:00", sub: "Upacara Bendera" },
                { start: "07:45", sub: "FISIKA" },
                { start: "15:00", sub: "Pulang" }
            ],
            "Selasa": [
                { start: "00:00", sub: "Di Luar Jam Sekolah" },
                { start: "07:00", sub: "SEJARAH" },
                { start: "15:00", sub: "Pulang" }
            ],
            "Rabu": [ { start: "00:00", sub: "Libur" } ],
            "Kamis": [ { start: "00:00", sub: "Libur" } ],
            "Jumat": [ { start: "00:00", sub: "Libur" } ],
            "Sabtu": [ { start: "00:00", sub: "Libur" } ],
            "Minggu": [ { start: "00:00", sub: "Libur" } ]
        };
        set(ref(database, 'scheduleData'), def);
    }
}
