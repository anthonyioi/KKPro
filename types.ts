
export enum Tab {
  DASHBOARD = 'DASHBOARD',
  NUTRITION = 'NUTRITION',
  WORKOUT = 'WORKOUT',
  CYCLE = 'CYCLE',
  PROFILE = 'PROFILE'
}

export interface Macros {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  potassium: number; // mg
  sodium: number; // mg
}

export interface MealItem {
  id: string;
  name: string;
  macros: Macros;
  timestamp: number; // Date.now()
}

export interface NutritionPlan {
  meals: MealItem[];
  lastUpdated: number;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio'; // Added type differentiation
  sets?: number;
  reps?: string; // e.g., "10-12" or "Failure"
  weight?: number;
  distance?: number; // km (Cardio)
  duration?: number; // minutes (Cardio)
  intensity?: string; // e.g. "Speed 6.0" or "Incline 12" (Cardio)
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  exercises: Exercise[];
  timestamp: number;
  completed: boolean;
  type: 'cardio' | 'strength' | 'hybrid';
  durationMinutes: number;
}

export interface UserStats {
  nutritionScore: number; // 0-100
  cardioScore: number; // 0-100
  workoutScore: number; // 0-100
  generalAverage: number; // 0-100
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealItem[];
  workouts: WorkoutSession[];
  waterIntake: number; // ml
}

// --- New Profile & Weight Types ---

export interface WeightRecord {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface UserProfile {
  name: string;
  height: number; // cm
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  dailyCalorieGoal: number;
  dailyWaterGoal: number; // ml
  weightHistory: WeightRecord[];
}

// --- Cycle Tracking Types ---

export interface PeriodRecord {
  startDate: string; // ISO Date YYYY-MM-DD
  note?: string;
}

export interface CycleData {
  lastPeriodStart: string | null; // ISO Date YYYY-MM-DD
  cycleLength: number; // e.g. 28
  periodLength: number; // e.g. 5
  history: PeriodRecord[]; // Array of period records
  notificationsEnabled: boolean;
  predictionMode?: 'standard' | 'custom'; // 'standard' forces 28/5, 'custom' allows user edits
}

export interface CycleStatus {
  status: 'active' | 'approaching' | 'safe' | 'unknown';
  daysUntilNext: number;
  nextDate: string | null;
  isPeriodNow: boolean;
}
