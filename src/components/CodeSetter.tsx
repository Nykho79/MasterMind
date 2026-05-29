/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Eye, EyeOff, Lock, Delete } from 'lucide-react';
import { AnimalPeg } from '../types';
import { ANIMAL_PEGS } from '../constants';
import { playBubble, playErase, playLockSecret, playWarning } from '../utils/audio';

interface CodeSetterProps {
  onCodeLocked: (code: AnimalPeg[]) => void;
  creatorName: string;
}

export default function CodeSetter({ onCodeLocked, creatorName }: CodeSetterProps) {
  const [selectedPegs, setSelectedPegs] = useState<(AnimalPeg | null)[]>([null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [hideCode, setHideCode] = useState<boolean>(true);

  const handlePegClick = (peg: AnimalPeg) => {
    playBubble();
    const newPegs = [...selectedPegs];
    newPegs[activeSlot] = peg;
    setSelectedPegs(newPegs);

    // Auto-advance slot if not at the end
    if (activeSlot < 3) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const handleClearSlot = (index: number) => {
    playErase();
    const newPegs = [...selectedPegs];
    newPegs[index] = null;
    setSelectedPegs(newPegs);
    setActiveSlot(index);
  };

  const handleClearAll = () => {
    playErase();
    setSelectedPegs([null, null, null, null]);
    setActiveSlot(0);
  };

  const handleLockIn = () => {
    // Check if code is fully set
    if (selectedPegs.some(peg => peg === null)) {
      playWarning();
      return;
    }

    playLockSecret();
    onCodeLocked(selectedPegs as AnimalPeg[]);
  };

  const totalSelected = selectedPegs.filter(p => p !== null).length;

  return (
    <div className="w-full bg-white/70 backdrop-blur-md rounded-3xl border-4 border-pink-200 p-6 shadow-xl" id="code-setter-panel">
      {/* Title */}
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
          Tour du Créateur 🦄
        </span>
        <h2 className="text-2xl font-black text-purple-950">
          {creatorName || 'Créateur'} : Crée ton secret !
        </h2>
        <p className="text-xs text-purple-800/80 max-w-sm mx-auto mt-1 font-medium">
          Choisis 4 compagnons kawaii. Cache le code pour que l'autre joueur ne puisse pas l'apercevoir ! 😉
        </p>
      </div>

      {/* Lockbox layout styling */}
      <div className="bg-pink-50/70 border-2 border-pink-100 rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-pink-600 uppercase tracking-widest flex items-center gap-1.5">
            <Lock size={12} /> Code Mystère ({totalSelected}/4)
          </span>

          {/* Hide/Show Toggle */}
          <button
            onClick={() => {
              playBubble();
              setHideCode(!hideCode);
            }}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 bg-white border border-pink-200 rounded-xl hover:bg-pink-100/60 text-pink-600 transition-colors cursor-pointer"
            id="hide-code-toggle"
          >
            {hideCode ? (
              <>
                <Eye size={12} className="text-pink-500" />
                <span>Afficher le code</span>
              </>
            ) : (
              <>
                <EyeOff size={12} className="text-pink-500" />
                <span>Cacher le code</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Slots */}
        <div className="flex justify-center gap-4 mb-2">
          {selectedPegs.map((peg, index) => {
            const isActive = activeSlot === index;
            return (
              <button
                key={index}
                onClick={() => {
                  playBubble();
                  setActiveSlot(index);
                }}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer group shadow-sm ${
                  isActive
                    ? 'ring-4 ring-pink-400 bg-pink-100 border-2 border-pink-300 scale-105'
                    : 'bg-white hover:bg-pink-50 border-2 border-pink-100'
                }`}
                title={`Slot ${index + 1}`}
                id={`creator-slot-${index}`}
              >
                {peg ? (
                  hideCode ? (
                    // Cute closed mask/gift
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-2xl animate-pulse">🎁</span>
                    </div>
                  ) : (
                    // Revealed Character
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl text-center leading-none">{peg.emoji}</span>
                      <span className="text-[9px] font-black uppercase text-purple-900 leading-none mt-1">
                        {peg.name}
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-pink-300 font-extrabold">Vide</span>
                )}

                {/* Individual Clear Badge */}
                {peg && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSlot(index);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer transition-colors"
                  >
                    ×
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Animals Selector */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs font-black text-purple-800 uppercase tracking-widest">
            Sélectionne un compagnon :
          </span>
          <button
            onClick={handleClearAll}
            disabled={totalSelected === 0}
            className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 disabled:opacity-40 transition-opacity cursor-pointer"
            id="clear-all-creator-btn"
          >
            <Delete size={12} />
            Tout effacer
          </button>
        </div>

        {/* 2x4 cute animal grid */}
        <div className="grid grid-cols-4 gap-3">
          {ANIMAL_PEGS.map((peg) => (
            <button
              key={peg.id}
              onClick={() => handlePegClick(peg)}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 select-none shadow-sm ${peg.colorClass}`}
              id={`animal-selector-${peg.id}`}
            >
              <span className="text-3xl md:text-4xl leading-none transform transition-transform group-hover:scale-110">
                {peg.emoji}
              </span>
              <span className="text-[10px] font-bold text-purple-950 mt-1.5">
                {peg.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lock Button */}
      <button
        onClick={handleLockIn}
        disabled={totalSelected < 4}
        className={`w-full py-4 rounded-3xl font-black text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
          totalSelected < 4
            ? 'bg-slate-200 text-slate-400 border-2 border-slate-300 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white border-b-4 border-rose-500 active:scale-95'
        }`}
        id="lock-code-btn"
      >
        <Lock size={18} />
        <span>Verrouiller le code secret 🔐</span>
      </button>
    </div>
  );
}
