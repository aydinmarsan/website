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

// Bölüm gösterme/gizleme
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

// Modal işlemleri
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Not ekleme
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

        hideModal('addNoteModal');
        document.getElementById('noteForm').reset();
        loadNotes();
        showNotification('Not başarıyla eklendi');
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
});

// Dosya yükleme
document.getElementById('fileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('fileTitle').value;
    const file = document.getElementById('fileInput').files[0];
    const description = document.getElementById('fileDescription').value;

    try {
        const storageRef = storage.ref(`files/${Date.now()}_${file.name}`);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();

        await db.collection('files').add({
            title,
            description,
            url,
            filename: file.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        hideModal('addFileModal');
        document.getElementById('fileForm').reset();
        loadFiles();
        showNotification('Dosya başarıyla yüklendi');
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
});

// Notları yükleme
async function loadNotes() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';

    try {
        const snapshot = await db.collection('notes')
            .orderBy('timestamp', 'desc')
            .get();

        snapshot.forEach(doc => {
            const note = doc.data();
            const noteElement = document.createElement('div');
            noteElement.className = 'note-card';
            noteElement.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <div class="card-footer">
                    <small>${formatDate(note.timestamp)}</small>
                    <button onclick="deleteNote('${doc.id}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(noteElement);
        });
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Dosyaları yükleme
async function loadFiles() {
    const container = document.getElementById('filesContainer');
    container.innerHTML = '';

    try {
        const snapshot = await db.collection('files')
            .orderBy('timestamp', 'desc')
            .get();

        snapshot.forEach(doc => {
            const file = doc.data();
            const fileElement = document.createElement('div');
            fileElement.className = 'file-card';
            fileElement.innerHTML = `
                <h3>${file.title}</h3>
                <p>${file.description || ''}</p>
                <div class="card-footer">
                    <a href="${file.url}" target="_blank" class="download-btn">
                        <i class="fas fa-download"></i> İndir
                    </a>
                    <button onclick="deleteFile('${doc.id}', '${file.url}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <small>${formatDate(file.timestamp)}</small>
            `;
            container.appendChild(fileElement);
        });
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Silme işlemleri
async function deleteNote(noteId) {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;

    try {
        await db.collection('notes').doc(noteId).delete();
        loadNotes();
        showNotification('Not başarıyla silindi');
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

async function deleteFile(fileId, fileUrl) {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;

    try {
        await storage.refFromURL(fileUrl).delete();
        await db.collection('files').doc(fileId).delete();
        loadFiles();
        showNotification('Dosya başarıyla silindi');
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
    }
}

// Yardımcı fonksiyonlar
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

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Çıkış işlemi
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        window.location.href = 'index.html';
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    loadFiles();
}); 