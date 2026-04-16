import React, { useEffect, useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useMatchStore } from '../store/useMatchStore';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Activity, ArrowLeftRight } from 'lucide-react';

export default function ViewerScoreScreen() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { 
    team1, team2, currentSet, matchType,
    servingTeam,
    getServingDetails, subscribeToMatch, status,
    team1Cards, team2Cards, challengesRemaining, changeOfEndsDue, suspendReason
  } = useMatchStore();

  useEffect(() => {
    if (matchId) {
      const unsubscribe = subscribeToMatch(matchId);
      return () => unsubscribe && unsubscribe();
    }
  }, [matchId, subscribeToMatch]);

  const servingDetails = getServingDetails();
  const getAvatarLetter = (name) => name ? name.substring(0, 1).toUpperCase() : '?';

  const t1Name = matchType === 'singles' ? (team1?.players?.[0] || 'Player 1') : (team1?.name || 'Team 1');
  const t2Name = matchType === 'singles' ? (team2?.players?.[0] || 'Player 2') : (team2?.name || 'Team 2');

  const c1 = team1Cards || { yellow: 0, red: 0 };
  const c2 = team2Cards || { yellow: 0, red: 0 };
  const ch = challengesRemaining || { team1: 2, team2: 2 };

  const pageUrl = useMemo(() => (typeof window !== 'undefined' ? window.location.href : ''), []);
  const pageTitle = `${t1Name} vs ${t2Name} · Live | Baddie Score`;

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] text-white font-sans pb-32 max-w-[440px] mx-auto w-full">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Live score: ${t1Name} vs ${t2Name}`} />
        <meta property="og:title" content={`${t1Name} vs ${t2Name}`} />
        <meta property="og:description" content="Live badminton scores — Baddie Score" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
      </Helmet>

      {changeOfEndsDue && status === 'live' && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-3">
          <ArrowLeftRight className="text-amber-400 shrink-0" size={22} />
          <p className="text-[11px] font-bold text-amber-200/90 leading-snug">
            Change of ends — players should switch sides before the next rally.
          </p>
        </div>
      )}
      
      {/* Top Header */}
      <div className="flex justify-between items-start p-6 pb-2">
        <div>
          <button onClick={() => navigate('/')} className="mb-4 text-slate-400 hover:text-white transition-colors flex items-center gap-1">
             <ChevronLeft size={20} /> Back to Live Feed
          </button>
          <h1 className="text-rose-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
             LIVE MATCH {status === 'suspended' && '- PAUSED'}
             {suspendReason && status === 'suspended' && (
               <span className="text-amber-400 text-[10px] normal-case">({suspendReason})</span>
             )}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[#84cc16] font-bold text-xs tracking-wider uppercase">Real-time Score</p>
          <p className="text-slate-400 text-xs font-medium mt-1 uppercase">BWF System</p>
        </div>
      </div>

      {/* Players Profile Section */}
      <div className="flex flex-col items-center mt-6 px-6 relative">
         
         {/* Team 2 Profile */}
         <div className="flex flex-col items-center z-10">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold border-4 shadow-2xl ${servingTeam === 2 ? 'border-[#e0f146] shadow-[#e0f146]/20' : 'border-slate-700 bg-slate-800'}`}>
              {servingTeam === 2 ? (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#e0f146] to-lime-300 text-slate-900 flex items-center justify-center">
                  {getAvatarLetter(t2Name)}
                </div>
              ) : (
                <span className="text-slate-500">{getAvatarLetter(t2Name)}</span>
              )}
            </div>
            <h2 className="mt-4 text-3xl font-black italic tracking-wider uppercase drop-shadow-md text-center max-w-[280px] break-words leading-tight">{t2Name}</h2>
            <p className="text-[#e0f146] font-bold tracking-widest text-sm mt-1 uppercase">{matchType === 'doubles' ? 'Away Team' : 'Away Side'}</p>
            
            {servingTeam === 2 && (
              <div className="mt-4 px-4 py-1.5 bg-[#e0f146] text-slate-900 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#e0f146]/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                CURRENTLY SERVING
              </div>
            )}
         </div>

         {/* VS Indicator */}
         <div className="my-8 relative flex items-center justify-center w-full">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700/50"></div></div>
            <div className="relative z-10 flex flex-col items-center">
               <span className="text-6xl font-black text-slate-800/80 italic -mb-6 leading-none select-none">VS</span>
               <div className="px-6 py-2 bg-[#e0f146] text-slate-900 font-black italic rounded-full text-lg z-10 border-4 border-[#0b1120]">
                  GAME {currentSet}
               </div>
            </div>
         </div>

         {/* Team 1 Profile */}
         <div className="flex flex-col items-center z-10">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold border-4 shadow-2xl transition-all ${servingTeam === 1 ? 'border-[#e0f146] shadow-[#e0f146]/20' : 'border-slate-700 bg-slate-800'}`}>
              {servingTeam === 1 ? (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#e0f146] to-lime-300 text-slate-900 flex items-center justify-center">
                  {getAvatarLetter(t1Name)}
                </div>
              ) : (
                <span className="text-slate-500">{getAvatarLetter(t1Name)}</span>
              )}
            </div>
            <h2 className="mt-4 text-3xl font-black italic tracking-wider uppercase drop-shadow-md text-center max-w-[280px] break-words leading-tight">{t1Name}</h2>
            <p className="text-slate-400 font-bold tracking-widest text-sm mt-1 uppercase">{matchType === 'doubles' ? 'Home Team' : 'Home Side'}</p>
            
            {servingTeam === 1 && (
              <div className="mt-4 px-4 py-1.5 bg-[#e0f146] text-slate-900 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#e0f146]/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                CURRENTLY SERVING
              </div>
            )}
         </div>

      </div>

      <div className="px-6 mt-6 grid grid-cols-2 gap-3 text-center">
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Team 1</p>
          <p className="text-[10px] font-bold text-amber-400">Y {c1.yellow} · R {c1.red}</p>
          <p className="text-[9px] text-slate-500 mt-1">Challenges left: {ch.team1}</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Team 2</p>
          <p className="text-[10px] font-bold text-amber-400">Y {c2.yellow} · R {c2.red}</p>
          <p className="text-[9px] text-slate-500 mt-1">Challenges left: {ch.team2}</p>
        </div>
      </div>

      {/* Huge Vertical Scores */}
      <div className="mt-10 w-full max-w-sm mx-auto px-6 bg-[#0f172a]/50 py-10 rounded-3xl border border-slate-700/30">
          <div className="flex flex-col items-center">
             <Motion.span 
               key={team2.score}
               initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className={`text-9xl font-black leading-none drop-shadow-xl ${servingTeam === 2 ? 'text-[#e0f146]' : 'text-slate-200'}`}
             >
               {team2.score}
             </Motion.span>
             <span className="text-[#84cc16] font-bold tracking-[0.3em] uppercase text-xs mt-4">Points</span>
          </div>

          <div className="w-full h-px border-t border-slate-700/50 my-10"></div>

          <div className="flex flex-col items-center">
             <Motion.span 
               key={team1.score}
               initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className={`text-9xl font-black leading-none drop-shadow-xl ${servingTeam === 1 ? 'text-[#e0f146]' : 'text-slate-200'}`}
             >
               {team1.score}
             </Motion.span>
             <span className="text-slate-500 font-bold tracking-[0.3em] uppercase text-xs mt-4">Points</span>
          </div>
      </div>

      {/* Court Orientation Mini Map */}
      {status !== 'suspended' && (
        <div className="mt-12 px-6 max-w-lg mx-auto w-full mb-12">
          <div className="flex justify-between items-center mb-4">
             <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Court<br/>Orientation</span>
             <span className="text-[#e0f146] font-bold uppercase tracking-wider text-right text-xs flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#e0f146]"></span>
               {servingDetails.serverName}<br/>Serving
             </span>
          </div>

          <div className="w-full aspect-[2/1] bg-[#0b1120] border-2 border-slate-700 rounded-sm relative flex shadow-2xl p-0.5 box-border">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#e0f146] shadow-[0_0_8px_#e0f146] -translate-x-1/2 z-10"></div>
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ preserveAspectRatio: 'none' }}>
               <path d={servingTeam === 1 
                  ? (servingDetails.serveSidePos === 1 ? "M 25% 75% Q 50% 25% 75% 25%" : "M 25% 25% Q 50% 75% 75% 75%") 
                  : (servingDetails.serveSidePos === 1 ? "M 75% 75% Q 50% 25% 25% 25%" : "M 75% 25% Q 50% 75% 25% 75%")} 
                 stroke="#e0f146" strokeWidth="2" strokeDasharray="6,6" fill="none" opacity="0.4" 
               />
            </svg>

            <div className="flex-1 border-r border-[#e0f146]/50 relative">
               <div className="absolute top-0 bottom-0 right-0 w-12 border-l border-slate-700"></div>
               <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700"></div>
               <div className={`absolute ${servingTeam === 1 && servingDetails.serveSidePos === 1 ? 'bottom-1/4' : 'top-1/4'} left-1/4 -translate-x-1/2 -translate-y-1/2`}>
                 <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${servingTeam === 1 ? 'border-[#e0f146] text-[#e0f146]' : 'border-slate-500 text-slate-500'}`}>
                   {getAvatarLetter(t1Name)}
                 </div>
               </div>
            </div>

            <div className="flex-1 relative">
               <div className="absolute top-0 bottom-0 left-0 w-12 border-r border-slate-700"></div>
               <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700"></div>
               <div className={`absolute ${servingTeam === 2 && servingDetails.serveSidePos === 1 ? 'bottom-1/4' : 'top-1/4'} right-1/4 translate-x-1/2 -translate-y-1/2`}>
                 <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${servingTeam === 2 ? 'border-[#e0f146] text-[#e0f146]' : 'border-slate-500 text-slate-500'}`}>
                   {getAvatarLetter(t2Name)}
                 </div>
               </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
             <span>Home Side</span>
             <span>Away Side</span>
          </div>
        </div>
      )}

      {status === 'suspended' && (
        <div className="mt-12 px-6 flex flex-col items-center">
           <div className="p-12 bg-amber-500/10 border border-amber-500/30 rounded-3xl text-center w-full">
              <Activity className="text-amber-500 mx-auto mb-4" size={48} />
              <h3 className="text-[#e0f146] font-black italic tracking-widest text-xl uppercase mb-2">Match Suspended</h3>
              <p className="text-slate-400 font-medium text-sm">Waiting for umpire to resume the match (Rain/Injury delay).</p>
           </div>
        </div>
      )}

    </div>
  );
}
