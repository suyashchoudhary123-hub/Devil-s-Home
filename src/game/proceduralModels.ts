import * as THREE from 'three';
import { CharacterId, WeaponId, EnemySpecies } from '../types/game';

// Color Palette
const COLORS = {
  skin: 0xc68642, // Indian warm skin tone
  hair: 0x111116,
  jacket: 0x1a1a24,
  jacketTrim: 0xf97316, // magma orange
  amuletCyan: 0x06b6d4, // glowing cyan
  boots: 0x1e1e24,
  bracers: 0x334155,
  scar: 0x8b3a3a,
  obsidian: 0x121018,
  magmaOrange: 0xff5500,
  hotMagenta: 0xec4899,
  electricCyan: 0x00f0ff,
  bone: 0xd6cbb6,
  gold: 0xf59e0b,
};

// -------------------------------------------------------------
// CHARACTER MODELS
// -------------------------------------------------------------

export function createCharacterMesh(characterId: CharacterId): THREE.Group {
  const root = new THREE.Group();

  // Root container for animation bobbing
  const charBody = new THREE.Group();
  charBody.name = 'charBody';
  root.add(charBody);

  const skinMat = new THREE.MeshStandardMaterial({
    color: COLORS.skin,
    roughness: 0.6,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: COLORS.hair,
    roughness: 0.9,
  });
  const jacketMat = new THREE.MeshStandardMaterial({
    color: COLORS.jacket,
    roughness: 0.5,
    metalness: 0.2,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: COLORS.jacketTrim,
    emissive: COLORS.jacketTrim,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: COLORS.amuletCyan,
    emissive: COLORS.amuletCyan,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });

  if (characterId.startsWith('hero_')) {
    // 15-year-old brave Indian orphan boy
    const tier = characterId === 'hero_t3' ? 3 : characterId === 'hero_t2' ? 2 : 1;

    // Torso / Jacket
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.85, 0.42);
    const torso = new THREE.Mesh(torsoGeo, tier === 3 ? new THREE.MeshStandardMaterial({
      color: 0x161022,
      roughness: 0.3,
      metalness: 0.8,
    }) : jacketMat);
    torso.position.y = 1.1;
    charBody.add(torso);

    // Jacket Orange Trim Stripes
    const trimGeo = new THREE.BoxGeometry(0.72, 0.08, 0.44);
    const trim1 = new THREE.Mesh(trimGeo, trimMat);
    trim1.position.y = 1.35;
    charBody.add(trim1);

    const trim2 = new THREE.Mesh(trimGeo, trimMat);
    trim2.position.y = 0.85;
    charBody.add(trim2);

    // Glowing Cyan Amulet on Chest
    const amuletGeo = new THREE.OctahedronGeometry(0.12);
    const amulet = new THREE.Mesh(amuletGeo, cyanGlowMat);
    amulet.position.set(0, 1.25, 0.24);
    amulet.rotation.z = Math.PI / 4;
    charBody.add(amulet);

    // Amulet Light
    const amuletLight = new THREE.PointLight(COLORS.amuletCyan, 1.2, 3);
    amuletLight.position.set(0, 1.25, 0.3);
    charBody.add(amuletLight);

    // Utility Belt & Treasure Satchel
    const beltGeo = new THREE.BoxGeometry(0.74, 0.1, 0.46);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.8 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.72;
    charBody.add(belt);

    const satchelGeo = new THREE.BoxGeometry(0.22, 0.25, 0.16);
    const satchel = new THREE.Mesh(satchelGeo, beltMat);
    satchel.position.set(0.38, 0.65, 0.1);
    charBody.add(satchel);

    // Head
    const headGeo = new THREE.BoxGeometry(0.48, 0.52, 0.48);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.82;
    charBody.add(head);

    // Scar on cheek
    const scarGeo = new THREE.BoxGeometry(0.04, 0.14, 0.02);
    const scarMat = new THREE.MeshBasicMaterial({ color: COLORS.scar });
    const scar = new THREE.Mesh(scarGeo, scarMat);
    scar.position.set(0.16, 1.76, 0.25);
    scar.rotation.z = 0.3;
    charBody.add(scar);

    // Messy Hair
    const hairGeo = new THREE.BoxGeometry(0.54, 0.28, 0.54);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 2.05;
    charBody.add(hair);

    const hairTuftGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
    const tuft1 = new THREE.Mesh(hairTuftGeo, hairMat);
    tuft1.position.set(0.12, 2.18, 0.2);
    tuft1.rotation.set(-0.2, 0.2, -0.4);
    charBody.add(tuft1);

    const tuft2 = new THREE.Mesh(hairTuftGeo, hairMat);
    tuft2.position.set(-0.15, 2.16, 0.15);
    tuft2.rotation.set(-0.3, -0.1, 0.3);
    charBody.add(tuft2);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.06, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.84, 0.25);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.84, 0.25);
    charBody.add(eyeL, eyeR);

    // Armored Bracers & Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.7, 0.2);
    const bracerGeo = new THREE.BoxGeometry(0.22, 0.35, 0.24);
    const bracerMat = new THREE.MeshStandardMaterial({
      color: COLORS.bracers,
      metalness: 0.7,
      roughness: 0.3,
    });

    const leftArmGroup = new THREE.Group();
    leftArmGroup.name = 'leftArm';
    leftArmGroup.position.set(-0.48, 1.4, 0);
    const leftArm = new THREE.Mesh(armGeo, jacketMat);
    leftArm.position.y = -0.3;
    const leftBracer = new THREE.Mesh(bracerGeo, bracerMat);
    leftBracer.position.y = -0.35;
    leftArmGroup.add(leftArm, leftBracer);
    charBody.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.name = 'rightArm';
    rightArmGroup.position.set(0.48, 1.4, 0);
    const rightArm = new THREE.Mesh(armGeo, jacketMat);
    rightArm.position.y = -0.3;
    const rightBracer = new THREE.Mesh(bracerGeo, bracerMat);
    rightBracer.position.y = -0.35;
    rightArmGroup.add(rightArm, rightBracer);
    charBody.add(rightArmGroup);

    // Legs & Sturdy Boots
    const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.26);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
    const bootGeo = new THREE.BoxGeometry(0.28, 0.25, 0.38);
    const bootMat = new THREE.MeshStandardMaterial({ color: COLORS.boots, roughness: 0.4 });

    const leftLegGroup = new THREE.Group();
    leftLegGroup.name = 'leftLeg';
    leftLegGroup.position.set(-0.2, 0.65, 0);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.y = -0.3;
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(0, -0.55, 0.05);
    leftLegGroup.add(leftLeg, leftBoot);
    charBody.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.name = 'rightLeg';
    rightLegGroup.position.set(0.2, 0.65, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.y = -0.3;
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0, -0.55, 0.05);
    rightLegGroup.add(rightLeg, rightBoot);
    charBody.add(rightLegGroup);

    // --- TIER 2 UPGRADES ---
    if (tier >= 2) {
      // Reinforced Shoulder Armor Pauldrons
      const pauldronGeo = new THREE.ConeGeometry(0.25, 0.35, 4);
      const pauldronMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.2,
      });
      const pL = new THREE.Mesh(pauldronGeo, pauldronMat);
      pL.position.set(-0.52, 1.48, 0);
      pL.rotation.z = 0.5;
      const pR = new THREE.Mesh(pauldronGeo, pauldronMat);
      pR.position.set(0.52, 1.48, 0);
      pR.rotation.z = -0.5;
      charBody.add(pL, pR);

      // Glowing Blue Rune Lines on Gauntlet
      const gauntletGlowMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 2.0,
      });
      const gauntletGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.42, 8);
      const gauntlet = new THREE.Mesh(gauntletGeo, gauntletGlowMat);
      gauntlet.position.y = -0.35;
      rightArmGroup.add(gauntlet);
    }

    // --- TIER 3 UPGRADES ---
    if (tier === 3) {
      // Fire-resistant dark battle plates with orange-magenta veins
      const magmaVeinMat = new THREE.MeshStandardMaterial({
        color: COLORS.hotMagenta,
        emissive: COLORS.hotMagenta,
        emissiveIntensity: 2.8,
      });

      // Flowing Energy Cape
      const capeGeo = new THREE.PlaneGeometry(0.8, 1.4, 4, 4);
      const capeMat = new THREE.MeshStandardMaterial({
        color: 0x831843,
        emissive: 0xdb2777,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
      });
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.position.set(0, 0.9, -0.26);
      cape.rotation.x = 0.15;
      cape.name = 'heroCape';
      charBody.add(cape);

      // Floating Holographic Ring around Arm
      const ringGeo = new THREE.TorusGeometry(0.28, 0.02, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: COLORS.electricCyan,
        wireframe: true,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'holoRing';
      ring.position.set(0.5, 1.1, 0);
      ring.rotation.x = Math.PI / 2;
      charBody.add(ring);

      // Magma Vein Chest Plates
      const plateGeo = new THREE.BoxGeometry(0.74, 0.2, 0.48);
      const chestPlate = new THREE.Mesh(plateGeo, magmaVeinMat);
      chestPlate.position.y = 1.25;
      charBody.add(chestPlate);
    }
  } else if (characterId === 'companion_shield') {
    // Vikram: Stocky cheerful boy with heavy shield & hammer
    const stockyMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 }); // Orange vest
    const heavyArmorMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

    // Wide Torso
    const torsoGeo = new THREE.BoxGeometry(1.0, 0.9, 0.6);
    const torso = new THREE.Mesh(torsoGeo, stockyMat);
    torso.position.y = 1.05;
    charBody.add(torso);

    // Head with smile
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.75;
    charBody.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.6), hairMat);
    hair.position.y = 2.0;
    charBody.add(hair);

    // Heavy Pauldron
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), heavyArmorMat);
    pauldron.position.set(-0.65, 1.4, 0);
    charBody.add(pauldron);

    // Tower Shield on left arm
    const shieldGeo = new THREE.BoxGeometry(0.12, 1.4, 0.8);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xf97316,
      emissiveIntensity: 0.4,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(-0.75, 1.0, 0.25);
    charBody.add(shield);

    // Sturdy Legs
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), heavyArmorMat);
    l1.position.set(-0.25, 0.3, 0);
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), heavyArmorMat);
    l2.position.set(0.25, 0.3, 0);
    charBody.add(l1, l2);
  } else if (characterId === 'companion_tech') {
    // Kabir: Thin, quick boy with glasses, scarf, wrist crossbow & tech backpack
    const slimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.7 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.35), slimMat);
    torso.position.y = 1.1;
    charBody.add(torso);

    // Scarf around neck
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.1, 8, 16), scarfMat);
    scarf.position.set(0, 1.55, 0);
    scarf.rotation.x = Math.PI / 2;
    charBody.add(scarf);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.42), skinMat);
    head.position.y = 1.82;
    charBody.add(head);

    // Glasses
    const glassesMat = new THREE.MeshBasicMaterial({ color: COLORS.electricCyan });
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.05), glassesMat);
    glasses.position.set(0, 1.85, 0.23);
    charBody.add(glasses);

    // Tech Gadget Backpack with Cyan Antenna
    const packMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.3), packMat);
    pack.position.set(0, 1.1, -0.3);
    charBody.add(pack);

    const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
    const antenna = new THREE.Mesh(antennaGeo, cyanGlowMat);
    antenna.position.set(0.15, 1.6, -0.3);
    charBody.add(antenna);

    // Legs
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), slimMat);
    l1.position.set(-0.16, 0.35, 0);
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), slimMat);
    l2.position.set(0.16, 0.35, 0);
    charBody.add(l1, l2);
  }

  return root;
}

