import { Renderer } from './renderer.js';
import { Generator } from './generator.js';

export class Game {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        this.renderer = new Renderer(this.canvas, this.ctx);
        this.generator = new Generator();

        this.reset();
        this.resize();
    }

    reset() {
        this.score = 0;
        this.distance = 0;
        this.speed = 5; // Base speed
        this.maxSpeed = 20;
        this.difficulty = 0; // 0 to 100
        this.isGameOver = false;
        this.isRunning = false;

        this.player = {
            lane: 1, // 0: Left, 1: Middle, 2: Right
            targetX: 0,
            x: 0,
            y: 0,
            width: 50,
            height: 80
        };

        this.obstacles = [];
        this.lastUpdateTime = 0;

        this.generator.reset();
        this.renderer.reset();

        this.updatePlayerPosition(true);
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        this.laneWidth = this.canvas.width / 3;
        this.updatePlayerPosition(true);
    }

    updatePlayerPosition(immediate = false) {
        this.player.targetX = this.player.lane * this.laneWidth + this.laneWidth / 2;
        this.player.y = this.canvas.height - 150;

        if (immediate) {
            this.player.x = this.player.targetX;
        }
    }

    start() {
        console.log('Game internal start called. isRunning:', this.isRunning);
        if (this.isRunning) return;
        this.reset();
        this.isRunning = true;
        this.lastUpdateTime = performance.now();

        // Add Input Listeners
        window.addEventListener('keydown', this.handleInput.bind(this));

        console.log('Animation loop beginning');
        requestAnimationFrame(this.loop.bind(this));
    }

    handleInput(e) {
        if (!this.isRunning || this.isGameOver) return;

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            if (this.player.lane > 0) this.player.lane--;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            if (this.player.lane < 2) this.player.lane++;
        }

        this.updatePlayerPosition();
    }

    update(dt) {
        if (!this.isRunning || this.isGameOver) return;

        // Calculate Difficulty (0-100 based on score)
        this.difficulty = Math.min(100, this.score / 100);

        // Increase Speed based on Difficulty
        this.speed = 5 + (this.difficulty / 100) * (this.maxSpeed - 5);

        // Smoothly move player to target lane
        const lerpFactor = 0.2;
        this.player.x += (this.player.targetX - this.player.x) * lerpFactor;

        // Update Distance and Score
        this.distance += (this.speed * dt) / 100;
        this.score = Math.floor(this.distance * 10);

        this.callbacks.onScoreUpdate(this.score);
        this.callbacks.onSpeedUpdate(((this.speed - 5) / (this.maxSpeed - 5)) * 100);

        // Spawn Obstacles
        const newObstacles = this.generator.update(this.distance, this.difficulty, this.laneWidth);
        if (newObstacles) {
            this.obstacles.push(...newObstacles);
        }

        // Update Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += this.speed * dt * 0.5;

            // Collision Detection
            if (this.checkCollision(this.player, obs)) {
                this.gameOver();
            }

            // Remove off-screen obstacles
            if (obs.y > this.canvas.height + 100) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    checkCollision(p, o) {
        const pPadding = 10; // Hitbox padding
        return p.x - p.width / 2 + pPadding < o.x + o.width / 2 &&
            p.x + p.width / 2 - pPadding > o.x - o.width / 2 &&
            p.y < o.y + o.height &&
            p.y + p.height > o.y;
    }

    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        window.removeEventListener('keydown', this.handleInput.bind(this));

        this.callbacks.onGameOver({
            score: this.score,
            distance: this.distance
        });
    }

    loop(time) {
        if (!this.isRunning && !this.isGameOver) return;

        const dt = (time - this.lastUpdateTime) / 16.67; // Normalized to 60fps
        this.lastUpdateTime = time;

        this.update(dt);

        this.renderer.draw({
            player: this.player,
            obstacles: this.obstacles,
            speed: this.speed,
            difficulty: this.difficulty,
            laneWidth: this.laneWidth,
            canvas: this.canvas
        });

        if (!this.isGameOver) {
            requestAnimationFrame(this.loop.bind(this));
        }
    }
}
