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
    <div className="flex flex-col mb-2 mt-1 relative">
      {isServing && (
        <div className="absolute -top-2 left-0 px-2 py-0.5 bg-[#e0f146] text-slate-900 text-[8px] font-black tracking-widest rounded-tl-md rounded-br-md shadow-sm z-10">
          SERVING
        </div>
      )}
      <div className="flex justify-between items-start mb-1 px-1">
        <div>
          <h2 className={`text-lg font-black italic tracking-wide uppercase ${isServing ? 'text-white' : 'text-slate-300'}`}>
            {team.name}
          </h2>
          <div className="flex gap-1 mt-1">
            {[...Array(setsToWin)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < team.sets ? 'bg-[#e0f146]' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sets Won</span>
          <div className="text-xs font-bold text-slate-300">{team.sets}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Motion.span
          key={team.score}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-5xl tabular-nums font-black leading-none tracking-tighter drop-shadow-xl pl-1 ${isServing ? 'text-[#e0f146]' : 'text-slate-400'}`}
        >
          {team.score}
        </Motion.span>
        <button
          type="button"
          onClick={() => status === 'live' && addPoint(teamIdx)}
          disabled={status !== 'live'}
          className={`min-w-[120px] px-4 py-2 rounded-xl font-black text-xs tracking-widest uppercase items-center justify-center flex gap-2 transition-all active:scale-[0.98]
            ${isServing ? 'bg-[#e0f146] text-slate-900 shadow-[0_0_14px_rgba(224,241,70,0.25)] hover:bg-lime-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
            ${status !== 'live' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span>+ POINT</span>
        </button>
      </div>
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
    officiatingMode,
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
  const getAvatarLetter = (name) => (name ? name.substring(0, 1).toUpperCase() : '?');
  const serviceLaneXClass = servingDetails.serveSidePos === 1 ? 'left-[68%]' : 'left-[32%]';
  const receiveLaneXClass = servingDetails.serveSidePos === 1 ? 'left-[32%]' : 'left-[68%]';

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
    <div className="flex flex-col min-h-screen bg-[#0b1120] text-white pb-6 px-6 pt-3 relative max-w-[440px] mx-auto w-full">
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

      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
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

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col">
          <TeamScoreCard
            team={team1}
            teamIdx={1}
            isServing={servingTeam === 1}
            setsToWin={setsToWin}
            status={status}
            addPoint={addPoint}
          />

          <div className="my-1 w-full">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Court Orientation</span>
              <span className="text-[#e0f146] font-bold uppercase tracking-wider text-[9px] text-right flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e0f146]"></span>
                {(servingDetails?.serverName || 'Player').toUpperCase()} SERVING
              </span>
            </div>

            <div className="w-[196px] h-[352px] mx-auto bg-[#0b1120] border border-slate-700 rounded-lg relative shadow-xl p-0.5 box-border overflow-hidden">
              {/* Main singles center line */}
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-600/80 -translate-x-1/2"></div>
              {/* Net */}
              <div className="absolute inset-x-0 top-1/2 h-[2px] bg-[#e0f146]/60 shadow-[0_0_8px_#e0f146] -translate-y-1/2"></div>
              {/* Short service lines */}
              <div className="absolute inset-x-[10%] top-[34%] h-[1px] bg-slate-600/80"></div>
              <div className="absolute inset-x-[10%] top-[66%] h-[1px] bg-slate-600/80"></div>
              {/* Side alleys (doubles lanes) */}
              <div className="absolute inset-y-[2%] left-[10%] w-[1px] bg-slate-700/70"></div>
              <div className="absolute inset-y-[2%] left-[90%] w-[1px] bg-slate-700/70 -translate-x-full"></div>
              {/* Mid guides for visual court depth */}
              <div className="absolute inset-x-0 top-[20%] h-[1px] bg-slate-800/90"></div>
              <div className="absolute inset-x-0 top-[80%] h-[1px] bg-slate-800/90"></div>

              <div className={`absolute ${servingTeam === 1 ? serviceLaneXClass : receiveLaneXClass} top-[20%] -translate-x-1/2 -translate-y-1/2`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold ${servingTeam === 1 ? 'border-[#e0f146] text-[#e0f146] bg-[#e0f146]/5' : 'border-slate-500 text-slate-500'}`}>
                  {getAvatarLetter(team1?.name)}
                </div>
              </div>

              <div className={`absolute ${servingTeam === 2 ? serviceLaneXClass : receiveLaneXClass} top-[80%] -translate-x-1/2 -translate-y-1/2`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold ${servingTeam === 2 ? 'border-[#e0f146] text-[#e0f146] bg-[#e0f146]/5' : 'border-slate-500 text-slate-500'}`}>
                  {getAvatarLetter(team2?.name)}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-1 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
              <span>Team 1 Side</span>
              <span>Team 2 Side</span>
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
        </div>

        {officiatingMode === 'official' && (
        <div className="grid grid-cols-2 gap-2 mb-2 text-[8px] font-black uppercase tracking-widest">
        <div className="p-2 bg-slate-800/80 rounded-2xl border border-slate-700">
          <p className="text-slate-500 mb-1">Team 1 · cards</p>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(1, 'yellow')}
              className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-40"
            >
              Y {cards1.yellow}
            </button>
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(1, 'red')}
              className="flex-1 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 disabled:opacity-40"
            >
              R {cards1.red}
            </button>
            <button
              type="button"
              disabled={status !== 'live' || ch.team1 <= 0}
              onClick={() => recordChallenge(1)}
              className="flex-1 py-1.5 rounded-lg bg-slate-700 text-[#e0f146] border border-slate-600 disabled:opacity-40"
            >
              Ch {ch.team1}
            </button>
          </div>
        </div>
        <div className="p-2 bg-slate-800/80 rounded-2xl border border-slate-700">
          <p className="text-slate-500 mb-1">Team 2 · cards</p>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(2, 'yellow')}
              className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-40"
            >
              Y {cards2.yellow}
            </button>
            <button
              type="button"
              disabled={status !== 'live'}
              onClick={() => addCard(2, 'red')}
              className="flex-1 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 disabled:opacity-40"
            >
              R {cards2.red}
            </button>
            <button
              type="button"
              disabled={status !== 'live' || ch.team2 <= 0}
              onClick={() => recordChallenge(2)}
              className="flex-1 py-1.5 rounded-lg bg-slate-700 text-[#e0f146] border border-slate-600 disabled:opacity-40"
            >
              Ch {ch.team2}
            </button>
          </div>
        </div>
        </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-2 font-black uppercase italic tracking-widest text-[8px]">
        <button
          onClick={undoPoint}
          className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 text-[#60a5fa]"
        >
          <RotateCcw className="mb-0.5 w-4 h-4" />
          <span>Undo</span>
        </button>
        <button
          onClick={() => setShowOptions(true)}
          className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 text-[#e0f146]"
        >
          <Flag className="mb-0.5 w-4 h-4" />
          <span>Options</span>
        </button>
        <button
          type="button"
          onClick={startIntervalTimer}
          className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <Timer className="mb-0.5 w-4 h-4" />
          <span>Interval</span>
        </button>
        </div>

        <div className="mb-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-black italic tracking-widest uppercase">Match Data</h3>
            <span className="text-[9px] font-bold text-slate-500 uppercase">Automated</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-800 rounded-xl flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
              <span className="text-sm font-black italic text-[#60a5fa]">{formatTime(matchTime)}</span>
            </div>
            <div className="p-2 bg-slate-800 rounded-xl flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
              <span className={`text-sm font-black italic ${status === 'suspended' ? 'text-amber-500' : 'text-lime-500'}`}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
      {status === 'suspended' && suspendReason && (
        <p className="mt-1 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest text-center">
          Reason: {suspendReason}
        </p>
      )}

      <AnimatePresence>
        {showOptions && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b1120]/45 backdrop-blur-md z-[100] flex items-center justify-center px-4 py-6"
          >
            <Motion.div
              initial={{ y: 40, opacity: 0.8 }}
              animate={{ y: 0 }}
              exit={{ y: 40, opacity: 0.8 }}
              className="w-full max-w-xs bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 max-h-[70vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-black tracking-widest text-white uppercase">Options</h2>
                <button onClick={() => setShowOptions(false)} className="p-1.5 bg-slate-800/80 rounded-full text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {status === 'live' ? (
                  <button
                    onClick={() => handleStatusChange('suspended', 'weather')}
                    className="w-full py-2.5 bg-slate-800/80 border border-slate-600 rounded-xl flex items-center justify-center gap-3 text-slate-200 active:scale-95 transition-all"
                  >
                    <CloudRain size={16} />
                    <p className="font-black tracking-widest uppercase text-xs">Weather delay</p>
                  </button>
                ) : null}

                {status === 'live' ? (
                  <button
                    onClick={() => handleStatusChange('suspended', 'injury')}
                    className="w-full py-2.5 bg-slate-800/80 border border-slate-600 rounded-xl flex items-center justify-center gap-3 text-slate-200 active:scale-95 transition-all"
                  >
                    <Stethoscope size={16} />
                    <p className="font-black tracking-widest uppercase text-xs">Injury / illness</p>
                  </button>
                ) : null}

                {status === 'live' ? (
                  <button
                    onClick={() => handleStatusChange('suspended', 'interval')}
                    className="w-full py-2.5 bg-slate-800/80 border border-slate-600 rounded-xl flex items-center justify-center gap-3 text-slate-200 active:scale-95 transition-all"
                  >
                    <Timer size={16} />
                    <p className="font-black tracking-widest uppercase text-xs">Official interval</p>
                  </button>
                ) : null}

                {status === 'suspended' ? (
                  <button
                    onClick={() => handleStatusChange('live')}
                    className="w-full py-2.5 bg-lime-500/10 border border-lime-500/30 rounded-xl flex items-center justify-center gap-3 text-lime-500 active:scale-95 transition-all"
                  >
                    <Activity size={16} />
                    <p className="font-black tracking-widest uppercase text-xs">Resume match</p>
                  </button>
                ) : null}

                <button
                  onClick={() => handleStatusChange('finished')}
                  className="w-full py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center gap-3 text-rose-500 active:scale-95 transition-all"
                >
                  <AlertTriangle size={16} />
                  <p className="font-black tracking-widest uppercase text-xs">End match</p>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-[9px] text-slate-400 leading-relaxed flex items-start gap-2">
                  <Gavel size={12} className="shrink-0 mt-0.5" />
                  {officiatingMode === 'official'
                    ? 'Cards and challenges are available on the main live screen.'
                    : 'Basic mode is active. Official cards/challenges are hidden.'}
                </p>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
