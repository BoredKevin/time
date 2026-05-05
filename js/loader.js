const path = window.location.pathname;
const isRemote = path.endsWith('/remote') || path.endsWith('/remote.html') || path.endsWith('/remote/') || path.endsWith('/remote.html/');

const htmlPath = isRemote ? './components/remote-ui.html' : './components/tv-ui.html';
const logicPath = isRemote ? './remote-logic.js' : './tv-logic.js';

async function loadApp() {
    try {
        const res = await fetch(htmlPath);
        if (!res.ok) throw new Error(`bad fetch ${htmlPath}`);
        document.getElementById('app').innerHTML = await res.text();

        const mod = await import(logicPath);
        isRemote ? mod.initRemote() : mod.initTV();
    } catch (e) {
        console.error("loader failed:", e);
        document.getElementById('app').innerHTML = `<h2 style="color:red;text-align:center;margin-top:2rem;">err loading</h2><p style="text-align:center;">${e.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadApp);
