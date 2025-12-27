import { Renderer3D } from './renderer3d.js';
import { Character } from './character.js';
import { ObstacleManager } from './obstacles.js';

export class Game {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        this.renderer = new Renderer3D(this.canvas, this.ctx);
        this.character = new Character();
        this.obstacleManager = new ObstacleManager();

        this.reset();
        this.resize();
    }

    reset() {
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.speed = 8; // Base speed
        this.maxSpeed = 25;
        this.difficulty = 0; // 0 to 1
        this.isGameOver = false;
        this.isRunning = false;
        this.combo = 0;
        this.maxCombo = 0;

        this.character.reset();
        this.obstacleManager.reset();
        this.renderer.reset();

        this.lastUpdateTime = 0;
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.renderer.updateDimensions();
    }

    start() {
        console.log('Game starting...');
        if (this.isRunning) return;

        this.reset();
        this.isRunning = true;
        this.lastUpdateTime = performance.now();

        // Remove old event listeners
        window.removeEventListener('keydown', this.handleInput);
        window.removeEventListener('keyup', this.handleKeyUp);

        // Add new event listeners
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        window.addEventListener('keydown', this.handleInput);
        window.addEventListener('keyup', this.handleKeyUp);

        console.log('Starting animation loop');
        requestAnimationFrame(this.loop.bind(this));
    }

    handleInput(e) {
        if (!this.isRunning || this.isGameOver) return;

        switch (e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                this.character.moveLeft();
                break;
            case 'd':
            case 'arrowright':
                this.character.moveRight();
                break;
            case 'w':
            case 'arrowup':
            case ' ':
                e.preventDefault();
                this.character.jump();
                break;
            case 's':
            case 'arrowdown':
                this.character.roll();
                break;
        }
    }

    handleKeyUp(e) {
        // Handle key release if needed
    }

    update(dt) {
        if (!this.isRunning || this.isGameOver) return;

        // Calculate difficulty (0 to 1 based on distance)
        this.difficulty = Math.min(1, this.distance / 10000);

        // Increase speed based on difficulty
        this.speed = 8 + (this.difficulty * (this.maxSpeed - 8));

        // Update distance and base score
        this.distance += this.speed * dt * 0.5;
        this.score = Math.floor(this.distance * this.character.scoreMultiplier);

        // Update character
        this.character.update(dt);

        // Update obstacles and collectibles
        this.obstacleManager.update(this.speed * dt * 0.5, this.difficulty, this.character.z);

        // Check collisions
        const collisions = this.obstacleManager.checkCollisions(this.character);

        // Handle obstacle collision
        if (collisions.obstacle && !this.character.isInvincible) {
            this.gameOver();
            return;
        }

        // Handle coin collection
        if (collisions.coins.length > 0) {
            this.coins += collisions.coins.length;
            this.score += collisions.coins.length * 10 * this.character.scoreMultiplier;
            this.combo += collisions.coins.length;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        } else {
            // Reset combo if no coins collected
            if (this.combo > 0) this.combo = Math.max(0, this.combo - 0.1);
        }

        // Handle power-up collection
        for (const powerup of collisions.powerups) {
            if (powerup.type === 'magnet') {
                this.character.activateMagnet(300);
            } else if (powerup.type === 'multiplier') {
                this.character.activateMultiplier(2, 300);
            }
        }

        // Update UI callbacks
        this.callbacks.onScoreUpdate(this.score);
        this.callbacks.onSpeedUpdate(((this.speed - 8) / (this.maxSpeed - 8)) * 100);

        if (this.callbacks.onCoinsUpdate) {
            this.callbacks.onCoinsUpdate(this.coins);
        }
        if (this.callbacks.onComboUpdate) {
            this.callbacks.onComboUpdate(Math.floor(this.combo));
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;

        window.removeEventListener('keydown', this.handleInput);
        window.removeEventListener('keyup', this.handleKeyUp);

        this.callbacks.onGameOver({
            score: this.score,
            distance: Math.floor(this.distance),
            coins: this.coins,
            maxCombo: Math.floor(this.maxCombo)
        });
    }

    loop(time) {
        if (!this.isRunning && !this.isGameOver) return;

        const dt = Math.min((time - this.lastUpdateTime) / 16.67, 2); // Cap at 2x normal speed
        this.lastUpdateTime = time;

        this.update(dt);

        // Render
        this.renderer.draw({
            player: this.character.getState(),
            obstacles: this.obstacleManager.getObstacles(),
            collectibles: this.obstacleManager.getCollectibles(),
            speed: this.speed,
            difficulty: this.difficulty,
            gameState: {
                score: this.score,
                coins: this.coins,
                combo: this.combo
            }
        });

        if (!this.isGameOver) {
            requestAnimationFrame(this.loop.bind(this));
        }
    }
}