// -------------------------------------------------------------
// WEAPON MODELS
// -------------------------------------------------------------

export function createWeaponMesh(weaponId: WeaponId): THREE.Group {
  const root = new THREE.Group();
  root.name = `weapon_${weaponId}`;

  switch (weaponId) {
    case 'runic_blade': {
      // Slender steel blade with cyan glowing runes
      const bladeGeo = new THREE.BoxGeometry(0.08, 1.6, 0.18);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.1,
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 0.9;

      const runeGeo = new THREE.BoxGeometry(0.09, 1.2, 0.05);
      const runeMat = new THREE.MeshStandardMaterial({
        color: COLORS.amuletCyan,
        emissive: COLORS.amuletCyan,
        emissiveIntensity: 3.0,
      });
      const rune = new THREE.Mesh(runeGeo, runeMat);
      rune.position.y = 0.9;

      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
      guard.position.y = 0.1;
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e1e24 }));
      hilt.position.y = -0.15;

      root.add(blade, rune, guard, hilt);
      break;
    }
    case 'fire_axe': {
      // Obsidian & magma battle axe
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 }));
      handle.position.y = 0.7;

      const axeHeadMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 });
      const magmaEdgeMat = new THREE.MeshStandardMaterial({ color: COLORS.magmaOrange, emissive: COLORS.magmaOrange, emissiveIntensity: 2.5 });

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.9), axeHeadMat);
      head.position.set(0, 1.4, 0.2);

      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.72, 0.1), magmaEdgeMat);
      edge.position.set(0, 1.4, 0.65);

      root.add(handle, head, edge);
      break;
    }
    case 'plasma_crossbow': {
      // Angular cyan plasma crossbow
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.9), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 }));
      body.position.set(0, 0.2, 0.3);

      const bowLimb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
      bowLimb.position.set(0, 0.2, 0.7);

      const plasmaBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), new THREE.MeshStandardMaterial({
        color: COLORS.electricCyan,
        emissive: COLORS.electricCyan,
        emissiveIntensity: 3.5,
      }));
      plasmaBolt.rotation.x = Math.PI / 2;
      plasmaBolt.position.set(0, 0.25, 0.4);

      root.add(body, bowLimb, plasmaBolt);
      break;
    }
    case 'lightning_staff': {
      // Rod with hovering crackling crystal
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0), new THREE.MeshStandardMaterial({ color: 0x2e1065, metalness: 0.6 }));
      shaft.position.y = 0.9;

      const crystalGeo = new THREE.OctahedronGeometry(0.2);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 3.5,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.y = 2.05;
      crystal.name = 'staffCrystal';

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.02, 8, 16), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
      ring.position.y = 2.05;
      ring.rotation.x = Math.PI / 2;

      root.add(shaft, crystal, ring);
      break;
    }
    case 'twin_daggers': {
      // Dual emerald kinetic daggers
      const daggerMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 2.8,
        metalness: 0.8,
      });
      const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.12), daggerMat);
      d1.position.set(-0.25, 0.4, 0);
      const d2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.12), daggerMat);
      d2.position.set(0.25, 0.4, 0);
      root.add(d1, d2);
      break;
    }
    case 'demon_greatsword': {
      // Colossal two-handed broadsword with hot magenta flame edge
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x121018, metalness: 0.9, roughness: 0.2 });
      const flameMat = new THREE.MeshStandardMaterial({
        color: COLORS.hotMagenta,
        emissive: COLORS.hotMagenta,
        emissiveIntensity: 4.0,
      });

      const colossalBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.5), bladeMat);
      colossalBlade.position.y = 1.4;

      const flameEdgeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 0.08), flameMat);
      flameEdgeL.position.set(0, 1.4, 0.28);
      const flameEdgeR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 0.08), flameMat);
      flameEdgeR.position.set(0, 1.4, -0.28);

      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), new THREE.MeshStandardMaterial({ color: 0x3f3f46 }));
      hilt.position.y = -0.1;

      root.add(colossalBlade, flameEdgeL, flameEdgeR, hilt);
      break;
    }
  }

  return root;
}

// -------------------------------------------------------------
// ENEMY MODELS
// -------------------------------------------------------------

export function createEnemyMesh(species: EnemySpecies): THREE.Group {
  const root = new THREE.Group();
  root.name = `enemy_${species}`;

  if (species === 'bat') {
    // Demonic bat, 4-meter wingspan, charred body, glowing orange veins, red eyes
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x121016, roughness: 0.8 });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const veinMat = new THREE.MeshStandardMaterial({
      color: COLORS.magmaOrange,
      emissive: COLORS.magmaOrange,
      emissiveIntensity: 2.2,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });

    // Torso / Head
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), bodyMat);
    body.scale.set(0.8, 1.2, 0.8);
    root.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bodyMat);
    head.position.set(0, 0.6, 0.4);
    root.add(head);

    // Glowing Red Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
    eyeL.position.set(-0.16, 0.7, 0.72);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
    eyeR.position.set(0.16, 0.7, 0.72);
    root.add(eyeL, eyeR);

    // Fangs
    const fangGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
    const fangMat = new THREE.MeshStandardMaterial({ color: COLORS.bone });
    const f1 = new THREE.Mesh(fangGeo, fangMat);
    f1.position.set(-0.1, 0.45, 0.75);
    f1.rotation.x = Math.PI;
    const f2 = new THREE.Mesh(fangGeo, fangMat);
    f2.position.set(0.1, 0.45, 0.75);
    f2.rotation.x = Math.PI;
    root.add(f1, f2);

    // Left Wing
    const leftWing = new THREE.Group();
    leftWing.name = 'leftWing';
    leftWing.position.set(-0.5, 0.2, 0);
    const lWingMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.2), wingMat);
    lWingMesh.position.x = -1.0;
    const lVein = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.08), veinMat);
    lVein.position.set(-1.0, 0.02, 0);
    leftWing.add(lWingMesh, lVein);
    root.add(leftWing);

    // Right Wing
    const rightWing = new THREE.Group();
    rightWing.name = 'rightWing';
    rightWing.position.set(0.5, 0.2, 0);
    const rWingMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.2), wingMat);
    rWingMesh.position.x = 1.0;
    const rVein = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.08), veinMat);
    rVein.position.set(1.0, 0.02, 0);
    rightWing.add(rWingMesh, rVein);
    root.add(rightWing);
  } else if (species === 'wyvern') {
    // Massive Fire-Breathing Flying Dinosaur
    const scaleMat = new THREE.MeshStandardMaterial({ color: 0x1f1d24, metalness: 0.4, roughness: 0.6 });
    const lavaCrackMat = new THREE.MeshStandardMaterial({
      color: COLORS.magmaOrange,
      emissive: COLORS.magmaOrange,
      emissiveIntensity: 3.0,
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 2.5, 8), scaleMat);
    body.rotation.x = Math.PI / 2;
    body.scale.set(1, 1.2, 1);
    root.add(body);

    // Magma crack lines on back
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 2.2), lavaCrackMat);
    crack.position.y = 0.7;
    root.add(crack);

    // Horned Skull
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.6, 1.8);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 6), scaleMat);
    head.rotation.x = -Math.PI / 2;
    headGroup.add(head);

    // Furnace glow in throat
    const throatGlow = new THREE.PointLight(COLORS.magmaOrange, 2.5, 6);
    throatGlow.position.set(0, 0, 0.5);
    headGroup.add(throatGlow);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.15, 0.8, 5);
    const hornL = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0x111 }));
    hornL.position.set(-0.4, 0.4, -0.2);
    hornL.rotation.set(-0.5, 0, -0.4);
    const hornR = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0x111 }));
    hornR.position.set(0.4, 0.4, -0.2);
    hornR.rotation.set(-0.5, 0, 0.4);
    headGroup.add(hornL, hornR);
    root.add(headGroup);

    // Huge Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x2a1010, side: THREE.DoubleSide });
    const leftWing = new THREE.Group();
    leftWing.name = 'leftWing';
    leftWing.position.set(-0.8, 0.4, 0);
    const lMesh = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 1.8), wingMat);
    lMesh.position.x = -1.75;
    leftWing.add(lMesh);
    root.add(leftWing);

    const rightWing = new THREE.Group();
    rightWing.name = 'rightWing';
    rightWing.position.set(0.8, 0.4, 0);
    const rMesh = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 1.8), wingMat);
    rMesh.position.x = 1.75;
    rightWing.add(rMesh);
    root.add(rightWing);

    // Spiked Tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.0, 6), scaleMat);
    tail.position.set(0, 0.2, -2.0);
    tail.rotation.x = Math.PI / 2;
    root.add(tail);
  } else if (species === 'demon_boss') {
    // Colossal 6-meter Magma Demon Boss
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x141018,
      roughness: 0.9,
      metalness: 0.1,
    });
    const magmaCoreMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff4400,
      emissiveIntensity: 3.5,
    });

    // Massive Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.0, 1.6), rockMat);
    torso.position.y = 3.2;
    root.add(torso);

    // Magma Fissures
    const fissure = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.4, 1.65), magmaCoreMat);
    fissure.position.y = 3.2;
    root.add(fissure);

    // Head with Curved Horns
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), rockMat);
    head.position.y = 5.2;
    root.add(head);

    // Horns
    const hornGeo = new THREE.TorusGeometry(0.8, 0.18, 8, 16, Math.PI / 1.5);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x221111, metalness: 0.5 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.7, 5.8, 0);
    hornL.rotation.z = Math.PI / 4;
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.7, 5.8, 0);
    hornR.rotation.z = -Math.PI / 4;
    hornR.scale.x = -1;
    root.add(hornL, hornR);

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), eyeMat);
    eye1.position.set(-0.35, 5.3, 0.65);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), eyeMat);
    eye2.position.set(0.35, 5.3, 0.65);
    root.add(eye1, eye2);

    // Huge Spiked War Hammer in right hand
    const hammerArm = new THREE.Group();
    hammerArm.name = 'hammerArm';
    hammerArm.position.set(1.6, 4.0, 0);

    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.8), rockMat);
    armMesh.position.y = -0.8;
    hammerArm.add(armMesh);

    const hammerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5), new THREE.MeshStandardMaterial({ color: 0x27272a }));
    hammerShaft.position.set(0, -1.0, 1.0);
    hammerShaft.rotation.x = Math.PI / 4;
    hammerArm.add(hammerShaft);

    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.6), magmaCoreMat);
    hammerHead.position.set(0, 0.4, 2.4);
    hammerArm.add(hammerHead);
    root.add(hammerArm);

    // Massive Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 1.0), rockMat);
    legL.position.set(-0.8, 1.0, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 1.0), rockMat);
    legR.position.set(0.8, 1.0, 0);
    root.add(legL, legR);
  } else if (species === 'shadow_entity') {
    // Mysterious Shadow Entity: Swirling smoke humanoid, glowing white eyes, hovering
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0x090610,
      roughness: 0.95,
      transparent: true,
      opacity: 0.88,
    });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 2.2, 12), smokeMat);
    torso.position.y = 1.6;
    root.add(torso);

    const cloakGeo = new THREE.ConeGeometry(0.9, 2.2, 12, 1, true);
    const cloak = new THREE.Mesh(cloakGeo, smokeMat);
    cloak.position.y = 1.2;
    cloak.rotation.x = Math.PI;
    root.add(cloak);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), smokeMat);
    head.position.y = 2.8;
    root.add(head);

    // Glowing White Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    eyeL.position.set(-0.15, 2.85, 0.38);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    eyeR.position.set(0.15, 2.85, 0.38);
    root.add(eyeL, eyeR);

    // Floating Purple-Cyan Wisps
    const wispGroup = new THREE.Group();
    wispGroup.name = 'wisps';
    for (let i = 0; i < 6; i++) {
      const wColor = i % 2 === 0 ? COLORS.hotMagenta : COLORS.amuletCyan;
      const wisp = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color: wColor }));
      const angle = (i / 6) * Math.PI * 2;
      wisp.position.set(Math.cos(angle) * 1.1, 1.8 + Math.sin(i) * 0.5, Math.sin(angle) * 1.1);
      wispGroup.add(wisp);
    }
    root.add(wispGroup);
  }

  return root;
}

// -------------------------------------------------------------
// ENVIRONMENT ASSETS
// -------------------------------------------------------------

export function createDemonStatue(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1f1d24, roughness: 0.9 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 2.2), stoneMat);
  pedestal.position.y = 0.5;
  group.add(pedestal);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 1.4), stoneMat);
  body.position.y = 2.4;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 1.0), stoneMat);
  head.position.y = 4.2;
  group.add(head);

  // Glowing eyes
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.14), eyeMat);
  eye1.position.set(-0.3, 4.3, 0.55);
  const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.14), eyeMat);
  eye2.position.set(0.3, 4.3, 0.55);
  group.add(eye1, eye2);

  return group;
}

export function createAncientPuzzleTree(): THREE.Group {
  const group = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x18141c, roughness: 0.95 });

  // Giant ancient trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.2, 9, 12), barkMat);
  trunk.position.y = 4.5;
  group.add(trunk);

  // Ancient Twisted Branches
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 5, 8), barkMat);
    branch.position.set(Math.cos(angle) * 2.2, 8, Math.sin(angle) * 2.2);
    branch.rotation.set(0.5 * Math.sin(angle), angle, 0.5 * Math.cos(angle));
    group.add(branch);
  }

  // Carved Puzzle Mechanism / Swirling Energy Portal inside trunk
  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.15, 16, 32),
    new THREE.MeshStandardMaterial({
      color: COLORS.hotMagenta,
      emissive: COLORS.hotMagenta,
      emissiveIntensity: 3.0,
    })
  );
  portalRing.position.set(0, 3.0, 2.2);
  group.add(portalRing);

  const portalDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 24),
    new THREE.MeshBasicMaterial({
      color: COLORS.amuletCyan,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    })
  );
  portalDisc.position.set(0, 3.0, 2.25);
  portalDisc.name = 'treePortalDisc';
  group.add(portalDisc);

  const portalLight = new THREE.PointLight(COLORS.amuletCyan, 2.5, 8);
  portalLight.position.set(0, 3.0, 3.0);
  group.add(portalLight);

  return group;
}

