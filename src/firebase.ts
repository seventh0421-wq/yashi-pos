// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDBd9pvtwnFeOgxGFT7-ShhjzMr4sqV38k",
  authDomain: "yashi-manor-pos.firebaseapp.com",
  projectId: "yashi-manor-pos",
  storageBucket: "yashi-manor-pos.firebasestorage.app",
  messagingSenderId: "234796776410",
  appId: "1:234796776410:web:7f1d8c67d8d837ffb19ee3"
};

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export default app;
