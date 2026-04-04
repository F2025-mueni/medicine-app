import { db } from './firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.querySelector("form").addEventListener("submit", async function(e){
  e.preventDefault();

  const name = document.querySelector("input[type='text']").value;
  const price = parseFloat(document.querySelectorAll("input")[1].value);
  const quantity = parseInt(document.querySelectorAll("input")[2].value, 10);
  const expiry = document.querySelector("input[type='date']").value;
  const category = document.getElementById("category").value;

  const drug = { 
    name, 
    price, 
    quantity, 
    expiry, 
    category, 
    createdAt: new Date() 
  };

  try {
    await addDoc(collection(db, "drugs"), drug);
    alert("Drug added to database!");
    this.reset();
  } catch (error) {
    console.error("Error adding drug:", error);
    alert("Failed to add drug. Try again.");
  }
});