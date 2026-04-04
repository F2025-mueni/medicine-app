// restock.js
import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const list = document.getElementById("restockList");
const MIN_STOCK = 10; // set your minimum stock threshold

async function loadRestock() {
  try {
    const drugsCol = collection(db, "drugs"); // assuming your collection name is "drugs"
    const snapshot = await getDocs(drugsCol);
    list.innerHTML = ""; // clear previous items

    snapshot.forEach(doc => {
      const drug = doc.data();

      let statusClass = "";
      let statusText = "";

      if (drug.quantity <= 3) {
        statusClass = "status-critical";
        statusText = "Critical";
      } else if (drug.quantity <= MIN_STOCK) {
        statusClass = "status-medium";
        statusText = "Medium";
      } else {
        statusClass = "status-low";
        statusText = "Low";
      }

      if (drug.quantity <= MIN_STOCK) {
        list.innerHTML += `
          <li>
            ${drug.name} (${drug.category}) - Qty: ${drug.quantity}
            <span class="status-badge ${statusClass}">${statusText}</span>
          </li>
        `;
      }
    });

    if (list.innerHTML === "") {
      list.innerHTML = "<li>All drugs are sufficiently stocked!</li>";
    }

  } catch (error) {
    console.error("Error loading drugs:", error);
    list.innerHTML = "<li>Failed to load drugs. Try again later.</li>";
  }
}

// Load restock list on page load
loadRestock();