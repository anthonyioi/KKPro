import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutSession, DailyLog } from '../types';
import { loadData, addWorkoutToDay, getTodayDateString, updateWorkoutInDay } from '../services/storageService';
import { generateWorkout } from '../services/geminiService';
import { Dumbbell, CheckCircle2, Sparkles, Clock, Play, RotateCcw, Loader2, GripVertical, Footprints, Activity } from 'lucide-react';

const Workout: React.FC = () => {
  const [today] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<'strength' | 'cardio'>('strength');
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  
  // Drag and Drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  useEffect(() => {
    const data = loadData();
    setLogs(data);
    loadActiveSessionForTab(data, activeTab);
  }, [today, activeTab]);

  const loadActiveSessionForTab = (data: Record<string, DailyLog>, tab: 'strength' | 'cardio') => {
    const day = data[today];
    if (day && day.workouts.length > 0) {
      // Find the last session that matches the current tab type
      // We prefer incomplete sessions first
      const sessions = day.workouts.filter(w => w.type === tab);
      const incomplete = sessions.find(w => !w.completed);
      
      if (incomplete) {
        setActiveSession(incomplete);
      } else if (sessions.length > 0) {
        // If all completed, show the last one
        setActiveSession(sessions[sessions.length - 1]);
      } else {
        setActiveSession(null);
      }
    } else {
      setActiveSession(null);
    }
  };

  const handleGenerateWorkout = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    try {
      const result = await generateWorkout(aiPrompt, activeTab);
      
      const newSession: WorkoutSession = {
        id: Date.now().toString(),
        name: result.name,
        exercises: result.exercises, // Type is already set in service
        timestamp: Date.now(),
        completed: false,
        type: activeTab,
        durationMinutes: 0
      };
      const updatedDay = addWorkoutToDay(today, newSession);
      setLogs(prev => ({ ...prev, [today]: updatedDay }));
      setActiveSession(newSession);
      setAiPrompt('');
    } catch (error) {
      alert("AI Plan oluşturamadı, lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExercise = (exIndex: number, field: keyof Exercise, value: any) => {
    if (!activeSession) return;
    const updatedExercises = [...activeSession.exercises];
    updatedExercises[exIndex] = { ...updatedExercises[exIndex], [field]: value };
    
    const updatedSession = { ...activeSession, exercises: updatedExercises };
    setActiveSession(updatedSession);
    const updatedDay = updateWorkoutInDay(today, updatedSession);
    setLogs(prev => ({ ...prev, [today]: updatedDay }));
  };

  const toggleComplete = () => {
    if (!activeSession) return;
    const updatedSession = { ...activeSession, completed: !activeSession.completed };
    setActiveSession(updatedSession);
    const updatedDay = updateWorkoutInDay(today, updatedSession);
    setLogs(prev => ({ ...prev, [today]: updatedDay }));
  };

  const createNewSession = () => {
     const newEx: Exercise = activeTab === 'strength' 
      ? {
          id: Date.now().toString(),
          name: "Bench Press",
          type: 'strength',
          sets: 3,
          reps: "10",
          weight: 0
        }
      : {
          id: Date.now().toString(),
          name: "Koşu Bandı",
          type: 'cardio',
          distance: 5,
          duration: 30,
          intensity: "Hız 9.0"
        };
    
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      name: activeTab === 'strength' ? "Yeni Antrenman" : "Yeni Kardiyo",
      exercises: [newEx],
      timestamp: Date.now(),
      completed: false,
      type: activeTab,
      durationMinutes: 0
    };
    
    const updatedDay = addWorkoutToDay(today, newSession);
    setLogs(prev => ({ ...prev, [today]: updatedDay }));
    setActiveSession(newSession);
  }

  const addExerciseToSession = () => {
    if (!activeSession) return;
    
    const newEx: Exercise = activeTab === 'strength' 
      ? {
          id: Date.now().toString(),
          name: "Yeni Hareket",
          type: 'strength',
          sets: 3,
          reps: "10",
          weight: 0
        }
      : {
          id: Date.now().toString(),
          name: "Yeni Aktivite",
          type: 'cardio',
          distance: 0,
          duration: 20,
          intensity: "Orta"
        };

    const updatedSession = { ...activeSession, exercises: [...activeSession.exercises, newEx] };
    setActiveSession(updatedSession);
    const updatedDay = updateWorkoutInDay(today, updatedSession);
    setLogs(prev => ({ ...prev, [today]: updatedDay }));
  }

  const removeExercise = (index: number) => {
      if (!activeSession) return;
      const updatedExercises = activeSession.exercises.filter((_, i) => i !== index);
      const updatedSession = { ...activeSession, exercises: updatedExercises };
      setActiveSession(updatedSession);
      const updatedDay = updateWorkoutInDay(today, updatedSession);
      setLogs(prev => ({ ...prev, [today]: updatedDay }));
  }

  // --- Drag and Drop Handlers ---
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    if (activeSession) {
        const items = [...activeSession.exercises];
        const draggedItem = items[draggedItemIndex];
        items.splice(draggedItemIndex, 1);
        items.splice(index, 0, draggedItem);
        
        const updatedSession = { ...activeSession, exercises: items };
        setActiveSession(updatedSession);
        setDraggedItemIndex(index);
    }
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
    if (activeSession) {
        const updatedDay = updateWorkoutInDay(today, activeSession);
        setLogs(prev => ({ ...prev, [today]: updatedDay }));
    }
  };

  const isCardio = activeTab === 'cardio';
  // Strength = Pink (#FFC0CB), Cardio = Lilac (#C8A2C8)
  const themeColor = isCardio ? '#C8A2C8' : '#FFC0CB';
  const ThemeIcon = isCardio ? Footprints : Dumbbell;

  return (
    <div className="pb-24">
       <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Antrenman Programı</h1>
        <p className="text-gray-400 text-sm">Kendi programını oluştur ve takip et.</p>
      </header>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-dark-card rounded-xl border border-dark-input mb-6">
        <button 
          onClick={() => setActiveTab('strength')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${!isCardio ? 'bg-[#FFC0CB] text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <Dumbbell className="w-4 h-4" /> Ağırlık
        </button>
        <button 
          onClick={() => setActiveTab('cardio')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isCardio ? 'bg-[#C8A2C8] text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <Footprints className="w-4 h-4" /> Kardiyo
        </button>
      </div>

      {/* AI Generator */}
      <div className={`bg-dark-card p-5 rounded-2xl border border-dark-input mb-8 shadow-lg relative overflow-hidden transition-colors`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${isCardio ? 'from-[#C8A2C8]/20 to-blue-500/20' : 'from-[#FFC0CB]/20 to-purple-500/20'} rounded-bl-full -mr-10 -mt-10 pointer-events-none`}></div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className={`w-4 h-4 ${isCardio ? 'text-[#C8A2C8]' : 'text-[#FFC0CB]'}`} />
                <label className="text-sm font-semibold text-white">
                  AI {isCardio ? 'Kardiyo' : 'Antrenman'} Koçu
                </label>
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    className={`flex-1 bg-dark-bg rounded-xl px-4 py-3 text-sm text-white border border-dark-input focus:outline-none focus:ring-1 transition-all placeholder-gray-500 ${isCardio ? 'focus:border-[#C8A2C8] focus:ring-[#C8A2C8]' : 'focus:border-[#FFC0CB] focus:ring-[#FFC0CB]'}`}
                    placeholder={isCardio ? "Örn: 30 dk yağ yakıcı koşu" : "Örn: Sırt ve Biceps antrenmanı"}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateWorkout()}
                />
                <button 
                    onClick={handleGenerateWorkout}
                    disabled={loading}
                    className={`${isCardio ? 'bg-[#C8A2C8] hover:bg-[#C8A2C8]/90' : 'bg-[#FFC0CB] hover:bg-[#FFC0CB]/90'} text-gray-900 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center shadow-lg disabled:opacity-50`}
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Sparkles className="w-5 h-5"/>}
                </button>
            </div>
        </div>
      </div>

      {/* Active Workout Editor */}
      {activeSession ? (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-dark-card p-4 rounded-2xl border border-dark-input">
                <div>
                    <h2 className="text-lg font-bold text-white">{activeSession.name}</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(activeSession.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span className="uppercase text-gray-300">{activeSession.type === 'cardio' ? 'Kardiyo Seansı' : 'Ağırlık Seansı'}</span>
                    </div>
                </div>
                <button 
                    onClick={toggleComplete}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeSession.completed ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg' : 'bg-dark-input text-gray-400 hover:text-white'}`}
                >
                    {activeSession.completed ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {activeSession.completed ? "Tamamlandı" : "Aktif"}
                </button>
            </div>

            <div className="space-y-4">
                {activeSession.exercises.map((ex, idx) => (
                    <div 
                        key={ex.id} 
                        draggable
                        onDragStart={(e) => onDragStart(e, idx)}
                        onDragOver={(e) => onDragOver(e, idx)}
                        onDragEnd={onDragEnd}
                        className={`bg-dark-card rounded-2xl p-5 border border-dark-input group transition-all cursor-grab active:cursor-grabbing ${draggedItemIndex === idx ? 'opacity-50 border-dashed' : 'hover:border-gray-600'}`}
                        style={draggedItemIndex === idx ? { borderColor: themeColor } : {}}
                    >
                        {/* Header row */}
                        <div className="flex items-start gap-4 mb-4">
                             {/* Drag Handle */}
                            <div className="mt-3 text-gray-600 hover:text-white cursor-grab">
                                <GripVertical className="w-5 h-5" />
                            </div>

                            <div className={`p-3 rounded-xl shadow-inner ${isCardio ? 'bg-[#C8A2C8]/20' : 'bg-[#FFC0CB]/20'}`}>
                                <ThemeIcon className={`w-6 h-6 ${isCardio ? 'text-[#C8A2C8]' : 'text-[#FFC0CB]'}`} />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                                    {isCardio ? 'Aktivite' : 'Hareket'}
                                </label>
                                <input 
                                    value={ex.name}
                                    onChange={(e) => handleUpdateExercise(idx, 'name', e.target.value)}
                                    className="bg-transparent text-white font-bold text-lg focus:outline-none border-b border-transparent focus:border-gray-600 w-full placeholder-gray-600 transition-colors"
                                    placeholder={isCardio ? "Örn: Koşu, Eliptik" : "Hareket ismi"}
                                />
                            </div>
                            <button onClick={() => removeExercise(idx)} className="text-dark-input hover:text-red-500 transition-colors">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Conditional Stats Grid */}
                        {isCardio ? (
                             <div className="grid grid-cols-3 gap-3">
                                <div className="bg-dark-bg rounded-xl p-3 border border-dark-input">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-1">Süre (dk)</label>
                                    <input 
                                        type="number"
                                        value={ex.duration || 0}
                                        onChange={(e) => handleUpdateExercise(idx, 'duration', parseFloat(e.target.value))}
                                        className="w-full bg-transparent text-center text-xl font-mono text-[#C8A2C8] focus:outline-none"
                                    />
                                </div>
                                <div className="bg-dark-bg rounded-xl p-3 border border-dark-input">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-1">Mesafe (km)</label>
                                    <input 
                                        type="number"
                                        value={ex.distance || 0}
                                        onChange={(e) => handleUpdateExercise(idx, 'distance', parseFloat(e.target.value))}
                                        className="w-full bg-transparent text-center text-xl font-mono text-blue-400 focus:outline-none"
                                    />
                                </div>
                                <div className="bg-dark-bg rounded-xl p-3 border border-dark-input">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-1">Yoğunluk</label>
                                    <input 
                                        type="text"
                                        value={ex.intensity || ''}
                                        onChange={(e) => handleUpdateExercise(idx, 'intensity', e.target.value)}
                                        className="w-full bg-transparent text-center text-sm pt-1 font-mono text-emerald-400 focus:outline-none"
                                        placeholder="Örn: Hız 8.0"
                                    />
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-3 gap-3">
                                <div className="bg-dark-bg rounded-xl p-3 border border-dark-input">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-1">Set</label>
                                    <input 
                                        type="number"
                                        value={ex.sets || 0}
                                        onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value))}
                                        className="w-full bg-transparent text-center text-xl font-mono text-[#FFC0CB] focus:outline-none"
                                    />
                                </div>
                                <div className="bg-dark-bg rounded-xl p-3 border border-dark-input">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-1">Tekrar</label>
                                    <input 
                                        type="text"
                                        value={ex.reps || ''}
                                        onChange={(e) => handleUpdateExercise(idx, 'reps', e.target.value)}
                                        className="w-full bg-transparent text-center text-xl font-mono text-[#C8A2C8] focus:outline-none"
                                    />
                                </div>
                                <div className="bg-dark-bg rounded-xl p-3 border border-dark-input">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-1">Ağırlık (kg)</label>
                                    <input 
                                        type="number"
                                        value={ex.weight || 0}
                                        onChange={(e) => handleUpdateExercise(idx, 'weight', parseFloat(e.target.value))}
                                        className="w-full bg-transparent text-center text-xl font-mono text-emerald-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button 
                onClick={addExerciseToSession}
                className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 transition-all ${isCardio ? 'border-[#C8A2C8]/30 bg-[#C8A2C8]/5 text-[#C8A2C8] hover:bg-[#C8A2C8]/10 hover:border-[#C8A2C8]' : 'border-dark-input text-gray-400 hover:bg-dark-input/20 hover:border-gray-500 hover:text-white'}`}
            >
                {isCardio ? <Footprints className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                {isCardio ? 'Yeni Aktivite Ekle' : 'Yeni Hareket Ekle'}
            </button>
        </div>
      ) : (
        <div className="text-center py-24 px-6 bg-dark-card rounded-3xl border border-dark-input flex flex-col items-center">
            <div className="w-20 h-20 bg-dark-input/50 rounded-full flex items-center justify-center mb-6 relative">
                <Activity className="w-10 h-10 text-gray-400" />
                <div className={`absolute -right-1 -bottom-1 w-8 h-8 rounded-full flex items-center justify-center ${isCardio ? 'bg-[#C8A2C8]' : 'bg-[#FFC0CB]'}`}>
                  {isCardio ? <Footprints className="w-4 h-4 text-gray-900" /> : <Dumbbell className="w-4 h-4 text-gray-900" />}
                </div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">
              {isCardio ? 'Kardiyo Planı Yok' : 'Antrenman Planı Yok'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-xs text-sm">
              {isCardio 
                ? "Bugün için planlanmış bir kardiyo veya koşu seansı bulunmuyor." 
                : "Bugün için planlanmış bir ağırlık antrenmanı bulunmuyor."}
            </p>
            <button 
                onClick={createNewSession}
                className={`${isCardio ? 'bg-[#C8A2C8] hover:bg-[#C8A2C8]/90' : 'bg-[#FFC0CB] hover:bg-[#FFC0CB]/90'} text-gray-900 px-8 py-3 rounded-xl font-bold transition-all shadow-lg transform hover:scale-105`}
            >
                {isCardio ? 'Kardiyo Başla' : 'Antrenman Başla'}
            </button>
        </div>
      )}
    </div>
  );
};

export default Workout;