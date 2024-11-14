// ui.js

class UIManager {
    static buttonWidth = 100;
    static rightMargin = 10;
    canvasWidth = 0;
    canvasHeight = 0;
    canvasHalfHeight = 0;
    canvasHalfWidth = 0;
    eggIconPosition = {x:0,y:0};
    constructor() {
        const uiCanvas = document.getElementById("uiCanvas");
        if (uiCanvas) {
            // @ts-ignore
            this.uiCtx = uiCanvas.getContext("2d");
            // @ts-ignore
            this.canvasWidth = uiCanvas.width;
            // @ts-ignore
            this.canvasHeight = uiCanvas.height;
            this.canvasHalfWidth = this.canvasWidth * .5;
            this.canvasHalfHeight = this.canvasHeight * .5;
            this.eggIconPosition = { x: this.canvasHalfWidth - 16, y: this.canvasHeight - 48 };
            uiCanvas.addEventListener('click', (e) => {
                const rect = uiCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                console.log("clicked");
            
                
                // Check if any stat icon is clicked
                Game.getInstance().stats.forEach((stat, index) => {
                    const buttonWidth = 100;    // Updated button width for alignment
                    const buttonHeight = 50;    // Height matching the drawn button rectangle
                    const rightMargin = 10;     // Distance from the right edge

                    const iconX = this.canvasWidth - buttonWidth - rightMargin; // Position based on right margin and button width
                    const iconY = 20 + index * 70; // Same vertical position logic

                    // Debugging information to verify the area of each button
                    console.log(`Stat: ${stat.stat}, X: ${iconX}, Y: ${iconY}, MouseX: ${x}, MouseY: ${y}`);

                    // Check if the click falls within the button's bounding box
                    if (x >= iconX && x <= iconX + buttonWidth && y >= iconY && y <= iconY + buttonHeight) {
                        const cost = Game.getInstance().getUpgradeCost(stat.stat);
                        console.log(`Clicked on ${stat.stat}, Cost: ${cost}, Experience: ${Game.getInstance().getExperience()}`);
                        if (Game.getInstance().getExperience() >= cost) {
                            Game.getInstance().changeExperience(-cost)
                            Game.getInstance().statLevels[stat.stat]++;
                            stat.upgrade(Game.getInstance().statLevels[stat.stat]);
                            Game.getInstance().saveGameData();
                            console.log(`Upgraded ${stat.stat} to level ${Game.getInstance().statLevels[stat.stat]}`);
                        } else {
                            console.log(`Not enough experience for ${stat.stat}. Required: ${cost}, Available: ${Game.getInstance().getExperience()}`);
                        }
                    }
                });

            });
        }
    }
    static abbreviateNumber(value) {
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'k';
        return value.toString();
    }

    #renderGameOverScreen() {
        if (Game.getInstance().endScore > -1 && this.uiCtx) {
            this.uiCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.uiCtx.fillStyle = 'red';
            this.uiCtx.font = '24px Arial';
            this.uiCtx.textAlign = 'center';
            const message = `You lose\nScore: ${Game.getInstance().endScore}\nPress 'Enter' to Play again`;
            const lines = message.split("\n");

            lines.forEach((line, index) => {
                this.uiCtx.fillText(line, this.canvasHalfWidth, this.canvasHalfHeight + index * 30);
            });
        }
    }

    https:    #renderStatUpgrades() {
        const stats = [
            { name: "Egg Radius", stat: "explosionRadius" },
            { name: "Lifetime", stat: "lifetime" },
            { name: "Damage", stat: "damage" },
            { name: "Cooldown", stat: "cooldown" }
        ];

        const buttonWidth = 100; // Adjusted width for snug text wrap
        const rightMargin = 10;  // Margin from the right edge

        stats.forEach((stat, index) => {
            const x = this.canvasWidth - buttonWidth - rightMargin; // Position 10 pixels from the right edge
            const y = 20 + index * 70;        // Spacing between buttons

            const cost = Game.getInstance().getUpgradeCost(stat.stat);
            const level = Game.getInstance().statLevels[stat.stat];
           

            // Draw semi-transparent background rectangle for button look
            this.uiCtx.fillStyle = "rgba(50, 50, 50, 0.6)"; // Semi-transparent dark gray
            this.uiCtx.fillRect(x, y - 10, buttonWidth, 50);   // Adjusted background dimensions

            // Display level at the top of the button
            this.uiCtx.fillStyle = "white";
            this.uiCtx.font = '12px Arial';
            this.uiCtx.fillText(`Level: ${level}`, x + 8, y + 2); // Adjusted x-padding

            // Display stat name
            this.uiCtx.fillText(`+${stat.name}`, x + 8, y + 17); // Adjusted x-padding

            // Display upgrade cost, color-coded based on whether the player can afford it
            this.uiCtx.fillStyle = Game.getInstance().getExperience() >= cost ? 'green' : 'red';
            this.uiCtx.fillText(`Cost: ${UIManager.abbreviateNumber(cost)}`, x + 8, y + 32); // Adjusted x-padding
        });
    }
    renderUI() {
        this.uiCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        if (Game.getInstance().isPaused()) {

            this.uiCtx.fillStyle = 'white';
            this.uiCtx.font = '24px Arial';
            this.uiCtx.textAlign = 'center';
            this.uiCtx.fillText("Paused", this.canvasHalfWidth, this.canvasHalfHeight);
            return;
        }
        if (Game.getInstance().endScore > -1) {
            this.#renderGameOverScreen();
            return; // Stop further rendering if game over
        }
        this.uiCtx.fillStyle = 'white';
        this.uiCtx.font = '16px Arial';
        this.uiCtx.textAlign = 'left';
        this.uiCtx.fillText(`Score: ${Game.getInstance().getScore()}`, 10, 20);
        this.uiCtx.fillText(`Experience: ${Game.getInstance().getExperience()}`, 10, 40);
        this.uiCtx.fillText(`Zombies: ${Game.getInstance().getActiveZombies()}`, 10, 60);
        this.uiCtx.fillText(`Level: ${Game.getInstance().getLevel()}`, 10, 80);

        // Cooldown icon
        const currentTime = performance.now();
        const timeSinceLastEgg = currentTime - lastEggTime;
        const cooldownProgress = Math.min(timeSinceLastEgg / Game.stats.eggCooldown.current, 1);
        this.uiCtx.drawImage(eggSprite, this.eggIconPosition.x, this.eggIconPosition.y, 32, 32);

        if (cooldownProgress < 1) {
            this.uiCtx.beginPath();
            this.uiCtx.strokeStyle = "rgba(255, 165, 0, 0.8)";
            this.uiCtx.lineWidth = 4;
            this.uiCtx.arc(this.eggIconPosition.x + 16, this.eggIconPosition.y + 18, 16, -Math.PI / 2, -Math.PI / 2 + cooldownProgress * Math.PI * 2);
            this.uiCtx.stroke();
        }

        this.#renderStatUpgrades();
    }

}