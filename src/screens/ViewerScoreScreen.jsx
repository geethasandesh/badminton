import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useMatchStore } from '../store/useMatchStore';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ArrowLeftRight } from 'lucide-react';

export default function ViewerScoreScreen() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const {
    team1, team2, currentSet, matchType, pointsToWin,
    servingTeam,
    getServingDetails, subscribeToMatch, status,
    officiatingMode, team1Cards, team2Cards, challengesRemaining, changeOfEndsDue, suspendReason,
  } = useMatchStore();

  useEffect(() => {
    if (matchId) {
      const unsubscribe = subscribeToMatch(matchId);
      return () => unsubscribe && unsubscribe();
    }
  }, [matchId, subscribeToMatch]);

  const servingDetails = getServingDetails();
  const getAvatarLetter = (name) => (name ? name.substring(0, 1).toUpperCase() : '?');
  const t1Name = matchType === 'singles' ? (team1?.players?.[0] || 'Player 1') : (team1?.name || 'Team 1');
  const t2Name = matchType === 'singles' ? (team2?.players?.[0] || 'Player 2') : (team2?.name || 'Team 2');

  const c1 = team1Cards || { yellow: 0, red: 0 };
  const c2 = team2Cards || { yellow: 0, red: 0 };
  const ch = challengesRemaining || { team1: 2, team2: 2 };
  const serviceLaneXClass = servingDetails.serveSidePos === 1 ? 'left-[68%]' : 'left-[32%]';
  const receiveLaneXClass = servingDetails.serveSidePos === 1 ? 'left-[32%]' : 'left-[68%]';
  const [liveToast, setLiveToast] = useState('');
  const [updates, setUpdates] = useState([]);
  const prevStateRef = useRef(null);

  const pageUrl = useMemo(() => (typeof window !== 'undefined' ? window.location.href : ''), []);
  const pageTitle = `${t1Name} vs ${t2Name} · Live | Baddie Score`;
  const totalPoints = (team1?.score || 0) + (team2?.score || 0);
  const team1WinRatio = totalPoints > 0 ? Math.round(((team1?.score || 0) / totalPoints) * 100) : 50;
  const team2WinRatio = totalPoints > 0 ? Math.round(((team2?.score || 0) / totalPoints) * 100) : 50;
  const targetPoints = pointsToWin || 21;
  const t1Progress = Math.min(100, Math.round(((team1?.score || 0) / targetPoints) * 100));
  const t2Progress = Math.min(100, Math.round(((team2?.score || 0) / targetPoints) * 100));
  const lead = (team1?.score || 0) - (team2?.score || 0);
  const projectedWinner = lead === 0 ? 'Balanced' : lead > 0 ? t1Name : t2Name;

  const addUpdate = (message) => {
    const item = { id: `${Date.now()}-${Math.random()}`, message };
    setUpdates((prev) => [item, ...prev].slice(0, 4));
    setLiveToast(message);
  };

  useEffect(() => {
    const prev = prevStateRef.current;
    if (!prev) {
      prevStateRef.current = {
        t1Score: team1?.score || 0,
        t2Score: team2?.score || 0,
        servingTeam,
      };
      return;
    }

    const t1Score = team1?.score || 0;
    const t2Score = team2?.score || 0;

    if (t1Score > prev.t1Score) addUpdate(`${t1Name.toUpperCase()} gained a point`);
    if (t2Score > prev.t2Score) addUpdate(`${t2Name.toUpperCase()} gained a point`);
    if (servingTeam !== prev.servingTeam) {
      addUpdate(`${(servingTeam === 1 ? t1Name : t2Name).toUpperCase()} is serving`);
    }

    prevStateRef.current = { t1Score, t2Score, servingTeam };
  }, [team1?.score, team2?.score, servingTeam, t1Name, t2Name]);

  useEffect(() => {
    if (!liveToast) return;
    const t = setTimeout(() => setLiveToast(''), 2400);
    return () => clearTimeout(t);
  }, [liveToast]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] text-white font-sans pb-4 max-w-[440px] mx-auto w-full">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Live score: ${t1Name} vs ${t2Name}`} />
        <meta property="og:title" content={`${t1Name} vs ${t2Name}`} />
        <meta property="og:description" content="Live badminton scores — Baddie Score" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
      </Helmet>

      {changeOfEndsDue && status === 'live' && (
        <div className="mx-4 mt-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-2">
          <ArrowLeftRight className="text-amber-400 shrink-0" size={16} />
          <p className="text-[10px] font-bold text-amber-200/90">Change of ends before next rally.</p>
        </div>
      )}

      <div className="px-4 pt-2 pb-1 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold uppercase">
            <ChevronLeft size={14} /> Back
          </button>
          <h1 className="text-rose-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            LIVE {status === 'suspended' ? 'PAUSED' : 'MATCH'}
          </h1>
          <span className="text-slate-500 text-[9px] font-bold uppercase">Set {currentSet}</span>
        </div>

        <div className="space-y-2">
          <div className="p-2 bg-slate-800/25 border border-slate-700/40 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-black uppercase ${servingTeam === 1 ? 'text-[#e0f146]' : 'text-white'}`}>{t1Name}</p>
                <p className="text-[8px] text-slate-500 uppercase">Sets {team1?.sets ?? 0}</p>
              </div>
              <Motion.span
                key={team1.score}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-4xl font-black tabular-nums ${servingTeam === 1 ? 'text-[#e0f146]' : 'text-slate-300'}`}
              >
                {team1.score}
              </Motion.span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Court Orientation</span>
              <span className="text-[#e0f146] font-bold uppercase tracking-wider text-[9px] text-right flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e0f146]"></span>
                {(servingDetails?.serverName || 'Player').toUpperCase()} SERVING
              </span>
            </div>
            <div className="w-[192px] h-[300px] mx-auto bg-[#0b1120] border border-slate-700 rounded-lg relative shadow-xl p-0.5 box-border overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-600/80 -translate-x-1/2"></div>
              <div className="absolute inset-x-0 top-1/2 h-[2px] bg-[#e0f146]/60 shadow-[0_0_8px_#e0f146] -translate-y-1/2"></div>
              <div className="absolute inset-x-[10%] top-[34%] h-[1px] bg-slate-600/80"></div>
              <div className="absolute inset-x-[10%] top-[66%] h-[1px] bg-slate-600/80"></div>
              <div className="absolute inset-y-[2%] left-[10%] w-[1px] bg-slate-700/70"></div>
              <div className="absolute inset-y-[2%] left-[90%] w-[1px] bg-slate-700/70 -translate-x-full"></div>

              <div className={`absolute ${servingTeam === 1 ? serviceLaneXClass : receiveLaneXClass} top-[20%] -translate-x-1/2 -translate-y-1/2`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold ${servingTeam === 1 ? 'border-[#e0f146] text-[#e0f146] bg-[#e0f146]/5' : 'border-slate-500 text-slate-500'}`}>
                  {getAvatarLetter(t1Name)}
                </div>
              </div>
              <div className={`absolute ${servingTeam === 2 ? serviceLaneXClass : receiveLaneXClass} top-[80%] -translate-x-1/2 -translate-y-1/2`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold ${servingTeam === 2 ? 'border-[#e0f146] text-[#e0f146] bg-[#e0f146]/5' : 'border-slate-500 text-slate-500'}`}>
                  {getAvatarLetter(t2Name)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 bg-slate-800/25 border border-slate-700/40 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-black uppercase ${servingTeam === 2 ? 'text-[#e0f146]' : 'text-white'}`}>{t2Name}</p>
                <p className="text-[8px] text-slate-500 uppercase">Sets {team2?.sets ?? 0}</p>
              </div>
              <Motion.span
                key={team2.score}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-4xl font-black tabular-nums ${servingTeam === 2 ? 'text-[#e0f146]' : 'text-slate-300'}`}
              >
                {team2.score}
              </Motion.span>
            </div>
          </div>
        </div>

        {officiatingMode === 'official' && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Team 1</p>
              <p className="text-[9px] font-bold text-amber-400">Y {c1.yellow} · R {c1.red} · Ch {ch.team1}</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Team 2</p>
              <p className="text-[9px] font-bold text-amber-400">Y {c2.yellow} · R {c2.red} · Ch {ch.team2}</p>
            </div>
          </div>
        )}

        <div className="mt-2 space-y-2">
          {liveToast && (
            <div className="p-2 rounded-xl bg-[#e0f146]/10 border border-[#e0f146]/30 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#e0f146]">
                {liveToast}
              </p>
            </div>
          )}

          <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-700/40">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Updates</p>
              <p className="text-[8px] text-slate-500 uppercase">Viewer Feed</p>
            </div>
            <div className="space-y-1">
              {(updates.length ? updates : [{ id: 'idle', message: 'Waiting for next rally update...' }]).map((u) => (
                <p key={u.id} className="text-[9px] font-bold text-slate-300">
                  {u.message}
                </p>
              ))}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-700/40">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match Insights</p>
              <p className="text-[8px] text-slate-500 uppercase">Point Win Ratio</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-center">
                <p className="text-[8px] text-slate-500 uppercase">{t1Name}</p>
                <p className="text-sm font-black text-[#e0f146]">{team1WinRatio}%</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-center">
                <p className="text-[8px] text-slate-500 uppercase">{t2Name}</p>
                <p className="text-sm font-black text-slate-300">{team2WinRatio}%</p>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-700/40">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Set Progress Graph</p>
              <p className="text-[8px] text-slate-500 uppercase">Race to {targetPoints}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <p className="text-[8px] text-slate-500 uppercase mb-1">{t1Name}</p>
                <div className="h-1.5 bg-slate-700/70 rounded overflow-hidden">
                  <div className="h-full bg-[#e0f146]" style={{ width: `${Math.max(3, t1Progress)}%` }} />
                </div>
                <p className="mt-1 text-[9px] font-black text-[#e0f146]">{t1Progress}%</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <p className="text-[8px] text-slate-500 uppercase mb-1">{t2Name}</p>
                <div className="h-1.5 bg-slate-700/70 rounded overflow-hidden">
                  <div className="h-full bg-slate-300" style={{ width: `${Math.max(3, t2Progress)}%` }} />
                </div>
                <p className="mt-1 text-[9px] font-black text-slate-300">{t2Progress}%</p>
              </div>
            </div>
            <p className="mt-2 text-[9px] text-slate-400">
              Live projection: <span className="font-black text-[#e0f146]">{projectedWinner}</span>
            </p>
          </div>
        </div>

        {status === 'suspended' && (
          <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-[10px] font-bold text-amber-300 uppercase text-center">
              Match Suspended{` ${suspendReason ? `- ${suspendReason}` : ''}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
