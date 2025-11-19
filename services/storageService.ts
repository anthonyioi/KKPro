


import { DailyLog, MealItem, WorkoutSession, UserStats, NutritionPlan, UserProfile, WeightRecord, CycleData, CycleStatus } from '../types';

// Simulating a database structure
const STORAGE_KEY = 'fittrack_data_v1';
const PLAN_KEY = 'fittrack_nutrition_plan_v1';
const PROFILE_KEY = 'fittrack_profile_v1';
const CYCLE_KEY = 'fittrack_cycle_v1';

export const getTodayDateString = (): string => {
  // Use local time instead of ISO UTC to prevent timezone bugs (logging yesterday instead of today)
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get the Monday of the current week
export const getStartOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

export const loadData = (): Record<string, DailyLog> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const saveData = (data: Record<string, DailyLog>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Nutrition Plan Features ---

export const saveNutritionPlan = (meals: MealItem[]) => {
  const plan: NutritionPlan = {
    meals,
    lastUpdated: Date.now()
  };
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
};

export const getNutritionPlan = (): NutritionPlan | null => {
  const stored = localStorage.getItem(PLAN_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const applyPlanToWeek = () => {
  const plan = getNutritionPlan();
  if (!plan) return;

  const data = loadData();
  const startOfWeek = getStartOfWeek();
  
  // Loop for 7 days starting from Monday
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    // We construct the date string manually to ensure local consistency if needed, 
    // but for plan application, the slight offset usually isn't as critical as "today".
    // However, let's be consistent:
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Create deep copies of meals with new IDs to avoid reference issues
    const newMeals = plan.meals.map((m, idx) => ({
      ...m,
      id: `${dateStr}-plan-${idx}-${Date.now()}`, // Unique ID for this instance
      timestamp: Date.now()
    }));

    if (!data[dateStr]) {
      data[dateStr] = { date: dateStr, meals: [], workouts: [], waterIntake: 0 };
    }
    
    // Replace existing meals with the plan
    data[dateStr].meals = newMeals;
  }
  
  saveData(data);
};

// --- Profile & Weight Features ---

export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) {
    const profile = JSON.parse(stored);
    // Ensure backward compatibility
    if (!profile.dailyCalorieGoal) profile.dailyCalorieGoal = 1500;
    if (!profile.dailyWaterGoal) profile.dailyWaterGoal = 2500;
    return profile;
  }
  // Default initial profile
  return {
    name: 'Kullanıcı',
    height: 175,
    startWeight: 80,
    currentWeight: 80,
    targetWeight: 70,
    dailyCalorieGoal: 1500,
    dailyWaterGoal: 2500,
    weightHistory: [
      { date: getTodayDateString(), weight: 80 }
    ]
  };
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const addWeightLog = (weight: number) => {
  const profile = getUserProfile();
  const today = getTodayDateString();
  
  // Check if entry exists for today, update it; otherwise push new
  const existingIndex = profile.weightHistory.findIndex(w => w.date === today);
  
  if (existingIndex >= 0) {
    profile.weightHistory[existingIndex].weight = weight;
  } else {
    profile.weightHistory.push({ date: today, weight });
  }
  
  // Sort history by date
  profile.weightHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  profile.currentWeight = weight;
  saveUserProfile(profile);
  return profile;
};

// --- Cycle Tracking Features ---

export const getCycleData = (): CycleData => {
  const stored = localStorage.getItem(CYCLE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    if (data.notificationsEnabled === undefined) data.notificationsEnabled = true;
    
    // Infer prediction mode for existing data if missing
    if (!data.predictionMode) {
        if (data.cycleLength === 28 && data.periodLength === 5) {
            data.predictionMode = 'standard';
        } else {
            data.predictionMode = 'custom';
        }
    }

    // DATA MIGRATION: Check if history items are strings (old format) and convert to objects
    if (data.history.length > 0 && typeof data.history[0] === 'string') {
        data.history = data.history.map((d: any) => ({ startDate: d, note: '' }));
    }
    
    return data;
  }
  return {
    lastPeriodStart: null,
    cycleLength: 28, // Default standard
    periodLength: 5, // Default standard
    history: [],
    notificationsEnabled: true,
    predictionMode: 'standard' // Default for new users
  };
};

export const saveCycleData = (data: CycleData) => {
  localStorage.setItem(CYCLE_KEY, JSON.stringify(data));
};

export const logPeriodStart = (date: string = getTodayDateString(), note: string = ''): CycleData => {
  const data = getCycleData();
  
  const existingIndex = data.history.findIndex(r => r.startDate === date);
  
  if (existingIndex === -1) {
    data.history.unshift({ startDate: date, note });
    data.history.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  } else {
    // If exists, we can update the note if provided
    if (note) data.history[existingIndex].note = note;
  }
  
  // Provide the most recent date as lastPeriodStart
  if (data.history.length > 0) {
    data.lastPeriodStart = data.history[0].startDate;
  } else {
      data.lastPeriodStart = date;
  }

  saveCycleData(data);
  return data;
};

export const updatePeriodNote = (date: string, note: string) => {
    const data = getCycleData();
    const record = data.history.find(h => h.startDate === date);
    if (record) {
        record.note = note;
        saveCycleData(data);
    }
    return data;
};

export const calculateCycleStatus = (): CycleStatus => {
  const data = getCycleData();
  
  if (!data.lastPeriodStart) {
    return { status: 'unknown', daysUntilNext: 0, nextDate: null, isPeriodNow: false };
  }

  const lastStart = new Date(data.lastPeriodStart);
  const cycleLen = data.cycleLength;
  const periodLen = data.periodLength;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Calculate Next Period Date
  const nextPeriod = new Date(lastStart);
  nextPeriod.setDate(lastStart.getDate() + cycleLen);
  
  // Calculate time difference
  const diffTime = nextPeriod.getTime() - today.getTime();
  const daysUntilNext = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Check if currently in period
  // (Today >= LastStart) AND (Today < LastStart + PeriodLen)
  const periodEnd = new Date(lastStart);
  periodEnd.setDate(lastStart.getDate() + periodLen);
  
  // Reset hours for accurate comparison
  lastStart.setHours(0,0,0,0);
  periodEnd.setHours(0,0,0,0);

  let isPeriodNow = false;
  if (today.getTime() >= lastStart.getTime() && today.getTime() < periodEnd.getTime()) {
    isPeriodNow = true;
  }

  let status: CycleStatus['status'] = 'safe';
  if (isPeriodNow) {
    status = 'active';
  } else if (daysUntilNext <= 5 && daysUntilNext >= 0) {
    status = 'approaching';
  } else if (daysUntilNext < 0) {
     // Late
     status = 'approaching'; 
  }

  return {
    status,
    daysUntilNext,
    nextDate: nextPeriod.toISOString().split('T')[0],
    isPeriodNow
  };
};

// --- Daily Actions ---

export const addMealToDay = (date: string, meal: MealItem) => {
  const data = loadData();
  if (!data[date]) {
    data[date] = { date, meals: [], workouts: [], waterIntake: 0 };
  }
  data[date].meals.push(meal);
  saveData(data);
  return data[date];
};

export const removeMealFromDay = (date: string, mealId: string) => {
  const data = loadData();
  if (data[date]) {
    data[date].meals = data[date].meals.filter(m => m.id !== mealId);
    saveData(data);
  }
  return data[date] || { date, meals: [], workouts: [], waterIntake: 0 };
};

export const updateWaterIntake = (date: string, amount: number) => {
  const data = loadData();
  if (!data[date]) {
    data[date] = { date, meals: [], workouts: [], waterIntake: 0 };
  }
  // Ensure water intake doesn't go below 0
  const current = data[date].waterIntake || 0;
  data[date].waterIntake = Math.max(0, current + amount);
  saveData(data);
  return data[date];
};

export const addWorkoutToDay = (date: string, workout: WorkoutSession) => {
  const data = loadData();
  if (!data[date]) {
    data[date] = { date, meals: [], workouts: [], waterIntake: 0 };
  }
  data[date].workouts.push(workout);
  saveData(data);
  return data[date];
};

export const updateWorkoutInDay = (date: string, workout: WorkoutSession) => {
  const data = loadData();
  if (data[date]) {
    data[date].workouts = data[date].workouts.map(w => w.id === workout.id ? workout : w);
    saveData(data);
  }
  return data[date];
};

export const calculateStats = (): UserStats => {
  const data = loadData();
  const profile = getUserProfile();
  const calorieGoal = profile.dailyCalorieGoal || 1500;
  
  const dates = Object.keys(data);
  if (dates.length === 0) {
    return { nutritionScore: 0, cardioScore: 0, workoutScore: 0, generalAverage: 0 };
  }

  let totalNutritionPoints = 0;
  let totalWorkouts = 0;
  let totalCardio = 0;
  
  const activeDates = dates.length;

  dates.forEach(d => {
    const day = data[d];
    const dailyCals = day.meals.reduce((acc, m) => acc + m.macros.calories, 0);
    
    // Score based on goal proximity (+/- 15%)
    const lowerBound = calorieGoal * 0.85;
    const upperBound = calorieGoal * 1.15;
    
    if (dailyCals >= lowerBound && dailyCals <= upperBound) totalNutritionPoints += 100;
    else if (dailyCals > (calorieGoal * 0.5)) totalNutritionPoints += 60;
    else if (dailyCals > 0) totalNutritionPoints += 30;

    let hasCardio = false;
    let hasStrength = false;
    
    day.workouts.forEach(w => {
      if (w.completed) {
        if (w.type === 'cardio' || w.type === 'hybrid') hasCardio = true;
        if (w.type === 'strength' || w.type === 'hybrid') hasStrength = true;
      }
    });

    if (hasCardio) totalCardio += 100;
    if (hasStrength) totalWorkouts += 100;
  });

  const nutritionScore = Math.round(totalNutritionPoints / activeDates);
  const workoutScore = Math.min(100, Math.round(totalWorkouts / (activeDates * 0.6))); 
  const cardioScore = Math.min(100, Math.round(totalCardio / (activeDates * 0.4)));

  const generalAverage = Math.round((nutritionScore * 0.4 + workoutScore * 0.3 + cardioScore * 0.3));

  return {
    nutritionScore: nutritionScore || 0,
    cardioScore: cardioScore || 0,
    workoutScore: workoutScore || 0,
    generalAverage: generalAverage || 0
  };
};
