const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;

const overlay = document.getElementById('overlay');
const scoreEl = document.getElementById('score');
const hiscoreEl = document.getElementById('hiscore');
const livesEl = document.getElementById('lives');
const titleEl = overlay.querySelector('h1');
const msgEl = overlay.querySelector('p');
const rewardContinueButton = document.getElementById('reward-continue');
const instructionRows = overlay.querySelectorAll('div p');

let gameState = 'title';
let score = 0;
let hiscore = 0;
let lives = 3;
let wave = 1;
let completedRuns = 0;
let platformReady = false;
let startInProgress = false;
let rewardedContinueUsed = false;
let audioEnabled = true;
let pausedByPlatform = false;
let animationFrameId = null;
let pointerActive = false;
let lastPointerShotAt = 0;
let currentLanguage = 'en';
let currentLocaleTag = 'en';

const SAVE_KEY = 'space-retro-save-v1';
const REWARD_CONTINUE_ID = 'continue-one-life-v1';
const INTERSTITIAL_EVERY_N_RUNS = 3;
const TOUCH_FIRE_INTERVAL_MS = 180;
const SCORE_PER_DIFFICULTY_TIER = 500;

const TEXT = {
    en: {
        score: 'SCORE', high: 'HI', life: 'LIFE',
        start: 'PRESS SPACE / TAP TO START',
        move: '<- -> : MOVE', fire: 'SPACE : FIRE', touch: 'TOUCH : DRAG + AUTO FIRE',
        gameOver: 'GAME OVER', restart: 'PRESS SPACE / TAP TO RESTART',
        watchAd: 'WATCH AD TO CONTINUE', loadingAd: 'LOADING AD...'
    },
    ja: {
        score: 'スコア', high: '最高', life: '残機',
        start: 'SPACE / タップで開始',
        move: '<- -> : 移動', fire: 'SPACE : 射撃', touch: 'タッチ : ドラッグ + 自動射撃',
        gameOver: 'ゲームオーバー', restart: 'SPACE / タップで再開',
        watchAd: '広告を見て復活', loadingAd: '広告を読み込み中...'
    },
    es: {
        score: 'PUNTOS', high: 'RÉCORD', life: 'VIDAS',
        start: 'ESPACIO / TOCA PARA EMPEZAR',
        move: '<- -> : MOVER', fire: 'ESPACIO : DISPARAR', touch: 'TOQUE : ARRASTRA + AUTO DISPARO',
        gameOver: 'FIN DEL JUEGO', restart: 'ESPACIO / TOCA PARA REINICIAR',
        watchAd: 'VER ANUNCIO Y CONTINUAR', loadingAd: 'CARGANDO ANUNCIO...'
    },
    pt: {
        score: 'PONTOS', high: 'RECORDE', life: 'VIDAS',
        start: 'ESPAÇO / TOQUE PARA COMEÇAR',
        move: '<- -> : MOVER', fire: 'ESPAÇO : ATIRAR', touch: 'TOQUE : ARRASTE + TIRO AUTO',
        gameOver: 'FIM DE JOGO', restart: 'ESPAÇO / TOQUE PARA REINICIAR',
        watchAd: 'VER ANÚNCIO E CONTINUAR', loadingAd: 'CARREGANDO ANÚNCIO...'
    },
    fr: {
        score: 'SCORE', high: 'RECORD', life: 'VIES',
        start: 'ESPACE / TOUCHER POUR JOUER',
        move: '<- -> : BOUGER', fire: 'ESPACE : TIRER', touch: 'TOUCHER : GLISSER + TIR AUTO',
        gameOver: 'PARTIE TERMINÉE', restart: 'ESPACE / TOUCHER POUR REJOUER',
        watchAd: 'VOIR UNE PUB ET CONTINUER', loadingAd: 'CHARGEMENT DE LA PUB...'
    },
    de: {
        score: 'PUNKTE', high: 'BESTE', life: 'LEBEN',
        start: 'LEERTASTE / TIPPEN ZUM START',
        move: '<- -> : BEWEGEN', fire: 'LEERTASTE : FEUER', touch: 'TOUCH : ZIEHEN + AUTO-FEUER',
        gameOver: 'GAME OVER', restart: 'LEERTASTE / TIPPEN FÜR NEUSTART',
        watchAd: 'WERBUNG ANSEHEN & WEITER', loadingAd: 'WERBUNG WIRD GELADEN...'
    },
    it: {
        score: 'PUNTI', high: 'RECORD', life: 'VITE',
        start: 'SPAZIO / TOCCA PER INIZIARE',
        move: '<- -> : MUOVI', fire: 'SPAZIO : SPARA', touch: 'TOCCO : TRASCINA + AUTO FUOCO',
        gameOver: 'FINE PARTITA', restart: 'SPAZIO / TOCCA PER RIPARTIRE',
        watchAd: 'GUARDA PUBBLICITÀ E CONTINUA', loadingAd: 'CARICAMENTO PUBBLICITÀ...'
    },
    ko: {
        score: '점수', high: '최고', life: '목숨',
        start: 'SPACE / 탭하여 시작',
        move: '<- -> : 이동', fire: 'SPACE : 발사', touch: '터치 : 드래그 + 자동 발사',
        gameOver: '게임 오버', restart: 'SPACE / 탭하여 재시작',
        watchAd: '광고 보고 계속하기', loadingAd: '광고 불러오는 중...'
    },
    'zh-Hans': {
        score: '得分', high: '最高', life: '生命',
        start: '空格 / 点击开始',
        move: '<- -> : 移动', fire: '空格 : 射击', touch: '触控 : 拖动 + 自动射击',
        gameOver: '游戏结束', restart: '空格 / 点击重新开始',
        watchAd: '观看广告继续', loadingAd: '正在加载广告...'
    },
    'zh-Hant': {
        score: '得分', high: '最高', life: '生命',
        start: '空白鍵 / 點擊開始',
        move: '<- -> : 移動', fire: '空白鍵 : 射擊', touch: '觸控 : 拖曳 + 自動射擊',
        gameOver: '遊戲結束', restart: '空白鍵 / 點擊重新開始',
        watchAd: '觀看廣告繼續', loadingAd: '正在載入廣告...'
    },
    id: {
        score: 'SKOR', high: 'TERBAIK', life: 'NYAWA',
        start: 'SPASI / KETUK UNTUK MULAI',
        move: '<- -> : GERAK', fire: 'SPASI : TEMBAK', touch: 'SENTUH : GESER + TEMBAK OTOMATIS',
        gameOver: 'GAME OVER', restart: 'SPASI / KETUK UNTUK ULANG',
        watchAd: 'TONTON IKLAN UNTUK LANJUT', loadingAd: 'MEMUAT IKLAN...'
    },
    ru: {
        score: 'СЧЁТ', high: 'РЕКОРД', life: 'ЖИЗНИ',
        start: 'ПРОБЕЛ / КАСАНИЕ — СТАРТ',
        move: '<- -> : ДВИЖЕНИЕ', fire: 'ПРОБЕЛ : ОГОНЬ', touch: 'КАСАНИЕ : ВЕСТИ + АВТООГОНЬ',
        gameOver: 'ИГРА ОКОНЧЕНА', restart: 'ПРОБЕЛ / КАСАНИЕ — СНОВА',
        watchAd: 'РЕКЛАМА И ПРОДОЛЖИТЬ', loadingAd: 'ЗАГРУЗКА РЕКЛАМЫ...'
    }
};

