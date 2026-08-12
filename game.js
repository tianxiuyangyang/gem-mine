(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const ui = {
    gemCount: document.querySelector('#gem-count'),
    healthText: document.querySelector('#health-text'),
    healthFill: document.querySelector('#health-fill'),
    healthHud: document.querySelector('.health-hud'),
    wave: document.querySelector('#wave-text'),
    inventorySlots: [...document.querySelectorAll('.inventory-slot')],
    hint: document.querySelector('#hint'),
    shop: document.querySelector('#shop'),
    buy: document.querySelector('#buy-cannon'),
    buyHelmet: document.querySelector('#buy-helmet'),
    buyFish: document.querySelector('#buy-fish'),
    buyWall: document.querySelector('#buy-wall'),
    buyCake: document.querySelector('#buy-cake'),
    buyUmbrella: document.querySelector('#buy-umbrella'),
    buffHud: document.querySelector('#buff-hud'),
    buffText: document.querySelector('#buff-text'),
    toast: document.querySelector('#toast'),
    pause: document.querySelector('#pause-screen'),
    resume: document.querySelector('#resume'),
    pauseMenu: document.querySelector('#pause-menu'),
    start: document.querySelector('#start-screen'),
    mainMenu: document.querySelector('#main-menu'),
    menuPages: document.querySelector('#menu-pages'),
    menuStart: document.querySelector('#menu-start'),
    menuSkins: document.querySelector('#menu-skins'),
    menuTutorial: document.querySelector('#menu-tutorial'),
    menuSettings: document.querySelector('#menu-settings'),
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
  const audio = { context: null, musicEnabled: true, sfxEnabled: true, musicTimer: 0, musicStep: 0 };

  const state = {
    gems: 0,
    cannonInventory: 1,
    inventory: Array(6).fill(null),
    player: { x: 0, y: 0, radius: 16, speed: 235, facing: 0, skin: 'peach', health: 100, maxHealth: 100, helmet: false, hitCooldown: 0, trainHitCooldown: 0, stun: 0, speedBuff: 0, cannon: null },
    cannons: [],
    walls: [],
    umbrellas: [],
    debris: [],
    shells: [],
    bullets: [],
    sniperTrails: [],
    gemsOnGround: [],
    particles: [],
    trains: [],
    trainTimer: 2,
    trainRound: 0,
    fallingRocks: [],
    gemMine: { x: 175, y: 0, repaired: false, productionTimer: 3 },
    nextEarthquakeAt: 60,
    earthquakeEnd: 0,
    rockTimer: 0,
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
  const world = { w: 1800 * MAP_SCALE, h: 1100 * MAP_SCALE, cameraX: 0, cameraY: 0 };
  const rail = { bandTop: 350 * MAP_SCALE, bandHeight: 112 * MAP_SCALE, upper: 370 * MAP_SCALE, lower: 440 * MAP_SCALE, center: 405 * MAP_SCALE };
  const shopZone = { x: 1510 * MAP_SCALE, y: 860 * MAP_SCALE, w: 220 * MAP_SCALE, h: 155 * MAP_SCALE };

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
    state.gems = 0;
    state.cannonInventory = 1;
    state.inventory = Array(6).fill(null);
    state.cannons = [];
    state.walls = [];
    state.umbrellas = [];
    state.debris = [];
    state.shells = [];
    state.bullets = [];
    state.sniperTrails = [];
    state.gemsOnGround = [];
    state.particles = [];
    state.trains = [];
    state.trainTimer = 2;
    state.trainRound = 0;
    state.fallingRocks = [];
    state.gemMine = { x: 175, y: world.h - 180, repaired: false, productionTimer: 3 };
    state.nextEarthquakeAt = 60;
    state.earthquakeEnd = 0;
    state.rockTimer = 0;
    state.time = 0;
    world.cameraX = 0;
    world.cameraY = 0;
    state.screenShake = 0;
    state.player = { x: world.w * .42, y: world.h * .54, radius: 16, speed: 235, facing: 0, skin: selectedSkin, health: 100, maxHealth: 100, helmet: false, hitCooldown: 0, trainHitCooldown: 0, stun: 0, speedBuff: 0, cannon: null };
    placeCannon(state.player.x + 46, state.player.y + 4);
    state.cannonInventory = 0;
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
    const targetX = state.player.x - innerWidth / 2;
    const targetY = state.player.y - innerHeight / 2;
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
    return { cooldown: 1.8, flash: 0, angle: Math.PI, weapon: randomMonsterWeapon() };
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

  function fireShell(cannon) {
    if (cannon.cooldown > 0) return;
    playSfx('cannon');
    const target = screenToWorld(mouse.x, mouse.y);
    cannon.angle = Math.atan2(target.y - cannon.y, target.x - cannon.x);
    state.shells.push({ x: cannon.x + Math.cos(cannon.angle) * 36, y: cannon.y + Math.sin(cannon.angle) * 36, vx: Math.cos(cannon.angle) * 570, vy: Math.sin(cannon.angle) * 570, radius: 7, life: 2.3 });
    cannon.cooldown = 5;
    cannon.flash = .14;
    state.screenShake = state.reducedMotion ? 0 : 5;
    emit(cannon.x + Math.cos(cannon.angle) * 42, cannon.y + Math.sin(cannon.angle) * 42, '#ffd76d', 13, 165);
  }

  function fireMonster(train, engineCar) {
    const monster = engineCar.monster;
    const engine = { x: train.x + engineCar.offset, y: train.y - 17 };
    const dx = state.player.x - engine.x;
    const dy = state.player.y - engine.y;
    const base = monster.angle;
    if (monster.weapon === 'splitter') {
      playSfx('splitter');
      state.bullets.push({ x: engine.x, y: engine.y, vx: Math.cos(base) * SPLITTER_LARGE_SPEED, vy: Math.sin(base) * SPLITTER_LARGE_SPEED, radius: 16, type: 'splitter' });
      monster.cooldown = 1.8;
      monster.flash = .16;
      return;
    }
    if (monster.weapon === 'sniper') {
      playSfx('sniper');
      state.bullets.push({ x: engine.x, y: engine.y, vx: Math.cos(base) * 720, vy: Math.sin(base) * 720, radius: 8, type: 'sniper' });
      monster.cooldown = 2.05;
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
    monster.cooldown = 1.65;
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
      state.bullets.push({ x: bullet.x, y: bullet.y, vx: Math.cos(angle) * SPLIT_SHARD_SPEED, vy: Math.sin(angle) * SPLIT_SHARD_SPEED, radius: 7, type: 'splitShard', hitPlayer: false });
    }
  }

  function trainSpeedMultiplier() {
    if (state.time >= 120) return 3;
    if (state.time >= 90) return 2.5;
    if (state.time >= 60) return 2;
    if (state.time >= 30) return 1.5;
    return 1;
  }

  function explode(x, y, radius = 104) {
    playSfx('blast');
    state.screenShake = state.reducedMotion ? 0 : 12;
    emit(x, y, '#ffe66d', 35, 260);
    emit(x, y, '#f06e59', 22, 190);
    for (const train of state.trains) {
      for (const car of train.cars) {
        if (car.destroyed) continue;
        if (car.type === 'engine') continue;
        const pos = { x: train.x + car.offset, y: train.y };
        if (Math.hypot(pos.x - x, pos.y - y) < radius + car.radius) destroyCar(train, car, pos);
      }
    }
  }

  function destroyCar(train, car, pos) {
    playSfx('blast');
    car.destroyed = true;
    emit(pos.x, pos.y, car.type === 'gem' ? '#48e0cf' : '#a3a3a2', 28, 210);
    if (car.type === 'gem') {
      const count = 5 + Math.floor(Math.random() * 4);
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
    updatePlayer(dt);
    updateCannon(dt);
    updateTrains(dt);
    updateShells(dt);
    updateBullets(dt);
    updateGems(dt);
    updateGemMine(dt);
    updateParticles(dt);
    state.screenShake = Math.max(0, state.screenShake - dt * 35);
    updateCamera();
    syncUI();
  }

  function updatePlayer(dt) {
    const p = state.player;
    p.hitCooldown = Math.max(0, p.hitCooldown - dt);
    p.trainHitCooldown = Math.max(0, p.trainHitCooldown - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.speedBuff = Math.max(0, p.speedBuff - dt);
    if (p.cannon) {
      p.x = p.cannon.x;
      p.y = p.cannon.y + 18;
      return;
    }
    if (p.stun > 0) return;
    let dx = 0;
    let dy = 0;
    if (keys.has('KeyW')) dy--;
    if (keys.has('KeyS')) dy++;
    if (keys.has('KeyA')) dx--;
    if (keys.has('KeyD')) dx++;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const speed = p.speed * (p.speedBuff > 0 ? 2 : 1);
      p.x += dx / len * speed * dt;
      p.y += dy / len * speed * dt;
      p.facing = Math.atan2(dy, dx);
    }
    p.x = clamp(p.x, 26, world.w - 26);
    p.y = clamp(p.y, 26, world.h - 26);
  }

  function updateCannon(dt) {
    for (const cannon of state.cannons) {
      cannon.cooldown = Math.max(0, cannon.cooldown - dt);
      cannon.flash = Math.max(0, cannon.flash - dt);
      if (state.player.cannon === cannon) {
        const target = screenToWorld(mouse.x, mouse.y);
        cannon.angle = Math.atan2(target.y - cannon.y, target.x - cannon.x);
      }
    }
  }

  function updateEarthquake(dt) {
    if (state.time >= state.nextEarthquakeAt) {
      state.earthquakeEnd = state.time + 10;
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

    if (state.player.hitCooldown <= 0 && circleHit(impact, state.player, 2)) {
      damagePlayer(20, 5, '落石砸中了你');
    }

    for (const train of state.trains) {
      for (const car of train.cars) {
        if (car.destroyed || car.type === 'engine') continue;
        const position = { x: train.x + car.offset, y: train.y, radius: car.radius };
        if (circleHit(impact, position, 1)) destroyCar(train, car, position);
      }
    }

    for (const cannon of state.cannons) {
      if (!cannon.destroyed && circleHit(impact, cannon, 1)) destroyCannon(cannon);
    }
    state.cannons = state.cannons.filter(cannon => !cannon.destroyed);

    for (const wall of state.walls) {
      if (wall.hits >= 3 || !circleHit(impact, wall, 1)) continue;
      wall.hits = 2;
      damageWall(wall);
    }
    state.umbrellas = state.umbrellas.filter(umbrella => !umbrella.destroyed);
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
      state.trainTimer = rand(15, 21);
    }
    for (const train of state.trains) {
      if (!train.destroyed) {
        train.speed = TRAIN_BASE_SPEED * trainSpeedMultiplier();
        train.x += train.speed * dt;
        resolveTrainCollisions(train);
        for (const car of train.cars) {
          if (car.type !== 'engine' || car.destroyed) continue;
          const monster = car.monster;
          const engineX = train.x + car.offset;
          monster.angle = Math.atan2(state.player.y - (train.y - 17), state.player.x - engineX);
          monster.cooldown -= dt;
          monster.flash = Math.max(0, monster.flash - dt);
          if (monster.cooldown <= 0 && engineX > 0 && engineX < world.w + 80) fireMonster(train, car);
        }
      }
    }
    state.trains = state.trains.filter(train => train.x < world.w + 340 && (!train.destroyed || train.x < world.w + 150));
  }

  function resolveTrainCollisions(train) {
    const p = state.player;
    for (const car of train.cars) {
      if (car.destroyed) continue;
      const carPosition = { x: train.x + car.offset, y: train.y, radius: car.radius };
      const dx = p.x - carPosition.x;
      const dy = p.y - carPosition.y;
      const minDistance = p.radius + car.radius;
      const distanceToCar = Math.hypot(dx, dy);
      if (distanceToCar >= minDistance) continue;
      if (p.cannon) p.cannon = null;

      const safeDistance = Math.max(distanceToCar, .001);
      let pushX = dx / safeDistance;
      let pushY = dy / safeDistance;
      const engineFrontHit = car.type === 'engine'
        && dx > car.radius * .35
        && Math.abs(dy) < car.radius * .78;
      if (engineFrontHit) {
        pushX = -1;
        pushY = p.y < rail.center ? -1.25 : 1.25;
        const pushLength = Math.hypot(pushX, pushY);
        pushX /= pushLength;
        pushY /= pushLength;
        if (p.trainHitCooldown <= 0) {
          p.trainHitCooldown = 1.2;
          p.stun = 1;
          p.health = Math.max(0, p.health - 70);
          playSfx('hurt');
          emit(p.x, p.y, '#ff9075', 22, 185);
          state.screenShake = state.reducedMotion ? 0 : 13;
          showToast('被火车头撞出轨道！眩晕 1 秒（-70）');
          if (p.health <= 0) endGame();
        }
        p.x = carPosition.x + pushX * (minDistance + 82);
        p.y = carPosition.y + pushY * (minDistance + 82);
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
          const pos = { x: train.x + car.offset, y: train.y, radius: car.radius };
          if (circleHit(shell, pos, 4)) {
            explode(shell.x, shell.y);
            shell.life = 0;
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (shell.life <= 0 && !hit) explode(shell.x, shell.y, 66);
    }
    state.shells = state.shells.filter(s => s.life > 0 && s.x > -80 && s.y > -80 && s.x < world.w + 80 && s.y < world.h + 80);
  }

  function updateBullets(dt) {
    const p = state.player;
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
      const wall = state.walls.find(candidate => candidate.hits < 3 && circleHit(bullet, candidate));
      if (wall) {
        if (bullet.type === 'splitter') {
          damageWall(wall);
          splitBullet(bullet);
          continue;
        }
        bullet.blocked = true;
        damageWall(wall);
        continue;
      }
      if (bullet.type === 'splitter' && circleHit(bullet, p)) {
        splitBullet(bullet);
        continue;
      }
      if (!bullet.hitPlayer && circleHit(bullet, p)) {
        bullet.hitPlayer = true;
        bullet.spent = true;
      }
      if (bullet.spent && !bullet.damaged && p.hitCooldown <= 0 && circleHit(bullet, p)) {
        bullet.damaged = true;
        if (bullet.type === 'splitShard') {
          damagePlayer(25, 8, '分裂弹命中');
          continue;
        }
        p.hitCooldown = .2;
        const damage = bullet.type === 'sniper' ? (p.helmet ? 10 : 45) : (p.helmet ? 10 : 30);
        p.health = Math.max(0, p.health - damage);
        playSfx('hurt');
        emit(p.x, p.y, '#ff9075', 10, 120);
        state.screenShake = state.reducedMotion ? 0 : 6;
        showToast(p.helmet ? `头盔挡下了伤害（-${damage}）` : `受到散弹伤害（-${damage}）`);
        if (p.health <= 0) endGame();
      }
    }
    state.walls = state.walls.filter(wall => wall.hits < 3);
    state.bullets = state.bullets.filter(b => !b.blocked && !b.spent && b.x >= 0 && b.y >= 0 && b.x <= world.w && b.y <= world.h);
  }

  function damagePlayer(normalDamage, helmetDamage, source) {
    const p = state.player;
    const damage = p.helmet ? helmetDamage : normalDamage;
    p.hitCooldown = .2;
    p.health = Math.max(0, p.health - damage);
    playSfx('hurt');
    emit(p.x, p.y, '#ff9075', 10, 120);
    state.screenShake = state.reducedMotion ? 0 : 6;
    showToast(p.helmet ? `头盔挡下了 ${source}（-${damage}）` : `${source}（-${damage}）`);
    if (p.health <= 0) endGame();
  }

  function destroyCannon(cannon) {
    cannon.destroyed = true;
    if (state.player.cannon === cannon) state.player.cannon = null;
    emit(cannon.x, cannon.y, '#8ca7aa', 22, 180);
    showToast('大炮被落石砸毁');
  }

  function damageWall(wall) {
    wall.hits++;
    emit(wall.x, wall.y, wall.hits >= 3 ? '#8e9c9d' : '#d4e0d7', 10, 115);
    if (wall.hits >= 3) {
      state.debris.push({ x: wall.x, y: wall.y, rotation: Math.random() * TAU });
      showToast('防护墙体破碎了');
    } else {
      showToast(`防护墙体受损（${wall.hits}/3）`);
    }
  }

  function updateGems(dt) {
    const p = state.player;
    for (const gem of state.gemsOnGround) {
      gem.age += dt;
      gem.x += gem.vx * dt;
      gem.y += gem.vy * dt;
      gem.vx *= .9;
      gem.vy *= .9;
      gem.spin += dt * 6;
      if (!gem.picked && distance(gem, p) < 33) {
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
    mine.productionTimer += 3;
    state.gemsOnGround.push({ x: mine.x + 62, y: mine.y + 26, vx: rand(8, 24), vy: rand(-12, 12), radius: 9, spin: Math.random() * TAU, age: 0, picked: false });
    emit(mine.x + 62, mine.y + 26, '#69f5df', 6, 70);
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
    const healthPct = clamp(state.player.health / state.player.maxHealth, 0, 1);
    ui.healthFill.style.width = `${healthPct * 100}%`;
    ui.healthText.textContent = `${state.player.health} / ${state.player.maxHealth}`;
    ui.healthHud.classList.toggle('critical', healthPct <= .3);
    const hasSpeedBuff = state.player.speedBuff > 0;
    ui.buffHud.hidden = !hasSpeedBuff;
    if (hasSpeedBuff) ui.buffText.textContent = `糖分冲刺 · x2 · ${Math.ceil(state.player.speedBuff)} 秒`;
    renderInventory();
    positionShop();
    const cannon = state.player.cannon;
    const nearest = findNearestCannon();
    if (cannon) {
      ui.hint.textContent = '鼠标瞄准 · 左键发射 · E 离开炮台';
      ui.hint.classList.add('visible');
    } else {
      const hasQuickItem = state.inventory.some(item => item === 'fish' || item === 'wall' || item === 'cake' || item === 'umbrella');
      const nearMine = isNearGemMine();
      const mineHint = nearMine && !state.gemMine.repaired ? (state.gems >= 20 ? '点击宝石矿井修复（20 宝石）' : '需要 20 个宝石才能修复矿井') : '';
      ui.hint.innerHTML = nearest ? '按 <kbd>E</kbd> 操控炮台' : mineHint || (state.cannonInventory ? '按 <kbd>Q</kbd> 放置大炮' : hasQuickItem ? '按物品栏数字键使用物品' : '');
      ui.hint.classList.toggle('visible', Boolean(nearest || mineHint || state.cannonInventory || hasQuickItem));
    }
    ui.wave.textContent = state.trains.length ? `第 ${state.trains[0].round} 轮火车正在穿过矿井` : `第 ${state.trainRound + 1} 轮列车 ${Math.ceil(Math.max(0, state.trainTimer))} 秒`;
    const nearShop = isNearShop();
    if (state.time < state.earthquakeEnd) ui.wave.textContent = '地震中 · 落石来袭';
    ui.buy.disabled = state.gems < 12 || !nearShop || state.inventory.every(item => item);
    ui.buy.title = nearShop ? '购买一门大炮' : '靠近矿井补给站后购买';
    ui.buyHelmet.disabled = state.gems < 18 || !nearShop || state.player.helmet || state.inventory.every(item => item);
    ui.buyHelmet.title = state.player.helmet ? '探照灯头盔已佩戴' : nearShop ? '购买并佩戴探照灯头盔' : '靠近矿井补给站后购买';
    ui.buyFish.disabled = state.gems < 6 || !nearShop || state.inventory.every(item => item);
    ui.buyFish.title = nearShop ? '购买鱼罐头' : '靠近矿井补给站后购买';
    ui.buyWall.disabled = state.gems < 10 || !nearShop || state.inventory.every(item => item);
    ui.buyCake.disabled = state.gems < 9 || !nearShop || state.inventory.every(item => item);
    ui.buyUmbrella.disabled = state.gems < 14 || !nearShop || state.inventory.every(item => item);
    ui.buyUmbrella.title = nearShop ? '购买保护伞' : '靠近矿井补给站后购买';
    ui.buyCake.title = nearShop ? '购买蛋糕' : '靠近矿井补给站后购买';
    ui.buyWall.title = nearShop ? '购买防护墙体' : '靠近矿井补给站后购买';
  }

  function renderInventory() {
    ui.inventorySlots.forEach((slot, index) => {
      const itemType = state.inventory[index];
      const filled = Boolean(itemType);
      slot.classList.toggle('filled', filled);
      const oldItem = slot.querySelector('.slot-cannon');
      if (oldItem) oldItem.remove();
      const oldHelmet = slot.querySelector('.slot-helmet');
      if (oldHelmet) oldHelmet.remove();
      const oldFish = slot.querySelector('.slot-fish');
      if (oldFish) oldFish.remove();
      const oldWall = slot.querySelector('.slot-wall');
      if (oldWall) oldWall.remove();
      const oldCake = slot.querySelector('.slot-cake');
      if (oldCake) oldCake.remove();
      const oldUmbrella = slot.querySelector('.slot-umbrella');
      if (oldUmbrella) oldUmbrella.remove();
      if (filled) {
        const item = document.createElement('span');
        item.className = itemType === 'helmet' ? 'slot-helmet' : itemType === 'fish' ? 'slot-fish' : itemType === 'wall' ? 'slot-wall' : itemType === 'cake' ? 'slot-cake' : itemType === 'umbrella' ? 'slot-umbrella' : 'slot-cannon';
        item.setAttribute('aria-label', itemType === 'helmet' ? '探照灯头盔' : itemType === 'fish' ? '鱼罐头' : itemType === 'wall' ? '防护墙体' : '大炮');
        if (itemType === 'cake') item.setAttribute('aria-label', '蛋糕');
        if (itemType === 'umbrella') item.setAttribute('aria-label', '保护伞');
        slot.appendChild(item);
      }
      slot.title = filled ? `按 ${index + 1} 使用${itemType === 'fish' ? '鱼罐头' : itemType === 'wall' ? '防护墙体' : itemType === 'cannon' ? '大炮' : itemType === 'cake' ? '蛋糕' : itemType === 'umbrella' ? '保护伞' : '探照灯头盔'}` : `物品栏 ${index + 1}`;
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

  function findNearestCannon() {
    if (state.player.cannon) return null;
    return state.cannons.find(c => distance(c, state.player) < 57) || null;
  }

  function isNearShop() {
    return distance(state.player, { x: shopZone.x + shopZone.w / 2, y: shopZone.y + shopZone.h / 2 }) < 250;
  }

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
    for (const rock of state.fallingRocks) drawFallingRock(rock);
    drawPlayer(state.player);
    for (const particle of state.particles) drawParticle(particle);
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
    ctx.fillStyle = mine.repaired ? '#405d62' : '#535661';
    ctx.beginPath();
    ctx.moveTo(-100, 48); ctx.lineTo(-88, -17); ctx.lineTo(-65, -62); ctx.lineTo(-25, -75);
    ctx.lineTo(18, -70); ctx.lineTo(67, -51); ctx.lineTo(96, -7); ctx.lineTo(102, 48);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1b2b34'; ctx.lineWidth = 5; ctx.stroke();

    ctx.fillStyle = mine.repaired ? '#223b43' : '#252d37';
    ctx.beginPath(); ctx.ellipse(1, 24, 62, 48, 0, Math.PI, 0); ctx.lineTo(63, 48); ctx.lineTo(-61, 48); ctx.closePath(); ctx.fill();

    if (mine.repaired) {
      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#57e6d3';
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

      ctx.fillStyle = '#f8d56d'; ctx.beginPath(); ctx.arc(-67, -29, 9, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2b363b'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = 'rgba(249, 221, 115, .17)'; ctx.beginPath(); ctx.moveTo(-67, -20); ctx.lineTo(-105, 26); ctx.lineTo(-28, 26); ctx.closePath(); ctx.fill();
      for (const [x, y, size] of [[-17, 6, 10], [12, 22, 12], [30, 1, 8]]) drawGem(x, y, size / 13, '#7ff5e1', .92);
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

    ctx.fillStyle = mine.repaired ? '#efffd9' : '#e5c995';
    ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(mine.repaired ? '宝石矿井' : '坍塌矿井', 0, -91);
    ctx.font = '900 10px sans-serif';
    ctx.fillStyle = mine.repaired ? '#70eddb' : '#e49b72';
    ctx.fillText(mine.repaired ? '每 3 秒产出宝石' : 'R  修复 · 20 宝石', 0, -76);
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
    const active = state.player.cannon === c;
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
      const x = train.x + car.offset;
      const y = train.y;
      if (car.type === 'engine') drawEngine(x, y, car.monster);
      else drawCar(x, y, car.type);
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
    const palette = p.skin === 'snow'
      ? { body: '#7faeb1', fur: '#f5f0df', ear: '#e7dfc8', innerEar: '#c2b79d', tail: '#66999f', nose: '#e7a8ae' }
      : p.skin === 'mint'
        ? { body: '#5f9e9c', fur: '#a4e4d3', ear: '#8fd1c3', innerEar: '#5a9d94', tail: '#477f83', nose: '#d9849a' }
        : { body: '#d8747d', fur: '#f5c7a2', ear: '#eebc9d', innerEar: '#ad6e65', tail: '#a55c61', nose: '#f29b9b' };
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
    ctx.fillStyle = 'rgba(8, 14, 18, .32)'; ctx.beginPath(); ctx.ellipse(0, 15, 16, 6, 0, 0, TAU); ctx.fill();
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
    ctx.strokeStyle = palette.tail; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 7); ctx.quadraticCurveTo(24, 2, 20, -10); ctx.stroke();
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
    started = true;
    paused = false;
    gameOver = false;
    ui.start.hidden = true;
    ui.pause.hidden = true;
    ui.gameOver.hidden = true;
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
    ui.settingsPage.hidden = true;
    updateSkinSelection();
    updateSettingsLabel();
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

  function gameLoop(time) {
    const dt = Math.min(.033, (time - last) / 1000 || 0);
    last = time;
    if (started && !paused && !gameOver) update(dt);
    draw();
    requestAnimationFrame(gameLoop);
  }

  function toggleCannon() {
    if (state.player.stun > 0) return;
    if (state.player.cannon) { state.player.cannon = null; return; }
    const nearest = findNearestCannon();
    if (nearest) { state.player.cannon = nearest; showToast('炮台已接管'); }
  }

  function buyCannon() {
    const slot = state.inventory.findIndex(item => !item);
    if (slot < 0) { showToast('物品栏已满'); return; }
    if (!isNearShop()) { showToast('请靠近矿井补给站'); return; }
    if (state.gems < 12) { showToast('宝石不够，去炸宝石车厢！'); return; }
    state.gems -= 12;
    playSfx('buy');
    state.inventory[slot] = 'cannon';
    state.cannonInventory++;
    showToast('补给完成，按 Q 放置大炮');
    syncUI();
  }

  function buyHelmet() {
    const slot = state.inventory.findIndex(item => !item);
    if (slot < 0) { showToast('物品栏已满'); return; }
    if (!isNearShop()) { showToast('请靠近矿井补给站'); return; }
    if (state.player.helmet) { showToast('探照灯头盔已经佩戴'); return; }
    if (state.gems < 18) { showToast('宝石不够，先去收集更多宝石！'); return; }
    state.gems -= 18;
    playSfx('buy');
    state.inventory[slot] = 'helmet';
    state.player.helmet = true;
    showToast('探照灯头盔已佩戴，受击伤害降至 10');
    syncUI();
  }

  function buyFish() {
    buyInventoryItem('fish', 6, '鱼罐头已放入物品栏');
  }

  function buyWall() {
    buyInventoryItem('wall', 10, '防护墙体已放入物品栏');
  }

  function buyCake() {
    buyInventoryItem('cake', 9, '蛋糕已放入物品栏');
  }

  function buyUmbrella() {
    buyInventoryItem('umbrella', 14, '保护伞已放入物品栏');
  }

  function buyInventoryItem(type, cost, message) {
    const slot = state.inventory.findIndex(item => !item);
    if (slot < 0) { showToast('物品栏已满'); return; }
    if (!isNearShop()) { showToast('请靠近矿井补给站'); return; }
    if (state.gems < cost) { showToast('宝石不够，去炸宝石车厢！'); return; }
    state.gems -= cost;
    playSfx('buy');
    state.inventory[slot] = type;
    showToast(message);
    syncUI();
  }

  function useInventorySlot(index) {
    const item = state.inventory[index];
    if (!item) return;
    const p = state.player;
    if (p.stun > 0) return;
    if (item === 'cannon') {
      deployInventoryCannon(index);
      syncUI();
      return;
    } else if (item === 'fish') {
      if (p.health >= p.maxHealth) { showToast('生命值已满'); return; }
      p.health = Math.min(p.maxHealth, p.health + 20);
      playSfx('heal');
      state.inventory[index] = null;
      emit(p.x, p.y, '#ffc976', 12, 95);
      showToast('吃下鱼罐头，恢复 20 生命');
    } else if (item === 'wall') {
      if (p.cannon) { showToast('离开炮台后再部署墙体'); return; }
      placeWall(p.x + Math.cos(p.facing) * 52, p.y + Math.sin(p.facing) * 52);
      state.inventory[index] = null;
      showToast('防护墙体已部署');
    } else if (item === 'umbrella') {
      if (p.cannon) { showToast('离开炮台后再部署保护伞'); return; }
      placeUmbrella(p.x + Math.cos(p.facing) * 48, p.y + Math.sin(p.facing) * 48);
      state.inventory[index] = null;
      showToast('保护伞已撑起，可拦截 3 次落石');
    } else if (item === 'cake') {
      p.speedBuff += 10;
      playSfx('heal');
      state.inventory[index] = null;
      emit(p.x, p.y, '#ffcf75', 14, 110);
      showToast('吃下蛋糕，移速翻倍 10 秒');
    } else if (item === 'helmet') {
      showToast('探照灯头盔已经佩戴');
      return;
    }
    syncUI();
  }

  function deployInventoryCannon(index) {
    const p = state.player;
    if (p.cannon) p.cannon = null;
    placeCannon(p.x + Math.cos(p.facing) * 40, p.y + Math.sin(p.facing) * 40);
    state.cannonInventory = Math.max(0, state.cannonInventory - 1);
    state.inventory[index] = null;
    showToast('大炮已部署');
  }

  function placeFirstCannon() {
    const slot = state.inventory.findIndex(item => item === 'cannon');
    if (slot >= 0) useInventorySlot(slot);
  }

  window.addEventListener('keydown', event => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ', 'KeyP', 'Escape', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (!started || gameOver) return;
    if (event.code === 'Escape' && !event.repeat) {
      paused = !paused;
      ui.pause.hidden = !paused;
      if (!paused) last = performance.now();
    }
    if (paused || event.repeat) return;
    if (event.code === 'KeyE') toggleCannon();
    if (event.code === 'KeyQ' && !state.player.stun && !state.player.cannon && state.cannonInventory) {
      placeFirstCannon();
    }
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
    if (event.code.startsWith('Digit')) useInventorySlot(Number(event.code.slice(-1)) - 1);
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  canvas.addEventListener('mousemove', event => { const box = canvas.getBoundingClientRect(); mouse.x = event.clientX - box.left; mouse.y = event.clientY - box.top; });
  canvas.addEventListener('mousedown', event => {
    if (event.button !== 0) return;
    mouse.down = true;
    if (started && !paused && !gameOver) {
      const target = screenToWorld(mouse.x, mouse.y);
      if (!state.player.cannon && !state.gemMine.repaired && distance(target, state.gemMine) < 120) {
        repairGemMine();
        return;
      }
      if (state.player.cannon) fireShell(state.player.cannon);
    }
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  ui.inventorySlots.forEach((slot, index) => slot.addEventListener('click', event => {
    event.preventDefault();
    if (started && !paused && !gameOver) useInventorySlot(index);
  }));
  ui.buy.addEventListener('click', buyCannon);
  ui.buyHelmet.addEventListener('click', buyHelmet);
  ui.buyFish.addEventListener('click', buyFish);
  ui.buyWall.addEventListener('click', buyWall);
  ui.buyCake.addEventListener('click', buyCake);
  ui.buyUmbrella.addEventListener('click', buyUmbrella);
  ui.resume.addEventListener('click', () => { paused = false; ui.pause.hidden = true; last = performance.now(); });
  ui.pauseMenu.addEventListener('click', returnToMenu);
  ui.menuStart.addEventListener('click', startGame);
  ui.menuSkins.addEventListener('click', () => showMenuPage('skins'));
  ui.menuTutorial.addEventListener('click', () => showMenuPage('tutorial'));
  ui.menuSettings.addEventListener('click', () => showMenuPage('settings'));
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
  ui.restart.addEventListener('click', startGame);
  ui.gameOverMenu.addEventListener('click', returnToMenu);
  window.addEventListener('resize', resize);

  resize();
  resetGame();
  ui.shop.hidden = true;
  showMainMenu();
  requestAnimationFrame(gameLoop);
})();
