import React, { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Trophy, Activity, PauseCircle, ChevronRight } from 'lucide-react';

const LiveFeedScreen = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Query for matches that are 'live' or 'suspended'
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['live', 'suspended'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMatches(matchesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching live matches:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] text-white px-6 pt-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-wider uppercase text-white">Live Matches</h1>
          <p className="text-slate-400 text-sm font-medium">Real-time tournament updates</p>
        </div>
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
           <Trophy className="text-[#e0f146]" size={24} />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
           <div className="w-10 h-10 border-4 border-[#e0f146] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
           <Activity size={64} className="text-slate-600 mb-4" />
           <p className="text-xl font-bold">No active matches</p>
           <p className="text-sm">Check back later for live scores.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {matches.map((match) => (
            <Motion.button
              key={match.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/viewer/${match.id}`)}
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 text-left relative overflow-hidden group"
            >
              {match.status === 'suspended' && (
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 text-black font-black text-[10px] tracking-widest rounded-bl-2xl flex items-center gap-1.5">
                   <PauseCircle size={14} /> ON HOLD
                </div>
              )}
              {match.status === 'live' && (
                <div className="absolute top-4 right-6 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                   <span className="text-rose-500 font-black text-[10px] tracking-widest">LIVE</span>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team 1</span>
                  <span className="text-xl font-black italic tracking-wide text-white uppercase">{match.team1.name}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-4xl font-black text-[#e0f146] tabular-nums">{match.team1.score}</span>
                </div>
              </div>

              <div className="w-full h-px bg-slate-700/30 mb-6"></div>

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team 2</span>
                  <span className="text-xl font-black italic tracking-wide text-white uppercase">{match.team2.name}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-4xl font-black text-slate-300 tabular-nums">{match.team2.score}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-[10px] font-bold tracking-widest">
                 <div className="flex items-center gap-4">
                    <span className="text-slate-500">SET {match.currentSet}</span>
                    <span className="text-[#84cc16]">{match.matchType.toUpperCase()}</span>
                 </div>
                 <div className="flex items-center text-[#e0f146] opacity-0 group-hover:opacity-100 transition-opacity">
                    WATCH LIVE <ChevronRight size={14} />
                 </div>
              </div>
            </Motion.button>
          ))}
        </div>
      )}
      
      {!loading && (
        <div className="mt-12 p-6 bg-slate-800/20 border border-slate-700/30 rounded-3xl text-center">
           <p className="text-slate-400 text-sm font-medium">Want to umpire a match?</p>
           <button 
             onClick={() => navigate('/auth')}
             className="mt-4 text-[#e0f146] font-black italic tracking-widest border-b-2 border-[#e0f146] pb-1 hover:text-white hover:border-white transition-all uppercase text-sm"
           >
             Sign In as Admin
           </button>
        </div>
      )}
    </div>
  );
};

export default LiveFeedScreen;
