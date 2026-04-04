import { db } from './firebase.js';
import { collection, getDocs, doc, updateDoc, deleteDoc } 
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const table = document.getElementById("stockTable");
const searchInput = document.getElementById("searchInput");

// Helper to return stock status
function getStockStatus(quantity) {
  if ((quantity ?? 0) <= 5) return "Low";
  return "OK";
}

// Load stock table
async function loadStock() {
  try {
    const drugsCol = collection(db, "drugs");
    const snapshot = await getDocs(drugsCol);
    table.innerHTML = "";

    if (snapshot.empty) {
      table.innerHTML = `<tr><td colspan="6">No stock available</td></tr>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const drug = docSnap.data();
      const id = docSnap.id;

      const name = drug.name || "Unnamed Drug";
      const category = drug.category || "No Category";
      const qty = drug.quantity ?? 0;
      const expiry = drug.expiry || "N/A";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${name}</td>
        <td>${category}</td>
        <td>${qty}</td>
        <td>${expiry}</td>
        <td style="color:${qty <= 5 ? 'red':'green'}">${getStockStatus(qty)}</td>
        <td>
          <button onclick="editDrug('${id}')">Edit</button>
          <button onclick="deleteDrug('${id}')">Delete</button>
        </td>
      `;

      table.appendChild(row);
    });

  } catch (error) {
    console.error("Error loading stock:", error);
    table.innerHTML = `<tr><td colspan="6">Failed to load stock. Try again later.</td></tr>`;
  }
}

// Edit drug
window.editDrug = async function(id) {
  try {
    const newName = prompt("Enter new name:");
    if (!newName) return;

    const newCategory = prompt("Enter new category:");
    if (!newCategory) return;

    const newQty = Number(prompt("Enter new quantity:"));
    if (isNaN(newQty) || newQty < 0) return;

    const newExpiry = prompt("Enter new expiry (YYYY-MM-DD):");

    const drugRef = doc(db, "drugs", id);
    await updateDoc(drugRef, {
      name: newName,
      category: newCategory,
      quantity: newQty,
      expiry: newExpiry
    });

    alert("Drug updated!");
    loadStock();
  } catch (error) {
    console.error("Error editing drug:", error);
  }
}

// Delete drug
window.deleteDrug = async function(id) {
  if (!confirm("Are you sure you want to delete this drug?")) return;
  try {
    await deleteDoc(doc(db, "drugs", id));
    alert("Drug deleted!");
    loadStock();
  } catch (error) {
    console.error("Error deleting drug:", error);
  }
}

// Search filter
searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  const rows = table.querySelectorAll("tr");

  rows.forEach(row => {
    const name = row.cells[0].textContent.toLowerCase();
    const category = row.cells[1].textContent.toLowerCase();
    row.style.display = (name.includes(filter) || category.includes(filter)) ? "" : "none";
  });
});

// Initial load
loadStock();