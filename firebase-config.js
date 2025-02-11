// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyB-T7aB6-twopuefLz0sLg0Ti2HYy2hpiI",
    authDomain: "marsanstudio-7dc9b.firebaseapp.com",
    projectId: "marsanstudio-7dc9b",
    storageBucket: "marsanstudio-7dc9b.firebasestorage.app",
    messagingSenderId: "298325681308",
    appId: "1:298325681308:web:185dcba36010d59aae7959"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firestore ve Storage referansları
const db = firebase.firestore();
const storage = firebase.storage();

// Firestore ayarları
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    merge: true
});

// Storage için CORS ayarları
storage.setCustomAuthHeader({
    'Access-Control-Allow-Origin': '*'
});

// Offline kalıcılığı etkinleştir
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Persistence failed');
        } else if (err.code == 'unimplemented') {
            console.log('Persistence is not available');
        }
    }); 