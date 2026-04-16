import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { useAuthStore } from './store/useAuthStore';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import LiveScoreScreen from './screens/LiveScoreScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import PlayersScreen from './screens/PlayersScreen';
import ViewerScoreScreen from './screens/ViewerScoreScreen';
import TournamentScreen from './screens/TournamentScreen';
import BottomNav from './components/BottomNav';

// A minimal wrapper to handle fade transitions
const ScreenWrapper = ({ children }) => (
  <Motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    className="h-full w-full flex flex-col"
  >
    {children}
  </Motion.div>
);

const ProtectedRoute = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  return <ScreenWrapper><Outlet /></ScreenWrapper>;
};

function AppRoutes() {
  const { user, initializeAuthListener, loading } = useAuthStore();

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#0b1120]">
        <div className="w-10 h-10 border-4 border-[#e0f146] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(224,241,70,0.2)]"></div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-[#0b1120] flex flex-col relative selection:bg-[#e0f146]/30 selection:text-[#e0f146]">
      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Public Auth Gateway */}
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <ScreenWrapper><AuthScreen /></ScreenWrapper>} />
          
          {/* All non-auth routes protected by default */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/viewer/:matchId" element={<ViewerScoreScreen />} />
            <Route path="/setup" element={<SetupScreen />} />
            <Route path="/live" element={<LiveScoreScreen />} />
            <Route path="/result/:matchId" element={<ResultScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/players" element={<PlayersScreen />} />
            <Route path="/tournaments" element={<TournamentScreen />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
      {/* Universal Navigation (Managed within BottomNav for locking) */}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
