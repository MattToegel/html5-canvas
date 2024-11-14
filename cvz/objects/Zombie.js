class Zombie extends GameObject {
    static frameInterval = 250;
    static frameWidth = 48;
    static frameHeight = 64;
    static halfWidth = Zombie.frameWidth / 2;
    static halfHeight = Zombie.frameHeight / 2;
    static neighbors = [];
    static zombies = [];
    static zombieSprite;
    static separationStrength = 8
    static separationThreshold = 30

    #level = 0;
    #spriteDirection = 0;
    #health = 0;
    #maxHealth = 0;
    #active = false;
    #updateCounter = 0; // used to reduce expensive logic invocations
    #render = {
        frameIndex: 0,
        lastZombieFrameTime: 0
    };
    #transform = {
        dx: 0,
        dy: 0,
        moveX: 0,
        moveY: 0,
        speed: 0,
        reset: function () {
            this.dx = 0;
            this.dy = 0;
            this.moveX = 0;
            this.moveY = 0;
            this.speed = 0;
        }
    };
    isActive() {
        return this.#active;
    }
    static #baseSpeed = 50;
    static #speedIncrement = 5;
    static #neighborRadius = 30;
    static #neighborRadiusSquared = Zombie.#neighborRadius ** 2;
    constructor(x, y, level = 1) {
        super(x, y);
        this.activate(x, y, level);
    }
    getCenter(){
        //const coord = {x:this.x, y:this.y}
        return {
            x: this.x + Zombie.halfWidth,
            y: this.y + Zombie.frameHeight - 10
        }
    }
    activate(x, y, level = 1) {
        this.#level = level;
        this.#spriteDirection = Math.floor(Math.random() * 4);
        this.#render.frameIndex = 0;
        this.#render.lastZombieFrameTime = 0;

        this.#updateCounter = Math.floor(Math.random() * 5);
        this.x = x;
        this.y = y;
        console.log("spawned", { x: x, y: y });
        this.#transform.reset();
        // TODO speed of 1 is fast
        // Speed increases gradually with level, starting at 0.5-1.0 and progressing
        this.#transform.speed = Zombie.#baseSpeed + (Math.random() * 1.5 + 0.5) * Zombie.#baseSpeed * 0.05 + (Zombie.#speedIncrement * Math.log(this.#level + 1));

        //this.#transform.speed = Zombie.#baseSpeed + Math.random() * 0.5 + (Zombie.#speedIncrement * Math.log(this.#level + 1));
        console.log("zombie speed", this.#transform.speed);
        //this.#transform.speed = Zombie.#baseSpeed + Math.random() * 0.5 + (Zombie.#speedIncrement * this.#level);

        // Health starts at 1 and increases gradually with level
        this.#maxHealth = Math.floor(1 + 0.5 * this.#level + 0.05 * this.#level ** 1.5); // Moderate growth curve

        this.#health = this.#maxHealth;

        this.#active = true;
    }

    isNearby(zombie) {
        const dx = (this.x + Zombie.halfWidth) - (zombie.getCenter().x);
        const dy = (this.y + Zombie.halfHeight) - (zombie.getCenter().y);
        return dx * dx + dy * dy < Zombie.#neighborRadiusSquared;
    }
    applySeparation(neighbors) {
        if (neighbors.length === 0) return;
    
        let offsetX = 0;
        let offsetY = 0;
    
        const separationThresholdSquared = Zombie.separationThreshold **2;
        const maxSeparationSpeedSquared = this.#transform.speed**2; // Using squared value to avoid Math.sqrt
    
        for (const neighbor of neighbors) {
            if (neighbor !== this) {
                const dx = this.x - neighbor.x;
                const dy = this.y - neighbor.y;
                const distanceSquared = dx * dx + dy * dy;
    
                if (distanceSquared < separationThresholdSquared && distanceSquared > 0) {
                    const scale = Zombie.separationStrength / distanceSquared; // Scale based on squared distance
                    offsetX += dx * scale;
                    offsetY += dy * scale;
                }
            }
        }
    
        // Limit the offset to a maximum speed (in squared form to avoid Math.sqrt)
        const offsetMagnitudeSquared = offsetX * offsetX + offsetY * offsetY;
        if (offsetMagnitudeSquared > maxSeparationSpeedSquared) {
            const scale = maxSeparationSpeedSquared / offsetMagnitudeSquared;
            offsetX *= scale;
            offsetY *= scale;
        }
    
        const tentativeX = this.x + offsetX;
        const tentativeY = this.y + offsetY;
    
        // Check for collisions before applying the offset
        if (!this.checkRockCollision(tentativeX, tentativeY, Zombie.frameWidth, Zombie.frameHeight)) {
            this.x = tentativeX;
            this.y = tentativeY;
        }
    }

    takeDamage(amount) {
        this.#health -= amount;
        if (this.#health <= 0) {
            this.#active = false;
            console.log("Zombie died");
            Game.getInstance().updateScoreAndExperience(5, 10);
        }
    }

    moveTowardsChicken(chicken, timestamp) {
        // Note: using instance data to reduce memory garbage from temp variables
        // Originally was benchmarking with 10k zombies
        this.#transform.delta = (timestamp - this.#transform.lastTimestamp) / 1000;
        this.#transform.lastTimestamp = timestamp;
        if (!this.#transform.delta || this.#transform.delta > .1) {
            this.#transform.delta = .001;
        }
        //console.log("delta", this.#transform.delta, this);
        this.#transform.dx = (chicken.getCenter().x) - (this.getCenter().x);
        this.#transform.dy = (chicken.getCenter().y) - (this.getCenter().y);
        this.#transform.distanceSquared = (this.#transform.dx ** 2) + (this.#transform.dy ** 2);

        if (this.#transform.distanceSquared > 4) {
            this.#transform.dirAdjustment = (this.#transform.dx !== 0 && this.#transform.dy !== 0) ? DIAGONAL_ADJUSTMENT : 1;

            if (this.#transform.distanceSquared !== this.#transform.lastDistanceSquared) {
                this.#transform.angle = Math.atan2(this.#transform.dy, this.#transform.dx);
                this.moveX = Math.cos(this.#transform.angle) * this.#transform.speed * this.#transform.dirAdjustment * this.#transform.delta;
                this.moveY = Math.sin(this.#transform.angle) * this.#transform.speed * this.#transform.dirAdjustment * this.#transform.delta;
                this.#transform.lastDistanceSquared = this.#transform.distanceSquared;
            }

            this.#transform.nextX = this.x + this.moveX;
            this.#transform.nextY = this.y + this.moveY;

            if (!this.checkRockCollision(this.#transform.nextX, this.#transform.nextY, Zombie.frameWidth, Zombie.frameHeight)) {
                this.x = this.#transform.nextX;
                this.y = this.#transform.nextY;
            }

            this.#spriteDirection = Math.abs(this.#transform.dx) > Math.abs(this.#transform.dy) ?
                (this.#transform.dx > 0 ? directions.right : directions.left) :
                (this.#transform.dy > 0 ? directions.down : directions.up);
        }
    }

    update(timestamp, chicken, neighbors) {
        if (!this.isActive()) return;

        this.#updateCounter++;
        if (this.#updateCounter % 2 === 0) this.applySeparation(neighbors);
        if (this.#updateCounter % 3 === 0) this.moveTowardsChicken(chicken, timestamp);

        if (timestamp - this.#render.lastZombieFrameTime >= Zombie.frameInterval) {
            this.#render.frameIndex = (this.#render.frameIndex + 1) % 3;
            this.#render.lastZombieFrameTime = timestamp;
        }
    }

    draw(camera, ctx, canvasWidth, canvasHeight) {
        if (!this.isActive()) return;

        const isVisible =
            this.x >= camera.x - Zombie.frameWidth &&
            this.x <= camera.x + canvasWidth &&
            this.y >= camera.y - Zombie.frameHeight &&
            this.y <= camera.y + canvasHeight;

        if (!isVisible) return;
        // draw shadow
        ctx.beginPath();
        ctx.fillStyle = "#1a1a1a ";
        ctx.arc(this.getCenter().x - camera.x, this.getCenter().y - camera.y, Zombie.halfWidth*.33, 0, 2 * Math.PI); // 2 * Math.PI for a full circle
        ctx.fill();
        // end shadow

        ctx.drawImage(
            Zombie.zombieSprite,
            this.#render.frameIndex * Zombie.frameWidth,
            this.#spriteDirection * Zombie.frameHeight,
            Zombie.frameWidth,
            Zombie.frameHeight,
            this.x - camera.x,
            this.y - camera.y,
            Zombie.frameWidth,
            Zombie.frameHeight
        );
        
     
        // Draw health bar above the zombie
        const barWidth = 30;          // Width of the health bar
        const barHeight = 5;          // Height of the health bar
        const barX = this.x - camera.x + Zombie.frameWidth / 2 - barWidth / 2;
        const barY = this.y - camera.y - 10;  // Position above the zombie

        // Background (empty health)
        ctx.fillStyle = 'red';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Foreground (current health)
        const healthWidth = (this.#health / this.#maxHealth) * barWidth;
        ctx.fillStyle = 'green';
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
    static spawnZombies(zombiesForLevel, level) {

        //const remainingZombies = Math.max(zombiesForLevel - Zombie.zombies.length, 0);
        const remainingZombies = Math.max(zombiesForLevel - (Game.getInstance().getZombieStats().combined),0)
        console.log("spawn", zombiesForLevel, remainingZombies, Game.getInstance().getZombieStats())
        if (remainingZombies > 0) {

            let spawn = 10;
            if (remainingZombies < 10) {
                spawn = remainingZombies;
            }
            Array.from({ length: spawn }, () => Zombie.getOrSpawnZombie(level)).forEach(z => Zombie.zombies.push(z));

        }
    }
    static getOrSpawnZombie(level) {
        let x, y;
        const minDistanceFromChicken = 500; // Set a minimum distance (in pixels) from the chicken

        // Loop until we find a position far enough from the 
        let attempts = 250;
        let ds = 0;

        do {
            const safeZone = Game.getInstance().getChickenCenter();
            console.log("safe zone", safeZone);
            x = Math.random() * (worldWidth - 100) + 50;
            y = Math.random() * (worldHeight - 100) + 50;
            const dx = x - safeZone.x;
            const dy = y - safeZone.y;
            ds = (dx * dx) + (dy * dy);
            console.log("dist", ds, minDistanceFromChicken);
            attempts--;
        } while (
            ds < minDistanceFromChicken && attempts > 0
        );
        if (attempts <= 0) {
            console.error("Attempts exceeded");
        }
        if (ds > minDistanceFromChicken) {
            console.warn("Spawn is out of range");
        }
        else {
            console.warn("Spawn is too close");
        }
        let zombie = null;
        try {
            zombie = Zombie.zombies.find(z => !z.isActive());
        }
        catch (e) {
            //ignore, likely access before intialization
        }
        if (!zombie) {
            zombie = new Zombie(x, y, level);

            //zombiePool.push(zombie);
        } else {
            // Reset health and position if reusing from pool
            zombie.activate(x, y, level);
        }
        return zombie;
    }
    static chase(timestamp, chicken, camera, ctx, canvasWidth, canvasHeight, activeCallback, collisionCallback) {
        let activeZombies = 0;
        for (let i = 0; i < Zombie.zombies.length; i++) {
            const zombie = Zombie.zombies[i];
            if (!zombie.isActive()) {
                continue;
            }
            activeZombies++;
            if (chicken.checkCollision(zombie)) {
                
                if (collisionCallback) {
                    collisionCallback();
                }
                break;
            }
            Zombie.neighbors.length = 0;

            for (let j = i + 1; j < Zombie.zombies.length; j++) {
                if (i !== j) {
                    const otherZombie = Zombie.zombies[j];
                    if (!otherZombie.isActive()) {
                        continue;
                    }
                    const dx = zombie.x - otherZombie.x;
                    const dy = zombie.y - otherZombie.y;

                    if (dx * dx + dy * dy < this.#neighborRadiusSquared) {
                        Zombie.neighbors.push(otherZombie);
                    }
                }
            }
            //console.log("ud zom", timestamp,  canvasWidth, canvasHeight);
            zombie.update(timestamp, chicken, Zombie.neighbors);
            zombie.draw(camera, ctx, canvasWidth, canvasHeight);
        }
        if (activeCallback) {
            activeCallback(activeZombies);
        }
    }
}