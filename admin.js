document.addEventListener('DOMContentLoaded', function() {
    // Giriş kontrolü
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = 'index.html';
        return;
    }

    // Matrix efektini başlat
    initMatrix();
    
    // Notları yükle
    loadNotes();
});

// Matrix efekti (login.js'deki ile aynı)
function initMatrix() {
    const canvas = document.getElementById('matrix');
    const ctx = canvas.getContext('2d');

    // Canvas boyutunu ayarla
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Matrix karakterleri
    const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    // Yağmur efekti
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            // Rastgele parlaklık efekti
            const brightness = Math.random();
            if (brightness < 0.1) {
                ctx.fillStyle = '#FFF'; // Parlak beyaz
            } else if (brightness < 0.3) {
                ctx.fillStyle = '#AFA'; // Açık yeşil
            } else {
                ctx.fillStyle = '#0F0'; // Normal yeşil
            }

            ctx.font = `${fontSize}px monospace`;
            ctx.fillText(char, x, y);

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        requestAnimationFrame(draw);
    }
    draw();
}

// Not panelini aç/kapat
function toggleNotePanel() {
    const notePanel = document.getElementById('notePanel');
    const currentDisplay = window.getComputedStyle(notePanel).display;

    if (currentDisplay === 'none') {
        // Panel açılırken animasyon
        notePanel.style.display = 'block';
        notePanel.style.opacity = '0';
        notePanel.style.transform = 'translate(-50%, -45%)';
        
        setTimeout(() => {
            notePanel.style.opacity = '1';
            notePanel.style.transform = 'translate(-50%, -50%)';
        }, 10);

        // Input'a fokuslan
        document.getElementById('noteTitle').focus();
    } else {
        // Panel kapanırken animasyon
        notePanel.style.opacity = '0';
        notePanel.style.transform = 'translate(-50%, -45%)';
        
        setTimeout(() => {
            notePanel.style.display = 'none';
            // Formu temizle
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteText').value = '';
        }, 300);
    }
}

// Not kaydetme
async function saveNote() {
    const noteTitle = document.getElementById('noteTitle').value.trim();
    const noteText = document.getElementById('noteText').value.trim();
    
    if (!noteTitle || !noteText) {
        alert('Please enter both title and note text');
        return;
    }

    try {
        const saveBtn = document.querySelector('.save-btn');
        const originalText = saveBtn.innerHTML;
        
        // Kaydetme animasyonu
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAVING...';
        saveBtn.disabled = true;

        await db.collection('notes').add({
            title: noteTitle,
            text: noteText,
            date: new Date().toLocaleString('tr-TR'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().getTime()
        });

        // Başarılı animasyonu
        saveBtn.innerHTML = '<i class="fas fa-check"></i> SAVED!';
        saveBtn.style.backgroundColor = 'var(--matrix-green)';
        saveBtn.style.color = 'black';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            saveBtn.style.backgroundColor = '';
            saveBtn.style.color = '';
            toggleNotePanel();
        }, 1000);

    } catch (error) {
        console.error("Firebase error:", error);
        alert('Error saving note: ' + error.message);
        
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.innerHTML = '<i class="fas fa-times"></i> ERROR';
        saveBtn.style.backgroundColor = 'var(--matrix-red)';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            saveBtn.style.backgroundColor = '';
        }, 2000);
    }
}

// Notları yükleme
function loadNotes() {
    const notesList = document.getElementById('notesList');
    
    try {
        db.collection('notes')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                notesList.innerHTML = '';
                
                if (snapshot.empty) {
                    notesList.innerHTML = `
                        <div class="empty-notes">
                            <i class="fas fa-clipboard fa-3x"></i>
                            <p>NO NOTES FOUND</p>
                            <button onclick="toggleNotePanel()" class="add-note-btn">
                                <i class="fas fa-plus"></i> ADD FIRST NOTE
                            </button>
                        </div>
                    `;
                    return;
                }
                
                snapshot.forEach(doc => {
                    const note = doc.data();
                    const noteElement = document.createElement('div');
                    noteElement.className = 'note-item';
                    noteElement.innerHTML = `
                        <div class="note-content">
                            <div class="note-title">
                                <i class="fas fa-file-alt"></i> ${note.title}
                            </div>
                            <div class="note-text">${note.text}</div>
                            <div class="note-date">
                                <i class="fas fa-clock"></i> ${note.date}
                            </div>
                        </div>
                        <div class="note-actions">
                            <button onclick="editNote('${doc.id}')" class="edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteNote('${doc.id}')" class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    notesList.appendChild(noteElement);
                });
            }, (error) => {
                console.error("Firebase error:", error);
                notesList.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        ERROR: ${error.message}
                    </div>
                `;
            });
    } catch (error) {
        console.error("Firebase error:", error);
        notesList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                ERROR: ${error.message}
            </div>
        `;
    }
}

// Not düzenleme
async function editNote(id) {
    try {
        const doc = await db.collection('notes').doc(id).get();
        const note = doc.data();
        
        const newTitle = prompt('Edit note title:', note.title);
        if (newTitle === null) return;

        const newText = prompt('Edit note text:', note.text);
        if (newText === null) return;

        await db.collection('notes').doc(id).update({
            title: newTitle.trim(),
            text: newText.trim(),
            date: new Date().toLocaleString() + ' (edited)',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        loadNotes();
    } catch (error) {
        console.error("Error editing note: ", error);
        alert('Error editing note. Please try again.');
    }
}

// Not silme
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        await db.collection('notes').doc(id).delete();
        loadNotes();
    } catch (error) {
        console.error("Error deleting note: ", error);
        alert('Error deleting note. Please try again.');
    }
}

// Modal göster/gizle fonksiyonları
function showModal() {
    const modal = document.getElementById('exitModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal() {
    const modal = document.getElementById('exitModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Çıkış fonksiyonunu güncelle
function logout() {
    showModal();
}

// Çıkışı onayla
function confirmLogout() {
    // Kapanış animasyonu
    const adminContainer = document.querySelector('.admin-container');
    adminContainer.style.animation = 'powerOff 1s forwards';
    
    // Matrix efektini yavaşça durdur
    const canvas = document.getElementById('matrix');
    canvas.style.transition = 'opacity 1s';
    canvas.style.opacity = '0';
    
    // Modal'ı kapat
    closeModal();
    
    // Local storage'ı temizle ve yönlendir
    setTimeout(() => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }, 1000);
} 
} 