import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { Habit, Completions, Mood } from '../types';
import {
  getDaysInMonth, getActiveHabits,
  getTop5, getDailyProgress, getWeeklyProgress, getAllHabitsProgress,
  getAverageMood, getMoodDayData,
} from '../utils/stats';

// ── Палитра ───────────────────────────────────────────────────────────────────
const C = {
  card:    '#0d1117',
  border:  '#30363d',
  text:    '#e6edf3',
  muted:   '#8b949e',
  grid:    '#1c2333',
  green:   '#39ff85',
  cyan:    '#22d3ee',
  purple:  '#c084fc',
  yellow:  '#fbbf24',
  red:     '#f87171',
};

function pctColor(p: number) {
  return p >= 80 ? C.green : p >= 50 ? C.yellow : C.red;
}
function pctBg(p: number) {
  if (p >= 80) return 'linear-gradient(90deg, #39ff85, #22d3ee)';
  if (p >= 50) return 'linear-gradient(90deg, #fbbf24, #f97316)';
  return 'linear-gradient(90deg, #f87171, #ef4444)';
}

// ── Тултипы ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DarkTooltip({ active, payload, label, suffix = '%' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161b22', border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '6px 12px', fontSize: 12,
    }}>
      <p style={{ color: C.muted, marginBottom: 2 }}>День {label}</p>
      <p style={{ color: C.cyan, fontWeight: 700 }}>{payload[0]?.value}{suffix}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WeekTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161b22', border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '6px 12px', fontSize: 12,
    }}>
      <p style={{ color: C.muted, marginBottom: 2 }}>{label}</p>
      <p style={{ color: C.green, fontWeight: 700 }}>{payload[0]?.value}%</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MoodTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length || payload[0]?.value == null) return null;
  const val = payload[0].value as number;
  const emoji = ['', '😞', '😕', '😐', '🙂', '😊'][val] ?? '';
  return (
    <div style={{
      background: '#161b22', border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '6px 12px', fontSize: 12,
    }}>
      <p style={{ color: C.muted, marginBottom: 2 }}>День {label}</p>
      <p style={{ color: C.purple, fontWeight: 700 }}>{emoji} {val}/5</p>
    </div>
  );
}

