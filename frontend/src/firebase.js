// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For security, we use environment variables.
// You must define these in your .env file located at the root of the frontend folder.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://mock-db.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

import { getAuth } from "firebase/auth";

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
