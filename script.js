// Matrix Arka Plan
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

    ctx.fillStyle = '#0f0';
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

// Yazı Efekti
const texts = [
    "Web Developer",
    "UI/UX Designer",
    "Full Stack Developer",
    "Software Engineer"
];
let textIndex = 0;
let charIndex = 0;

function typeText() {
    const typingText = document.querySelector('.typing-text');
    const currentText = texts[textIndex];

    if (charIndex < currentText.length) {
        typingText.textContent += currentText.charAt(charIndex);
        charIndex++;
        setTimeout(typeText, 100);
    } else {
        setTimeout(eraseText, 2000);
    }
}

function eraseText() {
    const typingText = document.querySelector('.typing-text');
    const text = typingText.textContent;

    if (text.length > 0) {
        typingText.textContent = text.slice(0, -1);
        setTimeout(eraseText, 50);
    } else {
        textIndex = (textIndex + 1) % texts.length;
        charIndex = 0;
        setTimeout(typeText, 500);
    }
}

// Scroll Efekti
function checkCards() {
    const cards = document.querySelectorAll('.matrix-card');
    const triggerBottom = window.innerHeight * 0.8;

    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        if (cardTop < triggerBottom) {
            card.classList.add('visible');
        }
    });
}

// Veri yapısını tanımlayalım
const data = {
    links: [],
    files: [],
    notes: []
};

// Veri ekleme fonksiyonları
function addLink(icon, text, url) {
    data.links.push({
        id: Date.now(),
        icon: icon || 'fas fa-link',
        text: text,
        url: url,
        timestamp: Date.now()
    });
    updateDashboardStats();
    updateLists();
}

function addFile(icon, text, url) {
    data.files.push({
        id: Date.now(),
        icon: icon || 'fas fa-file',
        text: text,
        url: url,
        timestamp: Date.now()
    });
    updateDashboardStats();
    updateLists();
}

function addNote(text, icon) {
    data.notes.push({
        id: Date.now(),
        icon: icon || 'fas fa-sticky-note',
        text: text,
        timestamp: Date.now()
    });
    updateDashboardStats();
    updateLists();
}

// Öğe Silme Fonksiyonları
function removeLink(index) {
    showConfirm('Bu linki silmek istediğinize emin misiniz?', () => {
        data.links.splice(index, 1);
        updateLists();
        showNotification('Link başarıyla silindi');
    });
}

function removeFile(index) {
    showConfirm('Bu dosyayı silmek istediğinize emin misiniz?', () => {
        data.files.splice(index, 1);
        updateLists();
        showNotification('Dosya başarıyla silindi');
    });
}

function removeNote(index) {
    showConfirm('Bu notu silmek istediğinize emin misiniz?', () => {
        data.notes.splice(index, 1);
        updateLists();
        showNotification('Not başarıyla silindi');
    });
}

// Liste güncelleme
function updateLists() {
    const linkList = document.querySelector('.link-list');
    if (linkList) {
        linkList.innerHTML = data.links.map((link, index) => `
            <li>
                <a href="${link.url}" target="_blank">
                    <i class="${link.icon}"></i> ${link.text}
                </a>
                <button onclick="removeLink(${index})" class="delete-btn">
                    <i class="fas fa-times"></i>
                </button>
            </li>
        `).join('');
    }

    const fileList = document.querySelector('.file-list');
    if (fileList) {
        fileList.innerHTML = data.files.map((file, index) => `
            <li>
                <a href="${file.url}" target="_blank">
                    <i class="${file.icon}"></i> ${file.text}
                </a>
                <button onclick="removeFile(${index})" class="delete-btn">
                    <i class="fas fa-times"></i>
                </button>
            </li>
        `).join('');
    }

    const noteList = document.querySelector('.note-list');
    if (noteList) {
        noteList.innerHTML = data.notes.map((note, index) => `
            <li>
                <i class="${note.icon}"></i> ${note.text}
                <button onclick="removeNote(${index})" class="delete-btn">
                    <i class="fas fa-times"></i>
                </button>
            </li>
        `).join('');
    }

    updateDashboardStats();
}

