/**
 * Bildirim koordinatörü — cihazın bildirim kuyruğunun **tek sahibi**.
 *
 * ## Neden var
 *
 * Önce iki bağımsız üretici vardı (vakit planı ve özel hatırlatıcılar) ve
 * aralarında koordinasyon yoktu. Beş kusur birden doğuyordu:
 *
 * 1. Hatırlatıcılar cihaza **hiç kurulmuyordu**: `planReminders()` yalnız
 *    bildirim merkezinde önizleme listesi üretmek için çağrılıyordu.
 * 2. `applyPlan` her çağrıda `cancelAllScheduledNotificationsAsync()` ile
 *    kuyruğu siliyordu; hatırlatıcılar ayrıca kurulsa bile ilk vakit
 *    yeniden planlamasında yok oluyorlardı.
 * 3. 64 sınırı iki listeye **ayrı ayrı** uygulanıyordu. Eski kodda bu zarar
 *    vermiyordu çünkü hatırlatıcılar hiç kurulmuyordu; ama (1) düzeltilip
 *    ikisi birden kurulunca cihaza 128'e kadar kayıt giderdi ve iOS
 *    fazlasını sessizce atardı. Bütçe bu yüzden birleşik listeye uygulanır.
 * 4. Açılışta yeniden planlama yoktu; ayarlara hiç girmeyen kullanıcının
 *    planı ~10-12 günde tükeniyor, bildirimler sessizce duruyordu.
 * 5. Bildirim merkezi hesaplanan tahmini "kurulu" diye gösteriyordu.
 *
 * ## Tasarım
 *
 * `birlesikPlan()` **saf**: iki planı birleştirir, zamana dizer ve tek bir
 * 64 bütçesi uygular. Sınanabilir olması için platform çağrısı içermez.
 *
 * `esitle()` cihazla **fark alır**: kurulu olanları okur, fazlalıkları iptal
 * eder, eksikleri kurar, değişmeyenlere dokunmaz. Toptan silip baştan kurmak
 * yerine fark almanın iki sebebi var: her yeniden planlamada bütün kuyruğu
 * yok etmek yarış durumu yaratıyor, ve dokunulmayan bir bildirimin
 * tetikleyicisi platformda yeniden hesaplanmıyor.
 *
 * ## Sahiplik
 *
 * Koordinatör **yalnız kendi kimliklerini** yönetir (`prayer-` ve
 * `reminder-` önekli). Başka bir kaynağın kurduğu bildirime dokunmaz;
 * toptan silme tam olarak bu kuralı çiğniyordu.
 */
import type { DaySchedule } from '@/features/prayer/schedule';
import { planNotifications, PLATFORM_LIMIT, type NotificationSettings } from './plan';
import { planReminders, type Reminder } from './reminders';
import type { PrayerKey } from '@/features/prayer/methods';

/** Koordinatörün yönettiği kimlik önekleri. Başka hiçbir kayda dokunulmaz. */
export const SAHIPLI_ONEKLER = ['prayer-', 'reminder-'] as const;

export function bizimMi(id: string): boolean {
  return SAHIPLI_ONEKLER.some((o) => id.startsWith(o));
}

export type BildirimTuru = 'prayer' | 'reminder';

/** Cihaza kurulacak tek bir bildirim. */
export interface KurulacakBildirim {
  id: string;
  tur: BildirimTuru;
  at: Date;
  title: string;
  body: string;
}

export interface PlanMetinleri {
  vakitBaslik: (key: PrayerKey) => string;
  vakitGovde: (key: PrayerKey, beforeMinutes: number) => string;
}

export interface PlanGirdisi {
  gunler: readonly DaySchedule[];
  bildirimAyari: NotificationSettings;
  hatirlaticilar: readonly Reminder[];
  metin: PlanMetinleri;
}

/**
 * İki planı birleştirir ve **tek** bütçe uygular.
 *
 * Bütçe birleşik listeye uygulanır, parçalara ayrı ayrı değil: iOS'un 64
 * sınırı cihaz başınadır, liste başına değil.
 *
 * Sıralama zaman: bütçe dolduğunda en yakın anlar korunur, uzaktakiler
 * düşer. Tersi olsaydı kullanıcı bugünkü vakti kaçırıp gelecek haftakini
 * alırdı.
 */
