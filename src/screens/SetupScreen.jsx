import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/useMatchStore';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { History, Trophy, Users, User as UserIcon, Search, X, Check, Info } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const FORMAT_PRESETS = [
  { id: 'rally_21', label: 'BWF 21', points: 21, intervalSec: 60, capNote: 'Rally scoring to 21, win by 2. This app caps a game at 30 points (21 + 9).' },
  { id: 'rally_15', label: '15-point', points: 15, intervalSec: 60, capNote: 'Rally to 15, win by 2. Cap in this app: points-to-win + 9 (e.g. 24).' },
  { id: 'rally_11', label: '11-point', points: 11, intervalSec: 60, capNote: 'Rally to 11, win by 2. Cap in this app: points-to-win + 9 (e.g. 20).' },
];

export default function SetupScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { startMatch } = useMatchStore();
  
  const [matchType, setMatchType] = useState('singles'); 
  const [points, setPoints] = useState(21);
  const [sets, setSets] = useState(2);
  const [formatPreset, setFormatPreset] = useState('rally_21');
  const [gameIntervalSec, setGameIntervalSec] = useState(60);
  
  // Players state - indices 0,1 for Singles, 0,1,2,3 for Doubles
  const [players, setPlayers] = useState(['', '', '', '']);
  const [playerUids, setPlayerUids] = useState([null, null, null, null]);
  
  // Search state
  const [searchIndex, setSearchIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchIndex !== null && searchQuery.length >= 2) {
      const delayDebounceFn = setTimeout(async () => {
        setSearching(true);
        try {
          const q = query(
            collection(db, 'users'),
            where('displayName', '>=', searchQuery),
            where('displayName', '<=', searchQuery + '\uf8ff'),
            limit(5)
          );
          const snapshot = await getDocs(q);
          const results = snapshot.docs.map(doc => doc.data());
          setSearchResults(results);
        } catch (error) {
          console.error("Error searching users:", error);
        } finally {
          setSearching(false);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchIndex]);

  const selectPlayer = (index, pUser) => {
    const newPlayers = [...players];
    const newUids = [...playerUids];
    newPlayers[index] = pUser.displayName;
    newUids[index] = pUser.uid;
    setPlayers(newPlayers);
    setPlayerUids(newUids);
    setSearchIndex(null);
    setSearchQuery('');
  };

  const clearPlayer = (index) => {
    const newPlayers = [...players];
    const newUids = [...playerUids];
    newPlayers[index] = '';
    newUids[index] = null;
    setPlayers(newPlayers);
    setPlayerUids(newUids);
  };

  const applyPreset = (presetId) => {
    const p = FORMAT_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setFormatPreset(p.id);
    setPoints(p.points);
    setGameIntervalSec(p.intervalSec);
  };

  const handleStart = async () => {
    const activePlayers = matchType === 'singles' 
      ? [players[0] || 'Player 1', players[1] || 'Player 2'] 
      : [players[0] || 'T1-P1', players[1] || 'T1-P2', players[2] || 'T2-P1', players[3] || 'T2-P2'];
      
    await startMatch({
      matchType,
      players: activePlayers,
      pointsToWin: points,
      setsToWin: sets,
      formatPreset,
      gameIntervalSec,
    }, user?.uid);
    navigate('/live');
  };

  const PlayerSlot = ({ index, label }) => (
    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
           <input 
              type="text" 
              placeholder={label} 
              className={`w-full pl-4 pr-12 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#e0f146] transition-all
                ${players[index] ? 'border-[#e0f146]/50' : 'border-slate-700/50'}
              `}
              value={players[index]}
              onChange={(e) => {
                const newP = [...players];
                newP[index] = e.target.value;
                setPlayers(newP);
                setSearchIndex(index);
                setSearchQuery(e.target.value);
              }}
              onFocus={() => setSearchIndex(index)}
           />
           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
             {players[index] ? (
               <button 
                 onClick={() => clearPlayer(index)}
                 className="text-slate-500 hover:text-white"
               >
                 <X size={16} />
               </button>
             ) : (
               <button 
                 onClick={() => selectPlayer(index, { displayName: user?.displayName || 'Me', uid: user?.uid })}
                 className="text-[10px] font-black italic text-[#e0f146] bg-[#e0f146]/10 px-2 py-1 rounded-lg border border-[#e0f146]/20 hover:bg-[#e0f146]/20 transition-all uppercase"
               >
                 Me
               </button>
             )}
           </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playerUids[index] ? 'bg-[#e0f146] text-black' : 'bg-slate-800 text-slate-600'}`}>
           {playerUids[index] ? <Check size={20} /> : <UserIcon size={20} />}
        </div>
      </div>
      
      {/* Search Dropdown Overlay */}
      <AnimatePresence>
        {searchIndex === index && searchQuery.length >= 2 && (
          <Motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-12 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {searching ? (
               <div className="p-4 text-center text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Searching Registration...</div>
            ) : searchResults.length > 0 ? (
               searchResults.map((u) => (
                  <button 
                    key={u.uid}
                    onClick={() => selectPlayer(index, u)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-slate-700 text-left border-b border-slate-700/50 last:border-0"
                  >
                     <div className="w-8 h-8 rounded-full bg-[#e0f146] text-black flex items-center justify-center font-bold text-xs uppercase">
                        {u.displayName.substring(0, 2)}
                     </div>
                     <div>
                        <p className="text-white font-bold text-sm">{u.displayName}</p>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Registered User</p>
                     </div>
                  </button>
               ))
            ) : (
               <div className="p-4 text-center text-xs text-slate-500 font-bold uppercase tracking-widest italic">No player found. Creating new.</div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-[#0b1120] px-6 pt-6 pb-32"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-3xl font-black italic tracking-wider uppercase text-white">Setup Match</h1>
           <p className="text-slate-400 text-sm font-medium">BWF Official Ruleset</p>
        </div>
        <button 
          onClick={() => navigate('/history')}
          className="p-3 rounded-full bg-slate-800 border border-slate-700 text-[#e0f146]"
        >
          <History size={24} />
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Match Type */}
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-3xl p-6">
           <label className="block text-[10px] font-black italic tracking-[0.2em] text-slate-500 uppercase mb-4">Select Format</label>
           <div className="flex bg-[#0b1120] rounded-2xl p-1.5 border border-slate-700/50">
             <button 
               onClick={() => setMatchType('singles')}
               className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black italic tracking-widest uppercase transition-all ${
                 matchType === 'singles' ? 'bg-[#e0f146] text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'
               }`}
             >
               <UserIcon size={18} /> Singles
             </button>
             <button 
               onClick={() => setMatchType('doubles')}
               className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black italic tracking-widest uppercase transition-all ${
                 matchType === 'doubles' ? 'bg-[#e0f146] text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'
               }`}
             >
               <Users size={18} /> Doubles
             </button>
           </div>
        </div>

        {/* Player Selection */}
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-3xl p-6">
           <label className="block text-[10px] font-black italic tracking-[0.2em] text-slate-500 uppercase mb-4">Registration Search</label>
           <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mb-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-relaxed">
                 Type a name to search existing registered players in the database.
              </div>
              
              <div className="space-y-6">
                 <div>
                    <span className="block text-[9px] font-black italic text-slate-600 uppercase mb-2 ml-1">Home Team</span>
                    <div className="space-y-3">
                       <PlayerSlot index={0} label="Player 1 Name / Search..." />
                       {matchType === 'doubles' && <PlayerSlot index={1} label="Player 2 Name / Search..." />}
                    </div>
                 </div>

                 <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/50"></div>
                    <span className="relative z-10 px-4 bg-[#0b1120] text-[10px] font-black italic text-slate-700 uppercase">Opponents</span>
                 </div>

                 <div>
                    <span className="block text-[9px] font-black italic text-slate-600 uppercase mb-2 ml-1">Away Team</span>
                    <div className="space-y-3">
                       <PlayerSlot index={matchType === 'singles' ? 1 : 2} label={matchType === 'singles' ? "Player 2 Name..." : "Player 3 Name..."} />
                       {matchType === 'doubles' && <PlayerSlot index={3} label="Player 4 Name..." />}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Format presets (BWF-style) */}
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-3xl p-6 mb-4">
           <label className="block text-[10px] font-black italic tracking-[0.2em] text-slate-500 uppercase mb-4">Rally format</label>
           <div className="grid grid-cols-3 gap-2 mb-4">
              {FORMAT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className={`py-3 rounded-xl text-[10px] font-black italic uppercase tracking-tight border transition-all ${
                    formatPreset === p.id ? 'bg-[#e0f146] text-slate-900 border-[#e0f146]' : 'bg-[#0b1120] text-slate-400 border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
           </div>
           <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3">
              <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-indigo-200/90 leading-relaxed">
                {FORMAT_PRESETS.find((x) => x.id === formatPreset)?.capNote}
              </p>
           </div>
           <p className="mt-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Between-game interval (info): {gameIntervalSec}s — umpire can run the timer on the live board.
           </p>
        </div>

        {/* scoring Format */}
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-3xl p-6 mb-4">
           <label className="block text-[10px] font-black italic tracking-[0.2em] text-slate-500 uppercase mb-4">Match Config</label>
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <span className="text-sm font-bold text-white uppercase italic tracking-widest">Points to Win</span>
                 <div className="flex gap-2">
                    {[11, 15, 21].map(v => (
                      <button 
                        key={v} onClick={() => setPoints(v)}
                        className={`w-10 h-10 rounded-xl font-black italic text-sm transition-all border ${points === v ? 'bg-[#e0f146] text-slate-900 border-[#e0f146]' : 'bg-[#0b1120] text-slate-500 border-slate-700'}`}
                      >
                         {v}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-bold text-white uppercase italic tracking-widest">Sets Format</span>
                 <div className="flex gap-2">
                    {[1, 2, 3].map(v => (
                       <button 
                         key={v} onClick={() => setSets(v)}
                         className={`px-4 h-10 rounded-xl font-black italic text-[10px] uppercase tracking-tighter transition-all border ${sets === v ? 'bg-[#e0f146] text-slate-900 border-[#e0f146]' : 'bg-[#0b1120] text-slate-500 border-slate-700'}`}
                       >
                          {v === 1 ? '1 Set' : v === 2 ? 'Best of 3' : 'Best of 5'}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>

      <div className="mt-8">
        <button 
          onClick={handleStart} 
          className="w-full py-5 bg-gradient-to-r from-[#e0f146] to-lime-500 rounded-3xl text-slate-900 font-black italic tracking-widest text-xl uppercase shadow-2xl shadow-lime-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span>Start Match</span>
          <Trophy size={24} />
        </button>
      </div>

    </Motion.div>
  );
}
