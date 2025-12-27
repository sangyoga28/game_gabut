import { Game } from './game.js';

let game = null;
let highScore = localStorage.getItem('hindari-lubang-highscore') || 0;
let highCoins = localStorage.getItem('hindari-lubang-coins') || 0;

function init() {
    console.log('Initializing 3D game...');

    const canvas = document.getElementById('gameCanvas');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const highScoreEl = document.getElementById('high-score');
    const highCoinsEl = document.getElementById('high-coins');

    if (!canvas || !startBtn || !restartBtn) {
        console.error('Critical UI elements missing');
        return;
    }

    if (highScoreEl) highScoreEl.textContent = highScore;
    if (highCoinsEl) highCoinsEl.textContent = highCoins;

    const ui = {
        currentScore: document.getElementById('current-score'),
        currentCoins: document.getElementById('current-coins'),
        currentCombo: document.getElementById('current-combo'),
        speedFill: document.getElementById('speed-fill'),
        finalScore: document.getElementById('final-score'),
        finalDistance: document.getElementById('final-distance'),
        finalCoins: document.getElementById('final-coins'),
        finalCombo: document.getElementById('final-combo'),
        startScreen: document.getElementById('start-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        hud: document.getElementById('hud'),
        highScoreEl: highScoreEl,
        highCoinsEl: highCoinsEl
    };

    game = new Game(canvas, {
        onScoreUpdate: (score) => {
            if (ui.currentScore) ui.currentScore.textContent = score.toString().padStart(6, '0');
        },
        onSpeedUpdate: (percent) => {
            if (ui.speedFill) ui.speedFill.style.width = `${percent}%`;
        },
        onCoinsUpdate: (coins) => {
            if (ui.currentCoins) ui.currentCoins.textContent = coins;
        },
        onComboUpdate: (combo) => {
            if (ui.currentCombo) {
                ui.currentCombo.textContent = combo > 0 ? `x${combo}` : '';
                ui.currentCombo.style.opacity = combo > 0 ? '1' : '0';
            }
        },
        onGameOver: (stats) => {
            handleGameOver(stats, ui);
        }
    });

    startBtn.onclick = () => startGame(ui);
    restartBtn.onclick = () => startGame(ui);

    window.onresize = () => {
        if (game) game.resize();
    };

    console.log('3D Game initialized successfully');
}

function startGame(ui) {
    console.log('Starting 3D game');
    if (ui.startScreen) ui.startScreen.classList.remove('active');
    if (ui.gameOverScreen) ui.gameOverScreen.classList.remove('active');
    if (ui.hud) ui.hud.classList.add('active');

    if (game) {
        game.start();
    }
}

function handleGameOver(stats, ui) {
    if (ui.hud) ui.hud.classList.remove('active');
    if (ui.gameOverScreen) ui.gameOverScreen.classList.add('active');

    if (ui.finalScore) ui.finalScore.textContent = stats.score;
    if (ui.finalDistance) ui.finalDistance.textContent = stats.distance + 'm';
    if (ui.finalCoins) ui.finalCoins.textContent = stats.coins;
    if (ui.finalCombo) ui.finalCombo.textContent = stats.maxCombo;

    // Update high scores
    if (stats.score > highScore) {
        highScore = stats.score;
        localStorage.setItem('hindari-lubang-highscore', highScore);
        if (ui.highScoreEl) ui.highScoreEl.textContent = highScore;
    }

    if (stats.coins > highCoins) {
        highCoins = stats.coins;
        localStorage.setItem('hindari-lubang-coins', highCoins);
        if (ui.highCoinsEl) ui.highCoinsEl.textContent = highCoins;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
