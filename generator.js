export class Generator {
    constructor() {
        this.reset();

        this.patterns = {
            typeA: [
                [{ lane: 0, type: 'pothole' }],
                [{ lane: 1, type: 'pothole' }],
                [{ lane: 2, type: 'pothole' }]
            ],
            typeB: [
                [{ lane: 0, type: 'pothole' }, { lane: 1, type: 'pothole' }],
                [{ lane: 1, type: 'pothole' }, { lane: 2, type: 'pothole' }],
                [{ lane: 0, type: 'pothole' }, { lane: 2, type: 'pothole' }],
                [{ lane: 1, type: 'angkot' }] // Angkot in middle
            ],
            typeC: [
                [{ lane: 0, type: 'pothole' }, { lane: 1, type: 'angkot' }], // Lane block
                [{ lane: 2, type: 'pothole' }, { lane: 1, type: 'angkot' }],
                [{ lane: 0, type: 'pothole' }, { lane: 1, type: 'pothole' }, { lane: 2, type: 'pothole' }, { delay: true }] // Sequence
            ]
        };
    }

    reset() {
        this.lastSpawnDistance = 0;
        this.spawnInterval = 30;
        this.consecutiveTypeC = 0;
    }

    update(distance, difficulty, laneWidth) {
        if (distance - this.lastSpawnDistance > this.spawnInterval) {
            this.lastSpawnDistance = distance;
            this.spawnInterval = Math.max(12, 35 - (difficulty / 100) * 20);

            return this.generateBlock(difficulty, laneWidth);
        }
        return null;
    }

    generateBlock(difficulty, laneWidth) {
        let type;
        const rand = Math.random() * 100;

        if (difficulty < 25) {
            type = rand < 85 ? 'typeA' : 'typeB';
        } else if (difficulty < 65) {
            if (rand < 35) type = 'typeA';
            else if (rand < 75) type = 'typeB';
            else type = 'typeC';
        } else {
            if (rand < 10) type = 'typeA';
            else if (rand < 35) type = 'typeB';
            else type = 'typeC';
        }

        // Safe Block logic
        if (type === 'typeC') {
            this.consecutiveTypeC++;
            if (this.consecutiveTypeC > 2) {
                type = 'typeA';
                this.consecutiveTypeC = 0;
            }
        } else {
            this.consecutiveTypeC = 0;
        }

        const patternList = this.patterns[type];
        const pattern = patternList[Math.floor(Math.random() * patternList.length)];

        return pattern.map(item => {
            if (item.delay) return null;
            return {
                x: item.lane * laneWidth + laneWidth / 2,
                y: -100,
                width: item.type === 'angkot' ? 80 : 60,
                height: item.type === 'angkot' ? 120 : 40,
                type: item.type,
                lane: item.lane
            };
        }).filter(o => o !== null);
    }
}
