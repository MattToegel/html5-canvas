// Rock.js
class Rock extends GameObject {
    static minRadius = 20;
    static maxRadius = 30;
    static minDistanceFromCenter = 200;
    static minRocks = 10;
    static maxRocks = 25;
    static rockSprite;
    static rocks = [];
    constructor(x, y, radius) {
        super(x, y);
        this.radius = radius;
    }

    // Method to draw the rock with scaling based on its radius
    draw(camera, ctx) {
        if (!Rock.rockSprite || !Rock.rockSprite.complete) return;

        const scaledSize = this.radius * 2; // Scale image to fit the rock's radius
        ctx.drawImage(
            Rock.rockSprite,
            0, 0, 320, 320, // Source dimensions from the original image
            this.x - camera.x - this.radius, // Adjust for the rock's center
            this.y - camera.y - this.radius,
            scaledSize, scaledSize // Destination size to match the rock's radius
        );
    }

    // Static method to generate a random rock position with constraints
    static generateRock() {
        let x, y;
        do {
            x = Math.random() * (worldWidth - 100) + 50;
            y = Math.random() * (worldHeight - 100) + 50;
        } while (Math.hypot(x - levelCenterX, y - levelCenterY) < Rock.minDistanceFromCenter);

        const radius = Math.floor(Math.random() * (Rock.maxRadius - Rock.minRadius + 1)) + Rock.minRadius;
        return new Rock(x, y, radius);
    }

    // Static method to populate an array of rocks within the constraints
    static spawnRocks() {
        const rockCount = Math.floor(Math.random() * (Rock.maxRocks - Rock.minRocks + 1)) + Rock.minRocks;
       
        for (let i = 0; i < rockCount; i++) {
            Rock.rocks.push(Rock.generateRock());
        }
    }

    // Static method to draw all rocks in a given array
    static drawAll(camera, ctx) {
        Rock.rocks.forEach(rock => rock.draw(camera, ctx));
    }
}