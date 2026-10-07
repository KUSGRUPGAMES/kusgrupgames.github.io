// `react-native-url-polyfill/auto` yalnız yan etkili bir modül (global
// `URL`/`URLSearchParams` doldurur); "mantik" sınamaları Node'da zaten bu
// globallere sahip, gerçek dosya ham ESM olduğu için ts-jest'in dönüştürme
// zincirinin dışında kalıyordu. Sahte, boş modül yeterli.
module.exports = {};
