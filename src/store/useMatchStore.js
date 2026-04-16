import { create } from 'zustand';
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

const defaultCards = () => ({ yellow: 0, red: 0 });
const defaultChallenges = () => ({ team1: 2, team2: 2 });

const withMatchDefaults = (data = {}) => ({
  ...data,
  team1Cards: { ...defaultCards(), ...data.team1Cards },
  team2Cards: { ...defaultCards(), ...data.team2Cards },
  challengesRemaining: { ...defaultChallenges(), ...data.challengesRemaining },
  changeOfEndsDue: data.changeOfEndsDue ?? false,
  formatPreset: data.formatPreset ?? 'rally_21',
  officiatingMode: data.officiatingMode ?? 'official',
  gameIntervalSec: data.gameIntervalSec ?? 60,
  suspendReason: data.suspendReason ?? null,
});

const initialMatchState = {
  matchId: null,
  matchType: 'singles', 
  team1: { name: 'Team 1', players: ['Player 1'], score: 0, sets: 0 },
  team2: { name: 'Team 2', players: ['Player 2'], score: 0, sets: 0 },
  currentSet: 1,
  history: [], 
  winner: null,
  servingTeam: 1, 
  team1Positions: [1, 0], 
  team2Positions: [1, 0], 
  lastActionType: null,
  status: 'idle',
  umpireId: null,
  pointsToWin: 21,
  setsToWin: 2,
  formatPreset: 'rally_21',
  officiatingMode: 'official',
  gameIntervalSec: 60,
  changeOfEndsDue: false,
  team1Cards: defaultCards(),
  team2Cards: defaultCards(),
  challengesRemaining: defaultChallenges(),
  suspendReason: null,
};

export const useMatchStore = create((set, get) => ({
  ...initialMatchState,
  
  startMatch: async (config, umpireId) => {
    const { matchType, players, pointsToWin, setsToWin, formatPreset, gameIntervalSec, officiatingMode } = config;
    let t1, t2;
    if (matchType === 'singles') {
      t1 = { name: players[0], players: [players[0]], score: 0, sets: 0 };
      t2 = { name: players[1], players: [players[1]], score: 0, sets: 0 };
    } else {
      t1 = { name: 'Team 1', players: [players[0], players[1]], score: 0, sets: 0 };
      t2 = { name: 'Team 2', players: [players[2], players[3]], score: 0, sets: 0 };
    }

    const matchData = {
      matchType,
      team1: t1,
      team2: t2,
      pointsToWin: pointsToWin || 21,
      setsToWin: setsToWin || 2,
      formatPreset: formatPreset || 'rally_21',
      officiatingMode: officiatingMode || 'official',
      gameIntervalSec: gameIntervalSec ?? 60,
      currentSet: 1,
      servingTeam: 1,
      team1Positions: [1, 0],
      team2Positions: [1, 0],
      status: 'live',
      umpireId: umpireId || null,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      history: [],
      changeOfEndsDue: false,
      team1Cards: defaultCards(),
      team2Cards: defaultCards(),
      challengesRemaining: defaultChallenges(),
      suspendReason: null,
    };

    try {
      const docRef = await addDoc(collection(db, 'matches'), matchData);
      set({
        ...initialMatchState,
        matchId: docRef.id,
        ...withMatchDefaults(matchData),
        lastActionType: 'start'
      });
      return docRef.id;
    } catch (error) {
      console.error("Critical Error: Firebase match creation failed.", error);
      throw error;
    }
  },

  patchMatch: async (partial) => {
    const state = get();
    if (!state.matchId) return;
    const next = { ...partial, lastUpdated: serverTimestamp() };
    set((s) => ({ ...s, ...partial }));
    try {
      await updateDoc(doc(db, 'matches', state.matchId), next);
    } catch (error) {
      console.error("Error patching match:", error);
    }
  },

  addPoint: async (teamIndex) => {
    const state = get();
    if (state.winner || !state.matchId || state.status !== 'live') return;

    const t1 = { ...state.team1 };
    const t2 = { ...state.team2 };
    let newServingTeam = state.servingTeam;
    let t1Pos = [...state.team1Positions];
    let t2Pos = [...state.team2Positions];
    let actionType = 'point_won';

    const historyAction = { 
      t1Score: t1.score, t2Score: t2.score, 
      servingTeam: state.servingTeam,
      t1Pos: [...state.team1Positions],
      t2Pos: [...state.team2Positions],
      lastActionType: state.lastActionType
    };

    if (teamIndex === 1) {
      t1.score += 1;
      if (state.servingTeam === 1) {
        t1Pos = [t1Pos[1], t1Pos[0]];
        actionType = 'point_won';
      } else {
        newServingTeam = 1;
        actionType = 'service_over';
      }
    } else {
      t2.score += 1;
      if (state.servingTeam === 2) {
         t2Pos = [t2Pos[1], t2Pos[0]];
         actionType = 'point_won';
      } else {
         newServingTeam = 2;
         actionType = 'service_over';
      }
    }

    const checkWin = (scoreA, scoreB) => {
      const cap = state.pointsToWin + 9;
      if (scoreA >= cap) return true;
      return scoreA >= state.pointsToWin && (scoreA - scoreB) >= 2;
    };

    let updateData = {
      team1: t1,
      team2: t2,
      servingTeam: newServingTeam,
      team1Positions: t1Pos,
      team2Positions: t2Pos,
      lastActionType: actionType,
      history: [...state.history, historyAction],
      lastUpdated: serverTimestamp()
    };

    let setWonBy = null;
    if (checkWin(t1.score, t2.score)) setWonBy = 1;
    else if (checkWin(t2.score, t1.score)) setWonBy = 2;

    if (setWonBy) {
      if (setWonBy === 1) t1.sets += 1;
      else t2.sets += 1;

      if (t1.sets >= state.setsToWin || t2.sets >= state.setsToWin) {
        updateData.winner = setWonBy === 1 ? t1.name : t2.name;
        updateData.lastActionType = 'match_won';
        updateData.status = 'finished';
        updateData.changeOfEndsDue = false;
      } else {
        updateData.currentSet = state.currentSet + 1;
        t1.score = 0;
        t2.score = 0;
        updateData.team1 = t1;
        updateData.team2 = t2;
        updateData.history = [];
        updateData.lastActionType = 'game_won';
        updateData.changeOfEndsDue = true;
      }
    }

    set(updateData);

    try {
      await updateDoc(doc(db, 'matches', state.matchId), updateData);
    } catch (error) {
      console.error("Error updating match in Firebase:", error);
    }
  },

  updateStatus: async (newStatus, suspendReasonArg = undefined) => {
    const state = get();
    if (!state.matchId) return;

    const patch = { 
      status: newStatus, 
      lastUpdated: serverTimestamp() 
    };
    if (newStatus === 'live') {
      patch.suspendReason = null;
    } else if (suspendReasonArg !== undefined) {
      patch.suspendReason = suspendReasonArg;
    }

    set({ 
      status: newStatus, 
      ...(newStatus === 'live' ? { suspendReason: null } : suspendReasonArg !== undefined ? { suspendReason: suspendReasonArg } : {}) 
    });

    try {
      await updateDoc(doc(db, 'matches', state.matchId), patch);
    } catch (error) {
      console.error("Error updating status in Firebase:", error);
    }
  },

  acknowledgeChangeOfEnds: async () => {
    await get().patchMatch({ changeOfEndsDue: false });
  },

  addCard: async (teamIndex, cardType) => {
    const state = get();
    const key = teamIndex === 1 ? 'team1Cards' : 'team2Cards';
    const cur = { ...defaultCards(), ...state[key] };
    if (cardType === 'yellow') cur.yellow = Math.min(2, cur.yellow + 1);
    else cur.red = Math.min(2, cur.red + 1);
    await get().patchMatch({ [key]: cur, lastActionType: 'misconduct' });
  },

  recordChallenge: async (teamIndex) => {
    const state = get();
    const k = teamIndex === 1 ? 'team1' : 'team2';
    const next = { ...defaultChallenges(), ...state.challengesRemaining };
    if (next[k] <= 0) return;
    next[k] -= 1;
    await get().patchMatch({ challengesRemaining: next, lastActionType: 'challenge' });
  },

  undoPoint: async () => {
    const state = get();
    if (state.history.length === 0 || !state.matchId) return;
    
    const lastAction = state.history[state.history.length - 1];
    const updateData = {
      team1: { ...state.team1, score: lastAction.t1Score },
      team2: { ...state.team2, score: lastAction.t2Score },
      servingTeam: lastAction.servingTeam,
      team1Positions: lastAction.t1Pos,
      team2Positions: lastAction.t2Pos,
      lastActionType: lastAction.lastActionType,
      history: state.history.slice(0, -1),
      lastUpdated: serverTimestamp()
    };

    set(updateData);

    try {
      await updateDoc(doc(db, 'matches', state.matchId), updateData);
    } catch (error) {
      console.error("Error undoing point in Firebase:", error);
    }
  },

  subscribeToMatch: (matchId) => {
    if (!matchId) return;
    return onSnapshot(doc(db, 'matches', matchId), (docSnap) => {
      if (docSnap.exists()) {
        const raw = docSnap.data();
        set({ ...withMatchDefaults(raw), matchId: docSnap.id });
      }
    });
  },

  loadMatchForUmpire: async (matchId) => {
    if (!matchId) return;
    set({ matchId, status: 'live' }); 
    return null;
  },

  resetMatch: () => set({ ...initialMatchState }),

  getServingDetails: () => {
    const state = get();
    const score = state.servingTeam === 1 ? state.team1.score : state.team2.score;
    const serveSidePos = score % 2 === 0 ? 1 : 0; 

    let serverIndex = 0;
    let receiverIndex = 0;

    if (state.matchType === 'doubles') {
      serverIndex = state.servingTeam === 1 
        ? state.team1Positions.findIndex(p => p === serveSidePos)
        : state.team2Positions.findIndex(p => p === serveSidePos);
        
      receiverIndex = state.servingTeam === 1
        ? state.team2Positions.findIndex(p => p === serveSidePos)
        : state.team1Positions.findIndex(p => p === serveSidePos);
    }

    const serverName = (state.servingTeam === 1 ? state.team1.players : state.team2.players)[serverIndex] || 'Player';
    const receiverName = (state.servingTeam === 1 ? state.team2.players : state.team1.players)[receiverIndex] || 'Player';

    return { serverName, receiverName, serveSidePos, serverTeam: state.servingTeam };
  },

  getAnnouncement: () => {
    const state = get();
    const s = state.servingTeam === 1 ? state.team1.score : state.team2.score;
    const r = state.servingTeam === 1 ? state.team2.score : state.team1.score;

    if (!state.team1 || !state.team2) return "Loading...";
    if (state.team1.score === 0 && state.team2.score === 0) return "Love all, play.";
    
    let prefix = state.lastActionType === 'service_over' ? "Service over. " : "";
    
    if (s === r) {
      prefix += `${s} all.`;
    } else {
      prefix += `${s}-${r}.`;
    }

    if (s >= state.pointsToWin - 1 && s > r) {
       prefix += " Game point.";
    }

    return prefix;
  }
}));
