// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyB-T7aB6-twopuefLz0sLg0Ti2HYy2hpiI",
    authDomain: "marsanstudio-7dc9b.firebaseapp.com",
    projectId: "marsanstudio-7dc9b",
    storageBucket: "marsanstudio-7dc9b.appspot.com",
    messagingSenderId: "298325681308",
    appId: "1:298325681308:web:185dcba36010d59aae7959"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Storage ve Firestore referansları
const storage = firebase.storage();
const db = firebase.firestore();

// Firebase servislerini başlat
const auth = firebase.auth();

// Firestore ayarları
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Offline kalıcılığı etkinleştir
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            // Birden fazla sekme açık
            console.log('Persistence failed');
        } else if (err.code == 'unimplemented') {
            // Tarayıcı desteklemiyor
            console.log('Persistence is not available');
        }
    }); 