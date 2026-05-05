export function getDeviceUUID() {
    let uuid = localStorage.getItem('deviceUUID');
    if (!uuid) {
        uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('deviceUUID', uuid);
    }
    return uuid;
}

export function extractYTId(url) {
    const r = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const m = url.match(r);
    return (m && m[2].length === 11) ? m[2] : null;
}

export function parseMediaUrl(url) {
    if (url.includes('vdo.ninja')) return { type: 'vdo', url: url };
    const id = extractYTId(url);
    if (id) return { type: 'youtube', id: id, url: url };
    return null;
}

export function setupThemeToggle() {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    
    const root = document.documentElement;
    let dark = root.getAttribute('data-theme') === 'dark';

    function update() {
        btn.innerHTML = dark
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    }

    update();
    btn.addEventListener('click', () => {
        dark = !dark;
        root.setAttribute('data-theme', dark ? 'dark' : 'light');
        update();
    });
}
