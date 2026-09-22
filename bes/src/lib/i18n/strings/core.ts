/**
 * Temel arayüz anahtarları — şartname §61.
 *
 * Türkçe tam çeviridir. Diğer diller için **bu liste zorunludur**: uygulamayı
 * o dilde kullanan biri gezinme, vakitler, ayarlar ve hata metinlerini kendi
 * dilinde görür. Liste dışındaki anahtarlar Türkçeye düşer ve bu kabul edilir;
 * eksik çeviri boş ekran değil, anlaşılır Türkçe metin demektir.
 *
 * Bir anahtarı buraya eklemek, dört dilde de çevirmeyi zorunlu kılar —
 * `__tests__/i18n.test.ts` bunu denetler.
 */
import type { StringKey } from './tr';

export const CORE_KEYS: readonly StringKey[] = [
  'nav.home', 'nav.quran', 'nav.worship', 'nav.explore', 'nav.profile',
  'nav.back', 'nav.close',

  'common.ok', 'common.cancel', 'common.save', 'common.delete', 'common.edit',
  'common.done', 'common.next', 'common.skip', 'common.retry', 'common.search',
  'common.share', 'common.copy', 'common.select', 'common.loading',
  'common.today', 'common.source', 'common.enable', 'common.disable',

  'prayer.fajr', 'prayer.sunrise', 'prayer.dhuhr', 'prayer.asr',
  'prayer.maghrib', 'prayer.isha', 'prayer.next', 'prayer.remaining',
  'prayer.remainingTo', 'prayer.todayTimes', 'prayer.method', 'prayer.adjustment',

  'location.title', 'location.current', 'location.useGps', 'location.manual',
  'location.permissionTitle', 'location.permissionBody', 'location.timezone',

  'qibla.title', 'qibla.bearing', 'qibla.distance', 'qibla.aligned',

  'quran.title', 'quran.surahs', 'quran.juz', 'quran.continue',
  'quran.translation', 'quran.bookmarks', 'quran.favorites',

  'worship.title', 'worship.dhikr', 'worship.duas', 'worship.names', 'worship.qada',

  'explore.title', 'profile.title', 'profile.signIn', 'profile.signOut',
  'profile.guest',

  'settings.title', 'settings.theme', 'settings.themeSystem',
  'settings.themeLight', 'settings.themeDark', 'settings.language',
  'settings.notifications', 'settings.about', 'settings.privacy', 'settings.version',

  'pro.title', 'pro.unlock', 'pro.monthly', 'pro.yearly', 'pro.restore',

  'error.title', 'error.generic', 'error.network', 'error.timeout',
  'error.restart', 'offline.title', 'offline.body',
  'empty.title', 'empty.body',
];
