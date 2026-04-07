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
  Timestamp,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

/* DOM Elements */
const select = document.getElementById("drugSelect");
const qtyInput = document.getElementById("qty");
const salesBody = document.getElementById("salesBody");

const totalSalesEl = document.getElementById("totalSales");
const dailyEl = document.getElementById("dailyTotal");
const monthlyEl = document.getElementById("monthlyTotal");
const yearlyEl = document.getElementById("yearlyTotal");

const drugSearchInput = document.getElementById("drugSearch");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const filterSalesBtn = document.getElementById("filterSalesBtn");
const clearSalesFilterBtn = document.getElementById("clearSalesFilterBtn");

const MIN_STOCK = 5;

/* Caches for filtering */
let allDrugs = [];
let allSales = [];

/* Format KSh */
function formatKsh(amount) {
  return "KSh " + (amount ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

/* Load drugs */
async function loadDrugs() {
  try {
    const snapshot = await getDocs(collection(db, "drugs"));
    allDrugs = [];
    snapshot.forEach(docSnap => {
      const drug = docSnap.data();
      allDrugs.push({ id: docSnap.id, ...drug });
    });
    renderDrugOptions(allDrugs);
  } catch (error) {
    console.error("Error loading drugs:", error);
    select.innerHTML = "<option>Error loading drugs</option>";
  }
}

/* Render drug options */
function renderDrugOptions(drugs) {
  select.innerHTML = "";
  if (drugs.length === 0) {
    select.innerHTML = "<option>No drugs available</option>";
    return;
  }
  drugs.forEach(drug => {
    const option = document.createElement("option");
    option.value = drug.id;
    option.textContent = `${drug.name} (${drug.category}) - ${drug.quantity ?? 0} left`;
    if ((drug.quantity ?? 0) <= MIN_STOCK) option.style.color = "red";
    select.appendChild(option);
  });
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
  const expiryDate = drug.expiry ? new Date(drug.expiry) : null;
  if (expiryDate && expiryDate < new Date()) {
    alert("Cannot sell expired drugs!");
    return;
  }
  if ((drug.quantity ?? 0) < qty) {
    alert("Not enough stock!");
    return;
  }

  const totalPrice = qty * (drug.price ?? 0);

  await addDoc(collection(db, "sales"), {
    drugId: id,
    drugName: drug.name || "Unnamed Drug",
    category: drug.category || "No Category",
    quantity: qty,
    price: drug.price ?? 0,
    totalPrice,
    timestamp: new Date(),
  });

  await updateDoc(drugRef, {
    quantity: (drug.quantity ?? 0) - qty,
  });

  alert(`Sold ${qty} x ${drug.name} for ${formatKsh(totalPrice)}`);
  qtyInput.value = "";
  await loadDrugs();
  await loadSales();
  await updateSalesTotals();
}

/* Load sales */
async function loadSales() {
  try {
    const snapshot = await getDocs(collection(db, "sales"));
    allSales = [];
    snapshot.forEach(docSnap => {
      const sale = docSnap.data();
      if (!sale.deleted) allSales.push({ id: docSnap.id, ...sale });
    });
    renderSales(allSales);
  } catch (error) {
    console.error("Error loading sales:", error);
  }
}

/* Render sales grouped by day */
function renderSales(salesArray) {
  salesBody.innerHTML = "";
  const grouped = {};

  salesArray.forEach(sale => {
    const dateObj = sale.timestamp ? sale.timestamp.toDate() : new Date();
    const dateKey = dateObj.toLocaleDateString();
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push({ ...sale, dateObj });
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach(date => {
    const headerRow = document.createElement("tr");
    headerRow.style.background = "#ddd";
    const headerCell = document.createElement("td");
    headerCell.colSpan = 6;
    headerCell.textContent = "📅 " + date;
    headerCell.style.fontWeight = "bold";
    headerRow.appendChild(headerCell);
    salesBody.appendChild(headerRow);

    grouped[date].sort((a, b) => b.dateObj - a.dateObj);

    grouped[date].forEach(sale => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sale.drugName || "N/A"}</td>
        <td>${sale.category || "N/A"}</td>
        <td>${sale.quantity ?? 0}</td>
        <td>${formatKsh(sale.totalPrice ?? 0)}</td>
        <td>${date}</td>
        <td>
          <button onclick="editSale('${sale.id}')">Edit</button>
          <button onclick="deleteSale('${sale.id}')">Delete</button>
        </td>
      `;
      salesBody.appendChild(row);
    });
  });
}

/* Edit sale */
async function editSale(id) {
  try {
    const saleRef = doc(db, "sales", id);
    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) return;
    const sale = saleSnap.data();
    const newQty = Number(prompt("New quantity:", sale.quantity));
    if (!newQty || newQty <= 0) return;

    const drugRef = doc(db, "drugs", sale.drugId);
    const drugSnap = await getDoc(drugRef);
    if (!drugSnap.exists()) return;

    let stock = (drugSnap.data().quantity ?? 0) + (sale.quantity ?? 0);
    if (stock < newQty) { alert("Not enough stock!"); return; }
    stock -= newQty;
    const newTotal = newQty * (sale.price ?? 0);

    await updateDoc(saleRef, { quantity: newQty, totalPrice: newTotal });
    await updateDoc(drugRef, { quantity: stock });

    alert("Sale updated!");
    await loadSales();
    await loadDrugs();
    await updateSalesTotals();
  } catch (error) { console.error(error); }
}

/* Delete sale */
async function deleteSale(id) {
  try {
    if (!confirm("Delete sale?")) return;
    const saleRef = doc(db, "sales", id);
    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) return;

    const sale = saleSnap.data();
    const drugRef = doc(db, "drugs", sale.drugId);
    const drugSnap = await getDoc(drugRef);
    if (drugSnap.exists()) {
      await updateDoc(drugRef, { quantity: (drugSnap.data().quantity ?? 0) + (sale.quantity ?? 0) });
    }

    await updateDoc(saleRef, { deleted: true });
    alert("Sale deleted!");
    await loadSales();
    await loadDrugs();
    await updateSalesTotals();
  } catch (error) { console.error(error); }
}

/* Sales totals */
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
  const startDay = new Date(); startDay.setHours(0,0,0,0);
  const endDay = new Date(); endDay.setHours(23,59,59,999);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59);
  const startYear = new Date(now.getFullYear(),0,1);
  const endYear = new Date(now.getFullYear(),11,31,23,59,59);

  const [daily, monthly, yearly] = await Promise.all([
    getSalesTotal(startDay,endDay),
    getSalesTotal(startMonth,endMonth),
    getSalesTotal(startYear,endYear)
  ]);

  const allSnap = await getDocs(collection(db,"sales"));
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

/* Initialize */
loadDrugs();
loadSales();
updateSalesTotals();

/* Make functions global */
window.sellDrug = sellDrug;
window.editSale = editSale;
window.deleteSale = deleteSale;

/* Event listeners for search/filter */
drugSearchInput.addEventListener("input", () => {
  const query = drugSearchInput.value.trim().toLowerCase();
  if (!query) return renderDrugOptions(allDrugs);
  renderDrugOptions(allDrugs.filter(d => 
    (d.name?.toLowerCase().includes(query)) ||
    (d.category?.toLowerCase().includes(query))
  ));
});

filterSalesBtn.addEventListener("click", () => {
  const startVal = startDateInput.value;
  const endVal = endDateInput.value;
  if (!startVal || !endVal) { alert("Select both start and end dates."); return; }
  const start = new Date(startVal);
  const end = new Date(endVal); end.setHours(23,59,59,999);
  const filtered = allSales.filter(s => {
    const saleDate = s.timestamp?.toDate();
    return saleDate && saleDate >= start && saleDate <= end;
  });
  renderSales(filtered);
});

clearSalesFilterBtn.addEventListener("click", () => {
  startDateInput.value = "";
  endDateInput.value = "";
  renderSales(allSales);
});
