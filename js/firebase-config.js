// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyAcyeBN0OqpKk7rpBZubGFhjIWYmaplyPY",
  authDomain: "dayo-6c91b.firebaseapp.com",
  projectId: "dayo-6c91b",
  storageBucket: "dayo-6c91b.firebasestorage.app",
  messagingSenderId: "190194254184",
  appId: "1:190194254184:web:2e2d2a493a8e00766056dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };