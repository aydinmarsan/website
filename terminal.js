class Terminal {
    constructor() {
        this.output = document.getElementById('output');
        this.input = document.getElementById('terminalInput');
        this.commands = {
            'help': this.showHelp.bind(this),
            'clear': this.clear.bind(this),
            'note': this.handleNote.bind(this),
            'upload': this.showUploadArea.bind(this),
            'list': this.listItems.bind(this),
            'exit': this.exit.bind(this)
        };
        
        this.initializeTerminal();
        this.initializeFileUpload();
    }

    initializeTerminal() {
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim().toLowerCase();
                this.executeCommand(command);
                this.input.value = '';
            }
        });

        this.printLine('MATRIX TERMINAL v3.0 [Type "help" for commands]', 'success');
        this.printLine('=====================================', 'success');
    }

    executeCommand(command) {
        this.printLine(`> ${command}`);
        
        const [cmd, ...args] = command.split(' ');
        
        if (this.commands[cmd]) {
            this.commands[cmd](args);
        } else {
            this.printLine(`Command not found: ${cmd}`, 'error');
        }
    }

    printLine(text, className = '') {
        const line = document.createElement('div');
        line.className = `output-line ${className}`;
        line.textContent = text;
        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    }

    showHelp() {
        const commands = [
            'Available commands:',
            '----------------',
            'help    - Show this help message',
            'clear   - Clear terminal',
            'note    - Create a new note (usage: note <title> <content>)',
            'upload  - Upload files',
            'list    - List all notes and files',
            'exit    - Exit terminal'
        ];
        
        commands.forEach(cmd => this.printLine(cmd));
    }

    clear() {
        this.output.innerHTML = '';
    }

    async handleNote(args) {
        if (args.length < 2) {
            this.printLine('Usage: note <title> <content>', 'error');
            return;
        }

        const title = args[0];
        const content = args.slice(1).join(' ');

        try {
            await db.collection('notes').add({
                title,
                content,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'note'
            });

            this.printLine('Note saved successfully', 'success');
        } catch (error) {
            this.printLine(`Error saving note: ${error.message}`, 'error');
        }
    }

    initializeFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const progressDiv = document.getElementById('uploadProgress');

        // Drag & Drop olayları
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // Normal dosya seçimi
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Upload alanını kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadArea();
            }
        });

        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea) {
                this.closeUploadArea();
            }
        });
    }

    closeUploadArea() {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.style.display = 'none';
        document.getElementById('fileInput').value = '';
        document.getElementById('uploadProgress').innerHTML = '';
    }

    async handleFiles(files) {
        if (!files.length) return;

        const progressDiv = document.getElementById('uploadProgress');
        progressDiv.innerHTML = '';

        for (let file of files) {
            const progressBar = this.createProgressBar(file.name);
            progressDiv.appendChild(progressBar);

            try {
                // Firebase Storage referansı
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`files/${Date.now()}_${file.name}`);

                // Yükleme görevi
                const uploadTask = fileRef.put(file);

                // Yükleme durumunu izle
                uploadTask.on('state_changed', 
                    // İlerleme
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        progressBar.querySelector('.progress-bar').style.width = progress + '%';
                        progressBar.querySelector('.progress-text').textContent = 
                            `${file.name}: ${Math.round(progress)}%`;
                    },
                    // Hata
                    (error) => {
                        this.printLine(`Error uploading ${file.name}: ${error.message}`, 'error');
                        progressBar.classList.add('error');
                    },
                    // Tamamlandı
                    async () => {
                        const downloadURL = await fileRef.getDownloadURL();
                        
                        // Firestore'a dosya bilgilerini kaydet
                        await db.collection('notes').add({
                            title: file.name,
                            type: 'file',
                            url: downloadURL,
                            size: file.size,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        progressBar.classList.add('success');
                        this.printLine(`File uploaded successfully: ${file.name}`, 'success');
                    }
                );
            } catch (error) {
                this.printLine(`Error handling ${file.name}: ${error.message}`, 'error');
            }
        }
    }

    createProgressBar(fileName) {
        const div = document.createElement('div');
        div.className = 'progress-item';
        div.innerHTML = `
            <div class="progress-text">${fileName}: 0%</div>
            <div class="progress-bar" style="width: 0%"></div>
        `;
        return div;
    }

    showUploadArea() {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.style.display = 'flex';
        this.printLine('Upload area opened. Drop files or click to select.', 'success');
    }

    async listItems() {
        try {
            const snapshot = await db.collection('notes').orderBy('timestamp', 'desc').get();
            
            if (snapshot.empty) {
                this.printLine('No items found.', 'error');
                return;
            }

            this.printLine('Items List:', 'success');
            this.printLine('------------');
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'file') {
                    const size = this.formatFileSize(data.size);
                    this.printLine(`[FILE] ${data.title} (${size}) - ${new Date(data.timestamp?.toDate()).toLocaleString()}`);
                } else {
                    this.printLine(`[NOTE] ${data.title} - ${new Date(data.timestamp?.toDate()).toLocaleString()}`);
                }
            });
        } catch (error) {
            this.printLine(`Error listing items: ${error.message}`, 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    exit() {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

// Terminal'i başlat
document.addEventListener('DOMContentLoaded', () => {
    const terminal = new Terminal();
}); 