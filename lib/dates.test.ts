import { describe, expect, it } from "vitest";

import {
  addDaysIso,
  APP_TIME_ZONE,
  dateToIso,
  formatDayTitle,
  formatWeekRange,
  isIsoDate,
  isoToDate,
  startOfWeekIso,
  todayIso,
  weekDatesIso,
  weekdayName,
  weekdayShort,
} from "./dates";

describe("isIsoDate", () => {
  it("принимает календарную дату и отвергает мусор", () => {
    expect(isIsoDate("2026-07-11")).toBe(true);
    expect(isIsoDate("2026-7-11")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("вчера")).toBe(false);
  });
});

describe("startOfWeekIso", () => {
  it("неделя начинается с понедельника", () => {
    expect(startOfWeekIso("2026-07-06")).toBe("2026-07-06"); // понедельник
    expect(startOfWeekIso("2026-07-11")).toBe("2026-07-06"); // суббота
  });

  it("воскресенье относится к уходящей неделе, а не к следующей", () => {
    expect(startOfWeekIso("2026-07-12")).toBe("2026-07-06");
    expect(startOfWeekIso("2026-07-13")).toBe("2026-07-13"); // следующий понедельник
  });

  it("переход через границу месяца и года", () => {
    expect(startOfWeekIso("2026-01-01")).toBe("2025-12-29");
  });
});

describe("addDaysIso", () => {
  it("переходит через конец месяца и назад", () => {
    expect(addDaysIso("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysIso("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("weekDatesIso", () => {
  it("отдаёт 7 подряд идущих дней от понедельника", () => {
    expect(weekDatesIso("2026-07-06")).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });
});

describe("isoToDate / dateToIso", () => {
  it("дата в БД — полночь UTC, обратное преобразование не сдвигает день", () => {
    expect(isoToDate("2026-07-11").toISOString()).toBe("2026-07-11T00:00:00.000Z");
    expect(dateToIso(isoToDate("2026-07-11"))).toBe("2026-07-11");
  });
});

describe("todayIso", () => {
  it("считает дату в зоне household, а не в UTC сервера", () => {
    // 23:30 UTC 10 июля — в Москве (UTC+3) уже 11 июля.
    expect(APP_TIME_ZONE).toBe("Europe/Moscow");
    expect(todayIso(new Date("2026-07-10T23:30:00.000Z"))).toBe("2026-07-11");
  });
});

describe("подписи дней", () => {
  it("день недели и заголовок дня", () => {
    expect(weekdayShort("2026-07-11")).toBe("Сб");
    expect(weekdayName("2026-07-06")).toBe("Понедельник");
    expect(formatDayTitle("2026-07-11")).toBe("Суббота, 11 июля");
  });

  it("диапазон недели схлопывает повторяющийся месяц", () => {
    expect(formatWeekRange("2026-07-06")).toBe("6 — 12 июля");
    expect(formatWeekRange("2026-07-27")).toBe("27 июля — 2 августа");
  });
});
