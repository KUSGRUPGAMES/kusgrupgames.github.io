// BEŞ widget — uygulamanın App Group'a yazdığı veri ve ortak görünüm parçaları.
import Foundation
import SwiftUI
import WidgetKit

enum BesRenk {
  static let zumrutUst = Color(red: 0.008, green: 0.188, blue: 0.137)   // #023023
  static let zumrutAlt = Color(red: 0.004, green: 0.078, blue: 0.043)   // #01140B
  static let altin = Color(red: 0.902, green: 0.725, blue: 0.396)       // #E6B965
  static let altinAcik = Color(red: 0.969, green: 0.835, blue: 0.584)   // #F7D595
  static let fildisi = Color(red: 0.984, green: 0.965, blue: 0.925)     // #FBF6EC
  static let soluk = Color(red: 0.984, green: 0.965, blue: 0.925).opacity(0.66)
  static var zemin: LinearGradient {
    LinearGradient(colors: [zumrutUst, zumrutAlt], startPoint: .top, endPoint: .bottom)
  }
}

struct BesEtiketler: Codable {
  let next: String
  let openApp: String
  let verseOfDay: String
  let duaOfDay: String
  let times: String
}

struct BesVakit: Codable, Hashable {
  /// Vakit anahtarı (fajr, sunrise, dhuhr, asr, maghrib, isha).
  let k: String
  /// Görünen ad ("Öğle").
  let n: String
  /// Mutlak an, saniye (Unix).
  let t: Double
  /// Konumun duvar saatiyle "12:54".
  let hm: String
  /// Konumun takvim günü "2026-09-25".
  let d: String
  var tarih: Date { Date(timeIntervalSince1970: t) }
}

struct BesGunluk: Codable {
  let d: String
  let ar: String
  let tr: String
  let ref: String
  let duaTitle: String
  let dua: String
}

struct BesVeri: Codable {
  let v: Int
  let city: String
  let labels: BesEtiketler
  let times: [BesVakit]
  let daily: [BesGunluk]

  /// Verilen andan sonraki ilk vakit.
  func sonraki(_ an: Date) -> BesVakit? { times.first { $0.tarih > an } }

  /// Sıradaki vaktin ait olduğu günün bütün vakitleri (yatsıdan sonra yarın).
  func gunun(_ an: Date) -> [BesVakit] {
    guard let s = sonraki(an) else { return [] }
    return times.filter { $0.d == s.d }
  }

  /// Bugünün (cihaz takvimi) âyet ve duası; yoksa ilk kayıt.
  func gunluk(_ an: Date) -> BesGunluk? {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    let bugun = f.string(from: an)
    return daily.first { $0.d == bugun } ?? daily.first
  }

  static let ornek = BesVeri(
    v: 1, city: "İstanbul",
    labels: BesEtiketler(next: "Sıradaki vakit", openApp: "Vakitleri görmek için BEŞ'i aç",
                         verseOfDay: "Günün âyeti", duaOfDay: "Günün duası", times: "Bugünün vakitleri"),
    times: [
      BesVakit(k: "dhuhr", n: "Öğle", t: Date().addingTimeInterval(3600).timeIntervalSince1970, hm: "12:54", d: "ornek"),
      BesVakit(k: "asr", n: "İkindi", t: Date().addingTimeInterval(4 * 3600).timeIntervalSince1970, hm: "16:17", d: "ornek"),
    ],
    daily: [BesGunluk(d: "ornek", ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", tr: "Demek ki, zorlukla beraber bir kolaylık vardır.",
                      ref: "İnşirâh 5", duaTitle: "Güne başlarken", dua: "Rabbim, bu güne senin adınla başlıyorum.")]
  )
}

enum BesDepo {
  static let anahtar = "bes.widget.v1"

  /// App Group: `group.<ana uygulama bundle id>`. Widget'ın bundle id'si
  /// ana uygulamanınkine bir bileşen eklenerek üretilir; son bileşen atılır.
  static var grup: String {
    let kimlik = Bundle.main.bundleIdentifier ?? "com.kusgrupgames.bes.BesWidget"
    var parca = kimlik.split(separator: ".").map(String.init)
    if parca.count > 1 { parca.removeLast() }
    return "group." + parca.joined(separator: ".")
  }

  static func oku() -> BesVeri? {
    guard let d = UserDefaults(suiteName: grup),
          let metin = d.string(forKey: anahtar),
          let veri = metin.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(BesVeri.self, from: veri)
  }
}

extension View {
  /// iOS 17 widget zemini (containerBackground); iOS 16'da düz arka plan.
  @ViewBuilder
  func besZemin() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(for: .widget) { BesRenk.zemin }
    } else {
      self.background(BesRenk.zemin)
    }
  }

  /// Kilit ekranı aileleri: iOS 17'de zemin API'si benimsenmezse widget
  /// yerine "containerBackground" uyarısı çıkar; zemin sistemindir.
  @ViewBuilder
  func besAksesuarZemini() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(for: .widget) { AccessoryWidgetBackground() }
    } else {
      self
    }
  }
}

/// Geri sayım: hedefe kadar azalır, sıfırda durur (geçmiş aralık çökmesin).
struct GeriSayim: View {
  let hedef: Date
  var body: some View {
    let simdi = Date()
    Text(timerInterval: min(simdi, hedef)...hedef, countsDown: true)
      .monospacedDigit()
  }
}
