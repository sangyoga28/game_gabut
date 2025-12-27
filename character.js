export class Character {
    constructor() {
        this.reset();
    }

    reset() {
        this.lane = 1; // 0: left, 1: middle, 2: right
        this.targetLane = 1;
        this.x = 0;
        this.y = 0;
        this.z = 50; // Fixed distance from camera

        // Jump physics
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.gravity = 1.2;
        this.jumpPower = 20;

        // Roll/slide
        this.isRolling = false;
        this.rollTimer = 0;
        this.rollDuration = 30; // frames

        // Animation
        this.animFrame = 0;
        this.animSpeed = 0.3;

        // State
        this.isInvincible = false;
        this.invincibleTimer = 0;

        // Power-ups
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.scoreMultiplier = 1;
        this.multiplierTimer = 0;
    }

    update(dt) {
        // Smooth lane transition
        const lerpSpeed = 0.25;
        if (this.lane !== this.targetLane) {
            this.lane += (this.targetLane - this.lane) * lerpSpeed;
            if (Math.abs(this.lane - this.targetLane) < 0.01) {
                this.lane = this.targetLane;
            }
        }

        // Jump physics
        if (this.isJumping) {
            this.jumpVelocity -= this.gravity;
            this.jumpHeight += this.jumpVelocity;

            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.jumpVelocity = 0;
                this.isJumping = false;
            }
        }

        // Roll timer
        if (this.isRolling) {
            this.rollTimer++;
            if (this.rollTimer >= this.rollDuration) {
                this.isRolling = false;
                this.rollTimer = 0;
            }
        }

        // Animation frame
        if (!this.isRolling && !this.isJumping) {
            this.animFrame += this.animSpeed;
        } else if (this.isRolling) {
            this.animFrame += 0.5;
        }

        // Power-up timers
        if (this.isInvincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }

        if (this.hasMagnet) {
            this.magnetTimer--;
            if (this.magnetTimer <= 0) {
                this.hasMagnet = false;
            }
        }

        if (this.scoreMultiplier > 1) {
            this.multiplierTimer--;
            if (this.multiplierTimer <= 0) {
                this.scoreMultiplier = 1;
            }
        }
    }

    moveLeft() {
        if (this.targetLane > 0 && !this.isRolling) {
            this.targetLane--;
        }
    }

    moveRight() {
        if (this.targetLane < 2 && !this.isRolling) {
            this.targetLane++;
        }
    }

    jump() {
        if (!this.isJumping && !this.isRolling) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpPower;
        }
    }

    roll() {
        if (!this.isJumping && !this.isRolling) {
            this.isRolling = true;
            this.rollTimer = 0;
        }
    }

    activateMagnet(duration = 300) {
        this.hasMagnet = true;
        this.magnetTimer = duration;
    }

    activateMultiplier(multiplier = 2, duration = 300) {
        this.scoreMultiplier = multiplier;
        this.multiplierTimer = duration;
    }

    activateInvincibility(duration = 180) {
        this.isInvincible = true;
        this.invincibleTimer = duration;
    }

    getHitbox() {
        // Return hitbox for collision detection
        const width = 30;
        const height = this.isRolling ? 20 : 60;
        const heightOffset = this.isRolling ? 40 : 0;

        return {
            lane: Math.round(this.lane),
            z: this.z,
            y: this.jumpHeight,
            width: width,
            height: height,
            heightOffset: heightOffset
        };
    }

    getState() {
        return {
            lane: this.lane,
            jumpHeight: this.jumpHeight,
            isRolling: this.isRolling,
            isJumping: this.isJumping,
            animFrame: this.animFrame,
            isInvincible: this.isInvincible,
            hasMagnet: this.hasMagnet,
            scoreMultiplier: this.scoreMultiplier
        };
    }
}
