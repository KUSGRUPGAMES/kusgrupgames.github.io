#!/usr/bin/env python3
"""
Diyanet ilçe listesini uygulamaya gömülecek TS dosyasına çevirir (5 Ekim).

Girdi (tools/data/): ilceler.json — Diyanet'in il/ilçe kimlikleri
(ezanvakti.emushaf.net aynası: /sehirler/2, /ilceler/{il}); geo.json — ilçe
merkezlerinin koordinatları (OpenStreetMap Nominatim, bir kez). Koordinat
yalnız en yakın ilçeyi bulmak, kıble ve internetsiz yedek hesap içindir;
vakitler Diyanet'in ilçe kimliğiyle alınır.
Çıktı: src/content/diyanetDistricts.ts
    python3 tools/build-diyanet-districts.py
"""
import json, math, os, re
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(KOK, 'tools', 'data')
ilceler = json.load(open(os.path.join(V, 'diyanet-ilceler.json'), encoding='utf-8'))
geo = json.load(open(os.path.join(V, 'diyanet-geo.json'), encoding='utf-8'))

def baslik(s):
    # Diyanet aynı adlı ilçeleri "AKSU (I)", "PAZAR (T)" diye ayırır; il zaten yanında yazılı.
    s = re.sub(r'\s*\([A-ZÇĞİÖŞÜ]\)\s*$', '', s)
    m = {'İ': 'i', 'I': 'ı'}
    kucuk = ''.join(m.get(c, c.lower()) for c in s)
    def kelime(w):
        if not w: return w
        ilk = {'i': 'İ', 'ı': 'I'}.get(w[0], w[0].upper())
        return ilk + w[1:]
    return ' '.join(kelime(w) for w in kucuk.split(' '))

def km(a, b):
    r = math.pi / 180
    h = math.sin((b[0]-a[0])*r/2)**2 + math.cos(a[0]*r)*math.cos(b[0]*r)*math.sin((b[1]-a[1])*r/2)**2
    return 2*6371*math.asin(min(1, math.sqrt(h)))

# İl merkezi kayıtları (ilçe adı = il adı): Nominatim ilin alan ortasını
# veriyor (Manisa'da 61 km sapma); şehir merkezi places.ts'teki 81 ilden alınır.
import unicodedata
def sade(s): return unicodedata.normalize('NFD', baslik(s)).encode('ascii', 'ignore').decode().lower()
il81 = {sade(m.group(1)): (float(m.group(2)), float(m.group(3))) for m in re.finditer(
    r"\['\d\d', '([^']+)', ([\d.]+), ([\d.]+)\]", open(os.path.join(KOK, 'src', 'features', 'location', 'places.ts'), encoding='utf-8').read())}
for x in ilceler:
    if x['ilce'] == x['il']:
        geo[x['id']] = list(il81[sade(x['il'])])
assert len(il81) == 81

merkez = {}
for x in ilceler:
    if x['ilce'] == x['il'] and geo.get(x['id']):
        merkez[x['ilId']] = geo[x['id']]
satirlar, supheli = [], []
for x in ilceler:
    g = geo.get(x['id'])
    m = merkez.get(x['ilId'])
    if not g or (m and km(g, m) > 260):
        supheli.append((x['il'], x['ilce'], g))
        g = m
    if not g:
        continue
    satirlar.append((x['id'], baslik(x['il']), baslik(x['ilce']), round(g[0], 4), round(g[1], 4)))

out = ['/**', ' * Diyanet ilçe listesi — ÜRETİLMİŞ dosya, elle değiştirme.',
       ' * Kaynak ve yeniden üretme: tools/build-diyanet-districts.py (5 Ekim).',
       ' * [Diyanet ilçe kimliği, il, ilçe, enlem, boylam]', ' */',
       'export type DiyanetDistrict = readonly [string, string, string, number, number];',
       '', 'export const DIYANET_DISTRICTS: readonly DiyanetDistrict[] = [']
for s in satirlar:
    out.append('  [%s, %s, %s, %s, %s],' % (json.dumps(s[0]), json.dumps(s[1], ensure_ascii=False), json.dumps(s[2], ensure_ascii=False), s[3], s[4]))
out.append('];\n')
open(os.path.join(KOK, 'src', 'content', 'diyanetDistricts.ts'), 'w', encoding='utf-8').write('\n'.join(out))
print(len(satirlar), 'ilçe; il merkezine düşülen:', len(supheli))
for s in supheli: print('  ', s)
