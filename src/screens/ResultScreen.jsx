import React, { useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useMatchStore } from '../store/useMatchStore';
import { Home, Medal, ChevronLeft, Link2, Copy, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ResultScreen() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { winner, resetMatch, team1, team2, subscribeToMatch } = useMatchStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (matchId && !matchId.startsWith('local-')) {
      const unsubscribe = subscribeToMatch(matchId);
      return () => unsubscribe && unsubscribe();
    }
  }, [matchId, subscribeToMatch]);

  const handleNewMatch = () => {
    resetMatch();
    navigate('/');
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !matchId) return '';
    return `${window.location.origin}/result/${matchId}`;
  }, [matchId]);

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const pageTitle = winner ? `${winner} wins · Result | Baddie Score` : 'Match result | Baddie Score';

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] px-6 pt-6 pb-32 max-w-[440px] mx-auto w-full">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={winner ? `${winner} won the match.` : 'Badminton match result'} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={winner ? `${team1?.name} vs ${team2?.name} — Winner: ${winner}` : 'Match result'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
      </Helmet>
      
      {/* Mini Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/')}
          className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[10px] font-black italic tracking-widest uppercase text-slate-500">Official Outcome</span>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <Motion.div 
        className="flex-1 flex flex-col justify-center items-center space-y-8 py-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      >
        <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-tr from-[#e0f146] to-lime-500 flex items-center justify-center shadow-[0_0_50px_rgba(224,241,70,0.3)] rotate-12">
          <Medal className="w-20 h-20 text-slate-900 -rotate-12" />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-xs font-black italic opacity-60 uppercase tracking-[0.3em] text-[#e0f146]">Champions</p>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase break-words px-4 leading-none">
             {winner || 'Finalizing...'}
          </h2>
        </div>

        <div className="w-full max-w-sm mt-8 bg-slate-800/20 border border-slate-700/30 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Trophy size={80} />
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex flex-col">
               <span className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-1">TEAM 1</span>
               <span className={`text-xl font-black italic uppercase tracking-wide ${winner === team1?.name ? 'text-[#e0f146]' : 'text-slate-400'}`}>
                 {team1?.name}
               </span>
            </div>
            <span className={`text-5xl font-black tabular-nums ${winner === team1?.name ? 'text-[#e0f146]' : 'text-slate-600'}`}>
              {team1?.sets}
            </span>
          </div>

          <div className="h-px bg-slate-700/50 w-full"></div>

          <div className="flex justify-between items-center relative z-10">
             <div className="flex flex-col">
                <span className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-1">TEAM 2</span>
                <span className={`text-xl font-black italic uppercase tracking-wide ${winner === team2?.name ? 'text-[#e0f146]' : 'text-slate-400'}`}>
                  {team2?.name}
                </span>
             </div>
             <span className={`text-5xl font-black tabular-nums ${winner === team2?.name ? 'text-[#e0f146]' : 'text-slate-600'}`}>
               {team2?.sets}
             </span>
          </div>
        </div>

      </Motion.div>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={copyShare}
          className="w-full py-5 bg-[#e0f146]/10 border border-[#e0f146]/30 rounded-3xl text-[#e0f146] font-black italic tracking-widest text-sm uppercase flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          <span>{copied ? 'Copied link' : 'Copy result link'}</span>
          <Link2 className="w-5 h-5 opacity-60" />
        </button>
        <button 
          onClick={handleNewMatch} 
          className="w-full py-5 bg-slate-800 border border-slate-700 rounded-3xl text-white font-black italic tracking-widest text-lg uppercase flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <Home className="w-6 h-6" />
          <span>Return Home</span>
        </button>
      </div>

    </div>
  );
}

const Trophy = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V18"/><path d="M14 22V18"/><path d="M12 15a7 7 0 0 0 7-7V4H5v4a7 7 0 0 0 7 7z"/></svg>
);
