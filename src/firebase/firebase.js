import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDx6nm4vL1FiJPZniORtbkeY7Vz09FOQYM",
  authDomain: "mitkadmim-7576b.firebaseapp.com",
  projectId: "mitkadmim-7576b",
  storageBucket: "mitkadmim-7576b.firebasestorage.app",
  messagingSenderId: "663139177002",
  appId: "1:663139177002:web:7f0fac05d10310968ee953",
  measurementId: "G-M2QYLLWD4K",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});

export default app;
