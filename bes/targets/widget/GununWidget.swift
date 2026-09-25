// BEŞ — günün âyeti ve duası widget'ı. Metin uygulamanın doğrulanmış
// paketinden gelir (Tanzil + Elmalılı meali); widget yalnız gösterir.
import SwiftUI
import WidgetKit

struct GunGirdisi: TimelineEntry {
  let date: Date
  let veri: BesVeri?
}

struct GunSaglayici: TimelineProvider {
  func placeholder(in context: Context) -> GunGirdisi { GunGirdisi(date: Date(), veri: .ornek) }

  func getSnapshot(in context: Context, completion: @escaping (GunGirdisi) -> Void) {
    completion(GunGirdisi(date: Date(), veri: BesDepo.oku() ?? .ornek))
  }

  /// Gece yarısı yeni gün: her gün başında bir girdi.
  func getTimeline(in context: Context, completion: @escaping (Timeline<GunGirdisi>) -> Void) {
    let simdi = Date()
    let veri = BesDepo.oku()
    let takvim = Calendar.current
    var girdiler = [GunGirdisi(date: simdi, veri: veri)]
    for i in 1...3 {
      if let gun = takvim.date(byAdding: .day, value: i, to: takvim.startOfDay(for: simdi)) {
        girdiler.append(GunGirdisi(date: gun, veri: veri))
      }
    }
    completion(Timeline(entries: girdiler, policy: .atEnd))
  }
}

struct GunGorunumu: View {
  @Environment(\.widgetFamily) var aile
  let girdi: GunGirdisi

  var body: some View {
    let veri = girdi.veri ?? .ornek
    let gun = veri.gunluk(girdi.date)
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 5) {
        Image("besIsaret").resizable().scaledToFit().frame(width: 16, height: 16)
        Text(veri.labels.verseOfDay.uppercased(with: Locale(identifier: "tr_TR")))
          .font(.system(size: 9, weight: .bold)).kerning(1.2).foregroundColor(BesRenk.altin)
      }
      if let gun {
        Text(gun.ar)
          .font(.system(size: aile == .systemLarge ? 22 : 17))
          .foregroundColor(BesRenk.fildisi)
          .multilineTextAlignment(.trailing)
          .frame(maxWidth: .infinity, alignment: .trailing)
          .environment(\.layoutDirection, .rightToLeft)
          .lineLimit(aile == .systemLarge ? 4 : 2)
          .minimumScaleFactor(0.7)
        Text(gun.tr).font(.system(size: aile == .systemLarge ? 14 : 12))
          .foregroundColor(BesRenk.fildisi).lineLimit(aile == .systemLarge ? 6 : 3).minimumScaleFactor(0.8)
        Text(gun.ref).font(.system(size: 10, weight: .semibold)).foregroundColor(BesRenk.altin)
        if aile == .systemLarge {
          Rectangle().fill(BesRenk.altin.opacity(0.35)).frame(height: 1).padding(.vertical, 4)
          Text(veri.labels.duaOfDay.uppercased(with: Locale(identifier: "tr_TR")))
            .font(.system(size: 9, weight: .bold)).kerning(1.2).foregroundColor(BesRenk.altin)
          Text(gun.duaTitle).font(.system(size: 13, weight: .bold)).foregroundColor(BesRenk.fildisi)
          Text(gun.dua).font(.system(size: 12)).foregroundColor(BesRenk.soluk).lineLimit(5)
        }
      }
      Spacer(minLength: 0)
    }
    .besZemin()
  }
}

struct GununWidget: Widget {
  let kind = "BesGunun"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GunSaglayici()) { girdi in
      GunGorunumu(girdi: girdi)
    }
    .configurationDisplayName("Günün âyeti")
    .description("Her gün bir âyet ve meali; büyük boyutta günün duası.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}
