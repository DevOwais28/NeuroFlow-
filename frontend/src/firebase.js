import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMFhzT2vjRk6_smY2BPQ1ABjXsn8FPCbU",
  authDomain: "todo-app-bfea6.firebaseapp.com",
  projectId: "todo-app-bfea6",
  storageBucket: "todo-app-bfea6.firebasestorage.app",
  messagingSenderId: "1000811905623",
  appId: "1:1000811905623:web:63824eb9aa7aea37b59912",
  measurementId: "G-4FEQXFJGS5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
