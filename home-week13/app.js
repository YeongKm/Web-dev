// Utility Functions
function loadTexture(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
    });
}

class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach((l) => l(message, payload));
        }
    }
    clear() {
        this.listeners = {};
    }
}

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    GAME_END_LOSS: "GAME_END_LOSS",
    GAME_END_WIN: "GAME_END_WIN",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
    KEY_EVENT_METEOR: "KEY_EVENT_METEOR",
};

let heroImg, enemyImg, lifeImg, laserImg, canvas, ctx, deadImg, bossImg, shieldImg, meteorImg, laserRedImg, laserBlueImg, laserGreenImg, bossLaserImg;
let gameObjects = [], hero, eventEmitter = new EventEmitter();
let currentStage = 0;
let gameLoopId = null;
let stageTransitioning = false;
let shieldDropCount = 0;

const stages = [
    { enemyRows: 3, enemyCols: 5, isBossStage: false }, // Stage 1
    { enemyRows: 4, enemyCols: 6, isBossStage: false }, // Stage 2
    { enemyRows: 5, enemyCols: 8, isBossStage: false }, // Stage 3
    { isBossStage: true }, // Boss Stage
];

// Classes
class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;
        this.type = "";
        this.width = 0;
        this.height = 0;
        this.img = undefined;
    }
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }
    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}

function intersectRect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

class Hero extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 99;
        this.height = 75;
        this.type = "Hero";
        this.life = 3;
        this.shieldCount = 0;
        this.points = 0;
        this.cooldown = 0;
        this.gauge = 0;       
        this.gaugeMax = 1000; 
        this.weaponType = 0; // 0=Red, 1=Blue, 2=Green 무기 타입 추가
        this.sideHeroes = [
            new SideHero(this.x - 50, this.y + 20),
            new SideHero(this.x + this.width + 10, this.y + 20),
        ];
    }
    clampPosition() {
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height - this.height) this.y = canvas.height - this.height;
    }
    decrementLife() {
        if (this.shieldCount > 0) {
            this.shieldCount--;
            return;
        }
        this.life--;
        if (this.life === 0) {
            this.dead = true;
        }
    }
    incrementPoints() {
        this.points += 100;
    }
    incrementGauge(amount) {
        this.gauge += amount;
        if (this.gauge > this.gaugeMax) {
            this.gauge = this.gaugeMax;
        }
    }
    canFire() {
        return this.cooldown === 0;
    }
    fire() {
        if (!this.canFire()) return;
        let laser;
        let chosenImg;
        if (this.weaponType === 0) {
            // Red Laser
            chosenImg = laserRedImg;
            laser = new Laser(this.x + 45, this.y - 10, 1, 1, chosenImg);
            this.cooldown = 500;
        } else if (this.weaponType === 1) {
            // Blue Laser
            chosenImg = laserBlueImg;
            laser = new Laser(this.x + 45, this.y - 10, 1, 1, chosenImg);
            this.cooldown = 300;
        } else if (this.weaponType === 2) {
            // Green Laser
            chosenImg = laserGreenImg;
            laser = new Laser(this.x + 45, this.y - 10, 2, 2, chosenImg);
            this.cooldown = 500;
        }
        gameObjects.push(laser);
        let id = setInterval(() => {
            if (this.cooldown > 0) {
                this.cooldown -= 100;
            } else {
                clearInterval(id);
            }
        }, 100);
    }
    
    updateSideHeroes() {
        this.sideHeroes[0].x = this.x - 50;
        this.sideHeroes[0].y = this.y + 20;
        this.sideHeroes[1].x = this.x + this.width + 10;
        this.sideHeroes[1].y = this.y + 20;
    }
    destroy() {
        this.sideHeroes.forEach((sideHero) => sideHero.destroy());
        this.dead = true;
    }
    draw(ctx) {
        super.draw(ctx);
        this.sideHeroes.forEach((sideHero) => sideHero.draw(ctx));
        if (this.shieldCount > 0) {
            ctx.font = "20px Arial";
            ctx.fillStyle = "cyan";
            ctx.textAlign = "center";
            ctx.fillText(`Shield: ${this.shieldCount}`, this.x + this.width / 2, this.y - 10);
        }
    }
    canUseMeteor() {
        return this.gauge >= this.gaugeMax;
    }
}