function inPlayablesEnv() {
    return typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV === true;
}

function platformLogWarning() {
    try {
        if (inPlayablesEnv()) ytgame.health.logWarning();
    } catch (_) {}
}

function platformLogError() {
    try {
        if (inPlayablesEnv()) ytgame.health.logError();
    } catch (_) {}
}

function resolveLanguage(localeTag) {
    const normalized = String(localeTag || 'en').toLowerCase();
    if (normalized.startsWith('zh')) {
        return /(?:hant|tw|hk|mo)/.test(normalized) ? 'zh-Hant' : 'zh-Hans';
    }
    const base = normalized.split('-')[0];
    return Object.prototype.hasOwnProperty.call(TEXT, base) ? base : 'en';
}

function t() {
    return TEXT[currentLanguage] || TEXT.en;
}

function applyLanguage() {
    const strings = t();
    document.documentElement.lang = currentLocaleTag || currentLanguage;

    if (scoreEl.parentElement.firstChild) {
        scoreEl.parentElement.firstChild.nodeValue = `${strings.score} `;
    }
    if (hiscoreEl.parentElement.firstChild) {
        hiscoreEl.parentElement.firstChild.nodeValue = `${strings.high} `;
    }
    if (livesEl.parentElement.firstChild) {
        livesEl.parentElement.firstChild.nodeValue = `${strings.life} `;
    }

    if (instructionRows.length >= 3) {
        instructionRows[0].textContent = strings.move;
        instructionRows[1].textContent = strings.fire;
        instructionRows[2].textContent = strings.touch;
    }

    if (gameState === 'title') {
        titleEl.textContent = 'SPACE RETRO';
        msgEl.textContent = strings.start;
    } else if (gameState === 'gameover') {
        titleEl.textContent = strings.gameOver;
        msgEl.textContent = strings.restart;
    }

    if (!rewardContinueButton.disabled) {
        rewardContinueButton.textContent = strings.watchAd;
    }
}

