import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCQtai_K244dbCXDhibtkxxzMk3lqqg3-8",
    authDomain: "cravion.firebaseapp.com",
    databaseURL: "https://cravion-default-rtdb.firebaseio.com",
    projectId: "cravion",
    storageBucket: "cravion.firebasestorage.app",
    messagingSenderId: "506140778353",
    appId: "1:506140778353:web:dc42c40502ba15ccb920d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };
