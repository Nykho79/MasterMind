/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Send, Delete, Star, Heart, Cloud, Sparkles } from 'lucide-react';
import { AnimalPeg, GuessRow } from '../types';
import { ANIMAL_PEGS } from '../constants';
import { playBubble, playErase, playConfirm, playWarning } from '../utils/audio';

interface GameBoardProps {
  guesses: GuessRow[];
  currentGuessIndex: number;
  decoderName: string;
  onGuessSubmitted: (guess: AnimalPeg[]) => void;
  isActive?: boolean;
  opponentName?: string;
  maxAttempts?: number;
  revealedAnimals?: AnimalPeg[];
}

export default function GameBoard({
  guesses,
  currentGuessIndex,
  decoderName,
  onGuessSubmitted,
  isActive = true,
  opponentName = '',
  maxAttempts = 10,
  revealedAnimals = [],
}: GameBoardProps) {
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [currentGuess, setCurrentGuess] = useState<(AnimalPeg | null)[]>([null, null, null, null]);

  const handlePegSelect = (peg: AnimalPeg) => {
    if (!isActive) return;
    playBubble();
    const nextGuess = [...currentGuess];
    nextGuess[activeSlot] = peg;
    setCurrentGuess(nextGuess);

    // Auto advance active slot
    if (activeSlot < 3) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const handleClearSlot = (index: number) => {
    if (!isActive) return;
    playErase();
    const nextGuess = [...currentGuess];
    nextGuess[index] = null;
    setCurrentGuess(nextGuess);
    setActiveSlot(index);
  };

  const handleClearAll = () => {
    if (!isActive) return;
    playErase();
    setCurrentGuess([null, null, null, null]);
    setActiveSlot(0);
  };

  const handleSubmit = () => {
    if (!isActive) return;
    // Check if configuration is full
    if (currentGuess.some((p) => p === null)) {
      playWarning();
      return;
    }

    playConfirm();
    onGuessSubmitted(currentGuess as AnimalPeg[]);
    
    // Reset our temporary guess state for the next turn
    setCurrentGuess([null, null, null, null]);
    setActiveSlot(0);
  };

  // Check how many pegs are placed in the current row
  const totalPlaced = currentGuess.filter((p) => p !== null).length;

  return (
    <div className="w-full flex flex-col gap-6" id="game-board-container">
      {/* Scrollable Attempts Board */}
      <div className="bg-white/75 backdrop-blur-md rounded-3xl border-4 border-pink-200 p-4 md:p-6 shadow-xl max-h-[550px] overflow-y-auto custom-scrollbar">
        
        {/* Board Header decoration */}
        <div className="flex justify-between items-center mb-4 px-2 border-b border-pink-100 pb-2">
          <span className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1">
            🎯 {decoderName || 'Décodeur'}
          </span>
          <span className="text-[11px] font-bold text-pink-500">
            Étape {Math.min(currentGuessIndex + 1, maxAttempts)} / {maxAttempts}
          </span>
        </div>

        {/* Revealed Hints Ribbon */}
        {revealedAnimals && revealedAnimals.length > 0 && (
          <div className="mb-4 bg-teal-50 border border-teal-200/50 rounded-2xl p-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-teal-700 flex items-center gap-1">
              ✨ Indices :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {revealedAnimals.map((peg, idx) => (
                <div key={idx} className="bg-white rounded-full px-2.5 py-0.5 border border-teal-100 flex items-center gap-1.5 shadow-sm">
                  <span className="text-base leading-none">{peg.emoji}</span>
                  <span className="text-[8px] font-black text-teal-900 uppercase tracking-wider">{peg.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10 rows from bottom to top or top to bottom.
            Showing oldest guesses first, or newest first?
            Generally, standard mastermind builds from bottom to top, or top to bottom.
            Let's render them in reversed order (new attempt highlighted or in standard 10...1 countdown design).
            This makes it very easy to read on mobile without scrolling too much!
        */}
        <div className="flex flex-col gap-3">
          {guesses.map((row, rowIndex) => {
            const isCurrentRow = rowIndex === currentGuessIndex;
            const isPastRow = rowIndex < currentGuessIndex;
            const isFutureRow = rowIndex > currentGuessIndex;
            const isLockedRow = rowIndex >= maxAttempts;

            if (isLockedRow) {
              return (
                <div
                  key={rowIndex}
                  className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-red-100 bg-red-50/20 opacity-65 select-none pointer-events-none"
                  id={`game-row-${rowIndex}-locked`}
                >
                  <div className="flex-shrink-0 w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-[11px] font-black text-red-700 font-sans shadow-inner">
                    {rowIndex + 1}
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-wider">
                    <span>🔒 Emplacement Bloqué par la Roue</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={rowIndex}
                className={`flex items-center justify-between p-2 rounded-2xl border-2 transition-all duration-300 ${
                  isCurrentRow
                    ? 'bg-pink-100/60 border-pink-300 shadow-md ring-2 ring-pink-200'
                    : isPastRow
                    ? 'bg-purple-50/20 border-purple-100/50 opacity-90'
                    : 'bg-slate-50/30 border-slate-100 opacity-40 select-none pointer-events-none'
                }`}
                id={`game-row-${rowIndex}`}
              >
                {/* Visual Row Round Marker */}
                <div className="flex-shrink-0 w-7 h-7 bg-pink-200/50 rounded-full flex items-center justify-center text-[11px] font-black text-pink-700 font-sans shadow-inner">
                  {rowIndex + 1}
                </div>

                {/* 4 Peg Slots */}
                <div className="flex gap-2.5 mx-auto">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    let displayedPeg: AnimalPeg | null = null;
                    if (isPastRow) {
                      displayedPeg = row.guess[slotIdx];
                    } else if (isCurrentRow) {
                      displayedPeg = currentGuess[slotIdx];
                    }

                    const isSlotSelected = isCurrentRow && activeSlot === slotIdx;

                    return (
                      <button
                        key={slotIdx}
                        disabled={!isCurrentRow || !isActive}
                        onClick={() => {
                          playBubble();
                          setActiveSlot(slotIdx);
                        }}
                        className={`w-11 h-11 md:w-13 md:h-13 rounded-xl flex flex-col items-center justify-center transition-all duration-200 relative ${
                          isSlotSelected
                            ? 'ring-4 ring-pink-400 bg-pink-50 border-pink-300 scale-105'
                            : isCurrentRow
                            ? 'bg-white hover:bg-pink-50 border border-pink-100 cursor-pointer'
                            : isPastRow && displayedPeg
                            ? displayedPeg.colorClass + ' scale-95 border'
                            : 'bg-pink-100/30 border border-dashed border-pink-200/50'
                        }`}
                        id={`row-${rowIndex}-slot-${slotIdx}`}
                      >
                        {displayedPeg ? (
                          <div className="flex flex-col items-center justify-center select-none">
                            <span className="text-2xl leading-none">{displayedPeg.emoji}</span>
                            <span className="text-[8px] font-bold text-purple-950 tracking-tight leading-none mt-0.5">
                              {displayedPeg.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-pink-300/60">
                            {isCurrentRow ? '?' : ''}
                          </span>
                        )}

                        {/* Quick remove badge for active row */}
                        {isCurrentRow && isActive && displayedPeg && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearSlot(slotIdx);
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-md cursor-pointer"
                          >
                            ×
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Clues section (2x2 Grid) */}
                <div className="flex-shrink-0 bg-white/70 backdrop-blur-sm border border-pink-100/60 rounded-xl p-1.5 w-14 h-14 flex items-center justify-center">
                  {isFutureRow ? (
                    <div className="text-[9px] font-bold text-slate-300">Prêt</div>
                  ) : isCurrentRow ? (
                    <div className="text-[9px] font-black text-pink-400 text-center animate-pulse leading-tight">
                      En<br />cours
                    </div>
                  ) : (
                    // 2x2 grid of clues
                    <div className="grid grid-cols-2 gap-1 w-full h-full items-center justify-items-center">
                      {row.clues.map((clue, idx) => {
                        if (clue === 'correct') {
                          return (
                            <div key={idx} className="text-green-500 animate-[bounce_0.6s_ease-in-out_infinite]" title="Bien placé">
                              <Star size={11} fill="currentColor" />
                            </div>
                          );
                        } else if (clue === 'present') {
                          return (
                            <div key={idx} className="text-pink-500" title="Mal placé">
                              <Heart size={11} fill="currentColor" />
                            </div>
                          );
                        } else {
                          return (
                            <div key={idx} className="text-slate-300" title="Absent">
                              <Cloud size={11} />
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* User controllers panel (Selectable Pegs for the active row) */}
      <div className={`bg-white/75 backdrop-blur-md rounded-3xl border-4 p-6 transition-all duration-300 ${
        isActive 
          ? 'border-pink-200 shadow-xl' 
          : 'border-slate-205 shadow-sm opacity-50'
      }`}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-pink-500 animate-spin-slow" />
            Choisis tes animaux ({totalPlaced}/4) :
          </span>
          {isActive && (
            <button
              onClick={handleClearAll}
              disabled={totalPlaced === 0}
              className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 disabled:opacity-40 transition-opacity cursor-pointer"
              id="board-clear-all-btn"
            >
              <Delete size={12} />
              Vide la ligne
            </button>
          )}
        </div>

        {/* Peg Selector buttons grid */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {ANIMAL_PEGS.map((peg) => (
            <button
              key={peg.id}
              onClick={() => handlePegSelect(peg)}
              disabled={!isActive}
              className={`p-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 select-none shadow-sm ${
                isActive ? 'cursor-pointer active:scale-90 hover:scale-102' : 'opacity-65 cursor-not-allowed'
              } ${peg.colorClass}`}
              id={`board-animal-select-${peg.id}`}
            >
              <span className="text-3xl leading-none">{peg.emoji}</span>
              <span className="text-[10px] font-extrabold text-purple-950 mt-1">
                {peg.name}
              </span>
            </button>
          ))}
        </div>

        {/* Submit Attempt Button or Inactive indicator */}
        {isActive ? (
          <button
            onClick={handleSubmit}
            disabled={totalPlaced < 4}
            className={`w-full py-3.5 rounded-2xl font-black text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              totalPlaced < 4
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white border-b-4 border-rose-500 active:scale-95'
            }`}
            id="submit-guess-btn"
          >
            <Send size={16} />
            <span>Valider mon estimation ! ✨</span>
          </button>
        ) : (
          <div
            className="w-full py-3.5 rounded-2xl font-black text-sm bg-indigo-50 border border-indigo-150 text-indigo-505 flex items-center justify-center gap-2 border-indigo-150 animate-pulse text-indigo-505"
            style={{ color: '#4338ca', borderColor: '#e0e7ff', background: '#f5f3ff' }}
          >
            <span>⏳ C'est au tour de {opponentName || 'l\'autre joueur'}...</span>
          </div>
        )}
      </div>
    </div>
  );
}
