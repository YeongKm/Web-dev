function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => { 
        resolve(img);
        };
    })
}



function createEnemies(ctx, canvas, enemyImg) {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
    const START_X = (canvas.width - MONSTER_WIDTH) / 2;
    const STOP_X = START_X + MONSTER_WIDTH;

    let y = 0;
    for (let row = MONSTER_TOTAL; row >= 1; row--) {
        const rowStartX = START_X + ((MONSTER_TOTAL - row) * enemyImg.width) / 2;
        
        for (let x = rowStartX; x < rowStartX + row * enemyImg.width; x += enemyImg.width) {
            ctx.drawImage(enemyImg, x, y);
        }
        y += enemyImg.height;
    }
}


window.onload = async() => {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    const heroImg = await loadTexture('assets/player.png')
    const enemyImg = await loadTexture('assets/enemyShip.png')
    const heroChild_leftImg = await loadTexture('assets/player.png')
    const heroChild_rightImg = await loadTexture('assets/player.png')
    const backgroundImg = await loadTexture('assets/starBackground.png')
    const pattern = ctx.createPattern(backgroundImg, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(heroImg, canvas.width/2 - 45, canvas.height - (canvas.height/4));
    ctx.drawImage(heroChild_leftImg, canvas.width/2 -95, canvas.height - (canvas.height/4-10),50,50);
    ctx.drawImage(heroChild_rightImg, canvas.width/2+55, canvas.height - (canvas.height/4-10),50,50);

    createEnemies(ctx, canvas, enemyImg);
    };
