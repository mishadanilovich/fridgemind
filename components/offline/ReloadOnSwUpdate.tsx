"use client";

import { useEffect } from "react";

// Свежий service worker активируется сразу (skipWaiting + clientsClaim в app/sw.ts), но уже
// открытая PWA продолжает работать на старом JS до перезагрузки — на телефоне фиксы «не
// доезжали» до ручного переоткрытия. Как только новый SW перехватывает страницу
// (controllerchange), перезагружаемся сами — один раз и только при обновлении, не при
// первой установке (когда прежнего контроллера не было).
export function ReloadOnSwUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const hadController = navigator.serviceWorker.controller !== null;
    if (!hadController) return;

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
