class MatrixEffect {
    constructor() {
        this.canvas = document.getElementById('matrix');
        this.ctx = this.canvas.getContext('2d');
        this.chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789';
        this.fontSize = 16;
        this.drops = [];
        this.glowIntensity = 0;
        this.glowDirection = 1;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initDrops();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.initDrops();
    }

    initDrops() {
        this.drops = Array(this.columns).fill(1);
    }

    draw() {
        // Yarı saydam siyah arkaplan (iz efekti için)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Glow efekti
        this.glowIntensity += 0.01 * this.glowDirection;
        if (this.glowIntensity >= 1) this.glowDirection = -1;
        if (this.glowIntensity <= 0) this.glowDirection = 1;

        for (let i = 0; i < this.drops.length; i++) {
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            // Rastgele parlaklık efekti
            const brightness = Math.random();
            const glow = this.glowIntensity * 0.5;

            if (brightness < 0.1) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + glow})`; // Parlak beyaz
                this.ctx.shadowColor = '#fff';
                this.ctx.shadowBlur = 10;
            } else if (brightness < 0.3) {
                this.ctx.fillStyle = `rgba(170, 255, 170, ${0.6 + glow})`; // Açık yeşil
                this.ctx.shadowColor = '#0f0';
                this.ctx.shadowBlur = 5;
            } else {
                this.ctx.fillStyle = `rgba(0, 255, 0, ${0.4 + glow})`; // Normal yeşil
                this.ctx.shadowColor = 'none';
                this.ctx.shadowBlur = 0;
            }

            this.ctx.font = `${this.fontSize}px monospace`;
            this.ctx.fillText(char, x, y);

            // Yağmur damlası sıfırlama
            if (y > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }

        requestAnimationFrame(() => this.draw());
    }

    start() {
        this.draw();
    }

    speedUp() {
        this.fontSize = 20;
        this.drops = this.drops.map(() => Math.random() * this.canvas.height / this.fontSize);
    }
}

// Matrix efektini başlat
const matrix = new MatrixEffect();
matrix.start(); 