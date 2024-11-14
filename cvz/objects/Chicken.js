class Chicken extends GameObject {
    static frameInterval = 150;
    static frameWidth = 32;
    static frameHeight = 32;
    static numberOfFrames = 3;
    static halfWidth = Chicken.frameWidth / 2;
    static halfHeight = Chicken.frameHeight / 2;
    static chickenSprite;
    #speed = 300;
    #delta;
    #lastTimestamp;
    constructor(x, y) {
        super(x, y);
        this.direction = directions.down;
        this.frameIndex = 0;
        this.lastFrameTime = 0;
        this.moving = false;
    }
    getCenter(){
        return {
            x: this.x + Chicken.halfWidth,
            y: this.y + Chicken.frameHeight - 5
        }
    }
    move(keysPressed, timestamp) {  // Pass keysPressed as a parameter
        this.moving = false;
        let nextX = this.x;
        let nextY = this.y;
        this.#delta = (timestamp - this.#lastTimestamp)/1000;
        if(!this.#delta){
            this.#delta = 1;
        }
        this.#lastTimestamp = timestamp;

        const isDiagonal = (keysPressed.up || keysPressed.down) && (keysPressed.left || keysPressed.right);
        const adjustment = isDiagonal ? DIAGONAL_ADJUSTMENT : 1;
        const cSpeed = this.#speed * adjustment * this.#delta;
        if (keysPressed.up) {
            this.direction = directions.up;
            nextY -= cSpeed;
            this.moving = true;
        }
        if (keysPressed.down) {
            this.direction = directions.down;
            nextY += cSpeed;
            this.moving = true;
        }
        if (keysPressed.left) {
            this.direction = directions.left;
            nextX -= cSpeed;
            this.moving = true;
        }
        if (keysPressed.right) {
            this.direction = directions.right;
            nextX += cSpeed;
            this.moving = true;
        }

        this.nextX = nextX;
        this.nextY = nextY;
    }

    update(timestamp, keysPressed) {  // Pass keysPressed here as well
        this.move(keysPressed, timestamp);
      
        if (!this.checkRockCollision(this.nextX, this.nextY, Chicken.frameWidth, Chicken.frameHeight) &&
            this.#checkWorldBounds(this.nextX, this.nextY)) {
            this.x = this.nextX;
            this.y = this.nextY;
        }
        if (this.moving && timestamp - this.lastFrameTime >= Chicken.frameInterval) {
            this.frameIndex = (this.frameIndex + 1) % Chicken.numberOfFrames;
            this.lastFrameTime = timestamp;
        } else if (!this.moving) {
            this.frameIndex = 1;
        }
    }

    #checkWorldBounds(nextX, nextY) {
        return nextX >= 0 && nextX <= worldWidth - Chicken.frameWidth &&
            nextY >= 0 && nextY <= worldHeight - Chicken.frameHeight;
    }

    draw(camera, ctx) {
        const sx = this.frameIndex * Chicken.frameWidth;
        const sy = this.direction * Chicken.frameHeight;
        // draw shadow
        ctx.beginPath();
        ctx.fillStyle = "#1a1a1a ";
        ctx.arc(this.getCenter().x - camera.x, this.getCenter().y - camera.y, Chicken.halfWidth*.5, 0, 2 * Math.PI); // 2 * Math.PI for a full circle
        ctx.fill();
        // end shadow
        ctx.drawImage(
            Chicken.chickenSprite,
            sx,
            sy + 1,//+1 to fix a tiny little edge of the spritesheet from showing a prior frame
            Chicken.frameWidth,
            Chicken.frameHeight,
            this.x - camera.x,
            this.y - camera.y,
            Chicken.frameWidth,
            Chicken.frameHeight
        );
    }

    checkCollision(zombie) {
        if(!zombie.isActive()){
            return;
        }
        // Adjust for the center of each object
        const zombieCenterX = zombie.getCenter().x;
        const zombieCenterY = zombie.getCenter().y;
        const chickenCenterX = this.getCenter().x;
        const chickenCenterY = this.getCenter().y;

        // Calculate the distance squared between centers
        const dx = zombieCenterX - chickenCenterX;
        const dy = zombieCenterY - chickenCenterY;
        const distanceSquared = (dx * dx) + (dy * dy);

        // Define collision threshold based on half-widths
        const collisionThresholdSquared = (Zombie.halfWidth +  Chicken.halfWidth) ** 2;
        if(isNaN(distanceSquared)){
            throw new Error("distance squared is nan")
        }
        if(isNaN((collisionThresholdSquared))){
            throw new Error("Collision Threshold is nan")
        }
        //console.log("distance", distanceSquared, collisionThresholdSquared, collisionThresholdSquared*.25)
        let collided = distanceSquared < (collisionThresholdSquared * .25)
       
        // using percentage of threshold for less aggressive collision
        return collided
    }
}
