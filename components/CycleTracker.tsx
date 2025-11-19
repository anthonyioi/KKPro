
import React, { useState, useEffect } from 'react';
import { CycleData, CycleStatus, PeriodRecord } from '../types';
import { getCycleData, saveCycleData, logPeriodStart, calculateCycleStatus, getTodayDateString, updatePeriodNote } from '../services/storageService';
import { CalendarHeart, Bell, Settings, History, CheckCircle, AlertTriangle, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FileText, Save, Edit2, MessageSquarePlus, Sliders } from 'lucide-react';

const CycleTracker: React.FC = () => {
  const [data, setData] = useState<CycleData | null>(null);
  const [status, setStatus] = useState<CycleStatus>({ status: 'unknown', daysUntilNext: 0, nextDate: null, isPeriodNow: false });
  const [showSettings, setShowSettings] = useState(false);
  
  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());

  // Modal States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [manualDate, setManualDate] = useState<string>(getTodayDateString());
  const [manualNote, setManualNote] = useState<string>('');

  // Quick Log Success Modal
  const [isQuickLogModalOpen, setIsQuickLogModalOpen] = useState(false);
  const [quickLogNote, setQuickLogNote] = useState('');

  // Edit Note Modal States
  const [editingRecord, setEditingRecord] = useState<PeriodRecord | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  // Settings Inputs
  const [inputCycleLen, setInputCycleLen] = useState(28);
  const [inputPeriodLen, setInputPeriodLen] = useState(5);
  const [inputNotifications, setInputNotifications] = useState(true);
  const [inputPredictionMode, setInputPredictionMode] = useState<'standard' | 'custom'>('standard');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const d = getCycleData();
    setData(d);
    setInputCycleLen(d.cycleLength);
    setInputPeriodLen(d.periodLength);
    setInputNotifications(d.notificationsEnabled);
    setInputPredictionMode(d.predictionMode || 'standard');
    setStatus(calculateCycleStatus());
  };

  const handleLogDate = () => {
    if (manualDate) {
      logPeriodStart(manualDate, manualNote);
      refreshData();
      setIsDatePickerOpen(false);
      setManualNote('');
    }
  };

  const handleQuickLog = () => {
      const today = getTodayDateString();
      logPeriodStart(today, '');
      refreshData();
      
      // Open dedicated modal to ask for note
      setQuickLogNote('');
      setIsQuickLogModalOpen(true);
  };

  const saveQuickLogNote = () => {
      const today = getTodayDateString();
      if (quickLogNote.trim()) {
          updatePeriodNote(today, quickLogNote);
          refreshData();
      }
      setIsQuickLogModalOpen(false);
  };

  const handleModeChange = (mode: 'standard' | 'custom') => {
      setInputPredictionMode(mode);
      if (mode === 'standard') {
          setInputCycleLen(28);
          setInputPeriodLen(5);
      }
  };

  const handleSaveSettings = () => {
    if (!data) return;
    const newData = { 
        ...data, 
        cycleLength: inputCycleLen, 
        periodLength: inputPeriodLen,
        notificationsEnabled: inputNotifications,
        predictionMode: inputPredictionMode
    };
    saveCycleData(newData);
    refreshData();
    setShowSettings(false);
  };

  const openEditNote = (record: PeriodRecord) => {
      setEditingRecord(record);
      setEditNoteText(record.note || '');
  };

  const saveNoteEdit = () => {
      if (editingRecord) {
          updatePeriodNote(editingRecord.startDate, editNoteText);
          refreshData();
          setEditingRecord(null);
      }
  };

  // --- Calendar Logic ---

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const getDayStatusClass = (day: number) => {
    if (!data) return '';
    
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const currentTimestamp = current.getTime();
    const currentIso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const todayIso = getTodayDateString();

    let isHistory = false;
    let isPredicted = false;

    // 1. Check History
    for (const record of data.history) {
        const start = new Date(record.startDate);
        // Normalize time
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + data.periodLength - 1);
        
        if (currentTimestamp >= start.getTime() && currentTimestamp <= end.getTime()) {
            isHistory = true;
            break;
        }
    }

    // 2. Check Predictions (Only if not history and in future relative to last period)
    if (!isHistory && data.lastPeriodStart) {
        const lastStart = new Date(data.lastPeriodStart);
        lastStart.setHours(0,0,0,0);
        
        // Only predict if the current calendar day is after the last recorded start date
        if (currentTimestamp > lastStart.getTime()) {
            // Calculate difference in days
            const diffTime = currentTimestamp - lastStart.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // Find where we are in the cycle
            const dayInCycle = diffDays % data.cycleLength;
            
            if (dayInCycle >= 0 && dayInCycle < data.periodLength) {
                isPredicted = true;
            }
        }
    }

    let classes = "text-gray-300 hover:bg-dark-input"; // Default
    
    if (isHistory) {
        classes = "bg-[#FFC0CB] text-gray-900 font-bold shadow-lg shadow-[#FFC0CB]/30";
    } else if (isPredicted) {
        classes = "border-2 border-[#FFC0CB] border-dashed text-[#FFC0CB] bg-[#FFC0CB]/10";
    } else if (currentIso === todayIso) {
        classes = "bg-dark-input border border-white text-white font-bold";
    }

    return classes;
  };

  const getAlertMessage = () => {
    const days = status.daysUntilNext;
    if (days === 0) return "Beklenen Gün Bugün!";
    if (days < 0) return `${Math.abs(days)} Gün Gecikti!`;
    return `${days} Gün Kaldı!`;
  };

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Adjust for Monday start (Sunday is 0 in JS, needs to be 6. Monday is 1, needs to be 0)
    const startingSlot = (firstDayOfMonth + 6) % 7;

    const days = [];
    
    // Empty slots
    for (let i = 0; i < startingSlot; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const classes = getDayStatusClass(i);
        days.push(
            <div key={i} className={`aspect-square flex items-center justify-center rounded-xl text-sm transition-all cursor-default ${classes}`}>
                {i}
            </div>
        );
    }
    return days;
  };

  if (!data) return <div className="p-6 text-white">Yükleniyor...</div>;

  const isApproaching = status.status === 'approaching';
  const isActive = status.status === 'active';

  return (
    <div className="pb-24 space-y-6 relative">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Döngü Takibi</h1>
          <p className="text-gray-400 text-sm">Vücudunu dinle ve takip et.</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border transition-colors ${showSettings ? 'bg-[#FFC0CB] border-[#FFC0CB] text-gray-900' : 'bg-dark-card border-dark-input text-gray-400 hover:text-white'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* DATE PICKER MODAL (MANUAL LOG) */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-dark-card border border-dark-input p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#FFC0CB]" />
                    Tarih Seç
                 </h3>
                 <button onClick={() => setIsDatePickerOpen(false)} className="text-gray-500 hover:text-white">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-2">Regl döneminin başladığı tarih:</p>
              <input 
                type="date" 
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-dark-input text-white p-4 rounded-xl text-lg font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-[#FFC0CB] border border-gray-600"
              />

              <p className="text-gray-400 text-sm mb-2">Özel Not (Opsiyonel):</p>
              <textarea 
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Semptomlar, ruh hali..."
                className="w-full bg-dark-input text-white p-4 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-[#FFC0CB] border border-gray-600 min-h-[80px]"
              />
              
              <button 
                onClick={handleLogDate}
                className="w-full bg-[#FFC0CB] hover:bg-[#FFC0CB]/90 text-gray-900 py-4 rounded-xl font-bold shadow-lg transition-all"
              >
                Kaydet ve Başlat
              </button>
           </div>
        </div>
      )}

      {/* QUICK LOG SUCCESS & NOTE MODAL */}
      {isQuickLogModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-dark-card border border-dark-input p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="w-16 h-16 bg-[#FFC0CB]/20 rounded-full flex items-center justify-center mb-4 border border-[#FFC0CB]/40">
                    <CheckCircle className="w-8 h-8 text-[#FFC0CB]" />
                 </div>
                 <h3 className="text-xl font-bold text-white">Regl Kaydedildi</h3>
                 <p className="text-gray-400 text-sm mt-1">Döngü başlangıcı bugün olarak işaretlendi.</p>
              </div>
              
              <div className="bg-dark-input/50 rounded-2xl p-4 border border-dark-input mb-6">
                <div className="flex items-center gap-2 mb-2 text-[#FFC0CB] font-medium text-sm">
                   <MessageSquarePlus className="w-4 h-4" /> Bir not ekle
                </div>
                <textarea 
                    value={quickLogNote}
                    onChange={(e) => setQuickLogNote(e.target.value)}
                    placeholder="Bugün nasıl hissediyorsun? Semptomlar, ruh hali..."
                    className="w-full bg-transparent text-white text-sm focus:outline-none min-h-[80px] placeholder-gray-500"
                    autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                 <button 
                    onClick={() => setIsQuickLogModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-dark-input transition-colors"
                 >
                    Atla
                 </button>
                 <button 
                    onClick={saveQuickLogNote}
                    className="flex-1 bg-[#FFC0CB] hover:bg-[#FFC0CB]/90 text-gray-900 py-3 rounded-xl font-bold shadow-lg transition-all"
                 >
                    Notu Kaydet
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-dark-card border border-dark-input p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-[#FFC0CB]" />
                    Notu Düzenle
                 </h3>
                 <button onClick={() => setEditingRecord(null)} className="text-gray-500 hover:text-white">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <p className="text-gray-300 font-medium mb-4 text-center border-b border-gray-700 pb-2">
                  {new Date(editingRecord.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              
              <textarea 
                value={editNoteText}
                onChange={(e) => setEditNoteText(e.target.value)}
                placeholder="Semptomlar, ruh hali, gözlemler..."
                className="w-full bg-dark-input text-white p-4 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-[#FFC0CB] border border-gray-600 min-h-[120px]"
              />
              
              <button 
                onClick={saveNoteEdit}
                className="w-full bg-[#FFC0CB] hover:bg-[#FFC0CB]/90 text-gray-900 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Değişiklikleri Kaydet
              </button>
           </div>
        </div>
      )}

      {/* ALERT BANNER - PROMINENT WARNING */}
      {isApproaching && data.notificationsEnabled && (
        <div className="bg-gradient-to-r from-[#FFC0CB]/20 to-[#C8A2C8]/10 border-l-4 border-[#FFC0CB] p-5 rounded-r-2xl rounded-l-md flex items-center gap-5 shadow-lg mb-2 relative overflow-hidden group">
           {/* Animated background glow */}
           <div className="absolute inset-0 bg-[#FFC0CB]/5 animate-pulse pointer-events-none"></div>
           
           <div className="bg-dark-bg/40 p-3 rounded-full shrink-0 backdrop-blur-sm z-10 border border-white/10">
             <AlertTriangle className="w-7 h-7 text-[#FFC0CB]" />
           </div>
           <div className="z-10">
             <h3 className="text-white font-extrabold text-xl tracking-tight">
                {getAlertMessage()}
             </h3>
             <p className="text-[#FFC0CB]/80 text-xs mt-1 font-medium opacity-90">
               Vücudun sinyal veriyor olabilir. Hazırlıklı ol!
             </p>
           </div>
           {/* Decorative circle */}
           <div className="absolute -right-6 -bottom-10 w-24 h-24 bg-[#FFC0CB]/20 rounded-full blur-xl"></div>
        </div>
      )}

      {showSettings && (
        <div className="bg-dark-card p-5 rounded-2xl border border-dark-input mb-6 animate-in fade-in slide-in-from-top-4">
           <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
             <Settings className="w-4 h-4 text-[#C8A2C8]" /> Ayarlar
           </h3>
           
           <div className="space-y-4">
               {/* Cycle Settings Section */}
               <div>
                    <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2">Döngü Bilgileri</h4>
                    
                    {/* Prediction Mode Toggle */}
                    <div className="flex bg-dark-input/50 p-1 rounded-xl mb-4 border border-dark-input">
                        <button 
                            onClick={() => handleModeChange('standard')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${inputPredictionMode === 'standard' ? 'bg-[#FFC0CB] text-gray-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            Standart (28/5)
                        </button>
                        <button 
                            onClick={() => handleModeChange('custom')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${inputPredictionMode === 'custom' ? 'bg-[#C8A2C8] text-gray-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            Kişisel
                        </button>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 transition-opacity ${inputPredictionMode === 'standard' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Döngü (Gün)</label>
                            <input 
                                type="number" 
                                value={inputCycleLen}
                                disabled={inputPredictionMode === 'standard'}
                                onChange={(e) => setInputCycleLen(parseInt(e.target.value) || 28)}
                                className="w-full bg-dark-input text-white p-3 rounded-xl focus:ring-1 focus:ring-[#FFC0CB] outline-none border border-transparent focus:border-[#FFC0CB]/50 transition-all disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Regl Süresi (Gün)</label>
                            <input 
                                type="number" 
                                value={inputPeriodLen}
                                disabled={inputPredictionMode === 'standard'}
                                onChange={(e) => setInputPeriodLen(parseInt(e.target.value) || 5)}
                                className="w-full bg-dark-input text-white p-3 rounded-xl focus:ring-1 focus:ring-[#FFC0CB] outline-none border border-transparent focus:border-[#FFC0CB]/50 transition-all disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                    {inputPredictionMode === 'standard' && (
                        <p className="text-[10px] text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                            <Sliders className="w-3 h-3" /> Standart modda ortalama değerler kullanılır.
                        </p>
                    )}
               </div>

               {/* Notification Settings Section */}
               <div className="pt-2 border-t border-dark-input/50">
                    <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2">Bildirimler</h4>
                    <div className="flex items-center justify-between p-3 bg-dark-input/30 rounded-xl border border-dark-input/50 group hover:border-[#FFC0CB]/30 transition-colors cursor-pointer" onClick={() => setInputNotifications(!inputNotifications)}>
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${inputNotifications ? 'bg-[#FFC0CB]/20 text-[#FFC0CB]' : 'bg-gray-700/30 text-gray-400'}`}>
                               <Bell className="w-4 h-4" />
                           </div>
                           <div>
                               <span className="text-sm text-gray-200 font-medium block">Yaklaşan Regl Uyarısı</span>
                               <span className="text-[10px] text-gray-500 block">Regl 5 gün kala ana ekranda uyarı göster.</span>
                           </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${inputNotifications ? 'bg-[#FFC0CB]' : 'bg-gray-600/50'}`}>
                          <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${inputNotifications ? 'left-6' : 'left-1'}`}></span>
                        </div>
                    </div>
               </div>
           </div>

           <button onClick={handleSaveSettings} className="w-full bg-[#FFC0CB] hover:bg-[#FFC0CB]/90 text-gray-900 py-3 rounded-xl font-bold transition-colors mt-5 shadow-lg shadow-[#FFC0CB]/20">
             Ayarları Kaydet
           </button>
        </div>
      )}

      {/* MAIN STATUS CARD */}
      <div className="bg-dark-card rounded-3xl p-8 border border-dark-input shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[300px]">
         
         {/* Background decoration */}
         <div className={`absolute top-0 w-full h-full opacity-10 pointer-events-none blur-3xl ${isActive ? 'bg-[#FFC0CB]' : 'bg-[#C8A2C8]'}`}></div>
         
         {isActive ? (
           <>
             <div className="w-40 h-40 rounded-full border-4 border-[#FFC0CB] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,192,203,0.4)] bg-[#FFC0CB]/10 relative">
                <div className="absolute inset-0 rounded-full border border-[#FFC0CB] animate-ping opacity-20"></div>
                <CalendarHeart className="w-16 h-16 text-[#FFC0CB]" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">Regl Dönemindesin</h2>
             <p className="text-[#FFC0CB] max-w-xs">
               Kendine nazik davran. Bol su içmeyi ve dinlenmeyi unutma.
             </p>
           </>
         ) : (
           <>
             <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center mb-6 relative bg-dark-bg/50 ${isApproaching ? 'border-[#FFC0CB] shadow-[0_0_30px_rgba(255,192,203,0.3)]' : 'border-[#C8A2C8]/30'}`}>
                <div className="text-center">
                  <span className={`block text-4xl font-bold ${isApproaching ? 'text-[#FFC0CB]' : 'text-white'}`}>
                    {status.daysUntilNext < 0 ? 0 : status.daysUntilNext}
                  </span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Gün Kaldı</span>
                </div>
             </div>
             
             {isApproaching ? (
               <h2 className="text-2xl font-bold text-[#FFC0CB] mb-1">Yaklaşıyor</h2>
             ) : (
               <h2 className="text-2xl font-bold text-white mb-1">Döngü Normal</h2>
             )}
             
             <p className="text-gray-400 text-sm">
               Tahmini Başlangıç: <span className="text-white font-medium">{status.nextDate ? new Date(status.nextDate).toLocaleDateString('tr-TR', {day: 'numeric', month: 'long'}) : '-'}</span>
             </p>
           </>
         )}
      </div>

      {/* LOG BUTTONS ACTION AREA */}
      {!isActive && (
        <div className="w-full space-y-3">
            <button 
            onClick={handleQuickLog}
            className="w-full py-4 bg-gradient-to-r from-[#FFC0CB] to-[#C8A2C8] hover:opacity-90 text-gray-900 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
            >
            <CheckCircle className="w-6 h-6" /> Regl Bugün Başladı
            </button>

            <button 
                onClick={() => {
                    setManualDate(getTodayDateString());
                    setManualNote('');
                    setIsDatePickerOpen(true);
                }}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
                <CalendarIcon className="w-4 h-4" /> Farklı bir tarih seç
            </button>
        </div>
      )}

      {/* CALENDAR VIEW */}
      <div className="bg-dark-card rounded-2xl border border-dark-input p-5">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#FFC0CB]" /> Takvim
            </h3>
            <div className="flex items-center gap-2 bg-dark-input rounded-lg p-1">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:text-white text-gray-400">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium w-24 text-center text-white">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:text-white text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-[10px] justify-center">
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FFC0CB]"></span>
                <span className="text-gray-400">Geçmiş</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full border border-[#FFC0CB] border-dashed"></span>
                <span className="text-gray-400">Tahmin</span>
            </div>
        </div>

        {/* Week Header */}
        <div className="grid grid-cols-7 mb-2">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="text-center text-[10px] text-gray-500 uppercase font-bold">
                    {day}
                </div>
            ))}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
        </div>
      </div>

      {/* HISTORY LIST */}
      <div className="bg-dark-card p-5 rounded-2xl border border-dark-input">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" /> Geçmiş Dönemler
        </h3>
        {data.history.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Henüz kayıt yok.</p>
        ) : (
          <div className="space-y-3">
             {data.history.slice(0, 5).map((record, idx) => (
               <div 
                 key={idx} 
                 onClick={() => openEditNote(record)}
                 className="flex items-center justify-between p-3 bg-dark-input/30 rounded-xl border border-dark-input/50 hover:border-[#FFC0CB]/30 cursor-pointer transition-all group"
               >
                  <div className="flex items-center gap-3">
                      <div className="text-gray-900 bg-[#FFC0CB] p-2 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                          <span className="text-gray-200 text-sm font-medium block">
                            {new Date(record.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {record.note && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <FileText className="w-3 h-3" /> Not eklendi
                              </span>
                          )}
                      </div>
                  </div>
                  <Edit2 className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
               </div>
             ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CycleTracker;
