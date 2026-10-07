// BEŞ — vakit widget'ı: küçükte sıradaki vakit ve geri sayım, ortada ve
// büyükte günün bütün vakitleri, kilit ekranında kısa gösterim.
import SwiftUI
import WidgetKit

struct VakitGirdisi: TimelineEntry {
  let date: Date
  let veri: BesVeri?
}

struct VakitSaglayici: TimelineProvider {
  func placeholder(in context: Context) -> VakitGirdisi {
    VakitGirdisi(date: Date(), veri: .ornek)
  }

  func getSnapshot(in context: Context, completion: @escaping (VakitGirdisi) -> Void) {
    completion(VakitGirdisi(date: Date(), veri: BesDepo.oku() ?? .ornek))
  }

  /// Her vakit girişinde yeni bir girdi: "sıradaki" kendiliğinden ilerler.
  /// Geri sayımın kendisi `Text(timerInterval:)` ile saniye saniye akar.
  func getTimeline(in context: Context, completion: @escaping (Timeline<VakitGirdisi>) -> Void) {
    let simdi = Date()
    let veri = BesDepo.oku()
    var girdiler = [VakitGirdisi(date: simdi, veri: veri)]
    if let veri {
      for v in veri.times where v.tarih > simdi {
        girdiler.append(VakitGirdisi(date: v.tarih, veri: veri))
      }
    }
    girdiler = Array(girdiler.prefix(40))
    let politika: TimelineReloadPolicy = girdiler.count > 1 ? .atEnd : .after(simdi.addingTimeInterval(3600))
    completion(Timeline(entries: girdiler, policy: politika))
  }
}

struct VakitGorunumu: View {
  @Environment(\.widgetFamily) var aile
  let girdi: VakitGirdisi

  var body: some View {
    if let veri = girdi.veri, let sonraki = veri.sonraki(girdi.date) {
      switch aile {
      case .accessoryInline:
        Text("\(sonraki.n) \(sonraki.hm)").besAksesuarZemini()
      case .accessoryCircular:
        VStack(spacing: 0) {
          Text(sonraki.n).font(.system(size: 11, weight: .semibold)).lineLimit(1)
          GeriSayim(hedef: sonraki.tarih).font(.system(size: 12, weight: .bold))
        }
        .besAksesuarZemini()
      case .accessoryRectangular:
        VStack(alignment: .leading, spacing: 1) {
          Text(veri.labels.next).font(.system(size: 11, weight: .semibold)).opacity(0.8)
          Text("\(sonraki.n) · \(sonraki.hm)").font(.system(size: 15, weight: .bold))
          GeriSayim(hedef: sonraki.tarih).font(.system(size: 15, weight: .semibold))
        }
        .besAksesuarZemini()
      case .systemMedium:
        HStack(spacing: 12) {
          KucukIcerik(veri: veri, sonraki: sonraki)
          VakitListesi(vakitler: veri.gunun(girdi.date), sonraki: sonraki, sik: true)
        }
        .besZemin()
      case .systemLarge:
        VStack(alignment: .leading, spacing: 10) {
          KucukIcerik(veri: veri, sonraki: sonraki)
          Rectangle().fill(BesRenk.altin.opacity(0.35)).frame(height: 1)
          VakitListesi(vakitler: veri.gunun(girdi.date), sonraki: sonraki, sik: false)
        }
        .besZemin()
      default:
        KucukIcerik(veri: veri, sonraki: sonraki).besZemin()
      }
    } else {
      VStack(spacing: 6) {
        Image("besIsaret").resizable().scaledToFit().frame(width: 34, height: 34)
        Text(girdi.veri?.labels.openApp ?? "BEŞ")
          .font(.system(size: 12, weight: .semibold)).foregroundColor(BesRenk.fildisi)
          .multilineTextAlignment(.center)
      }
      .besZemin()
    }
  }
}

/// Küçük widget'ın içeriği; orta ve büyükte sol blok.
struct KucukIcerik: View {
  let veri: BesVeri
  let sonraki: BesVakit

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      HStack(spacing: 5) {
        Image("besIsaret").resizable().scaledToFit().frame(width: 18, height: 18)
        Text(veri.city).font(.system(size: 11, weight: .semibold)).foregroundColor(BesRenk.soluk).lineLimit(1)
      }
      Spacer(minLength: 2)
      Text(veri.labels.next.uppercased(with: Locale(identifier: "tr_TR")))
        .font(.system(size: 9, weight: .bold)).kerning(1.2).foregroundColor(BesRenk.altin)
      Text(sonraki.n).font(.system(size: 22, weight: .heavy)).foregroundColor(BesRenk.fildisi).lineLimit(1)
        .minimumScaleFactor(0.7)
      GeriSayim(hedef: sonraki.tarih)
        .font(.system(size: 24, weight: .bold, design: .rounded)).foregroundColor(BesRenk.altin)
        .lineLimit(1).minimumScaleFactor(0.6)
      Text(sonraki.hm).font(.system(size: 11, weight: .medium)).foregroundColor(BesRenk.soluk)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct VakitListesi: View {
  let vakitler: [BesVakit]
  let sonraki: BesVakit
  let sik: Bool

  var body: some View {
    VStack(spacing: sik ? 2 : 6) {
      ForEach(vakitler, id: \.self) { v in
        let secili = v == sonraki
        HStack {
          Text(v.n).font(.system(size: sik ? 12 : 15, weight: secili ? .bold : .regular))
          Spacer()
          Text(v.hm).font(.system(size: sik ? 12 : 15, weight: secili ? .bold : .medium)).monospacedDigit()
        }
        .foregroundColor(secili ? BesRenk.altin : BesRenk.fildisi)
        .padding(.horizontal, 6).padding(.vertical, sik ? 1 : 4)
        .background(secili ? BesRenk.altin.opacity(0.14) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 6))
      }
    }
    .frame(maxWidth: .infinity)
  }
}

struct VakitWidget: Widget {
  let kind = "BesVakit"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: VakitSaglayici()) { girdi in
      VakitGorunumu(girdi: girdi)
    }
    .configurationDisplayName("Namaz vakitleri")
    .description("Sıradaki vakte geri sayım ve günün vakitleri.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge,
                        .accessoryInline, .accessoryCircular, .accessoryRectangular])
  }
}
