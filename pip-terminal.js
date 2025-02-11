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
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const uploadBtn = document.getElementById('uploadNowBtn');
        const cancelBtn = document.getElementById('cancelUploadBtn');
        let selectedFile = null;

        // Dosya seçildiğinde
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                this.updateSelectedFileUI(selectedFile);
                uploadBtn.disabled = false;
            }
        });

        // Upload butonu
        uploadBtn.addEventListener('click', async () => {
            if (selectedFile) {
                document.getElementById('uploadProgress').style.display = 'block';
                await this.handleFiles([selectedFile]);
                selectedFile = null;
                uploadArea.style.display = 'none';
                fileInput.value = '';
                document.getElementById('selectedFile').style.display = 'none';
                uploadBtn.disabled = true;
            }
        });

        // Upload alanını kapatma fonksiyonu
        const closeUploadArea = () => {
            uploadArea.style.display = 'none';
            fileInput.value = '';
            document.getElementById('selectedFile').style.display = 'none';
            uploadBtn.disabled = true;
            selectedFile = null;

            // Files sekmesine geç
            document.querySelectorAll('.pip-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.pip-tab-content').forEach(content => content.classList.remove('active'));
            
            const filesTab = document.querySelector('[data-tab="files"]');
            const filesContent = document.getElementById('files-content');
            
            filesTab.classList.add('active');
            filesContent.classList.add('active');
        };

        // Cancel butonuna tıklama
        cancelBtn.addEventListener('click', closeUploadArea);

        // Upload alanının boş kısmına tıklama
        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea) {
                closeUploadArea();
            }
        });
    }

    // Seçilen dosya bilgilerini UI'da göster
    updateSelectedFileUI(file) {
        const selectedFileEl = document.getElementById('selectedFile');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const fileType = document.getElementById('fileType');

        // Dosya bilgilerini güncelle
        fileName.innerHTML = `<span class="status-label">FILE:</span> ${file.name}`;
        fileSize.innerHTML = `<span class="status-label">SIZE:</span> ${this.formatFileSize(file.size)}`;
        fileType.innerHTML = `<span class="status-label">TYPE:</span> ${this.getFileTypeInfo(file.type)}`;

        // Status mesajını göster
        const statusMessage = this.getFileStatusMessage(file);
        const statusEl = document.createElement('div');
        statusEl.className = 'file-status';
        statusEl.innerHTML = `
            <div class="status-indicator ${statusMessage.type}"></div>
            <span class="status-text">${statusMessage.text}</span>
        `;

        // Varsa eski status mesajını kaldır
        const oldStatus = selectedFileEl.querySelector('.file-status');
        if (oldStatus) oldStatus.remove();

        // Yeni status mesajını ekle
        document.querySelector('.file-details').appendChild(statusEl);

        selectedFileEl.style.display = 'flex';
    }

    // Dosya türü bilgisini formatla
    getFileTypeInfo(mimeType) {
        const typeMap = {
            'image/jpeg': 'JPEG Image',
            'image/png': 'PNG Image',
            'image/gif': 'GIF Image',
            'application/pdf': 'PDF Document',
            'text/plain': 'Text File',
            'application/msword': 'Word Document',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document'
        };
        return typeMap[mimeType] || mimeType || 'Unknown Type';
    }

    // Dosya durum mesajını belirle
    getFileStatusMessage(file) {
        // Dosya boyutu kontrolü
        if (file.size > 10 * 1024 * 1024) {
            return {
                text: 'FILE TOO LARGE (MAX 10MB)',
                type: 'error'
            };
        }

        // Dosya türü kontrolü
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf', 'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            return {
                text: 'UNSUPPORTED FILE TYPE',
                type: 'error'
            };
        }

        return {
            text: 'READY TO UPLOAD',
            type: 'success'
        };
    }

    // Upload UI'ı sıfırla
    resetUploadUI() {
        document.getElementById('fileInput').value = '';
        document.getElementById('selectedFile').style.display = 'none';
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadNowBtn').disabled = true;
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
        const storedNotes = document.getElementById('storedNotes');
        const storedFiles = document.getElementById('storedFiles');
        
        try {
            // Notları yükle
            const notesSnapshot = await db.collection('notes')
                .where('type', '==', 'note')
                .orderBy('timestamp', 'desc')
                .get();
            
            storedNotes.innerHTML = '';
            notesSnapshot.forEach(doc => {
                const data = doc.data();
                const noteItem = document.createElement('div');
                noteItem.className = 'stored-item note-item';
                noteItem.innerHTML = `
                    <div class="item-header">
                        <div class="item-title">
                            <i class="fas fa-sticky-note"></i>
                            ${data.title}
                        </div>
                        <div class="item-date">
                            <i class="fas fa-clock"></i>
                            ${new Date(data.timestamp?.toDate()).toLocaleString()}
                        </div>
                    </div>
                    <div class="item-content">
                        <div class="note-preview">${data.content}</div>
                    </div>
                    <div class="item-actions">
                        <button class="note-btn edit">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="note-btn delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;

                // Edit butonu
                noteItem.querySelector('.edit').addEventListener('click', () => {
                    this.showNoteModal({...data, id: doc.id});
                    document.getElementById('storedDataPanel').classList.remove('open');
                });

                // Delete butonu için onay penceresi
                noteItem.querySelector('.delete').addEventListener('click', async () => {
                    const confirmed = await this.showConfirmModal(`Are you sure you want to delete "${data.title}"?`);
                    if (confirmed) {
                        try {
                            await db.collection('notes').doc(doc.id).delete();
                            noteItem.remove();
                            this.printLine(`Note "${data.title}" deleted successfully`, 'success');
                            await this.refreshNotes();
                        } catch (error) {
                            this.printLine(`Error deleting note: ${error.message}`, 'error');
                        }
                    }
                });

                storedNotes.appendChild(noteItem);
            });

            // Dosyaları yükle
            const filesSnapshot = await db.collection('notes')
                .where('type', '==', 'file')
                .orderBy('timestamp', 'desc')
                .get();
            
            storedFiles.innerHTML = '';
            filesSnapshot.forEach(doc => {
                const data = doc.data();
                const fileItem = document.createElement('div');
                fileItem.className = 'stored-item';
                fileItem.innerHTML = `
                    <div class="item-header">
                        <div class="item-title">
                            <i class="fas fa-file"></i>
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
                const deleteBtn = fileItem.querySelector('.delete');
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
                        fileItem.remove();

                        // 4. Storage kullanımını güncelle
                        if (data.size) {
                            this.updateStorageBar(-data.size);
                        }

                        this.printLine(`${data.title} deleted successfully`, 'success');
                        await this.refreshFiles();

                    } catch (error) {
                        console.error('Delete operation failed:', error);
                        this.printLine(`Failed to delete ${data.title}: ${error.message}`, 'error');
                    }
                });

                storedFiles.appendChild(fileItem);
            });

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
            
            const now = new Date();
            const time = now.toLocaleTimeString('tr-TR', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Log formatını oluştur
            let logText = `[${time}] `;
            if (type && type !== 'muted') {
                logText += `[${type.toUpperCase()}] `;
            }
            logText += text;

            line.textContent = logText;

            // Özel stiller
            if (type === 'error') {
                line.style.color = '#ff3333';
            } else if (type === 'success') {
                line.style.color = '#33ff33';
            } else if (type === 'info') {
                line.style.color = '#3399ff';
            } else if (type === 'muted') {
                line.style.opacity = '0.7';
            }

            output.appendChild(line);
            output.scrollTop = output.scrollHeight;

            // Firebase'e kaydet
            try {
                this.logsRef.add({
                    text: text,
                    type: type,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error('Error saving log:', error);
            }
        }
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

    // Dosya önizleme fonksiyonu
    showFilePreview(file) {
        const preview = document.getElementById('filePreview');
        const fileName = document.getElementById('previewFileName');
        const fileSize = document.getElementById('previewFileSize');
        const fileType = document.getElementById('previewFileType');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileType.textContent = file.type || 'Unknown';

        preview.style.display = 'block';
    }

    // Terminal yönetimi
    initializeTerminal() {
        // Terminal log koleksiyonunu referans al
        this.logsRef = db.collection('terminal_logs');
        
        // Sayfa yüklendiğinde logları yükle
        this.loadLogs();
        
        // Terminal input'unu dinle
        const input = document.getElementById('terminalInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = input.value;
                input.value = '';
                this.executeCommand(command);
            }
        });
    }

    // Log kayıtlarını yükle
    async loadLogs() {
        try {
            const snapshot = await this.logsRef
                .orderBy('timestamp', 'desc')
                .limit(100)  // Son 100 log
                .get();

            const output = document.getElementById('output');
            output.innerHTML = '';  // Mevcut logları temizle

            // Logları tersten sırala (eskiden yeniye)
            const logs = [];
            snapshot.forEach(doc => {
                logs.unshift(doc.data());
            });

            // Logları ekrana yazdır
            logs.forEach(log => {
                const line = document.createElement('div');
                line.className = `output-line ${log.type}`;
                line.textContent = `[${new Date(log.timestamp?.toDate()).toLocaleTimeString('tr-TR', { hour12: false })}] ${log.type ? `[${log.type.toUpperCase()}] ` : ''}${log.text}`;
                output.appendChild(line);
            });

            // En alta kaydır
            output.scrollTop = output.scrollHeight;
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    }

    // Terminal komutlarını işle
    async executeCommand(command) {
        if (!command.trim()) return;

        // Komutu loglara ekle
        await this.printLine(`> ${command}`, 'command');

        // Komutları parçala (argümanlar için)
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();

        try {
            switch (cmd) {
                case 'clear':
                    document.getElementById('output').innerHTML = '';
                    break;

                case 'help':
                    this.printLine('Available commands:', 'info');
                    this.printLine('clear          - Clear terminal screen', 'info');
                    this.printLine('help           - Show this help message', 'info');
                    this.printLine('time           - Show current time', 'info');
                    this.printLine('echo [text]    - Print text to terminal', 'info');
                    this.printLine('calc [expr]    - Calculate mathematical expression', 'info');
                    this.printLine('js [code]      - Execute JavaScript code', 'info');
                    this.printLine('color [name]   - Change terminal text color', 'info');
                    this.printLine('history        - Show command history', 'info');
                    this.printLine('stats          - Show system statistics', 'info');
                    break;

                case 'time':
                    const now = new Date();
                    this.printLine(now.toLocaleString('tr-TR'), 'success');
                    break;

                case 'echo':
                    const text = args.slice(1).join(' ');
                    this.printLine(text);
                    break;

                case 'calc':
                    const expr = args.slice(1).join(' ');
                    try {
                        // Güvenli hesaplama için Function yerine math.js gibi bir kütüphane kullanılabilir
                        const result = new Function('return ' + expr)();
                        this.printLine(`${expr} = ${result}`, 'success');
                    } catch (error) {
                        this.printLine('Invalid expression', 'error');
                    }
                    break;

                case 'js':
                    const code = args.slice(1).join(' ');
                    try {
                        const result = eval(code); // Not: Gerçek uygulamada eval kullanımı güvenlik riski oluşturabilir
                        this.printLine('Result: ' + result, 'success');
                    } catch (error) {
                        this.printLine('Error: ' + error.message, 'error');
                    }
                    break;

                case 'color':
                    const color = args[1]?.toLowerCase();
                    const validColors = ['green', 'red', 'blue', 'yellow', 'white', 'cyan', 'magenta'];
                    if (validColors.includes(color)) {
                        document.getElementById('output').style.color = color;
                        this.printLine(`Terminal color changed to ${color}`, 'success');
                    } else {
                        this.printLine(`Valid colors: ${validColors.join(', ')}`, 'error');
                    }
                    break;

                case 'history':
                    const history = await this.logsRef
                        .where('type', '==', 'command')
                        .orderBy('timestamp', 'desc')
                        .limit(10)
                        .get();

                    this.printLine('Command history:', 'info');
                    history.forEach(doc => {
                        const data = doc.data();
                        this.printLine(`${new Date(data.timestamp?.toDate()).toLocaleTimeString('tr-TR')} - ${data.text}`, 'muted');
                    });
                    break;

                case 'stats':
                    const stats = {
                        browser: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language,
                        online: navigator.onLine ? 'Yes' : 'No',
                        memory: performance?.memory?.usedJSHeapSize ? 
                            this.formatFileSize(performance.memory.usedJSHeapSize) : 'N/A'
                    };

                    this.printLine('System Statistics:', 'info');
                    Object.entries(stats).forEach(([key, value]) => {
                        this.printLine(`${key.padEnd(12)}: ${value}`, 'muted');
                    });
                    break;

                default:
                    this.printLine(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'error');
            }
        } catch (error) {
            this.printLine(`Error executing command: ${error.message}`, 'error');
        }
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