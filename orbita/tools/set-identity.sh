#!/usr/bin/env bash
# app.config.json icindeki degerleri tum dosyalara yazar.
# Kullanim: bash tools/set-identity.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node -e '
// DIKKAT: bu program bash icinde TEK TIRNAK arasinda durur, bu yuzden icinde
// duz tek tirnak KULLANILAMAZ. Gereken yerde Q sabiti kullaniliyor.
const fs=require("fs"),p=process.argv[1];
const Q=String.fromCharCode(39);
const c=JSON.parse(fs.readFileSync(p+"/app.config.json","utf8"));
const D="../docs/"+c.gameId+"/";
const FILES=["www/index.html",D+"index.html",D+"privacy.html",D+"gizlilik.html",
             D+"terms.html",D+"support.html","capacitor.config.json","package.json",
             "store/google-play.md","store/app-store.md","native/android.md","native/ios.md",
             "LAUNCH-CHECKLIST.md","README.md"];
// Paylasilan hub uc oyunu birden listeler: orada YALNIZCA e-posta degistirilir,
// yoksa bir oyunun adresi digerlerinin baglantilarini ezer.
const MAILONLY=["../docs/index.html"];
// Bu uc sabit, dosyalarda SU AN yazili olan degerlerdir. app.config.json degisip
// betik calistirildiktan sonra buraya da yeni deger yazilmalidir.
// tools/check.js bunlarin bayat kalmasini HATA olarak yakalar.
const OLD_MAIL="kusgrupgames@gmail.com", OLD_URL="https://kusgrupgames.github.io/orbita", OLD_ID="com.kusgrupgames.orbita";
for(const f of FILES){
  const fp=p+"/"+f; if(!fs.existsSync(fp)) continue;
  const s=fs.readFileSync(fp,"utf8");
  fs.writeFileSync(fp, s.split(OLD_MAIL).join(c.supportEmail)
                        .split(OLD_URL).join(c.pagesBaseUrl)
                        .split(OLD_ID).join(c.bundleId));
}
for(const f of MAILONLY){
  const fp=p+"/"+f; if(!fs.existsSync(fp)) continue;
  const s=fs.readFileSync(fp,"utf8");
  fs.writeFileSync(fp, s.split(OLD_MAIL).join(c.supportEmail));
}
let h=fs.readFileSync(p+"/www/index.html","utf8");
h=h.replace(new RegExp("version: "+Q+"[^"+Q+"]*"+Q), "version: "+Q+c.version+Q);
h=h.replace(/useTest: (true|false)/, "useTest: "+(c.admob.useTest?"true":"false"));
for(const plat of ["android","ios"]){
  for(const k of ["app","interstitial","rewarded"]){
    const v=c.admob.real[plat][k]; if(!v) continue;
    const re=new RegExp("(real:[\\s\\S]*?"+plat+":\\s*\\{[^}]*?"+k+":\\s*"+Q+")[^"+Q+"]*("+Q+")");
    h=h.replace(re,"$1"+v+"$2");
  }
}
fs.writeFileSync(p+"/www/index.html",h);
const pk=JSON.parse(fs.readFileSync(p+"/package.json","utf8"));
pk.version=c.version; fs.writeFileSync(p+"/package.json", JSON.stringify(pk,null,2)+"\n");
const cc=JSON.parse(fs.readFileSync(p+"/capacitor.config.json","utf8"));
cc.appId=c.bundleId; cc.appName=c.appName;
fs.writeFileSync(p+"/capacitor.config.json", JSON.stringify(cc,null,2)+"\n");
console.log("kimlik guncellendi:",c.bundleId,c.supportEmail,c.pagesBaseUrl,"v"+c.version);
' "$ROOT"
