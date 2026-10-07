// BEŞ widget paketi — eklentideki bütün widget'lar ve canlı etkinlik.
import SwiftUI
import WidgetKit

@main
struct BesWidgetPaketi: WidgetBundle {
  var body: some Widget {
    VakitWidget()
    GununWidget()
    VakitAktivitesi()
  }
}