export function createChestMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'treasureChest';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.8 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: COLORS.gold,
    emissive: COLORS.gold,
    emissiveIntensity: 1.5,
    metalness: 0.9,
    roughness: 0.2,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), woodMat);
  base.position.y = 0.35;
  group.add(base);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.85), goldMat);
  trim.position.y = 0.7;
  group.add(trim);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.2, 12, 1, false, 0, Math.PI), woodMat);
  lid.rotation.z = Math.PI / 2;
  lid.position.set(0, 0.7, 0);
  group.add(lid);

  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.1), goldMat);
  lock.position.set(0, 0.6, 0.42);
  group.add(lock);

  const glowLight = new THREE.PointLight(COLORS.gold, 1.5, 4);
  glowLight.position.set(0, 1.0, 0.5);
  group.add(glowLight);

  return group;
}

export function createBlueTorch(): THREE.Group {
  const group = new THREE.Group();
  const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 2.0), standMat);
  stand.position.y = 1.0;
  group.add(stand);

  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.6, 8),
    new THREE.MeshBasicMaterial({ color: COLORS.electricCyan })
  );
  fire.position.y = 2.2;
  fire.name = 'torchFlame';
  group.add(fire);

  const light = new THREE.PointLight(COLORS.electricCyan, 1.8, 6);
  light.position.y = 2.4;
  group.add(light);

  return group;
}
