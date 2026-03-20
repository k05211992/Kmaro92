"use client";

import { useEffect, useState } from "react";
import { STANDARD_UNITS, UNIT_OTHER, isStandardUnit } from "@/config/units";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function UnitSelect({ value, onChange, className = "" }: Props) {
  const [showCustom, setShowCustom] = useState(() => !!value && !isStandardUnit(value));

  // Если значение изменилось извне (пресет, загрузка), синхронизировать режим
  useEffect(() => {
    setShowCustom(!!value && !isStandardUnit(value));
  }, [value]);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === UNIT_OTHER) {
      setShowCustom(true);
      onChange("");
    } else {
      setShowCustom(false);
      onChange(v);
    }
  }

  const selectValue = showCustom ? UNIT_OTHER : value || "";

  return (
    <div className={`flex gap-1 ${className}`}>
      <select
        value={selectValue}
        onChange={handleSelectChange}
        className="border border-gray-300 rounded px-1.5 py-1.5 text-sm bg-white"
      >
        <option value="">ед.</option>
        {STANDARD_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
        <option value={UNIT_OTHER}>Другое...</option>
      </select>

      {showCustom && (
        <input
          type="text"
          placeholder="ед."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20"
          autoFocus
        />
      )}
    </div>
  );
}
