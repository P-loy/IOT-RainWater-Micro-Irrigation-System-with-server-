// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCR7xVbCAKUL03u-dNa2E7-mVTkZhw1zWU",
  authDomain: "iot-rwatering-system.firebaseapp.com",
  databaseURL:
    "https://iot-rwatering-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-rwatering-system",
  storageBucket: "iot-rwatering-system.firebasestorage.app",
  messagingSenderId: "466114424234",
  appId: "1:466114424234:web:0a5b7458b1ceba334e8fd3",
  measurementId: "G-TZC45VWZDM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const rtdb = getDatabase(app);

export { rtdb };