async function loadLanguage() {
    currentLocaleTag = 'en';
    if (inPlayablesEnv()) {
        try {
            currentLocaleTag = await ytgame.system.getLanguage();
        } catch (_) {
            platformLogWarning();
        }
    }
    currentLanguage = resolveLanguage(currentLocaleTag);
    applyLanguage();
}

async function loadProgress() {
    try {
        let raw = '';
        if (inPlayablesEnv()) {
            raw = await ytgame.game.loadData();
        } else {
            raw = localStorage.getItem(SAVE_KEY) || '';
        }
        if (!raw) return;
        const data = JSON.parse(raw);
        if (Number.isInteger(data.hiscore) && data.hiscore >= 0) hiscore = data.hiscore;
        if (Number.isInteger(data.completedRuns) && data.completedRuns >= 0) completedRuns = data.completedRuns;
    } catch (_) {
        platformLogWarning();
    }
}

async function saveProgress() {
    const payload = JSON.stringify({
        version: 1,
        hiscore,
        completedRuns
    });

    try {
        if (inPlayablesEnv()) {
            await ytgame.game.saveData(payload);
        } else {
            localStorage.setItem(SAVE_KEY, payload);
        }
    } catch (_) {
        platformLogWarning();
    }
}

async function saveAndSendBestScore() {
    await saveProgress();
    if (!inPlayablesEnv()) return;
    try {
        await ytgame.engagement.sendScore({ value: hiscore });
    } catch (_) {
        platformLogWarning();
    }
}

