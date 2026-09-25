// BEŞ — Dinamik Ada ve kilit ekranı canlı etkinliği: sıradaki vakte canlı
// geri sayım. Etkinliği uygulama başlatır (modules/bes-live-activity).
import ActivityKit
import SwiftUI
import WidgetKit

/// **Aynı tanım** `modules/bes-live-activity/ios/BesLiveActivityModule.swift`
/// içinde de var: ActivityKit etkinliği türün adıyla eşler, iki hedef aynı
/// adı ve alanları taşımalı. Birini değiştirirsen ikisini birlikte değiştir.
struct BesVakitAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var name: String
    var target: Date
    var hm: String
    var following: String
  }
  var city: String
  var title: String
}

struct VakitAktivitesi: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: BesVakitAttributes.self) { baglam in
      // Kilit ekranı ve bildirim bandı.
      HStack(spacing: 12) {
        Image("besIsaret").resizable().scaledToFit().frame(width: 40, height: 40)
        VStack(alignment: .leading, spacing: 2) {
          Text(baglam.attributes.title.uppercased(with: Locale(identifier: "tr_TR")))
            .font(.system(size: 10, weight: .bold)).kerning(1.2).foregroundColor(BesRenk.altin)
          Text("\(baglam.state.name) · \(baglam.state.hm)")
            .font(.system(size: 18, weight: .bold)).foregroundColor(BesRenk.fildisi)
          Text(baglam.attributes.city).font(.system(size: 11)).foregroundColor(BesRenk.soluk)
        }
        Spacer()
        GeriSayim(hedef: baglam.state.target)
          .font(.system(size: 28, weight: .bold, design: .rounded))
          .foregroundColor(BesRenk.altin)
          .frame(maxWidth: 120, alignment: .trailing)
      }
      .padding(16)
      .activityBackgroundTint(BesRenk.zumrutAlt)
      .activitySystemActionForegroundColor(BesRenk.altin)
    } dynamicIsland: { baglam in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            Image("besIsaret").resizable().scaledToFit().frame(width: 26, height: 26)
            VStack(alignment: .leading, spacing: 0) {
              Text(baglam.state.name).font(.system(size: 16, weight: .bold)).foregroundColor(BesRenk.fildisi)
              Text(baglam.state.hm).font(.system(size: 12)).foregroundColor(BesRenk.soluk)
            }
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          GeriSayim(hedef: baglam.state.target)
            .font(.system(size: 24, weight: .bold, design: .rounded))
            .foregroundColor(BesRenk.altin)
            .frame(maxWidth: 110, alignment: .trailing)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack {
            Text(baglam.attributes.city)
            Spacer()
            Text(baglam.state.following)
          }
          .font(.system(size: 12)).foregroundColor(BesRenk.soluk)
        }
      } compactLeading: {
        Text(baglam.state.name).font(.system(size: 13, weight: .semibold)).foregroundColor(BesRenk.altin)
      } compactTrailing: {
        GeriSayim(hedef: baglam.state.target)
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(BesRenk.altin)
          .frame(maxWidth: 58)
      } minimal: {
        Image("besIsaret").resizable().scaledToFit().frame(width: 18, height: 18)
      }
      .keylineTint(BesRenk.altin)
    }
  }
}
