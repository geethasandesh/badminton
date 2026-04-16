import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Trophy, Calendar, Hash, Download } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch matches and filter in memory to avoid "Missing Index" errors
    const q = query(
      collection(db, 'matches'),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const finishedOnly = allMatches.filter(m => m.status === 'finished');
      setHistory(finishedOnly);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in History:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const downloadCsv = () => {
    if (history.length === 0) return;
    const headers = ['matchId', 'matchType', 'team1', 'team2', 'team1_sets', 'team2_sets', 'winner', 'lastUpdated'];
    const rows = history.map((m) => [
      m.id,
      m.matchType || '',
      m.team1?.name || '',
      m.team2?.name || '',
      m.team1?.sets ?? '',
      m.team2?.sets ?? '',
      m.winner || '',
      m.lastUpdated?.toDate ? m.lastUpdated.toDate().toISOString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baddie-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] px-6 pt-6 pb-32 max-w-[440px] mx-auto w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate('/')}
             className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400"
           >
             <ChevronLeft size={20} />
           </button>
           <h1 className="text-3xl font-black italic tracking-wider uppercase text-white">History</h1>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={loading || history.length === 0}
          className="w-10 h-10 rounded-full bg-[#e0f146]/10 border border-[#e0f146]/20 flex items-center justify-center disabled:opacity-30 text-[#e0f146]"
          title="Export CSV"
        >
           <Download size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
           <div className="w-10 h-10 border-4 border-[#e0f146] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 py-20">
           <Trophy size={64} className="text-slate-500" />
           <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No finished matches found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {history.map((match, i) => (
              <Motion.div 
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-800/20 border border-slate-700/30 rounded-3xl p-6 relative overflow-hidden group"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#e0f146]/5 rounded-bl-[100px] -mr-16 -mt-16 group-hover:bg-[#e0f146]/10 transition-all duration-500"></div>
                
                <div className="flex justify-between items-center mb-6 text-[10px] font-black italic tracking-widest text-slate-500 uppercase">
                   <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      {match.lastUpdated?.toDate ? match.lastUpdated.toDate().toLocaleDateString() : 'Recent'}
                   </div>
                   <div className="flex items-center gap-2">
                      <Hash size={12} />
                      {match.matchType}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${match.winner === match.team1.name ? 'bg-[#e0f146] text-black shadow-[0_0_15px_rgba(224,241,70,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                            {match.team1.name.substring(0, 2).toUpperCase()}
                         </div>
                         <span className={`text-lg font-black italic uppercase tracking-wide ${match.winner === match.team1.name ? 'text-white' : 'text-slate-500'}`}>
                            {match.team1.name}
                         </span>
                      </div>
                      <span className={`text-2xl font-black ${match.winner === match.team1.name ? 'text-[#e0f146]' : 'text-slate-600'}`}>
                         {match.team1.sets}
                      </span>
                   </div>

                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${match.winner === match.team2.name ? 'bg-[#e0f146] text-black shadow-[0_0_15px_rgba(224,241,70,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                            {match.team2.name.substring(0, 2).toUpperCase()}
                         </div>
                         <span className={`text-lg font-black italic uppercase tracking-wide ${match.winner === match.team2.name ? 'text-white' : 'text-slate-500'}`}>
                            {match.team2.name}
                         </span>
                      </div>
                      <span className={`text-2xl font-black ${match.winner === match.team2.name ? 'text-[#e0f146]' : 'text-slate-600'}`}>
                         {match.team2.sets}
                      </span>
                   </div>
                </div>

                {match.winner && (
                   <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-center gap-2">
                      <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-[0.2em]">Winner:</span>
                      <span className="text-[10px] font-black italic text-[#e0f146] uppercase tracking-[0.1em]">{match.winner}</span>
                   </div>
                )}
              </Motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
