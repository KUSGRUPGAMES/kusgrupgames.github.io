// BEŞ — canlı etkinlik köprüsü, Android tarafı. iOS'taki Dinamik Ada'nın
// karşılığı değil (Android'de o yok); en yakın karşılığı kalıcı bir
// bildirim — bkz. ios/BesLiveActivityModule.swift'teki aynı adlı JS
// arayüzü (`modules/bes-live-activity/index.ts`), alan adları birebir aynı
// kalmalı.
package expo.modules.besliveactivity

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class VakitSlotu : Record {
  @Field var n: String = ""
  @Field var t: Double = 0.0
  @Field var hm: String = ""
}

class VakitEtkinligi : Record {
  @Field var city: String = ""
  @Field var title: String = ""
  @Field var name: String = ""
  @Field var target: Double = 0.0
  @Field var hm: String = ""
  @Field var following: String = ""
  @Field var upcoming: List<VakitSlotu> = emptyList()
}

class BesLiveActivityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BesLiveActivity")

    Function("isSupported") { true }

    AsyncFunction("startOrUpdate") { p: VakitEtkinligi ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val slots = if (p.upcoming.isNotEmpty()) {
        p.upcoming.map { BesVakitSlot(it.n, it.t, it.hm) }
      } else {
        listOf(BesVakitSlot(p.name, p.target, p.hm))
      }
      BesVakitYoneticisi.kur(context, p.city, p.title, slots)
    }

    // Parametresiz AsyncFunction içinde değersiz `return@AsyncFunction`
    // tip çıkarımını bozuyordu ("expected 'Any?', actual 'Unit'",
    // CI'de görüldü); `?.let` aynı işi belirsizliğe düşmeden yapar.
    AsyncFunction("end") {
      appContext.reactContext?.let { BesVakitYoneticisi.durdur(it) }
    }
  }
}
