// BEŞ — canlı etkinlik (Dinamik Ada) köprüsü. Arayüz widget eklentisinde:
// targets/widget/VakitAktivitesi.swift.
//
// Neden önümüzdeki vakitlerin listesi taşınıyor: canlı etkinlik kendi kendine
// güncellenemez; uygulama uyurken sıradaki vakte geçecek kimse yoktu ve
// etkinlik "İmsak 0:00"da donup kalıyordu (cihazda görüldü, 30 Eylül). Artık:
//  1. `staleDate` = sıradaki vakit. Vakit girdiği an iOS görünümü yeniden
//     çizer; görünüm listeden bir sonraki vakti seçip ona saymaya devam eder.
//  2. Arka plan yenilemesi (BGAppRefreshTask) uyandırdığında bu dosya,
//     JavaScript'e gerek kalmadan listedeki sıradaki vakte geçer ve bir
//     sonraki uyanmayı o vaktin hemen sonrasına ister.
//  3. (2 Ekim) Asıl güvence push: etkinlik `pushType: .token` ile başlar,
//     jeton JS'e (onPushToken) verilir, JS onu önümüzdeki vakitlerle birlikte
//     sunucuya kaydeder; sunucu her vakit girdiğinde APNs ile sıradaki vakte
//     geçirir (supabase/functions/live-activity-push). 1 ve 2 cihazda yetersiz
//     kaldı: kilit ekranı öğleden 39 dk sonra hâlâ "Öğle 0:00" gösteriyordu.
import ActivityKit
import BackgroundTasks
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

struct VakitSlotu: Record {
  @Field var n: String = ""
  @Field var t: Double = 0
  @Field var hm: String = ""
}

struct VakitEtkinligi: Record {
  @Field var city: String = ""
  @Field var title: String = ""
  @Field var name: String = ""
  @Field var target: Double = 0
  @Field var hm: String = ""
  @Field var following: String = ""
  @Field var upcoming: [VakitSlotu] = []
}

/// Listeden "şimdi"den sonraki vakti seçip etkinlik içeriği kurar.
@available(iOS 16.2, *)
enum BesVakitIcerik {
  static func kur(_ slots: [BesVakitSlot], simdi: Date = Date()) -> ActivityContent<BesVakitAttributes.ContentState>? {
    guard let i = slots.firstIndex(where: { $0.t > simdi }) else { return nil }
    let s = slots[i]
    let sonraki = i + 1 < slots.count ? "\(slots[i + 1].n) \(slots[i + 1].hm)" : ""
    let durum = BesVakitAttributes.ContentState(
      name: s.n, target: s.t, hm: s.hm, following: sonraki, upcoming: Array(slots[i...]))
    return ActivityContent(state: durum, staleDate: s.t)
  }

  /// Arka planda çağrılır: çalışan etkinliği sıradaki vakte geçirir.
  /// Dönüş: bir sonraki uyanmanın isteneceği an.
  static func ilerlet() async -> Date? {
    guard let a = Activity<BesVakitAttributes>.activities.first else { return nil }
    let slots = a.content.state.upcoming
    guard let yeni = kur(slots) else {
      await a.end(nil, dismissalPolicy: .immediate)
      return nil
    }
    if yeni.state.target != a.content.state.target { await a.update(yeni) }
    return yeni.state.target
  }
}

