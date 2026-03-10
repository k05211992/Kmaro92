"use client";

import { useQuote } from "@/context/QuoteContext";
import { Input, Textarea } from "@/components/ui/Input";
import { User } from "lucide-react";

export function QuoteClientForm() {
  const { client_info, updateClientInfo } = useQuote();

  const update = (field: keyof typeof client_info, value: string) => {
    updateClientInfo({ ...client_info, [field]: value });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <User size={14} className="text-gray-400" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Данные клиента
        </p>
      </div>
      <Input
        label="Имя"
        placeholder="Иван Иванов"
        value={client_info.name}
        onChange={(e) => update("name", e.target.value)}
      />
      <Input
        label="Телефон"
        type="tel"
        placeholder="+7 (___) ___-__-__"
        value={client_info.phone}
        onChange={(e) => update("phone", e.target.value)}
      />
      <Textarea
        label="Комментарий"
        placeholder="Пожелания, дополнения..."
        value={client_info.comment}
        onChange={(e) => update("comment", e.target.value)}
        rows={2}
      />
    </div>
  );
}
