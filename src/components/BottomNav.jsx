import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, History as HistoryIcon, Home, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useMatchStore } from '../store/useMatchStore';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { status, umpireId } = useMatchStore();

  const hiddenRoutes = ['/auth', '/live', '/viewer'];
  
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  if (status === 'live' && umpireId === user?.uid) {
    return (
       <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-[440px] px-4 pointer-events-auto">
            <div 
               onClick={() => navigate('/live')}
               className="h-[72px] bg-[#0b1120]/95 backdrop-blur-md border border-slate-800/80 rounded-t-3xl flex items-center justify-center px-4 shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center gap-3 px-5 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 animate-pulse cursor-pointer max-w-full">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span className="text-[9px] font-black tracking-widest uppercase italic text-center leading-tight">Active match — return to scoreboard</span>
              </div>
            </div>
          </div>
       </div>
    );
  }

  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Match', path: '/setup', icon: CalendarDays },
    { name: 'Cup', path: '/tournaments', icon: LayoutGrid },
    { name: 'Players', path: '/players', icon: Users },
    { name: 'Past', path: '/history', icon: HistoryIcon }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav 
        className="w-full max-w-[440px] pointer-events-auto bg-[#0b1120]/95 backdrop-blur-md border-t border-slate-800/80 rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around px-1 pt-2 pb-3 min-h-[72px]">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.name}
                type="button"
                onClick={() => navigate(tab.path)}
                className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-1 relative rounded-2xl transition-colors"
              >
                {active ? (
                  <div className="absolute inset-x-1 inset-y-0.5 bg-[#162020] rounded-2xl -z-10 shadow-inner" />
                ) : null}
                
                <Icon 
                  size={20} 
                  className={`shrink-0 transition-colors ${active ? 'text-[#b1e81f]' : 'text-slate-500'}`} 
                />
                <span 
                  className={`text-[8px] font-bold tracking-tight text-center leading-none px-0.5 truncate max-w-full ${active ? 'text-[#b1e81f]' : 'text-slate-500'}`}
                >
                  {tab.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