function setupPlatformCallbacks() {
    if (!inPlayablesEnv()) return;

    try {
        audioEnabled = ytgame.system.isAudioEnabled();
        ytgame.system.onAudioEnabledChange((enabled) => {
            audioEnabled = enabled;
            if (!audioCtx) return;
            if (!enabled && audioCtx.state === 'running') {
                audioCtx.suspend().catch(() => {});
            } else if (enabled && !pausedByPlatform && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
        });

        ytgame.system.onPause(() => {
            pausedByPlatform = true;
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            if (audioCtx && audioCtx.state === 'running') {
                audioCtx.suspend().catch(() => {});
            }
            saveProgress();
        });

        ytgame.system.onResume(() => {
            pausedByPlatform = false;
            if (audioEnabled && audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            ensureGameLoop();
        });
    } catch (_) {
        platformLogWarning();
    }
}

async function initializePlatform() {
    initStars();
    draw();

    if (inPlayablesEnv()) {
        try {
            ytgame.game.firstFrameReady();
        } catch (_) {
            platformLogError();
        }
    }

    setupPlatformCallbacks();
    await Promise.all([loadLanguage(), loadProgress()]);
    hiscoreEl.textContent = String(hiscore).padStart(4, '0');

    platformReady = true;
    if (inPlayablesEnv()) {
        try {
            ytgame.game.gameReady();
        } catch (_) {
            platformLogError();
        }
    }
    ensureGameLoop();
}

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        if (gameState === 'title' || gameState === 'gameover') {
            startGame();
        } else if (gameState === 'playing') {
            player.shoot();
        }
        e.preventDefault();
    }
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

overlay.addEventListener('pointerdown', (e) => {
    if (e.target === rewardContinueButton) return;
    if (gameState === 'title' || gameState === 'gameover') {
        startGame();
    }
});

function canvasXFromPointer(e) {
    const rect = canvas.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * W;
}

function movePlayerToPointer(e) {
    if (gameState !== 'playing' || !player.w) return;
    const x = canvasXFromPointer(e) - player.w / 2;
    player.x = Math.max(0, Math.min(W - player.w, x));
}

canvas.addEventListener('pointerdown', (e) => {
    if (gameState !== 'playing') return;
    pointerActive = true;
    canvas.setPointerCapture?.(e.pointerId);
    movePlayerToPointer(e);
    player.shoot();
    lastPointerShotAt = performance.now();
    e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
    if (!pointerActive) return;
    movePlayerToPointer(e);
    e.preventDefault();
});

function endPointerControl(e) {
    pointerActive = false;
    if (e?.pointerId !== undefined && canvas.hasPointerCapture?.(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
}

canvas.addEventListener('pointerup', endPointerControl);
canvas.addEventListener('pointercancel', endPointerControl);
canvas.addEventListener('lostpointercapture', () => { pointerActive = false; });

let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioEnabled && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

function playSound(freq, duration, type = 'square', vol = 0.1) {
    if (!audioEnabled || !audioCtx || audioCtx.state !== 'running') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playExplosion() {
    if (!audioEnabled || !audioCtx || audioCtx.state !== 'running') return;
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
}

const PIXEL = 4;

function drawPixelArt(art, x, y, color) {
    ctx.fillStyle = color;
    for (let row = 0; row < art.length; row++) {
        for (let col = 0; col < art[row].length; col++) {
            if (art[row][col] === 1) {
                ctx.fillRect(x + col * PIXEL, y + row * PIXEL, PIXEL, PIXEL);
            }
        }
    }
}

const playerArt = [
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,1,1]
];

const enemyArt1 = [
    [0,1,0,0,0,0,1,0],
    [1,0,1,0,0,1,0,1],
    [1,0,1,1,1,1,0,1],
    [1,1,1,0,0,1,1,1],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1]
];

const enemyArt2 = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,1,1,0,1,0],
    [1,0,0,0,0,0,0,1]
];

let player = {};
let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];
let stars = [];

function initStars() {
    stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            s: Math.random() * 2 + 1
        });
    }
}

function getDifficulty() {
    const tier = Math.floor(score / SCORE_PER_DIFFICULTY_TIER);
    return {
        tier,
        moveIntervalPenalty: tier * 0.8,
        moveStep: 10 + Math.min(10, tier * 0.3),
        dropStep: 15 + Math.min(20, tier * 0.5),
        fireChance: Math.min(0.6, 0.03 + (wave * 0.005) + (tier * 0.004)),
        bulletSpeed: Math.min(12, 4 + (tier * 0.12)),
        volleyCount: 1 + Math.min(2, Math.floor(tier / 30))
    };
}

async function requestInterstitialIfDue() {
    completedRuns++;
    await saveProgress();

    if (!inPlayablesEnv() || completedRuns % INTERSTITIAL_EVERY_N_RUNS !== 0) return;
    try {
        await ytgame.ads.requestInterstitialAd();
    } catch (_) {
        platformLogWarning();
    }
}

