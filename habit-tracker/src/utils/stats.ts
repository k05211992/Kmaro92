import { Habit, Completions, Mood } from '../types';

// ── Дни/недели ──────────────────────────────────────────────────────────────

export function getDaysInMonth(year: number, month: number): number {
  // month — 1-indexed (1=январь)
  return new Date(year, month, 0).getDate();
}

/** 0=вс, 1=пн, 2=вт, 3=ср, 4=чт, 5=пт, 6=сб */
export function dayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

export const DAY_ABBR = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export function isWeekend(year: number, month: number, day: number): boolean {
  const d = dayOfWeek(year, month, day);
  return d === 0 || d === 6;
}

/**
 * Разбивает месяц на недели Пн–Вс.
 * Первая «неделя» может начинаться не с понедельника (если 1-е число — другой день).
 */
export function getWeeks(year: number, month: number): number[][] {
  const dim = getDaysInMonth(year, month);
  const weeks: number[][] = [];
  let current: number[] = [];

  for (let d = 1; d <= dim; d++) {
    const dow = dayOfWeek(year, month, d);
    if (dow === 1 && current.length > 0) {
      weeks.push(current);
      current = [d];
    } else {
      current.push(d);
    }
  }
  if (current.length > 0) weeks.push(current);
  return weeks;
}

// ── Привычки ─────────────────────────────────────────────────────────────────

export function getActiveHabits(habits: Habit[]): Habit[] {
  return habits.filter(h => h.name.trim() !== '');
}

export function getHabitDoneDays(
  habitId: string,
  completions: Completions,
  daysInMonth: number,
): number {
  let n = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (completions[d]?.[habitId]) n++;
  }
  return n;
}

/**
 * % выполнения привычки:
 *   done / goal * 100, max 100.
 *   Если goal не задана — done / daysInMonth * 100.
 */
export function getHabitPercent(
  habitId: string,
  completions: Completions,
  daysInMonth: number,
  goal?: number,
): number {
  const done = getHabitDoneDays(habitId, completions, daysInMonth);
  const target = goal && goal > 0 ? goal : daysInMonth;
  if (target === 0) return 0;
  return Math.min(100, Math.round((done / target) * 100));
}

// ── Статистика ────────────────────────────────────────────────────────────────

export interface Top5Item {
  habit: Habit;
  percent: number;
  done: number;
  target: number;
}

/**
 * ТОП-5 привычек (только активные, у которых есть хотя бы 1 отметка ИЛИ цель).
 */
export function getTop5(
  habits: Habit[],
  completions: Completions,
  daysInMonth: number,
): Top5Item[] {
  const active = getActiveHabits(habits);
  return active
    .filter(h => {
      const done = getHabitDoneDays(h.id, completions, daysInMonth);
      return done > 0 || (h.goal != null && h.goal > 0);
    })
    .map(h => ({
      habit: h,
      percent: getHabitPercent(h.id, completions, daysInMonth, h.goal),
      done: getHabitDoneDays(h.id, completions, daysInMonth),
      target: h.goal && h.goal > 0 ? h.goal : daysInMonth,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);
}

export interface DayProgress {
  day: number;
  label: string;
  percent: number;
}

/**
 * % выполнений за каждый день: (отмечено привычек) / (активных привычек) * 100.
 */
export function getDailyProgress(
  completions: Completions,
  daysInMonth: number,
  activeHabits: Habit[],
): DayProgress[] {
  if (activeHabits.length === 0) return [];
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const done = activeHabits.filter(h => completions[d]?.[h.id]).length;
    return {
      day: d,
      label: String(d),
      percent: Math.round((done / activeHabits.length) * 100),
    };
  });
}

export interface WeekProgress {
  label: string;
  shortLabel: string;
  percent: number;
}

/**
 * % выполнений по неделям.
 */
export function getWeeklyProgress(
  completions: Completions,
  year: number,
  month: number,
  activeHabits: Habit[],
): WeekProgress[] {
  if (activeHabits.length === 0) return [];
  const weeks = getWeeks(year, month);
  return weeks.map((days, i) => {
    const total = days.length * activeHabits.length;
    let done = 0;
    for (const d of days) {
      done += activeHabits.filter(h => completions[d]?.[h.id]).length;
    }
    const first = days[0];
    const last = days[days.length - 1];
    return {
      label: first === last ? `Нед ${i + 1} (${first})` : `Нед ${i + 1} (${first}–${last})`,
      shortLabel: `Нед ${i + 1}`,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

export interface HabitProgress {
  habit: Habit;
  percent: number;
  done: number;
  target: number;
}

/**
 * Прогресс по каждой активной привычке.
 */
export function getAllHabitsProgress(
  habits: Habit[],
  completions: Completions,
  daysInMonth: number,
): HabitProgress[] {
  return getActiveHabits(habits).map(h => ({
    habit: h,
    percent: getHabitPercent(h.id, completions, daysInMonth, h.goal),
    done: getHabitDoneDays(h.id, completions, daysInMonth),
    target: h.goal && h.goal > 0 ? h.goal : daysInMonth,
  }));
}

// ── Настроение ────────────────────────────────────────────────────────────────

export function getAverageMood(mood: Mood): number | null {
  const values = Object.values(mood).filter(v => v > 0);
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

export interface MoodDayPoint {
  day: number;
  label: string;
  mood: number | null;
}

export function getMoodDayData(mood: Mood, daysInMonth: number): MoodDayPoint[] {
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const val = mood[d];
    return { day: d, label: String(d), mood: val > 0 ? val : null };
  });
}
