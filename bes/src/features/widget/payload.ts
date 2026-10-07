/**
 * Widget verisi — D30. Uygulama bunu App Group'a JSON olarak yazar; widget
 * eklentisi (targets/widget/Paylasilan.swift → `BesVeri`) okur. Alan adları
 * iki tarafta **aynı** olmalı; sınama bunu korur.
 *
 * Saf mantık: çizelgeden, etiketlerden ve günlük içerikten nesne üretir.
 */
import type { DaySchedule } from '@/features/prayer/schedule';
import type { PrayerKey } from '@/features/prayer/methods';
import { formatHM } from '@/features/prayer/calc';
import { dateKey } from '@/features/dhikr/stats';

export const WIDGET_KEY = 'bes.widget.v1';

export interface WidgetLabels {
  next: string;
  openApp: string;
  verseOfDay: string;
  duaOfDay: string;
  times: string;
}

export interface WidgetTime { k: PrayerKey; n: string; t: number; hm: string; d: string }
export interface WidgetDaily { d: string; ar: string; tr: string; ref: string; duaTitle: string; dua: string }

export interface WidgetPayload {
  v: 1;
  city: string;
  labels: WidgetLabels;
  times: WidgetTime[];
  daily: WidgetDaily[];
}

export function buildWidgetPayload(input: {
  city: string;
  days: readonly DaySchedule[];
  label: (k: PrayerKey) => string;
  labels: WidgetLabels;
  daily: WidgetDaily[];
}): WidgetPayload {
  const times: WidgetTime[] = [];
  for (const g of input.days) {
    const d = dateKey(g.year, g.month, g.day);
    for (const e of g.entries) {
      if (!e.at) continue; // kutupta oluşmayan vakit
      times.push({ k: e.key, n: input.label(e.key), t: Math.round(e.at.getTime() / 1000), hm: formatHM(e.hours), d });
    }
  }
  times.sort((a, b) => a.t - b.t);
  return { v: 1, city: input.city, labels: input.labels, times, daily: input.daily };
}

/** Canlı etkinlik için sıradaki vakit ve ondan sonraki. */
export function nextTwo(times: readonly WidgetTime[], nowSec: number): [WidgetTime, WidgetTime | null] | null {
  const i = times.findIndex((x) => x.t > nowSec);
  if (i < 0) return null;
  return [times[i]!, times[i + 1] ?? null];
}