export function birlesikPlan(
  girdi: PlanGirdisi,
  now: Date = new Date(),
  limit: number = PLATFORM_LIMIT,
): KurulacakBildirim[] {
  const { gunler, bildirimAyari, hatirlaticilar, metin } = girdi;

  // **Genel bildirim anahtarı (Ayarlar → Bildirimler) hem vakti hem özel
  // hatırlatıcıları kapsar.** Eskiden yalnız `planNotifications` bu
  // anahtara bakıyordu; kullanıcı "Bildirimler"i kapatınca vakit
  // bildirimleri duruyor ama özel hatırlatıcılar kurulmaya devam ediyordu.
  // Kullanıcı için tek bir "bildirim" kavramı var — ayrımı arayüzde yok,
  // koordinatörde de olmamalı.
  if (!bildirimAyari.enabled) return [];

  // Alt planlar kendi içlerinde kesilmemeli; kesme birleşimden sonra olur.
  // Parçalara ayrı sınır verilirse toplam sınırı aşar (eski hata).
  const sinirsiz = Number.MAX_SAFE_INTEGER;

  const vakitler: KurulacakBildirim[] = planNotifications(gunler, bildirimAyari, now, sinirsiz)
    .map((n) => ({
      id: n.id,
      tur: 'prayer' as const,
      at: n.at,
      title: metin.vakitBaslik(n.key),
      body: metin.vakitGovde(n.key, n.beforeMinutes),
    }));

  const hatirlatmalar: KurulacakBildirim[] = planReminders(hatirlaticilar, gunler, now, sinirsiz)
    .map((r) => ({
      id: r.id, tur: 'reminder' as const, at: r.at, title: r.title, body: r.body,
    }));

  return [...vakitler, ...hatirlatmalar]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, Math.max(0, limit));
}

/**
 * Bir bildirimin içerik imzası — başlık, gövde ve ses birlikte.
 *
 * Cihazda kurulu kaydın zamanı değişmemiş olsa bile **içeriği**
 * değişmiş olabilir: dil değişti (başlık/gövde çeviriden gelir), ses
 * ayarı kapatıldı. Yalnız zamanı karşılaştırmak eskiden bu değişiklikleri
 * kaçırıyordu — kayıt "aynı" sayılıp dokunulmuyor, kullanıcı eski dilde ya
 * da yanlış ses ayarıyla bildirim almaya devam ediyordu.
 *
 * `\u001F` (birim ayıracı) sınırlayıcı: başlık ya da gövdenin doğal
 * metninde neredeyse hiç geçmeyen bir kontrol karakteri, çarpışma riski yok.
 */
export function bildirimImzasi(n: { title: string; body: string }, ses: boolean): string {
  return `${n.title}\u001F${n.body}\u001F${ses ? '1' : '0'}`;
}

/** Cihazda kurulu bir kayıt — fark almak için gereken en az bilgi. */
export interface KuruluKayit {
  id: string;
  /** Kurulum anında `content.data.at` içine yazılan zaman damgası. */
  at: number | null;
  /** Kurulum anında `content.data.imza` içine yazılan içerik imzası. */
  imza: string | null;
}

export interface Fark {
  kurulacak: KurulacakBildirim[];
  iptalEdilecek: string[];
  dokunulmayan: number;
}

/**
 * İstenen plan ile cihazdaki durumun farkı.
 *
 * Zaman karşılaştırması `content.data.at` üzerinden yapılır, tetikleyici
 * nesnesi üzerinden değil: `getAllScheduledNotificationsAsync()` tetikleyiciyi
 * platforma göre farklı biçimlerde döndürüyor ve iOS/Android arasında
 * güvenilir biçimde karşılaştırılamıyor.
 *
 * **Zaman aynı olsa bile içerik imzası farklıysa kayıt yeniden kurulur**
 * (bkz. `bildirimImzasi`). `ses` çağıranın o anki ses ayarıdır; her kayıt
 * kendi sesini taşımaz, tüm plan tek seferde aynı ses ayarıyla kurulur.
 *
 * Aynı kimlik farklı zamanla duruyorsa (kullanıcı erken uyarı dakikasını
 * değiştirmiştir) kayıt iptal edilip yeniden kurulur.
 */
export function farkAl(
  istenen: readonly KurulacakBildirim[],
  kurulu: readonly KuruluKayit[],
  ses: boolean,
): Fark {
  const kuruluHarita = new Map(kurulu.filter((k) => bizimMi(k.id)).map((k) => [k.id, k]));
  const istenenKimlikler = new Set(istenen.map((n) => n.id));

  const kurulacak: KurulacakBildirim[] = [];
  let dokunulmayan = 0;
  for (const n of istenen) {
    const mevcut = kuruluHarita.get(n.id);
    const beklenenImza = bildirimImzasi(n, ses);
    if (mevcut && mevcut.at === n.at.getTime() && mevcut.imza === beklenenImza) dokunulmayan += 1;
    else kurulacak.push(n);
  }

  const iptalEdilecek: string[] = [];
  for (const k of kuruluHarita.values()) {
    // İstenmeyen ya da zamanı/içeriği değişmiş kayıt gider.
    if (!istenenKimlikler.has(k.id)) iptalEdilecek.push(k.id);
    else if (kurulacak.some((n) => n.id === k.id)) iptalEdilecek.push(k.id);
  }

  return { kurulacak, iptalEdilecek, dokunulmayan };
}