public class BesLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BesLiveActivity")

    OnCreate {
      if #available(iOS 16.2, *) { BesVakitPush.basla() }
    }

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("startOrUpdate") { (p: VakitEtkinligi) async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      var slots = p.upcoming.map { BesVakitSlot(n: $0.n, t: Date(timeIntervalSince1970: $0.t), hm: $0.hm) }
      if slots.isEmpty {
        slots = [BesVakitSlot(n: p.name, t: Date(timeIntervalSince1970: p.target), hm: p.hm)]
      }
      guard let icerik = BesVakitIcerik.kur(slots) else { return false }
      // Push'suz başlatılmış eski etkinlik (2 Ekim öncesi) jeton vermez: bir kez yenile.
      let d = UserDefaults.standard
      let pushluSurum = d.bool(forKey: "bes.etkinlik.push")
      let mevcut = Activity<BesVakitAttributes>.activities
      var sonuc = true
      if pushluSurum, let ilk = mevcut.first, ilk.attributes.city == p.city {
        await ilk.update(icerik)
        BesVakitPush.dinle(ilk)
        await BesVakitPush.listeyiGuncelle(ilk)
        for fazla in mevcut.dropFirst() { await fazla.end(nil, dismissalPolicy: .immediate) }
      } else {
        for eski in mevcut { await eski.end(nil, dismissalPolicy: .immediate) }
        do {
          let yeni = try Activity.request(
            attributes: BesVakitAttributes(city: p.city, title: p.title), content: icerik, pushType: .token)
          BesVakitPush.dinle(yeni)
          d.set(true, forKey: "bes.etkinlik.push")
        } catch {
          sonuc = false
        }
      }
      if sonuc { BesVakitYenileme.planla(icerik.state.target) }
      return sonuc
    }

    AsyncFunction("end") { () async in
      guard #available(iOS 16.2, *) else { return }
      for a in Activity<BesVakitAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BesVakitYenileme.kimlik)
      await BesVakitPush.kapat()
    }
  }
}

/// Arka plan yenilemesi. Kimlik Info.plist'teki
/// `BGTaskSchedulerPermittedIdentifiers` ile aynı olmalı (app.config.ts).
enum BesVakitYenileme {
  static let kimlik = "bes.vakit-yenile"

  static func kaydet() {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: kimlik, using: nil) { gorev in
      guard let gorev = gorev as? BGAppRefreshTask else { gorev.setTaskCompleted(success: false); return }
      let is_ = Task {
        guard #available(iOS 16.2, *) else { gorev.setTaskCompleted(success: true); return }
        let sonraki = await BesVakitIcerik.ilerlet()
        if let sonraki { planla(sonraki) }
        gorev.setTaskCompleted(success: true)
      }
      gorev.expirationHandler = { is_.cancel() }
    }
  }

  /// iOS'tan vakit girdikten hemen sonra uyandırılmayı ister. iOS bunu bir
  /// taban olarak alır; uyandırma daha geç gelebilir (pil, kullanım).
  static func planla(_ vakit: Date) {
    let istek = BGAppRefreshTaskRequest(identifier: kimlik)
    istek.earliestBeginDate = vakit.addingTimeInterval(30)
    try? BGTaskScheduler.shared.submit(istek)
  }
}

/// Görev, uygulama açılışı bitmeden kaydedilmek zorunda (BGTaskScheduler
/// kuralı); modül yüklenmesi bunun için geç kalır.
public class BesLiveActivityAppDelegate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    BesVakitYenileme.kaydet()
    // Sunucunun başlattığı etkinliğin jetonu için iOS uygulamayı arka planda
    // uyandırır; JS yüklenmeden jetonu kaydetmek gerekir.
    if #available(iOS 16.2, *) { BesVakitPush.basla() }
    return true
  }
}


/// Push kaydı (2 Ekim). Etkinlik ve "push ile başlat" jetonlarını, önümüzdeki
/// vakitlerle (ad + saat; konum YOK) Supabase'e yazar. Sunucu
/// (supabase/functions/live-activity-push) her vakit girdiğinde etkinliği
/// sıradakine geçirir; iOS'un 8 saat sınırında etkinliği yenisiyle değiştirir.
/// JS'e bağlı değildir: sunucunun başlattığı etkinlikte iOS uygulamayı arka
/// planda kısa süre uyandırır, o anda JS çalışmıyor olabilir.
@available(iOS 16.2, *)
enum BesVakitPush {
  private static var basladi = false
  private static var dinlenen = Set<String>()
  private static let kilit = NSLock()

