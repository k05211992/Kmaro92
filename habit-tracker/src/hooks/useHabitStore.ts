import { useState, useEffect, useCallback } from 'react';
import { AppStore, MonthData, Habit } from '../types';

const STORAGE_KEY = 'habit-tracker-v1';
export const MAX_HABITS = 50; // лимит привычек — меняй здесь

// ── 5 привычек по умолчанию ──────────────────────────────────────────────────
const PRESET_HABITS = [
  '💧 Вода',
  '🏃 Зарядка',
  '📚 Чтение',
  '🌙 Сон до 23:00',
  '🚫 Без сахара',
];

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function makeId(): string {
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyHabits(): Habit[] {
  return PRESET_HABITS.map(name => ({ id: makeId(), name, goal: undefined }));
}

function emptyMonth(): MonthData {
  return { habits: emptyHabits(), completions: {}, mood: {} };
}

function loadStore(): AppStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppStore;
  } catch { /* ignore */ }
  return {};
}

function saveStore(store: AppStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* ignore */ }
}

export function useHabitStore() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [store, setStore] = useState<AppStore>(loadStore);

  useEffect(() => { saveStore(store); }, [store]);

  const key = monthKey(year, month);
  const monthData: MonthData = store[key] ?? emptyMonth();

  const update = useCallback(
    (updater: (prev: MonthData) => MonthData) => {
      setStore(prev => ({
        ...prev,
        [key]: updater(prev[key] ?? emptyMonth()),
      }));
    },
    [key],
  );

  // ── Привычки ──────────────────────────────────────────────────────────────

  const setHabitName = useCallback(
    (id: string, name: string) =>
      update(prev => ({
        ...prev,
        habits: prev.habits.map(h => (h.id === id ? { ...h, name } : h)),
      })),
    [update],
  );

  const setHabitGoal = useCallback(
    (id: string, goal: number | undefined) =>
      update(prev => ({
        ...prev,
        habits: prev.habits.map(h => (h.id === id ? { ...h, goal } : h)),
      })),
    [update],
  );

  const addHabit = useCallback(
    () =>
      update(prev => {
        if (prev.habits.length >= MAX_HABITS) return prev;
        return {
          ...prev,
          habits: [...prev.habits, { id: makeId(), name: '', goal: undefined }],
        };
      }),
    [update],
  );

  const removeHabit = useCallback(
    (id: string) =>
      update(prev => {
        const completions = { ...prev.completions };
        for (const d in completions) {
          if (completions[Number(d)]?.[id]) {
            completions[Number(d)] = { ...completions[Number(d)] };
            delete completions[Number(d)][id];
          }
        }
        return { ...prev, habits: prev.habits.filter(h => h.id !== id), completions };
      }),
    [update],
  );

  // ── Выполнение ────────────────────────────────────────────────────────────

  const toggleCompletion = useCallback(
    (day: number, habitId: string) =>
      update(prev => {
        const dayData = prev.completions[day] ?? {};
        return {
          ...prev,
          completions: {
            ...prev.completions,
            [day]: { ...dayData, [habitId]: !dayData[habitId] },
          },
        };
      }),
    [update],
  );

  // ── Настроение ────────────────────────────────────────────────────────────

  const setMood = useCallback(
    (day: number, value: number) =>
      update(prev => ({ ...prev, mood: { ...prev.mood, [day]: value } })),
    [update],
  );

  // ── Служебные ─────────────────────────────────────────────────────────────

  const resetMonth = useCallback(() => {
    setStore(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, [key]);

  const copyHabitsFromPrev = useCallback(() => {
    const keys = Object.keys(store).filter(k => k !== key).sort().reverse();
    if (keys.length === 0) return;
    const prevHabits = store[keys[0]]?.habits;
    if (!prevHabits?.length) return;
    update(prev => ({ ...prev, habits: prevHabits.map(h => ({ ...h, id: makeId() })) }));
  }, [store, key, update]);

  const hasPrevMonthData = Object.keys(store).filter(k => k !== key).length > 0;

  return {
    year, month, setYear, setMonth,
    monthData,
    setHabitName, setHabitGoal, addHabit, removeHabit,
    toggleCompletion, setMood,
    resetMonth, copyHabitsFromPrev, hasPrevMonthData,
    maxHabits: MAX_HABITS,
  };
}
