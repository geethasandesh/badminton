import React, { useEffect, useState, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useMatchStore } from '../store/useMatchStore';
import {
  RotateCcw,
  Timer,
  Flag,
  X,
  AlertTriangle,
  CloudRain,
  Activity,
  Stethoscope,
  ArrowLeftRight,
  Gavel,
  Swords,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

function TeamScoreCard({ team, teamIdx, isServing, setsToWin, status, addPoint }) {
  return (
    <div className="flex flex-col mb-6 mt-2 relative">
      {isServing && (
        <div className="absolute -top-3 left-0 px-3 py-1 bg-[#e0f146] text-slate-900 text-[9px] font-black tracking-widest rounded-tl-lg rounded-br-lg shadow-sm z-10">
          SERVING
        </div>
      )}
      <div className="flex justify-between items-start mb-2 px-1">
        <div>
          <h2 className={`text-2xl font-black italic tracking-wide uppercase ${isServing ? 'text-white' : 'text-slate-300'}`}>
            {team.name}
          </h2>
          <div className="flex gap-1 mt-1">
            {[...Array(setsToWin)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < team.sets ? 'bg-[#e0f146]' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sets Won</span>
          <div className="text-sm font-bold text-slate-300">{team.sets}</div>
        </div>
      </div>

      <div className="flex justify-center mb-6 mt-4">
        <Motion.span
          key={team.score}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-8xl tabular-nums font-black leading-none tracking-tighter drop-shadow-xl ${isServing ? 'text-[#e0f146]' : 'text-slate-400'}`}
        >
          {team.score}
        </Motion.span>
      </div>

      <button
        type="button"
        onClick={() => status === 'live' && addPoint(teamIdx)}
        disabled={status !== 'live'}
        className={`w-full py-4 rounded-2xl font-black text-lg tracking-widest uppercase items-center justify-center flex gap-2 transition-all active:scale-[0.98]
          ${isServing ? 'bg-[#e0f146] text-slate-900 shadow-[0_0_20px_rgba(224,241,70,0.3)] hover:bg-lime-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
          ${status !== 'live' ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span>+ POINT</span>
      </button>
    </div>
  );
}

export default function LiveScoreScreen() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const {
    team1,
    team2,
    currentSet,
    setsToWin,
    addPoint,
    undoPoint,
    winner,
    servingTeam,
    getServingDetails,
    status,
    updateStatus,
    matchId,
    subscribeToMatch,
    umpireId,
    changeOfEndsDue,
    gameIntervalSec,
    formatPreset,
    team1Cards,
    team2Cards,
    challengesRemaining,
    suspendReason,
    acknowledgeChangeOfEnds,
    addCard,
    recordChallenge,
  } = useMatchStore();

  const [matchTime, setMatchTime] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [intervalRemaining, setIntervalRemaining] = useState(null);

  useEffect(() => {
    if (matchId && !matchId.startsWith('local-')) {
      const unsubscribe = subscribeToMatch(matchId);
      return () => unsubscribe && unsubscribe();
    }
  }, [matchId, subscribeToMatch]);

  useEffect(() => {
    if (umpireId && authUser && umpireId !== authUser.uid) {
      navigate(`/viewer/${matchId}`);
    }
  }, [umpireId, authUser, matchId, navigate]);

  useEffect(() => {
    if (winner && matchId) {
      navigate(`/result/${matchId}`);
    }
  }, [winner, matchId, navigate]);

  useEffect(() => {
    let timer;
    if (status === 'live') {
      timer = setInterval(() => setMatchTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (intervalRemaining === null || intervalRemaining <= 0) return undefined;
    const t = setTimeout(() => {
      setIntervalRemaining((r) => {
        if (r === null || r <= 1) return 0;
        return r - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [intervalRemaining]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const servingDetails = getServingDetails();

  const handleStatusChange = (newStatus, reason = undefined) => {
    updateStatus(newStatus, reason);
    if (newStatus === 'finished') {
      navigate('/');
    }
    setShowOptions(false);
  };

  const startIntervalTimer = useCallback(() => {
    const sec = gameIntervalSec || 60;
    setIntervalRemaining(sec);
  }, [gameIntervalSec]);

  const cards1 = team1Cards || { yellow: 0, red: 0 };
  const cards2 = team2Cards || { yellow: 0, red: 0 };
  const ch = challengesRemaining || { team1: 2, team2: 2 };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1120] text-white pb-32 px-6 pt-4 relative max-w-[440px] mx-auto w-full">
      {changeOfEndsDue && status === 'live' && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-400">
            <ArrowLeftRight size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Change of ends</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 leading-relaxed">
            After each game, sides change ends (BWF). Confirm when players have changed.
          </p>
          <button
            type="button"
            onClick={() => acknowledgeChangeOfEnds()}
            className="py-3 rounded-xl bg-amber-500 text-slate-900 font-black text-xs uppercase tracking-widest"
          >
            Acknowledge change of ends
          </button>
        </div>
      )}

      {intervalRemaining !== null && intervalRemaining > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-[#e0f146]/10 border border-[#e0f146]/30 text-center">
          <p className="text-[10px] font-black text-[#e0f146] uppercase tracking-widest mb-1">Between-game interval</p>
          <p className="text-3xl font-black tabular-nums text-white">{formatTime(intervalRemaining)}</p>
          <button
            type="button"
            onClick={() => setIntervalRemaining(null)}
            className="mt-2 text-[9px] font-bold text-slate-500 uppercase"
          >
            Dismiss timer
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${status === 'live' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${status === 'live' ? 'text-[#60a5fa]' : 'text-amber-500'}`}>
            {status === 'suspended' ? 'MATCH PAUSED' : 'Live Scoreboard'}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-center">
            <span className="text-[10px] font-bold tracking-widest uppercase">
              Set {currentSet} / {setsToWin}
            </span>
          </div>
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{formatPreset?.replace('_', ' ')}</span>
        </div>
      </div>

      <TeamScoreCard
        team={team1}
        teamIdx={1}
        isServing={servingTeam === 1}
        setsToWin={setsToWin}
        status={status}
        addPoint={addPoint}
      />

      <div className="w-full aspect-[1/2] max-w-[200px] mx-auto bg-[#0b1120] border-2 border-slate-700 rounded-xl relative flex flex-col p-1 box-border shadow-2xl my-4 overflow-hidden">
        <div className="flex-1 border-b-2 border-slate-700 flex relative">
          <div
            className={`flex-1 border-r border-slate-700 relative ${
              servingTeam === 1 && servingDetails.serveSidePos === 1 ? 'bg-[#e0f146]/10' : ''
            }`}
          >
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                servingTeam === 1 && Math.abs(currentSet) % 2 !== 0 ? 'bg-[#e0f146] shadow-[0_0_8px_#e0f146]' : 'bg-slate-600'
              }`}
            ></div>
          </div>
          <div className={`flex-1 relative ${servingTeam === 1 && servingDetails.serveSidePos === 0 ? 'bg-[#e0f146]/10' : ''}`}>
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                servingTeam === 1 && Math.abs(currentSet) % 2 === 0 ? 'bg-[#e0f146] shadow-[0_0_8px_#e0f146]' : 'bg-slate-600'
              }`}
            ></div>
          </div>
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#e0f146]/50 shadow-[0_0_5px_#e0f146] -translate-y-1/2"></div>
        <div className="flex-1 flex relative">
          <div className={`flex-1 border-r border-slate-700 relative ${servingTeam === 2 && servingDetails.serveSidePos === 0 ? 'bg-[#e0f146]/10' : ''}`}>
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                servingTeam === 2 && Math.abs(currentSet) % 2 !== 0 ? 'bg-[#e0f146] shadow-[0_0_8px_#e0f146]' : 'bg-slate-600'
              }`}
            ></div>
          </div>
          <div className={`flex-1 relative ${servingTeam === 2 && servingDetails.serveSidePos === 1 ? 'bg-[#e0f146]/10' : ''}`}>
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                servingTeam === 2 && Math.abs(currentSet) % 2 === 0 ? 'bg-[#e0f146] shadow-[0_0_8px_#e0f146]' : 'bg-slate-600'
              }`}
            ></div>
          </div>
        </div>
      </div>

      <TeamScoreCard
        team={team2}
        teamIdx={2}
        isServing={servingTeam === 2}
        setsToWin={setsToWin}
        status={status}
        addPoint={addPoint}
      />

      <div className="grid grid-cols-2 gap-3 mb-4 text-[9px] font-black uppercase tracking-widest">
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
          <p className="text-slate-500 mb-2">Team 1 · cards</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(1, 'yellow')}
              className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-40"
            >
              Y {cards1.yellow}
            </button>
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(1, 'red')}
              className="flex-1 py-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 disabled:opacity-40"
            >
              R {cards1.red}
            </button>
            <button
              type="button"
              disabled={status !== 'live' || ch.team1 <= 0}
              onClick={() => recordChallenge(1)}
              className="flex-1 py-2 rounded-lg bg-slate-700 text-[#e0f146] border border-slate-600 disabled:opacity-40"
            >
              Ch {ch.team1}
            </button>
          </div>
        </div>
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
          <p className="text-slate-500 mb-2">Team 2 · cards</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(2, 'yellow')}
              className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-40"
            >
              Y {cards2.yellow}
            </button>
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(2, 'red')}
              className="flex-1 py-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 disabled:opacity-40"
            >
              R {cards2.red}
            </button>
            <button
              type="button"
              disabled={status !== 'live' || ch.team2 <= 0}
              onClick={() => recordChallenge(2)}
              className="flex-1 py-2 rounded-lg bg-slate-700 text-[#e0f146] border border-slate-600 disabled:opacity-40"
            >
              Ch {ch.team2}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 font-black uppercase italic tracking-widest text-[9px]">
        <button
          onClick={undoPoint}
          className="flex flex-col items-center justify-center p-3 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 text-[#60a5fa]"
        >
          <RotateCcw className="mb-1 w-5 h-5" />
          <span>Undo</span>
        </button>
        <button
          onClick={() => setShowOptions(true)}
          className="flex flex-col items-center justify-center p-3 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 text-[#e0f146]"
        >
          <Flag className="mb-1 w-5 h-5" />
          <span>Options</span>
        </button>
        <button
          type="button"
          onClick={startIntervalTimer}
          className="flex flex-col items-center justify-center p-3 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <Timer className="mb-1 w-5 h-5" />
          <span>Interval</span>
        </button>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-black italic tracking-widest uppercase">Match Data</h3>
          <span className="text-[9px] font-bold text-slate-500 uppercase">Automated</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800 rounded-xl flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
            <span className="text-sm font-black italic text-[#60a5fa]">{formatTime(matchTime)}</span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <span className={`text-sm font-black italic ${status === 'suspended' ? 'text-amber-500' : 'text-lime-500'}`}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>
        {status === 'suspended' && suspendReason && (
          <p className="mt-2 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest text-center">
            Reason: {suspendReason}
          </p>
        )}
      </div>

      <AnimatePresence>
        {showOptions && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b1120]/95 z-[100] flex items-end justify-center px-6 pb-12"
          >
            <Motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black italic tracking-widest text-white uppercase">Match Options</h2>
                <button onClick={() => setShowOptions(false)} className="p-2 bg-slate-800 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {status === 'live' ? (
                  <button
                    onClick={() => handleStatusChange('suspended', 'weather')}
                    className="w-full py-4 bg-slate-800/80 border border-slate-600 rounded-2xl flex items-center justify-center gap-4 text-slate-200 active:scale-95 transition-all"
                  >
                    <CloudRain size={24} />
                    <div className="text-left">
                      <p className="font-black italic tracking-widest uppercase leading-none mb-1">Weather delay</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Pause match</p>
                    </div>
                  </button>
                ) : null}

                {status === 'live' ? (
                  <button
                    onClick={() => handleStatusChange('suspended', 'injury')}
                    className="w-full py-4 bg-slate-800/80 border border-slate-600 rounded-2xl flex items-center justify-center gap-4 text-slate-200 active:scale-95 transition-all"
                  >
                    <Stethoscope size={24} />
                    <div className="text-left">
                      <p className="font-black italic tracking-widest uppercase leading-none mb-1">Injury / illness</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Pause for medical</p>
                    </div>
                  </button>
                ) : null}

                {status === 'live' ? (
                  <button
                    onClick={() => handleStatusChange('suspended', 'interval')}
                    className="w-full py-4 bg-slate-800/80 border border-slate-600 rounded-2xl flex items-center justify-center gap-4 text-slate-200 active:scale-95 transition-all"
                  >
                    <Timer size={24} />
                    <div className="text-left">
                      <p className="font-black italic tracking-widest uppercase leading-none mb-1">Official interval</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Between games / break</p>
                    </div>
                  </button>
                ) : null}

                {status === 'suspended' ? (
                  <button
                    onClick={() => handleStatusChange('live')}
                    className="w-full py-4 bg-lime-500/10 border border-lime-500/30 rounded-2xl flex items-center justify-center gap-4 text-lime-500 active:scale-95 transition-all"
                  >
                    <Activity size={24} />
                    <div className="text-left">
                      <p className="font-black italic tracking-widest uppercase leading-none mb-1">Resume Match</p>
                      <p className="text-[10px] font-bold text-lime-500/60 uppercase">Continue play</p>
                    </div>
                  </button>
                ) : null}

                <button
                  onClick={() => handleStatusChange('finished')}
                  className="w-full py-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center gap-4 text-rose-500 active:scale-95 transition-all"
                >
                  <AlertTriangle size={24} />
                  <div className="text-left">
                    <p className="font-black italic tracking-widest uppercase leading-none mb-1">End Match</p>
                    <p className="text-[10px] font-bold text-rose-500/60 uppercase">Withdraw / Abandon</p>
                  </div>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Gavel size={12} /> Misconduct & challenges
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Use yellow/red on the cards row above. Challenges decrement per team (manual BWF-style tracking).
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
                  <Swords size={14} className="text-[#e0f146] shrink-0 mt-0.5" />
                  Challenge: tap Ch when a team challenges a call; remaining count is stored on the match.
                </p>
              </div>

              <p className="mt-6 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4">
                Ending removes the match from the live feed. Deep links to viewer/result still work.
              </p>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
