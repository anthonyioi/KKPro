import React, { useState, useEffect } from 'react';
import { MealItem, DailyLog } from '../types';
import { addMealToDay, getTodayDateString, loadData, removeMealFromDay, saveNutritionPlan, getNutritionPlan, applyPlanToWeek, getStartOfWeek, getUserProfile, updateWaterIntake } from '../services/storageService';
import { analyzeFood } from '../services/geminiService';
import { Plus, Trash2, Loader2, Info, Calendar, Save, PieChart as PieIcon, Droplets, Minus, GlassWater } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Nutrition: React.FC = () => {
  const [mode, setMode] = useState<'log' | 'plan'>('log');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [weekDates, setWeekDates] = useState<{ day: string; date: string; iso: string }[]>([]);
  const [calorieGoal, setCalorieGoal] = useState<number>(1500);
  const [waterGoal, setWaterGoal] = useState<number>(2500);
  
  const [plan, setPlan] = useState<MealItem[]>([]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLogs(loadData());
    const savedPlan = getNutritionPlan();
    if (savedPlan) {
      setPlan(savedPlan.meals);
    }
    const profile = getUserProfile();
    setCalorieGoal(profile.dailyCalorieGoal || 1500);
    setWaterGoal(profile.dailyWaterGoal || 2500);
    generateWeekDays();
  }, []);

  const generateWeekDays = () => {
    const start = getStartOfWeek(new Date());
    const days = [];
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        day: dayNames[i],
        date: d.getDate().toString(),
        iso: iso
      });
    }
    setWeekDates(days);
  };

  const currentLog = logs[selectedDate] || { date: selectedDate, meals: [], workouts: [], waterIntake: 0 };
  const displayedMeals = mode === 'log' ? currentLog.meals : plan;
  const currentWater = currentLog.waterIntake || 0;

  const totals = displayedMeals.reduce((acc, meal) => {
    acc.calories += meal.macros.calories || 0;
    acc.protein += meal.macros.protein || 0;
    acc.carbs += meal.macros.carbs || 0;
    acc.fat += meal.macros.fat || 0;
    acc.fiber += meal.macros.fiber || 0;
    acc.potassium += meal.macros.potassium || 0;
    acc.sodium += meal.macros.sodium || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, potassium: 0, sodium: 0 });

  // Chart Data Preparation
  const macroData = [
    { name: 'Protein', value: totals.protein, color: '#60a5fa' }, // blue-400
    { name: 'Karb', value: totals.carbs, color: '#34d399' },   // emerald-400
    { name: 'Yağ', value: totals.fat, color: '#facc15' },      // yellow-400
  ].filter(d => d.value > 0);

  // Normalized for Bar Chart
  const microData = [
    { name: 'Lif', pct: Math.min(100, (totals.fiber / 30) * 100), value: totals.fiber, unit: 'g', max: 30, color: '#d1d5db' },
    { name: 'Potasyum', pct: Math.min(100, (totals.potassium / 3500) * 100), value: totals.potassium, unit: 'mg', max: 3500, color: '#C8A2C8' }, // Lilac
    { name: 'Sodyum', pct: Math.min(100, (totals.sodium / 2300) * 100), value: totals.sodium, unit: 'mg', max: 2300, color: '#FFC0CB' }, // Pink
  ];

  const handleAddFood = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const analysis = await analyzeFood(input);
      const newMeal: MealItem = {
        id: Date.now().toString(),
        name: analysis.name,
        macros: analysis.macros,
        timestamp: Date.now()
      };

      if (mode === 'log') {
        const updatedDay = addMealToDay(selectedDate, newMeal);
        setLogs(prev => ({ ...prev, [selectedDate]: updatedDay }));
      } else {
        const newPlan = [...plan, newMeal];
        setPlan(newPlan);
      }
      setInput('');
    } catch (e) {
      alert("Bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    if (mode === 'log') {
      const updatedDay = removeMealFromDay(selectedDate, id);
      setLogs(prev => ({ ...prev, [selectedDate]: updatedDay }));
    } else {
      setPlan(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleUpdateWater = (amount: number) => {
    const updatedDay = updateWaterIntake(selectedDate, amount);
    setLogs(prev => ({ ...prev, [selectedDate]: updatedDay }));
  };

  const savePlanAndApply = () => {
    if (confirm("Bu diyet planını kaydedip bu haftanın tüm günlerine (Pazartesi - Pazar) uygulamak istiyor musun?")) {
      saveNutritionPlan(plan);
      applyPlanToWeek();
      setLogs(loadData());
      setMode('log');
      alert("Plan başarıyla haftaya uygulandı! Günler arasında geçiş yaparak kontrol edebilirsin.");
    }
  };

  const MacroCard = ({ label, value, unit, color }: any) => (
    <div className="bg-dark-bg/50 rounded-lg p-3 border border-dark-input text-center flex-1">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{Math.round(value)}{unit}</p>
    </div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-card p-2 border border-dark-input rounded-lg shadow-xl text-xs">
          <p className="font-bold text-white mb-1">{data.name}</p>
          <p className="text-gray-300">
            {Math.round(data.value || payload[0].value)} {data.unit || 'g'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-24">
       <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
           <h1 className="text-2xl font-bold text-white">Beslenme Programı</h1>
           <div className="flex bg-dark-card rounded-lg p-1 border border-dark-input">
             <button 
               onClick={() => setMode('log')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'log' ? 'bg-dark-input text-white shadow' : 'text-gray-400 hover:text-white'}`}
             >
               Günlük
             </button>
             <button 
               onClick={() => setMode('plan')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${mode === 'plan' ? 'bg-[#FFC0CB] text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}
             >
               <Calendar className="w-3 h-3" /> Diyet Planım
             </button>
           </div>
        </div>
        
        {mode === 'plan' ? (
           <div className="bg-[#FFC0CB]/10 border border-[#FFC0CB]/20 p-3 rounded-xl flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-[#FFC0CB] mt-0.5 shrink-0" />
              <div>
                <p className="text-[#FFC0CB] text-sm font-medium">Haftalık Diyet Şablonu</p>
                <p className="text-pink-200/70 text-xs mt-1">Burada oluşturduğun ideal günü kaydederek tüm haftana otomatik olarak uygulayabilirsin.</p>
              </div>
           </div>
        ) : (
          /* Week Day Selector */
          <div className="flex justify-between items-center bg-dark-card p-2 rounded-xl border border-dark-input mb-4 overflow-x-auto scrollbar-hide">
            {weekDates.map((d) => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={`flex flex-col items-center justify-center min-w-[44px] py-2 px-1 rounded-lg transition-all ${isSelected ? 'bg-[#FFC0CB] text-gray-900 shadow-lg scale-105' : 'text-gray-400 hover:bg-dark-input/50'}`}
                >
                  <span className="text-[10px] font-medium uppercase opacity-80">{d.day}</span>
                  <span className="text-lg font-bold leading-none mt-1">{d.date}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Water Tracker Widget (Only in Log Mode) */}
      {mode === 'log' && (
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-input shadow-lg mb-6 relative overflow-hidden">
           {/* Background Gradient */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8A2C8]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
           
           <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="flex items-center gap-2">
               <div className="bg-[#C8A2C8]/20 p-2 rounded-lg">
                 <Droplets className="w-5 h-5 text-[#C8A2C8]" />
               </div>
               <div>
                 <h3 className="text-white font-bold text-sm">Su Tüketimi</h3>
                 <p className="text-xs text-gray-400">Hidrasyon takibi</p>
               </div>
             </div>
             <div className="text-right">
               <span className="text-2xl font-bold text-white">{currentWater}</span>
               <span className="text-xs text-gray-500"> / {waterGoal} ml</span>
             </div>
           </div>

           {/* Progress Bar */}
           <div className="h-4 bg-dark-bg rounded-full overflow-hidden mb-4 border border-dark-input relative">
             <div 
               className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#C8A2C8] to-[#FFC0CB] transition-all duration-500 ease-out"
               style={{ width: `${Math.min(100, (currentWater / waterGoal) * 100)}%` }}
             ></div>
           </div>

           {/* Controls */}
           <div className="flex gap-2 relative z-10">
             <button 
               onClick={() => handleUpdateWater(-200)}
               className="p-2 rounded-xl bg-dark-input hover:bg-dark-input/80 text-gray-400 transition-colors"
             >
               <Minus className="w-5 h-5" />
             </button>
             <button 
               onClick={() => handleUpdateWater(200)}
               className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#C8A2C8]/10 hover:bg-[#C8A2C8]/20 text-[#C8A2C8] border border-[#C8A2C8]/30 transition-colors"
             >
               <GlassWater className="w-4 h-4" /> +200ml
             </button>
             <button 
               onClick={() => handleUpdateWater(500)}
               className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#FFC0CB]/10 hover:bg-[#FFC0CB]/20 text-[#FFC0CB] border border-[#FFC0CB]/30 transition-colors"
             >
               <Droplets className="w-4 h-4" /> +500ml
             </button>
           </div>
        </div>
      )}

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        {/* Macro Distribution */}
        <div className="bg-dark-card p-5 rounded-2xl border border-dark-input shadow-lg flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 z-10">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-[#FFC0CB]" />
                    {mode === 'log' ? 'Günlük Makro' : 'Plan Makrosu'}
                </h3>
                <div className="text-right">
                    <span className="text-2xl font-bold text-white">{Math.round(totals.calories)}</span>
                    <span className="text-xs text-gray-500 block">/ {calorieGoal} kcal</span>
                </div>
            </div>
            
            <div className="flex-1 min-h-[160px] relative z-10">
                {macroData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={macroData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {macroData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                verticalAlign="bottom" 
                                iconSize={8}
                                wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
                        Henüz veri yok
                    </div>
                )}
            </div>
            {/* Background decoration */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-tl from-[#FFC0CB]/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Micro Nutrients */}
        <div className="bg-dark-card p-5 rounded-2xl border border-dark-input shadow-lg flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#C8A2C8]" />
                Mikro Besinler (% Günlük)
            </h3>
            <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={microData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }} barSize={16}>
                        <XAxis type="number" hide domain={[0, 100] as [number, number]} />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={60} 
                            tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 500}} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip 
                            cursor={{fill: '#ffffff05'}}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-dark-card p-2 border border-dark-input rounded-lg text-xs shadow-xl z-50">
                                            <div className="font-bold text-white mb-1">{data.name}</div>
                                            <div className="text-gray-300 flex gap-2">
                                                <span>{Math.round(data.value)}{data.unit}</span>
                                                <span className="text-gray-500">/ {data.max}{data.unit}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="pct" radius={[0, 4, 4, 0] as [number, number, number, number]} background={{ fill: '#374151', radius: 4 }}>
                            {microData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Detailed Stats Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
         <MacroCard label="Protein" value={totals.protein} unit="g" color="text-blue-400" />
         <MacroCard label="Karb" value={totals.carbs} unit="g" color="text-emerald-400" />
         <MacroCard label="Yağ" value={totals.fat} unit="g" color="text-yellow-400" />
         <MacroCard label="Lif" value={totals.fiber} unit="g" color="text-gray-300" />
         <MacroCard label="Sodyum" value={totals.sodium} unit="mg" color="text-[#FFC0CB]" />
      </div>

      {/* Input Area */}
      <div className="mb-6 relative">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'log' ? `${new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long' })} gününe ne ekleyelim?` : "Diyet planına ne ekleyelim?"}
          className="w-full bg-dark-input text-white pl-4 pr-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB] placeholder-gray-500 transition-all shadow-sm border border-transparent focus:border-[#FFC0CB]"
          onKeyDown={(e) => e.key === 'Enter' && handleAddFood()}
        />
        <button 
          onClick={handleAddFood}
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 bg-[#FFC0CB] hover:bg-[#FFC0CB]/90 text-gray-900 w-12 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 shadow-lg"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Action Button for Plan Mode */}
      {mode === 'plan' && plan.length > 0 && (
        <button 
          onClick={savePlanAndApply}
          className="w-full mb-6 bg-gradient-to-r from-[#C8A2C8] to-[#FFC0CB] hover:opacity-90 text-gray-900 py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-5 h-5" /> Planı Kaydet ve Haftaya Uygula
        </button>
      )}

      {/* Meal List */}
      <div className="space-y-3">
        {displayedMeals.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-dark-input rounded-2xl">
                <UtensilsIcon className="w-10 h-10 text-dark-input mx-auto mb-2" />
                <p className="text-gray-500">Liste boş.</p>
            </div>
        )}

        {displayedMeals.map((meal, index) => (
          <div key={meal.id} className="bg-dark-card rounded-xl p-4 border border-dark-input group hover:border-gray-600 transition-all shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">{(index + 1).toString().padStart(2, '0')}</span>
                    <h4 className="text-white font-medium text-lg">{meal.name}</h4>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex gap-3 ml-6">
                    <span className="text-[#FFC0CB] font-bold">{meal.macros.calories} kcal</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full mt-1.5"></span>
                    <span>P: {meal.macros.protein}g</span>
                    <span>C: {meal.macros.carbs}g</span>
                    <span>Y: {meal.macros.fat}g</span>
                  </div>
               </div>
               <button 
                onClick={() => handleRemove(meal.id)}
                className="text-dark-input hover:text-red-400 p-2 rounded-lg hover:bg-dark-input/50 transition-colors"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UtensilsIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
)

export default Nutrition;