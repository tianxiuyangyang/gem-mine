(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const ui = {
    gemCount: document.querySelector('#gem-count'),
    gameDifficulty: document.querySelector('#game-difficulty'),
    healthText: document.querySelector('#health-text'),
    healthFill: document.querySelector('#health-fill'),
    healthHud: document.querySelector('.health-hud'),
    p2HealthHud: document.querySelector('#p2-health-hud'),
    p2HealthText: document.querySelector('#p2-health-text'),
    p2HealthFill: document.querySelector('#p2-health-fill'),
    wave: document.querySelector('#wave-text'),
    inventorySlots: [...document.querySelectorAll('.inventory-slot')],
    p1InventorySlots: [...document.querySelectorAll('.inventory-slot:not(.p2-slot)')],
    p2InventorySlots: [...document.querySelectorAll('.p2-slot')],
    p2Inventory: document.querySelector('#p2-inventory'),
    rescueHud: document.querySelector('#rescue-hud'),
    rescueLabel: document.querySelector('#rescue-label'),
    rescuePercent: document.querySelector('#rescue-percent'),
    rescueFill: document.querySelector('#rescue-fill'),
    hint: document.querySelector('#hint'),
    shop: document.querySelector('#shop'),
    buy: document.querySelector('#buy-cannon'),
    buyHelmet: document.querySelector('#buy-helmet'),
    buyFish: document.querySelector('#buy-fish'),
    buyWall: document.querySelector('#buy-wall'),
    buyCake: document.querySelector('#buy-cake'),
    buyUmbrella: document.querySelector('#buy-umbrella'),
    shopPrices: [...document.querySelectorAll('[data-price]')],
    buffHud: document.querySelector('#buff-hud'),
    buffText: document.querySelector('#buff-text'),
    toast: document.querySelector('#toast'),
    pause: document.querySelector('#pause-screen'),
    resume: document.querySelector('#resume'),
    pauseTutorial: document.querySelector('#pause-tutorial'),
    pauseMenu: document.querySelector('#pause-menu'),
    tutorialReturnPause: document.querySelector('#tutorial-return-pause'),
    tutorialMainMenu: document.querySelector('#tutorial-main-menu'),
    start: document.querySelector('#start-screen'),
    mainMenu: document.querySelector('#main-menu'),
    menuPages: document.querySelector('#menu-pages'),
    menuStart: document.querySelector('#menu-start'),
    menuTwoPlayer: document.querySelector('#menu-two-player'),
    menuSkins: document.querySelector('#menu-skins'),
    menuTutorial: document.querySelector('#menu-tutorial'),
    menuSettings: document.querySelector('#menu-settings'),
    supportCreator: document.querySelector('#support-creator'),
    supportModal: document.querySelector('#support-modal'),
    supportClose: document.querySelector('#support-close'),
    skinPage: document.querySelector('#skins-page'),
    tutorialPage: document.querySelector('#tutorial-page'),
    settingsPage: document.querySelector('#settings-page'),
    skinButtons: [...document.querySelectorAll('.skin-option')],
    menuBacks: [...document.querySelectorAll('[data-menu-back]')],
    toggleShake: document.querySelector('#toggle-shake'),
    toggleMusic: document.querySelector('#toggle-music'),
    toggleSfx: document.querySelector('#toggle-sfx'),
    gameOver: document.querySelector('#game-over'),
    restart: document.querySelector('#restart'),
    gameOverMenu: document.querySelector('#game-over-menu'),
    artifactScreen: document.querySelector('#artifact-screen'),
    artifactOptions: document.querySelector('#artifact-options'),
    difficultyCurrent: document.querySelector('#difficulty-current'),
    difficultySelect: document.querySelector('#difficulty-select'),
    difficultyOptions: [...document.querySelectorAll('.difficulty-option')],
  };

  const TAU = Math.PI * 2;
  const keys = new Set();
  const mouse = { x: 0, y: 0, down: false };
  let dpr = 1;
  let last = 0;
  let started = false;
  let paused = false;
  let gameOver = false;
  let toastTimer = 0;
  let testGemPresses = [];
  let testWeatherPresses = [];
  let testAirdropPresses = [];
  let gameMode = 'single';
  let selectedDifficulty = 'normal';
  let weatherCanvas = null;
  let weatherCtx = null;
  const audio = { context: null, musicEnabled: true, sfxEnabled: true, musicTimer: 0, musicStep: 0 };

  const state = {
    gems: 0,
    inventory: Array(6).fill(null),
    inventory2: Array(6).fill(null),
    player: { x: 0, y: 0, radius: 16, speed: 235, facing: 0, skin: 'peach', health: 100, maxHealth: 100, helmet: false, hitCooldown: 0, trainHitCooldown: 0, stun: 0, knockback: 0, knockbackVX: 0, knockbackVY: 0, knockbackSpin: 0, hitRotation: 0, speedBuff: 0, cannon: null },
    player2: { x: 0, y: 0, radius: 16, speed: 235, facing: Math.PI, skin: 'snow', health: 100, maxHealth: 100, helmet: false, hitCooldown: 0, trainHitCooldown: 0, stun: 0, knockback: 0, knockbackVX: 0, knockbackVY: 0, knockbackSpin: 0, hitRotation: 0, speedBuff: 0, cannon: null, downed: false },
    cannons: [],
    walls: [],
    umbrellas: [],
    debris: [],
    shells: [],
    bullets: [],
    sniperTrails: [],
    gemsOnGround: [],
    particles: [],
    shockwaves: [],
    holyCupTimer: 2,
    trains: [],
    trainTimer: 2,
    verticalTrainTimer: 0,
    trainRound: 0,
    fallingRocks: [],
    gemMine: { x: 175, y: 0, repaired: false, upgraded: false, productionTimer: 3 },
    airdrop: { spawned: false, opened: false, x: 0, y: -100, targetY: 0, opener: null },
    nextEarthquakeAt: 60,
    earthquakeEnd: 0,
    rockTimer: 0,
    weather: null,
    weatherEnd: 0,
    nextWeatherAt: 80,
    weatherCenter: { x: 0, y: 0 },
    weatherDamageTimer: 0,
    rescue: { rescuer: null, target: null, progress: 0 },
    time: 0,
    screenShake: 0,
    reducedMotion: false,
  };

  const MAP_SCALE = 1.5;
  const TRAIN_BASE_SPEED = 58;
  const MONSTER_AMMO_SPEED_FACTOR = 2 / 3;
  const SHOTGUN_BULLET_SPEED = 93 * MONSTER_AMMO_SPEED_FACTOR * 1.8;
  const SPLIT_SHARD_SPEED = 126 * MONSTER_AMMO_SPEED_FACTOR;
  const SPLITTER_LARGE_SPEED = 105 * 1.5;
  const WALL_MAX_HITS = 5;
  const DIFFICULTIES = {
    easy: { name: '简单模式', fireRate: .5, gemDropMultiplier: 1 },
    normal: { name: '正常模式', fireRate: 1, gemDropMultiplier: 1 },
    hard: { name: '困难模式', fireRate: 1.5, gemDropMultiplier: 1 },
    hell: { name: '地狱模式', fireRate: 2, gemDropMultiplier: .5 },
  };
  const ARTIFACTS = {
    necklace: { name: '魔法项链', icon: '✦', description: '受到致命伤害时保留 10 点生命，并释放冲击波抵消周围弹幕。' },
    member: { name: '会员卡', icon: 'VIP', description: '持有期间，商店所有物品价格打七折，最终价格四舍五入。' },
    battery: { name: '矿井电池', icon: '▮', description: '靠近修缮后的宝石矿井后点击使用，产宝石间隔缩短至 1.5 秒。' },
    phoenix: { name: '不死鸟之眼', icon: '◉', description: '用大炮摧毁 1 个车厢时，恢复 8 点生命值。' },
    grail: { name: '圣杯', icon: '♜', description: '持有期间，每 2 秒恢复 1 点生命值。' },
    barrel: { name: '火药桶', icon: '✹', description: '持有期间，操控大炮的发射冷却缩短至 2 秒。' },
  };
  const world = { w: 1800 * MAP_SCALE, h: 1100 * MAP_SCALE, cameraX: 0, cameraY: 0 };
  const rail = { bandTop: 350 * MAP_SCALE, bandHeight: 112 * MAP_SCALE, upper: 370 * MAP_SCALE, lower: 440 * MAP_SCALE, center: 405 * MAP_SCALE };
  const shopZone = { x: 1510 * MAP_SCALE, y: 860 * MAP_SCALE, w: 220 * MAP_SCALE, h: 155 * MAP_SCALE };
  const verticalRail = { x: shopZone.x - 250, width: 98 };

  function difficultyConfig() { return DIFFICULTIES[selectedDifficulty]; }
  function weatherInterval() { return selectedDifficulty === 'hard' || selectedDifficulty === 'hell' ? 40 : 80; }
  function hasTyphoonWeather() { return state.weather === 'typhoon' || state.weather === 'hellstorm'; }
  function hasSandstormWeather() { return state.weather === 'sandstorm' || state.weather === 'hellstorm'; }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!started) {
      state.player.x = world.w * .42;
      state.player.y = world.h * .54;
      mouse.x = innerWidth * .55;
      mouse.y = innerHeight * .48;
    }
  }

  function resetGame() {
    const selectedSkin = state.player.skin || 'peach';
    testGemPresses = [];
    testWeatherPresses = [];
    testAirdropPresses = [];
    state.gems = selectedDifficulty === 'easy' ? 5 : 0;
    state.inventory = Array(6).fill(null);
    state.inventory2 = Array(6).fill(null);
    state.cannons = [];
    state.walls = [];
    state.umbrellas = [];
    state.debris = [];
    state.shells = [];
    state.bullets = [];
    state.sniperTrails = [];
    state.gemsOnGround = [];
    state.particles = [];
    state.shockwaves = [];
    state.holyCupTimer = 2;
    state.trains = [];
    state.trainTimer = 2;
    state.verticalTrainTimer = 0;
    state.trainRound = 0;
    state.fallingRocks = [];
    state.gemMine = { x: 175, y: world.h - 180, repaired: false, upgraded: false, productionTimer: 3 };
    state.airdrop = { spawned: false, opened: false, x: world.w * .5, y: -100, targetY: world.h * .5, opener: null };
    state.nextEarthquakeAt = selectedDifficulty === 'hell' ? 0 : 60;
    state.earthquakeEnd = 0;
    state.rockTimer = 0;
    state.weather = null;
    state.weatherEnd = 0;
    state.nextWeatherAt = weatherInterval();
    state.weatherCenter = { x: 0, y: 0 };
    state.weatherDamageTimer = 0;
    state.rescue = { rescuer: null, target: null, progress: 0 };
    state.time = 0;
    world.cameraX = 0;
    world.cameraY = 0;
    state.screenShake = 0;
    state.player = { x: world.w * .42, y: world.h * .54, radius: 16, speed: 235, facing: 0, skin: selectedSkin, health: 100, maxHealth: 100, helmet: false, hitCooldown: 0, trainHitCooldown: 0, stun: 0, knockback: 0, knockbackVX: 0, knockbackVY: 0, knockbackSpin: 0, hitRotation: 0, speedBuff: 0, cannon: null };
    state.player2 = { x: world.w * .42 + 72, y: world.h * .54, radius: 16, speed: 235, facing: Math.PI, skin: selectedSkin === 'peach' ? 'snow' : 'peach', health: 100, maxHealth: 100, helmet: false, hitCooldown: 0, trainHitCooldown: 0, stun: 0, knockback: 0, knockbackVX: 0, knockbackVY: 0, knockbackSpin: 0, hitRotation: 0, speedBuff: 0, cannon: null, downed: false };
    placeCannon(state.player.x + 46, state.player.y + 4);
    syncUI();
  }

  function placeCannon(x, y) {
    state.cannons.push({ x, y, radius: 25, angle: -Math.PI / 4, cooldown: 0, flash: 0 });
  }

  function placeWall(x, y) {
    state.walls.push({ x, y, radius: 31, hits: 0 });
  }

  function placeUmbrella(x, y) {
    state.umbrellas.push({ x, y, radius: 126, hits: 0, destroyed: false });
  }

  function updateCamera() {
    const livingPlayers = getActivePlayers();
    const cameraPlayers = livingPlayers.length ? livingPlayers : getPlayers();
    const focusX = cameraPlayers.reduce((sum, p) => sum + p.x, 0) / cameraPlayers.length;
    const focusY = cameraPlayers.reduce((sum, p) => sum + p.y, 0) / cameraPlayers.length;
    const targetX = focusX - innerWidth / 2;
    const targetY = focusY - innerHeight / 2;
    world.cameraX += (targetX - world.cameraX) * .12;
    world.cameraY += (targetY - world.cameraY) * .12;
    world.cameraX = clamp(world.cameraX, 0, Math.max(0, world.w - innerWidth));
    world.cameraY = clamp(world.cameraY, 0, Math.max(0, world.h - innerHeight));
  }

  function screenToWorld(x, y) {
    return { x: x + world.cameraX, y: y + world.cameraY };
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function circleHit(a, b, extra = 0) { return distance(a, b) < a.radius + b.radius + extra; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function isTwoPlayer() { return gameMode === 'coop'; }
  function getPlayers() { return isTwoPlayer() ? [state.player, state.player2] : [state.player]; }
  function getActivePlayers() { return getPlayers().filter(player => !player.downed); }

  function emit(x, y, color, amount, speed = 120) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * TAU;
      const life = rand(.35, .85);
      state.particles.push({ x, y, vx: Math.cos(angle) * rand(speed * .35, speed), vy: Math.sin(angle) * rand(speed * .35, speed), life, maxLife: life, color, size: rand(2, 5) });
    }
  }

  function showToast(text) {
    ui.toast.textContent = text;
    ui.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1500);
  }

  function randomMonsterWeapon() {
    if (state.time < 45) return 'shotgun';
    if (state.time < 90) return Math.random() < .5 ? 'splitter' : 'shotgun';
    const roll = Math.random();
    if (roll < 1 / 3) return 'shotgun';
    if (roll < 2 / 3) return 'splitter';
    return 'sniper';
  }

  function createMonster() {
    return { cooldown: 1.8, flash: 0, angle: Math.PI, weapon: randomMonsterWeapon(), minerHelmet: Math.random() < .4 };
  }

  function trainCarPosition(train, car) {
    return train.vertical
      ? { x: train.x, y: train.y + car.offset }
      : { x: train.x + car.offset, y: train.y };
  }

  function spawnTrain() {
    const hasGemCar = Math.random() > .18;
    state.trainRound++;
    const train = { x: -300, y: rail.center, round: state.trainRound, speed: TRAIN_BASE_SPEED, destroyed: false, cars: [] };
    train.cars.push({ offset: 0, type: 'engine', hp: 2, radius: 40, destroyed: false, monster: createMonster() });
    train.cars.push({ offset: -96, type: hasGemCar ? 'gem' : 'coal', hp: 1, radius: 34, destroyed: false });
    train.cars.push({ offset: -180, type: Math.random() > .5 ? 'gem' : 'coal', hp: 1, radius: 34, destroyed: false });
    state.trains.push(train);
    showToast('火车驶入矿井！');
  }

  function spawnVerticalTrain() {
    const hasGemCar = Math.random() > .18;
    const train = { x: verticalRail.x, y: -300, round: Math.max(2, state.trainRound), speed: TRAIN_BASE_SPEED, vertical: true, destroyed: false, cars: [] };
    train.cars.push({ offset: 0, type: 'engine', hp: 2, radius: 40, destroyed: false, monster: createMonster() });
    train.cars.push({ offset: -96, type: hasGemCar ? 'gem' : 'coal', hp: 1, radius: 34, destroyed: false });
    train.cars.push({ offset: -180, type: Math.random() > .5 ? 'gem' : 'coal', hp: 1, radius: 34, destroyed: false });
    state.trains.push(train);
    showToast('纵向火车驶入补给站铁轨！');
  }

  function fireShell(cannon, angleOverride = null) {
    if (cannon.cooldown > 0) return;
    const owner = getPlayers().find(player => player.cannon === cannon) || state.player;
    playSfx('cannon');
    const target = screenToWorld(mouse.x, mouse.y);
    if (angleOverride !== null) cannon.angle = angleOverride;
    else cannon.angle = Math.atan2(target.y - cannon.y, target.x - cannon.x);
    state.shells.push({ x: cannon.x + Math.cos(cannon.angle) * 36, y: cannon.y + Math.sin(cannon.angle) * 36, vx: Math.cos(cannon.angle) * 570, vy: Math.sin(cannon.angle) * 570, radius: 7, life: 2.3, owner });
    cannon.cooldown = hasArtifact(owner, 'barrel') ? 2 : 5;
    cannon.flash = .14;
    state.screenShake = state.reducedMotion ? 0 : 5;
    emit(cannon.x + Math.cos(cannon.angle) * 42, cannon.y + Math.sin(cannon.angle) * 42, '#ffd76d', 13, 165);
  }

  function fireMonster(train, engineCar) {
    const monster = engineCar.monster;
    const enginePosition = trainCarPosition(train, engineCar);
    const engine = train.vertical ? { x: enginePosition.x + 17, y: enginePosition.y } : { x: enginePosition.x, y: enginePosition.y - 17 };
    const targets = getActivePlayers();
    const target = targets.reduce((nearest, player) => !nearest || distance(player, engine) < distance(nearest, engine) ? player : nearest, null) || state.player;
    const dx = target.x - engine.x;
    const dy = target.y - engine.y;
    const base = monster.angle;
    const fireIntervalMultiplier = 1 / difficultyConfig().fireRate;
    if (monster.weapon === 'splitter') {
      playSfx('splitter');
      state.bullets.push({ x: engine.x, y: engine.y, vx: Math.cos(base) * SPLITTER_LARGE_SPEED, vy: Math.sin(base) * SPLITTER_LARGE_SPEED, radius: 16, type: 'splitter' });
      monster.cooldown = 1.8 * fireIntervalMultiplier;
      monster.flash = .16;
      return;
    }
    if (monster.weapon === 'sniper') {
      playSfx('sniper');
      state.bullets.push({ x: engine.x, y: engine.y, vx: Math.cos(base) * 1080, vy: Math.sin(base) * 1080, radius: 8, type: 'sniper' });
      monster.cooldown = 2.05 * fireIntervalMultiplier;
      monster.flash = .16;
      return;
    }
    const spreadCount = train.round >= 2 ? 5 : 3;
    playSfx('shotgun');
    const spreadHalf = Math.floor(spreadCount / 2);
    for (let i = -spreadHalf; i <= spreadHalf; i++) {
      const angle = base + i * .16;
      state.bullets.push({ x: engine.x, y: engine.y, vx: Math.cos(angle) * SHOTGUN_BULLET_SPEED, vy: Math.sin(angle) * SHOTGUN_BULLET_SPEED, radius: 7, hitPlayer: false });
    }
    monster.cooldown = 1.65 * fireIntervalMultiplier;
    monster.flash = .16;
  }

  function splitBullet(bullet) {
    if (bullet.spent) return;
    bullet.spent = true;
    emit(bullet.x, bullet.y, '#b68cff', 16, 155);
    const baseAngle = Math.atan2(bullet.vy, bullet.vx);
    const shardCount = 12;
    for (let i = 0; i < shardCount; i++) {
      const angle = baseAngle + i / shardCount * TAU + Math.PI / shardCount;
      state.bullets.push({ x: bullet.x, y: bullet.y, vx: Math.cos(angle) * SPLIT_SHARD_SPEED, vy: Math.sin(angle) * SPLIT_SHARD_SPEED, radius: 7, type: 'splitShard', hitPlayer: false, wallBounces: 0 });
    }
  }

  function trainSpeedMultiplier() {
    if (state.time >= 120) return 3;
    if (state.time >= 90) return 2.5;
    if (state.time >= 60) return 2;
    if (state.time >= 30) return 1.5;
    return 1;
  }

  function explode(x, y, radius = 104, owner = null) {
    playSfx('blast');
    state.screenShake = state.reducedMotion ? 0 : 12;
    emit(x, y, '#ffe66d', 35, 260);
    emit(x, y, '#f06e59', 22, 190);
    for (const train of state.trains) {
      for (const car of train.cars) {
        if (car.destroyed) continue;
        if (car.type === 'engine') continue;
        const pos = trainCarPosition(train, car);
        if (Math.hypot(pos.x - x, pos.y - y) < radius + car.radius) destroyCar(train, car, pos, owner);
      }
    }
  }

  function destroyCar(train, car, pos, owner = null) {
    playSfx('blast');
    car.destroyed = true;
    if (owner && !owner.downed && owner.health < owner.maxHealth && hasArtifact(owner, 'phoenix')) {
      owner.health = Math.min(owner.maxHealth, owner.health + 8);
      emit(owner.x, owner.y, '#ff9b5e', 11, 100);
      showToast('不死鸟之眼燃起，恢复 8 点生命');
    }
    emit(pos.x, pos.y, car.type === 'gem' ? '#48e0cf' : '#a3a3a2', 28, 210);
    if (car.type === 'gem') {
      const normalCount = 5 + Math.floor(Math.random() * 4);
      const count = Math.max(1, Math.round(normalCount * difficultyConfig().gemDropMultiplier));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * TAU;
        state.gemsOnGround.push({ x: pos.x, y: pos.y, vx: Math.cos(angle) * rand(55, 160), vy: Math.sin(angle) * rand(55, 160), radius: 9, spin: Math.random() * TAU, age: 0, picked: false });
      }
      showToast('宝石车厢炸毁，快去捡！');
    }
  }

  function update(dt) {
    state.time += dt;
    updateEarthquake(dt);
    updateWeather(dt);
    updateAirdrop(dt);
    updateArtifactEffects(dt);
    updatePlayer(dt);
    updatePlayer2(dt);
    updateRescue(dt);
    updateCannon(dt);
    updateTrains(dt);
    updateShells(dt);
    updateBullets(dt);
    updateShockwaves(dt);
    updateGems(dt);
    updateGemMine(dt);
    updateParticles(dt);
    state.screenShake = Math.max(0, state.screenShake - dt * 35);
    updateCamera();
    syncUI();
  }

  function updatePlayer(dt) {
    const p = state.player;
    updatePlayerMovement(p, dt, 'p1');
  }

  function updatePlayer2(dt) {
    if (!isTwoPlayer()) return;
    updatePlayerMovement(state.player2, dt, 'p2');
  }

  function updatePlayerMovement(p, dt, controls) {
    if (p.downed) return;
    p.hitCooldown = Math.max(0, p.hitCooldown - dt);
    p.trainHitCooldown = Math.max(0, p.trainHitCooldown - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.knockback = Math.max(0, p.knockback - dt);
    p.speedBuff = Math.max(0, p.speedBuff - dt);
    if (p.cannon) {
      p.x = p.cannon.x;
      p.y = p.cannon.y + 18;
      return;
    }
    if (p.knockback > 0) {
      p.x += p.knockbackVX * dt;
      p.y += p.knockbackVY * dt;
      p.knockbackVX *= Math.pow(.018, dt);
      p.knockbackVY *= Math.pow(.018, dt);
      p.hitRotation += p.knockbackSpin * dt;
      p.x = clamp(p.x, 26, world.w - 26);
      p.y = clamp(p.y, 26, world.h - 26);
      return;
    }
    p.hitRotation *= Math.pow(.001, dt);
    if (p.stun > 0) return;
    let dx = 0;
    let dy = 0;
    if (controls === 'p1') {
      if (keys.has('KeyW')) dy--;
      if (keys.has('KeyS')) dy++;
      if (keys.has('KeyA')) dx--;
      if (keys.has('KeyD')) dx++;
    } else {
      if (keys.has('ArrowUp')) dy--;
      if (keys.has('ArrowDown')) dy++;
      if (keys.has('ArrowLeft')) dx--;
      if (keys.has('ArrowRight')) dx++;
    }
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const speed = p.speed * (p.speedBuff > 0 ? 2 : 1);
      p.x += dx / len * speed * dt;
      p.y += dy / len * speed * dt;
      p.facing = Math.atan2(dy, dx);
    }
    if (hasTyphoonWeather()) {
      const force = 156;
      const towardCenterX = state.weatherCenter.x - p.x;
      const towardCenterY = state.weatherCenter.y - p.y;
      const distanceToCenter = Math.hypot(towardCenterX, towardCenterY);
      if (distanceToCenter > 1) {
        p.x += towardCenterX / distanceToCenter * force * dt;
        p.y += towardCenterY / distanceToCenter * force * dt;
      }
    }
    p.x = clamp(p.x, 26, world.w - 26);
    p.y = clamp(p.y, 26, world.h - 26);
  }

  function updateCannon(dt) {
    for (const cannon of state.cannons) {
      cannon.cooldown = Math.max(0, cannon.cooldown - dt);
      cannon.flash = Math.max(0, cannon.flash - dt);
      const controller = getPlayers().find(player => player.cannon === cannon);
      if (controller) {
        const target = screenToWorld(mouse.x, mouse.y);
        cannon.angle = Math.atan2(target.y - cannon.y, target.x - cannon.x);
      }
    }
  }

  function updateEarthquake(dt) {
    if (state.time >= state.nextEarthquakeAt) {
      state.earthquakeEnd = state.time + (selectedDifficulty === 'hell' ? 20 : 10);
      state.nextEarthquakeAt += 60;
      state.rockTimer = 0;
      showToast('地震开始了，注意躲避落石！');
    }

    if (state.time < state.earthquakeEnd) {
      state.rockTimer -= dt;
      if (state.rockTimer <= 0) {
        spawnFallingRock();
        state.rockTimer = rand(.36, .62);
      }
      state.screenShake = state.reducedMotion ? 0 : Math.max(state.screenShake, 2.2);
    }

    for (const rock of state.fallingRocks) {
      rock.y += rock.speed * dt;
      rock.rotation += rock.spin * dt;
      if (rock.y >= rock.targetY) impactRock(rock);
    }
    state.fallingRocks = state.fallingRocks.filter(rock => !rock.impacted);
  }

  function spawnFallingRock() {
    const radius = rand(14, 23) * 3;
    const targetX = clamp(world.cameraX + rand(55, Math.max(56, innerWidth - 55)), radius, world.w - radius);
    const targetY = clamp(world.cameraY + rand(65, Math.max(66, innerHeight - 65)), radius, world.h - radius);
    state.fallingRocks.push({
      x: targetX,
      y: targetY - rand(350, 510),
      targetY,
      radius,
      speed: rand(540, 700),
      rotation: Math.random() * TAU,
      spin: rand(-6, 6),
      impacted: false,
    });
  }

  function impactRock(rock) {
    rock.impacted = true;
    playSfx('rock');
    const impact = { x: rock.x, y: rock.targetY, radius: rock.radius };
    const umbrella = state.umbrellas.find(candidate => !candidate.destroyed && circleHit(impact, candidate, 1));
    if (umbrella) {
      umbrella.hits++;
      emit(impact.x, impact.y, '#f7d982', 18, 140);
      state.screenShake = state.reducedMotion ? 0 : 4;
      if (umbrella.hits >= 3) {
        umbrella.destroyed = true;
        state.debris.push({ x: umbrella.x, y: umbrella.y, rotation: Math.random() * TAU, kind: 'umbrella' });
        showToast('保护伞被落石击碎了');
      } else {
        showToast(`保护伞拦截落石（${3 - umbrella.hits} 次耐久）`);
      }
      state.umbrellas = state.umbrellas.filter(candidate => !candidate.destroyed);
      return;
    }
    state.debris.push({ x: impact.x, y: impact.y, rotation: Math.random() * TAU, kind: 'rock', radius: rock.radius });
    emit(impact.x, impact.y, '#8b9ba1', 16, 170);
    state.screenShake = state.reducedMotion ? 0 : 9;

    for (const player of getActivePlayers()) {
      if (player.hitCooldown <= 0 && circleHit(impact, player, 2)) {
        if (player.helmet) {
          player.helmet = false;
          state.debris.push({ x: player.x, y: player.y + 8, rotation: Math.random() * TAU, kind: 'helmet' });
          damagePlayer(10, 10, '落石砸碎了安全帽', player);
        } else {
          damagePlayer(20, 20, '落石砸中', player);
        }
      }
    }

    for (const train of state.trains) {
      for (const car of train.cars) {
        if (car.destroyed || car.type === 'engine') continue;
        const position = { ...trainCarPosition(train, car), radius: car.radius };
        if (circleHit(impact, position, 1)) destroyCar(train, car, position);
      }
    }

    for (const cannon of state.cannons) {
      if (!cannon.destroyed && circleHit(impact, cannon, 1)) destroyCannon(cannon);
    }
    state.cannons = state.cannons.filter(cannon => !cannon.destroyed);

    for (const wall of state.walls) {
      if (wall.hits >= WALL_MAX_HITS || !circleHit(impact, wall, 1)) continue;
      wall.hits = WALL_MAX_HITS - 1;
      damageWall(wall);
    }
    state.umbrellas = state.umbrellas.filter(umbrella => !umbrella.destroyed);
  }

  function startWeatherEvent() {
    const duration = (state.time >= 240 ? 20 : 10) + (selectedDifficulty === 'hell' ? 10 : 0);
    const simultaneousWeather = selectedDifficulty === 'hell' || (selectedDifficulty === 'hard' && Math.random() < .2);
    state.weather = simultaneousWeather ? 'hellstorm' : (Math.random() < .5 ? 'typhoon' : 'sandstorm');
    state.weatherEnd = state.time + duration;
    if (hasTyphoonWeather()) {
      const angle = Math.random() * TAU;
      const radius = rand(220, 360);
      state.weatherCenter = {
        x: clamp(state.player.x + Math.cos(angle) * radius, 120, world.w - 120),
        y: clamp(state.player.y + Math.sin(angle) * radius, 120, world.h - 120),
      };
      state.weatherDamageTimer = 0;
      showToast(state.weather === 'hellstorm' ? '地狱天气来袭！台风与沙尘暴同时出现' : '台风来袭！风向正在改变');
    } else {
      showToast('沙尘暴来袭！能见度降低');
    }
  }

  function summonTestWeather() {
    startWeatherEvent();
    state.nextWeatherAt = state.time + weatherInterval();
    showToast(hasTyphoonWeather() && hasSandstormWeather() ? '测试：地狱天气已召唤' : state.weather === 'typhoon' ? '测试：台风已召唤' : '测试：沙尘暴已召唤');
  }

  function updateWeather(dt) {
    if (!state.weather && state.time >= state.nextWeatherAt) {
      startWeatherEvent();
      state.nextWeatherAt += weatherInterval();
    }
    if (state.weather && state.time >= state.weatherEnd) {
      state.weather = null;
      state.weatherDamageTimer = 0;
      showToast('恶劣天气结束');
    }
    if (!hasTyphoonWeather()) return;
    state.weatherDamageTimer -= dt;
    if (state.weatherDamageTimer > 0) return;
    state.weatherDamageTimer += .1;
    const windCore = { ...state.weatherCenter, radius: 44 };
    for (const player of getActivePlayers()) {
      if (circleHit(player, windCore)) damagePlayer(1, 1, '龙卷风中心撕扯', player);
    }
  }

  function ensureAudio() {
    if (!audio.context) audio.context = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.context.state === 'suspended') audio.context.resume();
    return audio.context;
  }

  function tone(frequency, duration, options = {}) {
    const context = ensureAudio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    const volume = options.volume ?? .035;
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (options.slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.slide), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }

  function playSfx(name) {
    if (!audio.sfxEnabled) return;
    const sounds = {
      cannon: () => { tone(120, .18, { type: 'sawtooth', volume: .07, slide: 52 }); tone(74, .24, { type: 'triangle', volume: .045, slide: 38 }); },
      shotgun: () => tone(170, .09, { type: 'square', volume: .025, slide: 84 }),
      splitter: () => { tone(260, .13, { type: 'triangle', volume: .035, slide: 120 }); tone(390, .1, { type: 'sine', volume: .02, slide: 190 }); },
      sniper: () => tone(660, .12, { type: 'sawtooth', volume: .028, slide: 140 }),
      blast: () => { tone(86, .3, { type: 'sawtooth', volume: .065, slide: 30 }); tone(46, .4, { type: 'triangle', volume: .04, slide: 24 }); },
      gem: () => { tone(880, .12, { type: 'sine', volume: .04, slide: 1320 }); tone(1320, .18, { type: 'sine', volume: .025 }); },
      hurt: () => tone(180, .22, { type: 'square', volume: .045, slide: 72 }),
      rock: () => tone(62, .25, { type: 'triangle', volume: .055, slide: 34 }),
      repair: () => { tone(392, .15, { type: 'sine', volume: .04, slide: 523 }); tone(523, .25, { type: 'sine', volume: .035, slide: 784 }); },
      buy: () => { tone(440, .09, { type: 'triangle', volume: .03 }); tone(660, .13, { type: 'triangle', volume: .025 }); },
      heal: () => tone(560, .2, { type: 'sine', volume: .035, slide: 840 }),
    };
    sounds[name]?.();
  }

  function playMusicStep() {
    if (!audio.musicEnabled || !started || paused || gameOver) return;
    const melody = [262, 330, 392, 523, 392, 330, 294, 349, 440, 587, 440, 349];
    const bass = [131, 147, 165, 147];
    const step = audio.musicStep++;
    tone(melody[step % melody.length], .36, { type: 'triangle', volume: .018 });
    if (step % 3 === 0) tone(bass[Math.floor(step / 3) % bass.length], .46, { type: 'sine', volume: .026 });
  }

  function startMusic() {
    ensureAudio();
    if (!audio.musicEnabled || audio.musicTimer) return;
    playMusicStep();
    audio.musicTimer = setInterval(playMusicStep, 420);
  }

  function stopMusic() {
    if (audio.musicTimer) clearInterval(audio.musicTimer);
    audio.musicTimer = 0;
  }

  function updateTrains(dt) {
    state.trainTimer -= dt;
    if (state.trainTimer <= 0) {
      spawnTrain();
      state.trainTimer = rand(15, 21) / trainSpawnRateMultiplier();
    }
    if (state.time >= 130) {
      state.verticalTrainTimer -= dt;
      if (state.verticalTrainTimer <= 0) {
        spawnVerticalTrain();
        state.verticalTrainTimer = rand(12, 16.7) / trainSpawnRateMultiplier();
      }
    }
    for (const train of state.trains) {
      if (!train.destroyed) {
        train.speed = TRAIN_BASE_SPEED * trainSpeedMultiplier();
        if (train.vertical) train.y += train.speed * dt;
        else train.x += train.speed * dt;
        resolveTrainCollisions(train);
        for (const car of train.cars) {
          if (car.type !== 'engine' || car.destroyed) continue;
          const monster = car.monster;
          const enginePosition = trainCarPosition(train, car);
          const muzzle = train.vertical ? { x: enginePosition.x + 17, y: enginePosition.y } : { x: enginePosition.x, y: enginePosition.y - 17 };
          const targets = getActivePlayers();
          const target = targets.reduce((nearest, player) => !nearest || distance(player, muzzle) < distance(nearest, muzzle) ? player : nearest, null) || state.player;
          monster.angle = Math.atan2(target.y - muzzle.y, target.x - muzzle.x);
          monster.cooldown -= dt;
          monster.flash = Math.max(0, monster.flash - dt);
          const inMap = train.vertical ? muzzle.y > 0 && muzzle.y < world.h + 80 : muzzle.x > 0 && muzzle.x < world.w + 80;
          if (monster.cooldown <= 0 && inMap) fireMonster(train, car);
        }
      }
    }
    state.trains = state.trains.filter(train => train.vertical
      ? train.y < world.h + 340
      : train.x < world.w + 340 && (!train.destroyed || train.x < world.w + 150));
  }

  function trainSpawnRateMultiplier() {
    if (state.time >= 180) return 3;
    if (state.time >= 120) return 2;
    return 1;
  }

  function resolveTrainCollisions(train) {
    for (const p of getActivePlayers()) for (const car of train.cars) {
      if (car.destroyed) continue;
      const carPosition = { ...trainCarPosition(train, car), radius: car.radius };
      const dx = p.x - carPosition.x;
      const dy = p.y - carPosition.y;
      const minDistance = p.radius + car.radius;
      const distanceToCar = Math.hypot(dx, dy);
      if (distanceToCar >= minDistance) continue;
      if (p.cannon) p.cannon = null;

      const safeDistance = Math.max(distanceToCar, .001);
      let pushX = dx / safeDistance;
      let pushY = dy / safeDistance;
      const engineFrontHit = car.type === 'engine' && (train.vertical
        ? dy > car.radius * .35 && Math.abs(dx) < car.radius * .78
        : dx > car.radius * .35 && Math.abs(dy) < car.radius * .78);
      if (engineFrontHit) {
        pushX = train.vertical ? (p.x < verticalRail.x ? -1.25 : 1.25) : -1;
        pushY = train.vertical ? -1 : (p.y < rail.center ? -1.25 : 1.25);
        const pushLength = Math.hypot(pushX, pushY);
        pushX /= pushLength;
        pushY /= pushLength;
        if (p.trainHitCooldown <= 0) {
          p.trainHitCooldown = 1.2;
          p.stun = 1;
          p.knockback = .35;
          p.knockbackVX = pushX * 720;
          p.knockbackVY = pushY * 720;
          p.knockbackSpin = pushY > 0 ? 18 : -18;
          p.hitRotation = 0;
          p.health = Math.max(0, p.health - 70);
          playSfx('hurt');
          emit(p.x, p.y, '#ff9075', 22, 185);
          state.screenShake = state.reducedMotion ? 0 : 13;
          showToast('被火车头撞出轨道！眩晕 1 秒（-70）');
          if (p.health <= 0) downPlayer(p);
        }
        p.x = carPosition.x + pushX * (minDistance + 8);
        p.y = carPosition.y + pushY * (minDistance + 8);
      } else {
        p.x = carPosition.x + pushX * (minDistance + 1);
        p.y = carPosition.y + pushY * (minDistance + 1);
      }
      p.x = clamp(p.x, 26, world.w - 26);
      p.y = clamp(p.y, 26, world.h - 26);
    }
  }

  function updateShells(dt) {
    for (const shell of state.shells) {
      shell.x += shell.vx * dt;
      shell.y += shell.vy * dt;
      shell.life -= dt;
      let hit = false;
      for (const train of state.trains) {
        for (const car of train.cars) {
          if (car.destroyed) continue;
          const pos = { ...trainCarPosition(train, car), radius: car.radius };
          if (circleHit(shell, pos, 4)) {
            explode(shell.x, shell.y, 104, shell.owner);
            shell.life = 0;
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (shell.life <= 0 && !hit) explode(shell.x, shell.y, 66, shell.owner);
    }
    state.shells = state.shells.filter(s => s.life > 0 && s.x > -80 && s.y > -80 && s.x < world.w + 80 && s.y < world.h + 80);
  }

  function updateBullets(dt) {
    state.sniperTrails.forEach(segment => { segment.age += dt; });
    state.sniperTrails = state.sniperTrails.filter(segment => segment.age < 1);
    for (const bullet of state.bullets) {
      const previousX = bullet.x;
      const previousY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.type === 'sniper') state.sniperTrails.push({ x1: previousX, y1: previousY, x2: bullet.x, y2: bullet.y, age: 0 });
      const outsideMap = bullet.x < 0 || bullet.y < 0 || bullet.x > world.w || bullet.y > world.h;
      if (bullet.type === 'splitter' && outsideMap) {
        bullet.x = clamp(bullet.x, 0, world.w);
        bullet.y = clamp(bullet.y, 0, world.h);
        splitBullet(bullet);
        continue;
      }
      const wall = state.walls.find(candidate => candidate.hits < WALL_MAX_HITS && circleHit(bullet, candidate));
      if (wall) {
        if (bullet.type === 'splitShard' && bullet.wallBounces < 2) {
          const dx = bullet.x - wall.x;
          const dy = bullet.y - wall.y;
          const length = Math.max(Math.hypot(dx, dy), 1);
          const nx = dx / length;
          const ny = dy / length;
          const dot = bullet.vx * nx + bullet.vy * ny;
          bullet.vx -= 2 * dot * nx;
          bullet.vy -= 2 * dot * ny;
          bullet.x = wall.x + nx * (wall.radius + bullet.radius + 2);
          bullet.y = wall.y + ny * (wall.radius + bullet.radius + 2);
          bullet.wallBounces++;
          damageWall(wall);
          emit(bullet.x, bullet.y, '#d7e9e7', 6, 75);
          continue;
        }
        if (bullet.type === 'splitter') {
          damageWall(wall);
          splitBullet(bullet);
          continue;
        }
        bullet.blocked = true;
        damageWall(wall);
        continue;
      }
      for (const p of getActivePlayers()) {
        if (bullet.type === 'splitter' && circleHit(bullet, p)) { splitBullet(bullet); break; }
        if (!bullet.hitPlayer && circleHit(bullet, p)) {
          bullet.hitPlayer = true;
          bullet.hitTarget = p;
          bullet.spent = true;
        }
        if (bullet.spent && !bullet.damaged && bullet.hitTarget === p && p.hitCooldown <= 0 && circleHit(bullet, p)) {
          bullet.damaged = true;
          if (bullet.type === 'splitShard') damagePlayer(25, 8, '分裂弹命中', p);
          else {
            const damage = bullet.type === 'sniper' ? (p.helmet ? 20 : 45) : (p.helmet ? 10 : 25);
            damagePlayer(damage, damage, bullet.type === 'sniper' ? '狙击弹命中' : '散弹命中', p);
          }
          break;
        }
      }
    }
    state.walls = state.walls.filter(wall => wall.hits < WALL_MAX_HITS);
    state.bullets = state.bullets.filter(b => !b.blocked && !b.spent && b.x >= 0 && b.y >= 0 && b.x <= world.w && b.y <= world.h);
  }

  function damagePlayer(normalDamage, helmetDamage, source, player = state.player) {
    const p = player;
    const damage = p.helmet ? helmetDamage : normalDamage;
    p.hitCooldown = .2;
    if (p.health - damage <= 0 && consumeArtifact(p, 'necklace')) {
      p.health = 10;
      state.shockwaves.push({ x: p.x, y: p.y, radius: 0, previousRadius: 0, maxRadius: 280, speed: 420, life: 0, maxLife: .8 });
      emit(p.x, p.y, '#d99bff', 38, 280);
      state.screenShake = state.reducedMotion ? 0 : 13;
      playSfx('repair');
      showToast('魔法项链碎裂！冲击波抵消了周围弹幕');
      return;
    }
    p.health = Math.max(0, p.health - damage);
    playSfx('hurt');
    emit(p.x, p.y, '#ff9075', 10, 120);
    state.screenShake = state.reducedMotion ? 0 : 6;
    showToast(p.helmet ? `头盔挡下了 ${source}（-${damage}）` : `${source}（-${damage}）`);
    if (p.health <= 0) downPlayer(p);
  }

  function downPlayer(player) {
    if (player.downed) return;
    if (!isTwoPlayer()) { endGame(); return; }
    player.downed = true;
    player.health = 0;
    player.cannon = null;
    player.stun = 0;
    player.knockback = 0;
    showToast(player === state.player ? 'P1 已倒地，P2 按 N 靠近救援' : 'P2 已倒地，P1 按 Q 靠近救援');
    if (getActivePlayers().length === 0) endGame();
  }

  function revivePlayer(player, rescuer) {
    if (!isTwoPlayer() || !player.downed || rescuer.downed || distance(player, rescuer) > 78) return false;
    player.downed = false;
    player.health = 1;
    player.hitCooldown = 1;
    emit(player.x, player.y, '#78efd9', 20, 120);
    playSfx('heal');
    showToast(player === state.player ? 'P1 已被救起，恢复 1 点生命' : 'P2 已被救起，恢复 1 点生命');
    return true;
  }

  function updateRescue(dt) {
    const rescue = state.rescue;
    if (!isTwoPlayer() || !rescue.rescuer || !rescue.target) return;
    const rescueKey = rescue.rescuer === state.player ? 'KeyQ' : 'KeyN';
    const stillValid = !rescue.rescuer.downed && rescue.target.downed && distance(rescue.rescuer, rescue.target) <= 78 && keys.has(rescueKey);
    if (!stillValid) {
      state.rescue = { rescuer: null, target: null, progress: 0 };
      return;
    }
    rescue.progress += dt;
    if (rescue.progress >= 4) {
      revivePlayer(rescue.target, rescue.rescuer);
      state.rescue = { rescuer: null, target: null, progress: 0 };
    }
  }

  function destroyCannon(cannon) {
    cannon.destroyed = true;
    for (const player of getPlayers()) if (player.cannon === cannon) player.cannon = null;
    emit(cannon.x, cannon.y, '#8ca7aa', 22, 180);
    showToast('大炮被落石砸毁');
  }

  function damageWall(wall) {
    wall.hits++;
    emit(wall.x, wall.y, wall.hits >= WALL_MAX_HITS ? '#8e9c9d' : '#d4e0d7', 10, 115);
    if (wall.hits >= WALL_MAX_HITS) {
      state.debris.push({ x: wall.x, y: wall.y, rotation: Math.random() * TAU });
      showToast('防护墙体破碎了');
    } else {
      showToast(`防护墙体受损（${wall.hits}/${WALL_MAX_HITS}）`);
    }
  }

  function updateGems(dt) {
    for (const gem of state.gemsOnGround) {
      gem.age += dt;
      gem.x += gem.vx * dt;
      gem.y += gem.vy * dt;
      gem.vx *= .9;
      gem.vy *= .9;
      gem.spin += dt * 6;
      if (!gem.picked && getActivePlayers().some(player => distance(gem, player) < 33)) {
        gem.picked = true;
        state.gems++;
        playSfx('gem');
        emit(gem.x, gem.y, '#69f5df', 7, 95);
      }
    }
    state.gemsOnGround = state.gemsOnGround.filter(g => !g.picked && g.age < 10);
  }

  function updateGemMine(dt) {
    const mine = state.gemMine;
    if (!mine.repaired) return;
    mine.productionTimer -= dt;
    if (mine.productionTimer > 0) return;
    mine.productionTimer += mine.upgraded ? 1.5 : 3;
    state.gemsOnGround.push({ x: mine.x + 62, y: mine.y + 26, vx: rand(8, 24), vy: rand(-12, 12), radius: 9, spin: Math.random() * TAU, age: 0, picked: false });
    emit(mine.x + 62, mine.y + 26, '#69f5df', 6, 70);
  }

  function updateAirdrop(dt) {
    const drop = state.airdrop;
    if (!drop.spawned && state.time >= 90) {
      drop.spawned = true;
      drop.x = rand(120, world.w - 120);
      drop.y = -120;
      drop.targetY = rand(120, world.h - 120);
      showToast('空投正在降落！');
    }
    if (drop.spawned && !drop.opened && drop.y < drop.targetY) {
      drop.y = Math.min(drop.targetY, drop.y + 175 * dt);
    }
  }

  function updateArtifactEffects(dt) {
    state.holyCupTimer -= dt;
    if (state.holyCupTimer > 0) return;
    state.holyCupTimer += 2;
    for (const player of getActivePlayers()) {
      if (!hasArtifact(player, 'grail') || player.health >= player.maxHealth) continue;
      player.health = Math.min(player.maxHealth, player.health + 1);
      emit(player.x, player.y, '#f6d77b', 4, 52);
    }
  }

  function summonTestAirdrop() {
    if (state.airdrop.spawned) { showToast('空投已经出现过'); return; }
    state.airdrop.spawned = true;
    state.airdrop.x = rand(120, world.w - 120);
    state.airdrop.y = -120;
    state.airdrop.targetY = rand(120, world.h - 120);
    showToast('测试：空投正在降落！');
  }

  function openAirdrop(player) {
    const inventory = inventoryFor(player);
    if (inventory.every(item => item)) { showToast('物品栏已满，无法打开空投'); return; }
    state.airdrop.opened = true;
    state.airdrop.opener = player;
    paused = true;
    ui.artifactScreen.hidden = false;
    renderArtifactOptions();
    playSfx('buy');
  }

  function renderArtifactOptions() {
    const ids = Object.keys(ARTIFACTS).sort(() => Math.random() - .5).slice(0, 3);
    ui.artifactOptions.replaceChildren();
    for (const id of ids) {
      const artifact = ARTIFACTS[id];
      const button = document.createElement('button');
      button.className = `artifact-option artifact-${id}`;
      button.type = 'button';
      button.innerHTML = `<span class="artifact-icon">${artifact.icon}</span><h3>${artifact.name}</h3><p>${artifact.description}</p>`;
      button.addEventListener('click', () => selectArtifact(id));
      ui.artifactOptions.appendChild(button);
    }
  }

  function selectArtifact(id) {
    const player = state.airdrop.opener || state.player;
    const inventory = inventoryFor(player);
    const slot = inventory.findIndex(item => !item);
    if (slot < 0) { showToast('物品栏已满'); return; }
    inventory[slot] = id;
    ui.artifactScreen.hidden = true;
    paused = false;
    last = performance.now();
    emit(player.x, player.y, '#d99bff', 20, 150);
    showToast(`获得神器：${ARTIFACTS[id].name}`);
    syncUI();
  }

  function closeArtifactChoice() {
    if (ui.artifactScreen.hidden) return;
    ui.artifactScreen.hidden = true;
    state.airdrop.opened = false;
    state.airdrop.opener = null;
    paused = false;
    last = performance.now();
    showToast('已退出神器选择，靠近空投后可再次选择');
  }

  function hasArtifact(player, id) { return inventoryFor(player).includes(id); }

  function consumeArtifact(player, id) {
    const inventory = inventoryFor(player);
    const slot = inventory.indexOf(id);
    if (slot < 0) return false;
    inventory[slot] = null;
    return true;
  }

  function priceFor(player, basePrice) {
    return hasArtifact(player, 'member') ? Math.round(basePrice * .7) : basePrice;
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= .95;
      p.vy *= .95;
      p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
  }

  function syncUI() {
    ui.gemCount.textContent = state.gems;
    ui.gameDifficulty.textContent = difficultyConfig().name;
    const healthPct = clamp(state.player.health / state.player.maxHealth, 0, 1);
    ui.healthFill.style.width = `${healthPct * 100}%`;
    ui.healthText.textContent = `${state.player.health} / ${state.player.maxHealth}`;
    ui.healthHud.classList.toggle('critical', healthPct <= .3);
    ui.p2HealthHud.hidden = !isTwoPlayer();
    if (isTwoPlayer()) {
      const p2HealthPct = clamp(state.player2.health / state.player2.maxHealth, 0, 1);
      ui.p2HealthFill.style.width = `${p2HealthPct * 100}%`;
      ui.p2HealthText.textContent = `${state.player2.health} / ${state.player2.maxHealth}`;
      ui.p2HealthHud.classList.toggle('critical', p2HealthPct <= .3);
    }
    const hasSpeedBuff = state.player.speedBuff > 0;
    ui.buffHud.hidden = !hasSpeedBuff;
    if (hasSpeedBuff) ui.buffText.textContent = `糖分冲刺 · x2 · ${Math.ceil(state.player.speedBuff)} 秒`;
    ui.p2Inventory.hidden = !isTwoPlayer();
    ui.rescueHud.hidden = !state.rescue.rescuer;
    if (state.rescue.rescuer) {
      const percent = clamp(state.rescue.progress / 4, 0, 1);
      ui.rescueLabel.textContent = state.rescue.target === state.player ? 'P2 正在救援 P1' : 'P1 正在救援 P2';
      ui.rescuePercent.textContent = `${Math.ceil(percent * 100)}%`;
      ui.rescueFill.style.width = `${percent * 100}%`;
    }
    renderInventory(ui.p1InventorySlots, state.inventory, 'P1');
    if (isTwoPlayer()) renderInventory(ui.p2InventorySlots, state.inventory2, 'P2');
    positionShop();
    const cannon = getPlayers().find(player => player.cannon)?.cannon;
    const nearest = findNearestCannon();
    if (cannon) {
      ui.hint.textContent = state.player.cannon ? '鼠标瞄准 · 左键发射 · E 离开炮台' : '鼠标瞄准 · 左键发射 · M 离开炮台';
      ui.hint.classList.add('visible');
    } else {
      const hasQuickItem = state.inventory.some(item => item === 'fish' || item === 'wall' || item === 'cake' || item === 'umbrella' || item === 'battery');
      const hasCannonItem = state.inventory.includes('cannon') || (isTwoPlayer() && state.inventory2.includes('cannon'));
      const nearMine = isNearGemMine();
      const mineHint = nearMine && !state.gemMine.repaired ? (state.gems >= 20 ? '点击宝石矿井修复（20 宝石）' : '需要 20 个宝石才能修复矿井') : '';
      const p2Nearest = isTwoPlayer() ? findNearestCannon(state.player2) : null;
      ui.hint.innerHTML = nearest ? '按 <kbd>E</kbd> 操控炮台' : p2Nearest ? 'P2 按 <kbd>M</kbd> 操控炮台' : mineHint || (hasCannonItem ? '点击对应物品栏中的大炮放置' : hasQuickItem ? '点击物品栏使用物品' : '');
      ui.hint.classList.toggle('visible', Boolean(nearest || p2Nearest || mineHint || hasCannonItem || hasQuickItem));
    }
    ui.wave.textContent = state.trains.length ? `第 ${state.trains[0].round} 轮火车正在穿过矿井` : `第 ${state.trainRound + 1} 轮列车 ${Math.ceil(Math.max(0, state.trainTimer))} 秒`;
    const nearShop = Boolean(getShopCustomer());
    const shopPlayer = getShopCustomer() || state.player;
    ui.shopPrices.forEach(price => {
      const basePrice = Number(price.dataset.price);
      const finalPrice = priceFor(shopPlayer, basePrice);
      price.innerHTML = `<i class="gem-icon"></i>${finalPrice}`;
    });
    if (state.time < state.earthquakeEnd) ui.wave.textContent = '地震中 · 落石来袭';
    if (state.weather === 'typhoon') ui.wave.textContent = `台风中 · 强风持续 ${Math.ceil(state.weatherEnd - state.time)} 秒`;
    if (state.weather === 'sandstorm') ui.wave.textContent = `沙尘暴中 · 能见度降低 ${Math.ceil(state.weatherEnd - state.time)} 秒`;
    if (state.rescue.rescuer) ui.wave.textContent = `救援中 · ${Math.ceil(state.rescue.progress / 4 * 100)}%`;
    ui.buy.disabled = state.gems < priceFor(shopPlayer, 12) || !nearShop || inventoryFor(shopPlayer).every(item => item);
    ui.buy.title = nearShop ? '购买一门大炮' : '靠近矿井补给站后购买';
    ui.buyHelmet.disabled = state.gems < priceFor(shopPlayer, 18) || !nearShop || shopPlayer.helmet || inventoryFor(shopPlayer).every(item => item);
    ui.buyHelmet.title = shopPlayer.helmet ? '探照灯头盔已佩戴' : nearShop ? '购买并佩戴探照灯头盔' : '靠近矿井补给站后购买';
    ui.buyFish.disabled = state.gems < priceFor(shopPlayer, 6) || !nearShop || inventoryFor(shopPlayer).every(item => item);
    ui.buyFish.title = nearShop ? '购买鱼罐头' : '靠近矿井补给站后购买';
    ui.buyWall.disabled = state.gems < priceFor(shopPlayer, 8) || !nearShop || inventoryFor(shopPlayer).every(item => item);
    ui.buyCake.disabled = state.gems < priceFor(shopPlayer, 9) || !nearShop || inventoryFor(shopPlayer).every(item => item);
    ui.buyUmbrella.disabled = state.gems < priceFor(shopPlayer, 14) || !nearShop || inventoryFor(shopPlayer).every(item => item);
    ui.buyUmbrella.title = nearShop ? '购买保护伞' : '靠近矿井补给站后购买';
    ui.buyCake.title = nearShop ? '购买蛋糕' : '靠近矿井补给站后购买';
    ui.buyWall.title = nearShop ? '购买防护墙体' : '靠近矿井补给站后购买';
  }

  function renderInventory(slots, inventory, owner) {
    slots.forEach((slot, index) => {
      const itemType = inventory[index];
      const filled = Boolean(itemType);
      slot.classList.toggle('filled', filled);
      slot.querySelectorAll('.slot-cannon, .slot-helmet, .slot-fish, .slot-wall, .slot-cake, .slot-umbrella, .slot-necklace, .slot-member, .slot-battery, .slot-phoenix, .slot-grail, .slot-barrel').forEach(item => item.remove());
      if (filled) {
        const item = document.createElement('span');
        item.className = itemType === 'helmet' ? 'slot-helmet' : itemType === 'fish' ? 'slot-fish' : itemType === 'wall' ? 'slot-wall' : itemType === 'cake' ? 'slot-cake' : itemType === 'umbrella' ? 'slot-umbrella' : itemType === 'necklace' ? 'slot-necklace' : itemType === 'member' ? 'slot-member' : itemType === 'battery' ? 'slot-battery' : itemType === 'phoenix' ? 'slot-phoenix' : itemType === 'grail' ? 'slot-grail' : itemType === 'barrel' ? 'slot-barrel' : 'slot-cannon';
        item.setAttribute('aria-label', ARTIFACTS[itemType]?.name || (itemType === 'helmet' ? '探照灯头盔' : itemType === 'fish' ? '鱼罐头' : itemType === 'wall' ? '防护墙体' : '大炮'));
        slot.appendChild(item);
      }
      const itemName = ARTIFACTS[itemType]?.name || (itemType === 'fish' ? '鱼罐头' : itemType === 'wall' ? '防护墙体' : itemType === 'cannon' ? '大炮' : itemType === 'cake' ? '蛋糕' : itemType === 'umbrella' ? '保护伞' : '探照灯头盔');
      slot.title = filled ? `${owner === 'P2' ? '点击' : `按 ${index + 1} 或点击`}使用${itemName}` : `${owner} 物品栏 ${index + 1}`;
    });
  }

  function positionShop() {
    const panelW = ui.shop.offsetWidth || 255;
    const panelH = ui.shop.offsetHeight || 110;
    const cameraX = world.cameraX;
    const cameraY = world.cameraY;
    const candidates = [
      { left: shopZone.x + shopZone.w / 2 - panelW / 2 - cameraX, top: shopZone.y - panelH - 28 - cameraY },
      { left: shopZone.x + shopZone.w + 24 - cameraX, top: shopZone.y + shopZone.h / 2 - panelH / 2 - cameraY },
      { left: shopZone.x - panelW - 24 - cameraX, top: shopZone.y + shopZone.h / 2 - panelH / 2 - cameraY },
      { left: shopZone.x + shopZone.w / 2 - panelW / 2 - cameraX, top: shopZone.y + shopZone.h + 24 - cameraY },
    ];
    const playerRadius = state.player.radius + 28;
    const playerScreen = { x: state.player.x - cameraX, y: state.player.y - cameraY };
    const overlapsPlayer = position => (
      playerScreen.x + playerRadius > position.left &&
      playerScreen.x - playerRadius < position.left + panelW &&
      playerScreen.y + playerRadius > position.top &&
      playerScreen.y - playerRadius < position.top + panelH
    );
    const fitsViewport = position => (
      position.left + panelW > 8 && position.left < innerWidth - 8 &&
      position.top + panelH > 8 && position.top < innerHeight - 8
    );
    const selected = candidates.find(position => fitsViewport(position) && !overlapsPlayer(position))
      || candidates.find(fitsViewport)
      || candidates[0];
    const maxLeft = Math.max(8, innerWidth - panelW - 8);
    const maxTop = Math.max(8, innerHeight - panelH - 8);
    ui.shop.style.left = `${clamp(selected.left, 8, maxLeft)}px`;
    ui.shop.style.top = `${clamp(selected.top, 8, maxTop)}px`;
  }

  function findNearestCannon(player = state.player) {
    if (player.cannon) return null;
    return state.cannons.find(c => !c.destroyed && distance(c, player) < 57) || null;
  }

  function isNearShop() {
    return distance(state.player, { x: shopZone.x + shopZone.w / 2, y: shopZone.y + shopZone.h / 2 }) < 250;
  }

  function getShopCustomer() {
    const shop = { x: shopZone.x + shopZone.w / 2, y: shopZone.y + shopZone.h / 2 };
    const candidates = getActivePlayers().filter(player => distance(player, shop) < 250);
    if (!candidates.length) return null;
    return candidates.reduce((nearest, player) => distance(player, shop) < distance(nearest, shop) ? player : nearest);
  }

  function inventoryFor(player) { return player === state.player2 ? state.inventory2 : state.inventory; }

  function isNearGemMine() {
    return distance(state.player, state.gemMine) < 170;
  }

  function repairGemMine() {
    if (state.gemMine.repaired) return;
    if (!isNearGemMine()) { showToast('请靠近宝石矿井后再修复'); return; }
    if (state.gems < 20) { showToast('需要 20 个宝石才能修复宝石矿井'); return; }
    state.gems -= 20;
    state.gemMine.repaired = true;
    state.gemMine.productionTimer = 3;
    emit(state.gemMine.x, state.gemMine.y, '#69f5df', 22, 130);
    playSfx('repair');
    showToast('宝石矿井修复完成，每 3 秒产出一颗宝石');
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.save();
    const shakeX = state.screenShake ? rand(-state.screenShake, state.screenShake) : 0;
    const shakeY = state.screenShake ? rand(-state.screenShake, state.screenShake) : 0;
    ctx.translate(-world.cameraX + shakeX, -world.cameraY + shakeY);
    drawGround();
    drawRail();
    drawShopBuilding();
    drawGemMine();
    drawAirdrop();
    for (const debris of state.debris) drawDebris(debris);
    for (const wall of state.walls) drawWall(wall);
    for (const umbrella of state.umbrellas) drawUmbrella(umbrella);
    for (const gem of state.gemsOnGround) {
      const blink = gem.age < 8 ? 1 : .28 + (Math.sin(gem.age * 22) + 1) * .36;
      drawGem(gem.x, gem.y, 1.05 + Math.sin(gem.spin) * .08, '#53e1d1', blink);
    }
    for (const cannon of state.cannons) drawCannon(cannon);
    for (const train of state.trains) drawTrain(train);
    for (const shell of state.shells) drawShell(shell);
    for (const trail of state.sniperTrails) drawSniperTrail(trail);
    for (const bullet of state.bullets) drawBullet(bullet);
    for (const wave of state.shockwaves) drawShockwave(wave);
    for (const rock of state.fallingRocks) drawFallingRock(rock);
    drawPlayer(state.player);
    if (isTwoPlayer()) drawPlayer(state.player2);
    drawRescueEffect();
    for (const particle of state.particles) drawParticle(particle);
    ctx.restore();
    drawWeatherOverlay();
  }

  function drawRescueEffect() {
    const rescue = state.rescue;
    if (!rescue.rescuer || !rescue.target) return;
    const from = rescue.rescuer;
    const to = rescue.target;
    const pulse = .5 + Math.sin(state.time * 10) * .2;
    ctx.save();
    ctx.strokeStyle = `rgba(111, 245, 220, ${.45 + pulse * .35})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -state.time * 65;
    ctx.beginPath(); ctx.moveTo(from.x, from.y - 8); ctx.lineTo(to.x, to.y - 8); ctx.stroke();
    ctx.setLineDash([]);
    for (const player of [from, to]) {
      ctx.strokeStyle = `rgba(255, 224, 122, ${.45 + pulse * .4})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(player.x, player.y - 8, 25 + Math.sin(state.time * 7) * 4, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = '#fff0a6';
    ctx.font = '900 11px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, 4 - rescue.progress).toFixed(1)}s`, to.x, to.y - 38);
    ctx.restore();
  }

  function drawWeatherOverlay() {
    if (!state.weather) return;
    ctx.save();
    const w = innerWidth;
    const h = innerHeight;
    const t = state.time;
    if (hasSandstormWeather()) {
      const visibilityRadius = Math.min(260, Math.max(150, Math.min(w, h) * .2));
      const visiblePlayers = getPlayers().filter(p => !p.downed);
      if (!weatherCanvas) {
        weatherCanvas = document.createElement('canvas');
        weatherCtx = weatherCanvas.getContext('2d');
      }
      if (weatherCanvas.width !== canvas.width || weatherCanvas.height !== canvas.height) {
        weatherCanvas.width = canvas.width;
        weatherCanvas.height = canvas.height;
      }
      weatherCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      weatherCtx.clearRect(0, 0, w, h);
      weatherCtx.fillStyle = 'rgba(28, 19, 15, 1)';
      weatherCtx.fillRect(0, 0, w, h);
      weatherCtx.save();
      weatherCtx.globalCompositeOperation = 'destination-out';
      for (const player of visiblePlayers) {
        const playerX = player.x - world.cameraX;
        const playerY = player.y - world.cameraY;
        const clear = weatherCtx.createRadialGradient(playerX, playerY, 0, playerX, playerY, visibilityRadius);
        clear.addColorStop(0, 'rgba(0, 0, 0, .98)');
        clear.addColorStop(.5, 'rgba(0, 0, 0, .88)');
        clear.addColorStop(.8, 'rgba(0, 0, 0, .4)');
        clear.addColorStop(1, 'rgba(0, 0, 0, 0)');
        weatherCtx.fillStyle = clear;
        weatherCtx.beginPath();
        weatherCtx.arc(playerX, playerY, visibilityRadius, 0, TAU);
        weatherCtx.fill();
      }
      weatherCtx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 222, 157, .28)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 74; i++) {
        const y = ((i * 31 + t * (145 + (i % 7) * 24)) % (h + 50)) - 25;
        const x = ((i * 73 + t * (85 + i % 5 * 17)) % (w + 230)) - 115;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 85 + (i % 5) * 28, y - 12); ctx.stroke();
      }
      ctx.restore();
      ctx.drawImage(weatherCanvas, 0, 0, w, h);
    }
    if (hasTyphoonWeather()) {
      ctx.save();
      ctx.fillStyle = 'rgba(44, 124, 143, .18)';
      ctx.fillRect(0, 0, w, h);
      const cx = state.weatherCenter.x - world.cameraX;
      const cy = state.weatherCenter.y - world.cameraY;
      ctx.translate(cx, cy);
      ctx.rotate(t * .8);
      for (let i = 0; i < 7; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 2);
        ctx.strokeStyle = `rgba(177, 247, 239, ${.4 - i * .035})`;
        ctx.lineWidth = 25 - i * 2;
        ctx.beginPath();
        ctx.arc(0, 0, 90 + i * 52, -.98, .98);
        ctx.stroke();
        ctx.restore();
      }
      ctx.rotate(-t * 1.7);
      ctx.strokeStyle = 'rgba(226, 255, 240, .62)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 54; i++) {
        const angle = i / 54 * TAU;
        const radius = 105 + (i % 7) * 35;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.lineTo(Math.cos(angle + .28) * (radius + 64), Math.sin(angle + .28) * (radius + 64));
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = 'rgba(105, 190, 199, .2)';
      ctx.fillRect(0, 0, w, h);
      ctx.translate(cx, cy);
      ctx.rotate(t * 2.6);
      for (let i = 0; i < 7; i++) {
        const y = -92 + i * 25;
        const halfWidth = 15 + i * 8;
        ctx.strokeStyle = `rgba(219, 255, 247, ${.72 - i * .065})`;
        ctx.lineWidth = 7 - i * .45;
        ctx.beginPath();
        ctx.ellipse(0, y, halfWidth, 6 + i * .65, 0, .18, Math.PI - .18);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(15, 58, 71, .85)';
      ctx.beginPath(); ctx.ellipse(0, 75, 43, 13, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(206, 255, 243, .8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 75, 43, 13, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    // In hellstorm, redraw the sandstorm mask last so wind effects cannot leak through the fog.
    if (hasSandstormWeather() && hasTyphoonWeather()) ctx.drawImage(weatherCanvas, 0, 0, w, h);
    ctx.restore();
  }

  function drawGround() {
    ctx.fillStyle = '#253747';
    ctx.fillRect(0, 0, world.w, world.h);
    const gridSize = 80 * MAP_SCALE;
    for (let y = 0; y < world.h; y += gridSize) {
      for (let x = 0; x < world.w; x += gridSize) {
        const v = ((x / gridSize) * 13 + (y / gridSize) * 7) % 5;
        ctx.fillStyle = v === 0 ? '#2b4050' : v === 1 ? '#203342' : '#263b4a';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + gridSize - 10, y + 9);
        ctx.lineTo(x + gridSize - 4, y + gridSize - 15);
        ctx.lineTo(x + 15, y + gridSize - 4);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (let i = 0; i < 58; i++) {
      const x = (i * 137) % world.w;
      const y = (i * 251 + 41) % world.h;
      ctx.fillStyle = i % 3 ? '#1c2b38' : '#36505b';
      ctx.beginPath();
      ctx.arc(x, y, 3 + (i % 5), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(10, 17, 24, .24)';
    ctx.fillRect(0, 0, world.w, 100);
    ctx.fillRect(0, world.h - 70, world.w, 70);
  }

  function drawRail() {
    ctx.fillStyle = '#17222d';
    ctx.fillRect(-80, rail.bandTop, world.w + 160, rail.bandHeight);
    ctx.fillStyle = '#4a555b';
    ctx.fillRect(-80, rail.upper, world.w + 160, 9 * MAP_SCALE);
    ctx.fillRect(-80, rail.lower, world.w + 160, 9 * MAP_SCALE);
    for (let x = -30; x < world.w + 50; x += 38 * MAP_SCALE) {
      ctx.fillStyle = '#9d724c';
      ctx.fillRect(x, rail.bandTop + 14 * MAP_SCALE, 12 * MAP_SCALE, 92 * MAP_SCALE);
      ctx.fillStyle = 'rgba(19, 20, 21, .35)';
      ctx.fillRect(x + 10 * MAP_SCALE, rail.bandTop + 14 * MAP_SCALE, 3 * MAP_SCALE, 92 * MAP_SCALE);
    }
    ctx.fillStyle = '#82959a';
    ctx.fillRect(-80, rail.upper - 3 * MAP_SCALE, world.w + 160, 7 * MAP_SCALE);
    ctx.fillRect(-80, rail.lower - 3 * MAP_SCALE, world.w + 160, 7 * MAP_SCALE);
    ctx.save();
    ctx.fillStyle = '#17222d';
    ctx.fillRect(verticalRail.x - verticalRail.width / 2, -80, verticalRail.width, world.h + 160);
    ctx.fillStyle = '#4a555b';
    ctx.fillRect(verticalRail.x - 30, -80, 9, world.h + 160);
    ctx.fillRect(verticalRail.x + 21, -80, 9, world.h + 160);
    for (let y = -30; y < world.h + 50; y += 56) {
      ctx.fillStyle = '#9d724c';
      ctx.fillRect(verticalRail.x - 42, y, 84, 11);
      ctx.fillStyle = 'rgba(19, 20, 21, .35)';
      ctx.fillRect(verticalRail.x - 42, y + 8, 84, 3);
    }
    ctx.restore();
    ctx.fillStyle = '#0f1a22';
    ctx.fillRect(-80, rail.upper + 4 * MAP_SCALE, world.w + 160, 3 * MAP_SCALE);
    ctx.fillRect(-80, rail.lower + 4 * MAP_SCALE, world.w + 160, 3 * MAP_SCALE);
  }

  function drawShopBuilding() {
    const { x, y, w, h } = shopZone;
    ctx.fillStyle = '#19272e';
    ctx.fillRect(x - 14, y - 10, w + 28, h + 18);
    ctx.fillStyle = '#a66548';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e0a071';
    ctx.fillRect(x + 10, y + 14, w - 20, 6);
    ctx.fillStyle = '#6f4238';
    ctx.fillRect(x + 12, y + 42, w - 24, h - 42);
    ctx.fillStyle = '#122028';
    ctx.fillRect(x + 79, y + 78, 60, 77);
    ctx.fillStyle = '#f4ca69';
    ctx.fillRect(x - 9, y - 25, w + 18, 31);
    ctx.fillStyle = '#5d392e';
    ctx.fillRect(x - 9, y + 1, w + 18, 6);
    ctx.fillStyle = '#53372d';
    ctx.font = '900 16px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('补 给 站', x + w / 2, y - 5);
    ctx.textAlign = 'start';
  }

  function drawWall(wall) {
    ctx.save();
    ctx.translate(wall.x, wall.y);
    ctx.fillStyle = 'rgba(8, 16, 20, .32)';
    ctx.beginPath(); ctx.ellipse(0, 23, 37, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8ea2a4';
    ctx.fillRect(-32, -25, 64, 48);
    ctx.strokeStyle = '#30494f';
    ctx.lineWidth = 4;
    ctx.strokeRect(-32, -25, 64, 48);
    ctx.strokeStyle = '#647a7e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-31, -7); ctx.lineTo(31, -7);
    ctx.moveTo(-31, 9); ctx.lineTo(31, 9);
    ctx.moveTo(-15, -24); ctx.lineTo(-15, -8);
    ctx.moveTo(15, -8); ctx.lineTo(15, 9);
    ctx.moveTo(-7, 9); ctx.lineTo(-7, 22);
    ctx.stroke();
    if (wall.hits >= 1) {
      ctx.strokeStyle = '#31454a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-18, -18); ctx.lineTo(-5, -8); ctx.lineTo(-13, 3); ctx.lineTo(-2, 14); ctx.stroke();
    }
    if (wall.hits >= 2) {
      ctx.fillStyle = '#53686b';
      ctx.beginPath(); ctx.moveTo(7, -23); ctx.lineTo(28, -20); ctx.lineTo(21, -3); ctx.lineTo(5, -9); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#263a3e';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(8, 8); ctx.lineTo(21, 20); ctx.stroke();
    }
    ctx.restore();
  }

  function drawDebris(debris) {
    if (debris.kind === 'helmet') {
      ctx.save();
      ctx.translate(debris.x, debris.y);
      ctx.rotate(debris.rotation);
      ctx.fillStyle = 'rgba(8, 16, 20, .34)';
      ctx.beginPath(); ctx.ellipse(0, 12, 20, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b38a40';
      ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI, TAU); ctx.lineTo(15, 2); ctx.lineTo(-15, 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#493b2d'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#3f302a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-11, -9); ctx.lineTo(-1, 1); ctx.lineTo(8, -10); ctx.stroke();
      ctx.fillStyle = '#66777a'; ctx.fillRect(5, -2, 12, 5);
      ctx.restore();
      return;
    }
    if (debris.kind === 'rock') {
      drawRockDebris(debris);
      return;
    }
    ctx.save();
    ctx.translate(debris.x, debris.y);
    ctx.rotate(debris.rotation);
    ctx.fillStyle = 'rgba(8, 16, 20, .34)';
    ctx.beginPath(); ctx.ellipse(0, 13, 38, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#65797c';
    for (const [x, y, size] of [[-20, 2, 10], [-8, -4, 13], [8, 4, 12], [21, -3, 9], [2, 12, 8]]) {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
    ctx.fillStyle = '#aababa';
    ctx.fillRect(-13, -8, 8, 5);
    ctx.fillRect(9, 0, 7, 4);
    ctx.restore();
  }

  function drawGemMine() {
    const mine = state.gemMine;
    ctx.save();
    ctx.translate(mine.x, mine.y);
    const glow = mine.repaired ? .62 + Math.sin(state.time * 4) * .18 : 0;

    ctx.fillStyle = 'rgba(8, 16, 23, .38)';
    ctx.beginPath(); ctx.ellipse(0, 55, 105, 19, 0, 0, TAU); ctx.fill();

    // Rocky cliff face framing the mine entrance.
    ctx.fillStyle = mine.upgraded ? '#59466f' : mine.repaired ? '#405d62' : '#535661';
    ctx.beginPath();
    ctx.moveTo(-100, 48); ctx.lineTo(-88, -17); ctx.lineTo(-65, -62); ctx.lineTo(-25, -75);
    ctx.lineTo(18, -70); ctx.lineTo(67, -51); ctx.lineTo(96, -7); ctx.lineTo(102, 48);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1b2b34'; ctx.lineWidth = 5; ctx.stroke();

    ctx.fillStyle = mine.upgraded ? '#302546' : mine.repaired ? '#223b43' : '#252d37';
    ctx.beginPath(); ctx.ellipse(1, 24, 62, 48, 0, Math.PI, 0); ctx.lineTo(63, 48); ctx.lineTo(-61, 48); ctx.closePath(); ctx.fill();

    if (mine.repaired) {
      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = mine.upgraded ? '#b679ff' : '#57e6d3';
      ctx.beginPath(); ctx.ellipse(1, 22, 46, 34, 0, Math.PI, 0); ctx.lineTo(47, 47); ctx.lineTo(-45, 47); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#78533a'; ctx.lineWidth = 9;
      for (const x of [-54, 54]) { ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x * .83, -36); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-58, -37); ctx.lineTo(58, -37); ctx.stroke();
      ctx.strokeStyle = '#b7885e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-57, -42); ctx.lineTo(57, -42); ctx.stroke();

      ctx.strokeStyle = '#687d80'; ctx.lineWidth = 4;
      for (const y of [38, 51]) { ctx.beginPath(); ctx.moveTo(-84, y); ctx.lineTo(80, y); ctx.stroke(); }
      ctx.strokeStyle = '#8b6749'; ctx.lineWidth = 5;
      for (let x = -72; x <= 67; x += 24) { ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x + 5, 57); ctx.stroke(); }

      ctx.fillStyle = mine.upgraded ? '#d9a7ff' : '#f8d56d'; ctx.beginPath(); ctx.arc(-67, -29, 9, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2b363b'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = mine.upgraded ? 'rgba(210, 148, 255, .22)' : 'rgba(249, 221, 115, .17)'; ctx.beginPath(); ctx.moveTo(-67, -20); ctx.lineTo(-105, 26); ctx.lineTo(-28, 26); ctx.closePath(); ctx.fill();
      for (const [x, y, size] of [[-17, 6, 10], [12, 22, 12], [30, 1, 8]]) drawGem(x, y, size / 13, mine.upgraded ? '#d69aff' : '#7ff5e1', .92);
      ctx.restore();
    } else {
      ctx.fillStyle = '#777a7e';
      for (const [x, y, r] of [[-48, 30, 26], [-13, 17, 31], [23, 28, 29], [52, 35, 20]]) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = '#252d35'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-73, -20); ctx.lineTo(-44, -2); ctx.lineTo(-61, 17); ctx.lineTo(-31, 39); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(57, -18); ctx.lineTo(36, 5); ctx.lineTo(54, 19); ctx.stroke();

      ctx.save(); ctx.translate(73, 3); ctx.rotate(-.14);
      ctx.fillStyle = '#c26f47'; ctx.fillRect(-22, -17, 44, 30);
      ctx.strokeStyle = '#492f2b'; ctx.lineWidth = 4; ctx.strokeRect(-22, -17, 44, 30);
      ctx.fillStyle = '#ffe0a0'; ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 0, 6);
      ctx.restore();
    }

    ctx.fillStyle = mine.upgraded ? '#f0dcff' : mine.repaired ? '#efffd9' : '#e5c995';
    ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(mine.repaired ? '宝石矿井' : '坍塌矿井', 0, -91);
    ctx.font = '900 10px sans-serif';
    ctx.fillStyle = mine.upgraded ? '#d99bff' : mine.repaired ? '#70eddb' : '#e49b72';
    ctx.fillText(mine.repaired ? (mine.upgraded ? '每 1.5 秒产出宝石' : '每 3 秒产出宝石') : '点击修复 · 20 宝石', 0, -76);
    ctx.restore();
  }

  function updateShockwaves(dt) {
    for (const wave of state.shockwaves) {
      wave.previousRadius = wave.radius;
      wave.radius = Math.min(wave.maxRadius, wave.radius + wave.speed * dt);
      wave.life += dt;
      for (const bullet of state.bullets) {
        if (bullet.blocked || bullet.spent) continue;
        const bulletDistance = Math.hypot(bullet.x - wave.x, bullet.y - wave.y);
        if (bulletDistance + bullet.radius >= wave.previousRadius && bulletDistance - bullet.radius <= wave.radius) {
          bullet.blocked = true;
          emit(bullet.x, bullet.y, '#79dfff', 5, 95);
        }
      }
    }
    state.bullets = state.bullets.filter(bullet => !bullet.blocked);
    state.shockwaves = state.shockwaves.filter(wave => wave.radius < wave.maxRadius && wave.life < wave.maxLife);
  }

  function drawAirdrop() {
    const drop = state.airdrop;
    if (!drop.spawned || drop.opened) return;
    ctx.save();
    ctx.translate(drop.x, drop.y);
    const landed = Math.abs(drop.y - drop.targetY) < 1;
    ctx.fillStyle = 'rgba(8, 14, 18, .32)'; ctx.beginPath(); ctx.ellipse(0, 34, 36, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d9e7e5'; ctx.lineWidth = 4;
    if (!landed) {
      ctx.beginPath(); ctx.arc(0, -44, 32, Math.PI, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-31, -44); ctx.lineTo(-24, 0); ctx.moveTo(31, -44); ctx.lineTo(24, 0); ctx.stroke();
    }
    ctx.fillStyle = '#8d5a43'; ctx.fillRect(-27, -2, 54, 38);
    ctx.strokeStyle = '#382b2c'; ctx.lineWidth = 4; ctx.strokeRect(-27, -2, 54, 38);
    ctx.fillStyle = '#f3c862'; ctx.fillRect(-29, 10, 58, 8);
    ctx.fillStyle = '#52e1d1'; ctx.beginPath(); ctx.arc(0, 8, 6, 0, TAU); ctx.fill();
    if (landed) {
      ctx.fillStyle = '#fff0c8'; ctx.font = '900 13px Nunito'; ctx.textAlign = 'center';
      ctx.fillText('空投', 0, -18);
      ctx.fillStyle = '#9dfff0'; ctx.font = '900 10px Nunito'; ctx.fillText('靠近后左键开启', 0, 54);
    }
    ctx.restore();
  }

  function drawShockwave(wave) {
    const progress = wave.radius / wave.maxRadius;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress) * .95;
    ctx.strokeStyle = '#66dfff';
    ctx.lineWidth = 10 - progress * 5;
    ctx.shadowColor = '#2fa9ff';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(wave.x, wave.y, wave.radius, 0, TAU); ctx.stroke();
    ctx.globalAlpha *= .42;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(wave.x, wave.y, Math.max(0, wave.radius - 18), 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function drawUmbrella(umbrella) {
    ctx.save();
    ctx.translate(umbrella.x, umbrella.y);
    const wear = umbrella.hits / 3;
    ctx.strokeStyle = '#3a4a51';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, 56); ctx.stroke();
    ctx.fillStyle = `rgba(246, ${168 - wear * 45}, ${91 + wear * 30}, .92)`;
    ctx.strokeStyle = '#273942';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-112, 4); ctx.quadraticCurveTo(0, -92, 112, 4);
    ctx.lineTo(72, 2); ctx.quadraticCurveTo(55, -24, 38, 3);
    ctx.quadraticCurveTo(18, -27, 0, 4);
    ctx.quadraticCurveTo(-18, -27, -38, 3);
    ctx.quadraticCurveTo(-55, -24, -72, 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (umbrella.hits > 0) {
      ctx.strokeStyle = 'rgba(52, 42, 46, .8)'; ctx.lineWidth = 3;
      for (let i = 0; i < umbrella.hits; i++) { ctx.beginPath(); ctx.moveTo(-38 + i * 35, -30); ctx.lineTo(-20 + i * 38, 5); ctx.stroke(); }
    }
    ctx.restore();
  }

  function drawRockDebris(debris) {
    const size = debris.radius;
    ctx.save();
    ctx.translate(debris.x, debris.y);
    ctx.rotate(debris.rotation);
    ctx.fillStyle = 'rgba(8, 16, 20, .36)';
    ctx.beginPath();
    ctx.ellipse(0, size * .48, size * 1.28, size * .42, 0, 0, TAU);
    ctx.fill();
    const fragments = [
      [-.58, .14, .42, '#596b73'],
      [-.21, -.2, .58, '#71848a'],
      [.29, .1, .5, '#60737b'],
      [.68, -.14, .34, '#4c5f68'],
      [.08, .48, .36, '#52656e'],
    ];
    for (const [x, y, scale, color] of fragments) {
      const radius = size * scale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(size * x - radius, size * y + radius * .25);
      ctx.lineTo(size * x - radius * .15, size * y - radius);
      ctx.lineTo(size * x + radius, size * y - radius * .35);
      ctx.lineTo(size * x + radius * .55, size * y + radius * .82);
      ctx.lineTo(size * x - radius * .72, size * y + radius * .7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#344b54';
      ctx.lineWidth = Math.max(2, size * .06);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCannon(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    const active = getPlayers().some(player => player.cannon === c);
    if (active) {
      ctx.strokeStyle = 'rgba(91, 248, 218, .7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 39 + Math.sin(state.time * 4) * 2, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(244, 232, 172, .72)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(c.angle) * 520, Math.sin(c.angle) * 520);
      ctx.stroke();
    }
    ctx.fillStyle = '#13252c';
    ctx.beginPath();
    ctx.ellipse(0, 11, 30, 13, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#405b61';
    ctx.fillRect(-17, 8, 34, 11);
    ctx.fillStyle = '#91b4b7';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#243b43';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.rotate(c.angle);
    ctx.fillStyle = '#a7d0d1';
    ctx.fillRect(4, -9, 43, 18);
    ctx.strokeStyle = '#243b43';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, -9, 43, 18);
    if (c.flash) {
      ctx.fillStyle = '#fff4a9';
      ctx.beginPath();
      ctx.arc(50, 0, 12 + c.flash * 42, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(c.x, c.y);
    const charge = clamp(1 - c.cooldown / 5, 0, 1);
    ctx.fillStyle = 'rgba(10, 20, 26, .9)';
    ctx.fillRect(-36, 39, 72, 7);
    ctx.fillStyle = charge >= 1 ? '#4de6d3' : '#ffd866';
    ctx.fillRect(-35, 40, 70 * charge, 5);
    ctx.fillStyle = '#edf1d8';
    ctx.font = '900 9px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText(c.cooldown > 0 ? `${c.cooldown.toFixed(1)}s` : '就绪', 0, 58);
    ctx.restore();
  }

  function drawTrain(train) {
    for (const car of train.cars.slice().reverse()) {
      if (car.destroyed) continue;
      const position = trainCarPosition(train, car);
      const x = position.x;
      const y = position.y;
      if (!train.vertical) {
        if (car.type === 'engine') drawEngine(x, y, car.monster);
        else drawCar(x, y, car.type);
        continue;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 2);
      if (car.type === 'engine') drawEngine(0, 0, { ...car.monster, angle: car.monster.angle - Math.PI / 2 });
      else drawCar(0, 0, car.type);
      ctx.restore();
    }
  }

  function drawCar(x, y, type) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(10, 14, 19, .35)';
    ctx.fillRect(-37, 24, 80, 11);
    ctx.fillStyle = '#2b3339';
    ctx.fillRect(-40, -21, 80, 51);
    ctx.fillStyle = type === 'gem' ? '#2b7790' : '#585e63';
    ctx.fillRect(-34, -17, 68, 37);
    ctx.strokeStyle = '#17252d';
    ctx.lineWidth = 4;
    ctx.strokeRect(-34, -17, 68, 37);
    for (const wheelX of [-23, 24]) {
      ctx.fillStyle = '#18222a';
      ctx.beginPath(); ctx.arc(wheelX, 27, 10, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#788085'; ctx.lineWidth = 3; ctx.stroke();
    }
    if (type === 'gem') {
      drawGem(-16, -4, .75, '#5bf0df');
      drawGem(5, 5, .64, '#b187ff');
      drawGem(18, -5, .55, '#68e8e0');
    } else {
      ctx.fillStyle = '#252c31';
      for (const [cx, cy, r] of [[-16, 4, 10], [0, -1, 13], [17, 5, 11]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  function drawEngine(x, y, monster) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(10, 14, 19, .38)'; ctx.fillRect(-48, 24, 98, 12);
    ctx.fillStyle = '#7c3f4d'; ctx.fillRect(-42, -22, 86, 48);
    ctx.fillStyle = '#e15b55'; ctx.fillRect(-37, -17, 73, 34);
    ctx.strokeStyle = '#372d38'; ctx.lineWidth = 4; ctx.strokeRect(-37, -17, 73, 34);
    ctx.fillStyle = '#25353e'; ctx.fillRect(-30, -49, 39, 29);
    ctx.fillStyle = '#9ec9c7'; ctx.fillRect(-25, -44, 13, 15);
    ctx.fillStyle = '#182329'; ctx.fillRect(12, -38, 16, 19);
    for (const wheelX of [-26, 25]) { ctx.fillStyle = '#18222a'; ctx.beginPath(); ctx.arc(wheelX, 26, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#788085'; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = '#1e2527'; ctx.fillRect(32, -9, 16, 25);
    ctx.fillStyle = '#f7d063'; ctx.beginPath(); ctx.arc(45, 2, 7, 0, TAU); ctx.fill();
    drawMonster(1, -60, monster);
    ctx.restore();
  }

  function drawMonster(x, y, monster) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#6f9f61'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a8d982'; ctx.beginPath(); ctx.arc(-6, -4, 5, 0, TAU); ctx.arc(7, -4, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a2329'; ctx.beginPath(); ctx.arc(-5, -4, 2, 0, TAU); ctx.arc(8, -4, 2, 0, TAU); ctx.fill();
    if (monster.minerHelmet) {
      ctx.fillStyle = '#e7bd5e';
      ctx.beginPath(); ctx.arc(0, -12, 19, Math.PI, TAU); ctx.lineTo(19, -10); ctx.lineTo(-19, -10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#493b2d'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#81999a'; ctx.fillRect(-16, -13, 32, 5);
      ctx.save();
      ctx.translate(13, -14);
      ctx.rotate(monster.angle || 0);
      ctx.fillStyle = '#fff0a1'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#253943'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255, 240, 161, .16)';
      ctx.beginPath(); ctx.moveTo(5, -4); ctx.lineTo(66, -22); ctx.lineTo(66, 22); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(9, 8);
    ctx.rotate(monster.angle || 0);
    ctx.fillStyle = monster.weapon === 'splitter' ? '#704d91' : monster.weapon === 'sniper' ? '#60758d' : '#33444a';
    ctx.fillRect(0, 0, 24, 7);
    ctx.fillRect(18, -3, 13, 5);
    if (monster.weapon === 'splitter') ctx.fillRect(18, 6, 13, 5);
    if (monster.weapon === 'sniper') ctx.fillRect(18, -1, 25, 3);
    if (monster.flash) { ctx.fillStyle = '#fff1a1'; ctx.beginPath(); ctx.arc(34, 2, 8, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }

  function drawPlayer(p) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.downed) {
      ctx.rotate(.22);
      ctx.fillStyle = 'rgba(8, 14, 18, .45)'; ctx.beginPath(); ctx.ellipse(0, 13, 23, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = p === state.player ? '#a85a65' : '#587da6'; ctx.fillRect(-21, -2, 42, 15);
      ctx.fillStyle = '#d7c9bf'; ctx.beginPath(); ctx.arc(-17, -8, 12, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -25); ctx.lineTo(-5, -39); ctx.moveTo(-12, -32); ctx.lineTo(2, -32); ctx.stroke();
      ctx.fillStyle = '#fff0c8'; ctx.font = '900 10px Nunito'; ctx.textAlign = 'center'; ctx.fillText(p === state.player ? 'P1' : 'P2', 0, -46);
      ctx.restore();
      return;
    }
    if (p.knockback > 0) {
      ctx.globalAlpha = .72 + Math.sin(state.time * 42) * .22;
      ctx.rotate(p.hitRotation);
      ctx.scale(1.08, .9);
    } else if (p.stun > 0) {
      ctx.globalAlpha = .72 + Math.sin(state.time * 18) * .25;
      ctx.rotate(Math.sin(state.time * 11) * .08);
    }
    const palette = p.skin === 'snow'
      ? { body: '#7faeb1', fur: '#f5f0df', ear: '#e7dfc8', innerEar: '#c2b79d', tail: '#66999f', nose: '#e7a8ae' }
      : p.skin === 'mint'
        ? { body: '#5f9e9c', fur: '#a4e4d3', ear: '#8fd1c3', innerEar: '#5a9d94', tail: '#477f83', nose: '#d9849a' }
        : { body: '#d8747d', fur: '#f5c7a2', ear: '#eebc9d', innerEar: '#ad6e65', tail: '#a55c61', nose: '#f29b9b' };
    const moving = !p.cannon && p.stun <= 0 && (p === state.player
      ? keys.has('KeyW') || keys.has('KeyA') || keys.has('KeyS') || keys.has('KeyD')
      : keys.has('ArrowUp') || keys.has('ArrowLeft') || keys.has('ArrowDown') || keys.has('ArrowRight'));
    const runPhase = state.time * (p.speedBuff > 0 ? 19 : 13) + (p === state.player2 ? Math.PI : 0);
    const stride = moving ? Math.sin(runPhase) : 0;
    const bob = moving ? Math.abs(Math.cos(runPhase)) * 2 : 0;
    ctx.translate(0, -bob);
    if (p.helmet) {
      ctx.save();
      ctx.rotate(p.facing || 0);
      ctx.fillStyle = 'rgba(255, 232, 149, .12)';
      ctx.beginPath();
      ctx.moveTo(9, -25);
      ctx.lineTo(150, -72);
      ctx.lineTo(150, 25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(8, 14, 18, .32)'; ctx.beginPath(); ctx.ellipse(0, 15 + bob, 16, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = palette.body; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-5, 14); ctx.lineTo(-7 + stride * 5, 22); ctx.moveTo(5, 14); ctx.lineTo(7 - stride * 5, 22); ctx.stroke();
    ctx.fillStyle = palette.body; ctx.fillRect(-10, -1, 20, 18);
    ctx.fillStyle = palette.fur; ctx.beginPath(); ctx.arc(0, -10, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = palette.ear; ctx.beginPath(); ctx.moveTo(-12, -18); ctx.lineTo(-12, -31); ctx.lineTo(-3, -22); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, -18); ctx.lineTo(12, -31); ctx.lineTo(3, -22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = palette.innerEar; ctx.beginPath(); ctx.moveTo(-11, -20); ctx.lineTo(-10, -27); ctx.lineTo(-5, -21); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(11, -20); ctx.lineTo(10, -27); ctx.lineTo(5, -21); ctx.closePath(); ctx.fill();
    if (p.helmet) {
      ctx.fillStyle = '#e7bd5e'; ctx.beginPath(); ctx.arc(0, -20, 16, Math.PI, TAU); ctx.lineTo(16, -18); ctx.lineTo(-16, -18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#81999a'; ctx.fillRect(-13, -21, 26, 5);
      ctx.fillStyle = '#fff0a1'; ctx.beginPath(); ctx.arc(11, -25, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#253943'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = '#2f3c43'; ctx.beginPath(); ctx.arc(-5, -10, 2.1, 0, TAU); ctx.arc(5, -10, 2.1, 0, TAU); ctx.fill();
    ctx.fillStyle = palette.nose; ctx.beginPath(); ctx.arc(0, -5, 2.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = palette.tail; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 7); ctx.quadraticCurveTo(24, 2 + stride * 5, 20 + stride * 4, -10); ctx.stroke();
    if (isTwoPlayer()) {
      ctx.fillStyle = p === state.player ? '#ffd866' : '#8cbcff';
      ctx.font = '900 10px Nunito'; ctx.textAlign = 'center'; ctx.fillText(p === state.player ? 'P1' : 'P2', 0, -43);
    }
    if (p.stun > 0) {
      ctx.fillStyle = '#ffe37b';
      for (const [x, y] of [[-13, -35], [0, -43], [13, -35]]) {
        ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawGem(x, y, scale = 1, color = '#52e1d1', alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#124b5a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, -4); ctx.lineTo(5, 13); ctx.lineTo(-5, 13); ctx.lineTo(-10, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, -4); ctx.lineTo(4, 10); ctx.lineTo(-4, 10); ctx.lineTo(-10, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(0, -10); ctx.lineTo(-1, -1); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawFallingRock(rock) {
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = '#0c1820';
    ctx.beginPath();
    ctx.ellipse(rock.x, rock.targetY + 6, rock.radius * 1.15, rock.radius * .38, 0, 0, TAU);
    ctx.fill();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.rotation);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#687880';
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const angle = i / 7 * TAU;
      const radius = rock.radius * (i % 2 ? .8 : 1.05);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#314750';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawShell(s) { ctx.fillStyle = '#fff1a5'; ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, TAU); ctx.fill(); ctx.strokeStyle = '#df774d'; ctx.lineWidth = 2; ctx.stroke(); }
  function drawSniperTrail(trail) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - trail.age) * .48;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * Math.max(.25, 1 - trail.age);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(trail.x1, trail.y1); ctx.lineTo(trail.x2, trail.y2); ctx.stroke();
    ctx.restore();
  }
  function drawBullet(b) {
    if (b.type === 'sniper') {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillStyle = '#e7f5ff';
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, -7); ctx.lineTo(-4, 0); ctx.lineTo(-9, 7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7fa5bc'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      return;
    }
    if (b.type === 'splitter') {
      ctx.fillStyle = 'rgba(182, 140, 255, .24)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 1.65, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a87eff';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f4ddff';
      ctx.lineWidth = 3;
      ctx.stroke();
      return;
    }
    ctx.fillStyle = b.type === 'splitShard' ? '#c09aff' : '#ed8460';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff0af';
    ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, 2, 0, TAU); ctx.fill();
  }
  function drawParticle(p) { ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); ctx.globalAlpha = 1; }

  function startGame() {
    gameMode = 'single';
    startGameMode();
  }

  function startCoopGame() {
    gameMode = 'coop';
    startGameMode();
  }

  function restartGame() {
    if (isTwoPlayer()) startCoopGame();
    else startGame();
  }

  function startGameMode() {
    started = true;
    paused = false;
    gameOver = false;
    ui.start.hidden = true;
    ui.pause.hidden = true;
    ui.gameOver.hidden = true;
    ui.artifactScreen.hidden = true;
    ui.tutorialReturnPause.hidden = true;
    ui.tutorialMainMenu.hidden = false;
    document.querySelector('.game-shell').classList.toggle('coop-mode', isTwoPlayer());
    ui.pause.classList.toggle('coop-mode', isTwoPlayer());
    ui.shop.hidden = false;
    resetGame();
    startMusic();
    last = performance.now();
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true;
    keys.clear();
    state.player.cannon = null;
    ui.hint.classList.remove('visible');
    ui.shop.hidden = true;
    ui.gameOver.hidden = false;
    stopMusic();
  }

  function returnToMenu() {
    started = false;
    paused = false;
    gameOver = false;
    keys.clear();
    mouse.down = false;
    stopMusic();
    ui.pause.hidden = true;
    ui.gameOver.hidden = true;
    ui.artifactScreen.hidden = true;
    ui.shop.hidden = true;
    showMainMenu();
    ui.start.hidden = false;
    resetGame();
  }

  function showMenuPage(page) {
    ui.mainMenu.hidden = true;
    ui.menuPages.hidden = false;
    ui.skinPage.hidden = page !== 'skins';
    ui.tutorialPage.hidden = page !== 'tutorial';
    ui.settingsPage.hidden = page !== 'settings';
  }

  function showMainMenu() {
    ui.mainMenu.hidden = false;
    ui.menuPages.hidden = true;
    ui.skinPage.hidden = true;
    ui.tutorialPage.hidden = true;
    ui.tutorialReturnPause.hidden = true;
    ui.tutorialMainMenu.hidden = false;
    ui.settingsPage.hidden = true;
    updateSkinSelection();
    updateSettingsLabel();
    updateDifficultySelection();
  }

  function selectSkin(skin) {
    state.player.skin = skin;
    updateSkinSelection();
  }

  function updateSkinSelection() {
    ui.skinButtons.forEach(button => button.classList.toggle('selected', button.dataset.skin === state.player.skin));
  }

  function updateSettingsLabel() {
    ui.toggleShake.textContent = `画面震动：${state.reducedMotion ? '关闭' : '开启'}`;
    ui.toggleMusic.textContent = `背景音乐：${audio.musicEnabled ? '开启' : '关闭'}`;
    ui.toggleSfx.textContent = `游戏音效：${audio.sfxEnabled ? '开启' : '关闭'}`;
  }

  function updateDifficultySelection() {
    const difficulty = difficultyConfig();
    ui.difficultyCurrent.querySelector('b').textContent = difficulty.name;
    ui.difficultyOptions.forEach(button => button.classList.toggle('selected', button.dataset.difficulty === selectedDifficulty));
  }

  function selectDifficulty(difficulty) {
    if (!DIFFICULTIES[difficulty]) return;
    selectedDifficulty = difficulty;
    ui.difficultySelect.hidden = true;
    ui.difficultyCurrent.setAttribute('aria-expanded', 'false');
    updateDifficultySelection();
  }

  function gameLoop(time) {
    const dt = Math.min(.033, (time - last) / 1000 || 0);
    last = time;
    if (started && !paused && !gameOver) update(dt);
    draw();
    requestAnimationFrame(gameLoop);
  }

  function toggleCannon() {
    if (state.player.stun > 0 || state.player.downed) return;
    if (state.player.cannon) { state.player.cannon = null; return; }
    const nearest = findNearestCannon();
    if (nearest) { claimCannon(state.player, nearest); showToast('P1 已接管炮台'); }
  }

  function claimCannon(player, cannon) {
    for (const other of getPlayers()) other.cannon = null;
    player.cannon = cannon;
  }

  function buyCannon() {
    const buyer = getShopCustomer();
    const inventory = buyer && inventoryFor(buyer);
    const slot = inventory ? inventory.findIndex(item => !item) : -1;
    if (slot < 0) { showToast('物品栏已满'); return; }
    if (!buyer) { showToast('请靠近矿井补给站'); return; }
    const price = priceFor(buyer, 12);
    if (state.gems < price) { showToast('宝石不够，去炸宝石车厢！'); return; }
    state.gems -= price;
    playSfx('buy');
    inventory[slot] = 'cannon';
    showToast('补给完成，点击物品栏中的大炮即可放置');
    syncUI();
  }

  function buyHelmet() {
    const buyer = getShopCustomer();
    const inventory = buyer && inventoryFor(buyer);
    const slot = inventory ? inventory.findIndex(item => !item) : -1;
    if (slot < 0) { showToast('物品栏已满'); return; }
    if (!buyer) { showToast('请靠近矿井补给站'); return; }
    if (buyer.helmet) { showToast('探照灯头盔已经佩戴'); return; }
    const price = priceFor(buyer, 18);
    if (state.gems < price) { showToast('宝石不够，先去收集更多宝石！'); return; }
    state.gems -= price;
    playSfx('buy');
    inventory[slot] = 'helmet';
    buyer.helmet = true;
    showToast('探照灯头盔已佩戴，受击伤害降至 10');
    syncUI();
  }

  function buyFish() {
    buyInventoryItem('fish', 6, '鱼罐头已放入物品栏');
  }

  function buyWall() {
    buyInventoryItem('wall', 8, '防护墙体已放入物品栏');
  }

  function buyCake() {
    buyInventoryItem('cake', 9, '蛋糕已放入物品栏');
  }

  function buyUmbrella() {
    buyInventoryItem('umbrella', 14, '保护伞已放入物品栏');
  }

  function buyInventoryItem(type, cost, message) {
    const buyer = getShopCustomer();
    const inventory = buyer && inventoryFor(buyer);
    const slot = inventory ? inventory.findIndex(item => !item) : -1;
    if (slot < 0) { showToast('物品栏已满'); return; }
    if (!buyer) { showToast('请靠近矿井补给站'); return; }
    const price = priceFor(buyer, cost);
    if (state.gems < price) { showToast('宝石不够，去炸宝石车厢！'); return; }
    state.gems -= price;
    playSfx('buy');
    inventory[slot] = type;
    showToast(message);
    syncUI();
  }

  function useInventorySlot(index, player = state.player) {
    const inventory = inventoryFor(player);
    const item = inventory[index];
    if (!item || player.stun > 0 || player.downed) return;
    if (item === 'cannon') {
      deployInventoryCannon(index, player);
      syncUI();
      return;
    }
    if (item === 'fish') {
      if (player.health >= player.maxHealth) { showToast('生命值已满'); return; }
      player.health = Math.min(player.maxHealth, player.health + 20);
      playSfx('heal');
      inventory[index] = null;
      emit(player.x, player.y, '#ffc976', 12, 95);
      showToast('吃下鱼罐头，恢复 20 生命');
    } else if (item === 'wall') {
      if (player.cannon) { showToast('离开炮台后再部署墙体'); return; }
      placeWall(player.x + Math.cos(player.facing) * 52, player.y + Math.sin(player.facing) * 52);
      inventory[index] = null;
      showToast('防护墙体已部署');
    } else if (item === 'umbrella') {
      if (player.cannon) { showToast('离开炮台后再部署保护伞'); return; }
      placeUmbrella(player.x + Math.cos(player.facing) * 48, player.y + Math.sin(player.facing) * 48);
      inventory[index] = null;
      showToast('保护伞已撑起，可拦截 3 次落石');
    } else if (item === 'cake') {
      player.speedBuff += 10;
      playSfx('heal');
      inventory[index] = null;
      emit(player.x, player.y, '#ffcf75', 14, 110);
      showToast('吃下蛋糕，移速翻倍 10 秒');
    } else if (item === 'helmet') {
      showToast('探照灯头盔已经佩戴');
      return;
    } else if (item === 'necklace') {
      showToast('魔法项链已佩戴，会在致命伤时自动触发');
      return;
    } else if (item === 'member') {
      showToast('会员卡生效中，商店价格已打七折');
      return;
    } else if (item === 'phoenix') {
      showToast('不死鸟之眼生效中，大炮摧毁车厢可恢复生命');
      return;
    } else if (item === 'grail') {
      showToast('圣杯生效中，每 2 秒恢复 1 点生命');
      return;
    } else if (item === 'barrel') {
      showToast('火药桶生效中，大炮冷却缩短至 2 秒');
      return;
    } else if (item === 'battery') {
      if (!state.gemMine.repaired) { showToast('先修复宝石矿井才能使用电池'); return; }
      if (distance(player, state.gemMine) > 170) { showToast('请靠近宝石矿井后使用电池'); return; }
      if (state.gemMine.upgraded) { showToast('宝石矿井已经升级'); return; }
      state.gemMine.upgraded = true;
      state.gemMine.productionTimer = Math.min(state.gemMine.productionTimer, 1.5);
      inventory[index] = null;
      emit(state.gemMine.x, state.gemMine.y, '#f6d77b', 24, 140);
      playSfx('repair');
      showToast('矿井电池已安装！每 1.5 秒产出一个宝石');
    }
    syncUI();
  }

  function deployInventoryCannon(index, player = state.player) {
    const inventory = inventoryFor(player);
    if (player.cannon) player.cannon = null;
    placeCannon(player.x + Math.cos(player.facing) * 40, player.y + Math.sin(player.facing) * 40);
    inventory[index] = null;
    showToast('大炮已部署');
  }

  function rescueWithKey(player, key) {
    if (!isTwoPlayer() || player.downed) return;
    const target = player === state.player ? state.player2 : state.player;
    if ((key === 'KeyQ' && player === state.player) || (key === 'KeyN' && player === state.player2)) {
      if (target.downed && distance(player, target) <= 78) {
        state.rescue = { rescuer: player, target, progress: 0 };
        showToast('正在救援，请持续按住 4 秒');
      }
    }
  }

  window.addEventListener('keydown', event => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'KeyM', 'KeyQ', 'KeyN', 'KeyP', 'KeyO', 'KeyI', 'Space', 'Escape'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (!started && event.code === 'Space' && !event.repeat && !ui.mainMenu.hidden && ui.supportModal.hidden) {
      startGame();
      return;
    }
    if (!started || gameOver) return;
    if (event.code === 'Escape' && !event.repeat) {
      if (!ui.artifactScreen.hidden) {
        closeArtifactChoice();
        return;
      }
      if (!ui.tutorialPage.hidden && !ui.tutorialReturnPause.hidden) {
        ui.tutorialReturnPause.hidden = true;
        ui.tutorialPage.hidden = true;
        ui.menuPages.hidden = true;
        ui.start.hidden = true;
        ui.pause.hidden = false;
        return;
      }
      paused = !paused;
      ui.pause.hidden = !paused;
      if (!paused) last = performance.now();
    }
    if (paused || event.repeat) return;
    if (event.code === 'KeyE') toggleCannon();
    if (event.code === 'KeyQ' && !event.repeat) rescueWithKey(state.player, 'KeyQ');
    if (event.code === 'KeyM' && !event.repeat && isTwoPlayer() && !state.player2.downed) {
      if (state.player2.cannon) state.player2.cannon = null;
      else {
        const nearest = findNearestCannon(state.player2);
        if (nearest) { claimCannon(state.player2, nearest); showToast('P2 已接管炮台'); }
      }
    }
    if (event.code === 'KeyN' && !event.repeat && isTwoPlayer()) rescueWithKey(state.player2, 'KeyN');
    if (event.code === 'KeyP' && !event.repeat) {
      const now = performance.now();
      testGemPresses = testGemPresses.filter(timestamp => now - timestamp <= 3000);
      testGemPresses.push(now);
      if (testGemPresses.length >= 5) {
        state.gems += 100;
        testGemPresses = [];
        showToast('测试：获得 100 个宝石');
      }
    }
    if (event.code === 'KeyO' && !event.repeat) {
      const now = performance.now();
      testWeatherPresses = testWeatherPresses.filter(timestamp => now - timestamp <= 3000);
      testWeatherPresses.push(now);
      if (testWeatherPresses.length >= 5) {
        testWeatherPresses = [];
        summonTestWeather();
      }
    }
    if (event.code === 'KeyI' && !event.repeat) {
      const now = performance.now();
      testAirdropPresses = testAirdropPresses.filter(timestamp => now - timestamp <= 3000);
      testAirdropPresses.push(now);
      if (testAirdropPresses.length >= 5) {
        testAirdropPresses = [];
        summonTestAirdrop();
      }
    }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  canvas.addEventListener('mousemove', event => { const box = canvas.getBoundingClientRect(); mouse.x = event.clientX - box.left; mouse.y = event.clientY - box.top; });
  canvas.addEventListener('mousedown', event => {
    if (event.button !== 0) return;
    mouse.down = true;
    if (started && !paused && !gameOver) {
      const target = screenToWorld(mouse.x, mouse.y);
      const drop = state.airdrop;
      const opener = getActivePlayers().find(player => distance(player, drop) < 105);
      if (drop.spawned && !drop.opened && drop.y >= drop.targetY && opener && distance(target, drop) < 68) {
        openAirdrop(opener);
        return;
      }
      if (state.player.downed) return;
      if (!state.player.cannon && !state.gemMine.repaired && distance(target, state.gemMine) < 120) {
        repairGemMine();
        return;
      }
      const controlledCannon = getPlayers().find(player => player.cannon)?.cannon;
      if (controlledCannon) fireShell(controlledCannon);
    }
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  ui.p1InventorySlots.forEach((slot, index) => slot.addEventListener('click', event => {
    event.preventDefault();
    if (started && !paused && !gameOver) useInventorySlot(index);
  }));
  ui.p2InventorySlots.forEach((slot, index) => slot.addEventListener('click', event => {
    event.preventDefault();
    if (started && !paused && !gameOver && isTwoPlayer()) useInventorySlot(index, state.player2);
  }));
  ui.buy.addEventListener('click', buyCannon);
  ui.buyHelmet.addEventListener('click', buyHelmet);
  ui.buyFish.addEventListener('click', buyFish);
  ui.buyWall.addEventListener('click', buyWall);
  ui.buyCake.addEventListener('click', buyCake);
  ui.buyUmbrella.addEventListener('click', buyUmbrella);
  ui.resume.addEventListener('click', () => { paused = false; ui.pause.hidden = true; last = performance.now(); });
  ui.pauseTutorial.addEventListener('click', () => {
    ui.pause.hidden = true;
    ui.start.hidden = false;
    ui.mainMenu.hidden = true;
    ui.menuPages.hidden = false;
    ui.skinPage.hidden = true;
    ui.tutorialPage.hidden = false;
    ui.settingsPage.hidden = true;
    ui.tutorialReturnPause.hidden = false;
    ui.tutorialMainMenu.hidden = true;
  });
  ui.tutorialReturnPause.addEventListener('click', () => {
    ui.tutorialReturnPause.hidden = true;
    ui.tutorialPage.hidden = true;
    ui.menuPages.hidden = true;
    ui.start.hidden = true;
    ui.pause.hidden = false;
  });
  ui.pauseMenu.addEventListener('click', returnToMenu);
  ui.menuStart.addEventListener('click', startGame);
  ui.menuTwoPlayer.addEventListener('click', startCoopGame);
  ui.menuSkins.addEventListener('click', () => showMenuPage('skins'));
  ui.menuTutorial.addEventListener('click', () => showMenuPage('tutorial'));
  ui.menuSettings.addEventListener('click', () => showMenuPage('settings'));
  ui.difficultyCurrent.addEventListener('click', () => {
    const isOpen = !ui.difficultySelect.hidden;
    ui.difficultySelect.hidden = isOpen;
    ui.difficultyCurrent.setAttribute('aria-expanded', String(!isOpen));
  });
  ui.difficultyOptions.forEach(button => button.addEventListener('click', () => selectDifficulty(button.dataset.difficulty)));
  ui.supportCreator.addEventListener('click', () => { ui.supportModal.hidden = false; });
  ui.supportClose.addEventListener('click', () => { ui.supportModal.hidden = true; });
  ui.supportModal.addEventListener('click', event => { if (event.target === ui.supportModal) ui.supportModal.hidden = true; });
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape' && !ui.supportModal.hidden) ui.supportModal.hidden = true;
  });
  ui.menuBacks.forEach(button => button.addEventListener('click', showMainMenu));
  ui.skinButtons.forEach(button => button.addEventListener('click', () => selectSkin(button.dataset.skin)));
  ui.toggleShake.addEventListener('click', () => {
    state.reducedMotion = !state.reducedMotion;
    if (state.reducedMotion) state.screenShake = 0;
    updateSettingsLabel();
  });
  ui.toggleMusic.addEventListener('click', () => {
    audio.musicEnabled = !audio.musicEnabled;
    if (audio.musicEnabled && started && !paused && !gameOver) startMusic();
    else stopMusic();
    updateSettingsLabel();
  });
  ui.toggleSfx.addEventListener('click', () => {
    audio.sfxEnabled = !audio.sfxEnabled;
    if (audio.sfxEnabled) { ensureAudio(); playSfx('buy'); }
    updateSettingsLabel();
  });
  ui.restart.addEventListener('click', restartGame);
  ui.gameOverMenu.addEventListener('click', returnToMenu);
  window.addEventListener('resize', resize);

  resize();
  resetGame();
  ui.shop.hidden = true;
  showMainMenu();
  requestAnimationFrame(gameLoop);
})();