// Admin panel kontrolü
function toggleAdmin(show) {
    const adminPanel = document.getElementById('adminPanel');
    if (show) {
        adminPanel.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        adminPanel.style.display = 'none';
        document.body.style.overflow = '';
        resetAllForms();
    }
}

// Form ve menü sıfırlama
function resetAllForms() {
    document.getElementById('addSection').style.display = 'none';
    document.getElementById('passwordSection').style.display = 'block';
    document.getElementById('adminPassword').value = '';
    
    // Açık olan tüm menüleri kapat
    const menus = document.querySelectorAll('.quick-add-menu, .notification-panel');
    menus.forEach(menu => menu.remove());
}

// Şifre kontrolü ve operatör konsolu geçişi
function verifyAccess() {
    const code = document.getElementById('accessCode').value;
    const output = document.querySelector('.terminal-output');
    
    if (code === '112263') {
        typeWriterEffect(output, '\n> ACCESS GRANTED\n> INITIALIZING OPERATOR CONSOLE...', 50)
            .then(() => {
                setTimeout(() => {
                    hideLogin();
                    showOperatorConsole();
                }, 1500);
            });
    } else {
        typeWriterEffect(output, '\n> ACCESS DENIED\n> SECURITY ALERT TRIGGERED', 50);
        shakeEffect(document.querySelector('.terminal-window'));
        setTimeout(() => {
            document.getElementById('accessCode').value = '';
        }, 500);
    }
}

// Operatör konsolu gösterme
function showOperatorConsole() {
    const mainPanel = document.getElementById('mainPanel');
    mainPanel.style.display = 'block';
    mainPanel.classList.add('fade-in');
    
    // Giriş panelini gizle
    document.getElementById('loginPanel').style.display = 'none';
    
    // Matrix başlığını gizle
    document.querySelector('header').style.display = 'none';
    
    // İstatistikleri yükle
    loadItems();
}

// Login panelini gizle
function hideLogin() {
    const loginPanel = document.getElementById('loginPanel');
    loginPanel.classList.add('fade-out');
    setTimeout(() => {
        loginPanel.style.display = 'none';
        loginPanel.classList.remove('fade-out');
    }, 500);
}

// Typewriter efekti
function typeWriterEffect(element, text, speed) {
    return new Promise(resolve => {
        let i = 0;
        element.innerHTML += '\n';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                element.scrollTop = element.scrollHeight;
                i++;
            } else {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
}

// Shake efekti
function shakeEffect(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
}

// Dashboard bölüm kontrolü
function showDashboardSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

// Çıkış fonksiyonları
function logout() {
    document.getElementById('logoutConfirm').style.display = 'flex';
}

function closeLogoutConfirm() {
    document.getElementById('logoutConfirm').style.display = 'none';
}

function confirmLogout() {
    // Çıkış işlemleri
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('logoutConfirm').style.display = 'none';
    document.getElementById('passwordSection').style.display = 'flex';
    document.getElementById('addSection').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    
    // Ana sayfaya dön
    document.querySelector('.admin-btn').style.display = 'flex';
    
    // İstatistikleri sıfırla
    resetStats();
}

function resetStats() {
    document.getElementById('linkCount').textContent = '0';
    document.getElementById('fileCount').textContent = '0';
    document.getElementById('noteCount').textContent = '0';
    document.getElementById('totalActions').textContent = '0';
    // Diğer istatistikleri sıfırla
}

// Onay dialogu
function showConfirm(message, callback) {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
        <div class="confirm-content">
            <p>${message}</p>
            <div class="confirm-buttons">
                <button onclick="handleConfirm(true)" class="confirm-btn">
                    <i class="fas fa-check"></i> Evet
                </button>
                <button onclick="handleConfirm(false)" class="confirm-btn cancel">
                    <i class="fas fa-times"></i> Hayır
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmDialog);

    // Global callback'i sakla
    window.confirmCallback = callback;
}

// Onay işlemi
function handleConfirm(confirmed) {
    const dialog = document.querySelector('.confirm-dialog');
    if (confirmed && window.confirmCallback) {
        window.confirmCallback();
    }
    dialog.remove();
    delete window.confirmCallback;
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

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Matrix animasyonunu başlat
    setInterval(drawMatrix, 33);
    
    // Event listener'ları ekle
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleChartView(btn.getAttribute('data-type'));
        });
    });
    
    // İlk istatistikleri göster
    updateStats('weekly');
    
    // Dashboard istatistiklerini güncelle
    updateDashboardStats();
});

