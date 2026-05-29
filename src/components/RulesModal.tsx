/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Star, Heart, Cloud } from 'lucide-react';
import { playConfirm, playErase } from '../utils/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const handleClose = () => {
    playErase();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-pink-900/40 backdrop-blur-md"
            id="rules-backdrop"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-pink-50/95 border-4 border-pink-300 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[85vh] select-none text-purple-900 font-sans"
            id="rules-container"
          >
            {/* Corner Tape Deco */}
            <div className="absolute top-0 left-12 w-16 h-6 bg-pink-200/50 -rotate-12 transform -translate-y-2 border-b border-pink-300"></div>
            <div className="absolute top-2 right-12 w-16 h-6 bg-pink-200/50 rotate-6 transform -translate-y-2 border-b border-pink-300"></div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-pink-200 hover:bg-pink-300 text-pink-700 hover:text-pink-900 rounded-full transition-colors duration-200"
              aria-label="Fermer"
              id="rules-close-btn"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b-2 border-dashed border-pink-200 pb-4">
              <div className="p-3 bg-pink-200 rounded-2xl text-pink-600">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-pink-600">
                  Comment jouer ? 🌸
                </h2>
                <p className="text-xs text-pink-500 font-bold uppercase tracking-wider">
                  Le secret de Mastermind Kawaii
                </p>
              </div>
            </div>

            {/* Rules Text / Cartoon Layout */}
            <div className="space-y-6 text-sm md:text-base leading-relaxed">
              <p className="font-medium text-purple-900">
                Bienvenue dans le <span className="font-extrabold text-pink-500">Mastermind Kawaii</span> !
                Le but du jeu est de décoder une combinaison secrète de <span className="font-extrabold text-pink-500">4 adorables animaux</span> choisis parmi 8 espèces disponibles.
              </p>

              {/* Roles Section */}
              <div className="bg-white/80 rounded-2xl p-4 border-2 border-pink-100 shadow-sm">
                <h3 className="flex items-center gap-2 font-black text-pink-600 mb-2">
                  <span>🎭</span> Deux Rôles Excitants :
                </h3>
                <ul className="space-y-2 text-sm text-purple-950 font-medium">
                  <li>
                    🌸 <strong className="text-pink-600">Le Créateur :</strong> Choisit la combinaison mystère en secret. (En mode Solo, c'est l'ordinateur Momo qui la crée !)
                  </li>
                  <li>
                    🔎 <strong className="text-pink-600">Le Décodeur :</strong> Dispose de <span className="font-black text-pink-500">10 essais</span> pour déchiffrer la combinaison mystère.
                  </li>
                </ul>
              </div>

              {/* Feedback Clues Section */}
              <div className="space-y-3">
                <h3 className="font-black text-pink-600 flex items-center gap-2">
                  <span>✨</span> Comprendre les indices de Momo :
                </h3>
                <p className="text-sm">
                  À chaque ligne d'essai validée, Momo le Hamster vous donne de précieux indices sous forme de petits symboles magiques :
                </p>

                {/* Clue badges list */}
                <div className="grid grid-cols-1 gap-3 text-sm font-medium">
                  {/* Correct Clue */}
                  <div className="flex items-center gap-3 p-3 bg-green-50/80 rounded-xl border border-green-200">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                      <Star size={18} fill="currentColor" />
                    </div>
                    <div>
                      <span className="font-bold text-green-700">Étoile d'Or (Correct) :</span>
                      <p className="text-xs text-green-600/90">Un animal est parfait : bonne espèce ET bon emplacement !</p>
                    </div>
                  </div>

                  {/* Present Clue */}
                  <div className="flex items-center gap-3 p-3 bg-pink-50/80 rounded-xl border border-pink-200">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shadow-sm">
                      <Heart size={18} fill="currentColor" />
                    </div>
                    <div>
                      <span className="font-bold text-pink-700">Cœur Scintillant (Présent) :</span>
                      <p className="text-xs text-pink-600/90">L'animal est correct, mais positionné au MAUVAIS endroit.</p>
                    </div>
                  </div>

                  {/* Empty Clue */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-sm">
                      <Cloud size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Nuage Vide (Inconnu) :</span>
                      <p className="text-xs text-slate-500/90">La position reste vide si certains animaux ne figurent pas du tout dans la combinaison secrète.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Golden Tip */}
              <div className="bg-yellow-50/60 rounded-2xl p-4 border border-yellow-200 text-xs shadow-sm">
                <p className="font-bold text-yellow-800">
                  💡 Astuce Kawaii :
                </p>
                <p className="text-yellow-700/90 mt-1 font-medium leading-relaxed">
                  L'ordre des indices (Étoiles, Cœurs, Nuages) est toujours aléatoire ou trié ! Il n'indique PAS à quel animal précis correspond l'indice. C'est à vous de déduire !
                </p>
              </div>
            </div>

            {/* Play Button */}
            <div className="mt-8 border-t-2 border-dashed border-pink-200 pt-6 flex justify-end">
              <button
                onClick={() => {
                  playConfirm();
                  onClose();
                }}
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 text-sm md:text-base cursor-pointer"
                id="rules-continue-btn"
              >
                C'est parti ! ✨ Ready !
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
