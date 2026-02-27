
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

interface Props {
  year: number;
  month: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  onReset: () => void;
  hasPrevData: boolean;
  onCopyFromPrev: () => void;
  habitCount: number;
  maxHabits: number;
  onAddHabit: () => void;
}

export function MonthYearPicker({
  year, month,
  onYearChange, onMonthChange,
  onReset,
  hasPrevData, onCopyFromPrev,
  habitCount, maxHabits, onAddHabit,
}: Props) {
  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);

  const handleReset = () => {
    if (window.confirm(
      `Сбросить все данные за ${MONTHS[month - 1]} ${year}?\nДействие нельзя отменить.`
    )) onReset();
  };

  const selectCls = `
    border border-[#30363d] rounded-lg px-3 py-1.5 text-sm
    bg-[#161b22] text-[#e6edf3]
    focus:outline-none focus:ring-1 focus:ring-[#39ff85]
    cursor-pointer transition-colors
  `;

  return (
    <header
      className="border-b border-[#30363d] px-4 py-3"
      style={{ background: '#0d1117' }}
    >
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-3">

        {/* Логотип */}
        <h1 className="text-lg font-bold flex items-center gap-2 mr-2">
          <span className="text-xl">✅</span>
          <span style={{ color: '#e6edf3' }}>Трекер привычек</span>
        </h1>

        {/* Месяц / Год */}
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => onMonthChange(Number(e.target.value))} className={selectCls}>
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>

          <select value={year} onChange={e => onYearChange(Number(e.target.value))} className={selectCls}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {hasPrevData && (
            <button
              onClick={onCopyFromPrev}
              className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
              style={{ color: '#22d3ee', borderColor: '#22d3ee33', background: '#22d3ee0a' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#22d3ee18')}
              onMouseLeave={e => (e.currentTarget.style.background = '#22d3ee0a')}
              title="Скопировать привычки из предыдущего месяца"
            >
              Скопировать привычки ↓
            </button>
          )}

          <button
            onClick={onAddHabit}
            disabled={habitCount >= maxHabits}
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: '#39ff85', borderColor: '#39ff8533', background: '#39ff850a' }}
            onMouseEnter={e => { if (habitCount < maxHabits) e.currentTarget.style.background = '#39ff8518'; }}
            onMouseLeave={e => (e.currentTarget.style.background = '#39ff850a')}
            title={habitCount >= maxHabits ? `Максимум ${maxHabits} привычек` : 'Добавить привычку'}
          >
            + Добавить привычку
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
            style={{ color: '#f87171', borderColor: '#f8717133', background: '#f871710a' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8717118')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f871710a')}
          >
            Сбросить месяц
          </button>
        </div>

      </div>
    </header>
  );
}