// Tema değiştirme
function toggleTheme() {
    const btn = document.querySelector('.theme-toggle i');
    const isDark = btn.classList.contains('fa-moon');
    
    if (isDark) {
        btn.classList.replace('fa-moon', 'fa-sun');
        document.documentElement.style.setProperty('--bg-color', '#001800');
        document.documentElement.style.setProperty('--card-bg', 'rgba(0, 40, 0, 0.8)');
    } else {
        btn.classList.replace('fa-sun', 'fa-moon');
        document.documentElement.style.setProperty('--bg-color', '#000000');
        document.documentElement.style.setProperty('--card-bg', 'rgba(0, 20, 0, 0.8)');
    }
}

// Bildirimler
function toggleNotifications() {
    // Bildirim panelini oluştur
    let notifPanel = document.getElementById('notificationPanel');
    if (!notifPanel) {
        notifPanel = document.createElement('div');
        notifPanel.id = 'notificationPanel';
        notifPanel.className = 'notification-panel';
        notifPanel.innerHTML = `
            <div class="notification-header">
                <h3>Bildirimler</h3>
                <button onclick="clearNotifications()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="notification-list">
                <div class="notification-item">
                    <i class="fas fa-info-circle"></i>
                    <div class="notification-content">
                        <p>Sistem güncellemesi yapıldı</p>
                        <span>2 saat önce</span>
                    </div>
                </div>
                <!-- Diğer bildirimler -->
            </div>
        `;
        document.querySelector('.header-right').appendChild(notifPanel);
    } else {
        notifPanel.remove();
    }
}

// Hızlı Ekleme Menüsü
function showQuickAdd() {
    const quickAddMenu = document.createElement('div');
    quickAddMenu.className = 'quick-add-menu';
    quickAddMenu.innerHTML = `
        <div class="quick-add-header">
            <h3>Hızlı Ekle</h3>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="quick-add-options">
            <button onclick="showAddMenu('link')">
                <i class="fas fa-link"></i>
                Link Ekle
            </button>
            <button onclick="showAddMenu('file')">
                <i class="fas fa-file"></i>
                Dosya Ekle
            </button>
            <button onclick="showAddMenu('note')">
                <i class="fas fa-sticky-note"></i>
                Not Ekle
            </button>
        </div>
    `;
    document.querySelector('.dashboard-main').appendChild(quickAddMenu);
}

// Arama fonksiyonu
function searchItems(query) {
    const searchResults = document.getElementById('searchResults');
    if (!query) {
        searchResults.style.display = 'none';
        return;
    }

    // Tüm öğeleri birleştir ve ara
    const allItems = [
        ...data.links.map(item => ({...item, type: 'link'})),
        ...data.files.map(item => ({...item, type: 'file'})),
        ...data.notes.map(item => ({...item, type: 'note'}))
    ];

    const results = allItems.filter(item => 
        item.text.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length > 0) {
        searchResults.innerHTML = results.map(item => `
            <div class="search-item" onclick="showDashboardSection('${item.type}s')">
                <i class="${item.icon}"></i>
                <span>${item.text}</span>
                <small>${item.type}</small>
            </div>
        `).join('');
        searchResults.style.display = 'block';
    } else {
        searchResults.innerHTML = '<div class="no-results">Sonuç bulunamadı</div>';
        searchResults.style.display = 'block';
    }
}

// İstatistik görünümünü değiştirme
function toggleChartView(type) {
    const buttons = document.querySelectorAll('.chart-type-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });
    
    // İstatistikleri güncelle
    updateStats(type);
}

// İstatistikleri güncelle
function updateStats(type) {
    const chartContainer = document.getElementById('statsChart');
    // Örnek veri
    const data = type === 'weekly' ? 
        [12, 19, 15, 8, 22, 14, 10] : 
        [45, 52, 38, 41, 35, 27, 58, 49, 60, 51, 42, 37];
    
    // Grafik güncelleme animasyonu
    chartContainer.style.opacity = '0';
    setTimeout(() => {
        chartContainer.innerHTML = `
            <div class="chart-wrapper">
                ${data.map(value => `
                    <div class="chart-bar" style="height: ${value * 2}px">
                        <span class="chart-value">${value}</span>
                    </div>
                `).join('')}
            </div>
            <div class="chart-labels">
                ${type === 'weekly' ? 
                    ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => 
                        `<span>${day}</span>`
                    ).join('') : 
                    ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'].map(month => 
                        `<span>${month}</span>`
                    ).join('')
                }
            </div>
        `;
        chartContainer.style.opacity = '1';
    }, 300);
}

// Aktiviteleri yenile
function refreshActivities() {
    const timeline = document.getElementById('activityTimeline');
    const refreshBtn = document.querySelector('.refresh-btn i');
    
    refreshBtn.classList.add('fa-spin');
    setTimeout(() => {
        updateActivityTimeline();
        refreshBtn.classList.remove('fa-spin');
    }, 1000);
}

// Aktivite zaman çizelgesini güncelle
function updateActivityTimeline() {
    const timeline = document.getElementById('activityTimeline');
    const activities = [
        ...data.links.map(item => ({
            type: 'link',
            text: `Yeni link eklendi: ${item.text}`,
            timestamp: item.timestamp
        })),
        ...data.files.map(item => ({
            type: 'file',
            text: `Yeni dosya eklendi: ${item.text}`,
            timestamp: item.timestamp
        })),
        ...data.notes.map(item => ({
            type: 'note',
            text: `Yeni not eklendi: ${item.text}`,
            timestamp: item.timestamp
        }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    timeline.innerHTML = activities.map(activity => `
        <div class="timeline-item">
            <div class="timeline-icon">
                <i class="fas fa-${activity.type === 'link' ? 'link' : activity.type === 'file' ? 'file' : 'sticky-note'}"></i>
            </div>
            <div class="timeline-content">
                <p>${activity.text}</p>
                <span>${new Date(activity.timestamp).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

// Dashboard fonksiyonları
function updateDashboardStats() {
    document.getElementById('linkCount').textContent = data.links.length;
    document.getElementById('fileCount').textContent = data.files.length;
    document.getElementById('noteCount').textContent = data.notes.length;
    updateRecentItems();
}

function updateRecentItems() {
    const recentItems = document.getElementById('recentItems');
    const allItems = [
        ...data.links.map(item => ({...item, type: 'link'})),
        ...data.files.map(item => ({...item, type: 'file'})),
        ...data.notes.map(item => ({...item, type: 'note'}))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    recentItems.innerHTML = allItems.map(item => `
        <div class="recent-item">
            <div class="recent-item-info">
                <i class="${item.icon}"></i>
                <span>${item.text}</span>
            </div>
            <button class="delete-btn" onclick="removeItem('${item.type}', ${item.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Form işlemleri
function showAddForm(type) {
    const modalId = type + 'Modal';
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function submitLink(event) {
    event.preventDefault();
    const title = document.getElementById('linkTitle').value;
    const url = document.getElementById('linkUrl').value;
    const desc = document.getElementById('linkDesc').value;

    const linkElement = document.createElement('div');
    linkElement.className = 'item-card';
    linkElement.innerHTML = `
        <div class="item-icon"><i class="fas fa-link"></i></div>
        <div class="item-info">
            <h3>${title}</h3>
            <p>${desc}</p>
            <a href="${url}" target="_blank">${url}</a>
        </div>
        <div class="item-actions">
            <button onclick="deleteItem(this)" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    document.getElementById('linkList').appendChild(linkElement);
    closeModal('linkModal');
    updateItemCount();
}

function submitFile(event) {
    event.preventDefault();
    const fileName = document.getElementById('fileName').value;
    const fileDesc = document.getElementById('fileDesc').value;
    const fileInput = document.getElementById('fileInput');

    const fileElement = document.createElement('div');
    fileElement.className = 'item-card';
    fileElement.innerHTML = `
        <div class="item-icon"><i class="fas fa-file"></i></div>
        <div class="item-info">
            <h3>${fileName}</h3>
            <p>${fileDesc}</p>
            <span class="file-name">${fileInput.files[0].name}</span>
        </div>
        <div class="item-actions">
            <button onclick="deleteItem(this)" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    document.getElementById('fileList').appendChild(fileElement);
    closeModal('fileModal');
    updateItemCount();
}

function submitNote(event) {
    event.preventDefault();
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    const noteElement = document.createElement('div');
    noteElement.className = 'item-card';
    noteElement.innerHTML = `
        <div class="item-icon"><i class="fas fa-sticky-note"></i></div>
        <div class="item-info">
            <h3>${title}</h3>
            <p>${content}</p>
        </div>
        <div class="item-actions">
            <button onclick="deleteItem(this)" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    document.getElementById('noteList').appendChild(noteElement);
    closeModal('noteModal');
    updateItemCount();
}

// Yardımcı fonksiyonlar
function deleteItem(button) {
    button.closest('.item-card').remove();
    updateItemCount();
}

function updateItemCount() {
    const linkCount = document.getElementById('linkList').children.length;
    const fileCount = document.getElementById('fileList').children.length;
    const noteCount = document.getElementById('noteList').children.length;

    document.getElementById('sidebarLinkCount').textContent = linkCount;
    document.getElementById('sidebarFileCount').textContent = fileCount;
    document.getElementById('sidebarNoteCount').textContent = noteCount;
    
    document.getElementById('linkCount').textContent = linkCount;
    document.getElementById('fileCount').textContent = fileCount;
    document.getElementById('noteCount').textContent = noteCount;
}

function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Global değişkenler
let currentSection = 'files';
const ACCESS_CODE = '112263';

// Temel fonksiyonlar
function showLogin() {
    document.getElementById('loginPanel').classList.add('active');
    typeWriterEffect('.terminal-output', 'INITIALIZING SYSTEM...\nVERIFYING SECURITY PROTOCOLS...\nAWAITING AUTHENTICATION...', 50);
}

function hideLogin() {
    document.getElementById('loginPanel').classList.remove('active');
}

function showMainPanel() {
    document.getElementById('mainPanel').classList.add('active');
    loadItems();
}

// Veri yönetimi
function loadItems() {
    // Local storage'dan verileri yükle
    const files = JSON.parse(localStorage.getItem('files')) || [];
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    
    updateGrid('fileGrid', files);
    updateGrid('noteGrid', notes);
    updateCounts();
}

function updateGrid(gridId, items) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = items.map((item, index) => `
        <div class="grid-item" data-id="${index}">
            <div class="item-icon">
                <i class="fas fa-${gridId === 'fileGrid' ? 'file' : 'sticky-note'}"></i>
            </div>
            <div class="item-info">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
            <div class="item-actions">
                <button onclick="viewItem('${gridId}', ${index})">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteItem('${gridId}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Menü tıklamaları
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.dataset.section;
            switchSection(section);
        });
    });
});

function switchSection(section) {
    currentSection = section;
    
    // Aktif menü öğesini güncelle
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Aktif bölümü göster
    document.querySelectorAll('.content-section').forEach(sect => {
        sect.classList.toggle('active', sect.id === `${section}Section`);
    });
}

// Modal işlemleri
function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.getElementById('uploadForm').reset();
}

// Dosya yükleme işlemi
async function handleFileUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName').value;
    const fileDesc = document.getElementById('fileDesc').value;
    const file = fileInput.files[0];
    const progressBar = document.getElementById('uploadProgress');
    const progressElement = progressBar.querySelector('.progress');

    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }

    try {
        progressBar.style.display = 'block';
        
        // Storage referansı oluştur
        const storageRef = storage.ref(`files/${Date.now()}_${file.name}`);
        
        // Dosyayı yükle
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // İlerleme durumunu göster
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressElement.style.width = progress + '%';
            },
            (error) => {
                showNotification('Upload failed: ' + error.message, 'error');
                progressBar.style.display = 'none';
            },
            async () => {
                // Yükleme tamamlandı
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                
                // Firestore'a dosya bilgilerini kaydet
                await db.collection('files').add({
                    name: fileName,
                    description: fileDesc,
                    url: downloadURL,
                    originalName: file.name,
                    size: file.size,
                    type: file.type,
                    uploadDate: firebase.firestore.FieldValue.serverTimestamp()
                });

                showNotification('File uploaded successfully');
                hideModal('uploadModal');
                loadFiles();
                progressBar.style.display = 'none';
            }
        );
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
        progressBar.style.display = 'none';
    }
}

// Dosyaları yükle
async function loadFiles() {
    const filesGrid = document.getElementById('filesGrid');
    filesGrid.innerHTML = '<div class="loading">Loading files...</div>';

    try {
        const snapshot = await db.collection('files')
            .orderBy('uploadDate', 'desc')
            .get();

        if (snapshot.empty) {
            filesGrid.innerHTML = '<div class="no-items">No files found</div>';
            return;
        }

        filesGrid.innerHTML = '';
        snapshot.forEach(doc => {
            const file = doc.data();
            const fileCard = createFileCard(doc.id, file);
            filesGrid.appendChild(fileCard);
        });

        updateCounts();
    } catch (error) {
        filesGrid.innerHTML = '<div class="error">Error loading files</div>';
        console.error('Error loading files:', error);
    }
}

// Dosya kartı oluştur
function createFileCard(id, file) {
    const div = document.createElement('div');
    div.className = 'file-card';
    div.innerHTML = `
        <div class="file-icon">
            <i class="fas ${getFileIcon(file.type)}"></i>
        </div>
        <div class="file-info">
            <h3>${file.name}</h3>
            <p>${file.description || 'No description'}</p>
            <span class="file-meta">
                ${formatFileSize(file.size)} • ${formatDate(file.uploadDate)}
            </span>
        </div>
        <div class="file-actions">
            <button onclick="downloadFile('${file.url}', '${file.originalName}')" class="action-btn">
                <i class="fas fa-download"></i>
            </button>
            <button onclick="deleteFile('${id}')" class="action-btn delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Dosya indirme
function downloadFile(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Dosya silme
async function deleteFile(id) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
        const doc = await db.collection('files').doc(id).get();
        const file = doc.data();

        // Storage'dan dosyayı sil
        const fileRef = storage.refFromURL(file.url);
        await fileRef.delete();

        // Firestore'dan dosya bilgilerini sil
        await db.collection('files').doc(id).delete();

        showNotification('File deleted successfully');
        loadFiles();
    } catch (error) {
        showNotification('Error deleting file: ' + error.message, 'error');
    }
}

// Yardımcı fonksiyonlar
function getFileIcon(type) {
    if (type.includes('image')) return 'fa-image';
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('word')) return 'fa-file-word';
    if (type.includes('excel')) return 'fa-file-excel';
    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString();
}

// View değiştirme fonksiyonu
function switchView(viewName) {
    // Tüm butonların active sınıfını kaldır
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Tıklanan butonu active yap
    event.currentTarget.classList.add('active');
    
    // Tüm görünümleri gizle
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Seçilen görünümü göster
    const selectedView = document.getElementById(`${viewName}View`);
    
    // Önce display'i block yap
    selectedView.style.display = 'block';
    
    // Kısa bir gecikme ile active sınıfını ekle (animasyon için)
    setTimeout(() => {
        selectedView.classList.add('active');
    }, 50);

    // İlgili içeriği yükle
    if (viewName === 'files') {
        loadFiles();
    } else if (viewName === 'notes') {
        loadNotes();
    }
} 