console.log("loaded main");
'use strict';

const rockSprite = new Image();
rockSprite.src = "assets/rock.png";
const grassSprite = new Image();
grassSprite.src = "assets/tileable_grass_00.png";
const eggSprite = new Image();
eggSprite.src = 'assets/egg.png';
const chickenSprite = new Image();
chickenSprite.src = 'assets/chicken.png';
const zombieSprite = new Image();
zombieSprite.src = 'assets/zombie-NESW.png';

const directions = { up: 0, right: 1, down: 2, left: 3 };

const worldWidth = 2000;
const worldHeight = 2000;
const DIAGONAL_ADJUSTMENT = 1 / Math.sqrt(2);

let lastEggTime = 0;






const levelCenterX = worldWidth / 2;
const levelCenterY = worldHeight / 2;




// Camera, chicken, and zombie setup


const keysPressed = { up: false, down: false, left: false, right: false };

class Game {
    #baseUpgradeCost = 25;
    #upgradeGrowthFactor = 1.2;
    #score = 0;
    #experience = 0;
    #zombiesDefeated = 0;
    #zombiesActive = 0;
    #level = 1;
    #paused = false;
    endScore = -1;
    #zombiesForLevel = 10;
    #gameCanvas = {
        canvas: null,
        ctx: null
    };
    #bgCanvas = {
        canvas: null,
        ctx: null
    };
    static stats = {
        levels: {
            explosionRadius: 0,
            lifetime: 0,
            damage: 0,
            cooldown: 0,
        },
        eggCooldown: {
            initial: 3000,
            current: 3000
        },
        eggExplosionRadius: {
            initial: 50,
            current: 50
        },
        eggLifetime: {
            initial: 5000,
            current: 5000
        },
        eggDamage: {
            initial: 1,
            current: 1
        }
    };

    statLevels = {
        explosionRadius: 0,
        lifetime: 0,
        damage: 0,
        cooldown: 0,
    };
    #chicken = null;
    static #_instance;
    static getInstance() {
        if (!this.#_instance) {
            console.log("creating instance");
            this.#_instance = new Game();
            Egg.eggSprite = eggSprite;
            Zombie.zombieSprite = zombieSprite;
            Chicken.chickenSprite = chickenSprite;
            Rock.rockSprite = rockSprite;

        }
        return this.#_instance;
    }
    #camera;
    #uiManager = new UIManager();
    #particleSystem = new ParticleSystem();
    #props = {
        SCORE: "score",
        EXPERIENCE: "experience",
        LEVEL: "level",
        STAT_LEVELS: "statLevels",
        REMAINING_ZOMBIES: "remainingZombies"
    };
    constructor() {
        this.loadCanvases();
        this.#loadGameData();
        Rock.spawnRocks();
        this.#camera = new Camera(worldWidth, worldHeight, this.#gameCanvas.width, this.#gameCanvas.height);

        this.#chicken = new Chicken(levelCenterX, levelCenterY);
        setTimeout(()=>{
            console.log("zfl and level", this.#zombiesForLevel, this.#level);
            Zombie.spawnZombies(this.#zombiesForLevel, this.#level
            ); // first wave
            const spawnInterval = Math.max(10000, - (this.#level * 50), 250);
            // subsequent waves
            setInterval(() => {
                Zombie.spawnZombies(this.#zombiesForLevel, this.#level
                );
            }, spawnInterval);
        }, 50)
        
    }
    togglePause() {
        this.#paused = !this.#paused;
    }
    getUpgradeCost(stat) {
        return Math.floor(this.#baseUpgradeCost * Math.pow(this.#upgradeGrowthFactor, this.statLevels[stat]));
    }
    getParticleSystem() {
        return this.#particleSystem;
    }
    getChickenCenter() {
        return this.#chicken.getCenter()
    }
    getZombieStats(){
        return {
            active: this.#zombiesActive,
            defeated: this.#zombiesDefeated,
            combined: this.#zombiesActive + this.#zombiesDefeated
        }
    }
    loadCanvases() {
        // @ts-ignore
        this.#gameCanvas.canvas = document.getElementById("gameCanvas");
        // @ts-ignore
        this.#gameCanvas.ctx = this.#gameCanvas.canvas.getContext("2d");
        // @ts-ignore
        this.#gameCanvas.width = this.#gameCanvas.canvas.width;
        this.#gameCanvas.halfWidth = this.#gameCanvas.width * .5;
        // @ts-ignore
        this.#gameCanvas.height = this.#gameCanvas.canvas.height;
        this.#gameCanvas.halfHeight = this.#gameCanvas.height * .5;

        // @ts-ignore
        this.#bgCanvas.canvas = document.getElementById("bgCanvas");
        // @ts-ignore
        this.#bgCanvas.ctx = this.#bgCanvas.canvas.getContext("2d");
        // @ts-ignore
        this.#bgCanvas.width = this.#bgCanvas.canvas.width;
        this.#bgCanvas.halfWidth = this.#bgCanvas.width * .5;
        // @ts-ignore
        this.#bgCanvas.height = this.#bgCanvas.canvas.height;
        this.#bgCanvas.halfHeight = this.#bgCanvas.height * .5;
        console.log("loaded canvases");
    }
    getCanvasHalfWidth() {
        return this.#gameCanvas.halfWidth;
    }
    getZombiesForLevel() {
        return this.#zombiesForLevel;
    }
    getLevel() {
        return this.#level;
    }
    getExperience() {
        return this.#experience;
    }
    getScore() {
        return this.#score;
    }
    isPaused() {
        return this.#paused;
    }
    getActiveZombies() {
        return this.#zombiesActive;
    }
    changeExperience(change) {
        if (change + this.#experience >= 0) {
            this.#experience += change;
        }
    }
    resetData() {
        for (let key in this.#props) {
            console.log("prop key", key);
            localStorage.removeItem(this.#props[key]);
        }

    }
    #loadGameData() {
        this.#score = parseInt(localStorage.getItem(this.#props.SCORE) || "") || 0;
        this.#experience = parseInt(localStorage.getItem(this.#props.EXPERIENCE) || "") || 0;
        this.#level = parseInt(localStorage.getItem(this.#props.LEVEL) || "") || 1;
        try {
            let data = JSON.parse(localStorage.getItem(this.#props.STAT_LEVELS) || "{}");
            for (let key in this.statLevels) {
                if (data[key]) {
                    this.statLevels[key] = data[key];
                    for(let stat of this.stats){
                        console.log("loading stat", stat)
                        if(stat.stat == key){
                            stat.upgrade(data[key])
                        }
                    }
                }
            }
            console.log("state levels", this.statLevels)
        }
        catch (e) {
            console.log("Error loading stat levels", e);
        }
        let remainingZombies = parseInt(localStorage.getItem(this.#props.REMAINING_ZOMBIES) || "") || 0;
        console.log("Loaded remaining zombies", remainingZombies);
        if (remainingZombies > 0) {
            this.#zombiesForLevel = remainingZombies;
        }
        else {
            this.#zombiesForLevel = 10 * this.#level;
        }
        console.log("zombies for level", this.#zombiesForLevel);
    }
    saveGameData() {
        // @ts-ignore
        localStorage.setItem(this.#props.SCORE, this.#score);
        // @ts-ignore
        localStorage.setItem(this.#props.EXPERIENCE, this.#experience);
        // @ts-ignore
        localStorage.setItem(this.#props.LEVEL, this.#level);
        localStorage.setItem(this.#props.STAT_LEVELS, JSON.stringify(this.statLevels));
        let remainingZombies = Math.max(this.#zombiesForLevel - this.#zombiesDefeated, 0);
        console.log("saving remaining zombies", remainingZombies);
        // @ts-ignore
        localStorage.setItem(this.#props.REMAINING_ZOMBIES, remainingZombies);
    }
    updateScoreAndExperience(points, xp) {
        this.#score += points;
        this.#experience += xp;
        this.#zombiesDefeated++;
        this.saveGameData();
    }
    stats = [
        {
            stat: "explosionRadius",
            upgrade: (level) => {
                Game.stats.eggExplosionRadius.current = Math.min(
                    this.upgradeFormulas.explosionRadius(level),
                    this.getCanvasHalfWidth()
                );
                console.log("explosionRadius", Game.stats.eggExplosionRadius.current);
            }
        },
        {
            stat: "lifetime",
            upgrade: (level) => {
                Game.stats.eggLifetime.current = Math.max(
                    this.upgradeFormulas.lifetime(level),
                    500
                );
                console.log("eggLifetime", Game.stats.eggLifetime.current);
            }
        },
        {
            stat: "damage",
            upgrade: (level) => {
                Game.stats.eggDamage.current = this.upgradeFormulas.damage(level);
                console.log("eggDamage", Game.stats.eggDamage.current);
            }
        },
        {
            stat: "cooldown",
            upgrade: (level) => {
                Game.stats.eggCooldown.current = Math.max(this.upgradeFormulas.cooldown(level), 250);
                console.log("eggCooldown", Game.stats.eggCooldown.current);
            }
        }
    ];
    upgradeFormulas = {
            explosionRadius: (level) => Game.stats.eggExplosionRadius.initial + (350 * (1 - Math.exp(-level / 300))),
            // Explosion radius: Starts at eggExplosionRadiusInitial (50), approaches 400 more quickly in early levels.
            // Example values:
            // - Level 1: ~56.8
            // - Level 10: ~96.0
            // - Level 50: ~208.2
            // - Level 100: ~287.3
            // - Level 500: ~392.5
            // - Level 1000: ~399.9 (close to the 400 target)


            lifetime: (level) => 500 + (( Game.stats.eggLifetime.initial - 500) * Math.exp(-level / 250)),
            // Starts at 5000ms and asymptotically approaches 500ms.
            // - Early levels reduce delay significantly, with diminishing returns over time.
            // Example values:
            // - Level 10: ~3562ms
            // - Level 50: ~2147ms
            // - Level 100: ~1450ms
            // - Level 1000: ~503ms (approaching the 500ms limit)

            damage: (level) =>  Game.stats.eggDamage.initial + (100 -  Game.stats.eggDamage.initial) * (1 - Math.exp(-level / 200)),
            // Damage: Starts at eggDamageInitial and asymptotically approaches 100.
            // Example values based on eggDamageInitial = 1:
            // - Level 1: ~1.5
            // - Level 10: ~6.6
            // - Level 50: ~24.3
            // - Level 100: ~44.2
            // - Level 500: ~96.0
            // - Level 1000: ~99.9 (approaching the 100 target)


            cooldown: (level) => 250 + (( Game.stats.eggCooldown.initial - 250) * Math.exp(-level / 250))
            // Starts at 3000ms and asymptotically approaches 250ms.
            // - Early levels make cooldown shorter quickly, with diminishing returns over time.
            // Example values:
            // - Level 10: ~1851ms
            // - Level 50: ~1031ms
            // - Level 100: ~668ms
            // - Level 1000: ~253ms (approaching the 250ms limit)
      
    }
    drawScene(camera) {
        //background
        const tileSize = 512; // Size of the grass tile

        // Determine the top-left corner of the visible background
        const offsetX = camera.x % tileSize;
        const offsetY = camera.y % tileSize;

        // Draw the repeating tiles to fill the visible canvas area
        for (let x = -offsetX; x < this.#bgCanvas.width; x += tileSize) {
            for (let y = -offsetY; y < this.#bgCanvas.height; y += tileSize) {
                // @ts-ignore
                this.#bgCanvas.ctx.drawImage(grassSprite, x, y, tileSize, tileSize);
            }
        }
        //draw rocks
        Rock.drawAll(camera, this.#gameCanvas.ctx);
        //world bounds
        // @ts-ignore
        this.#gameCanvas.ctx.strokeStyle = "black";
        // @ts-ignore
        this.#gameCanvas.ctx.lineWidth = 5;
        // @ts-ignore
        this.#gameCanvas.ctx.strokeRect(-camera.x, -camera.y, worldWidth, worldHeight);
    }
    run(timestamp) {
        // @ts-ignore
        this.#gameCanvas.ctx.clearRect(0, 0, Game.getInstance().#gameCanvas.width, Game.getInstance().#gameCanvas.height);
        if (this.endScore > -1) {
            // @ts-ignore
            this.#gameCanvas.ctx.fillStyle = "black";
            // @ts-ignore
            this.#gameCanvas.ctx.fillRect(0, 0, this.#gameCanvas.width, this.#gameCanvas.height);
            return;
        }
        if (this.#zombiesDefeated >= this.#zombiesForLevel) {
            this.#level++;
            this.saveGameData();
            window.location.reload();
            return;
        }
        if (!this.isPaused()) {
            this.drawScene(this.#camera);
            this.#chicken.update(timestamp, keysPressed);
            // @ts-ignore
            this.#camera.update(this.#chicken.x, this.#chicken.y);
            this.#chicken.draw(this.#camera, this.#gameCanvas.ctx);

            Egg.run(
                timestamp,// frame timestamp
                this.#gameCanvas.ctx, // game context
                Zombie.zombies, // zombie pool
                this.#camera // camera
            );
            Zombie.chase(
                timestamp, // frame timestamp
                this.#chicken, // player reference
                this.#camera, // camera
                this.#gameCanvas.ctx, // game context
                this.#gameCanvas.width,
                this.#gameCanvas.height,
                // callback for zombie being activated
                (activeZombies) => {
                    Game.getInstance().#zombiesActive = activeZombies;
                },
                //callback for zombie colliding with chicken
                () => {
                    //collision with chicken
                    this.endScore = this.#score;
                    this.resetData();
                });

            this.#particleSystem.updateAndDraw(timestamp, this.#camera, this.#gameCanvas.ctx);
        }
        this.#uiManager.renderUI();
        requestAnimationFrame((ts) => Game.getInstance().run(ts));
    }
}




// Handle key events
function handleKeyEvent(e, isKeyDown) {
    switch (e.key.toLowerCase()) {
        case 'w': keysPressed.up = isKeyDown; break;
        case 's': keysPressed.down = isKeyDown; break;
        case 'a': keysPressed.left = isKeyDown; break;
        case 'd': keysPressed.right = isKeyDown; break;
        // toggle pause
        case 'p': isKeyDown && (Game.getInstance().togglePause());

            break;
        // spawn egg
        case ' ': isKeyDown && (() => {
            const now = performance.now();
            if (now - lastEggTime > Game.stats.eggCooldown.current) {
                console.log("spawn egg");
                let cc = Game.getInstance().getChickenCenter();
                console.log("Chicken center", cc);
                Egg.spawn(
                    cc.x,
                    cc.y,
                    Game.stats.eggDamage.current,
                    Game.stats.eggLifetime.current,
                    Game.stats.eggExplosionRadius.current);
                lastEggTime = now;
            }
        })();
            break;
        // reset on lose
        case 'enter':
            isKeyDown && Game.getInstance().endScore > -1 && (() => window.location.reload())();
            break;
    }
}

window.addEventListener('keydown', (e) => handleKeyEvent(e, true));
window.addEventListener('keyup', (e) => handleKeyEvent(e, false));


let loader = setInterval(() => {
    let allLoaded = [chickenSprite, zombieSprite, rockSprite, grassSprite].every(s => s.complete && s.naturalWidth > 0);
    if (allLoaded) {
        clearInterval(loader);
        requestAnimationFrame((ts) => Game.getInstance().run(ts));
    }
}, 50);