  private static var ayar: (url: String, anahtar: String, topic: String, env: String)? {
    let b = Bundle.main
    guard let url = b.object(forInfoDictionaryKey: "BESSupabaseURL") as? String, !url.isEmpty,
          let anahtar = b.object(forInfoDictionaryKey: "BESSupabaseAnonKey") as? String, !anahtar.isEmpty,
          let env = b.object(forInfoDictionaryKey: "BESApnsEnv") as? String,
          let topic = b.bundleIdentifier else { return nil }
    return (url, anahtar, topic, env)
  }

  static var cihaz: String {
    let d = UserDefaults.standard
    if let v = d.string(forKey: "bes.cihaz") { return v }
    let v = UUID().uuidString.lowercased()
    d.set(v, forKey: "bes.cihaz")
    return v
  }

  static func basla() {
    // Kilit yalnız bayrak için: dinle() da aynı kilidi alır; kilit tutulurken
    // çağrılırsa açılışta kilitlenip iOS'un bekçisi uygulamayı öldürüyordu.
    kilit.lock()
    let ilk = !basladi
    basladi = true
    kilit.unlock()
    if !ilk { return }
    for a in Activity<BesVakitAttributes>.activities { dinle(a) }
    Task { for await a in Activity<BesVakitAttributes>.activityUpdates { dinle(a) } }
    if #available(iOS 17.2, *) {
      Task {
        for await veri in Activity<BesVakitAttributes>.pushToStartTokenUpdates {
          await gonder("set_live_activity_start_token", ["p_device": cihaz, "p_token": hex(veri)])
        }
      }
    }
  }

  static func dinle(_ a: Activity<BesVakitAttributes>) {
    kilit.lock()
    let yeni = dinlenen.insert(a.id).inserted
    kilit.unlock()
    if !yeni { return }
    Task {
      for await veri in a.pushTokenUpdates {
        let slots = a.content.state.upcoming.map {
          ["n": $0.n, "t": $0.t.timeIntervalSince1970, "hm": $0.hm] as [String: Any]
        }
        await gonder("register_live_activity", [
          "p_device": cihaz, "p_token": hex(veri), "p_city": a.attributes.city,
          "p_title": a.attributes.title, "p_slots": slots,
        ])
      }
    }
  }

  /// Uygulama yeni vakit listesi verdiğinde (startOrUpdate) sunucudaki listeyi tazeler.
  static func listeyiGuncelle(_ a: Activity<BesVakitAttributes>) async {
    guard let veri = a.pushToken else { return }
    let slots = a.content.state.upcoming.map {
      ["n": $0.n, "t": $0.t.timeIntervalSince1970, "hm": $0.hm] as [String: Any]
    }
    await gonder("register_live_activity", [
      "p_device": cihaz, "p_token": hex(veri), "p_city": a.attributes.city,
      "p_title": a.attributes.title, "p_slots": slots,
    ])
  }

  static func kapat() async {
    await gonder("unregister_live_activity", ["p_device": cihaz])
  }

  private static func hex(_ d: Data) -> String { d.map { String(format: "%02x", $0) }.joined() }

  private static func gonder(_ islev: String, _ govde: [String: Any]) async {
    guard let a = ayar, let url = URL(string: "\(a.url)/rest/v1/rpc/\(islev)") else { return }
    var g = govde
    if islev == "register_live_activity" || islev == "set_live_activity_start_token" {
      g["p_topic"] = a.topic; g["p_env"] = a.env
    }
    var istek = URLRequest(url: url)
    istek.httpMethod = "POST"
    istek.setValue("application/json", forHTTPHeaderField: "Content-Type")
    istek.setValue(a.anahtar, forHTTPHeaderField: "apikey")
    istek.setValue("Bearer \(a.anahtar)", forHTTPHeaderField: "Authorization")
    istek.httpBody = try? JSONSerialization.data(withJSONObject: g)
    _ = try? await URLSession.shared.data(for: istek)
  }
}