// ── Карточка секции ───────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      <h3 style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Горизонтальный прогресс-бар ───────────────────────────────────────────────
function HBar({ percent }: { percent: number }) {
  return (
    <div style={{ width: '100%', height: 6, background: '#1c2333', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${Math.min(100, percent)}%`,
        background: pctBg(percent),
        borderRadius: 3,
        transition: 'width 0.4s ease',
        boxShadow: percent >= 80 ? '0 0 6px #39ff8566' : 'none',
      }} />
    </div>
  );
}

const axisStyle = { fill: C.muted, fontSize: 11 };

// ── Главный компонент ─────────────────────────────────────────────────────────
interface Props {
  year: number;
  month: number;
  habits: Habit[];
  completions: Completions;
  mood: Mood;
}

export function StatsPanel({ year, month, habits, completions, mood }: Props) {
  const daysInMonth = getDaysInMonth(year, month);
  const activeHabits = getActiveHabits(habits);

  const top5          = getTop5(habits, completions, daysInMonth);
  const dailyProgress = getDailyProgress(completions, daysInMonth, activeHabits);
  const weeklyProgress = getWeeklyProgress(completions, year, month, activeHabits);
  const allHabits     = getAllHabitsProgress(habits, completions, daysInMonth);
  const avgMood       = getAverageMood(mood);
  const moodData      = getMoodDayData(mood, daysInMonth);
  const hasMood       = Object.values(mood).some(v => v > 0);

  if (activeHabits.length === 0) {
    return (
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
        <p style={{ color: C.muted, fontSize: 14 }}>
          Добавьте привычки в таблицу выше, чтобы увидеть статистику
        </p>
      </div>
    );
  }

  const MOOD_EMOJI = ['', '😞', '😕', '😐', '🙂', '😊'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── ТОП-5 ──────────────────────────────────────────────────────────── */}
      <Card title="🏆 ТОП-5 привычек">
        {top5.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13 }}>
            Пока нет данных — отмечайте выполнение в таблице
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {top5.map(({ habit, percent, done, target }, i) => (
              <div key={habit.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ color: C.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: C.muted, fontSize: 11, width: 16 }}>{i + 1}.</span>
                    <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {habit.name}
                    </span>
                  </span>
                  <span style={{ color: pctColor(percent), fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {percent}%
                    <span style={{ color: C.muted, fontWeight: 400, fontSize: 11, marginLeft: 4 }}>
                      ({done}/{target} дн.)
                    </span>
                  </span>
                </div>
                <HBar percent={percent} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── По неделям ─────────────────────────────────────────────────────── */}
      <Card title="📅 По неделям">
        {weeklyProgress.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13 }}>Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyProgress} margin={{ top: 5, right: 5, left: -22, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
              <XAxis dataKey="shortLabel" tick={axisStyle} />
              <YAxis domain={[0, 100]} tick={axisStyle} tickFormatter={v => `${v}%`} />
              <Tooltip content={<WeekTooltip />} cursor={{ fill: '#1c2333' }} />
              <ReferenceLine y={80} stroke="#39ff8544" strokeDasharray="4 4" />
              <Bar dataKey="percent" fill={C.green} radius={[4, 4, 0, 0]} maxBarSize={48}
                style={{ filter: 'drop-shadow(0 0 4px #39ff8566)' }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Месячный прогресс ──────────────────────────────────────────────── */}
      <Card title="📈 Месячный прогресс (% выполнений по дням)">
        <div style={{ gridColumn: '1 / -1' }}>
          {dailyProgress.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13 }}>Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyProgress} margin={{ top: 5, right: 10, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="label" tick={axisStyle} interval={1} />
                <YAxis domain={[0, 100]} tick={axisStyle} tickFormatter={v => `${v}%`} />
                <Tooltip content={<DarkTooltip />} cursor={{ stroke: C.cyan, strokeWidth: 1 }} />
                <ReferenceLine y={80} stroke="#39ff8544" strokeDasharray="4 4" />
                <Line
                  type="monotone" dataKey="percent" stroke={C.cyan} strokeWidth={2}
                  dot={{ r: 3, fill: C.cyan, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: C.cyan, style: { filter: `drop-shadow(0 0 4px ${C.cyan})` } }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* ── По привычкам ───────────────────────────────────────────────────── */}
      <Card title="✅ По привычкам">
        {allHabits.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13 }}>Нет активных привычек</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
            {allHabits.map(({ habit, percent, done, target }) => (
              <div key={habit.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: C.text, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                    {habit.name}
                  </span>
                  <span style={{ color: pctColor(percent), fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {percent}%
                    <span style={{ color: C.muted, fontWeight: 400, marginLeft: 4 }}>({done}/{target})</span>
                  </span>
                </div>
                <HBar percent={percent} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Настроение ─────────────────────────────────────────────────────── */}
      <Card title="💜 Моё состояние">
        {avgMood !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>{MOOD_EMOJI[Math.round(avgMood)]}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.purple }}>{avgMood}</div>
              <div style={{ fontSize: 11, color: C.muted }}>среднее за месяц</div>
            </div>
          </div>
        ) : (
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
            Оцените настроение в строке «Настроение» таблицы
          </p>
        )}

        {hasMood && (
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={moodData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="label" tick={axisStyle} interval={1} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={axisStyle} />
              <Tooltip content={<MoodTooltip />} cursor={{ stroke: C.purple, strokeWidth: 1 }} />
              <Line
                type="monotone" dataKey="mood" stroke={C.purple} strokeWidth={2}
                dot={{ r: 3, fill: C.purple, strokeWidth: 0 }}
                connectNulls={false}
                activeDot={{ r: 5, fill: C.purple, style: { filter: `drop-shadow(0 0 4px ${C.purple})` } }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

    </div>
  );
}
