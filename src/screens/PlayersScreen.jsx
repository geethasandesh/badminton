import React, { useEffect, useState, useMemo, useDeferredValue } from 'react';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { User, Shield, ChevronRight, UserPlus, Users, Search } from 'lucide-react';

const uniq = (arr) => [...new Set(arr.filter(Boolean))];

function buildStatsFromMatches(matches) {
  const stats = {};
  const add = (name, won) => {
    if (!name) return;
    if (!stats[name]) stats[name] = { wins: 0, losses: 0, played: 0 };
    stats[name].played += 1;
    if (won) stats[name].wins += 1;
    else stats[name].losses += 1;
  };

  for (const m of matches) {
    if (m.status !== 'finished' || !m.winner || !m.team1 || !m.team2) continue;
    const side1Won = m.winner === m.team1.name;
    const side2Won = m.winner === m.team2.name;
    const names1 = uniq([m.team1.name, ...(m.team1.players || [])]);
    const names2 = uniq([m.team2.name, ...(m.team2.players || [])]);
    names1.forEach((n) => add(n, side1Won));
    names2.forEach((n) => add(n, side2Won));
  }
  return stats;
}

export default function PlayersScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchStats, setMatchStats] = useState({});
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    // Fetch all registered players from Firestore
    const q = query(
      collection(db, 'users'),
      orderBy('displayName', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in Players:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('lastUpdated', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMatchStats(buildStatsFromMatches(all));
      },
      (e) => console.error('matches stats', e)
    );
    return () => unsub();
  }, []);

  const filteredPlayers = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    if (!term) return players;

    return players.filter((p) => {
      const name = (p.displayName || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [players, deferredSearchTerm]);

  const avgWinRate = useMemo(() => {
    const vals = Object.values(matchStats).filter((s) => s.played > 0);
    if (vals.length === 0) return null;
    const sum = vals.reduce((a, s) => a + s.wins / s.played, 0);
    return Math.round((sum / vals.length) * 100);
  }, [matchStats]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] px-6 pt-6 pb-32 max-w-[440px] mx-auto w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-3xl font-black italic tracking-wider uppercase text-white">Registry</h1>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 italic">
              Official Player Database
           </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#e0f146] text-slate-900 flex items-center justify-center shadow-[0_0_20px_rgba(224,241,70,0.3)]">
           <Users size={24} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
         <input 
           type="text" 
           placeholder="Search Official Registry..." 
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           autoComplete="off"
           spellCheck={false}
           className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-[#e0f146]/50 transition-all"
         />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
           <div className="w-10 h-10 border-4 border-[#e0f146] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 py-20">
           <div className="p-8 bg-slate-800/30 rounded-full">
              <UserPlus size={48} className="text-slate-500" />
           </div>
           <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">No players found in registry</p>
        </div>
      ) : (
        <div className="space-y-4">
           {filteredPlayers.map((player) => (
              <div 
                key={player.id}
                className="bg-slate-800/10 border border-slate-700/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-slate-800/30 transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[#e0f146] font-black italic shadow-inner group-hover:border-[#e0f146]/30 transition-all">
                       {(player.displayName || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                       <h3 className="text-sm font-black italic tracking-wide uppercase text-white">{player.displayName || 'Unknown Player'}</h3>
                       <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Shield size={10} className="text-indigo-500" />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                             {player.email?.includes('test.com') ? 'Seed Account' : 'Verified Player'}
                          </span>
                          {matchStats[player.displayName] && (
                            <span className="text-[9px] font-black text-[#e0f146]/80 uppercase">
                              {matchStats[player.displayName].wins}W · {matchStats[player.displayName].losses}L
                              {matchStats[player.displayName].played > 0 && (
                                <span className="text-slate-500 ml-1">
                                  ({Math.round((matchStats[player.displayName].wins / matchStats[player.displayName].played) * 100)}%)
                                </span>
                              )}
                            </span>
                          )}
                       </div>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-700 group-hover:text-[#e0f146] transition-colors" />
              </div>
           ))}
        </div>
      )}

      {/* Stats Summary Footer */}
      {!loading && players.length > 0 && (
         <div className="mt-10 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black italic tracking-[0.2em] text-indigo-400 uppercase">
               <span>Total Registered</span>
               <span>{players.length} Players</span>
            </div>
            {avgWinRate != null && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Avg win rate (registered names in results): {avgWinRate}%
              </p>
            )}
         </div>
      )}

    </div>
  );
}
