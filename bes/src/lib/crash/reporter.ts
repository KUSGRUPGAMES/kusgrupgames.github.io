/**
 * Çökme raporlama — şartname §85.
 *
 * Bu ürün sunucusuz çalışıyor (DECISIONS D12), bu yüzden çökmeler bir servise
 * **gönderilmez**. Bunun yerine cihazda son N kayıt tutulur ve kullanıcı
 * isterse destek e-postasına kendisi ekler. Böylece:
 *  - kimse izlenmez,
 *  - yine de "uygulama kapanıyor" diyen kullanıcıdan işe yarar bilgi alınır.
 *
 * Kayda giren her şey `redact()` geçidinden geçer: konum, not, e-posta ve
 * jeton hiçbir koşulda rapora girmez.
 */
import { redact } from '@/lib/log/redact';

export interface CrashRecord {
  at: string;
  name: string;
  message: string;
  /** Bileşen yığını — dosya adları, kullanıcı verisi değil. */
  componentStack?: string;
  /** Uygulama sürümü ve platform gibi bağlam. */
  context: Record<string, string>;
}

/** Cihazda tutulan en fazla kayıt sayısı. */
export const MAX_RECORDS = 20;

let kayitlar: CrashRecord[] = [];
let yazici: ((records: CrashRecord[]) => void) | null = null;

/** Kalıcılık dışarıdan bağlanır; bu dosya depolama teknolojisini bilmez. */
export function configureCrashReporter(options: {
  initial?: CrashRecord[];
  persist?: (records: CrashRecord[]) => void;
}): void {
  if (options.initial) kayitlar = options.initial.slice(0, MAX_RECORDS);
  if (options.persist !== undefined) yazici = options.persist;
}

export function recordCrash(
  error: Error,
  context: Record<string, string> = {},
  componentStack?: string,
): CrashRecord {
  const temiz = redact({
    name: error.name,
    message: error.message,
    componentStack: componentStack ?? '',
    context,
  }) as { name: string; message: string; componentStack: string; context: Record<string, string> };

  const kayit: CrashRecord = {
    at: new Date().toISOString(),
    name: temiz.name || 'Error',
    message: temiz.message || '',
    ...(temiz.componentStack ? { componentStack: temiz.componentStack.slice(0, 2000) } : {}),
    context: temiz.context ?? {},
  };

  // En yeni başta; eski kayıtlar sessizce düşer.
  kayitlar = [kayit, ...kayitlar].slice(0, MAX_RECORDS);
  yazici?.(kayitlar);
  return kayit;
}

export function getCrashRecords(): readonly CrashRecord[] {
  return kayitlar;
}

export function clearCrashRecords(): void {
  kayitlar = [];
  yazici?.(kayitlar);
}

/**
 * Destek e-postasına eklenecek metin. Kullanıcı ne gönderdiğini **görebilir**:
 * arkasında gizlice giden bir rapor yoktur.
 */
export function formatForSupport(records: readonly CrashRecord[] = kayitlar): string {
  if (records.length === 0) return '';
  return records
    .map((r) => {
      const baglam = Object.entries(r.context).map(([k, v]) => `${k}=${v}`).join(' ');
      return [`[${r.at}] ${r.name}: ${r.message}`, baglam ? `  ${baglam}` : null]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}
