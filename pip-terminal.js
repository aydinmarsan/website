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
        // İlk yüklemede aktif sekmeyi kontrol et ve notları yükle
        const activeTab = document.querySelector('.pip-tab.active');
        if (activeTab && activeTab.dataset.tab === 'notes') {
            this.refreshNotes();
        }

        // Tab switching
        document.querySelectorAll('.pip-tab').forEach(tab => {
            tab.addEventListener('click', async () => {
                document.querySelectorAll('.pip-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.pip-tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const contentId = `${tab.dataset.tab}-content`;
                document.getElementById(contentId).classList.add('active');

                // Notes tab seçildiğinde notları yenile
                if (tab.dataset.tab === 'notes') {
                    await this.refreshNotes();
                }
            });
        });

        // Note modal controls
        document.getElementById('addNoteBtn').addEventListener('click', () => this.showNoteModal());
        document.getElementById('cancelNoteBtn').addEventListener('click', () => this.hideNoteModal());
        document.getElementById('saveNoteBtn').addEventListener('click', async () => {
            await this.saveNote();
            await this.refreshNotes(); // Notları tekrar yükle
        });

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

        // Upload butonu kontrolü
        document.getElementById('uploadBtn').addEventListener('click', () => {
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.style.display = 'block';
        });

        // Upload alanı dışına tıklandığında kapatma
        document.addEventListener('click', (e) => {
            const uploadArea = document.getElementById('uploadArea');
            const uploadBtn = document.getElementById('uploadBtn');
            
            if (!uploadArea.contains(e.target) && !uploadBtn.contains(e.target)) {
                uploadArea.style.display = 'none';
            }
        });
    }

    updateClock() {
        const now = new Date();
        document.getElementById('pipTime').textContent = 
            now.toLocaleTimeString('en-US', { hour12: false });
    }

    // Notes Management
    async initializeNotes() {
        // Sayfa yüklendiğinde notları yükle
        await this.refreshNotes();
        
        // Not ekleme butonunu dinle
        document.getElementById('addNoteBtn').addEventListener('click', () => this.showNoteModal());
    }

    async refreshNotes() {
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '<div class="loading">Loading notes...</div>';
        
        try {
            const snapshot = await db.collection('notes')
                .where('type', '==', 'note')
                .orderBy('timestamp', 'desc')
                .get();
            
            notesList.innerHTML = '';
            
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
                        </div>
                        <div class="item-content">
                            <div class="item-preview">${data.content}</div>
                            <div class="item-date">
                                <i class="fas fa-clock"></i>
                                ${new Date(data.timestamp?.toDate()).toLocaleString()}
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="note-btn edit" title="Edit">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="note-btn delete" title="Delete">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    `;

                    // Edit butonu
                    noteBox.querySelector('.edit').addEventListener('click', () => {
                        this.showNoteModal({...data, id: doc.id});
                    });

                    // Delete butonu - düzeltilmiş versiyon
                    const deleteBtn = noteBox.querySelector('.delete');
                    deleteBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        try {
                            const noteId = doc.id;
                            if (!noteId) {
                                throw new Error('Note ID not found');
                            }

                            const confirmDelete = await this.showConfirmModal('Are you sure you want to delete this note?');
                            if (!confirmDelete) {
                                return;
                            }

                            console.log('Deleting note with ID:', noteId); // Debug için log

                            // Firestore'dan notu sil
                            await db.collection('notes').doc(noteId).delete();
                            console.log('Note deleted from Firestore'); // Debug için log

                            // UI'dan notu kaldır
                            noteBox.remove();
                            
                            // Başarı mesajı
                            this.printLine('Note deleted successfully', 'success');

                            // Notları yenile
                            await this.refreshNotes();

                        } catch (error) {
                            console.error('Error deleting note:', error);
                            this.printLine(`Error deleting note: ${error.message}`, 'error');
                        }
                    });

                    notesList.appendChild(noteBox);
                });
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            notesList.innerHTML = '<div class="error-message">Error loading notes.</div>';
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
        filesList.innerHTML = '<div class="loading">Loading files...</div>';
        
        try {
            const snapshot = await db.collection('notes')
                .where('type', '==', 'file')
                .orderBy('timestamp', 'desc')
                .get();
            
            filesList.innerHTML = '';
            
            if (snapshot.empty) {
                filesList.innerHTML = '<div class="empty-message">No files found. Click "UPLOAD FILE" to add files.</div>';
                return;
            }

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const fileBox = document.createElement('div');
                fileBox.className = 'stored-item';
                fileBox.dataset.fileId = doc.id;
                
                // Dosya simgesini belirle
                let fileIcon = 'fa-file';
                if (data.mimeType) {
                    if (data.mimeType.includes('image')) fileIcon = 'fa-file-image';
                    else if (data.mimeType.includes('pdf')) fileIcon = 'fa-file-pdf';
                    else if (data.mimeType.includes('word')) fileIcon = 'fa-file-word';
                    else if (data.mimeType.includes('text')) fileIcon = 'fa-file-text';
                }

                fileBox.innerHTML = `
                    <div class="item-header">
                        <div class="item-title">
                            <i class="fas ${fileIcon}"></i>
                            ${data.title}
                        </div>
                        <div class="item-actions">
                            <a href="${data.url}" class="note-btn download" target="_blank" title="Download">
                                <i class="fas fa-download"></i> Download
                            </a>
                            <button class="note-btn delete" title="Delete">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="item-content">
                        <div class="item-info">
                            <span class="file-size">Size: ${this.formatFileSize(data.size)}</span>
                            <span class="file-date">
                                <i class="fas fa-clock"></i>
                                ${new Date(data.timestamp?.toDate()).toLocaleString()}
                            </span>
                        </div>
                    </div>
                `;

                // Delete butonu işlemleri
                const deleteBtn = fileBox.querySelector('.delete');
                deleteBtn.addEventListener('click', async () => {
                    try {
                        const confirmed = await this.showConfirmModal(`Are you sure you want to delete "${data.title}"?`);
                        if (!confirmed) return;

                        // Debug için log
                        console.log('Deleting file:', {
                            id: doc.id,
                            title: data.title,
                            url: data.url
                        });

                        // 1. Storage'dan dosyayı sil
                        if (data.url) {
                            try {
                                // URL'den dosya adını al
                                const urlParts = data.url.split('/');
                                const fileName = urlParts[urlParts.length - 1].split('?')[0];
                                
                                // Storage referansını oluştur
                                const storageRef = storage.ref();
                                const fileRef = storageRef.child(`files/${fileName}`);
                                
                                console.log('Attempting to delete from storage:', fileName);
                                
                                // Dosyayı sil
                                await fileRef.delete();
                                console.log('File deleted from storage successfully');
                            } catch (storageError) {
                                console.error('Storage deletion error:', storageError);
                            }
                        }

                        // 2. Firestore'dan dökümanı sil
                        console.log('Attempting to delete from Firestore:', doc.id);
                        await db.collection('notes').doc(doc.id).delete();
                        console.log('Document deleted from Firestore successfully');

                        // 3. UI'dan kaldır
                        fileBox.remove();

                        // 4. Storage kullanımını güncelle
                        if (data.size) {
                            this.updateStorageBar(-data.size);
                        }

                        // 5. Başarı mesajı
                        this.printLine(`${data.title} deleted successfully`, 'success');
                        
                        // 6. Dosya listesini yenile
                        await this.refreshFiles();

                    } catch (error) {
                        console.error('Delete operation failed:', error);
                        this.printLine(`Failed to delete ${data.title}: ${error.message}`, 'error');
                    }
                });

                filesList.appendChild(fileBox);
            }
        } catch (error) {
            console.error('Error loading files:', error);
            filesList.innerHTML = '<div class="error-message">Error loading files.</div>';
            this.printLine('Error loading files: ' + error.message, 'error');
        }
    }

    // Dosya boyutunu formatla
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleFiles(files) {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf', 'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        for (let file of files) {
            try {
                console.log('İşlenen dosya:', file); // Dosya bilgilerini logla

                // Dosya tipi kontrolü
                if (!allowedTypes.includes(file.type)) {
                    throw new Error('Desteklenmeyen dosya türü');
                }

                // Dosya boyutu kontrolü (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
                }

                // Progress mesajı
                this.printLine(`${file.name} yükleniyor...`, 'info');

                // Storage referansı oluştur
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`files/${Date.now()}_${file.name}`);
                console.log('Storage referansı oluşturuldu:', fileRef.fullPath);

                // Upload işlemi için Promise kullan
                await new Promise((resolve, reject) => {
                    const uploadTask = fileRef.put(file);

                    uploadTask.on('state_changed',
                        // Progress
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log('Upload progress:', progress);
                            this.printLine(`Yükleme durumu: ${Math.round(progress)}%`, 'info');
                        },
                        // Hata
                        (error) => {
                            console.error('Upload error:', error);
                            reject(error);
                        },
                        // Başarılı
                        async () => {
                            try {
                                console.log('Upload tamamlandı');
                                const url = await uploadTask.snapshot.ref.getDownloadURL();
                                console.log('Download URL alındı:', url);

                                // Firestore'a kaydet
                                await db.collection('notes').add({
                                    title: file.name,
                                    type: 'file',
                                    url: url,
                                    size: file.size,
                                    mimeType: file.type,
                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                });
                                console.log('Firestore\'a kaydedildi');

                                // Storage kullanımını güncelle
                                this.updateStorageBar(file.size);

                                resolve();
                            } catch (error) {
                                console.error('Completion error:', error);
                                reject(error);
                            }
                        }
                    );
                });

                // Dosya listesini güncelle
                await this.refreshFiles();

                // Başarı mesajı
                this.printLine(`${file.name} başarıyla yüklendi`, 'success');

            } catch (error) {
                console.error('Dosya işleme hatası:', error);
                this.printLine(`${file.name}: ${error.message}`, 'error');
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

    // Confirmation modal fonksiyonu
    async showConfirmModal(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const messageEl = modal.querySelector('.confirm-message');
            messageEl.textContent = message;
            
            const handleYes = () => {
                modal.style.display = 'none';
                cleanup();
                resolve(true);
            };
            
            const handleNo = () => {
                modal.style.display = 'none';
                cleanup();
                resolve(false);
            };
            
            const cleanup = () => {
                yesBtn.removeEventListener('click', handleYes);
                noBtn.removeEventListener('click', handleNo);
            };
            
            const yesBtn = modal.querySelector('.confirm-yes');
            const noBtn = modal.querySelector('.confirm-no');
            
            yesBtn.addEventListener('click', handleYes);
            noBtn.addEventListener('click', handleNo);
            
            modal.style.display = 'block';
        });
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