class PipTerminal {
    constructor() {
        this.initializeUI();
        this.initializeTerminal();
        this.initializeNotes();
        this.initializeFiles();
        this.updateClock();
        this.checkAuth();
    }

    checkAuth() {
        if (!localStorage.getItem('isLoggedIn')) {
            window.location.href = 'index.html';
        }
    }

    initializeUI() {
        // Tab switching
        document.querySelectorAll('.pip-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.pip-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.pip-tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-content`).classList.add('active');
            });
        });

        // Note modal controls
        document.getElementById('addNoteBtn').addEventListener('click', () => this.showNoteModal());
        document.getElementById('cancelNoteBtn').addEventListener('click', () => this.hideNoteModal());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());

        // Clock update
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        document.getElementById('pipTime').textContent = 
            now.toLocaleTimeString('en-US', { hour12: false });
    }

    // Notes Management
    async initializeNotes() {
        this.refreshNotes();
        
        // Storage usage update
        const snapshot = await db.collection('notes').get();
        const totalSize = snapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            return acc + (data.size || 0);
        }, 0);
        
        this.updateStorageBar(totalSize);
    }

    async refreshNotes() {
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '';
        notesList.className = 'notes-container';
        
        try {
            const snapshot = await db.collection('notes')
                .where('type', '==', 'note')
                .orderBy('timestamp', 'desc')
                .get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const noteBox = document.createElement('div');
                noteBox.className = 'note-box';
                noteBox.innerHTML = `
                    <div class="note-box-actions">
                        <button class="note-action-btn edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-action-btn delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="note-box-title">${data.title}</div>
                    <div class="note-box-content">${data.content}</div>
                    <div class="note-box-date">
                        ${new Date(data.timestamp?.toDate()).toLocaleString()}
                    </div>
                `;

                // Edit butonu
                noteBox.querySelector('.edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showNoteModal({...data, id: doc.id});
                });

                // Delete butonu
                noteBox.querySelector('.delete').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this note?')) {
                        try {
                            await db.collection('notes').doc(doc.id).delete();
                            await this.refreshNotes();
                            this.printLine('Note deleted successfully', 'success');
                        } catch (error) {
                            this.printLine('Error deleting note: ' + error.message, 'error');
                        }
                    }
                });

                notesList.appendChild(noteBox);
            });

            if (snapshot.empty) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'No notes found. Click "NEW NOTE" to create one.';
                notesList.appendChild(emptyMessage);
            }
        } catch (error) {
            this.printLine('Error loading notes: ' + error.message, 'error');
        }
    }

    showNoteModal(note = null) {
        const modal = document.getElementById('noteModal');
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        
        if (note) {
            titleInput.value = note.title;
            contentInput.value = note.content;
            modal.dataset.noteId = note.id;
        } else {
            titleInput.value = '';
            contentInput.value = '';
            delete modal.dataset.noteId;
        }
        
        modal.style.display = 'block';
    }

    hideNoteModal() {
        const modal = document.getElementById('noteModal');
        modal.style.display = 'none';
        modal.dataset.noteId = ''; // ID'yi temizle
        
        // Input alanlarını temizle
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
    }

    async saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        const modal = document.getElementById('noteModal');
        
        if (!title || !content) {
            this.printLine('Title and content are required', 'error');
            return;
        }

        try {
            const noteData = {
                title,
                content,
                type: 'note',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (modal.dataset.noteId) {
                // Mevcut notu güncelle
                await db.collection('notes').doc(modal.dataset.noteId).update(noteData);
                this.printLine('Note updated successfully', 'success');
            } else {
                // Yeni not ekle
                await db.collection('notes').add(noteData);
                this.printLine('Note saved successfully', 'success');
            }
            
            // Modal'ı kapat
            this.hideNoteModal();
            
            // Notları yenile
            await this.refreshNotes();
            
            // Input alanlarını temizle
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            
        } catch (error) {
            this.printLine('Error saving note: ' + error.message, 'error');
            console.error('Save error:', error);
        }
    }

    // Files Management
    initializeFiles() {
        this.refreshFiles();
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('dragover', e => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', e => {
            this.handleFiles(e.target.files);
        });
    }

    async refreshFiles() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '';
        
        const snapshot = await db.collection('notes').where('type', '==', 'file').orderBy('timestamp', 'desc').get();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            fileDiv.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${data.title}</div>
                    <div class="file-date">${new Date(data.timestamp?.toDate()).toLocaleString()}</div>
                </div>
                <a href="${data.url}" target="_blank" class="pip-btn">DOWNLOAD</a>
            `;
            filesList.appendChild(fileDiv);
        });
    }

    async handleFiles(files) {
        for (let file of files) {
            try {
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`files/${Date.now()}_${file.name}`);
                
                await fileRef.put(file);
                const url = await fileRef.getDownloadURL();
                
                await db.collection('notes').add({
                    title: file.name,
                    type: 'file',
                    url,
                    size: file.size,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.refreshFiles();
                this.updateStorageBar(file.size);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    }

    updateStorageBar(newSize = 0) {
        const maxStorage = 1024 * 1024 * 100; // 100MB limit
        const currentStorage = parseInt(localStorage.getItem('storageUsed') || '0') + newSize;
        localStorage.setItem('storageUsed', currentStorage);
        
        const percentage = (currentStorage / maxStorage) * 100;
        document.getElementById('storageBar').style.width = `${Math.min(percentage, 100)}%`;
    }
}

// Initialize the terminal
document.addEventListener('DOMContentLoaded', () => {
    new PipTerminal();
});

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
} 