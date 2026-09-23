/**
 * Süslü kemerli pano — ana sayfadaki "sıradaki vakit" kartı.
 *
 * Bezeme **marka paketinden gelen görsellerdir**, kodla çizilmez. Daha önce
 * kemer ve rozet SVG ile çiziliyordu; ürün sahibi haklı olarak beğenmedi ve
 * paketi gönderdi (`assets/brand/paket/`). Logo için konan kural (D17) burada
 * da geçerli: verilen varlık kullanılır.
 *
 * ## Neden alınlık ayrı, gövde ayrı
 *
 * Pakette hazır bir kemerli kart var (`ui_cerceveleri_01`) ama oranı 1.66:1 —
 * **enine**. Ana sayfadaki kart ise boyuna; geri sayım halkası ve iki satır
 * yazı o orana sığmıyor. Hazır kartı dikey esnetmek kemerin bezeme şeridini
 * de esnetir ve bozar.
 *
 * Bu yüzden kart iki parçadan kurulur:
 * - **Alınlık** (`ui_varliklari_01`) kendi oranında durur, hiç esnemez.
 * - **Gövde** altın kenarlıklı bir panodur ve istenen yüksekliğe uzar.
 * - **Köşe bezemeleri** gövdenin alt köşelerine kendi oranlarında oturur.
 *
 * Böylece kart her yükseklikte doğru görünür. Boyuna bir kemerli çerçeve
 * paketten gelirse bu bileşim tek parçaya indirilebilir.
 */
import React from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Gradient } from './Gradient';

// **Temizlenmiş sürümler** kullanılır (`tools/clean-asset.js`). Ham
// `ui_varliklari_01` kaynak sayfadan komşu parça artığı taşıyor: altında
// duran üç dairenin tepeleri kesime dahil olmuş ve kartın ortasında üç
// serbest yay parçası olarak görünüyordu.
import alinlik from '../../assets/brand/temiz/alinlik.png';
import koseSol from '../../assets/brand/temiz/kose-sol.png';
import koseSag from '../../assets/brand/temiz/kose-sag.png';

/** Alınlık görselinin kendi en/boy oranı; esnetmemek için sabit. */
const ALINLIK_ORAN = 1271 / 502;
/** Köşe bezemesinin oranı. */
const KOSE_ORAN = 310 / 333;

export interface OrnateFrameProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  /** Gövdenin tabanına oturan silüet (marka paketinden). */
  siluet?: number;
  style?: StyleProp<ViewStyle>;
}

export function OrnateFrame({ width, height, children, siluet, style }: OrnateFrameProps) {
  const theme = useTheme();
  const alinlikYuk = width / ALINLIK_ORAN;
  // **Alınlık panonun üstünde durur, içine girmez.**
  //
  // İki deneme gerekti. Önce yarı yarıya bindirildi: alınlığın yan kemerleri
  // yazının üstüne biniyordu. Sonra içerik aşağı itildi ama bu sefer
  // alınlığın alt lobları panonun *içinde* bitiyor ve kartın ortasında üç
  // serbest yay parçası bırakıyordu; panonun düz üst kenarı da kemerin
  // eğrisiyle çakışıyordu. Alınlık taç gibi panonun üstüne oturunca ikisi de
  // kalktı — yalnız dipteki ince şerit bindiriliyor ki araya dikiş girmesin.
  const govdeUst = alinlikYuk * 0.88;
  // Kemerin altındaki açık alan da panonun parçası: içerik oradan başlar.
  // Yalnız gövde içinde ortalamak, üstte büyük boşluk bırakıp vakit listesini
  // ekranın altına itiyordu.
  const icerikUst = alinlikYuk * 0.62;
  const koseGen = width * 0.14;

  return (
    <View style={[{ width, height }, style]}>
      <View
        style={{
          position: 'absolute', left: 0, right: 0, top: govdeUst, bottom: 0,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.highlight,
          overflow: 'hidden',
        }}
      >
        <Gradient colors={theme.colors.accentGradient} />
        {siluet ? (
          <Image
            source={siluet}
            resizeMode="contain"
            accessible={false}
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              width: '100%', height: '34%', opacity: 0.5,
            }}
          />
        ) : null}
        <Image
          source={koseSol}
          resizeMode="contain"
          accessible={false}
          style={{
            position: 'absolute', left: 0, bottom: 0,
            width: koseGen, height: koseGen / KOSE_ORAN, opacity: 0.75,
            transform: [{ scaleY: -1 }],
          }}
        />
        <Image
          source={koseSag}
          resizeMode="contain"
          accessible={false}
          style={{
            position: 'absolute', right: 0, bottom: 0,
            width: koseGen, height: koseGen / KOSE_ORAN, opacity: 0.75,
            transform: [{ scaleY: -1 }],
          }}
        />
      </View>

      <Image
        source={alinlik}
        resizeMode="contain"
        accessible={false}
        style={{ position: 'absolute', left: 0, top: 0, width, height: alinlikYuk }}
      />
      <View style={[StyleSheet.absoluteFill, {
        top: icerikUst,
        paddingHorizontal: theme.spacing.lg,
      }]}>{children}</View>
    </View>
  );
}
