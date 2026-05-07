// ===========================
//  JADWAL HARIAN 
// ===========================
const scheduleData = {
    "Senin": [
        { start: "00:00", sub: "Di Luar Jam Sekolah" },
        { start: "07:00", sub: "Upacara Bendera" },
        { start: "07:45", sub: "FISIKA" },
        { start: "09:15", sub: "BAHASA JAWA" },
        { start: "10:00", sub: "ISTIRAHAT" },
        { start: "10:15", sub: "BAHASA JAWA" },
        { start: "11:00", sub: "B. INGGRIS TINGKAT LANJUT" },
        { start: "11:45", sub: "ISTIRAHAT / ISHOMA" },
        { start: "12:15", sub: "B. INGGRIS TINGKAT LANJUT" },
        { start: "13:45", sub: "MATEMATIKA" },
        { start: "15:00", sub: "Pulang" }
    ],
    "Selasa": [
        { start: "00:00", sub: "Di Luar Jam Sekolah" },
        { start: "07:00", sub: "SEJARAH" },
        { start: "08:30", sub: "INFORMATIKA" },
        { start: "10:00", sub: "ISTIRAHAT" },
        { start: "10:15", sub: "INFORMATIKA" },
        { start: "11:00", sub: "MATEMATIKA TINGKAT LANJUT" },
        { start: "11:45", sub: "ISTIRAHAT / ISHOMA" },
        { start: "12:15", sub: "MATEMATIKA TINGKAT LANJUT" },
        { start: "13:45", sub: "B. INGGRIS TINGKAT LANJUT" },
        { start: "15:00", sub: "Pulang" }
    ],
    "Rabu": [
        { start: "00:00", sub: "Di Luar Jam Sekolah" },
        { start: "07:00", sub: "PENJASKES" },
        { start: "09:15", sub: "SENI BUDAYA" },
        { start: "10:00", sub: "ISTIRAHAT" },
        { start: "10:15", sub: "SENI BUDAYA" },
        { start: "11:00", sub: "BAHASA INDONESIA" },
        { start: "11:45", sub: "ISTIRAHAT / ISHOMA" },
        { start: "12:15", sub: "BAHASA INDONESIA" },
        { start: "13:00", sub: "FISIKA" },
        { start: "15:00", sub: "Pulang" }
    ],
    "Kamis": [
        { start: "00:00", sub: "Di Luar Jam Sekolah" },
        { start: "07:00", sub: "BHS INGGRIS" },
        { start: "09:15", sub: "Pend. Agama Islam BP" },
        { start: "10:00", sub: "ISTIRAHAT" },
        { start: "10:15", sub: "Pend. Agama Islam BP" },
        { start: "11:45", sub: "ISTIRAHAT / ISHOMA" },
        { start: "12:15", sub: "PPKn" },
        { start: "13:45", sub: "MATEMATIKA" },
        { start: "15:15", sub: "Pulang" }
    ],
    "Jumat": [
        { start: "00:00", sub: "Di Luar Jam Sekolah" },
        { start: "07:00", sub: "BAHASA INDONESIA" },
        { start: "08:30", sub: "INFORMATIKA" },
        { start: "10:00", sub: "ISTIRAHAT" },
        { start: "10:15", sub: "BK" },
        { start: "11:00", sub: "MATEMATIKA TINGKAT LANJUT" },
        { start: "11:45", sub: "ISTIRAHAT / ISHOMA" },
        { start: "12:15", sub: "MATEMATIKA TINGKAT LANJUT" },
        { start: "13:00", sub: "PRAKARYA" },
        { start: "14:30", sub: "Pulang" }
    ],
    "Sabtu": [
        { start: "00:00", sub: "Libur / Akhir Pekan" }
    ],
    "Minggu": [
        { start: "00:00", sub: "Libur / Akhir Pekan" }
    ]
};
// ===========================

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function getCurrentSchedule(dayName, h, m) {
    const now = h * 60 + m;
    const schedule = scheduleData[dayName] || scheduleData["Senin"];
    for (let i = 0; i < schedule.length; i++) {
        const current = schedule[i];
        const next = schedule[i + 1];

        if (next) {
            if (now >= timeToMinutes(current.start) && now < timeToMinutes(next.start)) {
                return { current, next };
            }
        } else {
            // Last schedule of the current day
            if (now >= timeToMinutes(current.start)) {
                let tomorrowIdx = (DAYS_ID.indexOf(dayName) + 1) % 7;
                let tomorrowName = DAYS_ID[tomorrowIdx];
                let tomorrowSchedule = scheduleData[tomorrowName] || scheduleData["Senin"];
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

// Current Schedule Elements
const currentBox = document.getElementById('current-schedule-box');
const schedulePeriod = document.getElementById('schedule-period');
const scheduleText = document.getElementById('schedule-text');
const scheduleSub = document.getElementById('schedule-sub');

// Next Schedule Elements
const nextBox = document.getElementById('next-schedule-box');
const nextSchedulePeriod = document.getElementById('next-schedule-period');
const nextScheduleText = document.getElementById('next-schedule-text');
const nextScheduleSub = document.getElementById('next-schedule-sub');

document.getElementById('current-year').textContent = new Date().getFullYear();

let lastScheduleKey = '';

function tick() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const dayName = DAYS_ID[now.getDay()];

    // Clock
    clockEl.innerHTML =
        `${pad(h)}<span class="separator">:</span>${pad(m)}<span class="separator">:</span>${pad(s)}`;

    // Seconds bar
    const pct = (s / 60) * 100;
    secBar.style.width = pct + '%';
    secLabel.textContent = pad(s);

    // Date
    dayNameEl.textContent = dayName;
    dateFullEl.textContent = `${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;

    // Schedule
    const { current, next } = getCurrentSchedule(dayName, h, m);
    const key = dayName + '-' + current.sub;

    if (key !== lastScheduleKey) {
        lastScheduleKey = key;

        // Update Current Schedule
        scheduleText.textContent = current.sub;
        currentBox.style.setProperty('--schedule-accent', 'var(--color-primary)');

        // Update Next Schedule
        nextScheduleText.textContent = next.sub + ` (${next.start})`;
        nextBox.style.setProperty('--schedule-accent', 'var(--color-primary)');
    }
}

// Initial call
tick();
setInterval(tick, 1000);

// Theme toggle
(function () {
    const btn = document.querySelector('[data-theme-toggle]');
    const root = document.documentElement;
    let dark = root.getAttribute('data-theme') === 'dark';

    function updateIcon() {
        btn.innerHTML = dark
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
        btn.setAttribute('aria-label', dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
    }

    updateIcon();

    btn.addEventListener('click', () => {
        dark = !dark;
        root.setAttribute('data-theme', dark ? 'dark' : 'light');
        updateIcon();
    });
})();