import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Check auth state and role
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  try {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (!docSnap.exists() || docSnap.data().role !== "Admin") {
      await signOut(auth);
      window.location.href = "/index.html";
      return;
    }
  } catch (err) {
    console.error(err);
    await signOut(auth);
    window.location.href = "/index.html";
  }
});

// DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const sidebar = document.getElementById("sidebar");

  // Toggle sidebar + animate hamburger
  hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    hamburger.classList.toggle("active");
  });

  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = "/index.html";
  });
});