class SideHero extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 50;
        this.height = 40;
        this.type = "SideHero";
        this.img = heroImg;
        this.laserInterval = setInterval(() => {
            if (!this.dead) {
                // SideHero는 기본 Red Laser만 발사
                let laser = new Laser(this.x + this.width / 2, this.y - 10, 1, 1);
                gameObjects.push(laser);
            }
        }, 1200);
    }

    destroy() {
        clearInterval(this.laserInterval);
        this.dead = true;
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = "Enemy";
        let id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 15;
            } else {
                clearInterval(id);
            }
        }, 300);
    }
}

class ShieldItem extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 32;
        this.height = 32;
        this.type = 'ShieldItem';
        this.img = shieldImg;
        let id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

class Boss extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 150;
        this.height = 100;
        this.type = "Boss";
        this.life = 20; // 총 라이프 20
        this.img = bossImg;

        let moveId = setInterval(() => {
            if (!this.dead) {
                this.x += (Math.random() > 0.5 ? 50 : -50);
                this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
            } else {
                clearInterval(moveId);
            }
        }, 300);

        let attackId = setInterval(() => {
            if (!this.dead) {
                this.shootLasers();
            } else {
                clearInterval(attackId);
            }
        }, 1000);
    }

    shootLasers() {
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;
        let centralLaser = new BossLaser(centerX, bottomY, 0, 20);
        gameObjects.push(centralLaser);

        let leftLaser = new BossLaser(centerX, bottomY, -10, 20);
        gameObjects.push(leftLaser);

        let rightLaser = new BossLaser(centerX, bottomY, 10, 20);
        gameObjects.push(rightLaser);
    }

    // damage만큼 라이프 감소
    decrementLife(damage) {
        this.life -= damage;
        if (this.life <= 0) {
            this.dead = true;
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(`Boss HP: ${this.life}`, this.x + this.width / 2, this.y - 10);
    }
}

