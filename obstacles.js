export class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.collectibles = [];
        this.lastSpawnZ = 0;
        this.spawnInterval = 200;
        this.difficulty = 0;
    }

    reset() {
        this.obstacles = [];
        this.collectibles = [];
        this.lastSpawnZ = 0;
    }

    update(speed, difficulty, playerZ) {
        this.difficulty = difficulty;

        // Move obstacles towards player
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].z -= speed;

            // Remove obstacles that passed the player
            if (this.obstacles[i].z < -100) {
                this.obstacles.splice(i, 1);
            }
        }

        // Move collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            item.z -= speed;

            // Rotate coins
            if (item.type === 'coin') {
                item.rotation += 0.1;
            }

            // Remove collectibles that passed
            if (item.z < -100) {
                this.collectibles.splice(i, 1);
            }
        }

        // Spawn new obstacles
        this.lastSpawnZ += speed;
        if (this.lastSpawnZ >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnCoins();
            this.lastSpawnZ = 0;

            // Adjust spawn interval based on difficulty
            this.spawnInterval = Math.max(150, 250 - difficulty * 50);
        }
    }

    spawnObstacle() {
        const rand = Math.random() * 100;
        let type;

        // Difficulty-based obstacle selection
        if (this.difficulty < 0.3) {
            type = rand < 70 ? 'barrier' : 'overhead';
        } else if (this.difficulty < 0.6) {
            if (rand < 40) type = 'barrier';
            else if (rand < 70) type = 'overhead';
            else type = 'train';
        } else {
            if (rand < 30) type = 'barrier';
            else if (rand < 60) type = 'overhead';
            else type = 'train';
        }

        // Choose random lane(s)
        const lane = Math.floor(Math.random() * 3);

        this.obstacles.push({
            lane: lane,
            z: 1000,
            type: type,
            height: type === 'overhead' ? 80 : 30
        });

        // Sometimes spawn in multiple lanes for higher difficulty
        if (this.difficulty > 0.5 && Math.random() < 0.3) {
            const secondLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
            this.obstacles.push({
                lane: secondLane,
                z: 1000,
                type: type,
                height: type === 'overhead' ? 80 : 30
            });
        }
    }

    spawnCoins() {
        // Spawn a trail of coins
        const coinCount = Math.floor(Math.random() * 5) + 3;
        const lane = Math.floor(Math.random() * 3);
        const pattern = Math.random();

        for (let i = 0; i < coinCount; i++) {
            let coinLane = lane;

            // Different patterns
            if (pattern < 0.3) {
                // Straight line
                coinLane = lane;
            } else if (pattern < 0.6) {
                // Zigzag
                coinLane = (lane + (i % 2)) % 3;
            } else {
                // All lanes
                coinLane = i % 3;
            }

            this.collectibles.push({
                lane: coinLane,
                z: 1000 + i * 50,
                type: 'coin',
                rotation: 0,
                collected: false
            });
        }

        // Occasionally spawn power-ups
        if (Math.random() < 0.1) {
            const powerUpType = Math.random() < 0.5 ? 'magnet' : 'multiplier';
            this.collectibles.push({
                lane: Math.floor(Math.random() * 3),
                z: 1200,
                type: powerUpType,
                rotation: 0,
                collected: false
            });
        }
    }

    checkCollisions(player) {
        const playerHitbox = player.getHitbox();
        const collisions = {
            obstacle: null,
            coins: [],
            powerups: []
        };

        // Check obstacle collisions
        for (const obs of this.obstacles) {
            if (Math.abs(obs.z - playerHitbox.z) < 30) {
                if (Math.abs(obs.lane - playerHitbox.lane) < 0.5) {
                    // Check height-based collision
                    if (obs.type === 'overhead') {
                        // Must slide under
                        if (!player.isRolling && playerHitbox.y < 50) {
                            collisions.obstacle = obs;
                        }
                    } else if (obs.type === 'barrier') {
                        // Must jump over
                        if (playerHitbox.y < 40) {
                            collisions.obstacle = obs;
                        }
                    } else if (obs.type === 'train') {
                        // Must avoid completely
                        if (playerHitbox.y < 60) {
                            collisions.obstacle = obs;
                        }
                    }
                }
            }
        }

        // Check collectible collisions
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];

            if (item.collected) continue;

            // Magnet effect
            const magnetRange = player.hasMagnet ? 1.5 : 0.5;

            if (Math.abs(item.z - playerHitbox.z) < 40) {
                if (Math.abs(item.lane - playerHitbox.lane) < magnetRange) {
                    item.collected = true;

                    if (item.type === 'coin') {
                        collisions.coins.push(item);
                    } else {
                        collisions.powerups.push(item);
                    }

                    this.collectibles.splice(i, 1);
                }
            }
        }

        return collisions;
    }

    getObstacles() {
        return this.obstacles;
    }

    getCollectibles() {
        return this.collectibles;
    }
}
