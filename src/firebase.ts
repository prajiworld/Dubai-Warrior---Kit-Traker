import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_gZkHcwtP9fnNNI1RAPdvaic_dQAPWWs",
  authDomain: "team-kit-manager.firebaseapp.com",
  databaseURL: "https://team-kit-manager-default-rtdb.firebaseio.com",
  projectId: "team-kit-manager",
  storageBucket: "team-kit-manager.firebasestorage.app",
  messagingSenderId: "113654400729",
  appId: "1:113654400729:web:7b7f44ab5338b1158120c8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };
