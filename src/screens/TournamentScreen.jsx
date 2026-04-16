import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, Plus, Trophy } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

export default function TournamentScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'tournaments'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.createdAt?.seconds ?? 0;
          const tb = b.createdAt?.seconds ?? 0;
          return tb - ta;
        });
        setItems(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const createTournament = async () => {
    if (!user) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'tournaments'), {
        name: `Tournament ${new Date().toLocaleDateString()}`,
        ownerId: user.uid,
        status: 'draft',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] px-6 pt-6 pb-32 max-w-[440px] mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black italic tracking-wider uppercase text-white">Tournaments</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Round-robin & brackets (beta)</p>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#e0f146]/15 border border-[#e0f146]/30 flex items-center justify-center">
          <LayoutGrid className="text-[#e0f146]" size={24} />
        </div>
      </div>

      <Motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={createTournament}
        disabled={creating || !user}
        className="w-full mb-8 py-4 rounded-2xl bg-gradient-to-r from-[#e0f146]/20 to-lime-500/10 border border-[#e0f146]/30 text-[#e0f146] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Plus size={18} /> {creating ? 'Creating…' : 'New tournament shell'}
      </Motion.button>

      <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
        <p className="text-[10px] font-bold text-indigo-300 leading-relaxed">
          Each tournament is a Firestore document. Link matches from the home feed by storing <code className="text-[#e0f146]">tournamentId</code> on
          matches in a future update. Bracket UI can plug into the same collection.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#e0f146] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 opacity-40">
          <Trophy size={48} className="mb-4 text-slate-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No tournaments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((t, i) => (
            <Motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-5 rounded-3xl bg-slate-800/30 border border-slate-700/50"
            >
              <p className="text-sm font-black italic uppercase text-white">{t.name}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Status: {t.status || 'draft'}</p>
            </Motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
