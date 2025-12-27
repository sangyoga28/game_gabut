import { Game } from './game.js';

let game = null;
let highScore = localStorage.getItem('hindari-lubang-highscore') || 0;

function init() {
    console.log('Initializing game...');

    const canvas = document.getElementById('gameCanvas');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const highScoreEl = document.getElementById('high-score');

    if (!canvas || !startBtn || !restartBtn) {
        console.error('Critical UI elements missing');
        return;
    }

    if (highScoreEl) highScoreEl.textContent = highScore;

    const ui = {
        currentScore: document.getElementById('current-score'),
        speedFill: document.getElementById('speed-fill'),
        finalScore: document.getElementById('final-score'),
        finalDistance: document.getElementById('final-distance'),
        startScreen: document.getElementById('start-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        hud: document.getElementById('hud'),
        highScoreEl: highScoreEl
    };

    game = new Game(canvas, {
        onScoreUpdate: (score) => {
            if (ui.currentScore) ui.currentScore.textContent = score.toString().padStart(6, '0');
        },
        onSpeedUpdate: (percent) => {
            if (ui.speedFill) ui.speedFill.style.width = `${percent}%`;
        },
        onGameOver: (stats) => {
            handleGameOver(stats, ui);
        }
    });

    // Use a clean wrapper to avoid double-binding if init is called twice
    startBtn.onclick = () => startGame(ui);
    restartBtn.onclick = () => startGame(ui);

    window.onresize = () => {
        if (game) game.resize();
    };

    console.log('Game initialized successfully');
}

function startGame(ui) {
    console.log('startGame triggered');
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
    if (ui.finalDistance) ui.finalDistance.textContent = Math.floor(stats.distance) + 'm';

    if (stats.score > highScore) {
        highScore = stats.score;
        localStorage.setItem('hindari-lubang-highscore', highScore);
        if (ui.highScoreEl) ui.highScoreEl.textContent = highScore;
    }
}

// Ensure init runs once the script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
