import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDy2qE3yJRVK9FADCwS1sajpPaf6zeK_Jw",
  authDomain: "trail-track-598e0.firebaseapp.com",
  projectId: "trail-track-598e0",
  storageBucket: "trail-track-598e0.appspot.com",
  messagingSenderId: "863566183797",
  appId: "1:863566183797:web:67e47cbe739a67ed47273c",
  measurementId: "G-WXDP4DPV62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
