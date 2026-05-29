/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { MascotSpeech, MascotExpression } from '../types';

interface MascotTalkProps {
  speech: MascotSpeech;
  className?: string;
}

export default function MascotTalk({ speech, className = '' }: MascotTalkProps) {
  const getAvatarSVG = (expr: MascotExpression) => {
    // Sharp but extremely cute Hamster SVG design with customizable expressions
    return (
      <svg
        width="110"
        height="110"
        viewBox="0 0 100 100"
        className="drop-shadow-md select-none"
      >
        {/* Ears */}
        {/* Left Ear */}
        <path
          d="M 22 25 C 12 18, 12 40, 24 35"
          fill="#FFB7C5"
          stroke="#E598A4"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path d="M 22 25 C 16 22, 16 34, 23 32" fill="#FFA3B1" />

        {/* Right Ear */}
        <path
          d="M 78 25 C 88 18, 88 40, 76 35"
          fill="#FFB7C5"
          stroke="#E598A4"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path d="M 78 25 C 84 22, 84 34, 77 32" fill="#FFA3B1" />

        {/* Body Base (Chubby white/peach circles) */}
        <circle cx="50" cy="58" r="34" fill="#FFFFFF" stroke="#E598A4" strokeWidth="4" />
        {/* Cheeks patch */}
        <path
          d="M 20 62 C 22 45, 78 45, 80 62 C 78 82, 22 82, 20 62 Z"
          fill="#FFF4F2"
        />

        {/* Dynamic Arms */}
        {expr === 'wave' ? (
          // One arm up waving, other resting
          <>
            {/* Waving Arm */}
            <motion.path
              d="M 18 56 C 5 50, 4 40, 15 45"
              fill="#FFFFFF"
              stroke="#E598A4"
              strokeWidth="3.5"
              animate={{ rotate: [0, -15, 10, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ originX: "18px", originY: "56px" }}
            />
            {/* Right Arm */}
            <path d="M 82 56 C 92 60, 95 68, 85 68" fill="#FFFFFF" stroke="#E598A4" strokeWidth="3.5" />
          </>
        ) : expr === 'victory' ? (
          // Both arms up in the air!
          <>
            <motion.path
              d="M 18 52 C 8 42, 6 36, 16 40"
              fill="#FFFFFF"
              stroke="#E598A4"
              strokeWidth="3.5"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            />
            <motion.path
              d="M 82 52 C 92 42, 94 36, 84 40"
              fill="#FFFFFF"
              stroke="#E598A4"
              strokeWidth="3.5"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
            />
          </>
        ) : expr === 'thinking' ? (
          // One paw pointing at cheek
          <>
            <path d="M 25 68 C 30 63, 35 60, 40 68" fill="#FFFFFF" stroke="#E598A4" strokeWidth="3.5" />
            <path d="M 82 56 C 92 60, 95 68, 85 68" fill="#FFFFFF" stroke="#E598A4" strokeWidth="3.5" />
          </>
        ) : (
          // Standard cute resting paws
          <>
            <path d="M 24 64 C 14 68, 12 76, 22 76" fill="#FFFFFF" stroke="#E598A4" strokeWidth="3.5" />
            <path d="M 76 64 C 86 68, 88 76, 78 76" fill="#FFFFFF" stroke="#E598A4" strokeWidth="3.5" />
          </>
        )}

        {/* Eyes based on expressions */}
        {expr === 'happy' || expr === 'wave' ? (
          // Curved laughing eyes (^^)
          <>
            <path d="M 34 48 Q 40 40 44 48" fill="none" stroke="#684A4E" strokeWidth="4" strokeLinecap="round" />
            <path d="M 56 48 Q 60 40 66 48" fill="none" stroke="#684A4E" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : expr === 'victory' ? (
          // Excited stars
          <>
            <path d="M 32 46 L 40 46 M 36 42 L 36 50 M 34 44 L 38 48 M 38 44 L 34 48" stroke="#FF5E7E" strokeWidth="3" strokeLinecap="round" />
            <path d="M 60 46 L 68 46 M 64 42 L 64 50 M 62 44 L 66 48 M 66 44 L 62 48" stroke="#FF5E7E" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : expr === 'shocked' ? (
          // Big surprise circles
          <>
            <circle cx="38" cy="46" r="5" fill="#684A4E" />
            <circle cx="62" cy="46" r="5" fill="#684A4E" />
          </>
        ) : expr === 'sad' ? (
          // Crying downcast eyes (TT)
          <>
            <path d="M 32 44 L 42 44 M 37 44 L 37 50" fill="none" stroke="#684A4E" strokeWidth="4" strokeLinecap="round" />
            <path d="M 58 44 L 68 44 M 63 44 L 63 50" fill="none" stroke="#684A4E" strokeWidth="4" strokeLinecap="round" />
            {/* Tear */}
            <circle cx="31" cy="53" r="3.5" fill="#8CE1FF" />
            <path d="M 31 49 L 27.5 53 C 28 55, 34 55, 34.5 53 Z" fill="#8CE1FF" />
          </>
        ) : (
          // Thinking/Normal: Cute glistening black circles
          <>
            <circle cx="38" cy="46" r="4.5" fill="#684A4E" />
            <circle cx="36" cy="44" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="46" r="4.5" fill="#684A4E" />
            <circle cx="60" cy="44" r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy blush cheeks (always cute) */}
        <circle cx="28" cy="54" r="6" fill="#FFA3B1" opacity="0.65" />
        <circle cx="72" cy="54" r="6" fill="#FFA3B1" opacity="0.65" />
        {/* Extra cute blush stripes */}
        <path d="M 26 54 L 30 50 M 29 55 L 33 51" stroke="#FF6E85" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 70 54 L 74 50 M 73 55 L 77 51" stroke="#FF6E85" strokeWidth="1.5" strokeLinecap="round" />

        {/* Mouth and Nose */}
        {/* Tiny pink triangle nose */}
        <polygon points="48,49 52,49 50,51" fill="#FF8BA4" />
        {expr === 'happy' || expr === 'victory' || expr === 'wave' ? (
          // Wide open happy smile
          <path d="M 46 54 Q 50 63 54 54 Z" fill="#FF5E7E" stroke="#684A4E" strokeWidth="2.5" strokeLinejoin="round" />
        ) : expr === 'sad' ? (
          // Downward tiny frown mouth
          <path d="M 45 57 Q 50 52 55 57" fill="none" stroke="#684A4E" strokeWidth="3.5" strokeLinecap="round" />
        ) : expr === 'shocked' ? (
          // Round open mouth surprise
          <circle cx="50" cy="56" r="4.5" fill="#FF8B94" stroke="#684A4E" strokeWidth="2.5" />
        ) : (
          // Cute double w-shape cat mouth
          <path d="M 44 54 Q 47 57 50 54 Q 53 57 56 54" fill="none" stroke="#684A4E" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Cute whiskers */}
        <path d="M 16 50 L 8 49 M 15 54 L 6 55" stroke="#E598A4" strokeWidth="2" strokeLinecap="round" />
        <path d="M 84 50 L 92 49 M 85 54 L 94 55" stroke="#E598A4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className={`flex items-start gap-4 p-4 bg-white/70 backdrop-blur-md rounded-3xl border-2 border-pink-200/60 shadow-md ${className}`}>
      {/* Animated cute mascot */}
      <motion.div
        animate={{
          y: speech.expression === 'happy' ? [0, -6, 0] : speech.expression === 'victory' ? [0, -8, 0, -8, 0] : [0, -2, 0],
        }}
        transition={{
          repeat: speech.expression === 'happy' || speech.expression === 'victory' ? undefined : Infinity,
          duration: speech.expression === 'victory' ? 0.8 : 2.5,
          ease: 'easeInOut',
        }}
        className="flex-shrink-0 cursor-pointer"
      >
        {getAvatarSVG(speech.expression)}
      </motion.div>

      {/* Bubble Speech */}
      <div className="relative flex-1 bg-white p-3 md:p-4 rounded-2xl border-2 border-pink-100/80 text-gray-700 text-sm md:text-base selection:bg-pink-200 shadow-sm">
        {/* Tail */}
        <div className="absolute top-6 -left-2.5 w-5 h-5 bg-white border-l-2 border-b-2 border-pink-100/80 rotate-45 rounded-sm"></div>
        
        {/* Text */}
        <div className="font-sans font-medium text-purple-950 leading-relaxed">
          <span className="font-bold text-pink-500 font-sans block mb-0.5 text-xs tracking-wider uppercase">
            {speech.expression === 'victory' ? '✨ Momo l\'as ! ✨' : '🌸 Momo 🌸'}
          </span>
          {speech.text}
        </div>
      </div>
    </div>
  );
}
