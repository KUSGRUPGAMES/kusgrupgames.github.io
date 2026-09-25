// BEŞ — canlı etkinlik (Dinamik Ada) köprüsü. Arayüz widget eklentisinde:
// targets/widget/VakitAktivitesi.swift.
import ActivityKit
import ExpoModulesCore

/// **Aynı tanım** targets/widget/VakitAktivitesi.swift içinde de var:
/// ActivityKit etkinliği türün adıyla eşler. İkisi birlikte değişmeli.
@available(iOS 16.1, *)
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

struct VakitEtkinligi: Record {
  @Field var city: String = ""
  @Field var title: String = ""
  @Field var name: String = ""
  @Field var target: Double = 0
  @Field var hm: String = ""
  @Field var following: String = ""
}

public class BesLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BesLiveActivity")

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("startOrUpdate") { (p: VakitEtkinligi) async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      let durum = BesVakitAttributes.ContentState(
        name: p.name, target: Date(timeIntervalSince1970: p.target), hm: p.hm, following: p.following)
      // Vakit girdikten on dakika sonra etkinlik "bayat" sayılır.
      let icerik = ActivityContent(state: durum, staleDate: Date(timeIntervalSince1970: p.target + 600))
      let mevcut = Activity<BesVakitAttributes>.activities
      if let ilk = mevcut.first, ilk.attributes.city == p.city {
        await ilk.update(icerik)
        for fazla in mevcut.dropFirst() { await fazla.end(nil, dismissalPolicy: .immediate) }
        return true
      }
      for eski in mevcut { await eski.end(nil, dismissalPolicy: .immediate) }
      do {
        _ = try Activity.request(
          attributes: BesVakitAttributes(city: p.city, title: p.title), content: icerik, pushType: nil)
        return true
      } catch {
        return false
      }
    }

    AsyncFunction("end") { () async in
      guard #available(iOS 16.2, *) else { return }
      for a in Activity<BesVakitAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
    }
  }
}
