document.addEventListener('DOMContentLoaded', function() {
    // Matrix efektini başlat
    initMatrix();
    
    // Enter tuşuna basıldığında giriş kontrolü
    document.getElementById('accessCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAccess();
        }
    });
});

// Matrix yağmur efekti
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

// Giriş kontrolü
function checkAccess() {
    const accessCode = document.getElementById('accessCode').value;
    const accessMessage = document.getElementById('accessMessage');
    
    if (accessCode === '112263') {
        accessMessage.style.color = '#0F0';
        accessMessage.style.textShadow = '0 0 10px #0F0';
        accessMessage.textContent = 'ACCESS GRANTED';
        accessMessage.className = 'granted';
        
        // Login container'a kapanma efekti
        document.querySelector('.login-box').style.animation = 'powerOff 1s forwards';
        
        localStorage.setItem('isLoggedIn', 'true');
        
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
    } else {
        accessMessage.style.color = '#F00';
        accessMessage.style.textShadow = '0 0 10px #F00';
        accessMessage.textContent = 'ACCESS DENIED';
        accessMessage.className = 'denied';
        
        // Input alanını salla
        const input = document.getElementById('accessCode');
        input.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
        
        input.value = '';
    }
}

// Rastgele glitch efekti
function addRandomGlitch() {
    const elements = document.querySelectorAll('.ascii-art, .typing-text, .access-text');
    
    setInterval(() => {
        const randomElement = elements[Math.floor(Math.random() * elements.length)];
        randomElement.style.animation = 'none';
        setTimeout(() => {
            randomElement.style.animation = '';
        }, 50);
    }, 3000);
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    initMatrix();
    addRandomGlitch();
    
    // Input focus efekti
    const input = document.getElementById('accessCode');
    input.addEventListener('focus', () => {
        document.querySelector('.login-box').style.boxShadow = '0 0 30px var(--matrix-green)';
    });
    
    input.addEventListener('blur', () => {
        document.querySelector('.login-box').style.boxShadow = 'var(--matrix-glow)';
    });
    
    // Enter tuşu kontrolü
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAccess();
        }
    });
}); 