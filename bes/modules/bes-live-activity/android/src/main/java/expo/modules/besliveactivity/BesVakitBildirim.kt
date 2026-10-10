package expo.modules.besliveactivity

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * Kalıcı (ongoing) bildirim — Android'de kilit ekranı widget'ı yok, bu en
 * yakın karşılığı (iOS'un Dinamik Ada'sının Live Activity'si gibi). Kendi
 * kanalı var; `expo-notifications`in kanallarına karışmaz, sessiz (yalnız
 * içerik değişir — yeni ses/titreşim yok, `setOnlyAlertOnce`).
 */
object BesVakitBildirim {
  private const val KANAL = "bes-vakit-canli"
  const val BILDIRIM_ID = 7301

  fun kanalKur(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(KANAL) != null) return
    val kanal = NotificationChannel(KANAL, "Namaz vakti", NotificationManager.IMPORTANCE_LOW)
    kanal.description = "Sıradaki namaz vaktini kilit ekranında gösterir."
    kanal.setShowBadge(false)
    nm.createNotificationChannel(kanal)
  }

  fun olustur(context: Context, title: String, city: String, slot: BesVakitSlot): Notification {
    kanalKur(context)
    val acilisNiyeti = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val tiklamaBayragi = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
      PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
    val tiklama = acilisNiyeti?.let {
      PendingIntent.getActivity(context, 0, it, tiklamaBayragi)
    }
    return NotificationCompat.Builder(context, KANAL)
      .setSmallIcon(simgeKaynagi(context))
      .setContentTitle(title)
      .setContentText("${slot.n} · ${slot.hm}")
      .setSubText(city)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(false)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .apply { if (tiklama != null) setContentIntent(tiklama) }
      .build()
  }

  fun goster(context: Context, bildirim: Notification) {
    androidx.core.app.NotificationManagerCompat.from(context).notify(BILDIRIM_ID, bildirim)
  }

  fun kaldir(context: Context) {
    androidx.core.app.NotificationManagerCompat.from(context).cancel(BILDIRIM_ID)
  }

  /** `expo-notifications`in oluşturduğu simge (app.config.ts → `expo-notifications.icon`); yoksa uygulama simgesi. */
  private fun simgeKaynagi(context: Context): Int {
    val id = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
    return if (id != 0) id else context.applicationInfo.icon
  }
}
