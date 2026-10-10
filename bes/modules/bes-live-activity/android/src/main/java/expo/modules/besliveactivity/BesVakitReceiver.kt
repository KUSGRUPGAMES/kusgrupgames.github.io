package expo.modules.besliveactivity

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Alarm ateşlendiğinde (vakit girdiğinde) tetiklenir — uygulama kapalı olsa bile. */
class BesVakitReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    BesVakitYoneticisi.ilerlet(context)
  }
}
