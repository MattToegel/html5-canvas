class Egg extends GameObject {
    static eggs = [];
    static eggSprite;
    #active = false;
    #explosionTime = 0
    #radius = 5;
    #explosionRadius = 0;
    #lifetime = 0;
    #damage = 0;
    #explosionRadiusSquared = 0;
    constructor(x, y) {
        super(x, y);
    }

    activate(x, y, eggDamage, eggLifetime, eggExplosionRadius) {
        this.x = x;
        this.y = y;
        this.#lifetime = eggLifetime || 5000;
        this.#explosionTime = performance.now() + this.#lifetime;
        this.#explosionRadius = eggExplosionRadius || 50;
        
        this.#damage = eggDamage || 1;
        this.#explosionRadiusSquared = this.#explosionRadius ** 2;
        this.#active = true;
    }

    #explode(zombies) {
        this.#active = false;
        zombies.forEach(zombie => {
            if (!zombie.isActive()) return;
            const dx = (this.x + this.#radius) - (zombie.getCenter().x);
            const dy = (this.y + this.#radius) - (zombie.getCenter().y);
            if (dx * dx + dy * dy < this.#explosionRadiusSquared + 5) {
                zombie.takeDamage(this.#damage);
            }
        });
        Game.getInstance().getParticleSystem().createExplosion(this.x, this.y);
    }
    isActive(){
        return this.#active;
    }
    update(timestamp, zombies) {
        if (this.#active && timestamp > this.#explosionTime) {
            this.#explode(zombies);
        }
    }

    draw(camera, ctx) {
        if (this.isActive()) {
            // Draw explosion radius as a transparent circle
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 0, 0, 0.75)";
            ctx.lineWidth = 2;
            ctx.arc(this.x - camera.x, this.y - camera.y, this.#explosionRadius, 0, Math.PI * 2);
            ctx.stroke();
            // Draw the egg sprite
            ctx.drawImage(
                Egg.eggSprite,
                this.x - camera.x - this.#radius,
                this.y - camera.y - this.#radius,
                this.#radius * 2,
                this.#radius * 2
            );

            // Draw countdown timer as an arc
            const currentTime = performance.now();
            const timeRemaining = Math.max(this.#explosionTime - currentTime, 0);
            const progress = 1 - (timeRemaining / this.#lifetime);

            ctx.strokeStyle = "rgba(255, 165, 0, 0.8)"; // Orange color for countdown
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                this.x - camera.x,
                this.y - camera.y,
                this.#radius + 8,
                -Math.PI / 2,
                -Math.PI / 2 + (Math.PI * 2 * progress)
            );
            ctx.stroke();
        }
    }
    static getEgg() {
        const egg = Egg.eggs.find(e => !e.isActive()) || new Egg(0, 0);
        if (!Egg.eggs.includes(egg)) Egg.eggs.push(egg);
        return egg;
    }
    static spawn(x,y,eggDamage, eggLifetime, eggExplosionRadius){
        const egg = Egg.getEgg();
        egg.activate(x,y,eggDamage, eggLifetime, eggExplosionRadius);
    }
    static run(timestamp, ctx, zombies, camera){
        Egg.eggs.forEach(egg=>{
            if(egg.isActive()){
                egg.update(timestamp, zombies);
                egg.draw(camera, ctx);
            }
        })
    }
}
