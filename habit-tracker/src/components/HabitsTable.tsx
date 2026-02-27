import { useState } from 'react';
import { Habit, Completions, Mood } from '../types';
import { getDaysInMonth, dayOfWeek, DAY_ABBR, isWeekend, getActiveHabits } from '../utils/stats';

// ── Константы ─────────────────────────────────────────────────────────────────

const MOOD_LABEL = ['–', '😞', '😕', '😐', '🙂', '😊'];

const MOOD_STYLE: Record<number, { bg: string; color: string }> = {
  0: { bg: '#1c2333',  color: '#484f58' },
  1: { bg: '#3f1515',  color: '#f87171' },
  2: { bg: '#3a1f0a',  color: '#fb923c' },
  3: { bg: '#2e2a0a',  color: '#fbbf24' },
  4: { bg: '#0f2e1c',  color: '#4ade80' },
  5: { bg: '#0a2e1a',  color: '#39ff85' },
};

// Цвета прогресс-бара дня
function barGradient(pct: number) {
  if (pct >= 80) return 'linear-gradient(to top, #39ff85, #22d3ee)';
  if (pct >= 50) return 'linear-gradient(to top, #fbbf24, #f97316)';
  return 'linear-gradient(to top, #f87171, #ef4444)';
}

interface Props {
  year: number;
  month: number;
  habits: Habit[];
  completions: Completions;
  mood: Mood;
  onSetHabitName: (id: string, name: string) => void;
  onSetHabitGoal: (id: string, goal: number | undefined) => void;
  onToggle: (day: number, habitId: string) => void;
  onRemoveHabit: (id: string) => void;
  onSetMood: (day: number, value: number) => void;
}

