import React, { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { db } from '../config/firebase';
import { collection, onSnapshot, orderBy, limit, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useMatchStore } from '../store/useMatchStore';
import { 
  Trophy, 
  PlusCircle, 
  History as HistoryIcon, 
  User, 
  ChevronRight, 
  CircleDot,
  ArrowUpRight,
  LogOut
} from 'lucide-react';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();
  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';
  
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'matches'),
      orderBy('lastUpdated', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const live = allMatches.filter(m => m.status === 'live' || m.status === 'suspended');
      const finished = allMatches.filter(m => m.status === 'finished').slice(0, 5);
      setLiveMatches(live);
      setRecentMatches(finished);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const loggedOut = await logout();
    if (loggedOut) {
      navigate('/auth', { replace: true });
    }
  };

  const onMatchClick = async (match) => {
     // CRITICAL: Strict role-based navigation check
     const isUmpire = user && match.umpireId && match.umpireId === user.uid;
     
     if (isUmpire) {
        console.log("Navigating to Umpire Board for match:", match.id);
        await useMatchStore.getState().loadMatchForUmpire(match.id);
        navigate('/live');
     } else {
        console.log("Navigating to Viewer Board for match:", match.id);
        navigate(`/viewer/${match.id}`);
     }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] text-white px-6 pt-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Welcome back,</p>
           <h1 className="text-2xl font-black italic tracking-wide uppercase">{displayName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
             <User size={24} className="text-[#e0f146]" />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="h-12 px-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-xs font-black italic tracking-widest uppercase flex items-center gap-2">
              <CircleDot size={14} className="text-rose-500 animate-pulse" />
              Live Now
           </h2>
           {liveMatches.length > 0 && (
             <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">
               {liveMatches.length} ACTIVE
             </span>
           )}
        </div>

        {liveMatches.length === 0 ? (
          <div className="py-6 bg-slate-800/10 border border-slate-700/30 rounded-3xl flex flex-col items-center justify-center text-slate-500">
             <Trophy size={24} className="mb-2 opacity-30" />
             <p className="text-[10px] font-bold uppercase tracking-widest">No matches currently live</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {liveMatches.map(match => (
              <Motion.button
                key={match.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMatchClick(match)}
                className="flex-shrink-0 w-56 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3 text-left relative overflow-hidden"
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                       {match.status === 'live' ? 'Live' : 'Paused'}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">SET {match.currentSet || 1}</span>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black italic tracking-wide truncate max-w-[120px] uppercase">{match?.team1?.name || 'T1'}</span>
                       <span className="text-xl font-black text-[#e0f146]">{match?.team1?.score ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black italic tracking-wide truncate max-w-[120px] uppercase text-slate-400">{match?.team2?.name || 'T2'}</span>
                       <span className="text-xl font-black text-slate-500">{match?.team2?.score ?? 0}</span>
                    </div>
                 </div>

                 <div className="absolute bottom-0 right-0 p-2 bg-[#e0f146]/10 rounded-tl-2xl">
                    <ArrowUpRight size={14} className="text-[#e0f146]" />
                 </div>
              </Motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
         <Motion.button 
           whileTap={{ scale: 0.97 }}
           onClick={() => navigate('/setup')}
           className="w-full py-4 px-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#e0f146]/20 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group"
         >
            <div className="absolute inset-0 bg-[#e0f146]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-10 h-10 bg-[#e0f146] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(224,241,70,0.25)] shrink-0">
               <PlusCircle size={20} className="text-slate-900" />
            </div>
            <div className="text-left flex-1 ml-3">
              <span className="text-base font-black uppercase text-white block">Start New Match</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Create match quickly</span>
            </div>
            <ChevronRight size={16} className="text-[#e0f146] shrink-0" />
         </Motion.button>
      </div>

      <div>
         <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-black italic tracking-widest uppercase">Recent History</h2>
            <button onClick={() => navigate('/history')} className="text-[#e0f146] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
               VIEW ALL <ChevronRight size={12} />
            </button>
         </div>

         <div className="space-y-4">
            {loading ? (
               <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-slate-700 border-t-[#e0f146] rounded-full animate-spin"></div>
               </div>
            ) : recentMatches.length === 0 ? (
               <div className="py-12 bg-slate-800/10 border border-slate-700/30 border-dashed rounded-3xl flex flex-col items-center justify-center opacity-40">
                  <HistoryIcon size={32} className="mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No match history yet</p>
               </div>
            ) : (
               recentMatches.map(match => (
                  <div key={match.id} className="w-full bg-slate-800/20 border border-slate-700/20 rounded-2xl p-4 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                           <Trophy size={18} className="text-amber-500" />
                        </div>
                        <div>
                           <p className="text-xs font-black italic uppercase tracking-wider text-slate-200">
                             {match?.team1?.name || 'T1'} vs {match?.team2?.name || 'T2'}
                           </p>
                           <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                             Result: {Math.max(match?.team1?.score || 0, match?.team2?.score || 0)} - {Math.min(match?.team1?.score || 0, match?.team2?.score || 0)}
                           </p>
                        </div>
                     </div>
                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">FINISH</span>
                  </div>
               ))
            )}
         </div>
      </div>

    </div>
  );
};

export default HomeScreen;
