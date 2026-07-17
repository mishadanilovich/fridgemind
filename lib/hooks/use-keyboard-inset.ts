"use client";

import { useEffect, useState } from "react";

/**
 * Высота, на которую экранная клавиатура перекрывает низ вьюпорта. Нужна нижним шитам: на iOS
 * клавиатура наезжает поверх position:fixed;bottom:0, пряча низ шита и кнопку действия. Считается
 * через visualViewport, поэтому работает и там, где layout-вьюпорт под клавиатуру не сжимается.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(overlap > 1 ? overlap : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
