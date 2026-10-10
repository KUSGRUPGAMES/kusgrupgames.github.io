/**
 * Android widget verisinin saklanması — iOS'taki App Group/ExtensionStorage'ın
 * karşılığı. Android'de widget headless JS görevi (`registerWidgetTaskHandler`)
 * uygulamanın geri kalanından ayrı, kendi başına tetiklenir (OS'un periyodik
 * yenilemesi, uygulama kapalıyken de olabilir) — bu yüzden en son hesaplanan
 * veri burada kalıcı olarak tutulur, widget görevi her çalıştığında buradan
 * okur. `WidgetPayload` zaten önümüzdeki 4 günün mutlak zaman damgalarını
 * taşıyor (bkz. `payload.ts`), bu yüzden okurken yeniden hesaplama gerekmez.
 */
import { kv } from '@/boot/storage';
import { KEYS } from '@/lib/storage';
import type { WidgetPayload } from '../payload';

function gecerliMi(r: unknown): r is WidgetPayload {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return o.v === 1 && Array.isArray(o.times) && Array.isArray(o.daily) && typeof o.city === 'string';
}

const codec = {
  parse: (r: unknown): WidgetPayload | null => (gecerliMi(r) ? r : null),
  fallback: null as WidgetPayload | null,
};

export async function saveAndroidWidgetPayload(payload: WidgetPayload): Promise<void> {
  await kv.write(KEYS.androidWidgetData, payload);
}

export async function loadAndroidWidgetPayload(): Promise<WidgetPayload | null> {
  return kv.read(KEYS.androidWidgetData, codec);
}
