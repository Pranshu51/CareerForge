
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interview-fbd6b.firebaseapp.com",
  projectId: "interview-fbd6b",
  storageBucket: "interview-fbd6b.firebasestorage.app",
  messagingSenderId: "430442698260",
  appId: "1:430442698260:web:23e401ba40c7ad2c597901"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}