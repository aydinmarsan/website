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

        // Stored Data butonu
        const storedDataBtn = document.createElement('button');
        storedDataBtn.className = 'pip-btn';
        storedDataBtn.innerHTML = '<i class="fas fa-database"></i> STORED DATA';
        storedDataBtn.addEventListener('click', () => this.toggleStoredDataPanel());
        
        // Terminal butonunun altına ekle
        const terminalTab = document.querySelector('[data-tab="terminal"]');
        terminalTab.parentNode.insertBefore(storedDataBtn, terminalTab.nextSibling);

        // Panel kapatma butonu
        document.getElementById('closePanel').addEventListener('click', () => {
            document.getElementById('storedDataPanel').classList.remove('open');
        });

        // Panel tab switching
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`stored${tab.dataset.section.charAt(0).toUpperCase() + tab.dataset.section.slice(1)}`).classList.add('active');
            });
        });
    }

    updateClock() {
        const now = new Date();
        document.getElementById('pipTime').textContent = 
            now.toLocaleTimeString('en-US', { hour12: false });
    }

    // Notes Management
    async initializeNotes() {
        await this.refreshNotes();
    }

    async refreshNotes() {
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '';
        
        try {
            const snapshot = await db.collection('notes')
                .where('type', '==', 'note')
                .orderBy('timestamp', 'desc')
                .get();
            
            if (snapshot.empty) {
                notesList.innerHTML = '<div class="empty-message">No notes found. Click "NEW NOTE" to create one.</div>';
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const noteBox = document.createElement('div');
                    noteBox.className = 'stored-item';
                    noteBox.dataset.noteId = doc.id;
                    noteBox.innerHTML = `
                        <div class="item-header">
                            <div class="item-title">
                                <i class="fas fa-sticky-note"></i>
                                ${data.title}
                            </div>
                            <div class="item-actions">
                                <button class="note-btn edit" title="Edit">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="note-btn delete" title="Delete">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div class="item-content">
                            <div class="item-preview">${data.content.substring(0, 100)}...</div>
                            <div class="item-date">
                                <i class="fas fa-clock"></i>
                                ${new Date(data.timestamp?.toDate()).toLocaleString()}
                            </div>
                        </div>
                    `;

                    // Edit butonu
                    const editBtn = noteBox.querySelector('.edit');
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showNoteModal({...data, id: doc.id});
                    });

                    // Delete butonu
                    const deleteBtn = noteBox.querySelector('.delete');
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const noteId = noteBox.dataset.noteId;
                        
                        if (confirm('Are you sure you want to delete this note?')) {
                            try {
                                // Firebase'den notu sil
                                await db.collection('notes').doc(noteId).delete();
                                
                                // Notları yenile
                                await this.refreshNotes();
                                
                                // Stored Data panelini güncelle (eğer açıksa)
                                const panel = document.getElementById('storedDataPanel');
                                if (panel.classList.contains('open')) {
                                    await this.loadStoredData();
                                }
                                
                                // Başarı mesajı
                                this.printLine('Note deleted successfully', 'success');
                            } catch (error) {
                                console.error('Error deleting note:', error);
                                this.printLine('Error deleting note: ' + error.message, 'error');
                            }
                        }
                    });

                    notesList.appendChild(noteBox);
                });
            }
        } catch (error) {
            console.error('Error loading notes:', error);
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
        modal.dataset.noteId = '';
        
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
                await db.collection('notes').doc(modal.dataset.noteId).update(noteData);
            } else {
                await db.collection('notes').add(noteData);
            }

            // Modal'ı kapat
            this.hideNoteModal();
            
            // Notlar sekmesini aktif yap
            document.querySelectorAll('.pip-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pip-tab-content').forEach(c => c.classList.remove('active'));
            
            const notesTab = document.querySelector('[data-tab="notes"]');
            notesTab.classList.add('active');
            document.getElementById('notes-content').classList.add('active');
            
            // Notları yenile
            await this.refreshNotes();
            
            // Başarı mesajı
            this.printLine('Note saved successfully', 'success');
            
        } catch (error) {
            console.error('Error saving note:', error);
            this.printLine('Error saving note: ' + error.message, 'error');
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
        
        try {
            const snapshot = await db.collection('notes')
                .where('type', '==', 'file')
                .orderBy('timestamp', 'desc')
                .get();
            
            if (snapshot.empty) {
                filesList.innerHTML = '<div class="empty-message">No files found. Drag and drop files to upload.</div>';
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const fileDiv = document.createElement('div');
                    fileDiv.className = 'file-item';
                    fileDiv.innerHTML = `
                        <div class="file-header">
                            <div class="file-title">
                                <i class="fas fa-file"></i>
                                ${data.title}
                            </div>
                            <div class="file-actions">
                                <a href="${data.url}" target="_blank" class="note-btn" title="Download">
                                    <i class="fas fa-download"></i> Download
                                </a>
                                <button class="note-btn delete" title="Delete">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div class="file-content">
                            <div class="file-date">
                                <i class="fas fa-clock"></i>
                                ${new Date(data.timestamp?.toDate()).toLocaleString()}
                            </div>
                        </div>
                    `;

                    // Delete butonu
                    fileDiv.querySelector('.delete').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this file?')) {
                            try {
                                // Storage'dan dosyayı sil
                                const storageRef = firebase.storage().refFromURL(data.url);
                                await storageRef.delete();
                                
                                // Database'den kaydı sil
                                await db.collection('notes').doc(doc.id).delete();
                                
                                // Dosya listesini güncelle
                                await this.refreshFiles();
                                
                                // Başarı mesajı
                                this.printLine('File deleted successfully', 'success');
                            } catch (error) {
                                console.error('Error deleting file:', error);
                                this.printLine('Error deleting file: ' + error.message, 'error');
                            }
                        }
                    });

                    filesList.appendChild(fileDiv);
                });
            }
        } catch (error) {
            console.error('Error loading files:', error);
            this.printLine('Error loading files: ' + error.message, 'error');
        }
    }

    async handleFiles(files) {
        for (let file of files) {
            try {
                // Progress mesajı
                this.printLine(`Uploading ${file.name}...`, 'info');
                
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`files/${Date.now()}_${file.name}`);
                
                // Dosyayı yükle
                const uploadTask = fileRef.put(file);
                
                // Upload progress
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        this.printLine(`Upload progress: ${Math.round(progress)}%`, 'info');
                    }
                );
                
                // Upload tamamlandı
                await uploadTask;
                const url = await fileRef.getDownloadURL();
                
                // Database'e kaydet
                await db.collection('notes').add({
                    title: file.name,
                    type: 'file',
                    url,
                    size: file.size,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Dosya listesini güncelle
                await this.refreshFiles();
                
                // Başarı mesajı
                this.printLine(`${file.name} uploaded successfully`, 'success');
                
            } catch (error) {
                console.error('Error uploading file:', error);
                this.printLine(`Error uploading ${file.name}: ${error.message}`, 'error');
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

    toggleStoredDataPanel() {
        const panel = document.getElementById('storedDataPanel');
        panel.classList.toggle('open');
        
        if (panel.classList.contains('open')) {
            this.loadStoredData();
        }
    }

    async loadStoredData() {
        const notesContainer = document.getElementById('storedNotes');
        const filesContainer = document.getElementById('storedFiles');
        
        try {
            // Notları yükle
            const notes = await db.collection('notes')
                .where('type', '==', 'note')
                .orderBy('timestamp', 'desc')
                .get();
                
            notesContainer.innerHTML = '';
            
            if (notes.empty) {
                notesContainer.innerHTML = '<div class="empty-message">No notes found. Click "NEW NOTE" to create one.</div>';
            } else {
                notes.forEach(doc => {
                    const data = doc.data();
                    const noteDiv = document.createElement('div');
                    noteDiv.className = 'stored-item';
                    noteDiv.innerHTML = `
                        <div class="item-header">
                            <div class="item-title">
                                <i class="fas fa-sticky-note"></i>
                                ${data.title}
                            </div>
                            <div class="item-actions">
                                <button class="note-btn edit" title="Edit">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="note-btn delete" title="Delete">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div class="item-content">
                            <div class="item-preview">${data.content.substring(0, 100)}...</div>
                            <div class="item-date">
                                <i class="fas fa-clock"></i>
                                ${new Date(data.timestamp?.toDate()).toLocaleString()}
                            </div>
                        </div>
                    `;

                    // Edit butonu
                    noteDiv.querySelector('.edit').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showNoteModal({...data, id: doc.id});
                        this.toggleStoredDataPanel();
                    });

                    // Delete butonu
                    noteDiv.querySelector('.delete').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this note?')) {
                            try {
                                await db.collection('notes').doc(doc.id).delete();
                                await this.refreshNotes();
                                this.loadStoredData(); // Panel'i güncelle
                                this.printLine('Note deleted successfully', 'success');
                            } catch (error) {
                                this.printLine('Error deleting note: ' + error.message, 'error');
                            }
                        }
                    });

                    notesContainer.appendChild(noteDiv);
                });
            }

            // Dosyaları yükle
            const files = await db.collection('notes')
                .where('type', '==', 'file')
                .orderBy('timestamp', 'desc')
                .get();
                
            filesContainer.innerHTML = '';
            
            if (files.empty) {
                filesContainer.innerHTML = '<div class="empty-message">No files found. Drag and drop files to upload.</div>';
            } else {
                files.forEach(doc => {
                    const data = doc.data();
                    const fileDiv = document.createElement('div');
                    fileDiv.className = 'stored-item';
                    fileDiv.innerHTML = `
                        <div class="item-header">
                            <div class="item-title">
                                <i class="fas fa-file"></i>
                                ${data.title}
                            </div>
                            <div class="item-actions">
                                <a href="${data.url}" target="_blank" class="note-btn download">
                                    <i class="fas fa-download"></i> Download
                                </a>
                                <button class="note-btn delete">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div class="item-content">
                            <div class="item-date">
                                <i class="fas fa-clock"></i>
                                ${new Date(data.timestamp?.toDate()).toLocaleString()}
                            </div>
                        </div>
                    `;

                    // Delete butonu
                    fileDiv.querySelector('.delete').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this file?')) {
                            try {
                                // Storage'dan dosyayı sil
                                const storageRef = firebase.storage().refFromURL(data.url);
                                await storageRef.delete();
                                
                                // Database'den kaydı sil
                                await db.collection('notes').doc(doc.id).delete();
                                
                                await this.refreshFiles();
                                this.loadStoredData(); // Panel'i güncelle
                                this.printLine('File deleted successfully', 'success');
                            } catch (error) {
                                this.printLine('Error deleting file: ' + error.message, 'error');
                            }
                        }
                    });

                    filesContainer.appendChild(fileDiv);
                });
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
            this.printLine('Error loading stored data: ' + error.message, 'error');
        }
    }

    printLine(text, type = '') {
        const output = document.getElementById('output');
        if (output) {
            const line = document.createElement('div');
            line.className = `output-line ${type}`;
            line.textContent = text;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        }
        console.log(`[${type}] ${text}`);
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