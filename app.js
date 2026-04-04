const MIN_STOCK = 10;

// Get drugs
function getDrugs() {
  return JSON.parse(localStorage.getItem("drugs")) || [];
}

// Save drugs
function saveDrugs(drugs) {
  localStorage.setItem("drugs", JSON.stringify(drugs));
}

// Add drug
function addDrug(drug) {
  const drugs = getDrugs();
  drugs.push(drug);
  saveDrugs(drugs);
}

// Expiry check
function getExpiryStatus(date) {
  const today = new Date();
  const exp = new Date(date);
  const diffDays = (exp - today) / (1000*60*60*24);
  if(diffDays<0) return "Expired";
  if(diffDays<=30) return "Expiring Soon";
  return "Valid";
}

// Stock check
function getStockStatus(qty) {
  return qty<MIN_STOCK?"Restock Needed":"In Stock";
}