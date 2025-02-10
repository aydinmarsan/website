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
const db = firebase.firestore();
const storage = firebase.storage();

// Bölüm gösterme/gizleme
function showSection(sectionName) {
    // Menü öğelerinin aktif durumunu güncelle
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Bölümleri göster/gizle
    if (sectionName === 'notes') {
        document.getElementById('notes-section').style.display = 'block';
        document.getElementById('files-section').style.display = 'none';
        loadNotes();
    } else {
        document.getElementById('notes-section').style.display = 'none';
        document.getElementById('files-section').style.display = 'block';
        loadFiles();
    }
}

// Modal işlemleri
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.querySelector(`#${modalId} form`).reset();
}

// Not ekleme
document.getElementById('noteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector('input').value;
    const content = form.querySelector('textarea').value;

    try {
        await db.collection('notes').add({
            title,
            content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        hideModal('noteModal');
        showNotification('Not başarıyla eklendi');
        loadNotes();
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
});

// Dosya yükleme
document.getElementById('fileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector('input[type="text"]').value;
    const file = form.querySelector('input[type="file"]').files[0];
    const description = form.querySelector('textarea').value;

    try {
        // Dosyayı Storage'a yükle
        const storageRef = storage.ref(`files/${Date.now()}_${file.name}`);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();

        // Dosya bilgilerini Firestore'a kaydet
        await db.collection('files').add({
            title,
            description,
            filename: file.name,
            url,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        hideModal('fileModal');
        showNotification('Dosya başarıyla yüklendi');
        loadFiles();
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
});

// Notları yükle
async function loadNotes() {
    const notesGrid = document.getElementById('notesGrid');
    notesGrid.innerHTML = '';

    try {
        const snapshot = await db.collection('notes')
            .orderBy('timestamp', 'desc')
            .get();

        snapshot.forEach(doc => {
            const note = doc.data();
            const noteElement = document.createElement('div');
            noteElement.className = 'card';
            noteElement.innerHTML = `
                <h3>${note.title}</h3>
                <div class="card-content">${note.content}</div>
                <div class="card-footer">
                    <small>${formatDate(note.timestamp)}</small>
                    <button onclick="deleteNote('${doc.id}')" 
                            style="background: none; border: none; color: #ff4444; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            notesGrid.appendChild(noteElement);
        });
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Dosyaları yükle
async function loadFiles() {
    const filesGrid = document.getElementById('filesGrid');
    filesGrid.innerHTML = '';

    try {
        const snapshot = await db.collection('files')
            .orderBy('timestamp', 'desc')
            .get();

        snapshot.forEach(doc => {
            const file = doc.data();
            const fileElement = document.createElement('div');
            fileElement.className = 'card';
            fileElement.innerHTML = `
                <h3>${file.title}</h3>
                <div class="card-content">
                    ${file.description || ''}
                    <div style="margin-top: 10px;">
                        <a href="${file.url}" target="_blank" style="color: var(--primary);">
                            <i class="fas fa-download"></i> ${file.filename}
                        </a>
                    </div>
                </div>
                <div class="card-footer">
                    <small>${formatDate(file.timestamp)}</small>
                    <button onclick="deleteFile('${doc.id}', '${file.url}')"
                            style="background: none; border: none; color: #ff4444; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            filesGrid.appendChild(fileElement);
        });
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Not silme
async function deleteNote(noteId) {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;

    try {
        await db.collection('notes').doc(noteId).delete();
        showNotification('Not başarıyla silindi');
        loadNotes();
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Dosya silme
async function deleteFile(fileId, fileUrl) {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;

    try {
        // Storage'dan dosyayı sil
        await storage.refFromURL(fileUrl).delete();
        // Firestore'dan dosya bilgilerini sil
        await db.collection('files').doc(fileId).delete();
        
        showNotification('Dosya başarıyla silindi');
        loadFiles();
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Bildirim gösterme
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Tarih formatı
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Çıkış işlemi
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        window.location.href = 'index.html';
    }
}

// Sayfa yüklendiğinde notları yükle
document.addEventListener('DOMContentLoaded', loadNotes); 