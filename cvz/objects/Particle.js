class Particle extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.active = false;
        this.lifetime = 300;
        this.spawnTime = 0;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    activate(x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.spawnTime = performance.now();
        this.active = true;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }

    update(timestamp) {
        if (timestamp - this.spawnTime > this.lifetime) {
            this.active = false;
            return;
        }
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(camera, ctx) {
        if (!this.active) return;
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.x - camera.x, this.y - camera.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}
