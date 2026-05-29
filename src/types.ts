/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AnimalPeg {
  id: string;
  emoji: string;
  name: string;
  fullName: string;
  colorClass: string;       // BG pastel
  activeColorClass: string; // active state ring/bg colors
  badgeColorClass: string;  // small clue/subtext pill background
  textClass: string;        // text color
  pastelHex: string;        // primary hex
}

export type GameMode = 'menu' | 'solo_setup' | 'duo_setup' | 'duo_setup_p1' | 'duo_setup_p2' | 'playing' | 'game_over';

export interface GuessRow {
  guess: (AnimalPeg | null)[];
  clues: ClueType[]; // List of clues (e.g., 'correct', 'present', 'empty')
}

export type ClueType = 'correct' | 'present' | 'empty';

export type MascotExpression = 'happy' | 'thinking' | 'shocked' | 'sad' | 'victory' | 'wave';

export interface MascotSpeech {
  expression: MascotExpression;
  text: string;
}

