class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    getParticle() {
        let particle = this.particles.find(p => !p.active);
        if (!particle) {
            particle = new Particle(0, 0);
            this.particles.push(particle);
        }
        return particle;
    }

    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = this.getParticle();
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            particle.activate(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
    }

    updateAndDraw(timestamp, camera, ctx) {
        this.particles.forEach(particle => {
            particle.update(timestamp);
            particle.draw(camera,ctx);
        });
    }
}
