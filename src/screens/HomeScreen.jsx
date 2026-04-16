import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebase';
import { collection, onSnapshot, orderBy, limit, addDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useMatchStore } from '../store/useMatchStore';
import { 
  Trophy, 
  Activity, 
  PlusCircle, 
  History as HistoryIcon, 
  User, 
  ChevronRight, 
  CircleDot,
  ArrowUpRight,
  MonitorPlay
} from 'lucide-react';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

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

  const handleSeedData = async () => {
    if (!user) {
      alert("Please sign in first to seed data.");
      return;
    }
    setSeeding(true);
    try {
      // 1. Seed Players
      const players = [
        { uid: 'seed-1', displayName: 'Viktor Axelsen', email: 'viktor@bwf.com' },
        { uid: 'seed-2', displayName: 'Loh Kean Yew', email: 'loh@bwf.com' },
        { uid: 'seed-3', displayName: 'Kento Momota', email: 'kento@bwf.com' },
        { uid: 'seed-4', displayName: 'Lee Zii Jia', email: 'lee@bwf.com' },
        { uid: 'seed-5', displayName: 'Anders Antonsen', email: 'anders@bwf.com' },
        { uid: 'seed-6', displayName: 'An Se-young', email: 'an@bwf.com' },
        { uid: 'seed-7', displayName: 'Akane Yamaguchi', email: 'akane@bwf.com' },
        { uid: 'seed-8', displayName: 'Tai Tzu-ying', email: 'tai@bwf.com' },
      ];

      const usersCol = collection(db, 'users');
      const playerSnap = await getDocs(query(usersCol, limit(1)));
      if (playerSnap.empty) {
        for (const p of players) await addDoc(usersCol, p);
      }

      // 2. Seed Matches
      const matchesCol = collection(db, 'matches');
      
      const fakeMatches = [
        {
          matchType: 'singles', status: 'finished', currentSet: 2, umpireId: 'seed-admin',
          team1: { name: 'Viktor Axelsen', score: 21, sets: 2, players: ['Viktor Axelsen'] },
          team2: { name: 'Kento Momota', score: 18, sets: 0, players: ['Kento Momota'] },
          winner: 'Viktor Axelsen', lastUpdated: serverTimestamp(), pointsToWin: 21, setsToWin: 2
        },
        {
          matchType: 'singles', status: 'finished', currentSet: 3, umpireId: 'seed-admin',
          team1: { name: 'Loh Kean Yew', score: 21, sets: 2, players: ['Loh Kean Yew'] },
          team2: { name: 'Lee Zii Jia', score: 23, sets: 1, players: ['Lee Zii Jia'] },
          winner: 'Loh Kean Yew', lastUpdated: serverTimestamp(), pointsToWin: 21, setsToWin: 2
        },
        {
          matchType: 'doubles', status: 'finished', currentSet: 2, umpireId: 'seed-admin',
          team1: { name: 'Alfian/Ardianto', score: 21, sets: 2, players: ['Alfian', 'Ardianto'] },
          team2: { name: 'Chia/Soh', score: 19, sets: 0, players: ['Chia', 'Soh'] },
          winner: 'Alfian/Ardianto', lastUpdated: serverTimestamp(), pointsToWin: 21, setsToWin: 2
        },
        {
          matchType: 'singles', status: 'finished', currentSet: 2, umpireId: 'seed-admin',
          team1: { name: 'An Se-young', score: 21, sets: 2, players: ['An Se-young'] },
          team2: { name: 'Akane Yamaguchi', score: 15, sets: 0, players: ['Akane Yamaguchi'] },
          winner: 'An Se-young', lastUpdated: serverTimestamp(), pointsToWin: 21, setsToWin: 2
        },
        {
          matchType: 'singles', status: 'finished', currentSet: 3, umpireId: 'seed-admin',
          team1: { name: 'Tai Tzu-ying', score: 19, sets: 1, players: ['Tai Tzu-ying'] },
          team2: { name: 'Chen Yufei', score: 21, sets: 2, players: ['Chen Yufei'] },
          winner: 'Chen Yufei', lastUpdated: serverTimestamp(), pointsToWin: 21, setsToWin: 2
        },
        {
          matchType: 'singles', status: 'live', currentSet: 1, umpireId: user.uid,
          team1: { name: 'Lakshya Sen', score: 14, sets: 0, players: ['Lakshya Sen'] },
          team2: { name: 'Jonatan Christie', score: 12, sets: 0, players: ['Jonatan Christie'] },
          servingTeam: 1, lastUpdated: serverTimestamp(), pointsToWin: 21, setsToWin: 2,
          team1Positions: [1, 0], team2Positions: [1, 0], history: []
        }
      ];

      for (const m of fakeMatches) await addDoc(matchesCol, m);
      alert("Success! Expanded history and live matches have been added to Firebase.");
    } catch (error) {
       console.error("Seeding error:", error);
       alert("Error seeding data. Check console.");
    } finally {
       setSeeding(false);
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
           <h1 className="text-2xl font-black italic tracking-wide uppercase">{user?.displayName || 'Badminton Fan'}</h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
           <User size={24} className="text-[#e0f146]" />
        </div>
      </div>

      <div className="mb-10">
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
          <div className="py-10 bg-slate-800/10 border border-slate-700/30 rounded-3xl flex flex-col items-center justify-center text-slate-500">
             <MonitorPlay size={32} className="mb-2 opacity-20" />
             <p className="text-[10px] font-bold uppercase tracking-widest">No matches currently live</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {liveMatches.map(match => (
              <Motion.button
                key={match.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMatchClick(match)}
                className="flex-shrink-0 w-64 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-left relative overflow-hidden"
              >
                 <div className="flex justify-between items-start mb-4">
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

      <div className="mb-10">
         <Motion.button 
           whileTap={{ scale: 0.97 }}
           onClick={() => navigate('/setup')}
           className="w-full py-10 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#e0f146]/20 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group"
         >
            <div className="absolute inset-0 bg-[#e0f146]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-[#e0f146] rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(224,241,70,0.3)]">
               <PlusCircle size={32} className="text-slate-900" />
            </div>
            <span className="text-2xl font-black italic tracking-[0.05em] uppercase text-white">Start New Match</span>
            <span className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Create a tournament match</span>
         </Motion.button>
      </div>

      {/* SYSTEM TOOLS: SEED DATA (Moved up for visibility) */}
      <div className="mb-10 p-6 bg-slate-800/20 border border-dashed border-slate-700/50 rounded-3xl">
         <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.2em]">System Developer Tools</p>
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            First time? Populate your database with 8 pro players and demo matches.
         </p>
         <button 
           onClick={handleSeedData}
           disabled={seeding}
           className="w-full py-4 bg-[#e0f146]/10 border border-[#e0f146]/20 rounded-2xl text-[10px] font-black italic tracking-widest uppercase text-[#e0f146] hover:bg-[#e0f146]/20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#e0f146]/5"
         >
            {seeding ? "POPULATING CLOUD..." : <>🚀 COMPREHENSIVE SEED <MonitorPlay size={14} /></>}
         </button>
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
