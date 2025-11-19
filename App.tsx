import React, { useState } from 'react';
import { Tab } from './types';
import Dashboard from './components/Dashboard';
import Nutrition from './components/Nutrition';
import Workout from './components/Workout';
import Profile from './components/Profile';
import CycleTracker from './components/CycleTracker';
import { LayoutDashboard, Utensils, Dumbbell, User, CalendarHeart } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD: return <Dashboard />;
      case Tab.NUTRITION: return <Nutrition />;
      case Tab.WORKOUT: return <Workout />;
      case Tab.CYCLE: return <CycleTracker />;
      case Tab.PROFILE: return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text selection:bg-[#FFC0CB] selection:text-gray-900">
      <div className="max-w-md mx-auto min-h-screen flex flex-col md:max-w-2xl lg:max-w-4xl border-x border-dark-input relative shadow-2xl">
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
          
          <footer className="mt-8 pb-24 md:pb-8 text-center">
            <p className="text-[10px] text-white font-medium tracking-wider flex items-center justify-center gap-1.5">
              Eren Tarafından <span className="text-white animate-pulse">❤️</span> ile yapılmıştır
            </p>
          </footer>
        </main>

        {/* Bottom Navigation (Mobile First) */}
        <nav className="fixed bottom-0 left-0 right-0 md:sticky md:bottom-4 md:w-[90%] md:mx-auto md:rounded-2xl bg-[#1f2937]/95 backdrop-blur-lg border-t md:border border-dark-input pb-safe pt-2 px-2 z-50 shadow-2xl">
          <div className="flex justify-between items-center max-w-md md:max-w-full mx-auto h-16">
            <NavButton 
              active={activeTab === Tab.DASHBOARD} 
              onClick={() => setActiveTab(Tab.DASHBOARD)} 
              icon={LayoutDashboard} 
              label="Özet" 
            />
            <NavButton 
              active={activeTab === Tab.NUTRITION} 
              onClick={() => setActiveTab(Tab.NUTRITION)} 
              icon={Utensils} 
              label="Beslenme" 
            />
            <NavButton 
              active={activeTab === Tab.WORKOUT} 
              onClick={() => setActiveTab(Tab.WORKOUT)} 
              icon={Dumbbell} 
              label="Antrenman" 
            />
             <NavButton 
              active={activeTab === Tab.CYCLE} 
              onClick={() => setActiveTab(Tab.CYCLE)} 
              icon={CalendarHeart} 
              label="Döngü" 
            />
            <NavButton 
              active={activeTab === Tab.PROFILE} 
              onClick={() => setActiveTab(Tab.PROFILE)} 
              icon={User} 
              label="Profil" 
            />
          </div>
        </nav>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 transition-all duration-300 ${active ? 'text-[#FFC0CB] transform -translate-y-1' : 'text-gray-500 hover:text-gray-300'}`}
  >
    <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[9px] mt-1 font-medium truncate w-full text-center">{label}</span>
    {active && <span className="absolute -bottom-2 w-1 h-1 bg-[#FFC0CB] rounded-full"></span>}
  </button>
);

export default App;