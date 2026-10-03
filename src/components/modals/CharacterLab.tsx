import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Check, Lock, Zap, Shield, Flame, Sparkles } from 'lucide-react';
import { CharacterConfig, CharacterId } from '../../types/game';
import { CHARACTERS } from '../../game/constants';
import { createCharacterMesh } from '../../game/proceduralModels';

interface CharacterLabProps {
  unlockedCharacters: string[];
  selectedCharacter: CharacterId;
  coins: number;
  onSelectCharacter: (id: CharacterId) => void;
  onUnlockCharacter: (id: CharacterId) => Promise<void>;
  onClose: () => void;
}

export const CharacterLab: React.FC<CharacterLabProps> = ({
  unlockedCharacters,
  selectedCharacter,
  coins,
  onSelectCharacter,
  onUnlockCharacter,
  onClose,
}) => {
  const [activePreviewId, setActivePreviewId] = useState<CharacterId>(selectedCharacter);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const previewMountRef = useRef<HTMLDivElement>(null);

  const activeChar = CHARACTERS.find((c) => c.id === activePreviewId) || CHARACTERS[0];
  const isUnlocked = unlockedCharacters.includes(activePreviewId);
  const isSelected = selectedCharacter === activePreviewId;

  // 3D Rotating Preview in Character Lab
  useEffect(() => {
    const container = previewMountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0710);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(new THREE.Color(activeChar.accentColor), 2.2);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 0.3, 24),
      new THREE.MeshStandardMaterial({ color: 0x181422, roughness: 0.8 })
    );
    pedestal.position.y = -0.15;
    scene.add(pedestal);

    // Glowing rim on pedestal
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.04, 12, 32),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(activeChar.accentColor),
        emissive: new THREE.Color(activeChar.accentColor),
        emissiveIntensity: 2.5,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Character model
    const charMesh = createCharacterMesh(activePreviewId);
    scene.add(charMesh);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      charMesh.rotation.y += 0.012; // slow turntable rotation
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activePreviewId]);

  const handleBuy = async () => {
    setErrorMsg(null);
    if (coins < activeChar.price) {
      setErrorMsg(`Not enough coins! You need ${activeChar.price - coins} more coins.`);
      return;
    }
    setIsPurchasing(true);
    try {
      await onUnlockCharacter(activePreviewId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-zinc-950/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-chakra flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Character Lab & Tiers
            </h2>
            <p className="text-xs text-zinc-400">
              Upgrade Arjun through battle tiers or recruit companion fighters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: 3D Turntable Left + Stats & Selector Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* 3D Turntable Model Preview */}
          <div className="md:col-span-6 bg-gradient-to-b from-zinc-900/30 to-black/70 flex flex-col items-center justify-center relative p-4 min-h-[300px]">
            <div ref={previewMountRef} className="w-full h-72 md:h-84 cursor-grab" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className="px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider text-black font-chakra"
                style={{ backgroundColor: activeChar.accentColor }}
              >
                {activeChar.category === 'hero' ? `Tier ${activeChar.tier}` : 'Companion'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">
              Drag to view 360° turnaround
            </p>
          </div>

          {/* Character Details & Selection Column */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800/80 bg-zinc-950">
            <div>
              {/* Character List Tabs */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {CHARACTERS.map((char) => {
                  const unlocked = unlockedCharacters.includes(char.id);
                  const isCur = activePreviewId === char.id;

                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        setActivePreviewId(char.id);
                        setErrorMsg(null);
                      }}
                      className={`relative p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                        isCur
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-zinc-300 truncate w-full text-center">
                        {char.tier ? `T${char.tier}` : 'COMP'}
                      </span>
                      {!unlocked && (
                        <Lock className="w-3.5 h-3.5 text-zinc-500 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Character Lore & Details */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white font-chakra">{activeChar.name}</h3>
                <p className="text-xs text-cyan-400 font-semibold mb-2">{activeChar.title}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{activeChar.description}</p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <div className="text-[10px] uppercase text-zinc-400 font-bold mb-1">Speed</div>
                  <div className="text-base font-bold text-white tabular-nums">
                    {(activeChar.speed * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <div className="text-[10px] uppercase text-zinc-400 font-bold mb-1">Defense</div>
                  <div className="text-base font-bold text-amber-400 tabular-nums">
                    {activeChar.defense}%
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <div className="text-[10px] uppercase text-zinc-400 font-bold mb-1">Damage</div>
                  <div className="text-base font-bold text-rose-400 tabular-nums">
                    x{activeChar.damageMultiplier}
                  </div>
                </div>
              </div>

              {/* Signature Ability */}
              <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    {activeChar.abilityName}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    CD: {activeChar.abilityCooldown}s
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {activeChar.abilityDescription}
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 mb-4 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <div>
                {!isUnlocked && (
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    Price: <span className="text-amber-400 font-bold">{activeChar.price} Coins</span>
                  </div>
                )}
              </div>

              {isSelected ? (
                <button
                  disabled
                  className="px-6 py-2.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 cursor-default"
                >
                  <Check className="w-4 h-4" /> Equipped
                </button>
              ) : isUnlocked ? (
                <button
                  onClick={() => onSelectCharacter(activePreviewId)}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Equip Character
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={isPurchasing}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  {isPurchasing ? 'Unlocking...' : `Unlock for ${activeChar.price} Coins`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
