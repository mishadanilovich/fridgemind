"use client";

import { useEffect, useState } from "react";

// Ключ для React `key={...}` формы внутри шита: состояние useActionState/локальных полей
// переживает закрытие шита, поэтому без ремонта на каждое открытие ошибка или значения
// прошлой попытки мелькали бы в новой, несвязанной.
export function useRemountKey(open: boolean): number {
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (open) setKey((n) => n + 1);
  }, [open]);
  return key;
}
