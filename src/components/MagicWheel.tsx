/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, Gift, AlertTriangle, Play, RefreshCw, X } from 'lucide-react';

export interface WheelOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  type: 'bonus' | 'malus' | 'chaos';
}

export const WHEEL_OPTIONS: WheelOption[] = [
  {
    id: 'give_hint',
    label: 'Indice Magique',
    emoji: '🦁',
    color: '#FFE4E6', // pastel pink
    description: 'Momo te révèle un des animaux présents dans le code secret de ton adversaire !',
    type: 'bonus',
  },
  {
    id: 'add_attempt',
    label: 'Coup Gagnant',
    emoji: '➕',
    color: '#E0F2FE', // pastel blue
    description: 'Une ligne de tentative supplémentaire est ajoutée sur ton plateau de jeu !',
    type: 'bonus',
  },
  {
    id: 'sabotage_opponent',
    label: 'Piège de Glace',
    emoji: '❄️',
    color: '#F3E8FF', // pastel purple
    description: "Tu bloques et supprimes l'un des essais maximum de ton adversaire !",
    type: 'bonus',
  },
  {
    id: 'lose_attempt',
    label: 'Sablier Brisé',
    emoji: '⏳',
    color: '#FEE2E2', // pastel red
    description: 'Aïe ! Tu perds instantanément l\'une de tes précieuses tentatives !',
    type: 'malus',
  },
  {
    id: 'mutate_opponent_code',
    label: 'Formule Altérée',
    emoji: '🌀',
    color: '#FEF3C7', // pastel yellow
    description: 'La combinaison secrète de ton adversaire mute ! L\'un de ses animaux change !',
    type: 'chaos',
  },
  {
    id: 'mutate_own_code',
    label: 'Brouillage',
    emoji: '🎭',
    color: '#E0F8F5', // pastel teal
    description: 'Ton propre code secret mute, brouillant ainsi toutes les pistes de ton adversaire !',
    type: 'chaos',
  },
];

interface MagicWheelProps {
  playerName: string;
  onSpinComplete: (option: WheelOption) => void;
  onClose: () => void;
  isRotated?: boolean;
}

