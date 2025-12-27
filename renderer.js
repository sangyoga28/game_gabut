export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.reset();
    }

    reset() {
        this.roadOffset = 0;
        this.bgOffset = 0;

        // Generate static background objects for parallax
        this.trees = [];
        for (let i = 0; i < 10; i++) {
            this.trees.push({
                x: Math.random() > 0.5 ? -40 : this.canvas.width + 40,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 20 + 30,
                side: Math.random() > 0.5 ? 'left' : 'right'
            });
        }
    }

    draw(state) {
        const { player, obstacles, speed, laneWidth, canvas } = state;

        // Background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Parallax Background (Buildings/Trees)
        this.drawParallax(speed);

        // 2. Draw Road
        this.drawRoad(state);

        // 3. Draw Obstacles
        obstacles.forEach(obs => {
            this.drawObstacle(obs);
        });

        // 4. Draw Player
        this.drawPlayer(player);

        // 5. Visual Effects
        if (speed > 12) {
            this.drawSpeedLines(speed);
        }
    }

    drawParallax(speed) {
        this.bgOffset = (this.bgOffset + speed * 1.5) % this.canvas.height;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';

        // Draw some simple "city" shapes or trees moving slower
        this.trees.forEach(tree => {
            tree.y = (tree.y + speed * 1.5) % (this.canvas.height + 100);

            this.ctx.beginPath();
            if (tree.side === 'left') {
                this.ctx.moveTo(0, tree.y - 50);
                this.ctx.lineTo(40, tree.y);
                this.ctx.lineTo(0, tree.y + 50);
            } else {
                this.ctx.moveTo(this.canvas.width, tree.y - 50);
                this.ctx.lineTo(this.canvas.width - 40, tree.y);
                this.ctx.lineTo(this.canvas.width, tree.y + 50);
            }
            this.ctx.fill();
        });
    }

    drawRoad(state) {
        const { laneWidth, canvas, speed } = state;

        // Road surface
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(laneWidth * 0.2, 0, canvas.width * 0.6, canvas.height);

        // Lane markers
        this.roadOffset = (this.roadOffset + speed * 5) % 100;

        this.ctx.setLineDash([40, 60]);
        this.ctx.lineDashOffset = -this.roadOffset;
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        this.ctx.lineWidth = 2;

        // Vertical lines
        for (let i = 1; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * laneWidth, 0);
            this.ctx.lineTo(i * laneWidth, canvas.height);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
    }

    drawPlayer(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);

        // Tilting effect based on movement
        const tilt = (p.targetX - p.x) * 0.05;
        this.ctx.rotate(tilt);

        // Motorcycle Body
        const gradient = this.ctx.createLinearGradient(-15, 0, 15, 0);
        gradient.addColorStop(0, '#00f2ff');
        gradient.addColorStop(0.5, '#7000ff');
        gradient.addColorStop(1, '#00f2ff');

        this.ctx.fillStyle = gradient;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(0, 242, 255, 0.5)';

        // Main Body
        this.ctx.beginPath();
        this.ctx.roundRect(-15, -35, 30, 70, 8);
        this.ctx.fill();

        // Stripes
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -30);
        this.ctx.lineTo(0, 30);
        this.ctx.stroke();

        // Engine glow
        this.ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 40, 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawObstacle(o) {
        this.ctx.save();
        this.ctx.translate(o.x, o.y);

        if (o.type === 'pothole') {
            const gradient = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
            gradient.addColorStop(0, '#000');
            gradient.addColorStop(0.8, '#222');
            gradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 40, 25, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.stroke();
        } else if (o.type === 'angkot') {
            this.ctx.fillStyle = '#00ff66';
            this.ctx.beginPath();
            this.ctx.roundRect(-25, -50, 50, 100, 5);
            this.ctx.fill();

            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(-20, -40, 40, 20); // Window
        }

        this.ctx.restore();
    }

    drawSpeedLines(speed) {
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const len = Math.random() * 100 + 100;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + len);
            this.ctx.stroke();
        }
    }
}
