/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Star, Heart, User, Users, Play, Sparkles, RefreshCw, Lock, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react';

import { AnimalPeg, GameMode, GuessRow, ClueType, MascotSpeech } from './types';
import { ANIMAL_PEGS } from './constants';
import { playConfirm, playErase, playWinMelody, playLoseMelody, playLockSecret, playWarning, playBubble } from './utils/audio';

import MascotTalk from './components/MascotTalk';
import RulesModal from './components/RulesModal';
import SoundToggle from './components/SoundToggle';
import CodeSetter from './components/CodeSetter';
import GameBoard from './components/GameBoard';
import RoundSummary from './components/RoundSummary';
import MagicWheel, { WheelOption } from './components/MagicWheel';
import CelebrationCanvas from './components/CelebrationCanvas';

export default function App() {
  // Common configurations
  const [mode, setMode] = useState<GameMode>('menu');
  const [playType, setPlayType] = useState<'solo' | 'duo'>('solo');
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(true);
  
  // Custom names
  const [player1Name, setPlayer1Name] = useState<string>('Joueur 1');
  const [player2Name, setPlayer2Name] = useState<string>('Joueur 2');
  const [soloPlayerName, setSoloPlayerName] = useState<string>('Benoît');

  // Solo mode secret and attempts
  const [soloSecretCode, setSoloSecretCode] = useState<AnimalPeg[]>([]);
  const [soloGuesses, setSoloGuesses] = useState<GuessRow[]>([]);
  const [soloCurrentGuessIndex, setSoloCurrentGuessIndex] = useState<number>(0);

  // Duo mode secrets and attempts
  // Player 1 creates secretP1. Player 2 tries to guess secretP1!
  // Player 2 creates secretP2. Player 1 tries to guess secretP2!
  const [secretCodeP1, setSecretCodeP1] = useState<AnimalPeg[]>([]);
  const [secretCodeP2, setSecretCodeP2] = useState<AnimalPeg[]>([]);
  
  const [guessesP1, setGuessesP1] = useState<GuessRow[]>([]); // Player 1's guesses of P2's secret
  const [guessesP2, setGuessesP2] = useState<GuessRow[]>([]); // Player 2's guesses of P1's secret
  
  const [currentGuessIndexP1, setCurrentGuessIndexP1] = useState<number>(0);
  const [currentGuessIndexP2, setCurrentGuessIndexP2] = useState<number>(0);

  // Game tracking
  const [activePlayer, setActivePlayer] = useState<'P1' | 'P2'>('P1');
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(0); // 0 to 9 representing the turn index
  const [status, setStatus] = useState<'setup' | 'playing' | 'round_completed'>('setup');
  
  // Solved states
  const [p1SolvedRound, setP1SolvedRound] = useState<number | null>(null);
  const [p2SolvedRound, setP2SolvedRound] = useState<number | null>(null);

  // Tablet pass-and-play overlays to keep code secret
  const [tabletPassingTo, setTabletPassingTo] = useState<'P1' | 'P2' | null>(null);
  const [passReason, setPassReason] = useState<string>('');

  // Wheel-of-fortune and match modifiers states
  const [maxAttemptsP1, setMaxAttemptsP1] = useState<number>(10);
  const [maxAttemptsP2, setMaxAttemptsP2] = useState<number>(10);
  const [revealedAnimalsP1, setRevealedAnimalsP1] = useState<AnimalPeg[]>([]);
  const [revealedAnimalsP2, setRevealedAnimalsP2] = useState<AnimalPeg[]>([]);
  const [p1SpunThisRound, setP1SpunThisRound] = useState<boolean>(false);
  const [p2SpunThisRound, setP2SpunThisRound] = useState<boolean>(false);
  const [p1SpinsLeft, setP1SpinsLeft] = useState<number>(3);
  const [p2SpinsLeft, setP2SpinsLeft] = useState<number>(3);
  const [activeWheelPlayer, setActiveWheelPlayer] = useState<'P1' | 'P2' | null>(null);
  const [layoutMode, setLayoutMode] = useState<'side-by-side' | 'face-to-face'>('side-by-side');

  // Scores state
  const [scores, setScores] = useState({
    creator: 0, // Player 1
    decoder: 0, // Player 2
    soloPlayer: 0,
    soloCpu: 0,
  });

  const [roundWinner, setRoundWinner] = useState<'creator' | 'decoder' | 'solo_player' | 'solo_cpu' | 'tie' | 'none' | null>(null);

  // UI modes
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [mascotSpeech, setMascotSpeech] = useState<MascotSpeech>({
    expression: 'wave',
    text: "Coucou ! Je suis Momo le Hamster, ton guide de jeu ultra kawaii ! 💕 Prêt pour une partie de Mastermind ?",
  });

  // Handle main menu comments
  useEffect(() => {
    if (mode === 'menu') {
      setMascotSpeech({
        expression: 'wave',
        text: "Coucou ! Je suis Momo le Hamster ! 💕 Veux-tu jouer en Solo contre moi ou inviter ton ami à un duel sur tablette ?",
      });
    }
  }, [mode]);

  // Mastermind feedback calculator
  const calculateClues = (guess: AnimalPeg[], secret: AnimalPeg[]): ClueType[] => {
    const clues: ClueType[] = [];
    const secretMatched = [false, false, false, false];
    const guessMatched = [false, false, false, false];

    // 1st pass: exact matches
    for (let i = 0; i < 4; i++) {
      if (guess[i].id === secret[i].id) {
        clues.push('correct');
        secretMatched[i] = true;
        guessMatched[i] = true;
      }
    }

    // 2nd pass: partial matches
    for (let i = 0; i < 4; i++) {
      if (guessMatched[i]) continue;
      for (let j = 0; j < 4; j++) {
        if (secretMatched[j]) continue;
        if (guess[i].id === secret[j].id) {
          clues.push('present');
          secretMatched[j] = true;
          guessMatched[i] = true;
          break;
        }
      }
    }

    // Sort clues (correct first, then present, then empty)
    const sortedClues: ClueType[] = [];
    clues.forEach(c => {
      if (c === 'correct') sortedClues.push('correct');
    });
    clues.forEach(c => {
      if (c === 'present') sortedClues.push('present');
    });
    while (sortedClues.length < 4) {
      sortedClues.push('empty');
    }

    return sortedClues;
  };

  // Generate random code for solo CPU
  const generateRandomCode = (allowDupes: boolean): AnimalPeg[] => {
    const code: AnimalPeg[] = [];
    const pool = [...ANIMAL_PEGS];
    for (let i = 0; i < 4; i++) {
      if (allowDupes) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        code.push(pool[randomIndex]);
      } else {
        const randomIndex = Math.floor(Math.random() * pool.length);
        code.push(pool[randomIndex]);
        pool.splice(randomIndex, 1);
      }
    }
    return code;
  };

  // Setup game modes
  const handleStartSetup = () => {
    if (playType === 'solo') {
      setMode('playing');
      setStatus('playing');
      const randomCode = generateRandomCode(allowDuplicates);
      setSoloSecretCode(randomCode);
      setSoloGuesses(Array.from({ length: 10 }, () => ({
        guess: [null, null, null, null],
        clues: ['empty', 'empty', 'empty', 'empty'],
      })));
      setSoloCurrentGuessIndex(0);
      setMascotSpeech({
        expression: 'thinking',
        text: `J'ai scellé ma combinaison secrète de petits copains ! À toi de deviner, ${soloPlayerName} ! 🐹✨`,
      });
    } else {
      // Duo Mode sequence - start with Player 1 choosing secret code
      setMode('duo_setup_p1');
      setStatus('setup');
      setSecretCodeP1([]);
      setSecretCodeP2([]);
      setGuessesP1([]);
      setGuessesP2([]);
      setP1SolvedRound(null);
      setP2SolvedRound(null);
      setCurrentRoundNumber(0);
      setMascotSpeech({
        expression: 'thinking',
        text: `C'est le moment pour ${player1Name} de créer sa combinaison secrète sous les yeux jaloux de ${player2Name} ! 🤫🌸`,
      });
    }
  };

  // When Player 1 locks their code
  const handleP1CodeLocked = (code: AnimalPeg[]) => {
    setSecretCodeP1(code);
    // Transition to Player 2 Setup
    setPassReason(`C'est maintenant au tour de ${player2Name} d'enregistrer sa combinaison secrète ! ${player1Name}, ferme tes petits yeux ! 👀🙈`);
    setTabletPassingTo('P2');
    setMode('duo_setup_p2');
  };

  // When Player 2 locks their code
  const handleP2CodeLocked = (code: AnimalPeg[]) => {
    setSecretCodeP2(code);
    
    // Reset wheel modifiers
    setMaxAttemptsP1(10);
    setMaxAttemptsP2(10);
    setRevealedAnimalsP1([]);
    setRevealedAnimalsP2([]);
    setP1SpunThisRound(false);
    setP2SpunThisRound(false);
    setP1SpinsLeft(3);
    setP2SpinsLeft(3);
    setActiveWheelPlayer(null);

    // Both codes locked! Ready to initialize boards
    setGuessesP1(Array.from({ length: 10 }, () => ({
      guess: [null, null, null, null],
      clues: ['empty', 'empty', 'empty', 'empty'],
    })));
    setGuessesP2(Array.from({ length: 10 }, () => ({
      guess: [null, null, null, null],
      clues: ['empty', 'empty', 'empty', 'empty'],
    })));

    setCurrentGuessIndexP1(0);
    setCurrentGuessIndexP2(0);
    setCurrentRoundNumber(0);
    setP1SolvedRound(null);
    setP2SolvedRound(null);

    // Turn 1 starts with Player 1 proposing code
    setTabletPassingTo(null);
    setActivePlayer('P1');
    setMode('playing');
    setStatus('playing');
    setMascotSpeech({
      expression: 'happy',
      text: `Que le duel commence ! Les deux codes secrets sont verrouillés. ${player1Name}, à toi de faire la première estimation ! 🌸✨`,
    });
  };

  // Submitting guesses in either mode
  const handleGuessSubmit = (submittedGuess: AnimalPeg[]) => {
    if (playType === 'solo') {
      const calculated = calculateClues(submittedGuess, soloSecretCode);
      const updatedGuesses = [...soloGuesses];
      updatedGuesses[soloCurrentGuessIndex] = {
        guess: submittedGuess,
        clues: calculated
      };
      setSoloGuesses(updatedGuesses);

      const isWin = calculated.filter(c => c === 'correct').length === 4;
      if (isWin) {
        playWinMelody();
        setRoundWinner('solo_player');
        setScores(prev => ({ ...prev, soloPlayer: prev.soloPlayer + 2 }));
        setStatus('round_completed');
        setMascotSpeech({
          expression: 'victory',
          text: `Bravo ${soloPlayerName} ! Tu as trouvé ma combinaison en ${soloCurrentGuessIndex + 1} essai(s) ! Tu as gagné un biscuit ! 🍪🌸`,
        });
      } else if (soloCurrentGuessIndex >= 9) {
        playLoseMelody();
        setRoundWinner('solo_cpu');
        setScores(prev => ({ ...prev, soloCpu: prev.soloCpu + 3 }));
        setStatus('round_completed');
        setMascotSpeech({
          expression: 'sad',
          text: `Ah, tu as fait tes 10 propositions ! J'ai gagné, ma combinaison reste secrète ! Mais rejouons vite, d'accord ? 🐹`,
        });
      } else {
        const nextIndex = soloCurrentGuessIndex + 1;
        setSoloCurrentGuessIndex(nextIndex);
        
        const correct = calculated.filter(c => c === 'correct').length;
        const present = calculated.filter(c => c === 'present').length;
        if (correct > 0) {
          setMascotSpeech({
            expression: 'happy',
            text: `Pas mal du tout ! Tu as ${correct} adorable(s) compagnon(s) à la bonne place ! Continue ! 🌸`,
          });
        } else if (present > 0) {
          setMascotSpeech({
            expression: 'thinking',
            text: `Oh ! Tu as déniché ${present} compagnon(s), mais ils aimeraient changer d'emplacement ! ✨`,
          });
        } else {
          setMascotSpeech({
            expression: 'sad',
            text: `Mmmh, aucun animal n'était correct... Essaye d'autres de tes compagnons ! 🐯🐰🐻`,
          });
        }
      }
    } else {
      // DUO alternating direct mastermind!
      // If P1 is active, P1 inputs guess to find P2's secret code (`secretCodeP2`)
      const currentSecret = activePlayer === 'P1' ? secretCodeP2 : secretCodeP1;
      const calculated = calculateClues(submittedGuess, currentSecret);
      const isWin = calculated.filter(c => c === 'correct').length === 4;

      let nextP1Solved = p1SolvedRound;
      let nextP2Solved = p2SolvedRound;

      if (activePlayer === 'P1') {
        const updatedGuesses = [...guessesP1];
        updatedGuesses[currentRoundNumber] = {
          guess: submittedGuess,
          clues: calculated,
        };
        setGuessesP1(updatedGuesses);
        if (isWin) {
          setP1SolvedRound(currentRoundNumber);
          finalizeDuoMatch(currentRoundNumber, null);
          return;
        }

        // Who plays next? P2 of this round?
        const isP2EligibleThisRound = nextP2Solved === null && currentRoundNumber < maxAttemptsP2;
        if (isP2EligibleThisRound) {
          setActivePlayer('P2');
          setMascotSpeech({
            expression: 'thinking',
            text: `Proposition de ${player1Name} validée ! À ton tour, ${player2Name}, décode sa formule secrète ! 🐾🐹`,
          });
        } else {
          // P2 is solved or out of attempts. Can we advance to the next round index?
          const nextRound = currentRoundNumber + 1;
          const isP1EligibleNextRound = nextP1Solved === null && nextRound < maxAttemptsP1;
          const isP2EligibleNextRound = nextP2Solved === null && nextRound < maxAttemptsP2;

          if (isP1EligibleNextRound) {
            setCurrentRoundNumber(nextRound);
            setActivePlayer('P1');
            setP1SpunThisRound(false);
            setP2SpunThisRound(false);
            setMascotSpeech({
              expression: 'thinking',
              text: `L'Étape ${currentRoundNumber + 1} est terminée ! C'est reparti pour l'Étape ${nextRound + 1}. À toi, ${player1Name} ! 🐰💖`,
            });
          } else if (isP2EligibleNextRound) {
            setCurrentRoundNumber(nextRound);
            setActivePlayer('P2');
            setP1SpunThisRound(false);
            setP2SpunThisRound(false);
            setMascotSpeech({
              expression: 'thinking',
              text: `À ton tour, ${player2Name}, pour l'Étape ${nextRound + 1} ! Trouve la formule de ${player1Name} ! 🦊`,
            });
          } else {
            finalizeDuoMatch(nextP1Solved, nextP2Solved);
          }
        }
      } else {
        // Player 2's turn
        const updatedGuesses = [...guessesP2];
        updatedGuesses[currentRoundNumber] = {
          guess: submittedGuess,
          clues: calculated,
        };
        setGuessesP2(updatedGuesses);
        if (isWin) {
          setP2SolvedRound(currentRoundNumber);
          finalizeDuoMatch(null, currentRoundNumber);
          return;
        }

        // Round ends! Evaluate eligibility for next round
        const nextRound = currentRoundNumber + 1;
        const isP1EligibleNextRound = nextP1Solved === null && nextRound < maxAttemptsP1;
        const isP2EligibleNextRound = nextP2Solved === null && nextRound < maxAttemptsP2;

        if (isP1EligibleNextRound) {
          setCurrentRoundNumber(nextRound);
          setActivePlayer('P1');
          setP1SpunThisRound(false);
          setP2SpunThisRound(false);
          setMascotSpeech({
            expression: 'thinking',
            text: `L'Étape ${currentRoundNumber + 1} est terminée ! C'est reparti pour l'Étape ${nextRound + 1}. À toi, ${player1Name} ! 🐰💖`,
          });
        } else if (isP2EligibleNextRound) {
          setCurrentRoundNumber(nextRound);
          setActivePlayer('P2');
          setP1SpunThisRound(false);
          setP2SpunThisRound(false);
          setMascotSpeech({
            expression: 'thinking',
            text: `L'Étape ${currentRoundNumber + 1} est terminée ! À ton tour de jouer seul pour l'Étape ${nextRound + 1}, ${player2Name} ! 🦊`,
          });
        } else {
          finalizeDuoMatch(nextP1Solved, nextP2Solved);
        }
      }
    }
  };

  const finalizeDuoMatch = (p1Solved: number | null, p2Solved: number | null) => {
    // Determine winner based on custom indices
    if (p1Solved !== null && p2Solved !== null) {
      if (p1Solved < p2Solved) {
        playWinMelody();
        setRoundWinner('creator');
        setScores(prev => ({ ...prev, creator: prev.creator + 2 }));
        setMascotSpeech({
          expression: 'victory',
          text: `Bravo ! ${player1Name} l'emporte ! Vous avez tous les deux décrypté les formules, mais ${player1Name} s'est montré plus rapide (Étape ${p1Solved + 1} vs ${p2Solved + 1}) ! 👑🎉`,
        });
      } else if (p2Solved < p1Solved) {
        playWinMelody();
        setRoundWinner('decoder');
        setScores(prev => ({ ...prev, decoder: prev.decoder + 2 }));
        setMascotSpeech({
          expression: 'victory',
          text: `Bravo ! ${player2Name} l'emporte ! Vous avez tous les deux décrypté les formules, mais ${player2Name} s'est montré plus rapide (Étape ${p2Solved + 1} vs ${p1Solved + 1}) ! 👑🎉`,
        });
      } else {
        playWinMelody();
        setRoundWinner('tie');
        setScores(prev => ({ ...prev, creator: prev.creator + 1, decoder: prev.decoder + 1 }));
        setMascotSpeech({
          expression: 'victory',
          text: `Égalité magique absolue ! 🥳 Vous avez tous les deux déchiffré les formules secrètes à la même Étape (${p1Solved + 1}) ! Quel duo fantastique ! 🐰🦊`,
        });
      }
    } else if (p1Solved !== null) {
      playWinMelody();
      setRoundWinner('creator');
      setScores(prev => ({ ...prev, creator: prev.creator + 2 }));
      setMascotSpeech({
        expression: 'victory',
        text: `Victoire magique de ${player1Name} ! 👑 Tu as découvert le code secret de ${player2Name} à l'étape ${p1Solved + 1} ! Félicitations ! 🎉🏆`,
      });
    } else if (p2Solved !== null) {
      playWinMelody();
      setRoundWinner('decoder');
      setScores(prev => ({ ...prev, decoder: prev.decoder + 2 }));
      setMascotSpeech({
        expression: 'victory',
        text: `Victoire magique de ${player2Name} ! 👑 Tu as découvert le code secret de ${player1Name} à l'étape ${p2Solved + 1} ! Félicitations ! 🎉🏆`,
      });
    } else {
      playLoseMelody();
      setRoundWinner('none');
      setMascotSpeech({
        expression: 'sad',
        text: `Match nul ! Aucun d'entre vous n'a réussi à s'introduire dans la combinaison secrète de l'autre ! Les petits animaux restent bien au chaud ! 🔒🐿️`,
      });
    }

    setStatus('round_completed');
  };

  const handleWheelOptionApplied = (option: WheelOption) => {
    const active = activeWheelPlayer || activePlayer;
    const opponent = active === 'P1' ? 'P2' : 'P1';

    // Mark as spun and decrement spins left
    if (active === 'P1') {
      setP1SpunThisRound(true);
      setP1SpinsLeft(prev => Math.max(0, prev - 1));
    } else {
      setP2SpunThisRound(true);
      setP2SpinsLeft(prev => Math.max(0, prev - 1));
    }

    // Close the wheel modal
    setActiveWheelPlayer(null);

    // Apply outcomes
    switch (option.id) {
      case 'give_hint': {
        const opSecret = active === 'P1' ? secretCodeP2 : secretCodeP1;
        const currentRevealed = active === 'P1' ? revealedAnimalsP1 : revealedAnimalsP2;

        const candidatePegs = opSecret.filter(p => !currentRevealed.some(cr => cr.id === p.id));
        if (candidatePegs.length > 0) {
          const chosenPeg = candidatePegs[Math.floor(Math.random() * candidatePegs.length)];
          if (active === 'P1') {
            setRevealedAnimalsP1(prev => [...prev, chosenPeg]);
          } else {
            setRevealedAnimalsP2(prev => [...prev, chosenPeg]);
          }
          setMascotSpeech({
            expression: 'happy',
            text: `Révélation ! Momo a trouvé un indice ! L'un des animaux cachés recherchés est le ${chosenPeg.emoji} (${chosenPeg.name}) ! 🌟🔍`,
          });
        } else {
          const chosenPeg = opSecret[Math.floor(Math.random() * opSecret.length)];
          setMascotSpeech({
            expression: 'happy',
            text: `Révélation ! Tu as déjà tous les indices, mais Momo te confirme que le compagnon ${chosenPeg.emoji} fait bien partie de la formule ! ✨`,
          });
        }
        break;
      }

      case 'add_attempt': {
        if (active === 'P1') {
          setMaxAttemptsP1(prev => {
            const newVal = prev + 1;
            setGuessesP1(g => [...g, {
              guess: [null, null, null, null],
              clues: ['empty', 'empty', 'empty', 'empty'],
            }]);
            return newVal;
          });
          setMascotSpeech({
            expression: 'victory',
            text: `Félicitations, ${player1Name} ! Tu as gagné un essai supplémentaire ! Ton plateau compte désormais une tentative de plus. 🎉`,
          });
        } else {
          setMaxAttemptsP2(prev => {
            const newVal = prev + 1;
            setGuessesP2(g => [...g, {
              guess: [null, null, null, null],
              clues: ['empty', 'empty', 'empty', 'empty'],
            }]);
            return newVal;
          });
          setMascotSpeech({
            expression: 'victory',
            text: `Félicitations, ${player2Name} ! Tu as gagné un essai supplémentaire ! Ton plateau compte désormais une tentative de plus. 🎉`,
          });
        }
        break;
      }

      case 'sabotage_opponent': {
        if (opponent === 'P1') {
          setMaxAttemptsP1(prev => Math.max(1, prev - 1));
          setMascotSpeech({
            expression: 'victory',
            text: `Ouch ! Un blizzard glacial frappe le plateau de ${player1Name} ! Une de ses lignes de tentative est gelée et bloquée ! ❄️🔒`,
          });
        } else {
          setMaxAttemptsP2(prev => Math.max(1, prev - 1));
          setMascotSpeech({
            expression: 'victory',
            text: `Ouch ! Un blizzard glacial frappe le plateau de ${player2Name} ! Une de ses lignes de tentative est gelée et bloquée ! ❄️🔒`,
          });
        }
        break;
      }

      case 'lose_attempt': {
        if (active === 'P1') {
          setMaxAttemptsP1(prev => Math.max(1, prev - 1));
          setMascotSpeech({
            expression: 'sad',
            text: `Aïe aïe aïe ! Malédiction temporelle sur ${player1Name} ! Le sablier se brise et tu perds une ligne de tentative ! ⏳🥀`,
          });
        } else {
          setMaxAttemptsP2(prev => Math.max(1, prev - 1));
          setMascotSpeech({
            expression: 'sad',
            text: `Aïe aïe aïe ! Malédiction temporelle sur ${player2Name} ! Le sablier se brise et tu perds une ligne de tentative ! ⏳🥀`,
          });
        }
        break;
      }

      case 'mutate_opponent_code': {
        const targetIsP1 = opponent === 'P1';
        const oldSecret = targetIsP1 ? secretCodeP1 : secretCodeP2;
        
        if (oldSecret.length > 0) {
          const indexToReplace = Math.floor(Math.random() * oldSecret.length);
          const oldPeg = oldSecret[indexToReplace];
          
          const availablePegs = ANIMAL_PEGS.filter(p => !allowDuplicates ? !oldSecret.some(s => s.id === p.id) : p.id !== oldPeg.id);
          const newPeg = availablePegs[Math.floor(Math.random() * availablePegs.length)];
          
          const newSecret = [...oldSecret];
          newSecret[indexToReplace] = newPeg;
          
          if (targetIsP1) {
            setSecretCodeP1(newSecret);
          } else {
            setSecretCodeP2(newSecret);
          }
          
          setMascotSpeech({
            expression: 'shocked',
            text: `Tourbillon du Chaos ! 🌀 L'un des animaux de la combinaison secrète de ${targetIsP1 ? player1Name : player2Name} a muté (${oldPeg.emoji} est devenu ${newPeg.emoji}) ! Tes indices vont changer !`,
          });
        }
        break;
      }

      case 'mutate_own_code': {
        const targetIsP1 = active === 'P1';
        const oldSecret = targetIsP1 ? secretCodeP1 : secretCodeP2;
        
        if (oldSecret.length > 0) {
          const indexToReplace = Math.floor(Math.random() * oldSecret.length);
          const oldPeg = oldSecret[indexToReplace];
          
          const availablePegs = ANIMAL_PEGS.filter(p => !allowDuplicates ? !oldSecret.some(s => s.id === p.id) : p.id !== oldPeg.id);
          const newPeg = availablePegs[Math.floor(Math.random() * availablePegs.length)];
          
          const newSecret = [...oldSecret];
          newSecret[indexToReplace] = newPeg;
          
          if (targetIsP1) {
            setSecretCodeP1(newSecret);
          } else {
            setSecretCodeP2(newSecret);
          }
          
          setMascotSpeech({
            expression: 'happy',
            text: `Brouillage de pistes ! 🎭 Tu as muté l'un des animaux de TA propre formule secrète (${oldPeg.emoji} est devenu ${newPeg.emoji}). ${opponent === 'P1' ? player1Name : player2Name} va rager ! ✨`,
          });
        }
        break;
      }
    }
  };

  const handleNextRound = (swapRoles?: boolean) => {
    if (playType === 'solo') {
      handleStartSetup();
    } else {
      let p1 = player1Name;
      let p2 = player2Name;
      if (swapRoles) {
        p1 = player2Name;
        p2 = player1Name;
        setPlayer1Name(p1);
        setPlayer2Name(p2);
      }

      setMode('duo_setup_p1');
      setStatus('setup');
      setSecretCodeP1([]);
      setSecretCodeP2([]);
      setGuessesP1([]);
      setGuessesP2([]);
      setP1SolvedRound(null);
      setP2SolvedRound(null);
      setCurrentRoundNumber(0);
      setRoundWinner(null);
      setTabletPassingTo(null);

      // Reset wheel and modifier states
      setMaxAttemptsP1(10);
      setMaxAttemptsP2(10);
      setRevealedAnimalsP1([]);
      setRevealedAnimalsP2([]);
      setP1SpunThisRound(false);
      setP2SpunThisRound(false);
      setP1SpinsLeft(3);
      setP2SpinsLeft(3);
      setActiveWheelPlayer(null);

      setMascotSpeech({
        expression: 'thinking',
        text: swapRoles
          ? `Rôles inversés ! ${p1} prépare ta combinaison secrète en premier, et ${p2} prépare-toi ! 🤫🌸`
          : `Revanche ! ${p1}, prépare ta combinaison secrète ! 🤫🌸`,
      });
    }
  };

  const handleResetGame = () => {
    setMode('menu');
    setSecretCodeP1([]);
    setSecretCodeP2([]);
    setGuessesP1([]);
    setGuessesP2([]);
    setP1SolvedRound(null);
    setP2SolvedRound(null);
    setCurrentRoundNumber(0);
    setStatus('setup');
    setRoundWinner(null);
    setTabletPassingTo(null);

    // Reset wheel states
    setMaxAttemptsP1(10);
    setMaxAttemptsP2(10);
    setRevealedAnimalsP1([]);
    setRevealedAnimalsP2([]);
    setP1SpunThisRound(false);
    setP2SpunThisRound(false);
    setP1SpinsLeft(3);
    setP2SpinsLeft(3);
    setActiveWheelPlayer(null);

    setScores({
      creator: 0,
      decoder: 0,
      soloPlayer: 0,
      soloCpu: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex flex-col justify-between py-6 px-4 select-none relative overflow-hidden" id="app-wrapper">
      
      {/* Background blobs for absolute cute aesthetics */}
      <div className="absolute top-10 left-10 w-44 h-44 bg-pink-100/60 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Header Utilities */}
      <div className="w-full max-w-lg mx-auto flex justify-between items-center mb-4 z-20" id="header-utilities">
        <div
          onClick={handleResetGame}
          className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-pink-200 cursor-pointer hover:bg-pink-100/40 transition-all shadow-sm active:scale-95"
          id="brand-header-click"
        >
          <span className="text-xl">🌸</span>
          <span className="font-extrabold text-sm md:text-base tracking-tight text-pink-600 font-sans">
            Mastermind Kawaii
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              playConfirm();
              setIsRulesOpen(true);
            }}
            className="p-2.5 bg-white/75 hover:bg-pink-100/30 text-purple-600 rounded-full border-2 border-pink-200 shadow-sm cursor-pointer transition-colors active:scale-90"
            title="Consulter les règles du jeu"
            id="rules-trigger-btn"
          >
            <HelpCircle size={18} />
          </button>
          
          <SoundToggle />
        </div>
      </div>

      {/* Central Screen Area */}
      <main className={`flex-1 w-full ${mode === 'playing' && playType === 'duo' ? 'max-w-6xl' : 'max-w-lg'} mx-auto flex flex-col justify-center items-center gap-4 z-20`} id="main-court">
        <AnimatePresence mode="wait">

          {/* TABLET PASSING INTERACTIVE OVERLAY */}
          {tabletPassingTo !== null && (
            <motion.div
              key="tablet-passing-overlay"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full bg-white/95 border-4 border-pink-300 rounded-3xl p-6 md:p-8 text-center shadow-xl space-y-6"
              id="tablet-passing-panel"
            >
              <div className="relative inline-block">
                <span className="text-7xl animate-bounce inline-block">📱🔄👀</span>
                <span className="absolute -top-1 -right-3 text-pink-500 text-2xl animate-spin">✨</span>
              </div>

              <div className="bg-pink-50/70 border-2 border-pink-100 rounded-2xl p-4">
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
                  Changement de mains 👋
                </span>
                <h3 className="text-xl font-bold text-indigo-950 leading-relaxed">
                  {passReason}
                </h3>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-800 font-medium">
                ⚠️ Pour garantir le secret de la tablette, assurez-vous de ne pas regarder l'écran avant que la tablette ne vous soit complètement désignée ! 🤫
              </div>

              <button
                onClick={() => {
                  playConfirm();
                  setTabletPassingTo(null);
                  setMascotSpeech({
                    expression: 'happy',
                    text: `Super ! C'est parti, ${tabletPassingTo === 'P1' ? player1Name : player2Name} ! Fais ta plus belle proposition ! 🌸✨`,
                  });
                }}
                className="w-full py-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black text-base rounded-2xl shadow-md border-b-4 border-rose-500 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                id="tablet-passing-ready-btn"
              >
                <Sparkles size={18} className="animate-pulse" />
                <span>Moi, {tabletPassingTo === 'P1' ? player1Name : player2Name}, je tiens la tablette ! 🔎</span>
              </button>
            </motion.div>
          )}

          {/* MAIN MENU */}
          {mode === 'menu' && tabletPassingTo === null && (
            <motion.div
              key="menu-screen"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full bg-white/75 backdrop-blur-md rounded-3xl border-4 border-pink-205 p-6 md:p-8 text-center shadow-xl space-y-6"
              id="menu-panel"
            >
              <div className="relative inline-block mb-1">
                <span className="text-6xl md:text-7xl animate-bounce inline-block">🐹</span>
                <div className="absolute -top-1 -right-4 text-pink-500 text-xl animate-ping">💖</div>
                <div className="absolute -bottom-1 -left-4 text-yellow-400 text-xl animate-bounce">✨</div>
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent filter drop-shadow-sm font-sans mb-1">
                  Mastermind Kawaii
                </h1>
                <p className="text-xs text-purple-700 font-black tracking-widest uppercase">
                  🌸 Duel Tactile à Deux Joueurs 🌸
                </p>
              </div>

              <div className="space-y-4">
                {/* Duo Tablet Card - Highlighted first */}
                <div
                  onClick={() => {
                    playConfirm();
                    setPlayType('duo');
                    setMode('duo_setup');
                  }}
                  className="flex items-center gap-4 bg-gradient-to-tr from-pink-50/70 to-white hover:from-pink-100/40 p-4 border-4 border-pink-300 rounded-3xl cursor-pointer hover:shadow-md transition-all group scale-active"
                  id="select-mode-duo-card"
                >
                  <div className="p-3.5 bg-pink-100 rounded-2xl text-pink-500 group-hover:bg-pink-200 transition-colors">
                    <Users size={28} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-purple-950">
                        Duo Face à Face Tactile 👥
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase bg-pink-250 text-pink-600 px-2 py-0.5 rounded-full bg-pink-100">Coup de cœur</span>
                    </div>
                    <p className="text-xs text-purple-800/80 font-semibold mt-0.5 leading-relaxed">
                      Chacun son code secret ! Réfléchissez ensemble côte à côte et devinez vos formules à tour de rôle sur le même écran !
                    </p>
                  </div>
                </div>

                {/* Solo Card */}
                <div
                  onClick={() => {
                    playConfirm();
                    setPlayType('solo');
                    setMode('solo_setup');
                  }}
                  className="flex items-center gap-4 bg-gradient-to-br from-slate-50 to-white hover:from-slate-100/60 p-4 border-2 border-slate-200 rounded-2xl cursor-pointer hover:shadow-md transition-all group scale-active"
                  id="select-mode-solo-card"
                >
                  <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-505 text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                    <User size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-black text-purple-950">
                      Entraînement Solo avec Momo 🐹
                    </h3>
                    <p className="text-xs text-purple-800/80 font-medium">
                      Décode la combinaison de compagnie cachée par Momo le Hamster en 10 étapes !
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playConfirm();
                  setIsRulesOpen(true);
                }}
                className="w-full py-3 bg-indigo-50 hover:bg-indigo-100/60 text-indigo-700 text-xs font-black uppercase tracking-widest rounded-xl border border-indigo-100 cursor-pointer"
                id="menu-rules-btn"
              >
                📖 Lire les règles détaillées du jeu
              </button>
            </motion.div>
          )}

          {/* DUO AND SOLO SETUPS */}
          {(mode === 'solo_setup' || mode === 'duo_setup') && tabletPassingTo === null && (
            <motion.div
              key="setup-screen"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full bg-white/75 backdrop-blur-md rounded-3xl border-4 border-pink-200 p-6 md:p-8 shadow-xl space-y-5"
              id="setup-panel"
            >
              <h2 className="text-2xl font-black text-purple-950 text-center flex items-center justify-center gap-1.5">
                🍭 Paramètres de la partie
              </h2>

              <div className="space-y-4">
                {mode === 'solo_setup' ? (
                  <div>
                    <label className="text-xs font-black uppercase text-purple-700 tracking-wider mb-1.5 block">
                      Ton petit prénom :
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-pink-450 text-pink-500" />
                      <input
                        type="text"
                        maxLength={14}
                        value={soloPlayerName}
                        onChange={(e) => setSoloPlayerName(e.target.value || '')}
                        placeholder="Mets ici ton prénom..."
                        className="w-full py-3 pl-11 pr-4 rounded-xl border-2 border-pink-100 bg-white font-extrabold text-purple-950 text-sm focus:outline-none focus:border-pink-300 shadow-sm"
                        id="solo-player-name-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-xs font-black uppercase text-purple-700 tracking-wider block">
                      Entrez les deux prénoms pour la tablette :
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Player 1 */}
                      <div>
                        <label className="text-[10px] font-black uppercase text-pink-600 tracking-wider mb-1 block">
                          👾 Joueur 1 (P1) :
                        </label>
                        <div className="relative">
                          <User size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-pink-500" />
                          <input
                            type="text"
                            maxLength={10}
                            value={player1Name}
                            onChange={(e) => setPlayer1Name(e.target.value || '')}
                            className="w-full py-2.5 pl-8 pr-3 rounded-xl border-2 border-pink-100 bg-white focus:outline-none focus:border-pink-300 font-extrabold text-purple-950 text-xs shadow-sm"
                            id="duo-p1-name"
                          />
                        </div>
                      </div>

                      {/* Player 2 */}
                      <div>
                        <label className="text-[10px] font-black uppercase text-purple-600 tracking-wider mb-1 block">
                          🔎 Joueur 2 (P2) :
                        </label>
                        <div className="relative">
                          <User size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-purple-500" />
                          <input
                            type="text"
                            maxLength={10}
                            value={player2Name}
                            onChange={(e) => setPlayer2Name(e.target.value || '')}
                            className="w-full py-2.5 pl-8 pr-3 rounded-xl border-2 border-pink-100 bg-white focus:outline-none focus:border-pink-300 font-extrabold text-purple-950 text-xs shadow-sm"
                            id="duo-p2-name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Duplicates allowance */}
                <div className="bg-pink-50/70 p-4 border border-pink-100/70 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="text-left pr-2 flex-1">
                    <h4 className="text-sm font-black text-purple-950">
                      Doublons d'animaux autorisés ?
                    </h4>
                    <p className="text-[11px] text-purple-800/80 font-semibold leading-relaxed mt-0.5">
                      Autorise le même animal plusieurs fois dans la formule secrète (ex: double chatons 🐱🐱). Le jeu devient plus stratégique !
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playBubble();
                      setAllowDuplicates(!allowDuplicates);
                    }}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-colors cursor-pointer border-2 ${
                      allowDuplicates
                        ? 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200 shadow-sm'
                        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                    }`}
                    id="allow-dupes-toggle"
                  >
                    {allowDuplicates ? 'Oui (Classique)' : 'Non (Facile)'}
                  </button>
                </div>
              </div>

              {/* Start Setup Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    playErase();
                    setMode('menu');
                  }}
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border border-slate-200 active:scale-95 text-sm cursor-pointer"
                  id="setup-back-btn"
                >
                  Retour
                </button>
                <button
                  onClick={() => {
                    playConfirm();
                    handleStartSetup();
                  }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black rounded-2xl shadow-lg hover:shadow-xl active:scale-95 text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  id="setup-start-btn"
                >
                  <Play size={16} fill="currentColor" />
                  <span>C'est parti ! 🌸</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* DUO PLAYERS SETS CODE */}
          {(mode === 'duo_setup_p1' || mode === 'duo_setup_p2') && tabletPassingTo === null && (
            <motion.div
              key="setup-codes-stage"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full"
              id="setup-codes-stage-court"
            >
              <CodeSetter
                creatorName={mode === 'duo_setup_p1' ? player1Name : player2Name}
                onCodeLocked={mode === 'duo_setup_p1' ? handleP1CodeLocked : handleP2CodeLocked}
              />
            </motion.div>
          )}

          {/* MAIN ACTIVE GAME (SOLO OR DUO) */}
          {mode === 'playing' && status === 'playing' && tabletPassingTo === null && (
            <motion.div
              key="game-play-board-screen"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full flex flex-col gap-2"
              id="game-board-court"
            >
              {/* Dual Tablet Mode turn header */}
              {playType === 'duo' && (
                <div className="w-full bg-white/80 p-3 rounded-2xl border-2 border-pink-200 flex flex-wrap items-center justify-between text-xs font-black shadow-sm mb-1 bg-pink-50/40 gap-3">
                  <span className="text-pink-600 flex items-center gap-1">
                    👤 Tour de : <strong className="text-indigo-950 text-sm">{activePlayer === 'P1' ? player1Name : player2Name}</strong>
                  </span>

                  {/* Layout Switcher ( Côte à côte / Face à face ) */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => {
                        playConfirm();
                        setLayoutMode('side-by-side');
                      }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        layoutMode === 'side-by-side'
                          ? 'bg-white text-indigo-950 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👥 Côte-à-côte
                    </button>
                    <button
                      onClick={() => {
                        playConfirm();
                        setLayoutMode('face-to-face');
                      }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        layoutMode === 'face-to-face'
                          ? 'bg-white text-indigo-950 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🔄 Face-à-face
                    </button>
                  </div>
                  
                  <span className="text-slate-500 flex items-center gap-1 uppercase bg-white border border-slate-100 px-2 py-1 rounded-lg">
                    🎯 Décode la formule de : <strong className="text-pink-600">{activePlayer === 'P1' ? player2Name : player1Name}</strong>
                  </span>
                </div>
              )}

              {playType === 'solo' ? (
                <GameBoard
                  guesses={soloGuesses}
                  currentGuessIndex={soloCurrentGuessIndex}
                  decoderName={soloPlayerName}
                  onGuessSubmitted={handleGuessSubmit}
                />
              ) : (
                <div className={layoutMode === 'face-to-face' ? "flex flex-col gap-10 w-full max-w-xl mx-auto py-2" : "grid grid-cols-1 md:grid-cols-2 gap-6 w-full"} id="duo-boards-container">
                  {layoutMode === 'face-to-face' ? (
                    <>
                      {/* PLAYER 2 (P2) Row - Rotated 180 degrees for target player seated opposite */}
                      <div className="flex flex-col gap-2 rotate-180 transform origin-center transition-all duration-300">
                        <div className="bg-indigo-100/40 border border-indigo-200/40 rounded-2xl py-1.5 px-3 flex items-center justify-between text-[11px] font-black uppercase text-indigo-600 gap-1.5">
                          <span>🦊 {player2Name} active (Cible: {player1Name})</span>
                          <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                            Essais: {maxAttemptsP2}
                          </span>
                        </div>

                        {/* Wheel action button P2 */}
                        <div className="px-1 mb-1">
                          {activePlayer === 'P2' ? (
                            <button
                              onClick={() => {
                                playConfirm();
                                setActiveWheelPlayer('P2');
                              }}
                              disabled={p2SpunThisRound || p2SpinsLeft <= 0}
                              className={`w-full py-2.5 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                                (p2SpunThisRound || p2SpinsLeft <= 0)
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                  : 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:opacity-90 text-white border-b-4 border-emerald-500 hover:scale-102 active:scale-95 animate-pulse mt-0.5'
                              }`}
                              id="p2-spin-wheel-btn-face"
                            >
                              <span>
                                {p2SpinsLeft <= 0
                                  ? '🎰 Roue Épuisée (0/3 rest.)'
                                  : p2SpunThisRound
                                  ? '🎰 Roue Utilisée à cette étape'
                                  : `🎰 Roue du Destin (restant: ${p2SpinsLeft}/3)`}
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2.5 rounded-2xl text-[10px] font-black bg-slate-100/30 text-slate-400 border border-slate-100/50 flex items-center justify-center gap-1.5 uppercase tracking-wider select-none mt-0.5">
                              <span>🎰 Roue inactive</span>
                            </div>
                          )}
                        </div>

                        <GameBoard
                          guesses={guessesP2}
                          currentGuessIndex={currentRoundNumber}
                          decoderName={player2Name}
                          opponentName={player1Name}
                          isActive={activePlayer === 'P2'}
                          onGuessSubmitted={handleGuessSubmit}
                          maxAttempts={maxAttemptsP2}
                          revealedAnimals={revealedAnimalsP2}
                        />
                      </div>

                      {/* Cool tactile visual central divider with details */}
                      <div className="py-2.5 flex flex-col items-center gap-1.5 border-y-2 border-dashed border-purple-200/40 bg-purple-50/20 rounded-3xl p-3 select-none">
                        <div className="text-[11px] text-purple-950 font-black text-center uppercase tracking-wider flex items-center gap-4">
                          <span className={`${activePlayer === 'P2' ? 'text-indigo-600 scale-105 font-black' : 'text-slate-400 font-bold'}`}>🦊 {player2Name} : {scores.decoder} pts</span>
                          <span className="text-purple-300">❃</span>
                          <span className={`${activePlayer === 'P1' ? 'text-pink-600 scale-105 font-black' : 'text-slate-400 font-bold'}`}>🦄 {player1Name} : {scores.creator} pts</span>
                        </div>
                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest bg-white/70 px-2 py-0.5 rounded border border-purple-100">
                          Tablette Tactile • Face à Face
                        </span>
                      </div>

                      {/* PLAYER 1 (P1) Row - Normal orientation for the standard player */}
                      <div className="flex flex-col gap-2 transition-all duration-300">
                        <div className="bg-pink-100/60 border border-pink-200/50 rounded-2xl py-1.5 px-3 flex items-center justify-between text-[11px] font-black uppercase text-pink-600 gap-1.5">
                          <span>🦄 {player1Name} active (Cible: {player2Name})</span>
                          <span className="text-[10px] bg-pink-200 text-pink-800 px-2 py-0.5 rounded-full font-bold">
                            Essais: {maxAttemptsP1}
                          </span>
                        </div>

                        {/* Wheel action button P1 */}
                        <div className="px-1 mb-1">
                          {activePlayer === 'P1' ? (
                            <button
                              onClick={() => {
                                playConfirm();
                                setActiveWheelPlayer('P1');
                              }}
                              disabled={p1SpunThisRound || p1SpinsLeft <= 0}
                              className={`w-full py-2.5 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                                (p1SpunThisRound || p1SpinsLeft <= 0)
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                  : 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:opacity-90 text-white border-b-4 border-emerald-500 hover:scale-102 active:scale-95 animate-pulse mt-0.5'
                              }`}
                              id="p1-spin-wheel-btn-face"
                            >
                              <span>
                                {p1SpinsLeft <= 0
                                  ? '🎰 Roue Épuisée (0/3 rest.)'
                                  : p1SpunThisRound
                                  ? '🎰 Roue Utilisée à cette étape'
                                  : `🎰 Roue du Destin (restant: ${p1SpinsLeft}/3)`}
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2.5 rounded-2xl text-[10px] font-black bg-slate-100/30 text-slate-400 border border-slate-100/50 flex items-center justify-center gap-1.5 uppercase tracking-wider select-none mt-0.5">
                              <span>🎰 Roue inactive</span>
                            </div>
                          )}
                        </div>

                        <GameBoard
                          guesses={guessesP1}
                          currentGuessIndex={currentRoundNumber}
                          decoderName={player1Name}
                          opponentName={player2Name}
                          isActive={activePlayer === 'P1'}
                          onGuessSubmitted={handleGuessSubmit}
                          maxAttempts={maxAttemptsP1}
                          revealedAnimals={revealedAnimalsP1}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Player 1 (P1) Column (Side-by-side standard) */}
                      <div className="flex flex-col gap-2">
                        <div className="bg-pink-100/60 border border-pink-200/50 rounded-2xl py-1.5 px-3 flex items-center justify-between text-[11px] font-black uppercase text-pink-600 gap-1.5">
                          <span>🦄 {player1Name} active (Cible: {player2Name})</span>
                          <span className="text-[10px] bg-pink-200 text-pink-800 px-2 py-0.5 rounded-full font-bold">
                            Essais: {maxAttemptsP1}
                          </span>
                        </div>

                        {/* Wheel action button P1 */}
                        <div className="px-1 mb-1">
                          {activePlayer === 'P1' ? (
                            <button
                              onClick={() => {
                                playConfirm();
                                setActiveWheelPlayer('P1');
                              }}
                              disabled={p1SpunThisRound || p1SpinsLeft <= 0}
                              className={`w-full py-2.5 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                                (p1SpunThisRound || p1SpinsLeft <= 0)
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                  : 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:opacity-90 text-white border-b-4 border-emerald-500 hover:scale-102 active:scale-95 animate-pulse mt-0.5'
                              }`}
                              id="p1-spin-wheel-btn"
                            >
                              <span>
                                {p1SpinsLeft <= 0
                                  ? '🎰 Roue Épuisée (0/3 rest.)'
                                  : p1SpunThisRound
                                  ? '🎰 Roue Utilisée à cette étape'
                                  : `🎰 Roue du Destin (restant: ${p1SpinsLeft}/3)`}
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2.5 rounded-2xl text-[10px] font-black bg-slate-100/30 text-slate-400 border border-slate-100/50 flex items-center justify-center gap-1.5 uppercase tracking-wider select-none mt-0.5">
                              <span>🎰 Roue inactive</span>
                            </div>
                          )}
                        </div>

                        <GameBoard
                          guesses={guessesP1}
                          currentGuessIndex={currentRoundNumber}
                          decoderName={player1Name}
                          opponentName={player2Name}
                          isActive={activePlayer === 'P1'}
                          onGuessSubmitted={handleGuessSubmit}
                          maxAttempts={maxAttemptsP1}
                          revealedAnimals={revealedAnimalsP1}
                        />
                      </div>

                      {/* Player 2 (P2) Column (Side-by-side standard) */}
                      <div className="flex flex-col gap-2">
                        <div className="bg-indigo-100/40 border border-indigo-200/40 rounded-2xl py-1.5 px-3 flex items-center justify-between text-[11px] font-black uppercase text-indigo-600 gap-1.5">
                          <span>🦊 {player2Name} active (Cible: {player1Name})</span>
                          <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                            Essais: {maxAttemptsP2}
                          </span>
                        </div>

                        {/* Wheel action button P2 */}
                        <div className="px-1 mb-1">
                          {activePlayer === 'P2' ? (
                            <button
                              onClick={() => {
                                playConfirm();
                                setActiveWheelPlayer('P2');
                              }}
                              disabled={p2SpunThisRound || p2SpinsLeft <= 0}
                              className={`w-full py-2.5 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                                (p2SpunThisRound || p2SpinsLeft <= 0)
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                  : 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:opacity-90 text-white border-b-4 border-emerald-500 hover:scale-102 active:scale-95 animate-pulse mt-0.5'
                              }`}
                              id="p2-spin-wheel-btn"
                            >
                              <span>
                                {p2SpinsLeft <= 0
                                  ? '🎰 Roue Épuisée (0/3 rest.)'
                                  : p2SpunThisRound
                                  ? '🎰 Roue Utilisée à cette étape'
                                  : `🎰 Roue du Destin (restant: ${p2SpinsLeft}/3)`}
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2.5 rounded-2xl text-[10px] font-black bg-slate-100/30 text-slate-400 border border-slate-100/50 flex items-center justify-center gap-1.5 uppercase tracking-wider select-none mt-0.5">
                              <span>🎰 Roue inactive</span>
                            </div>
                          )}
                        </div>

                        <GameBoard
                          guesses={guessesP2}
                          currentGuessIndex={currentRoundNumber}
                          decoderName={player2Name}
                          opponentName={player1Name}
                          isActive={activePlayer === 'P2'}
                          onGuessSubmitted={handleGuessSubmit}
                          maxAttempts={maxAttemptsP2}
                          revealedAnimals={revealedAnimalsP2}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating Mascot guide comment */}
      <div className="w-full max-w-lg mx-auto z-20 mt-2" id="mascot-section">
        <MascotTalk speech={mascotSpeech} />
      </div>

      {/* ROUND END MODAL COMPLETE SUMMARY */}
      {status === 'round_completed' && (
        <>
          <CelebrationCanvas active={roundWinner !== 'solo_cpu' && roundWinner !== 'none' && roundWinner !== null} />
          <RoundSummary
            winner={roundWinner}
            playType={playType}
            creatorName={player1Name}
            decoderName={player2Name}
            secretCode={playType === 'solo' ? soloSecretCode : (roundWinner === 'creator' ? secretCodeP2 : secretCodeP1)}
            attempts={playType === 'solo' ? soloCurrentGuessIndex + 1 : currentRoundNumber + 1}
            scores={scores}
            onNextRound={handleNextRound}
            onResetGame={handleResetGame}
          />
        </>
      )}

      {/* RoundCompleted Custom extension to reveal BOTH codes for DUO modes! */}
      {status === 'round_completed' && playType === 'duo' && (
        <div className="fixed inset-0 z-40 bg-pink-950/20 backdrop-blur-xs flex items-end justify-center pointer-events-none p-4 mb-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm bg-white/95 rounded-2xl border-2 border-pink-300 pointer-events-auto shadow-xl p-4 text-center text-xs text-purple-950 font-medium space-y-3"
            id="dual-reveal-info"
          >
            <p className="font-extrabold uppercase text-pink-500 tracking-wider">
              👀 Révélation des formules secrètes :
            </p>
            <div className="grid grid-cols-2 gap-4 divide-x divide-pink-100">
              {/* Secret code P1 */}
              <div>
                <p className="font-bold mb-1.5 text-pink-600">{player1Name} (secret) :</p>
                <div className="flex justify-center gap-1">
                  {secretCodeP1.map((p, i) => (
                    <span key={i} className="text-xl" title={p.name}>{p.emoji}</span>
                  ))}
                </div>
              </div>

              {/* Secret code P2 */}
              <div className="pl-2">
                <p className="font-bold mb-1.5 text-indigo-900">{player2Name} (secret) :</p>
                <div className="flex justify-center gap-1">
                  {secretCodeP2.map((p, i) => (
                    <span key={i} className="text-xl" title={p.name}>{p.emoji}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer Branding sticker */}
      <footer className="text-center mt-6 text-[10px] text-purple-700/60 font-semibold tracking-widest uppercase select-none z-10" id="footer-branding">
        🎈 Mastermind Kawaii • Fait avec amour 💌
      </footer>

      {activeWheelPlayer && (
        <MagicWheel
          playerName={activeWheelPlayer === 'P1' ? player1Name : player2Name}
          onSpinComplete={handleWheelOptionApplied}
          onClose={() => setActiveWheelPlayer(null)}
          isRotated={activeWheelPlayer === 'P2' && layoutMode === 'face-to-face'}
        />
      )}

    </div>
  );
}
