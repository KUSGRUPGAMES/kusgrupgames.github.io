/**
 * Günlükleme — şartname §83.
 *
 * - Üretimde `debug` ve `info` hiç yazılmaz; `warn` ve `error` çıkar.
 * - Her kayıt `redact()` geçidinden geçer (§84).
 * - Çökme raporlayıcısı (§85) `setSink` ile takılır; yoksa konsola düşer.
 */
import { redact } from './redact';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  level: LogLevel;
  scope: string;
  message: string;
  data?: unknown;
  at: string;
}

export type LogSink = (record: LogRecord) => void;

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

let minLevel: LogLevel = 'debug';
let sink: LogSink | null = null;

/** Üretim yapısında `warn` verilir; geliştirmede `debug`. */
export function configureLogging(options: { minLevel?: LogLevel; sink?: LogSink | null }): void {
  if (options.minLevel) minLevel = options.minLevel;
  if (options.sink !== undefined) sink = options.sink;
}

export function shouldLog(level: LogLevel): boolean {
  return ORDER[level] >= ORDER[minLevel];
}

/** Kaydı oluşturur ve temizler — çıktıyı yazmaz. Sınamalarda bu kullanılır. */
export function buildRecord(level: LogLevel, scope: string, message: string, data?: unknown): LogRecord {
  const record: LogRecord = {
    level,
    scope,
    message: String(message),
    at: new Date().toISOString(),
  };
  if (data !== undefined) record.data = redact(data);
  return { ...record, message: (redact(record.message) as string) };
}

function emit(level: LogLevel, scope: string, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;
  const record = buildRecord(level, scope, message, data);
  if (sink) { sink(record); return; }
  const line = `[${record.scope}] ${record.message}`;
  if (level === 'error') console.error(line, record.data ?? '');
  else if (level === 'warn') console.warn(line, record.data ?? '');
  // debug/info üretimde zaten filtrelendi; geliştirmede de konsolu kirletmemek
  // için sink yoksa sessiz kalır (§83: üretim güvenli günlükleme).
}

/** Bir modül için adlandırılmış günlükçü. */
export function logger(scope: string) {
  return {
    debug: (message: string, data?: unknown) => emit('debug', scope, message, data),
    info: (message: string, data?: unknown) => emit('info', scope, message, data),
    warn: (message: string, data?: unknown) => emit('warn', scope, message, data),
    error: (message: string, data?: unknown) => emit('error', scope, message, data),
  };
}

export { redact, redactText, MASK } from './redact';
