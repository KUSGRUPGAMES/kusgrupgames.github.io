package expo.modules.besliveactivity

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Önümüzdeki bir vakit: ad, an (saniye, Unix), "12:52". iOS'taki VakitSlotu/BesVakitSlot ile aynı alanlar. */
data class BesVakitSlot(val n: String, val t: Double, val hm: String)

data class BesVakitDurum(val city: String, val title: String, val slots: List<BesVakitSlot>)

/**
 * Kalıcı depo — uygulama kapalıyken `BesVakitReceiver` buradan okuyup bir
 * sonraki vakte geçer (bkz. iOS'taki aynı kalıp: önümüzdeki vakitlerin
 * listesi taşınır, ActivityKit/burada bildirim bunlardan kendi kendine
 * ilerler). `android.content.SharedPreferences`, headless bir
 * BroadcastReceiver içinde de her zaman erişilebilir.
 */
object BesVakitDepo {
  private const val DOSYA = "bes_live_activity"
  private const val ANAHTAR = "durum"

  fun yaz(context: Context, durum: BesVakitDurum) {
    val obj = JSONObject()
    obj.put("city", durum.city)
    obj.put("title", durum.title)
    val dizi = JSONArray()
    for (s in durum.slots) {
      val o = JSONObject()
      o.put("n", s.n); o.put("t", s.t); o.put("hm", s.hm)
      dizi.put(o)
    }
    obj.put("slots", dizi)
    prefs(context).edit().putString(ANAHTAR, obj.toString()).apply()
  }

  fun oku(context: Context): BesVakitDurum? {
    val ham = prefs(context).getString(ANAHTAR, null) ?: return null
    return try {
      val obj = JSONObject(ham)
      val dizi = obj.getJSONArray("slots")
      val slots = (0 until dizi.length()).map { i ->
        val o = dizi.getJSONObject(i)
        BesVakitSlot(o.getString("n"), o.getDouble("t"), o.getString("hm"))
      }
      BesVakitDurum(obj.getString("city"), obj.getString("title"), slots)
    } catch (e: Exception) {
      null
    }
  }

  fun sil(context: Context) {
    prefs(context).edit().remove(ANAHTAR).apply()
  }

  private fun prefs(context: Context) =
    context.getSharedPreferences(DOSYA, Context.MODE_PRIVATE)
}
