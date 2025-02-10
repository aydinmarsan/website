// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyDFXNxwFTOBFPd9mlfUSKw8QLSDYov4M3k",
    authDomain: "marsanstudio-221ef.firebaseapp.com",
    projectId: "marsanstudio-221ef",
    storageBucket: "marsanstudio-221ef.firebasestorage.app",
    messagingSenderId: "502939095270",
    appId: "1:502939095270:web:db6756c4d2dd0e10fbab27",
    measurementId: "G-6T7YMYVG6G"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firestore ve Storage'u başlat
const db = firebase.firestore();
const storage = firebase.storage(); 