class BossLaser extends GameObject {
    constructor(x, y, vx=0, vy=20) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'BossLaser';
        this.vx = vx;
        this.vy = vy;
        this.img = bossLaserImg; // 보스 레이저 이미지 설정
        let id = setInterval(() => {
            if (this.y < canvas.height && this.x > 0 && this.x < canvas.width) {
                this.y += this.vy;
                this.x += this.vx;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

// Laser 클래스 수정: 이미지 인자를 받을 수 있게 함
class Laser extends GameObject {
    constructor(x, y, damage=1, penetration=1, img=null) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'Laser';
        // img가 지정되지 않으면 기본 레이저 (red) 사용
        this.img = img || laserRedImg;
        this.damage = damage;
        this.penetration = penetration;
        let id = setInterval(() => {
            if (this.y > 0) {
                this.y -= 30;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

class Meteor extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 80;
        this.height = 80;
        this.type = 'Meteor';
        this.img = meteorImg;
        let id = setInterval(() => {
            if (this.y < canvas.height) {
                this.y += 30; 
                const enemies = gameObjects.filter(go => go.type === 'Enemy' || go.type === 'Boss');
                enemies.forEach(e => {
                    if (intersectRect(this.rectFromGameObject(), e.rectFromGameObject())) {
                        e.dead = true; 
                    }
                });
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

function initStage() {
    gameObjects = gameObjects.filter(go => go.type === "Hero" || go.type === "SideHero");
    const stageConfig = stages[currentStage];
    shieldDropCount = 0; 
    if (stageConfig.isBossStage) {
        const boss = new Boss(canvas.width / 2 - 75, 50);
        gameObjects.push(boss);
    } else {
        const enemyCount = stageConfig.enemyRows * stageConfig.enemyCols;
        for (let i = 0; i < enemyCount; i++) {
            const x = Math.random() * (canvas.width - 98);
            const y = - (Math.random() * 300 + 50);
            const enemy = new Enemy(x, y);
            enemy.img = enemyImg;
            gameObjects.push(enemy);
        }
    }

    hero.x = canvas.width / 2 - 45;
    hero.y = canvas.height - canvas.height / 4;
    hero.updateSideHeroes();
}

function initGame() {
    currentStage = 0; 
    gameObjects = [];
    createHero();
    initStage();
}

function meteorStrike() {
    if (!hero.canUseMeteor()) return;
    hero.gauge = 0; 
    for (let i = 0; i < 3; i++) {
        const x = Math.random() * (canvas.width - 80);
        const y = -100;
        const meteor = new Meteor(x, y);
        gameObjects.push(meteor);
    }
}

// 충돌 처리 변경: Green 레이저 관통 처리
eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    if (second.type === "Boss") {
        // 보스일 경우 life를 레이저 damage만큼 감소
        const damage = first.damage; // green=2, red/blue=1 이미 설정됨
        second.decrementLife(damage);
        hero.incrementPoints();
        hero.incrementGauge(damage === 2 ? 200 : 100);

        // 레이저 처리
        if (damage === 2) {
            // Green laser: 관통
            first.penetration -= 1;
            if (first.penetration <= 0) {
                first.dead = true;
            }
        } else {
            // Red, Blue laser: 한 마리 제거 후 소멸
            first.dead = true;
        }

        // 보스가 죽었는지 확인
        if (second.dead && isEnemiesDead()) {
            endStage();
        }
    } else {
        // 일반 적일 경우 기존 로직 유지
        second.dead = true;
        hero.incrementPoints();
        hero.incrementGauge(first.damage === 2 ? 200 : 100);
        if (second.type !== 'Boss') {
            if (shieldDropCount < 2 && Math.random() < 0.2) {
                shieldDropCount++;
                const shieldItem = new ShieldItem(second.x, second.y);
                gameObjects.push(shieldItem);
            }
        }

        if (first.damage === 2) {
            first.penetration -= 1;
            if (first.penetration <= 0) {
                first.dead = true;
            }
        } else {
            first.dead = true;
        }

        if (isEnemiesDead()) {
            endStage();
        }
    }
});

eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    if (enemy.type === "Boss" || enemy.type === "BossLaser") {
        hero.decrementLife();
    } else if (enemy.type === "ShieldItem") {
        hero.shieldCount++;
        enemy.dead = true;
    } else {
        enemy.dead = true;
        hero.decrementLife();
    }
    if (isHeroDead()) {
        eventEmitter.emit(Messages.GAME_END_LOSS);
    } else if (isEnemiesDead()) {
        endStage();
    }
});

function isHeroDead() {
    return hero.life <= 0;
}

function isEnemiesDead() {
    return gameObjects.filter((go) => (go.type === "Enemy" || go.type === "Boss") && !go.dead).length === 0;
}

function endStage() {
    stageTransitioning = true;
    clearInterval(gameLoopId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (stages[currentStage].isBossStage) {
        displayMessage(`Boss Defeated!`, "green");
    } else {
        displayMessage(`Stage ${currentStage+1} Clear!`, "green");
    }

    setTimeout(() => {
        currentStage++;
        if (currentStage < stages.length) {
            initStage();
            stageTransitioning = false;
            gameLoopId = setInterval(gameLoop, 100);
        } else {
            eventEmitter.emit(Messages.GAME_END_WIN);
        }
    }, 2000);
}

eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
});

eventEmitter.on(Messages.GAME_END_LOSS, () => {
    endGame(false);
});

function endGame(win) {
    clearInterval(gameLoopId);
    // 게임 종료 후 gameEnded = true 설정
    gameEnded = true; 
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (win) {
            displayMessage("Victory!!! Press [Enter] to start a new game", "green");
        } else {
            displayMessage("You Died!!! Press [Enter] to restart", "red");
        }
    }, 200);
}

function resetGame() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
    }
    eventEmitter.clear(); 
    stageTransitioning = false; 
    gameEnded = false; // 재시작 시 상태 초기화
    if (hero) {
        hero.sideHeroes.forEach(sh => sh.destroy());
        hero = null;
    }
    gameObjects = [];
    initGame();
    gameLoopId = setInterval(gameLoop, 100);
}


function createHero() {
    hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
    hero.img = heroImg;
    gameObjects.push(hero);
    hero.sideHeroes.forEach((sideHero) => gameObjects.push(sideHero));
}

// Rendering and Updates
function gameLoop() {
    if (stageTransitioning) return; 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGameObjects(ctx);
    drawPoints();
    drawLife();
    drawGauge();
    drawStageInfo();
    updateGameObjects();
}

function drawGameObjects(ctx) {
    gameObjects.forEach((go) => go.draw(ctx));
}

function updateGameObjects() {
    const enemies = gameObjects.filter((go) => go.type === "Enemy" || go.type === "Boss");
    const lasers = gameObjects.filter((go) => go.type === "Laser");
    const bossLasers = gameObjects.filter((go) => go.type === "BossLaser");
    const shieldItems = gameObjects.filter((go) => go.type === "ShieldItem");
    const meteors = gameObjects.filter((go) => go.type === "Meteor");

    if (hero && !hero.dead) {
        hero.clampPosition();
    }

    // 레이저와 적 충돌
    lasers.forEach((laser) => {
        enemies.forEach((enemy) => {
            if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, { first: laser, second: enemy });
            }
        });
    });