export default function MagicWheel({ playerName, onSpinComplete, onClose, isRotated = false }: MagicWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState<WheelOption | null>(null);

  const startSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedOption(null);

    // Play a rising play sound using Web Audio API for a perfect instant retro sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Make sound ticks as it spins
      let tickCount = 0;
      const interval = setInterval(() => {
        if (tickCount > 25) {
          clearInterval(interval);
          return;
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(300 + tickCount * 25, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
        tickCount++;
      }, 100);
    } catch (e) {
      console.log('Audio Context skipped');
    }

    // Pick a random index
    const randomIndex = Math.floor(Math.random() * WHEEL_OPTIONS.length);
    const chosen = WHEEL_OPTIONS[randomIndex];

    // Compute rotation angles
    // Each slice is 60 degrees.
    // Index 0: 0-60, Index 1: 60-120...
    const degreesPerSlice = 360 / WHEEL_OPTIONS.length;
    
    // We want the wheel rotation to align the slice to the TOP pointer (which is 90 degrees offset)
    // Formula to center-point the chosen wedge:
    const targetWedgeAngle = (randomIndex * degreesPerSlice) + (degreesPerSlice / 2);
    // Extra full spins + offset to land accurately
    const extraSpins = 5 * 360; 
    const finalRotation = extraSpins + (360 - targetWedgeAngle);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedOption(chosen);

      // Play victory, warning, or chaos custom sounds
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (chosen.type === 'bonus') {
          // Bright, uplifting chime/arpeggio cascade of notes: C5 -> E5 -> G5 -> C6
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            setTimeout(() => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
              
              gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
              
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            }, idx * 100);
          });
        } else if (chosen.type === 'malus') {
          // Low, descending buzz/alarm failure effect for negative outcomes: 330Hz sliding downwards to 90Hz
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain1 = audioCtx.createGain();
          const gain2 = audioCtx.createGain();
          
          osc1.type = 'sawtooth';
          osc2.type = 'triangle';
          
          osc1.frequency.setValueAtTime(330, audioCtx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.65);
          
          osc2.frequency.setValueAtTime(325, audioCtx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(85, audioCtx.currentTime + 0.65);
          
          gain1.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
          
          gain2.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
          
          osc1.connect(gain1);
          gain1.connect(audioCtx.destination);
          
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          
          osc1.start();
          osc2.start();
          osc1.stop(audioCtx.currentTime + 0.7);
          osc2.stop(audioCtx.currentTime + 0.7);
        } else {
          // Alien/Sci-fi cosmic portal modulation for neutral/chaos effects (mutate combinations)
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          
          osc.frequency.setValueAtTime(220, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(580, audioCtx.currentTime + 0.25);
          osc.frequency.linearRampToValueAtTime(320, audioCtx.currentTime + 0.5);
          
          gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.6);
        }
      } catch (e) {
        console.log('Audio feedback context failed', e);
      }
    }, 3000);
  };

  const handleApplyResult = () => {
    if (selectedOption) {
      onSpinComplete(selectedOption);
    }
  };

  return (
    <div className="fixed inset-0 bg-purple-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" id="magic-wheel-modal-overlay">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-white rounded-3xl border-4 border-pink-300 w-full max-w-md p-6 shadow-2xl relative flex flex-col items-center gap-6 transition-all duration-300 ${
          isRotated ? 'rotate-180 transform' : ''
        }`}
        id="magic-wheel-card"
      >
        {/* Close Button only if not spinning or resolved */}
        {!isSpinning && !selectedOption && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
            id="wheel-close-btn"
          >
            <X size={16} />
          </button>
        )}

        <div className="text-center">
          <h2 className="text-xl font-black text-purple-950 flex items-center justify-center gap-1.5 uppercase tracking-wide">
            🎰 Roue du Destin Kawaii 🌸
          </h2>
          <p className="text-xs text-purple-800/80 font-bold mt-1">
            À toi l'honneur, <span className="text-pink-600 font-extrabold">{playerName}</span> ! Tourne la roue à tes risques et périls...
          </p>
        </div>

        {/* Dynamic wheel display area */}
        <div className="relative w-72 h-72 flex items-center justify-center select-none" id="visual-wheel-wrapper">
          
          {/* Top Pointer */}
          <div className="absolute top-[-8px] z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-pink-500 filter drop-shadow"></div>
            <div className="w-2.5 h-2.5 bg-pink-600 rounded-full -mt-2.5 z-40 border border-white"></div>
          </div>

          {/* Outer Border ring */}
          <div className="absolute inset-0 rounded-full border-[8px] border-pink-100 shadow-inner pointer-events-none z-10"></div>
          
          {/* Glowing Wheel Rim with lights */}
          <div className="absolute inset-1.5 rounded-full border-4 border-purple-200/40 pointer-events-none"></div>

          {/* Rotating Wheel Canvas */}
          <motion.div
            style={{ originX: '50%', originY: '50%' }}
            animate={{ rotate: rotation }}
            transition={isSpinning ? { duration: 3, ease: [0.1, 0.8, 0.2, 1] } : { duration: 0 }}
            className="w-full h-full rounded-full relative overflow-hidden shadow-lg border-2 border-purple-100"
            id="spinning-wheel-circle"
          >
            {/* Draw Wedges */}
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {WHEEL_OPTIONS.map((opt, idx) => {
                const angle = 60 * idx;
                const radStart = (angle * Math.PI) / 180;
                const radEnd = ((angle + 60) * Math.PI) / 180;
                const x1 = 100 + 100 * Math.cos(radStart);
                const y1 = 100 + 100 * Math.sin(radStart);
                const x2 = 100 + 100 * Math.cos(radEnd);
                const y2 = 100 + 100 * Math.sin(radEnd);

                return (
                  <path
                    key={opt.id}
                    d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                    fill={opt.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>

            {/* Wedge Emojis Overlay */}
            {WHEEL_OPTIONS.map((opt, idx) => {
              const angle = 60 * idx + 30; // Center angle of the slice
              // Since the SVG has a -90 degree rotation (transform -rotate-90), we align rad as well
              const rad = ((angle - 90) * Math.PI) / 180;
              const radius = 62; // Beautifully distance emojis from center
              const tx = 100 + radius * Math.cos(rad);
              const ty = 100 + radius * Math.sin(rad);

              return (
                <div
                  key={opt.id}
                  style={{
                    position: 'absolute',
                    left: `${tx / 2}%`,
                    top: `${ty / 2}%`,
                    // We rotate each slice's text dynamically so it points outwards elegantly
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                  className="flex flex-col items-center justify-center text-center select-none w-16"
                >
                  <span className="text-3xl filter drop-shadow hover:scale-110 transition-transform duration-200">
                    {opt.emoji}
                  </span>
                  <span className="text-[7.5px] font-black leading-none text-purple-900 mt-1 uppercase tracking-tighter bg-white/70 px-1 py-0.5 rounded border border-purple-100">
                    {opt.label}
                  </span>
                </div>
              );
            })}

            {/* Hub (Center circle pin) */}
            <div className="absolute top-[38%] left-[38%] w-[24%] h-[24%] bg-white rounded-full border-4 border-pink-300 shadow-md flex items-center justify-center z-20">
              <span className="text-sm">🌸</span>
            </div>
          </motion.div>
        </div>

        {/* Action button / Result display */}
        <AnimatePresence mode="wait">
          {!selectedOption ? (
            <motion.div
              key="spin-trigger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full text-center"
            >
              <button
                disabled={isSpinning}
                onClick={startSpin}
                className={`w-full py-4 rounded-2xl text-white font-black text-base shadow-lg tracking-wider transition-all flex items-center justify-center gap-2 border-b-4 border-rose-600 ${
                  isSpinning
                    ? 'bg-slate-300 text-slate-500 border-b-2 cursor-wait'
                    : 'bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 hover:scale-102 active:scale-95'
                }`}
                id="spin-wheel-starter-btn"
              >
                <Sparkles size={18} className="animate-spin-slow" />
                <span>{isSpinning ? 'SPINNING...' : 'LANCER LA ROUE ! 🎲'}</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="result-display"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full flex flex-col items-center p-4 rounded-2xl border-2 text-center"
              style={{
                borderColor: selectedOption.type === 'bonus' ? '#bbf7d0' : selectedOption.type === 'malus' ? '#fecaca' : '#fef3c7',
                backgroundColor: selectedOption.type === 'bonus' ? '#f0fdf4' : selectedOption.type === 'malus' ? '#fef2f2' : '#fffbeb',
              }}
              id="wheel-resolution"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-3xl filter drop-shadow">{selectedOption.emoji}</span>
                <span
                  className="font-black text-base uppercase tracking-normal"
                  style={{
                    color: selectedOption.type === 'bonus' ? '#15803d' : selectedOption.type === 'malus' ? '#b91c1c' : '#b45309',
                  }}
                >
                  {selectedOption.label}
                </span>
              </div>
              
              <p className="text-xs font-bold text-slate-700 mt-2 leading-relaxed">
                {selectedOption.description}
              </p>

              <button
                onClick={handleApplyResult}
                className="w-full mt-4 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                id="apply-wheel-results-btn"
              >
                Super, valide l'effet ! 👍
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
