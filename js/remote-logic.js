import { auth, database } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { getDeviceUUID, parseMediaUrl } from './utils.js';

export function initRemote() {
    const deviceId = getDeviceUUID();

    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const adminTools = document.getElementById('admin-tools');
    
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userStr = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value;
            const err = document.getElementById('login-error');
            
            const email = userStr.toLowerCase().replace(/\s+/g, '.') + '@time.local';

            try {
                err.style.display = 'none';
                await signInWithEmailAndPassword(auth, email, pass);
            } catch (error) {
                err.textContent = "Login gagal: " + error.message;
                err.style.display = 'block';
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => signOut(auth));
    }

    let isAdmin = false;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');

            const roleRef = ref(database, 'roles/' + user.uid);
            const snapshot = await get(roleRef);
            isAdmin = snapshot.val() === 'admin';
            
            if (isAdmin) {
                adminTools.classList.remove('hidden');
                loadScheduleEditor();
            } else {
                adminTools.classList.add('hidden');
            }

            initAppLogic();
        } else {
            loginContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    });

    function initAppLogic() {
        onValue(ref(database, 'state/currentlyPlaying'), (snapshot) => {
            const data = snapshot.val();
            const titleEl = document.getElementById('current-title');
            const typeEl = document.getElementById('current-type');
            if (data) {
                titleEl.textContent = data.type === 'youtube' ? `YouTube: ${data.id}` : `Live Stream: ${data.url}`;
                typeEl.textContent = data.addedBy ? `Added by ${data.addedBy}` : '';
            } else {
                titleEl.textContent = "Tidak ada media";
                typeEl.textContent = "";
            }
        });

        onValue(ref(database, 'queue'), (snapshot) => {
            const queueList = document.getElementById('queue-list');
            queueList.innerHTML = '';
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(key => {
                    const item = data[key];
                    const div = document.createElement('div');
                    div.className = 'queue-item';
                    div.innerHTML = `
                        <div>
                            <strong>${item.type === 'youtube' ? item.id : 'Stream'}</strong>
                            <div style="font-size: var(--text-xs); color: var(--color-text-faint);">by ${item.addedBy}</div>
                        </div>
                    `;
                    if (isAdmin) {
                        const delBtn = document.createElement('button');
                        delBtn.textContent = 'X';
                        delBtn.style.padding = '2px 8px';
                        delBtn.style.width = 'auto';
                        delBtn.classList.add('danger');
                        delBtn.onclick = () => remove(ref(database, `queue/${key}`));
                        div.appendChild(delBtn);
                    }
                    queueList.appendChild(div);
                });
            } else {
                queueList.innerHTML = '<p style="color: var(--color-text-muted);">Antrean kosong.</p>';
            }
        });

        onValue(ref(database, 'votes'), (snapshot) => {
            const data = snapshot.val() || {};
            const skipVotes = data.skip ? Object.keys(data.skip).length : 0;
            const fsVotes = data.fullscreen ? Object.keys(data.fullscreen).length : 0;
            
            document.getElementById('skip-count').textContent = skipVotes;
            document.getElementById('fs-count').textContent = fsVotes;

            if (skipVotes >= 3) {
                forceSkip();
                set(ref(database, 'votes/skip'), null);
            }
            if (fsVotes >= 3) {
                get(ref(database, 'state/isFullscreen')).then(snap => {
                    set(ref(database, 'state/isFullscreen'), !snap.val());
                });
                set(ref(database, 'votes/fullscreen'), null);
            }
        });
    }

    const addQueueForm = document.getElementById('add-queue-form');
    if(addQueueForm) {
        addQueueForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('yt-url').value;
            const media = parseMediaUrl(url);
            
            if (!media) {
                alert("URL tidak valid!");
                return;
            }

            if (media.type !== 'youtube' && !isAdmin) {
                alert("Hanya Admin yang dapat memasukkan link non-YouTube (VDO.ninja).");
                return;
            }

            media.addedBy = auth.currentUser.email.split('@')[0].replace(/\./g, ' ');

            const currSnap = await get(ref(database, 'state/currentlyPlaying'));
            if (!currSnap.val()) {
                await set(ref(database, 'state/currentlyPlaying'), media);
            } else {
                await push(ref(database, 'queue'), media);
            }
            document.getElementById('yt-url').value = '';
        });
    }

    document.getElementById('vote-skip-btn').addEventListener('click', () => {
        set(ref(database, `votes/skip/${deviceId}`), true);
    });

    document.getElementById('vote-fullscreen-btn').addEventListener('click', () => {
        set(ref(database, `votes/fullscreen/${deviceId}`), true);
    });

    async function forceSkip() {
        const queueSnap = await get(ref(database, 'queue'));
        const queueData = queueSnap.val();
        if (queueData) {
            const keys = Object.keys(queueData);
            const nextKey = keys[0];
            const nextMedia = queueData[nextKey];
            await set(ref(database, 'state/currentlyPlaying'), nextMedia);
            await remove(ref(database, `queue/${nextKey}`));
        } else {
            await set(ref(database, 'state/currentlyPlaying'), null);
        }
    }

    document.getElementById('admin-skip-btn').addEventListener('click', forceSkip);

    document.getElementById('admin-fs-btn').addEventListener('click', async () => {
        const snap = await get(ref(database, 'state/isFullscreen'));
        set(ref(database, 'state/isFullscreen'), !snap.val());
    });

    document.getElementById('admin-blackout-btn').addEventListener('click', async () => {
        const snap = await get(ref(database, 'state/isBlackout'));
        set(ref(database, 'state/isBlackout'), !snap.val());
    });

    document.getElementById('interrupt-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const url = document.getElementById('interrupt-url').value;
        const media = parseMediaUrl(url);
        if (media) {
            media.addedBy = "ADMIN Override";
            set(ref(database, 'state/currentlyPlaying'), media);
            document.getElementById('interrupt-url').value = '';
        }
    });

    document.getElementById('broadcast-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('broadcast-msg').value;
        const ts = Date.now();
        set(ref(database, 'state/broadcast'), { message: msg, timestamp: ts });
        document.getElementById('broadcast-msg').value = '';
    });

    async function loadScheduleEditor() {
        const snap = await get(ref(database, 'scheduleData'));
        const data = snap.val();
        if (data) {
            document.getElementById('schedule-json').value = JSON.stringify(data, null, 2);
        }
    }

    document.getElementById('save-schedule-btn').addEventListener('click', () => {
        try {
            const data = JSON.parse(document.getElementById('schedule-json').value);
            set(ref(database, 'scheduleData'), data);
            alert("Jadwal disimpan!");
        } catch(e) {
            alert("JSON tidak valid: " + e.message);
        }
    });
}
