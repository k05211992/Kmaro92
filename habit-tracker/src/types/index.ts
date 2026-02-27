export interface Habit {
  id: string;
  name: string;
  goal?: number; // желаемое кол-во дней в месяце
}

// completions[day][habitId] = true/false
export type Completions = Record<number, Record<string, boolean>>;

// mood[day] = 1..5, отсутствует если не заполнено
export type Mood = Record<number, number>;

export interface MonthData {
  habits: Habit[];
  completions: Completions;
  mood: Mood;
}

// Ключ — "год-месяц", например "2026-2"
export type AppStore = Record<string, MonthData>;
