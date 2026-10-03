import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CharacterId,
  WeaponId,
  LevelConfig,
  FloatingText,
  Projectile,
  EnemySpecies,
} from '../../types/game';
import {
  CHARACTERS,
  WEAPONS,
  LEVELS,
} from '../../game/constants';
import {
  createCharacterMesh,
  createWeaponMesh,
  createEnemyMesh,
  createDemonStatue,
  createAncientPuzzleTree,
  createChestMesh,
  createBlueTorch,
} from '../../game/proceduralModels';
import { sound } from '../../services/audio';

interface GameCanvasProps {
  levelId: number;
  characterId: CharacterId;
  weaponId: WeaponId;
  hearts: number;
  maxHearts: number;
  coins: number;
  score: number;
  onHeartLoss: (remaining: number) => void;
  onHeartGain: () => void;
  onCoinCollect: (amount: number) => void;
  onScoreAdd: (amount: number) => void;
  onEnemyKilled: (species: string) => void;
  onBossDefeated: () => void;
  onLevelComplete: (nextLevel: number) => void;
  onGameOver: () => void;
  onAbilityTriggered: (name: string, cooldown: number) => void;
  isPaused: boolean;
  onInteractPrompt: (prompt: string | null) => void;
  onMinimapUpdate: (data: { playerX: number; playerZ: number; playerAngle: number; entities: { x: number; z: number; type: 'enemy' | 'boss' | 'chest' | 'portal' }[] }) => void;
  onBossHealthUpdate: (current: number, max: number, name: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelId,
  characterId,
  weaponId,
  hearts,
  maxHearts,
  coins,
  score,
  onHeartLoss,
  onHeartGain,
  onCoinCollect,
  onScoreAdd,
  onEnemyKilled,
  onBossDefeated,
  onLevelComplete,
  onGameOver,
  onAbilityTriggered,
  isPaused,
  onInteractPrompt,
  onMinimapUpdate,
  onBossHealthUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Mutable refs to prevent stale closure issues in the 60fps loop
  const stateRef = useRef({
    hearts,
    maxHearts,
    isPaused,
    characterId,
    weaponId,
    levelId,
  });

  useEffect(() => {
    stateRef.current = {
      hearts,
      maxHearts,
      isPaused,
      characterId,
      weaponId,
      levelId,
    };
  }, [hearts, maxHearts, isPaused, characterId, weaponId, levelId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const level = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    const characterConfig = CHARACTERS.find((c) => c.id === characterId) || CHARACTERS[0];
    const weaponConfig = WEAPONS.find((w) => w.id === weaponId) || WEAPONS[0];

    // Start atmospheric horror audio
    sound.startAmbient(level.theme);

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(level.ambientColor);
    scene.fog = new THREE.FogExp2(level.fogColor, level.fogDensity);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(20, 40, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const shadowD = 35;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    scene.add(sunLight);

    // Secondary colored rim light
    const rimLight = new THREE.DirectionalLight(
      level.theme === 'forest' ? 0x06b6d4 : 0xec4899,
      0.9
    );
    rimLight.position.set(-20, 15, -25);
    scene.add(rimLight);

    // Ash / Ember Particle System
    const particleCount = 400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = Math.random() * 25;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      particleSpeeds[i] = 0.04 + Math.random() * 0.08;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: level.theme === 'forest' ? 0x38bdf8 : 0xff6600,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Ground Construction
    const groundSize = 90;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 40, 40);
    groundGeo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c0910,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // Magma Rivers / Glowing Channels
    const lavaChannels: THREE.Mesh[] = [];
    const lavaMat = new THREE.MeshStandardMaterial({
      color: level.theme === 'forest' ? 0x0d9488 : 0xff3b00,
      emissive: level.theme === 'forest' ? 0x06b6d4 : 0xff5500,
      emissiveIntensity: 2.2,
      roughness: 0.3,
    });

    const lavaRiver1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 80), lavaMat);
    lavaRiver1.rotateX(-Math.PI / 2);
    lavaRiver1.position.set(-16, 0.02, 0);
    scene.add(lavaRiver1);
    lavaChannels.push(lavaRiver1);

    const lavaRiver2 = new THREE.Mesh(new THREE.PlaneGeometry(80, 5), lavaMat);
    lavaRiver2.rotateX(-Math.PI / 2);
    lavaRiver2.position.set(0, 0.02, 18);
    scene.add(lavaRiver2);
    lavaChannels.push(lavaRiver2);

    // Environmental props: Statues, pillars, torches, ancient tree
    const chests: { mesh: THREE.Group; opened: boolean; x: number; z: number }[] = [];

    if (level.theme === 'volcano') {
      // Demon statues
      const statue1 = createDemonStatue();
      statue1.position.set(-10, 0, -22);
      const statue2 = createDemonStatue();
      statue2.position.set(10, 0, -22);
      scene.add(statue1, statue2);

      // Skeletons / Bone piles
      for (let i = 0; i < 4; i++) {
        const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.5), new THREE.MeshStandardMaterial({ color: 0xd6cbb6 }));
        bone.position.set(-8 + i * 5, 0.2, 5 + i * 3);
        bone.rotation.set(0.4, i * 0.8, 1.2);
        scene.add(bone);
      }
    } else if (level.theme === 'arena') {
      // Circular arena pillars
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 7, 10), new THREE.MeshStandardMaterial({ color: 0x1f1d24, roughness: 0.9 }));
        pillar.position.set(Math.cos(angle) * 24, 3.5, Math.sin(angle) * 24);
        scene.add(pillar);

        const torch = createBlueTorch();
        torch.position.set(Math.cos(angle) * 20, 0, Math.sin(angle) * 20);
        scene.add(torch);
      }
    } else if (level.theme === 'forest') {
      // Giant Ancient Puzzle Tree with Swirling Portal in trunk
      const tree = createAncientPuzzleTree();
      tree.position.set(0, 0, -24);
      scene.add(tree);

      // Torches around the clearing
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const torch = createBlueTorch();
        torch.position.set(Math.cos(angle) * 16, 0, Math.sin(angle) * 16 - 8);
        scene.add(torch);
      }
    }

    // Spawn 2 Hidden Treasure Chests
    const chest1 = createChestMesh();
    chest1.position.set(-18, 0, -12);
    scene.add(chest1);
    chests.push({ mesh: chest1, opened: false, x: -18, z: -12 });

    const chest2 = createChestMesh();
    chest2.position.set(18, 0, 14);
    scene.add(chest2);
    chests.push({ mesh: chest2, opened: false, x: 18, z: 14 });

    // Portal to next level
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, -28);
    const portalTorus = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.25, 16, 32),
      new THREE.MeshStandardMaterial({
        color: 0xec4899,
        emissive: 0xec4899,
        emissiveIntensity: 3.5,
      })
    );
    portalTorus.position.y = 2.5;
    const portalPlane = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 32),
      new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    portalPlane.position.y = 2.5;
    portalGroup.add(portalTorus, portalPlane);
    scene.add(portalGroup);

    // Player Setup
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 8);
    scene.add(playerGroup);

    const playerMesh = createCharacterMesh(characterId);
    playerGroup.add(playerMesh);

    // Attach Weapon to player's right arm
    const weaponMesh = createWeaponMesh(weaponId);
    weaponMesh.position.set(0.48, 1.0, 0.35);
    weaponMesh.rotation.x = -Math.PI / 6;
    playerGroup.add(weaponMesh);

    // Player Slash Trail VFX Mesh
    const slashTrailGeo = new THREE.RingGeometry(0.8, 2.2, 16, 1, 0, Math.PI);
    const slashTrailMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(weaponConfig.accentColor),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const slashTrail = new THREE.Mesh(slashTrailGeo, slashTrailMat);
    slashTrail.rotation.x = Math.PI / 2;
    slashTrail.position.set(0, 1.2, 0.5);
    playerGroup.add(slashTrail);

    // Player Power-up Aura Mesh (for Tier 3 or Active Ability Burst)
    const auraGeo = new THREE.CylinderGeometry(1.4, 1.6, 2.6, 16, 1, true);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.y = 1.3;
    playerGroup.add(auraMesh);

    // Projectiles & Active Entities
    const projectiles: {
      mesh: THREE.Mesh;
      vx: number;
      vz: number;
      life: number;
      damage: number;
      fromPlayer: boolean;
    }[] = [];

    // Enemies
    interface EnemyInstance {
      id: string;
      species: EnemySpecies;
      mesh: THREE.Group;
      health: number;
      maxHealth: number;
      speed: number;
      damage: number;
      state: 'idle' | 'chase' | 'windup' | 'attack' | 'stagger';
      timer: number;
      attackCooldown: number;
      isBoss: boolean;
      yOffset: number;
    }
    const enemies: EnemyInstance[] = [];

    function spawnEnemy(species: EnemySpecies, x: number, z: number, isBoss: boolean = false) {
      const mesh = createEnemyMesh(species);
      const yOffset = species === 'bat' || species === 'wyvern' ? 3.0 : 0;
      mesh.position.set(x, yOffset, z);
      scene.add(mesh);

      const maxHp = isBoss
        ? species === 'demon_boss' ? 550 : 350
        : species === 'bat' ? 45 : species === 'wyvern' ? 120 : 80;

      const spd = isBoss ? 0.05 : species === 'bat' ? 0.12 : species === 'shadow_entity' ? 0.08 : 0.07;
      const dmg = isBoss ? 2 : 1;

      enemies.push({
        id: Math.random().toString(),
        species,
        mesh,
        health: maxHp,
        maxHealth: maxHp,
        speed: spd,
        damage: dmg,
        state: 'chase',
        timer: 0,
        attackCooldown: 1.5,
        isBoss,
        yOffset,
      });

      if (isBoss) {
        onBossHealthUpdate(maxHp, maxHp, species === 'demon_boss' ? 'Colossal Magma Demon' : species === 'wyvern' ? 'Obsidian Wyvern' : 'The Shadow Entity');
      }
    }

    // Initial Spawns for the level
    spawnEnemy('bat', -12, -8);
    spawnEnemy('bat', 12, -8);
    spawnEnemy(level.bossSpecies, 0, -18, true);

    // Player Combat & Movement State
    const player = {
      x: 0,
      z: 8,
      y: 0,
      vy: 0,
      rotation: 0,
      speed: 0.18 * characterConfig.speed,
      isGrounded: true,
      jumpsRemaining: 2,
      isDodging: false,
      dodgeTimer: 0,
      isAttacking: false,
      attackTimer: 0,
      attackCombo: 0,
      isPoweredUp: false,
      powerUpTimer: 0,
      invulnerableTimer: 0,
      abilityTimer: 0,
      cameraShake: 0,
    };

    // Keyboard & Mouse controls
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;

      // Ability Q
      if (e.code === 'KeyQ' && player.abilityTimer <= 0) {
        player.isPoweredUp = true;
        player.powerUpTimer = 6.0; // 6s duration
        player.abilityTimer = characterConfig.abilityCooldown;
        sound.playAbilityBurst();
        onAbilityTriggered(characterConfig.abilityName, characterConfig.abilityCooldown);

        // Knockback nearby enemies
        enemies.forEach((en) => {
          const dx = en.mesh.position.x - player.x;
          const dz = en.mesh.position.z - player.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 10) {
            en.mesh.position.x += (dx / dist) * 5;
            en.mesh.position.z += (dz / dist) * 5;
            en.health -= 35;
            en.state = 'stagger';
            en.timer = 1.0;
          }
        });
      }

      // Jump Space
      if (e.code === 'Space' && player.jumpsRemaining > 0) {
        player.vy = 0.32;
        player.isGrounded = false;
        player.jumpsRemaining -= 1;
        sound.playJump();
      }

      // Dodge Roll / Slide: Shift or KeyC
      if ((e.code === 'ShiftLeft' || e.code === 'KeyC') && !player.isDodging && player.dodgeTimer <= 0) {
        player.isDodging = true;
        player.dodgeTimer = 0.45;
        player.invulnerableTimer = 0.5;
        sound.playJump();
      }

      // Interact E
      if (e.code === 'KeyE') {
        // Check chests
        chests.forEach((ch) => {
          if (!ch.opened) {
            const dx = ch.x - player.x;
            const dz = ch.z - player.z;
            if (Math.hypot(dx, dz) < 3.2) {
              ch.opened = true;
              ch.mesh.rotation.y += 0.3;
              sound.playCoin();
              onCoinCollect(75);
              onScoreAdd(350);
              onHeartGain();
            }
          }
        });

        // Check Portal to next level
        const pDist = Math.hypot(portalGroup.position.x - player.x, portalGroup.position.z - player.z);
        if (pDist < 3.5) {
          onLevelComplete(levelId >= 3 ? 1 : levelId + 1);
        }
      }

      // Melee Key J
      if (e.code === 'KeyJ' && !player.isAttacking) {
        triggerMeleeAttack();
      }

      // Ranged Key K
      if (e.code === 'KeyK') {
        triggerRangedAttack();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        triggerMeleeAttack();
      } else if (e.button === 2) {
        triggerRangedAttack();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('contextmenu', onContextMenu);

    function triggerMeleeAttack() {
      if (player.isAttacking) return;
      player.isAttacking = true;
      player.attackTimer = 0.25;
      player.attackCombo = (player.attackCombo + 1) % 3;

      sound.playSlash(weaponId);

      // Animate slash trail
      slashTrailMat.opacity = 0.85;
      slashTrail.rotation.z = player.attackCombo * 1.2;

      // Hit check for enemies in front arc
      const hitRange = weaponConfig.range * (player.isPoweredUp ? 1.4 : 1.0);
      const baseDmg = weaponConfig.damage * characterConfig.damageMultiplier * (player.isPoweredUp ? 2.0 : 1.0);

      enemies.forEach((enemy) => {
        const dx = enemy.mesh.position.x - player.x;
        const dz = enemy.mesh.position.z - player.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= hitRange) {
          // Check forward direction
          const forward = new THREE.Vector3(Math.sin(player.rotation), 0, Math.cos(player.rotation));
          const toEnemy = new THREE.Vector3(dx, 0, dz).normalize();
          const dot = forward.dot(toEnemy);

          if (dot > 0.3) {
            enemy.health -= baseDmg;
            enemy.state = 'stagger';
            enemy.timer = 0.35;
            sound.playMonsterHit();
            onScoreAdd(Math.round(baseDmg * 2));

            // Ember hit flash
            enemy.mesh.position.x += toEnemy.x * 0.4;
            enemy.mesh.position.z += toEnemy.z * 0.4;

            if (enemy.isBoss) {
              onBossHealthUpdate(Math.max(0, enemy.health), enemy.maxHealth, enemy.species === 'demon_boss' ? 'Colossal Magma Demon' : enemy.species === 'wyvern' ? 'Obsidian Wyvern' : 'The Shadow Entity');
            }
          }
        }
      });
    }

    function triggerRangedAttack() {
      sound.playRangedShot();

      const projGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const projMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(weaponConfig.accentColor),
      });
      const pMesh = new THREE.Mesh(projGeo, projMat);
      pMesh.position.set(player.x, player.y + 1.2, player.z);
      scene.add(pMesh);

      const vx = Math.sin(player.rotation) * 0.55;
      const vz = Math.cos(player.rotation) * 0.55;

      projectiles.push({
        mesh: pMesh,
        vx,
        vz,
        life: 2.5,
        damage: (weaponConfig.type === 'ranged' ? weaponConfig.damage * 1.5 : 25) * characterConfig.damageMultiplier,
        fromPlayer: true,
      });
    }

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ---------------------------------------------------------
    // MAIN GAME LOOP (60 FPS)
    // ---------------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let minimapThrottle = 0;
    let spawnTimer = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (stateRef.current.isPaused) {
        return;
      }

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Ability Cooldown tick
      if (player.abilityTimer > 0) {
        player.abilityTimer -= delta;
      }
      if (player.powerUpTimer > 0) {
        player.powerUpTimer -= delta;
        auraMat.opacity = Math.sin(elapsed * 12) * 0.3 + 0.5;
        auraMesh.rotation.y += 0.08;
      } else {
        player.isPoweredUp = false;
        auraMat.opacity = 0;
      }

      if (player.invulnerableTimer > 0) {
        player.invulnerableTimer -= delta;
      }

      // Animate floating holographic ring on Tier 3 hero
      const holoRing = playerMesh.getObjectByName('holoRing');
      if (holoRing) {
        holoRing.rotation.z += 0.04;
      }

      // Animate flowing cape
      const cape = playerMesh.getObjectByName('heroCape');
      if (cape) {
        cape.rotation.x = 0.15 + Math.sin(elapsed * 6) * 0.1;
      }

      // Animate Lava channels glow
      lavaMat.emissiveIntensity = 2.0 + Math.sin(elapsed * 2.5) * 0.6;

      // Animate Ancient Tree Portal Disc
      const portalDisc = scene.getObjectByName('treePortalDisc');
      if (portalDisc) {
        portalDisc.rotation.z += 0.02;
      }

      // Animate Ash / Ember Particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] -= particleSpeeds[i];
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 25;
          positions[i * 3] = player.x + (Math.random() - 0.5) * 60;
          positions[i * 3 + 2] = player.z + (Math.random() - 0.5) * 60;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Animate weapon attack slash & cooldown
      if (player.isAttacking) {
        player.attackTimer -= delta;
        weaponMesh.rotation.x = -Math.PI / 4 + Math.sin(player.attackTimer * 20) * 1.2;
        slashTrailMat.opacity = Math.max(0, player.attackTimer * 4);
        if (player.attackTimer <= 0) {
          player.isAttacking = false;
          weaponMesh.rotation.x = -Math.PI / 6;
          slashTrailMat.opacity = 0;
        }
      }

      // Movement Input Processing
      let moveX = 0;
      let moveZ = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      const isMoving = moveX !== 0 || moveZ !== 0;

      if (isMoving) {
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= length;
        moveZ /= length;

        let curSpeed = player.speed;
        if (player.isDodging) {
          curSpeed *= 2.4;
        } else if (keys['ShiftLeft'] || keys['ShiftRight']) {
          curSpeed *= 1.45; // sprint with lean
        }

        player.x += moveX * curSpeed;
        player.z += moveZ * curSpeed;

        // Keep inside bounds
        const bound = 42;
        player.x = Math.max(-bound, Math.min(bound, player.x));
        player.z = Math.max(-bound, Math.min(bound, player.z));

        // Rotate facing direction
        player.rotation = Math.atan2(moveX, moveZ);
        playerGroup.rotation.y = player.rotation;

        // Running animation bobbing & lean
        const charBody = playerMesh.getObjectByName('charBody');
        if (charBody) {
          charBody.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.12;
          charBody.rotation.z = Math.sin(elapsed * 12) * 0.05;
          charBody.rotation.x = (keys['ShiftLeft'] ? 0.25 : 0.12);
        }
      } else {
        const charBody = playerMesh.getObjectByName('charBody');
        if (charBody) {
          charBody.position.y = Math.sin(elapsed * 3) * 0.04;
          charBody.rotation.z = 0;
          charBody.rotation.x = 0;
        }
      }

      // Dodge roll cooldown
      if (player.dodgeTimer > 0) {
        player.dodgeTimer -= delta;
        if (player.dodgeTimer <= 0) {
          player.isDodging = false;
        }
      }

      // Vertical Gravity & Jump
      if (!player.isGrounded) {
        player.vy -= 0.016;
        player.y += player.vy;
        if (player.y <= 0) {
          player.y = 0;
          player.vy = 0;
          player.isGrounded = true;
          player.jumpsRemaining = 2; // double jump reset
        }
      }
      playerGroup.position.set(player.x, player.y, player.z);

      // Projectiles update
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.life -= delta;
        p.mesh.position.x += p.vx;
        p.mesh.position.z += p.vz;

        // Collision with enemies
        let hit = false;
        if (p.fromPlayer) {
          for (let j = 0; j < enemies.length; j++) {
            const en = enemies[j];
            const dist = Math.hypot(en.mesh.position.x - p.mesh.position.x, en.mesh.position.z - p.mesh.position.z);
            if (dist < 1.8) {
              en.health -= p.damage;
              en.state = 'stagger';
              en.timer = 0.3;
              sound.playMonsterHit();
              onScoreAdd(Math.round(p.damage));
              hit = true;
              if (en.isBoss) {
                onBossHealthUpdate(Math.max(0, en.health), en.maxHealth, en.species === 'demon_boss' ? 'Colossal Magma Demon' : en.species === 'wyvern' ? 'Obsidian Wyvern' : 'The Shadow Entity');
              }
              break;
            }
          }
        }

        if (hit || p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          projectiles.splice(i, 1);
        }
      }

      // Spawn periodic mob waves
      spawnTimer += delta;
      if (spawnTimer > 10.0 && enemies.length < 6) {
        spawnTimer = 0;
        const randAngle = Math.random() * Math.PI * 2;
        const sx = player.x + Math.cos(randAngle) * 25;
        const sz = player.z + Math.sin(randAngle) * 25;
        spawnEnemy(level.theme === 'forest' ? 'shadow_entity' : 'bat', sx, sz, false);
      }

      // Enemies AI & Animations
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];

        // Death Check
        if (en.health <= 0) {
          sound.playMonsterHit();
          onScoreAdd(en.isBoss ? 2500 : 250);
          onCoinCollect(en.isBoss ? 150 : 25);
          onEnemyKilled(en.species);

          if (en.isBoss) {
            onBossDefeated();
          }

          scene.remove(en.mesh);
          enemies.splice(i, 1);
          continue;
        }

        // Animate wings/wisps
        const leftWing = en.mesh.getObjectByName('leftWing');
        const rightWing = en.mesh.getObjectByName('rightWing');
        if (leftWing && rightWing) {
          const flap = Math.sin(elapsed * 14) * 0.45;
          leftWing.rotation.z = flap;
          rightWing.rotation.z = -flap;
        }

        const wisps = en.mesh.getObjectByName('wisps');
        if (wisps) {
          wisps.rotation.y += 0.05;
        }

        // AI Behaviors
        const dx = player.x - en.mesh.position.x;
        const dz = player.z - en.mesh.position.z;
        const distToPlayer = Math.hypot(dx, dz);

        // Turn towards player
        en.mesh.rotation.y = Math.atan2(dx, dz);

        if (en.state === 'stagger') {
          en.timer -= delta;
          if (en.timer <= 0) en.state = 'chase';
        } else if (en.state === 'windup') {
          en.timer -= delta;
          // Flashing windup telegraph
          en.mesh.scale.setScalar(1.0 + Math.sin(en.timer * 20) * 0.1);

          if (en.timer <= 0) {
            en.state = 'attack';
            en.timer = 0.4;

            // Attack execution
            if (en.species === 'demon_boss') {
              sound.playBossSlam();
              player.cameraShake = 0.8; // screen shake!
              // Shockwave damage if player close and not in air
              if (distToPlayer < 7.5 && player.y < 0.8 && player.invulnerableTimer <= 0) {
                applyDamageToPlayer(en.damage);
              }
            } else if (en.species === 'wyvern') {
              // Spits fire projectile
              const fGeo = new THREE.SphereGeometry(0.35, 8, 8);
              const fMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
              const fMesh = new THREE.Mesh(fGeo, fMat);
              fMesh.position.copy(en.mesh.position);
              scene.add(fMesh);
              projectiles.push({
                mesh: fMesh,
                vx: (dx / distToPlayer) * 0.28,
                vz: (dz / distToPlayer) * 0.28,
                life: 3.0,
                damage: 1,
                fromPlayer: false,
              });
            } else {
              // Melee claw swipe
              if (distToPlayer < 2.5 && player.invulnerableTimer <= 0) {
                applyDamageToPlayer(en.damage);
              }
            }
          }
        } else if (en.state === 'attack') {
          en.timer -= delta;
          if (en.timer <= 0) {
            en.state = 'chase';
            en.mesh.scale.setScalar(1.0);
          }
        } else {
          // Chase Player
          if (distToPlayer > (en.isBoss ? 4.5 : 1.8)) {
            en.mesh.position.x += (dx / distToPlayer) * en.speed;
            en.mesh.position.z += (dz / distToPlayer) * en.speed;
          } else {
            // Initiate attack windup
            en.state = 'windup';
            en.timer = en.isBoss ? 1.0 : 0.6; // Clear anticipation telegraph
          }
        }
      }

      // Check proximity prompts (chests, portal)
      let currentPrompt: string | null = null;
      chests.forEach((ch) => {
        if (!ch.opened && Math.hypot(ch.x - player.x, ch.z - player.z) < 3.2) {
          currentPrompt = 'Press [E] to open Treasure Chest';
        }
      });
      if (Math.hypot(portalGroup.position.x - player.x, portalGroup.position.z - player.z) < 3.5) {
        currentPrompt = 'Press [E] to enter the Void Portal';
      }
      onInteractPrompt(currentPrompt);

      // Camera Follow with smooth damping & screen shake
      const targetCamX = player.x;
      const targetCamY = player.y + 7.5;
      const targetCamZ = player.z + 11.5;

      let shakeOffset = 0;
      if (player.cameraShake > 0) {
        player.cameraShake -= delta * 2.5;
        shakeOffset = (Math.random() - 0.5) * player.cameraShake * 1.2;
      }

      camera.position.x += (targetCamX + shakeOffset - camera.position.x) * 0.1;
      camera.position.y += (targetCamY + shakeOffset - camera.position.y) * 0.1;
      camera.position.z += (targetCamZ - camera.position.z) * 0.1;
      camera.lookAt(player.x, player.y + 1.5, player.z);

      // Minimap data throttle (10 fps)
      minimapThrottle += delta;
      if (minimapThrottle > 0.1) {
        minimapThrottle = 0;
        const minimapEntities: { x: number; z: number; type: 'enemy' | 'boss' | 'chest' | 'portal' }[] = [];
        enemies.forEach((e) => {
          minimapEntities.push({
            x: e.mesh.position.x,
            z: e.mesh.position.z,
            type: e.isBoss ? 'boss' : 'enemy',
          });
        });
        chests.forEach((c) => {
          if (!c.opened) {
            minimapEntities.push({ x: c.x, z: c.z, type: 'chest' });
          }
        });
        minimapEntities.push({ x: portalGroup.position.x, z: portalGroup.position.z, type: 'portal' });

        onMinimapUpdate({
          playerX: player.x,
          playerZ: player.z,
          playerAngle: player.rotation,
          entities: minimapEntities,
        });
      }

      renderer.render(scene, camera);
    };

    function applyDamageToPlayer(amount: number) {
      if (player.invulnerableTimer > 0) return;

      // Apply defense reduction
      const reduced = Math.max(1, Math.round(amount * (1 - characterConfig.defense / 100)));
      const nextHearts = Math.max(0, stateRef.current.hearts - reduced);

      player.invulnerableTimer = 1.2;
      player.cameraShake = 0.5;
      sound.playHeartShatter();
      onHeartLoss(nextHearts);

      if (nextHearts === 1) {
        sound.setHeartbeatActive(true, true);
      } else if (nextHearts === 0) {
        sound.setHeartbeatActive(false);
        sound.playGameOver();
        onGameOver();
      }
    }

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('contextmenu', onContextMenu);
      sound.stopAmbient();
      sound.setHeartbeatActive(false);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [levelId, characterId, weaponId]);

  return <div ref={mountRef} className="w-full h-full relative cursor-crosshair" />;
};
