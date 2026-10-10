package expo.modules.besliveactivity

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Bildirimi kurar/ilerletir ve bir sonraki vakit anı için tek seferlik,
 * tam bir alarm kurar (`setExactAndAllowWhileIdle` — Doze modunda da
 * tetiklenir, zaten verilen `SCHEDULE_EXACT_ALARM` iznini kullanır).
 * Alarm ateşlendiğinde `BesVakitReceiver` burayı tekrar çağırıp listeden
 * bir sonraki vakte geçer — uygulama kapalıyken de, JS'e gerek kalmadan
 * (iOS tarafındaki `BesVakitIcerik.ilerlet()` ile aynı fikir).
 */
object BesVakitYoneticisi {
  private const val ISTEK_KODU = 7302

  /** `startOrUpdate`: JS'ten yeni veri geldiğinde. */
  fun kur(context: Context, city: String, title: String, tumSlotlar: List<BesVakitSlot>): Boolean {
    val simdi = System.currentTimeMillis() / 1000.0
    val kalanlar = tumSlotlar.filter { it.t > simdi }.sortedBy { it.t }
    if (kalanlar.isEmpty()) { durdur(context); return false }
    BesVakitDepo.yaz(context, BesVakitDurum(city, title, kalanlar))
    goster(context, title, city, kalanlar.first())
    alarmKur(context, kalanlar.first().t)
    return true
  }

  /** Alarm ateşlendiğinde: kayıtlı listeden sıradaki vakte geç. */
  fun ilerlet(context: Context) {
    val durum = BesVakitDepo.oku(context) ?: return
    kur(context, durum.city, durum.title, durum.slots)
  }

  fun durdur(context: Context) {
    alarmIptal(context)
    BesVakitBildirim.kaldir(context)
    BesVakitDepo.sil(context)
  }

  private fun goster(context: Context, title: String, city: String, slot: BesVakitSlot) {
    BesVakitBildirim.goster(context, BesVakitBildirim.olustur(context, title, city, slot))
  }

  private fun alarmIntent(context: Context): PendingIntent {
    val niyet = Intent(context, BesVakitReceiver::class.java)
    val bayrak = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_IMMUTABLE else 0)
    return PendingIntent.getBroadcast(context, ISTEK_KODU, niyet, bayrak)
  }

  private fun alarmKur(context: Context, hedefSaniye: Double) {
    val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val hedefMs = (hedefSaniye * 1000).toLong()
    try {
      am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, hedefMs, alarmIntent(context))
    } catch (e: SecurityException) {
      // Kullanıcı "Alarmlar ve hatırlatıcılar" iznini kapatmış olabilir —
      // bildirim yine de gösterildi, yalnız bir sonraki geçiş olmayacak.
    }
  }

  private fun alarmIptal(context: Context) {
    val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.cancel(alarmIntent(context))
  }
}
