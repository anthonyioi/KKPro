import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getUserProfile, saveUserProfile, addWeightLog } from '../services/storageService';
import { AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Area } from 'recharts';
import { Scale, Ruler, Target, Save, Activity, TrendingDown, TrendingUp, Flame } from 'lucide-react';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inputWeight, setInputWeight] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editHeight, setEditHeight] = useState<string>('');
  const [editTarget, setEditTarget] = useState<string>('');
  const [editCalories, setEditCalories] = useState<string>('');

  useEffect(() => {
    const data = getUserProfile();
    setProfile(data);
    setEditHeight(data.height.toString());
    setEditTarget(data.targetWeight.toString());
    setEditCalories(data.dailyCalorieGoal.toString());
  }, []);

  if (!profile) return <div className="p-6 text-white">Yükleniyor...</div>;

  const handleAddWeight = () => {
    if (!inputWeight) return;
    const w = parseFloat(inputWeight);
    if (isNaN(w)) return;

    const updatedProfile = addWeightLog(w);
    setProfile(updatedProfile);
    setInputWeight('');
  };

  const handleSaveProfile = () => {
    const h = parseFloat(editHeight);
    const t = parseFloat(editTarget);
    const c = parseFloat(editCalories);
    if (isNaN(h) || isNaN(t) || isNaN(c)) return;

    const newProfile = { ...profile, height: h, targetWeight: t, dailyCalorieGoal: c };
    saveUserProfile(newProfile);
    setProfile(newProfile);
    setIsEditing(false);
  };

  // Calculations
  const bmi = (profile.currentWeight / ((profile.height / 100) ** 2)).toFixed(1);
  const bmiNumber = parseFloat(bmi);
  
  let bmiStatus = 'Normal';
  let bmiColor = 'text-emerald-400';
  if (bmiNumber < 18.5) { bmiStatus = 'Zayıf'; bmiColor = 'text-yellow-400'; }
  else if (bmiNumber >= 25 && bmiNumber < 30) { bmiStatus = 'Kilolu'; bmiColor = 'text-orange-400'; }
  else if (bmiNumber >= 30) { bmiStatus = 'Obez'; bmiColor = 'text-red-500'; }

  const weightDiff = (profile.currentWeight - profile.startWeight).toFixed(1);
  const toGo = (profile.currentWeight - profile.targetWeight).toFixed(1);
  const isLosing = profile.targetWeight < profile.startWeight;

  // Graph Data (Format date for X Axis)
  const chartData = profile.weightHistory.map(w => ({
    date: new Date(w.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
    weight: w.weight,
    fullDate: w.date
  }));

  return (
    <div className="pb-24 space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Vücut Analizi</h1>
          <p className="text-gray-400 text-sm">İlerleme ve hedefler.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs bg-dark-card border border-dark-input px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-colors"
        >
          {isEditing ? 'Vazgeç' : 'Hedefleri Düzenle'}
        </button>
      </header>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Current Weight */}
        <div className="bg-dark-card p-4 rounded-2xl border border-dark-input relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2">
             <Scale className="w-4 h-4 text-cyan-400" />
             <span className="text-xs text-gray-400 uppercase font-bold">Güncel Kilo</span>
           </div>
           <p className="text-2xl font-bold text-white">{profile.currentWeight} <span className="text-sm font-normal text-gray-500">kg</span></p>
        </div>

        {/* Target Weight */}
        <div className="bg-dark-card p-4 rounded-2xl border border-dark-input relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2">
             <Target className="w-4 h-4 text-[#FFC0CB]" />
             <span className="text-xs text-gray-400 uppercase font-bold">Hedef</span>
           </div>
           {isEditing ? (
             <input 
               type="number" 
               value={editTarget} 
               onChange={(e) => setEditTarget(e.target.value)} 
               className="w-full bg-dark-input text-white rounded px-2 py-1 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-[#FFC0CB]"
             />
           ) : (
             <p className="text-2xl font-bold text-white">{profile.targetWeight} <span className="text-sm font-normal text-gray-500">kg</span></p>
           )}
        </div>

        {/* Daily Calorie Goal - New Card */}
        <div className="bg-dark-card p-4 rounded-2xl border border-dark-input relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2">
             <Flame className="w-4 h-4 text-orange-400" />
             <span className="text-xs text-gray-400 uppercase font-bold">Günlük Kalori</span>
           </div>
           {isEditing ? (
             <input 
               type="number" 
               value={editCalories} 
               onChange={(e) => setEditCalories(e.target.value)} 
               className="w-full bg-dark-input text-white rounded px-2 py-1 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
             />
           ) : (
             <p className="text-2xl font-bold text-white">{profile.dailyCalorieGoal} <span className="text-sm font-normal text-gray-500">kcal</span></p>
           )}
        </div>

        {/* Height */}
        <div className="bg-dark-card p-4 rounded-2xl border border-dark-input relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2">
             <Ruler className="w-4 h-4 text-emerald-400" />
             <span className="text-xs text-gray-400 uppercase font-bold">Boy</span>
           </div>
           {isEditing ? (
             <input 
               type="number" 
               value={editHeight} 
               onChange={(e) => setEditHeight(e.target.value)} 
               className="w-full bg-dark-input text-white rounded px-2 py-1 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
             />
           ) : (
             <p className="text-2xl font-bold text-white">{profile.height} <span className="text-sm font-normal text-gray-500">cm</span></p>
           )}
        </div>

        {/* BMI */}
        <div className="bg-dark-card p-4 rounded-2xl border border-dark-input relative overflow-hidden col-span-2 md:col-span-1">
           <div className="flex items-center gap-2 mb-2">
             <Activity className="w-4 h-4 text-[#C8A2C8]" />
             <span className="text-xs text-gray-400 uppercase font-bold">VKI (BMI)</span>
           </div>
           <div className="flex items-baseline gap-2">
             <p className="text-2xl font-bold text-white">{bmi}</p>
             <p className={`text-sm font-bold ${bmiColor}`}>{bmiStatus}</p>
           </div>
        </div>

      </div>

      {isEditing && (
        <button onClick={handleSaveProfile} className="w-full py-3 bg-[#FFC0CB] text-gray-900 rounded-xl font-bold shadow-lg hover:bg-[#FFC0CB]/90 transition-colors flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Ayarları Kaydet
        </button>
      )}

      {/* Progress Bar */}
      <div className="bg-dark-card p-6 rounded-2xl border border-dark-input">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Başlangıç ({profile.startWeight}kg)</span>
          <span className="text-gray-400">Hedef ({profile.targetWeight}kg)</span>
        </div>
        <div className="h-3 bg-dark-input rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-[#C8A2C8] rounded-full transition-all duration-1000"
            style={{ 
              width: `${Math.min(100, Math.max(0, ((profile.startWeight - profile.currentWeight) / (profile.startWeight - profile.targetWeight)) * 100))}%` 
            }}
          ></div>
        </div>
        <div className="flex items-center gap-2 mt-3 justify-center">
          {parseFloat(weightDiff) < 0 ? <TrendingDown className="w-4 h-4 text-green-400" /> : <TrendingUp className="w-4 h-4 text-red-400" />}
          <p className="text-sm text-gray-300">
            <span className="font-bold text-white">{Math.abs(parseFloat(weightDiff))} kg</span> {parseFloat(weightDiff) < 0 ? 'verildi' : 'alındı'}. 
            Hedefe <span className="font-bold text-[#C8A2C8]">{Math.abs(parseFloat(toGo))} kg</span> kaldı.
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-dark-card p-5 rounded-2xl border border-dark-input shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6 pl-2 border-l-4 border-[#C8A2C8]">Kilo Değişim Grafiği</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8A2C8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C8A2C8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                tick={{fontSize: 10}} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']} 
                stroke="#9ca3af" 
                tick={{fontSize: 10}} 
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
              />
              <ReferenceLine 
                y={profile.targetWeight} 
                stroke="#FFC0CB" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ 
                  position: 'insideTopRight', 
                  value: `Hedef: ${profile.targetWeight}kg`, 
                  fill: '#FFC0CB', 
                  fontSize: 12,
                  fontWeight: 600,
                  dy: -10
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#C8A2C8" 
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                strokeWidth={3}
                activeDot={{ r: 6, fill: '#fff', stroke: '#C8A2C8' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Update Weight Input */}
      <div className="bg-dark-card p-6 rounded-2xl border border-dark-input flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <h3 className="text-white font-bold">Bugün Kaç Kilosun?</h3>
          <p className="text-gray-400 text-xs mt-1">Düzenli kilo takibi hedefe ulaşmayı kolaylaştırır.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="number" 
            placeholder="0.0" 
            value={inputWeight}
            onChange={(e) => setInputWeight(e.target.value)}
            className="bg-dark-bg border border-dark-input text-white rounded-xl px-4 py-3 w-24 text-center font-bold focus:outline-none focus:border-[#FFC0CB]"
          />
          <button 
            onClick={handleAddWeight}
            className="bg-[#C8A2C8] hover:bg-[#C8A2C8]/90 text-gray-900 px-6 py-3 rounded-xl font-bold transition-colors flex-1 md:flex-none"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;