async function startGame() {
    if (!platformReady || startInProgress) return;
    startInProgress = true;

    try {
        initAudio();

        if (gameState === 'gameover') {
            await requestInterstitialIfDue();
        }

        score = 0;
        lives = 3;
        wave = 1;
        rewardedContinueUsed = false;
        pointerActive = false;
        player = {
            x: W / 2 - 16,
            y: H - 50,
            w: 32,
            h: 28,
            speed: 4,
            shoot: function() {
                if (gameState !== 'playing') return;
                if (bullets.length < 3) {
                    bullets.push({
                        x: player.x + player.w / 2 - 2,
                        y: player.y,
                        w: 4,
                        h: 10,
                        speed: 7
                    });
                    playSound(800, 0.05, 'square', 0.1);
                }
            }
        };
        bullets = [];
        enemyBullets = [];
        particles = [];
        enemyDir = 1;
        enemyMoveTimer = 0;
        initEnemies();
        gameState = 'playing';
        rewardContinueButton.style.display = 'none';
        rewardContinueButton.disabled = false;
        rewardContinueButton.textContent = t().watchAd;
        titleEl.textContent = 'SPACE RETRO';
        titleEl.style.color = '#f0f';
        msgEl.textContent = t().start;
        overlay.classList.add('hidden');
        updateHUD();
    } finally {
        startInProgress = false;
    }
}

function initEnemies() {
    enemies = [];
    const rows = 3;
    const cols = 8;
    const startX = 40;
    const startY = 40;
    const dx = 40;
    const dy = 40;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            enemies.push({
                x: startX + c * dx,
                y: startY + r * dy,
                w: 32,
                h: 24,
                type: r % 2 === 0 ? enemyArt1 : enemyArt2,
                color: r === 0 ? '#f0f' : (r === 1 ? '#ff0' : '#0ff'),
                alive: true
            });
        }
    }
}

let enemyDir = 1;
let enemyMoveTimer = 0;

