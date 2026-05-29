/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { setMuteState, getMuteState, playConfirm } from '../utils/audio';

export default function SoundToggle() {
  const [muted, setMuted] = useState(getMuteState());

  const handleToggle = () => {
    const newState = !muted;
    setMuted(newState);
    setMuteState(newState);
    if (!newState) {
      // play sound to let user know it's unmuted
      setTimeout(() => {
        playConfirm();
      }, 50);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative p-3 rounded-full border-2 transition-all duration-200 shadow-md flex items-center justify-center cursor-pointer active:scale-90 ${
        muted
          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-500'
          : 'bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-600'
      }`}
      title={muted ? 'Activer le son 🎵' : 'Couper le son 🔇'}
      aria-label="Toggle Sound"
      id="sound-toggle-btn"
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
    </button>
  );
}
