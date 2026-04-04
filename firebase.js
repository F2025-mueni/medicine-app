// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB86COKO7X1aK-FzJhDDAq0Tv3Gg-5oLbc",
  authDomain: "pharmacysystem-dbce1.firebaseapp.com",
  projectId: "pharmacysystem-dbce1",
  storageBucket: "pharmacysystem-dbce1.firebasestorage.app",
  messagingSenderId: "245619622315",
  appId: "1:245619622315:web:35566ae924467fc51412ee",
  measurementId: "G-QKE4NFMG60"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };