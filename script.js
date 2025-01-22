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
        // Tüm formları ve menüleri sıfırla
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

// Şifre kontrolü
function checkPassword() {
    const password = document.getElementById('adminPassword').value;
    if (password === '1234') { // Örnek şifre
        document.getElementById('passwordSection').style.display = 'none';
        document.getElementById('addSection').style.display = 'block';
        showNotification('Giriş başarılı', 'success');
        updateDashboardStats();
    } else {
        showNotification('Hatalı şifre!', 'error');
    }
}

// Dashboard bölüm kontrolü
function showDashboardSection(section) {
    // Tüm bölümleri gizle
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    
    // Seçilen bölümü göster
    const selectedSection = document.getElementById(section);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Nav itemlerini güncelle
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });
    const activeNav = document.querySelector(`.nav-item[onclick*="${section}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
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
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
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
    document.getElementById(`${type}Modal`).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function submitLink(e) {
    e.preventDefault();
    const title = document.getElementById('linkTitle').value;
    const url = document.getElementById('linkUrl').value;
    const desc = document.getElementById('linkDesc').value;

    addLink({
        title,
        url,
        desc,
        icon: 'fas fa-link',
        timestamp: Date.now()
    });

    closeModal('linkModal');
    e.target.reset();
}

function submitFile(e) {
    e.preventDefault();
    const title = document.getElementById('fileName').value;
    const file = document.getElementById('fileInput').files[0];
    const desc = document.getElementById('fileDesc').value;

    addFile({
        title,
        file,
        desc,
        icon: 'fas fa-file',
        timestamp: Date.now()
    });

    closeModal('fileModal');
    e.target.reset();
}

function submitNote(e) {
    e.preventDefault();
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    addNote({
        title,
        content,
        icon: 'fas fa-sticky-note',
        timestamp: Date.now()
    });

    closeModal('noteModal');
    e.target.reset();
}

// Liste güncelleme fonksiyonları
function updateLinkList() {
    const linkList = document.getElementById('linkList');
    linkList.innerHTML = data.links.map(link => `
        <div class="item-card">
            <div class="item-icon">
                <i class="${link.icon}"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${link.title}</div>
                <div class="item-desc">${link.desc || ''}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn" onclick="window.open('${link.url}', '_blank')">
                    <i class="fas fa-external-link-alt"></i>
                </button>
                <button class="item-btn delete" onclick="removeLink('${link.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = data.files.map(file => `
        <div class="item-card">
            <div class="item-icon">
                <i class="${file.icon}"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${file.title}</div>
                <div class="item-desc">${file.desc || ''}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn" onclick="downloadFile('${file.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="item-btn delete" onclick="removeFile('${file.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateNoteList() {
    const noteList = document.getElementById('noteList');
    noteList.innerHTML = data.notes.map(note => `
        <div class="item-card">
            <div class="item-icon">
                <i class="${note.icon}"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${note.title}</div>
                <div class="item-desc">${note.content}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn" onclick="editNote('${note.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="item-btn delete" onclick="removeNote('${note.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
} 