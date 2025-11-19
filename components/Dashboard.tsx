import React, { useEffect, useState } from 'react';
import { UserStats } from '../types';
import { calculateStats } from '../services/storageService';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Heart, Utensils, TrendingUp, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({
    nutritionScore: 0,
    cardioScore: 0,
    workoutScore: 0,
    generalAverage: 0
  });

  useEffect(() => {
    setStats(calculateStats());
  }, []);

  const chartData = [
    { name: 'Beslenme', uv: stats.nutritionScore, fill: '#FFC0CB' }, // Brand Pink
    { name: 'Kardiyo', uv: stats.cardioScore, fill: '#C8A2C8' }, // Brand Lilac
    { name: 'Antrenman', uv: stats.workoutScore, fill: '#10b981' }, // Emerald (Keep for contrast)
  ];

  const ScoreCard = ({ title, value, icon: Icon, colorClass, iconBgClass, subText }: any) => (
    <div className="bg-dark-card p-6 rounded-2xl border border-dark-input shadow-lg flex flex-col relative overflow-hidden group hover:border-[#C8A2C8]/50 transition-colors">
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconBgClass} ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4 z-10">{subText}</p>
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity bg-current ${colorClass}`}></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-white">Performansım</h1>
        <p className="text-gray-400 mt-1 text-sm">Genel durum ve hedeflerin.</p>
      </header>

      {/* General Average Hero Section */}
      <div className="bg-dark-card rounded-3xl p-8 shadow-2xl border border-dark-input relative overflow-hidden group">
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-[#FFC0CB] to-[#C8A2C8] opacity-10 rounded-full blur-3xl"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-input/50 border border-dark-input mb-4">
                <Zap className="w-4 h-4 text-[#FFC0CB]" fill="currentColor" />
                <span className="text-xs font-medium text-gray-300">Haftalık Rapor</span>
              </div>
              <h2 className="text-gray-300 text-xl font-medium mb-2">Genel Ortalamanız</h2>
              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                <span className="text-7xl font-extrabold text-white tracking-tight">
                  {stats.generalAverage}
                </span>
                <span className="text-2xl text-gray-500 font-medium">/100</span>
              </div>
              <p className="text-sm text-gray-400 mt-4 max-w-md leading-relaxed">
                {stats.generalAverage > 80 
                  ? "Mükemmel bir denge yakaladın! Beslenme ve antrenman uyumun harika." 
                  : "Hedeflerine ulaşmak için antrenman sürekliliğini ve beslenme takibini artırabilirsin."}
              </p>
            </div>
            
            <div className="w-48 h-48 relative flex-shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={12} data={chartData} startAngle={90} endAngle={-270}>
                  <RadialBar
                    background={{ fill: '#374151' }}
                    dataKey="uv"
                    cornerRadius={10}
                  />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Activity className="w-8 h-8 text-gray-600" />
              </div>
            </div>
         </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard 
          title="Beslenme Ortalaması" 
          value={`%${stats.nutritionScore}`} 
          icon={Utensils} 
          colorClass="text-[#FFC0CB]" 
          iconBgClass="bg-[#FFC0CB]/20"
          subText="Günlük kalori hedefine uyum"
        />
        <ScoreCard 
          title="Kardiyo Ortalaması" 
          value={`%${stats.cardioScore}`} 
          icon={Heart} 
          colorClass="text-[#C8A2C8]"
          iconBgClass="bg-[#C8A2C8]/20" 
          subText="Kalp atış hızı ve süreklilik"
        />
        <ScoreCard 
          title="Antrenman Ortalaması" 
          value={`%${stats.workoutScore}`} 
          icon={Activity} 
          colorClass="text-emerald-400" 
          iconBgClass="bg-emerald-500/20"
          subText="Tamamlanan setler ve yoğunluk"
        />
      </div>

       {/* Weekly Advice Section */}
      <div className="bg-dark-card p-6 rounded-2xl border border-dark-input">
        <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#C8A2C8]/10 p-2 rounded-lg">
              <TrendingUp className="text-[#C8A2C8] w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Gelişim Önerileri</h3>
        </div>
        <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-input/30 border border-dark-input/50">
                <span className="w-2 h-2 rounded-full bg-[#FFC0CB] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-300">
                  Potasyum alımını artırmak için diyetine daha fazla muz veya ıspanak eklemeyi düşünebilirsin.
                </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-input/30 border border-dark-input/50">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-300">
                  Antrenman hacmin iyi görünüyor, ancak set aralarındaki dinlenme süresini 45 saniyeye düşürerek yoğunluğu artırabilirsin.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;