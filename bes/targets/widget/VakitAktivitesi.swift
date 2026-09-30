// BEŞ — Dinamik Ada ve kilit ekranı canlı etkinliği: sıradaki vakte canlı
// geri sayım. Etkinliği uygulama başlatır (modules/bes-live-activity).
import ActivityKit
import SwiftUI
import WidgetKit
import UIKit

/// Dinamik Ada ve kilit ekranını çizen `chronod` süreci, ev ekranı
/// widget'larıyla (VakitWidget/GununWidget) AYNI asset kataloğundaki
/// "besIsaret" görselini bulamıyor — ikisi de aynı hedefte, aynı katalogda,
/// ama ActivityKit'in dış süreçte render eden bileşeni görseli boş
/// bırakıyor (D30 devamı, cihazda doğrulandı: metin ve renkler doğru,
/// yalnız bu görsel eksik). Kataloğa hiç gitmeden, gömülü veriden okuyarak
/// bu sorunu atlıyoruz — yalnız bu dosyada, widget'lar zaten çalışıyor.
private let besIsaretVerisi =
  "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"

private let besIsaretUIImage = UIImage(data: Data(base64Encoded: besIsaretVerisi) ?? Data()) ?? UIImage()

private func besIsaretGorseli() -> Image {
  Image(uiImage: besIsaretUIImage)
}

/// **Aynı tanım** `modules/bes-live-activity/ios/BesLiveActivityModule.swift`
/// içinde de var: ActivityKit etkinliği türün adıyla eşler, iki hedef aynı
/// adı ve alanları taşımalı. Birini değiştirirsen ikisini birlikte değiştir.
struct BesVakitAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var name: String
    var target: Date
    var hm: String
    var following: String
    /// Önümüzdeki vakitler (sıradaki dahil), zaman sırasıyla.
    var upcoming: [BesVakitSlot] = []

    init(name: String, target: Date, hm: String, following: String, upcoming: [BesVakitSlot]) {
      self.name = name; self.target = target; self.hm = hm; self.following = following; self.upcoming = upcoming
    }

    // Eski sürümün başlattığı etkinlikte `upcoming` yok; eksikse boş sayılır.
    init(from decoder: Decoder) throws {
      let c = try decoder.container(keyedBy: CodingKeys.self)
      name = try c.decode(String.self, forKey: .name)
      target = try c.decode(Date.self, forKey: .target)
      hm = try c.decode(String.self, forKey: .hm)
      following = try c.decode(String.self, forKey: .following)
      upcoming = try c.decodeIfPresent([BesVakitSlot].self, forKey: .upcoming) ?? []
    }
  }
  var city: String
  var title: String
}

struct BesVakitSlot: Codable, Hashable {
  var n: String
  var t: Date
  var hm: String
}

/// Görünümün o an göstereceği vakit. iOS görünümü vakit girdiği an
/// (`staleDate`) yeniden çizer; o çizimde "şimdi"den sonraki ilk vakit
/// seçilir. Böylece uygulama uyurken bile "0:00"da donup kalmaz.
private struct GosterilenVakit {
  let name: String
  let target: Date
  let hm: String
  let following: String
  /// Listede gelecek vakit kalmadı: son vakit de girdi.
  let bitti: Bool

  init(_ s: BesVakitAttributes.ContentState, simdiGercek: Date = Date()) {
    // iOS yeniden çizimi vaktin girdiği saniyeden bir an önce yapabilir; pay
    // olmasa aynı vakit yeniden seçilip "0:00"da kalırdı.
    let simdi = simdiGercek.addingTimeInterval(5)
    let slots = s.upcoming
    if let i = slots.firstIndex(where: { $0.t > simdi }) {
      name = slots[i].n; target = slots[i].t; hm = slots[i].hm
      following = i + 1 < slots.count ? "\(slots[i + 1].n) \(slots[i + 1].hm)" : ""
      bitti = false
    } else {
      name = s.name; target = s.target; hm = s.hm; following = s.following
      bitti = s.target <= simdi
    }
  }
}

struct VakitAktivitesi: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: BesVakitAttributes.self) { baglam in
      let v = GosterilenVakit(baglam.state)
      // Kilit ekranı ve bildirim bandı.
      HStack(spacing: 12) {
        besIsaretGorseli().resizable().scaledToFit().frame(width: 40, height: 40)
        VStack(alignment: .leading, spacing: 2) {
          Text(baglam.attributes.title.uppercased(with: Locale(identifier: "tr_TR")))
            .font(.system(size: 10, weight: .bold)).kerning(1.2).foregroundColor(BesRenk.altin)
          Text("\(v.name) · \(v.hm)")
            .font(.system(size: 18, weight: .bold)).foregroundColor(BesRenk.fildisi)
          Text(baglam.attributes.city).font(.system(size: 11)).foregroundColor(BesRenk.soluk)
        }
        Spacer()
        if v.bitti {
          // Son vakit de girdi ve uygulama henüz yenilemedi: sahte "0:00" yerine
          // vaktin girdiğini söyle.
          Text("✓").font(.system(size: 28, weight: .bold)).foregroundColor(BesRenk.altin)
        } else {
          GeriSayim(hedef: v.target)
            .font(.system(size: 28, weight: .bold, design: .rounded))
            .foregroundColor(BesRenk.altin)
            .frame(maxWidth: 120, alignment: .trailing)
        }
      }
      .padding(16)
      .activityBackgroundTint(BesRenk.zumrutAlt)
      .activitySystemActionForegroundColor(BesRenk.altin)
    } dynamicIsland: { baglam in
      let v = GosterilenVakit(baglam.state)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            besIsaretGorseli().resizable().scaledToFit().frame(width: 26, height: 26)
            VStack(alignment: .leading, spacing: 0) {
              Text(v.name).font(.system(size: 16, weight: .bold)).foregroundColor(BesRenk.fildisi)
              Text(v.hm).font(.system(size: 12)).foregroundColor(BesRenk.soluk)
            }
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          GeriSayim(hedef: v.target)
            .font(.system(size: 24, weight: .bold, design: .rounded))
            .foregroundColor(BesRenk.altin)
            .frame(maxWidth: 110, alignment: .trailing)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack {
            Text(baglam.attributes.city)
            Spacer()
            Text(v.following)
          }
          .font(.system(size: 12)).foregroundColor(BesRenk.soluk)
        }
      } compactLeading: {
        Text(v.name).font(.system(size: 13, weight: .semibold)).foregroundColor(BesRenk.altin)
      } compactTrailing: {
        GeriSayim(hedef: v.target)
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(BesRenk.altin)
          .frame(maxWidth: 58)
      } minimal: {
        besIsaretGorseli().resizable().scaledToFit().frame(width: 18, height: 18)
      }
      .keylineTint(BesRenk.altin)
    }
  }
}
