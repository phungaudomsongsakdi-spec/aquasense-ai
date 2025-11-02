import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAGjFW5xs9JOSiozNMkRYH5ShoxiTn7jVY",
  authDomain: "aquasenseai-95cb6b.firebaseapp.com",
  databaseURL: "https://aquasenseai-95cb6-default-rtdb.firebaseio.com", // 👈 เอา / ออกท้ายสุด!
  projectId: "aquasenseai-95cb6b",
  storageBucket: "aquasenseai-95cb6b.appspot.com",
  messagingSenderId: "466078756131",
  appId: "1:466078756131:web:25b034e61c5e04b8cbb096",
  measurementId: "G-9L43K6FPSR",
};

// ✅ เริ่มต้น Firebase App
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

console.log("✅ Firebase initialized:", firebaseConfig.databaseURL);