export function HabitsTable({
  year, month,
  habits, completions, mood,
  onSetHabitName, onSetHabitGoal,
  onToggle, onRemoveHabit, onSetMood,
}: Props) {
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const activeHabits = getActiveHabits(habits);

  // Определяем сегодняшний день (только если совпадает год и месяц)
  const now = new Date();
  const todayDay =
    now.getFullYear() === year && now.getMonth() + 1 === month
      ? now.getDate()
      : null;

  // Ключи клеток, которые сейчас анимируются (check-pop)
  const [animating, setAnimating] = useState<Set<string>>(new Set());

  // Тултип для «Цель» — fixed-позиция чтобы не обрезался таблицей
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);

  const handleToggle = (day: number, habitId: string) => {
    const willCheck = !completions[day]?.[habitId];
    onToggle(day, habitId);
    if (willCheck) {
      const k = `${day}|${habitId}`;
      setAnimating(prev => new Set([...prev, k]));
      setTimeout(() => setAnimating(prev => {
        const next = new Set(prev); next.delete(k); return next;
      }), 350);
    }
  };

  const handleMoodClick = (day: number) => {
    const cur = mood[day] ?? 0;
    onSetMood(day, cur < 5 ? cur + 1 : 0);
  };

  // ── Стили ──────────────────────────────────────────────────────────────────

  const thBase: React.CSSProperties = {
    background: '#161b22', color: '#8b949e',
    borderColor: '#30363d', fontWeight: 600,
  };
  const tdBorder = '1px solid #30363d';
  const stickyNameBg = '#0d1117';
  const weekendBg   = '#130e18';
  const weekendColor = '#fb923c';

  return (
    <>
    <div className="overflow-x-auto">
      <table
        className="border-collapse text-sm w-full"
        style={{ minWidth: `${240 + daysInMonth * 34}px` }}
      >
        <thead>
          {/* Строка 1: числа */}
          <tr>
            <th
              className="sticky left-0 z-30 text-left px-2 py-1.5 whitespace-nowrap"
              style={{ ...thBase, minWidth: 180, border: tdBorder }}
            >
              Привычка
            </th>
            <th
              style={{ ...thBase, minWidth: 56, border: tdBorder, textAlign: 'center', cursor: 'help' }}
              onMouseEnter={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setTipPos({ x: r.left + r.width / 2, y: r.top });
              }}
              onMouseLeave={() => setTipPos(null)}
            >
              Цель&nbsp;<span style={{ color: '#484f58', fontSize: 11 }}>ⓘ</span>
            </th>
            {days.map(d => {
              const weekend = isWeekend(year, month, d);
              const isToday = d === todayDay;
              return (
                <th
                  key={d}
                  style={{
                    ...thBase,
                    minWidth: 34, width: 34,
                    textAlign: 'center',
                    background: isToday ? '#0a1e2e' : weekend ? weekendBg : '#161b22',
                    color: isToday ? '#22d3ee' : weekend ? weekendColor : '#8b949e',
                    border: tdBorder,
                    borderTop: isToday ? '2px solid #22d3ee' : undefined,
                    paddingTop: isToday ? 2 : 4,
                    paddingBottom: 4,
                    fontWeight: isToday ? 800 : 600,
                  }}
                >
                  {isToday && (
                    <div style={{ fontSize: 8, letterSpacing: 0, marginBottom: 1, opacity: 0.8 }}>
                      сег.
                    </div>
                  )}
                  {d}
                </th>
              );
            })}
            <th style={{ ...thBase, minWidth: 48, border: tdBorder, textAlign: 'center', fontSize: 11 }}>
              Итого
            </th>
          </tr>

          {/* Строка 2: дни недели */}
          <tr>
            <th
              className="sticky left-0 z-30 text-left px-2"
              style={{ ...thBase, fontWeight: 400, fontSize: 11, border: tdBorder, background: '#161b22' }}
            >
              название
            </th>
            <th style={{ ...thBase, fontWeight: 400, fontSize: 11, border: tdBorder, textAlign: 'center' }}>
              (дней)
            </th>
            {days.map(d => {
              const dow = dayOfWeek(year, month, d);
              const weekend = dow === 0 || dow === 6;
              const isToday = d === todayDay;
              return (
                <th
                  key={d}
                  style={{
                    ...thBase, fontWeight: 400, fontSize: 10,
                    background: isToday ? '#0a1e2e' : weekend ? weekendBg : '#161b22',
                    color: isToday ? '#22d3ee' : weekend ? weekendColor : '#484f58',
                    border: tdBorder, textAlign: 'center', paddingBottom: 2,
                  }}
                >
                  {DAY_ABBR[dow]}
                </th>
              );
            })}
            <th style={{ ...thBase, border: tdBorder }} />
          </tr>
        </thead>

        <tbody>
          {/* ── Строки привычек ────────────────────────────────────────────── */}
          {habits.map((habit, idx) => {
            const doneDays = days.filter(d => completions[d]?.[habit.id]).length;

            return (
              <tr
                key={habit.id}
                className="group"
                style={{ background: '#0d1117' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1c2333')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0d1117')}
              >
                {/* Название (sticky) */}
                <td
                  className="sticky left-0 z-10 px-1 py-0.5"
                  style={{ background: stickyNameBg, border: tdBorder, minWidth: 180 }}
                >
                  <div className="flex items-center gap-1">
                    <span style={{ color: '#30363d', fontSize: 11, width: 16, textAlign: 'right', flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={habit.name}
                      onChange={e => onSetHabitName(habit.id, e.target.value)}
                      placeholder="Название привычки"
                      className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm"
                      style={{ color: '#e6edf3' }}
                    />
                    <button
                      onClick={() => onRemoveHabit(habit.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-0.5 shrink-0"
                      style={{ color: '#484f58' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#484f58')}
                      title="Удалить привычку"
                    >
                      ×
                    </button>
                  </div>
                </td>

                {/* Цель */}
                <td style={{ border: tdBorder, textAlign: 'center' }}>
                  <input
                    type="number"
                    min={1} max={31}
                    value={habit.goal ?? ''}
                    onChange={e => {
                      const v = e.target.value;
                      onSetHabitGoal(habit.id, v === '' ? undefined : Math.max(1, Math.min(31, Number(v))));
                    }}
                    placeholder="–"
                    title="Желаемое число дней в месяце (1–31)"
                    className="w-full text-center bg-transparent border-0 outline-none text-sm"
                    style={{ color: '#8b949e' }}
                  />
                </td>

                {/* Чекбоксы */}
                {days.map(d => {
                  const checked = !!(completions[d]?.[habit.id]);
                  const weekend = isWeekend(year, month, d);
                  const isToday = d === todayDay;
                  const animKey = `${d}|${habit.id}`;
                  const isAnimating = animating.has(animKey);

                  return (
                    <td
                      key={d}
                      style={{
                        border: tdBorder, padding: 0, textAlign: 'center',
                        background: isToday ? '#0a1e2e' : weekend ? weekendBg : 'transparent',
                      }}
                    >
                      <button
                        onClick={() => handleToggle(d, habit.id)}
                        className={`w-full flex items-center justify-center transition-colors ${isAnimating ? 'animate-check-pop' : ''}`}
                        style={{
                          height: 28,
                          background: checked
                            ? 'linear-gradient(135deg, #0a2e1a, #0d3320)'
                            : 'transparent',
                          color: checked ? '#39ff85' : '#30363d',
                        }}
                        onMouseEnter={e => {
                          if (!checked) e.currentTarget.style.background = '#1c2333';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = checked
                            ? 'linear-gradient(135deg, #0a2e1a, #0d3320)'
                            : 'transparent';
                        }}
                        aria-label={checked ? 'Выполнено' : 'Не выполнено'}
                      >
                        <span
                          className="select-none text-xs font-bold"
                          style={{
                            textShadow: checked ? '0 0 8px #39ff85' : 'none',
                            transition: 'text-shadow 0.2s',
                          }}
                        >
                          ✓
                        </span>
                      </button>
                    </td>
                  );
                })}

                {/* Итого */}
                <td style={{ border: tdBorder, textAlign: 'center', fontSize: 11 }}>
                  {doneDays > 0 && (
                    <span style={{ color: '#39ff85', fontWeight: 600 }}>
                      {doneDays}{habit.goal ? `/${habit.goal}` : ''}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {/* ── Дневной прогресс-бар ─────────────────────────────────────────── */}
          <tr>
            <td
              className="sticky left-0 z-10 px-2 py-1 text-xs font-semibold whitespace-nowrap"
              style={{ background: '#0d1117', border: tdBorder, color: '#22d3ee' }}
            >
              📊 % за день
            </td>
            <td style={{ border: tdBorder }} />
            {days.map(d => {
              const total = activeHabits.length;
              const done = total > 0 ? activeHabits.filter(h => completions[d]?.[h.id]).length : 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <td
                  key={d}
                  style={{
                    border: tdBorder, padding: '2px 2px 0',
                    height: 44, position: 'relative',
                    background: d === todayDay ? '#0a1e2e' : isWeekend(year, month, d) ? weekendBg : '#080c14',
                    verticalAlign: 'bottom',
                  }}
                  title={`${d}-е: ${done}/${total} привычек (${pct}%)`}
                >
                  {pct > 0 && (
                    <>
                      {/* Процент сверху */}
                      <span style={{
                        position: 'absolute', top: 2, left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 9, color: '#8b949e', whiteSpace: 'nowrap',
                      }}>
                        {pct}%
                      </span>
                      {/* Бар снизу */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 2, right: 2,
                        height: `${Math.max(2, pct * 0.32)}px`,
                        background: barGradient(pct),
                        borderRadius: '2px 2px 0 0',
                        boxShadow: pct >= 80 ? '0 0 6px #39ff8566' : 'none',
                        transition: 'height 0.4s ease',
                        transformOrigin: 'bottom',
                      }} />
                    </>
                  )}
                </td>
              );
            })}
            <td style={{ border: tdBorder }} />
          </tr>

          {/* ── Настроение ────────────────────────────────────────────────────── */}
          <tr>
            <td
              className="sticky left-0 z-10 px-2 py-1 text-xs font-semibold whitespace-nowrap"
              style={{ background: '#0d1117', border: tdBorder, color: '#c084fc' }}
            >
              😊 Настроение
            </td>
            <td style={{ border: tdBorder, textAlign: 'center', fontSize: 10, color: '#484f58' }}>
              1–5
            </td>
            {days.map(d => {
              const val = mood[d] ?? 0;
              const { bg, color } = MOOD_STYLE[val];
              const weekend = isWeekend(year, month, d);
              const isToday = d === todayDay;

              return (
                <td
                  key={d}
                  style={{
                    border: tdBorder, padding: 0,
                    background: isToday ? '#0a1e2e' : weekend ? weekendBg : 'transparent',
                    borderBottom: isToday ? '2px solid #22d3ee' : undefined,
                  }}
                >
                  <button
                    onClick={() => handleMoodClick(d)}
                    className="w-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{ height: 28, background: bg, color }}
                    title={`Настроение: ${val > 0 ? val + '/5' : 'не задано'}. Клик — следующее`}
                  >
                    {val > 0 ? MOOD_LABEL[val] : ''}
                  </button>
                </td>
              );
            })}
            <td style={{ border: tdBorder }} />
          </tr>
        </tbody>
      </table>
    </div>

    {/* Тултип «Цель» — рендерится поверх всего через fixed */}
    {tipPos && (
      <div style={{
        position: 'fixed',
        left: tipPos.x,
        top: tipPos.y - 10,
        transform: 'translate(-50%, -100%)',
        background: '#1f2937',
        color: '#e6edf3',
        fontSize: 12,
        lineHeight: 1.6,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #374151',
        boxShadow: '0 4px 20px #000a',
        whiteSpace: 'nowrap',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        Сколько дней в этом месяце ты хочешь выполнять привычку.<br />
        <span style={{ color: '#8b949e', fontSize: 11 }}>
          Оставь пустым — % считается от числа дней месяца.
        </span>
        {/* стрелка вниз */}
        <div style={{
          position: 'absolute', top: '100%', left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #374151',
        }} />
      </div>
    )}
    </>
  );
}
