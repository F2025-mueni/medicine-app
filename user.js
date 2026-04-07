// user.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

/* DOM Elements */
const select = document.getElementById("drugSelect");
const qtyInput = document.getElementById("qty");
const salesBody = document.getElementById("salesBody");

const totalSalesEl = document.getElementById("totalSales");
const dailyEl = document.getElementById("dailyTotal");
const monthlyEl = document.getElementById("monthlyTotal");
const yearlyEl = document.getElementById("yearlyTotal");

const MIN_STOCK = 5;

/* Format KSh */
function formatKsh(amount) {
  return "KSh " + amount.toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

/* Load drugs */
async function loadDrugs() {
  try {
    const snapshot = await getDocs(collection(db, "drugs"));
    select.innerHTML = "";

    if (snapshot.empty) {
      select.innerHTML = "<option>No drugs available</option>";
      return;
    }

    snapshot.forEach(docSnap => {
      const drug = docSnap.data();

      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = `${drug.name} (${drug.category}) - ${drug.quantity} left`;

      if ((drug.quantity ?? 0) <= MIN_STOCK) option.style.color = "red";

      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading drugs:", error);
  }
}

/* Sell drug */
async function sellDrug() {
  const id = select.value;
  const qty = Number(qtyInput.value);

  if (!id || qty <= 0) {
    alert("Select drug and enter valid quantity");
    return;
  }

  const drugRef = doc(db, "drugs", id);
  const drugSnap = await getDoc(drugRef);

  if (!drugSnap.exists()) {
    alert("Drug not found!");
    return;
  }

  const drug = drugSnap.data();

  if ((drug.quantity ?? 0) < qty) {
    alert("Not enough stock!");
    return;
  }

  const totalPrice = qty * (drug.price ?? 0);

  await addDoc(collection(db, "sales"), {
    drugId: id,
    drugName: drug.name,
    category: drug.category,
    quantity: qty,
    price: drug.price ?? 0,
    totalPrice,
    timestamp: new Date(), // ✅ FIXED
  });

  await updateDoc(drugRef, {
    quantity: drug.quantity - qty,
  });

  alert(`Sold ${qty} x ${drug.name} for ${formatKsh(totalPrice)}`);

  qtyInput.value = "";
  await loadDrugs();
  await loadSales();
  await updateSalesTotals();
}

/* ✅ GROUPED SALES (MAIN FIX) */
async function loadSales() {
  try {
    const snapshot = await getDocs(collection(db, "sales"));
    salesBody.innerHTML = "";

    const grouped = {};

    snapshot.forEach(docSnap => {
      const sale = docSnap.data();
      if (sale.deleted) return;

      const id = docSnap.id;

      // ✅ Safe timestamp handling
      const dateObj = sale.timestamp?.toDate?.() || new Date();
      const dateKey = dateObj.toLocaleDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push({ ...sale, id, dateObj });
    });

    // ✅ Sort days (latest first)
    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    sortedDates.forEach(date => {
      // Day header
      salesBody.innerHTML += `
        <tr style="background:#ddd; font-weight:bold;">
          <td colspan="6">📅 ${date}</td>
        </tr>
      `;

      // Sort sales inside day
      grouped[date].sort((a, b) => b.dateObj - a.dateObj);

      grouped[date].forEach(sale => {
        salesBody.innerHTML += `
          <tr>
            <td>${sale.drugName}</td>
            <td>${sale.category}</td>
            <td>${sale.quantity}</td>
            <td>${formatKsh(sale.totalPrice)}</td>
            <td>${date}</td>
            <td>
              <button onclick="editSale('${sale.id}')">Edit</button>
              <button onclick="deleteSale('${sale.id}')">Delete</button>
            </td>
          </tr>
        `;
      });
    });

  } catch (error) {
    console.error("Error loading sales:", error);
  }
}

/* Edit sale */
async function editSale(id) {
  const saleRef = doc(db, "sales", id);
  const saleSnap = await getDoc(saleRef);
  if (!saleSnap.exists()) return;

  const sale = saleSnap.data();
  const newQty = Number(prompt("New quantity:", sale.quantity));
  if (!newQty || newQty <= 0) return;

  const drugRef = doc(db, "drugs", sale.drugId);
  const drugSnap = await getDoc(drugRef);
  if (!drugSnap.exists()) return;

  const drug = drugSnap.data();
  let stock = drug.quantity + sale.quantity;

  if (stock < newQty) {
    alert("Not enough stock!");
    return;
  }

  stock -= newQty;
  const newTotal = newQty * sale.price;

  await updateDoc(saleRef, { quantity: newQty, totalPrice: newTotal });
  await updateDoc(drugRef, { quantity: stock });

  alert("Sale updated!");
  await loadSales();
  await loadDrugs();
  await updateSalesTotals();
}

/* Delete sale */
async function deleteSale(id) {
  if (!confirm("Delete sale?")) return;

  const saleRef = doc(db, "sales", id);
  const saleSnap = await getDoc(saleRef);
  if (!saleSnap.exists()) return;

  const sale = saleSnap.data();

  const drugRef = doc(db, "drugs", sale.drugId);
  const drugSnap = await getDoc(drugRef);

  if (drugSnap.exists()) {
    const drug = drugSnap.data();
    await updateDoc(drugRef, {
      quantity: drug.quantity + sale.quantity
    });
  }

  await updateDoc(saleRef, { deleted: true });

  alert("Sale deleted!");
  await loadSales();
  await loadDrugs();
  await updateSalesTotals();
}

/* Totals */
async function getSalesTotal(start, end) {
  const q = query(
    collection(db, "sales"),
    where("timestamp", ">=", Timestamp.fromDate(start)),
    where("timestamp", "<=", Timestamp.fromDate(end))
  );

  const snapshot = await getDocs(q);
  let total = 0;

  snapshot.forEach(docSnap => {
    const sale = docSnap.data();
    if (!sale.deleted) total += sale.totalPrice ?? 0;
  });

  return total;
}

async function updateSalesTotals() {
  const now = new Date();

  const startDay = new Date();
  startDay.setHours(0,0,0,0);

  const endDay = new Date();
  endDay.setHours(23,59,59,999);

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59);

  const startYear = new Date(now.getFullYear(), 0, 1);
  const endYear = new Date(now.getFullYear(), 11, 31, 23,59,59);

  const [daily, monthly, yearly] = await Promise.all([
    getSalesTotal(startDay, endDay),
    getSalesTotal(startMonth, endMonth),
    getSalesTotal(startYear, endYear)
  ]);

  const allSnap = await getDocs(collection(db, "sales"));
  let totalAll = 0;

  allSnap.forEach(doc => {
    const sale = doc.data();
    if (!sale.deleted) totalAll += sale.totalPrice ?? 0;
  });

  totalSalesEl.textContent = formatKsh(totalAll);
  dailyEl.textContent = formatKsh(daily);
  monthlyEl.textContent = formatKsh(monthly);
  yearlyEl.textContent = formatKsh(yearly);
}

/* Init */
loadDrugs();
loadSales();
updateSalesTotals();

/* Global */
window.sellDrug = sellDrug;
window.editSale = editSale;
window.deleteSale = deleteSale;
