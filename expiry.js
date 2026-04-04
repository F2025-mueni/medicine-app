import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const list = document.getElementById("expiryList");

function getExpiryStatus(expiryDateStr) {
  const today = new Date();
  const expiryDate = new Date(expiryDateStr);
  const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays <= 30) return "Expiring Soon"; // within 30 days
  return "Valid";
}

async function loadExpiry() {
  try {
    const drugsCol = collection(db, "drugs"); // your Firestore collection
    const snapshot = await getDocs(drugsCol);
    list.innerHTML = "";

    snapshot.forEach(doc => {
      const drug = doc.data();
      const status = getExpiryStatus(drug.expiry);

      if (status !== "Valid") {
        let statusClass = "";
        if (status === "Expired") statusClass = "status-expired";
        if (status === "Expiring Soon") statusClass = "status-soon";

        list.innerHTML += `
          <li>
            ${drug.name} (${drug.category}) - 
            <span class="status-badge ${statusClass}">${status}</span>
          </li>
        `;
      }
    });

    if (list.innerHTML === "") {
      list.innerHTML = "<li>All drugs are valid and not near expiry!</li>";
    }

  } catch (error) {
    console.error("Error loading expiry data:", error);
    list.innerHTML = "<li>Failed to load data. Try again later.</li>";
  }
}

// Load expiry list on page load
loadExpiry();