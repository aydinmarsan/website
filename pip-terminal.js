class PipTerminal {
    constructor() {
        this.initializeUI();
        this.initializeTerminal();
        this.initializeNotes();
        this.initializeFiles();
        this.initializeLinks();
        this.initializeTrash();
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
            await this.refreshNotes();
        });

        // Clock update
        setInterval(() => this.updateClock(), 1000);

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
                    deleteBtn.addEventListener('click', async () => {
                        const confirmed = await this.showConfirmModal('Move this note to trash?');
                        if (confirmed) {
                            await this.deleteNote(doc.id, data);
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

        // Debug için event listener'ları kontrol et
        console.log('Initializing file upload handlers');

        // Dosya seçildiğinde
        fileInput.addEventListener('change', (e) => {
            console.log('File selected:', e.target.files);
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                this.updateSelectedFileUI(selectedFile);
                uploadBtn.disabled = false;
            }
        });

        // Upload butonu
        uploadBtn.addEventListener('click', async () => {
            console.log('Upload button clicked, selected file:', selectedFile);
            if (selectedFile) {
                document.getElementById('uploadProgress').style.display = 'block';
                try {
                    await this.handleFiles([selectedFile]);
                    selectedFile = null;
                    uploadArea.style.display = 'none';
                    fileInput.value = '';
                    document.getElementById('selectedFile').style.display = 'none';
                    uploadBtn.disabled = true;
                } catch (error) {
                    console.error('Upload error:', error);
                    this.printLine('Upload failed: ' + error.message, 'error');
                }
            }
        });

        // Cancel butonu
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            uploadArea.style.display = 'none';
            fileInput.value = '';
            document.getElementById('selectedFile').style.display = 'none';
            uploadBtn.disabled = true;
            selectedFile = null;
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
        // Sadece dosya boyutu kontrolü
        if (file.size > 10 * 1024 * 1024) {
            return {
                text: 'FILE TOO LARGE (MAX 10MB)',
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
                    const confirmed = await this.showConfirmModal('Move this file to trash?');
                    if (confirmed) {
                        await this.deleteFile(doc.id, data);
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
        for (let file of files) {
            try {
                // Debug için dosya bilgilerini logla
                console.log('Uploading file:', {
                    name: file.name,
                    size: file.size,
                    type: file.type
                });

                // Sadece dosya boyutu kontrolü (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
                }

                // Progress bar ve text elementlerini al
                const progressBar = document.querySelector('.progress-fill');
                const progressText = document.getElementById('progressText');
                
                // Progress mesajı
                this.printLine(`${file.name} yükleniyor...`, 'info');

                // Storage referansı oluştur
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`files/${Date.now()}_${file.name}`);
                console.log('Storage reference created:', fileRef.fullPath);

                // Upload işlemi için Promise kullan
                await new Promise((resolve, reject) => {
                    const uploadTask = fileRef.put(file);

                    uploadTask.on('state_changed',
                        // Progress
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            progressBar.style.width = `${progress}%`;
                            progressText.textContent = `${Math.round(progress)}%`;
                            console.log('Upload progress:', progress);
                        },
                        // Hata
                        (error) => {
                            console.error('Upload error:', error);
                            reject(error);
                        },
                        // Başarılı
                        async () => {
                            try {
                                console.log('Upload completed');
                                const url = await uploadTask.snapshot.ref.getDownloadURL();
                                console.log('Download URL obtained:', url);

                                // Firestore'a kaydet
                                await db.collection('notes').add({
                                    title: file.name,
                                    type: 'file',
                                    url: url,
                                    size: file.size,
                                    mimeType: file.type,
                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                });
                                console.log('File data saved to Firestore');

                                // Storage kullanımını güncelle
                                this.updateStorageBar(file.size);

                                // Progress bar'ı tamamla
                                progressBar.style.width = '100%';
                                progressText.textContent = '100%';

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
                    const confirmed = await this.showConfirmModal(`Are you sure you want to delete "${data.title}"?`);
                    if (confirmed) {
                        await this.deleteFile(doc.id, data);
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

    // Links Management
    async initializeLinks() {
        // Link ekleme butonunu dinle
        document.getElementById('addLinkBtn').addEventListener('click', () => this.showLinkModal());
        document.getElementById('cancelLinkBtn').addEventListener('click', () => this.hideLinkModal());
        document.getElementById('saveLinkBtn').addEventListener('click', async () => {
            await this.saveLink();
            await this.refreshLinks();
        });

        // Sayfa yüklendiğinde linkleri yükle
        await this.refreshLinks();
    }

    async refreshLinks() {
        const linksList = document.getElementById('linksList');
        linksList.innerHTML = '<div class="loading">Loading links...</div>';
        
        try {
            const snapshot = await db.collection('notes')
                .where('type', '==', 'link')
                .orderBy('timestamp', 'desc')
                .get();
            
            linksList.innerHTML = '';
            
            if (snapshot.empty) {
                linksList.innerHTML = '<div class="empty-message">No links found. Click "NEW LINK" to add one.</div>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const linkBox = document.createElement('div');
                linkBox.className = 'stored-item link-item';
                linkBox.innerHTML = `
                    <div class="item-header">
                        <div class="item-title">
                            <i class="fas fa-link"></i>
                            ${data.title}
                        </div>
                        <div class="item-date">
                            <i class="fas fa-clock"></i>
                            ${new Date(data.timestamp?.toDate()).toLocaleString()}
                        </div>
                    </div>
                    <div class="item-content">
                        <div class="link-url">
                            <a href="${data.url}" target="_blank" class="link-preview">
                                <i class="fas fa-external-link-alt"></i>
                                ${data.url}
                            </a>
                        </div>
                        ${data.description ? `<div class="link-description">${data.description}</div>` : ''}
                    </div>
                    <div class="item-actions">
                        <a href="${data.url}" target="_blank" class="note-btn visit">
                            <i class="fas fa-external-link-alt"></i> VISIT
                        </a>
                        <button class="note-btn edit">
                            <i class="fas fa-edit"></i> EDIT
                        </button>
                        <button class="note-btn delete">
                            <i class="fas fa-trash"></i> DELETE
                        </button>
                    </div>
                `;

                // Edit butonu
                linkBox.querySelector('.edit').addEventListener('click', () => {
                    this.showLinkModal({...data, id: doc.id});
                });

                // Delete butonu
                linkBox.querySelector('.delete').addEventListener('click', async () => {
                    const confirmed = await this.showConfirmModal('Move this link to trash?');
                    if (confirmed) {
                        await this.deleteLink(doc.id, data);
                    }
                });

                linksList.appendChild(linkBox);
            });
        } catch (error) {
            console.error('Error loading links:', error);
            linksList.innerHTML = '<div class="error-message">Error loading links.</div>';
            this.printLine('Error loading links: ' + error.message, 'error');
        }
    }

    showLinkModal(link = null) {
        const modal = document.getElementById('linkModal');
        const titleInput = document.getElementById('linkTitle');
        const urlInput = document.getElementById('linkUrl');
        const descInput = document.getElementById('linkDescription');
        
        if (link) {
            titleInput.value = link.title;
            urlInput.value = link.url;
            descInput.value = link.description || '';
            modal.dataset.linkId = link.id;
        } else {
            titleInput.value = '';
            urlInput.value = '';
            descInput.value = '';
            delete modal.dataset.linkId;
        }
        
        modal.style.display = 'block';
    }

    hideLinkModal() {
        const modal = document.getElementById('linkModal');
        modal.style.display = 'none';
        delete modal.dataset.linkId;
    }

    async saveLink() {
        const title = document.getElementById('linkTitle').value.trim();
        const url = document.getElementById('linkUrl').value.trim();
        const description = document.getElementById('linkDescription').value.trim();
        const modal = document.getElementById('linkModal');
        
        if (!title || !url) {
            this.printLine('Title and URL are required', 'error');
            return;
        }

        try {
            const linkData = {
                title,
                url,
                description,
                type: 'link',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (modal.dataset.linkId) {
                await db.collection('notes').doc(modal.dataset.linkId).update(linkData);
            } else {
                await db.collection('notes').add(linkData);
            }

            this.hideLinkModal();
            await this.refreshLinks();
            this.printLine('Link saved successfully', 'success');
        } catch (error) {
            console.error('Error saving link:', error);
            this.printLine('Error saving link: ' + error.message, 'error');
        }
    }

    // Geri dönüşüm kutusu yönetimi
    async initializeTrash() {
        // Empty Trash butonu
        document.getElementById('emptyTrashBtn').addEventListener('click', async () => {
            const confirmed = await this.showConfirmModal('Are you sure you want to permanently delete all items in trash?');
            if (confirmed) {
                await this.emptyTrash();
            }
        });

        // Otomatik temizleme için kontrol
        this.checkTrashExpiry();
    }

    // Öğeyi çöp kutusuna taşı
    async moveToTrash(item) {
        try {
            const trashData = {
                ...item,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                originalCollection: 'notes',
                status: 'trash'
            };

            // Çöp kutusuna ekle
            await db.collection('trash').add(trashData);
            
            // Orijinal öğeyi sil
            await db.collection('notes').doc(item.id).delete();
            
            this.printLine(`${item.title || 'Item'} moved to trash`, 'info');
            await this.refreshTrash();
        } catch (error) {
            console.error('Error moving to trash:', error);
            this.printLine(`Error moving to trash: ${error.message}`, 'error');
        }
    }

    // Çöp kutusunu yenile
    async refreshTrash() {
        const trashList = document.getElementById('trashList');
        trashList.innerHTML = '<div class="loading">Loading trash items...</div>';
        
        try {
            const snapshot = await db.collection('trash')
                .orderBy('deletedAt', 'desc')
                .get();
            
            trashList.innerHTML = '';
            
            if (snapshot.empty) {
                trashList.innerHTML = '<div class="empty-message">Trash is empty</div>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const daysLeft = this.calculateDaysLeft(data.deletedAt?.toDate());
                
                const itemBox = document.createElement('div');
                itemBox.className = 'stored-item trash-item';
                itemBox.innerHTML = `
                    <div class="item-header">
                        <div class="item-title">
                            <i class="fas ${this.getItemIcon(data.type)}"></i>
                            ${data.title || 'Untitled'}
                            <span class="item-type">[${data.type.toUpperCase()}]</span>
                        </div>
                        <div class="item-date">
                            <i class="fas fa-clock"></i>
                            Deleted: ${new Date(data.deletedAt?.toDate()).toLocaleString()}
                            <span class="days-left">(${daysLeft} days left)</span>
                        </div>
                    </div>
                    <div class="item-content">
                        ${this.getItemPreview(data)}
                    </div>
                    <div class="item-actions">
                        <button class="note-btn restore">
                            <i class="fas fa-undo"></i> RESTORE
                        </button>
                        <button class="note-btn delete">
                            <i class="fas fa-trash"></i> DELETE PERMANENTLY
                        </button>
                    </div>
                `;

                // Restore butonu
                itemBox.querySelector('.restore').addEventListener('click', async () => {
                    await this.restoreFromTrash(doc.id, data);
                });

                // Delete butonu
                itemBox.querySelector('.delete').addEventListener('click', async () => {
                    const confirmed = await this.showConfirmModal('This item will be permanently deleted. Continue?');
                    if (confirmed) {
                        await this.permanentlyDelete(doc.id, data);
                    }
                });

                trashList.appendChild(itemBox);
            });
        } catch (error) {
            console.error('Error loading trash:', error);
            trashList.innerHTML = '<div class="error-message">Error loading trash items.</div>';
        }
    }

    // Çöp kutusundan geri yükle
    async restoreFromTrash(trashId, data) {
        try {
            // Orijinal koleksiyona geri yükle
            const { status, deletedAt, originalCollection, ...restoreData } = data;
            await db.collection(originalCollection).add(restoreData);
            
            // Çöp kutusundan sil
            await db.collection('trash').doc(trashId).delete();
            
            this.printLine(`${data.title} restored successfully`, 'success');
            await this.refreshTrash();
            
            // İlgili listeyi güncelle
            if (data.type === 'note') await this.refreshNotes();
            else if (data.type === 'file') await this.refreshFiles();
            else if (data.type === 'link') await this.refreshLinks();
        } catch (error) {
            console.error('Error restoring item:', error);
            this.printLine(`Error restoring item: ${error.message}`, 'error');
        }
    }

    // Kalıcı olarak sil
    async permanentlyDelete(trashId, data) {
        try {
            // Dosya ise storage'dan da sil
            if (data.type === 'file' && data.url) {
                try {
                    const urlParts = data.url.split('/');
                    const fileName = urlParts[urlParts.length - 1].split('?')[0];
                    const storageRef = storage.ref();
                    const fileRef = storageRef.child(`files/${fileName}`);
                    await fileRef.delete();
                } catch (storageError) {
                    console.error('Storage deletion error:', storageError);
                }
            }

            // Firestore'dan sil
            await db.collection('trash').doc(trashId).delete();
            
            this.printLine(`${data.title} permanently deleted`, 'success');
            await this.refreshTrash();
        } catch (error) {
            console.error('Error deleting item:', error);
            this.printLine(`Error deleting item: ${error.message}`, 'error');
        }
    }

    // Çöp kutusunu boşalt
    async emptyTrash() {
        try {
            const snapshot = await db.collection('trash').get();
            
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            this.printLine('Trash emptied successfully', 'success');
            await this.refreshTrash();
        } catch (error) {
            console.error('Error emptying trash:', error);
            this.printLine(`Error emptying trash: ${error.message}`, 'error');
        }
    }

    // 30 günlük süreyi kontrol et
    async checkTrashExpiry() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const snapshot = await db.collection('trash')
                .where('deletedAt', '<=', thirtyDaysAgo)
                .get();
            
            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                this.printLine(`${snapshot.size} expired items removed from trash`, 'info');
            }
        } catch (error) {
            console.error('Error checking trash expiry:', error);
        }
    }

    // Kalan günleri hesapla
    calculateDaysLeft(deletedDate) {
        if (!deletedDate) return 30;
        
        const now = new Date();
        const expiryDate = new Date(deletedDate);
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysLeft);
    }

    // Öğe tipine göre ikon belirle
    getItemIcon(type) {
        switch (type) {
            case 'note': return 'fa-sticky-note';
            case 'file': return 'fa-file';
            case 'link': return 'fa-link';
            default: return 'fa-file';
        }
    }

    // Öğe önizlemesi oluştur
    getItemPreview(data) {
        switch (data.type) {
            case 'note':
                return `<div class="note-preview">${data.content}</div>`;
            case 'file':
                return `
                    <div class="file-info">
                        <span class="file-size">Size: ${this.formatFileSize(data.size)}</span>
                        <span class="file-type">Type: ${data.mimeType || 'Unknown'}</span>
                    </div>
                `;
            case 'link':
                return `
                    <div class="link-url">
                        <a href="${data.url}" target="_blank" class="link-preview">
                            <i class="fas fa-external-link-alt"></i>
                            ${data.url}
                        </a>
                    </div>
                    ${data.description ? `<div class="link-description">${data.description}</div>` : ''}
                `;
            default:
                return '';
        }
    }

    // Not silme fonksiyonunu güncelle
    async deleteNote(noteId, noteData) {
        try {
            // Önce çöp kutusuna taşı
            await this.moveToTrash({
                ...noteData,
                id: noteId,
                type: 'note'
            });

            // Başarı mesajı
            this.printLine('Note moved to trash', 'success');
            
            // Notları yenile
            await this.refreshNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            this.printLine(`Error deleting note: ${error.message}`, 'error');
        }
    }

    // Link silme fonksiyonunu güncelle
    async deleteLink(linkId, linkData) {
        try {
            // Önce çöp kutusuna taşı
            await this.moveToTrash({
                ...linkData,
                id: linkId,
                type: 'link'
            });

            // Başarı mesajı
            this.printLine('Link moved to trash', 'success');
            
            // Linkleri yenile
            await this.refreshLinks();
        } catch (error) {
            console.error('Error deleting link:', error);
            this.printLine(`Error deleting link: ${error.message}`, 'error');
        }
    }

    // Dosya silme fonksiyonunu güncelle
    async deleteFile(fileId, fileData) {
        try {
            // Önce çöp kutusuna taşı
            await this.moveToTrash({
                ...fileData,
                id: fileId,
                type: 'file'
            });

            // Başarı mesajı
            this.printLine('File moved to trash', 'success');
            
            // Dosyaları yenile
            await this.refreshFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            this.printLine(`Error deleting file: ${error.message}`, 'error');
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