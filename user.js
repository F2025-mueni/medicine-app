async function loadSales() {
  try {
    const snapshot = await getDocs(collection(db, "sales"));
    salesBody.innerHTML = "";

    const grouped = {};

    // 🔹 Group by date
    snapshot.forEach(docSnap => {
      const sale = docSnap.data();
      if (sale.deleted) return;

      const id = docSnap.id;

      const dateObj = sale.timestamp?.toDate();
      if (!dateObj) return;

      const dateKey = dateObj.toLocaleDateString(); // e.g. 07/04/2026

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push({ ...sale, id, dateObj });
    });

    // 🔹 Sort dates (latest first)
    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    // 🔹 Render grouped data
    sortedDates.forEach(date => {
      // Add a header row for each day
      salesBody.innerHTML += `
        <tr style="background:#eee; font-weight:bold;">
          <td colspan="6">📅 ${date}</td>
        </tr>
      `;

      grouped[date].forEach(sale => {
        const row = `
          <tr>
            <td>${sale.drugName || "N/A"}</td>
            <td>${sale.category || "N/A"}</td>
            <td>${sale.quantity ?? 0}</td>
            <td>${formatKsh(sale.totalPrice ?? 0)}</td>
            <td>${date}</td>
            <td>
              <button onclick="editSale('${sale.id}')">Edit</button>
              <button onclick="deleteSale('${sale.id}')">Delete</button>
            </td>
          </tr>
        `;

        salesBody.innerHTML += row;
      });
    });

  } catch (error) {
    console.error("Error loading sales:", error);
  }
}
