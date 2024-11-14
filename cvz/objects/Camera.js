// Camera.js
class Camera {
    constructor(worldWidth, worldHeight, canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    update(targetX, targetY) {
        this.x = Math.min(Math.max(targetX - this.canvasWidth / 2, 0), this.worldWidth - this.canvasWidth);
        this.y = Math.min(Math.max(targetY - this.canvasHeight / 2, 0), this.worldHeight - this.canvasHeight);
    }
}
