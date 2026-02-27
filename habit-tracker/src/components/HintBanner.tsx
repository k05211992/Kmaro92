import { useState } from 'react';

const HINT_KEY = 'habit-tracker-hint-seen';

const HINTS = [
  { icon: '✓', text: 'Кликни на ячейку таблицы — отметишь выполнение за этот день' },
  { icon: '🎯', text: 'Колонка «Цель» — желаемое число дней в месяце (необязательно)' },
  { icon: '😊', text: 'Строка «Настроение» — кликай, чтобы оценить день от 1 до 5' },
  { icon: '×', text: 'Наведи на привычку — появится кнопка удаления' },
  { icon: '📊', text: 'Статистика обновляется автоматически по мере заполнения' },
];

export function HintBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(HINT_KEY));

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(HINT_KEY, '1');
    setVisible(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d1f2d, #0a1e1a)',
      border: '1px solid #22d3ee33',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
    }}>
      {/* Иконка */}
      <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>👋</div>

      {/* Текст */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#22d3ee', fontWeight: 700, fontSize: 14, margin: '0 0 10px' }}>
          Добро пожаловать в Трекер привычек!
        </p>
        <ul style={{
          margin: 0, padding: 0, listStyle: 'none',
          display: 'flex', flexWrap: 'wrap', gap: '6px 24px',
        }}>
          {HINTS.map((h, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: '#8b949e',
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6,
                background: '#1c2333', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 11, flexShrink: 0, color: '#39ff85',
              }}>
                {h.icon}
              </span>
              {h.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Кнопка закрыть */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#484f58', fontSize: 18, lineHeight: 1,
          padding: '0 2px', flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
        onMouseLeave={e => (e.currentTarget.style.color = '#484f58')}
        title="Скрыть подсказки"
        aria-label="Закрыть"
      >
        ✕
      </button>
    </div>
  );
}
