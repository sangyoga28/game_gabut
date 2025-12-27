export class Renderer3D {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // 3D perspective settings
        this.vanishingPoint = { x: 0, y: 0 };
        this.horizon = 0;
        this.fov = 0.8; // Field of view

        this.reset();
    }

    reset() {
        this.updateDimensions();

        // Track animation
        this.trackOffset = 0;

        // Background elements
        this.buildings = [];
        this.clouds = [];

        // Initialize background
        this.initBackground();

        // Particle system
        this.particles = [];
    }

    updateDimensions() {
        this.vanishingPoint.x = this.canvas.width / 2;
        this.vanishingPoint.y = this.canvas.height * 0.25; // Horizon at 25% from top
        this.horizon = this.vanishingPoint.y;
    }

    initBackground() {
        // Create buildings
        this.buildings = [];
        for (let i = 0; i < 20; i++) {
            this.buildings.push({
                x: Math.random() * this.canvas.width,
                z: Math.random() * 500 + 100,
                width: Math.random() * 60 + 40,
                height: Math.random() * 150 + 100,
                color: `hsl(${200 + Math.random() * 40}, 70%, ${20 + Math.random() * 20}%)`,
                side: Math.random() > 0.5 ? 'left' : 'right'
            });
        }

        // Create clouds
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.horizon * 0.8,
                size: Math.random() * 40 + 30,
                speed: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.3 + 0.2
            });
        }
    }

    // Convert 3D position to 2D screen position with perspective
    project3D(x, y, z) {
        const scale = this.fov / (this.fov + z / 100);

        return {
            x: this.vanishingPoint.x + (x - this.vanishingPoint.x) * scale,
            y: this.vanishingPoint.y + (y - this.vanishingPoint.y) * scale,
            scale: scale
        };
    }

    draw(state) {
        const { player, obstacles, collectibles, speed, gameState } = state;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Sky gradient
        this.drawSky();

        // 2. Clouds
        this.drawClouds(speed);

        // 3. Buildings (background)
        this.drawBuildings(speed);

        // 4. Track/Ground
        this.drawTrack(speed);

        // 5. Collectibles (coins, power-ups)
        if (collectibles) {
            collectibles.forEach(item => this.drawCollectible(item));
        }

        // 6. Obstacles
        if (obstacles) {
            obstacles.forEach(obs => this.drawObstacle(obs));
        }

        // 7. Player character
        this.drawPlayer(player);

        // 8. Particles
        this.drawParticles(speed);

        // 9. Speed effects
        if (speed > 15) {
            this.drawSpeedLines(speed);
        }
    }

    drawSky() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.horizon);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#2d1b4e');
        gradient.addColorStop(1, '#4a2d6e');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.horizon);
    }

    drawClouds(speed) {
        this.clouds.forEach(cloud => {
            cloud.y += cloud.speed * speed * 0.1;

            if (cloud.y > this.horizon) {
                cloud.y = -cloud.size;
                cloud.x = Math.random() * this.canvas.width;
            }

            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';

            // Simple cloud shape
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.4, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.size * 0.4, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.shadowBlur = 0;
        });
    }

    drawBuildings(speed) {
        this.buildings.forEach(building => {
            building.z -= speed * 0.5;

            if (building.z < -50) {
                building.z = 500;
                building.x = Math.random() * this.canvas.width;
            }

            const pos = this.project3D(
                building.side === 'left' ? -building.width : this.canvas.width + building.width,
                this.horizon,
                building.z
            );

            const height = building.height * pos.scale;
            const width = building.width * pos.scale;

            this.ctx.fillStyle = building.color;
            this.ctx.fillRect(
                pos.x - width / 2,
                pos.y - height,
                width,
                height
            );

            // Windows
            this.ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            const windowSize = 3 * pos.scale;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < Math.floor(height / 15); j++) {
                    if (Math.random() > 0.3) {
                        this.ctx.fillRect(
                            pos.x - width / 2 + (i + 0.5) * width / 4,
                            pos.y - height + j * 15 * pos.scale,
                            windowSize,
                            windowSize
                        );
                    }
                }
            }
        });
    }

    drawTrack(speed) {
        this.trackOffset += speed * 2;
        if (this.trackOffset > 100) this.trackOffset = 0;

        // Ground gradient
        const groundGradient = this.ctx.createLinearGradient(0, this.horizon, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#1a1a2e');
        groundGradient.addColorStop(1, '#0f0f1a');

        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.horizon, this.canvas.width, this.canvas.height - this.horizon);

        // Track lanes (3 lanes)
        const laneCount = 3;
        const trackWidth = this.canvas.width * 0.6;
        const laneWidth = trackWidth / laneCount;

        // Draw perspective grid
        for (let i = 0; i <= 20; i++) {
            const z = i * 50 - this.trackOffset;
            const depth = z;

            // Horizontal lines
            const leftPos = this.project3D(this.canvas.width / 2 - trackWidth / 2, this.canvas.height, depth);
            const rightPos = this.project3D(this.canvas.width / 2 + trackWidth / 2, this.canvas.height, depth);

            this.ctx.strokeStyle = `rgba(0, 242, 255, ${0.1 * (1 - i / 20)})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(leftPos.x, leftPos.y);
            this.ctx.lineTo(rightPos.x, rightPos.y);
            this.ctx.stroke();
        }

        // Lane dividers
        for (let lane = 1; lane < laneCount; lane++) {
            const laneX = this.canvas.width / 2 - trackWidth / 2 + lane * laneWidth;

            this.ctx.strokeStyle = '#7000ff';
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#7000ff';

            this.ctx.beginPath();
            const topPos = this.project3D(laneX, this.canvas.height, 1000);
            const bottomPos = this.project3D(laneX, this.canvas.height, 0);

            this.ctx.moveTo(topPos.x, topPos.y);
            this.ctx.lineTo(bottomPos.x, bottomPos.y);
            this.ctx.stroke();

            this.ctx.shadowBlur = 0;
        }

        // Track edges with neon glow
        const leftEdge = this.canvas.width / 2 - trackWidth / 2;
        const rightEdge = this.canvas.width / 2 + trackWidth / 2;

        this.ctx.strokeStyle = '#00f2ff';
        this.ctx.lineWidth = 4;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00f2ff';

        // Left edge
        this.ctx.beginPath();
        const leftTop = this.project3D(leftEdge, this.canvas.height, 1000);
        const leftBottom = this.project3D(leftEdge, this.canvas.height, 0);
        this.ctx.moveTo(leftTop.x, leftTop.y);
        this.ctx.lineTo(leftBottom.x, leftBottom.y);
        this.ctx.stroke();

        // Right edge
        this.ctx.beginPath();
        const rightTop = this.project3D(rightEdge, this.canvas.height, 1000);
        const rightBottom = this.project3D(rightEdge, this.canvas.height, 0);
        this.ctx.moveTo(rightTop.x, rightTop.y);
        this.ctx.lineTo(rightBottom.x, rightBottom.y);
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
    }

    drawPlayer(player) {
        const { lane, jumpHeight, isRolling, animFrame } = player;

        // Calculate player position
        const trackWidth = this.canvas.width * 0.6;
        const laneWidth = trackWidth / 3;
        const playerX = this.canvas.width / 2 - trackWidth / 2 + (lane + 0.5) * laneWidth;
        const playerZ = 50; // Fixed distance from camera
        const baseY = this.canvas.height * 0.75;

        const pos = this.project3D(playerX, baseY - jumpHeight, playerZ);

        // Shadow
        if (jumpHeight > 0) {
            const shadowPos = this.project3D(playerX, baseY, playerZ);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(shadowPos.x, shadowPos.y, 30 * pos.scale, 10 * pos.scale, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.scale(pos.scale, pos.scale);

        if (isRolling) {
            this.drawRollingCharacter(animFrame);
        } else {
            this.drawRunningCharacter(animFrame, jumpHeight > 0);
        }

        this.ctx.restore();
    }

    drawRunningCharacter(frame, isJumping) {
        const legAngle = isJumping ? 0 : Math.sin(frame * 0.3) * 0.3;

        // Outer glow
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = 'rgba(0, 242, 255, 0.8)';

        // Body
        const bodyGradient = this.ctx.createLinearGradient(-20, -50, 20, 50);
        bodyGradient.addColorStop(0, '#00f2ff');
        bodyGradient.addColorStop(0.5, '#7000ff');
        bodyGradient.addColorStop(1, '#ff00ff');

        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(-15, -40, 30, 50);

        // Head
        this.ctx.fillStyle = '#ffcc99';
        this.ctx.beginPath();
        this.ctx.arc(0, -55, 18, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-8, -58, 4, 4);
        this.ctx.fillRect(4, -58, 4, 4);

        // Arms
        this.ctx.strokeStyle = '#00f2ff';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(-15, -30);
        this.ctx.lineTo(-25, -10 + Math.sin(frame * 0.3 + Math.PI) * 10);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(15, -30);
        this.ctx.lineTo(25, -10 + Math.sin(frame * 0.3) * 10);
        this.ctx.stroke();

        // Legs
        this.ctx.beginPath();
        this.ctx.moveTo(-8, 10);
        this.ctx.lineTo(-15 + Math.sin(legAngle) * 10, 35);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(8, 10);
        this.ctx.lineTo(15 - Math.sin(legAngle) * 10, 35);
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
    }

    drawRollingCharacter(frame) {
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = 'rgba(0, 242, 255, 0.8)';

        // Rotating body
        this.ctx.save();
        this.ctx.rotate(frame * 0.5);

        const bodyGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
        bodyGradient.addColorStop(0, '#00f2ff');
        bodyGradient.addColorStop(0.5, '#7000ff');
        bodyGradient.addColorStop(1, '#ff00ff');

        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }

    drawObstacle(obstacle) {
        const { lane, z, type, height } = obstacle;

        const trackWidth = this.canvas.width * 0.6;
        const laneWidth = trackWidth / 3;
        const obsX = this.canvas.width / 2 - trackWidth / 2 + (lane + 0.5) * laneWidth;
        const obsY = this.canvas.height * 0.75;

        const pos = this.project3D(obsX, obsY, z);

        if (pos.scale < 0.1) return; // Too far away

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.scale(pos.scale, pos.scale);

        switch (type) {
            case 'barrier':
                this.drawBarrier();
                break;
            case 'overhead':
                this.drawOverhead();
                break;
            case 'train':
                this.drawTrain();
                break;
        }

        this.ctx.restore();
    }

    drawBarrier() {
        // Low barrier - must jump
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = 'rgba(255, 0, 85, 0.8)';

        const gradient = this.ctx.createLinearGradient(-40, -30, 40, 30);
        gradient.addColorStop(0, '#ff0055');
        gradient.addColorStop(0.5, '#ff3377');
        gradient.addColorStop(1, '#ff0055');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-40, -30, 80, 30);

        // Warning stripes
        this.ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 4; i++) {
            this.ctx.fillRect(-40 + i * 40, -30, 20, 30);
        }

        this.ctx.shadowBlur = 0;
    }

    drawOverhead() {
        // High obstacle - must slide
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = 'rgba(255, 136, 0, 0.8)';

        const gradient = this.ctx.createLinearGradient(-50, -80, 50, -40);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(0.5, '#ffaa33');
        gradient.addColorStop(1, '#ff8800');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-50, -80, 100, 40);

        // Support poles
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(-45, -40, 8, 40);
        this.ctx.fillRect(37, -40, 8, 40);

        this.ctx.shadowBlur = 0;
    }

    drawTrain() {
        // Wide obstacle - must change lane
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = 'rgba(0, 255, 102, 0.8)';

        const gradient = this.ctx.createLinearGradient(-60, -70, 60, 70);
        gradient.addColorStop(0, '#00ff66');
        gradient.addColorStop(0.5, '#00ff88');
        gradient.addColorStop(1, '#00ff66');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-60, -70, 120, 70);

        // Windows
        this.ctx.fillStyle = 'rgba(50, 50, 100, 0.7)';
        this.ctx.fillRect(-50, -60, 30, 25);
        this.ctx.fillRect(-10, -60, 30, 25);
        this.ctx.fillRect(30, -60, 30, 25);

        // Lights
        this.ctx.fillStyle = '#ffff00';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(-40, -65, 5, 0, Math.PI * 2);
        this.ctx.arc(40, -65, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    drawCollectible(item) {
        const { lane, z, type, rotation } = item;

        const trackWidth = this.canvas.width * 0.6;
        const laneWidth = trackWidth / 3;
        const itemX = this.canvas.width / 2 - trackWidth / 2 + (lane + 0.5) * laneWidth;
        const itemY = this.canvas.height * 0.65; // Floating height

        const pos = this.project3D(itemX, itemY, z);

        if (pos.scale < 0.1) return;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.scale(pos.scale, pos.scale);
        this.ctx.rotate(rotation || 0);

        if (type === 'coin') {
            this.drawCoin();
        } else if (type === 'magnet') {
            this.drawMagnet();
        } else if (type === 'multiplier') {
            this.drawMultiplier();
        }

        this.ctx.restore();
    }

    drawCoin() {
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';

        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.7, '#ffed4e');
        gradient.addColorStop(1, '#ffa500');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner circle
        this.ctx.fillStyle = '#ffed4e';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    drawMagnet() {
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';

        // Magnet shape
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillRect(-12, -15, 8, 30);
        this.ctx.fillRect(4, -15, 8, 30);
        this.ctx.fillRect(-12, -15, 24, 8);

        this.ctx.shadowBlur = 0;
    }

    drawMultiplier() {
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';

        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('2X', 0, 0);

        this.ctx.shadowBlur = 0;
    }

    drawParticles(speed) {
        // Generate dust particles
        if (Math.random() < 0.2) {
            this.particles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: this.canvas.height * 0.75,
                z: 50,
                vz: -speed * 2,
                life: 1,
                size: Math.random() * 3 + 2,
                color: `rgba(0, 242, 255, ${Math.random() * 0.5 + 0.3})`
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.z += p.vz;
            p.life -= 0.02;

            if (p.life <= 0 || p.z < -100) {
                this.particles.splice(i, 1);
                continue;
            }

            const pos = this.project3D(p.x, p.y, p.z);
            this.ctx.fillStyle = p.color.replace(/[\d.]+\)/, `${p.life})`);
            this.ctx.fillRect(pos.x, pos.y, p.size * pos.scale, p.size * pos.scale);
        }
    }

    drawSpeedLines(speed) {
        const intensity = Math.min((speed - 15) / 10, 1);
        this.ctx.strokeStyle = `rgba(0, 242, 255, ${0.2 * intensity})`;
        this.ctx.lineWidth = 2;

        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.canvas.width;
            const y = this.horizon + Math.random() * (this.canvas.height - this.horizon);
            const len = Math.random() * 100 + 50;

            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + len);
            this.ctx.stroke();
        }
    }
}
