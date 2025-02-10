// Matrix arka plan efekti
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.querySelector('.matrix-bg').appendChild(canvas);

function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

setCanvasSize();
window.addEventListener('resize', setCanvasSize);

const chars = 'ラドクリフマラソンわたしワタシんょンョたばこタバコ0123456789';
const fontSize = 14;
const columns = Math.floor(canvas.width / fontSize);
const drops = new Array(columns).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0F0';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 33);

// Not ekleme işlemi
document.getElementById('noteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    try {
        await db.collection('notes').add({
            title,
            content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('noteForm').reset();
        showNotification('Not başarıyla eklendi');
        loadNotes();
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
});

// Dosya yükleme işlemi
document.getElementById('fileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('fileTitle').value;
    const file = document.getElementById('fileInput').files[0];

    try {
        const storageRef = storage.ref(`files/${Date.now()}_${file.name}`);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();

        await db.collection('files').add({
            title,
            url,
            filename: file.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('fileForm').reset();
        showNotification('Dosya başarıyla yüklendi');
        loadFiles();
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
});

// Notları yükleme
async function loadNotes() {
    const notesList = document.getElementById('notesList');
    const notesTitle = notesList.querySelector('h2');
    notesList.innerHTML = '<h2>Notes</h2>';

    try {
        const snapshot = await db.collection('notes')
            .orderBy('timestamp', 'desc')
            .get();

        snapshot.forEach(doc => {
            const note = doc.data();
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <small>${formatDate(note.timestamp)}</small>
                <button onclick="deleteNote('${doc.id}')" class="delete-btn">Delete</button>
            `;
            notesList.appendChild(noteElement);
        });
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Dosyaları yükleme
async function loadFiles() {
    const filesList = document.getElementById('filesList');
    const filesTitle = filesList.querySelector('h2');
    filesList.innerHTML = '<h2>Files</h2>';

    try {
        const snapshot = await db.collection('files')
            .orderBy('timestamp', 'desc')
            .get();

        snapshot.forEach(doc => {
            const file = doc.data();
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <h3>${file.title}</h3>
                <p><a href="${file.url}" target="_blank">${file.filename}</a></p>
                <small>${formatDate(file.timestamp)}</small>
                <button onclick="deleteFile('${doc.id}', '${file.url}')" class="delete-btn">Delete</button>
            `;
            filesList.appendChild(fileElement);
        });
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Not silme işlemi
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

// Dosya silme işlemi
async function deleteFile(fileId, fileUrl) {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;

    try {
        await storage.refFromURL(fileUrl).delete();
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
    notification.className = `notification ${type}`;
    notification.textContent = message;
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

// Sayfa yüklendiğinde verileri yükle
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    loadFiles();
}); 