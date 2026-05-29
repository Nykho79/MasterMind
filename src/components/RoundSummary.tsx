/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Trophy, RefreshCw, Star, Heart, Flame } from 'lucide-react';
import { AnimalPeg } from '../types';
import { playConfirm, playErase } from '../utils/audio';

interface RoundSummaryProps {
  winner: 'creator' | 'decoder' | 'solo_player' | 'solo_cpu' | 'tie' | 'none' | null;
  playType: 'solo' | 'duo';
  creatorName: string;
  decoderName: string;
  secretCode: AnimalPeg[];
  attempts: number;
  scores: {
    creator: number;
    decoder: number;
    soloPlayer: number;
    soloCpu: number;
  };
  onNextRound: (swapRoles: boolean) => void;
  onResetGame: () => void;
}

export default function RoundSummary({
  winner,
  playType,
  creatorName,
  decoderName,
  secretCode,
  attempts,
  scores,
  onNextRound,
  onResetGame,
}: RoundSummaryProps) {
  const isDecoderWin = winner === 'decoder' || winner === 'solo_player' || winner === 'tie';
  
  // Custom interactive confetti sparks simulation
  const confettiSparks = Array.from({ length: 40 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-pink-950/45 backdrop-blur-md"
        id="round-summary-backdrop"
      />

      {/* Confetti celebration shower background */}
      {isDecoderWin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {confettiSparks.map((_, i) => {
            const size = Math.random() * 8 + 6;
            const colors = ['#FFC0CB', '#FFE4B5', '#A3E4D7', '#FCF3CF', '#D7BDE2', '#EDBB99', '#FF8BA4'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const startX = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = Math.random() * 3 + 2.5;

            return (
              <motion.div
                key={i}
                initial={{
                  position: 'absolute',
                  top: '-5%',
                  left: `${startX}%`,
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '20%',
                  rotate: 0,
                  opacity: 0.9,
                }}
                animate={{
                  top: '105%',
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: 0.3,
                }}
                transition={{
                  duration: duration,
                  delay: delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Alert Card Box */}
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 280 }}
        className="relative w-full max-w-md bg-white border-4 border-pink-300 rounded-3xl p-6 md:p-8 text-center shadow-2xl z-20 overflow-hidden select-none"
        id="summary-dialog"
      >
        {/* Decorative pastel bubbles on corners */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-pink-100 rounded-full opacity-60"></div>
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-amber-100 rounded-full opacity-60"></div>

        {/* Big visual Trophy or Sad Cute heart */}
        <div className="flex justify-center mb-4">
          <motion.div
            animate={
              isDecoderWin
                ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }
                : { y: [0, -4, 0] }
            }
            transition={{ repeat: Infinity, duration: 2 }}
            className={`p-4 rounded-full shadow-md ${
              isDecoderWin ? 'bg-yellow-105 text-yellow-500 bg-yellow-100' : 'bg-pink-100 text-pink-500'
            }`}
          >
            {isDecoderWin ? <Trophy size={48} /> : <Heart size={48} fill="currentColor" />}
          </motion.div>
        </div>

        {/* Title Outcome Message */}
        <h2 className="text-3xl font-black text-purple-950 mb-2">
          {winner === 'tie'
            ? 'Égalité Parfaite ! 🏆'
            : winner === 'none'
            ? 'Match Nul ! 🔒'
            : isDecoderWin
            ? 'Code Découvert ! 🎉'
            : 'Code Secret Préservé ! 🔒'}
        </h2>

        {/* Outcome Description */}
        <div className="text-sm font-medium text-purple-900/90 mb-6 max-w-sm mx-auto">
          {playType === 'duo' ? (
            <div>
              {winner === 'tie' ? (
                <p>
                  Extraordinaire ! <span className="font-extrabold text-pink-500">{creatorName}</span> et{' '}
                  <span className="font-extrabold text-indigo-600">{decoderName}</span> ont tous deux déchiffré la formule à la même étape ! ✨ (+1 pt chacun)
                </p>
              ) : winner === 'none' ? (
                <p>
                  Fin de la partie ! Aucun de vous n'a trouvé l'énigme de son adversaire en 10 étapes. Vos compagnons kawaii ont bien défendu vos formules ! 😉
                </p>
              ) : winner === 'creator' ? (
                <p>
                  Victoire de <span className="font-extrabold text-pink-500">{creatorName}</span> ! 👑 Il a réussi à décoder la combinaison en moins d'essais, ou son secret est resté invaincu ! (+2 pts)
                </p>
              ) : (
                <p>
                  Victoire de <span className="font-extrabold text-indigo-600">{decoderName}</span> ! 👑 Il a découvert le secret plus rapidement ! (+2 pts)
                </p>
              )}
            </div>
          ) : (
            <div>
              {isDecoderWin ? (
                <p>
                  Merveilleux ! Tu as déchiffré le code mystère de Momo en{' '}
                  <span className="font-extrabold text-purple-950 text-lg">{attempts} essais</span> ! ✨ Momo est fier de toi ! (+2 pts)
                </p>
              ) : (
                <p>
                  Ah... Momo a réussi à garder son secret cette fois-ci ! Ne sois pas triste, tu feras encore mieux la prochaine fois ! 💖 (+3 pts pour Momo)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Revealed Code Section */}
        <div className="bg-pink-50/70 border-2 border-dashed border-pink-200 rounded-2xl p-4 mb-6">
          <span className="text-[10px] font-black uppercase text-pink-600 tracking-wider block mb-2">
            La combinaison secrète était :
          </span>
          <div className="flex justify-center gap-2.5">
            {secretCode.map((peg, index) => (
              <div
                key={index}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border shadow-sm ${peg.colorClass}`}
                id={`revealed-code-slot-${index}`}
              >
                <span className="text-2xl leading-none">{peg.emoji}</span>
                <span className="text-[8px] font-black text-purple-950 leading-none mt-0.5">
                  {peg.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Scoreboard Card */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5">
          {playType === 'duo' ? (
            <>
              {/* Creator score */}
              <div className="text-center">
                <span className="text-[10px] font-extrabold tracking-wider text-purple-800 uppercase block">
                  👑 {creatorName} (Créateur)
                </span>
                <span className="text-2xl font-black text-pink-500">
                  {scores.creator} <span className="text-xs text-purple-800">pts</span>
                </span>
              </div>
              {/* Decoder score */}
              <div className="border-l border-slate-200 text-center">
                <span className="text-[10px] font-extrabold tracking-wider text-purple-800 uppercase block">
                  🔎 {decoderName} (Décodeur)
                </span>
                <span className="text-2xl font-black text-purple-950">
                  {scores.decoder} <span className="text-xs text-purple-800">pts</span>
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Solo Player score */}
              <div className="text-center">
                <span className="text-[10px] font-extrabold tracking-wider text-purple-800 uppercase block">
                  ⭐️ Joueur (Toi)
                </span>
                <span className="text-2xl font-black text-pink-500">
                  {scores.soloPlayer} <span className="text-xs text-purple-800">pts</span>
                </span>
              </div>
              {/* CPU Momo score */}
              <div className="border-l border-slate-200 text-center">
                <span className="text-[10px] font-extrabold tracking-wider text-purple-800 uppercase block">
                  🐹 Momo (CPU)
                </span>
                <span className="text-2xl font-black text-purple-950">
                  {scores.soloCpu} <span className="text-xs text-purple-800">pts</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Button Options */}
        <div className="flex flex-col gap-3">
          {playType === 'duo' ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Swap Roles & Continue */}
              <button
                onClick={() => {
                  playConfirm();
                  onNextRound(true);
                }}
                className="py-3 px-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm rounded-2xl shadow-md border-b-4 border-rose-500 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                id="swap-roles-btn"
              >
                <RefreshCw size={14} />
                <span>Inverser Rôles</span>
              </button>

              {/* Option 2: Keep current Roles & Continue */}
              <button
                onClick={() => {
                  playConfirm();
                  onNextRound(false);
                }}
                className="py-3 px-4 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200 font-extrabold text-sm rounded-2xl shadow-sm active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                id="keep-roles-btn"
              >
                <Star size={14} className="fill-purple-300 text-purple-600" />
                <span>Même Rôles</span>
              </button>
            </div>
          ) : (
            // Solo Mode Continue Button
            <button
              onClick={() => {
                playConfirm();
                onNextRound(false);
              }}
              className="w-full py-4.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black text-base rounded-2xl shadow-md border-b-4 border-rose-500 active:scale-95 cursor-pointer"
              id="solo-next-round-btn"
            >
              Rejouer avec Momo ! 🌸
            </button>
          )}

          {/* Reset Full Game Button */}
          <button
            onClick={() => {
              playErase();
              onResetGame();
            }}
            className="text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest mt-2 hover:underline cursor-pointer"
            id="reset-scores-btn"
          >
            Réinitialiser les scores et menu principal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
