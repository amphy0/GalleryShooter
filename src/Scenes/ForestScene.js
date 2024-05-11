let enemies;
let fireRate = 150;
let lastShotTime = 0;
let playerVelocity = 140;
class ForestScene extends Phaser.Scene {
    constructor() {
        super("forestScene");

        this.waves = [
            {zombieCount: 5, soldierCount: 5},
            {zombieCount: 10, soldierCount: 10},
            {zombieCount: 20, soldierCount: 20},
            {zombieCount: 20, soldierCount: 40},
            {zombieCount: 20, soldierCount: 60}
        ]
        
    }

    // Use preload to load art and sound assets before the scene starts running.
    preload() {
        this.load.setPath("./assets/");
        this.load.image("forest_tiles", "tilemap_packed.png");
        this.load.tilemapTiledJSON("map", "Background.json");
        this.load.image("player", "player.png");
        
        this.load.image("hpEmpty", "heartEmpty.png");
        this.load.image("hpHalf", "heartHalf.png");
        this.load.image("hpFull", "heartFull.png");
        this.load.image("bullet", "bullet.png");
        this.load.image("enemyBullet", "enemyBullet.png");

        this.load.setPath('./assets/audio/');
    }

    create() {
        this.map = this.add.tilemap("map", 8, 8, 16, 20);
        this.tileset = this.map.addTilesetImage("tilemap_packed", "forest_tiles")
        this.grassLayer = this.map.createLayer("Ground Layer", this.tileset, 0, 0);
        this.treeLayer = this.map.createLayer("Trees", this.tileset, 0, 0);
        this.grassLayer.setScale(5.0);
        this.treeLayer.setScale(5.0);

        this.player = this.physics.add.sprite(320,730, "player");
        this.playerHP = 5;
        this.player.setCollideWorldBounds(true);

        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        
        this.currentWave = 0;
        this.score = 0;
        this.scoreText = this.add.bitmapText(100, 30, 'kenneyFont', 'Score: ' + this.score, 48).setOrigin(0.5);
        this.healthText = this.add.bitmapText(550, 30, 'kenneyFont', 'HP: ' + this.playerHP, 48).setOrigin(0.5);
        this.highScore = localStorage.getItem('highscore') || 0;

        enemies = this.physics.add.group({collideWorldBounds: false});
        
        this.W_Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.S_Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.A_Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.D_Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.Space_Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.spawnEnemies();
    }

    spawnEnemies(){
        if(this.currentWave < this.waves.length){
            const wave = this.waves[this.currentWave];
            const zombies =  wave.zombieCount;
            const soldiers = wave.soldierCount;
            let spawnedZ = 0;
            let spawnedS = 0;

            this.spawnTimer = this.time.addEvent({
                delay: 1500,
                callback: () => {
                    if(spawnedZ < zombies && spawnedS < soldiers) {
                        this.spawnZ();
                        this.spawnS();
                        spawnedZ++;
                        spawnedS++;
                    }
                    else{
                        if(spawnedS < soldiers) {
                            this.spawnS();
                            spawnedS++;
                        }
                        else
                        {
                            this.currentWave++;
                            this.spawnTimer.remove();
                            this.time.addEvent({
                                delay: 4500,
                                callback: this.spawnEnemies,
                                callbackScope: this
                            });
                        }
                    }
                },
                loop: true
            });
        }
        else {
            this.time.addEvent({
                delay:15000,
                callback: () => {
                    this.updateScore();
                    this.scene.start('gameOver');
                }
            })
        }
    }

    spawnS(){
        const bounds = this.physics.world.bounds;
        const posX = Phaser.Math.Between(bounds.x + 150, bounds.x + bounds.width-150);
        const enemy = this.physics.add.sprite(posX, bounds.y-30, 'soldier');
        enemy.hp = 1;

        enemies.add(enemy);
        enemy.body.velocity.y = 30;
        this.enemyShootBullet(enemy);
        const bulletTimer = this.time.addEvent({
            delay: 2000,
            callback: () => {
                this.enemyShootBullet(enemy);
            },
            loop: true
        });
    }
    spawnZ(){
        const bounds = this.physics.world.bounds;
        const posX = Phaser.Math.Between(bounds.x + 150, bounds.x + bounds.width-150);
        const enemy = this.physics.add.sprite(posX, bounds.y-30, 'zombie');
        enemy.hp = 1;

        enemies.add(enemy);
        enemy.body.velocity.y = 30;
    }

    shootBullet(){
        const currentTime = this.time.now;
        if(currentTime - lastShotTime >= fireRate) {
            const bullet = this.bullets.create(this.player.x, this.player.y, "bullet");
            //this.sound.play('bulletSound');
            bullet.setVelocityY(-400);
            bullet.body.onWorldBounds = true;
            bullet.body.world.on('worldbounds', ()=>{
                bullet.destroy();
            });
            lastShotTime = currentTime;
        }
    }
    enemyShootBullet(enemy){
        if(enemy.hp > 0){
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocityY(300);
            bullet.body.onWorldBounds = true;
            bullet.body.world.on('worldbounds', ()=>{
                bullet.destroy();
            });
        }
    }

    bulletHitEnemy(bullet, enemy){
        if(bullet.texture.key === 'bullet'){
            enemy.hp -= 1;
        }
        if(enemy.hp <= 0){
            this.score += 100;
            enemy.destroy();
        }
        bullet.destroy();
    }

    bulletHitPlayer(player, bullet){
        bullet.destroy();
        if(bullet.texture.key === 'enemyBullet'){
             this.playerHP -= 1;
        }
        if(this.playerHP <= 0){
            this.scene.start('gameOver');
        }
    }

    zombieTouchPlayer(player, enemy) {
        enemy.destroy();
        this.playerHP--;
        if(this.playerHP <= 0){
            this.scene.start('gameOver');
        }
    }

    updateScore(){
        if(this.score > this.highScore){
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);

            this.registry.set('currentScore', this.score);
            this.registry.set('highScore', this.highScore);
        }
    }

    update() {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        if(this.W_Key.isDown){
            this.player.setVelocityY(-playerVelocity);
        }
        if(this.A_Key.isDown){
            this.player.setVelocityX(-playerVelocity);
        }
        if(this.S_Key.isDown){
            this.player.setVelocityY(playerVelocity);
        }
        if(this.D_Key.isDown){
            this.player.setVelocityX(playerVelocity);
        }
        if(Phaser.Input.Keyboard.JustDown(this.Space_Key)){
            this.shootBullet();
        }

        this.physics.overlap(this.bullets, enemies, this.bulletHitEnemy, null, this);
        this.physics.overlap(this.enemyBullets, this.player, this.bulletHitPlayer, null, this);
        this.physics.overlap(this.player, enemies, this.bulletHitPlayer, null, this);
        this.scoreText.setText("Score: " + this.score);
        this.healthText.setText("HP: " + this.playerHP);

        if(this.playerHP <= 0){
            this.updateScore();
            this.scene.start('gameOver');
        }
    }

}