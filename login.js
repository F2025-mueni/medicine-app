// login.js
// Make sure to include this in your HTML with: <script type="module" src="./login.js"></script>

import { auth, db } from './firebase.js'; // must be in the same folder
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

async function login(email, password) {
  try {
    // Sign in the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Get user data from Firestore
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

    // Redirect based on role (use relative paths for GitHub Pages)
    if (role?.trim().toLowerCase() === "admin") {
      window.location.href = "./admin.html"; // relative path
    } else {
      window.location.href = "./user.html";  // relative path
    }

  } catch (error) {
    alert("Login failed: " + error.message);
    console.error(error);
  }
}

// Attach form submit handler
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
} else {
  console.error("Login form not found on this page!");
}
