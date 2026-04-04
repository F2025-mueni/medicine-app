import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("No user data found in Firestore!");
      console.error("No document for UID:", uid);
      return;
    }

    const role = docSnap.data().role;
    console.log("UID:", uid);
    console.log("Role:", role);

    if (role?.trim().toLowerCase() === "admin") {
      window.location.href = "/admin.html";
    } else {
      window.location.href = "/user.html";
    }
  } catch (error) {
    alert("Login failed: " + error.message);
    console.error(error);
  }
}

const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  login(email, password);
});