// GameObject.js
class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw(camera) {
        // Placeholder for child classes
    }

    update() {
        // Placeholder for child classes
    }

    checkRockCollision(nextX, nextY, objectWidth, objectHeight) {
        return (Rock.rocks||[]).some(rock => {
            const dx = nextX + (objectWidth * 0.5) - rock.x;
            const dy = nextY + (objectHeight * 0.5) - rock.y;
            const distance = dx * dx + dy * dy;
            const r = rock.radius + (objectWidth * 0.5);
            return distance < r * r;
        });
    }
}