function update() {
    stars.forEach((s) => {
        s.y += s.s;
        if (s.y > H) {
            s.y = 0;
            s.x = Math.random() * W;
        }
    });

    if (gameState !== 'playing') return;

    if (keys.ArrowLeft) {
        player.x -= player.speed;
        if (player.x < 0) player.x = 0;
    }
    if (keys.ArrowRight) {
        player.x += player.speed;
        if (player.x + player.w > W) player.x = W - player.w;
    }

    if (pointerActive) {
        const now = performance.now();
        if (now - lastPointerShotAt >= TOUCH_FIRE_INTERVAL_MS) {
            player.shoot();
            lastPointerShotAt = now;
        }
    }

    bullets.forEach((b) => { b.y -= b.speed; });
    bullets = bullets.filter((b) => b.y > -10);

    enemyBullets.forEach((b) => { b.y += b.speed; });
    enemyBullets = enemyBullets.filter((b) => b.y < H + 10);

    const aliveCount = enemies.filter((e) => e.alive).length;
    const difficulty = getDifficulty();
    const currentInterval = Math.max(
        3,
        (15 + aliveCount * 1.2) - wave * 2 - difficulty.moveIntervalPenalty
    );

    enemyMoveTimer++;
    if (enemyMoveTimer >= currentInterval) {
        enemyMoveTimer = 0;
        let edgeHit = false;
        enemies.forEach((e) => {
            if (!e.alive) return;
            const nextX = e.x + difficulty.moveStep * enemyDir;
            if (nextX <= 0 || nextX + e.w >= W) edgeHit = true;
        });

        if (edgeHit) {
            enemyDir *= -1;
            enemies.forEach((e) => {
                if (!e.alive) return;
                e.y += difficulty.dropStep;
            });
            playSound(50, 0.05, 'sawtooth', 0.05);
        } else {
            enemies.forEach((e) => {
                if (!e.alive) return;
                e.x += difficulty.moveStep * enemyDir;
            });
            playSound(100, 0.03, 'square', 0.05);
        }
    }

    if (Math.random() < difficulty.fireChance) {
        const aliveEnemies = enemies.filter((e) => e.alive);
        if (aliveEnemies.length > 0) {
            for (let n = 0; n < difficulty.volleyCount; n++) {
                const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                enemyBullets.push({
                    x: shooter.x + shooter.w / 2 - 2,
                    y: shooter.y + shooter.h,
                    w: 4,
                    h: 10,
                    speed: difficulty.bulletSpeed
                });
            }
            playSound(200, 0.05, 'sawtooth', 0.05);
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            if (!e.alive) continue;
            if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                e.alive = false;
                bullets.splice(i, 1);
                score += 10;
                createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color);
                playExplosion();
                updateHUD();
                break;
            }
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        if (b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
            enemyBullets.splice(i, 1);
            lives--;
            createExplosion(player.x + player.w / 2, player.y + player.h / 2, '#0f0');
            playExplosion();
            updateHUD();
            if (lives <= 0) {
                gameOver();
                return;
            }
            player.x = W / 2 - 16;
        }
    }

    for (const e of enemies) {
        if (e.alive && e.y + e.h >= player.y) {
            gameOver();
            return;
        }
    }

    if (aliveCount === 0) {
        score += 100;
        wave++;
        initEnemies();
        updateHUD();
        saveProgress();
    }

    particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });
    particles = particles.filter((p) => p.life > 0);
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color,
            life: 30
        });
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#333';
    stars.forEach((s) => {
        ctx.fillRect(s.x, s.y, 2, 2);
    });

    if (gameState === 'playing') {
        drawPixelArt(playerArt, player.x, player.y, '#0f0');

        enemies.forEach((e) => {
            if (e.alive) drawPixelArt(e.type, e.x, e.y, e.color);
        });

        ctx.fillStyle = '#0f0';
        bullets.forEach((b) => {
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        ctx.fillStyle = '#f00';
        enemyBullets.forEach((b) => {
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        particles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1;
        });
    }
}

function updateHUD() {
    scoreEl.textContent = String(score).padStart(4, '0');
    livesEl.textContent = lives;
    if (score > hiscore) {
        hiscore = score;
    }
    hiscoreEl.textContent = String(hiscore).padStart(4, '0');
}

function gameOver() {
    if (gameState !== 'playing') return;
    gameState = 'gameover';
    pointerActive = false;
    updateHUD();
    saveAndSendBestScore();

    titleEl.textContent = t().gameOver;
    titleEl.style.color = '#f00';
    msgEl.textContent = t().restart;
    overlay.classList.remove('hidden');

    if (inPlayablesEnv() && !rewardedContinueUsed) {
        rewardContinueButton.style.display = 'block';
    } else {
        rewardContinueButton.style.display = 'none';
    }
}

rewardContinueButton.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
});

rewardContinueButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!inPlayablesEnv() || gameState !== 'gameover' || rewardedContinueUsed || rewardContinueButton.disabled) return;

    rewardContinueButton.disabled = true;
    rewardContinueButton.textContent = t().loadingAd;

    try {
        const earned = await ytgame.ads.requestRewardedAd(REWARD_CONTINUE_ID);
        if (earned) {
            rewardedContinueUsed = true;
            lives = 1;
            enemyBullets = [];
            bullets = [];
            enemyDir = 1;
            enemyMoveTimer = 0;
            initEnemies();
            player.x = W / 2 - 16;
            gameState = 'playing';
            rewardContinueButton.style.display = 'none';
            overlay.classList.add('hidden');
            updateHUD();
            return;
        }
    } catch (_) {
        platformLogWarning();
    }

    rewardContinueButton.disabled = false;
    rewardContinueButton.textContent = t().watchAd;
});

function gameLoop() {
    animationFrameId = null;
    if (pausedByPlatform) return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function ensureGameLoop() {
    if (!pausedByPlatform && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

initializePlatform();
