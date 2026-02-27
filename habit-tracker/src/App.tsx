import { useHabitStore } from './hooks/useHabitStore';
import { MonthYearPicker } from './components/MonthYearPicker';
import { HabitsTable } from './components/HabitsTable';
import { StatsPanel } from './components/StatsPanel';
import { HintBanner } from './components/HintBanner';

const MONTHS_RU = [
  '', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export default function App() {
  const {
    year, month, setYear, setMonth,
    monthData,
    setHabitName, setHabitGoal,
    toggleCompletion, removeHabit, addHabit,
    setMood,
    resetMonth, copyHabitsFromPrev, hasPrevMonthData,
    maxHabits,
  } = useHabitStore();

  const activeCount = monthData.habits.filter(h => h.name.trim()).length;

  return (
    <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', flexDirection: 'column' }}>

      {/* ── Шапка ─────────────────────────────────────────────────────────── */}
      <MonthYearPicker
        year={year} month={month}
        onYearChange={setYear} onMonthChange={setMonth}
        onReset={resetMonth}
        hasPrevData={hasPrevMonthData}
        onCopyFromPrev={copyHabitsFromPrev}
        habitCount={monthData.habits.length}
        maxHabits={maxHabits}
        onAddHabit={addHabit}
      />

      <main style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Онбординг-подсказка ──────────────────────────────────────────── */}
        <HintBanner />

        {/* ── Заголовок месяца ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2 style={{ color: '#e6edf3', fontSize: 20, fontWeight: 700, margin: 0 }}>
            {MONTHS_RU[month]} {year}
          </h2>
          <span style={{ color: '#8b949e', fontSize: 13 }}>
            — {activeCount} активных привычек
          </span>
        </div>

        {/* ── Таблица привычек ─────────────────────────────────────────────── */}
        <div style={{
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px #30363d',
        }}>
          <HabitsTable
            year={year} month={month}
            habits={monthData.habits}
            completions={monthData.completions}
            mood={monthData.mood}
            onSetHabitName={setHabitName}
            onSetHabitGoal={setHabitGoal}
            onToggle={toggleCompletion}
            onRemoveHabit={removeHabit}
            onSetMood={setMood}
          />

          {/* Кнопка "добавить" под таблицей */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid #21262d' }}>
            <button
              onClick={addHabit}
              disabled={monthData.habits.length >= maxHabits}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: monthData.habits.length >= maxHabits ? '#30363d' : '#39ff85',
                fontSize: 13, padding: 0, transition: 'color 0.2s',
              }}
            >
              + Добавить привычку
              {monthData.habits.length >= maxHabits && ` (макс. ${maxHabits})`}
            </button>
          </div>
        </div>

        {/* ── Статистика ───────────────────────────────────────────────────── */}
        <div>
          <h2 style={{ color: '#e6edf3', fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>
            📊 Статистика
          </h2>
          <StatsPanel
            year={year} month={month}
            habits={monthData.habits}
            completions={monthData.completions}
            mood={monthData.mood}
          />
        </div>

      </main>

      <footer style={{ textAlign: 'center', fontSize: 11, color: '#30363d', padding: '12px' }}>
        Данные хранятся в localStorage браузера
      </footer>
    </div>
  );
}