    // 보스 레이저와 히어로 충돌
    bossLasers.forEach(bLaser => {
        if (hero && !hero.dead && intersectRect(hero.rectFromGameObject(), bLaser.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy: bLaser });
            bLaser.dead = true;
        }
    });

    // 적/아이템과 히어로 충돌
    enemies.forEach(enemy => {
        if (hero && !hero.dead && intersectRect(hero.rectFromGameObject(), enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    });

    shieldItems.forEach(item => {
        if (hero && !hero.dead && intersectRect(hero.rectFromGameObject(), item.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy: item });
        }
    });

    gameObjects = gameObjects.filter((go) => !go.dead);
}

function drawPoints() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(`Points: ${hero.points}`, 10, canvas.height - 20);
}

function drawLife() {
    const START_POS = canvas.width - 180;
    for (let i = 0; i < hero.life; i++) {
        ctx.drawImage(lifeImg, START_POS + 45 * (i + 1), canvas.height - 37);
    }
}

function drawGauge() {
    const gaugeWidth = 200;
    const gaugeHeight = 20;
    const x = 10;
    const y = 50;
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, gaugeWidth, gaugeHeight);
    let fillWidth = (hero.gauge / hero.gaugeMax) * gaugeWidth;
    ctx.fillStyle = "blue";
    ctx.fillRect(x, y, fillWidth, gaugeHeight);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, gaugeWidth, gaugeHeight);

    ctx.font = "16px Arial";
    ctx.fillStyle = "yellow";
    ctx.textAlign = "left";
    ctx.fillText("Meteor Gauge", x, y - 5);
}

function drawStageInfo() {
    const x = 10;
    const y = 80;
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    if (stages[currentStage].isBossStage) {
        ctx.fillText("Boss Stage", x, y);
    } else {
        ctx.fillText(`Stage ${currentStage+1}`, x, y);
    }
}

function displayMessage(message, color) {
    ctx.font = "30px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

window.addEventListener('keydown', (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === "Enter") {
        console.log("Enter key pressed");
        // 게임 종료 상태일 때만 엔터키로 재시작
        if (gameEnded) {
            resetGame();
        }
        return;
    }

    if (!hero || hero.dead) return;

    if (e.key === "ArrowUp") {
        hero.y -=20 ;
        hero.updateSideHeroes();
    } else if (e.key === "ArrowDown") {
        hero.y += 20;
        hero.updateSideHeroes();
    } else if (e.key === "ArrowLeft") {
        hero.x -= 20;
        hero.updateSideHeroes();
    } else if (e.key === "ArrowRight") {
        hero.x += 20;
        hero.updateSideHeroes();
    } else if (e.key === " ") {
        if (hero.canFire()) hero.fire();
    } else if (e.key.toLowerCase() === "m") {
        eventEmitter.emit(Messages.KEY_EVENT_METEOR);
    } else if (e.key.toLowerCase() === "r") {
        hero.weaponType = (hero.weaponType + 1) % 3;
    }
});
eventEmitter.on(Messages.KEY_EVENT_METEOR, () => {
    if (hero && hero.canUseMeteor()) {
        meteorStrike();
    }
});

window.onload = async () => {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    heroImg = await loadTexture("assets/player.png");
    enemyImg = await loadTexture("assets/enemyShip.png");
    lifeImg = await loadTexture("assets/life.png");
    bossImg = await loadTexture("assets/enemyShip.png");
    shieldImg = await loadTexture("assets/shield.png");
    meteorImg = await loadTexture("assets/meteor.png");

    laserRedImg = await loadTexture("assets/laserRed.png");
    laserBlueImg = await loadTexture("assets/laserBlue.png");
    laserGreenImg = await loadTexture("assets/laserGreen.png");
    bossLaserImg = await loadTexture("assets/Bosslaser.png"); // 보스 레이저 이미지 로드

    initGame();
    gameLoopId = setInterval(gameLoop, 100);
};