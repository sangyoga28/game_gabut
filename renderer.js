export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.reset();
    }

    reset() {
        this.roadOffset = 0;
        this.bgOffset = 0;

        // Particle system for background stars
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        // Speed particles
        this.particles = [];

        // Trail effect for player
        this.trail = [];
    }

    draw(state) {
        const { player, obstacles, speed, laneWidth, canvas } = state;

        // Background with gradient
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#0a0015');
        bgGradient.addColorStop(0.5, '#1a0033');
        bgGradient.addColorStop(1, '#0f001a');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Stars
        this.drawStars(speed);

        // 2. Draw Road with neon effect
        this.drawRoad(state);

        // 3. Draw Speed Particles
        this.drawParticles(speed);

        // 4. Draw Obstacles with glow
        obstacles.forEach(obs => {
            this.drawObstacle(obs);
        });

        // 5. Draw Player with trail
        this.drawPlayerTrail(player);
        this.drawPlayer(player);

        // 6. Visual Effects
        if (speed > 12) {
            this.drawSpeedLines(speed);
        }
    }

    drawStars(speed) {
        this.stars.forEach(star => {
            star.y = (star.y + star.speed * speed * 0.3) % (this.canvas.height + 10);

            this.ctx.fillStyle = `rgba(0, 242, 255, ${star.opacity})`;
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = 'rgba(0, 242, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    drawParticles(speed) {
        // Generate new particles
        if (Math.random() < 0.3) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 3 + 2,
                opacity: Math.random() * 0.5 + 0.3,
                color: Math.random() > 0.5 ? 'rgba(0, 242, 255,' : 'rgba(255, 0, 255,'
            });
        }

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y += p.speed * speed * 0.5;
            p.opacity -= 0.01;

            if (p.y > this.canvas.height || p.opacity <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = p.color + p.opacity + ')';
            this.ctx.fillRect(p.x, p.y, p.size, p.size * 3);
        }
    }

    drawRoad(state) {
        const { laneWidth, canvas, speed } = state;

        // Road surface with gradient
        const roadGradient = this.ctx.createLinearGradient(0, 0, canvas.width, 0);
        roadGradient.addColorStop(0, 'rgba(10, 10, 20, 0.3)');
        roadGradient.addColorStop(0.2, 'rgba(20, 20, 30, 0.9)');
        roadGradient.addColorStop(0.8, 'rgba(20, 20, 30, 0.9)');
        roadGradient.addColorStop(1, 'rgba(10, 10, 20, 0.3)');

        this.ctx.fillStyle = roadGradient;
        this.ctx.fillRect(laneWidth * 0.15, 0, canvas.width * 0.7, canvas.height);

        // Road edges with neon glow
        this.ctx.strokeStyle = '#00f2ff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00f2ff';

        this.ctx.beginPath();
        this.ctx.moveTo(laneWidth * 0.15, 0);
        this.ctx.lineTo(laneWidth * 0.15, canvas.height);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(laneWidth * 2.85, 0);
        this.ctx.lineTo(laneWidth * 2.85, canvas.height);
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;

        // Lane markers with neon effect
        this.roadOffset = (this.roadOffset + speed * 5) % 100;

        this.ctx.setLineDash([40, 60]);
        this.ctx.lineDashOffset = -this.roadOffset;
        this.ctx.strokeStyle = '#7000ff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#7000ff';

        // Vertical lane lines
        for (let i = 1; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * laneWidth, 0);
            this.ctx.lineTo(i * laneWidth, canvas.height);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
        this.ctx.shadowBlur = 0;
    }

    drawPlayerTrail(p) {
        // Add current position to trail
        this.trail.push({ x: p.x, y: p.y, opacity: 1 });

        // Limit trail length
        if (this.trail.length > 10) {
            this.trail.shift();
        }

        // Draw trail
        this.trail.forEach((point, index) => {
            const opacity = (index / this.trail.length) * 0.3;
            this.ctx.fillStyle = `rgba(0, 242, 255, ${opacity})`;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(0, 242, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y + 20, 8 - (index * 0.5), 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;
    }

    drawPlayer(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);

        // Tilting effect based on movement
        const tilt = (p.targetX - p.x) * 0.05;
        this.ctx.rotate(tilt);

        // Outer glow
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = 'rgba(0, 242, 255, 0.8)';

        // Motorcycle Body with enhanced gradient
        const gradient = this.ctx.createLinearGradient(-20, -40, 20, 40);
        gradient.addColorStop(0, '#00f2ff');
        gradient.addColorStop(0.3, '#7000ff');
        gradient.addColorStop(0.6, '#ff00ff');
        gradient.addColorStop(1, '#00f2ff');

        this.ctx.fillStyle = gradient;

        // Main Body - more detailed
        this.ctx.beginPath();
        this.ctx.roundRect(-18, -40, 36, 80, 10);
        this.ctx.fill();

        // Front light
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 40;
        this.ctx.shadowColor = '#00f2ff';
        this.ctx.beginPath();
        this.ctx.arc(0, -35, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Stripes
        this.ctx.shadowBlur = 10;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -30);
        this.ctx.lineTo(-5, 30);
        this.ctx.moveTo(5, -30);
        this.ctx.lineTo(5, 30);
        this.ctx.stroke();

        // Engine glow - enhanced
        const engineGlow = this.ctx.createRadialGradient(0, 40, 0, 0, 40, 15);
        engineGlow.addColorStop(0, 'rgba(0, 242, 255, 0.8)');
        engineGlow.addColorStop(0.5, 'rgba(0, 242, 255, 0.4)');
        engineGlow.addColorStop(1, 'transparent');

        this.ctx.fillStyle = engineGlow;
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(0, 40, 15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawObstacle(o) {
        this.ctx.save();
        this.ctx.translate(o.x, o.y);

        if (o.type === 'pothole') {
            // Enhanced pothole with danger glow
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = 'rgba(255, 0, 85, 0.8)';

            const gradient = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.4, '#1a0000');
            gradient.addColorStop(0.7, '#ff0055');
            gradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 45, 28, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner dark hole
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Danger outline
            this.ctx.strokeStyle = '#ff0055';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

        } else if (o.type === 'angkot') {
            // Enhanced angkot with neon glow
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = 'rgba(0, 255, 102, 0.8)';

            // Body gradient
            const angkotGradient = this.ctx.createLinearGradient(-25, -50, 25, 50);
            angkotGradient.addColorStop(0, '#00ff88');
            angkotGradient.addColorStop(0.5, '#00ff66');
            angkotGradient.addColorStop(1, '#00cc55');

            this.ctx.fillStyle = angkotGradient;
            this.ctx.beginPath();
            this.ctx.roundRect(-28, -55, 56, 110, 8);
            this.ctx.fill();

            // Windows
            this.ctx.fillStyle = 'rgba(0, 50, 100, 0.8)';
            this.ctx.fillRect(-22, -45, 44, 25);
            this.ctx.fillRect(-22, -15, 44, 25);

            // Lights
            this.ctx.fillStyle = '#ffff00';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(-15, -50, 4, 0, Math.PI * 2);
            this.ctx.arc(15, -50, 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Outline
            this.ctx.strokeStyle = '#00ff66';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#00ff66';
            this.ctx.beginPath();
            this.ctx.roundRect(-28, -55, 56, 110, 8);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawSpeedLines(speed) {
        const intensity = (speed - 12) / 8; // 0 to 1
        this.ctx.strokeStyle = `rgba(0, 242, 255, ${0.15 * intensity})`;
        this.ctx.lineWidth = 2;

        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const len = Math.random() * 150 + 100;

            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(0, 242, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + len);
            this.ctx.stroke();
        }
        this.ctx.shadowBlur = 0;
    }
}
