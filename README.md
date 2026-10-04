# 📍 Konuma Dayalı Devamsızlık Takip

Üniversite öğrencileri için geliştirilmiş, **konum doğrulamalı** ders devam ve devamsızlık takip uygulaması. Öğrenci, derse gerçekten katılıp katılmadığını bulunduğu konumla doğrular; devamsızlık hakkını ders ders takip eder.

🌐 **Canlı demo:** [konumadayalidevamsizliktakip.vercel.app](https://konumadayalidevamsizliktakip.vercel.app)

## ✨ Özellikler

- 📍 **Konum doğrulamalı yoklama:** Öğrencinin ders konumunda olup olmadığı kontrol edilir
- 📚 **Ders yönetimi:** Derslerini ve ders programını ekleme / düzenleme
- 📊 **Devamsızlık takibi:** Her ders için yapılan devamsızlık ve kalan hak
- 🗺️ **Harita desteği:** Ders konumunu harita üzerinden seçme ve görüntüleme
- 🔔 **Bildirimler:** Ders hatırlatmaları ve devamsızlık uyarıları
- 📁 **Excel desteği:** Verileri Excel (.xlsx) ile içe / dışa aktarma
- 💾 **Yerel veri saklama:** Veriler cihazda tutulur, hesap açmaya gerek yoktur
- 📱 **Çoklu platform:** Android, iOS ve web üzerinde çalışır



## 🛠️ Kullanılan Teknolojiler

| Alan | Teknoloji |
| --- | --- |
| Framework | [Expo](https://expo.dev) / React Native |
| Dil | TypeScript |
| Yönlendirme | Expo Router (dosya tabanlı) |
| Konum | `expo-location` |
| Harita | `react-native-maps` |
| Bildirim | `expo-notifications` |
| Veri saklama | AsyncStorage |
| Excel | `xlsx`, `expo-document-picker` |
| Animasyon | `react-native-reanimated` |
| Web yayını | Vercel |

## 🚀 Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org) (LTS sürüm)
- npm
- Mobilde denemek için [Expo Go](https://expo.dev/go) veya bir emülatör

### Adımlar

1. Projeyi klonla:

```bash
   git clone https://github.com/mehmethansenturk61-gif/konuma_dayali_devamsizlik_takip.git
   cd konuma_dayali_devamsizlik_takip
```

2. Bağımlılıkları yükle:

```bash
   npm install
```

3. Uygulamayı başlat:

```bash
   npx expo start
```

   Açılan menüden Android emülatörü, iOS simülatörü, Expo Go veya web seçeneğini kullanabilirsin.

### Kullanışlı komutlar

| Komut | Açıklama |
| --- | --- |
| `npm start` | Geliştirme sunucusunu başlatır |
| `npm run android` | Android'de çalıştırır |
| `npm run ios` | iOS'ta çalıştırır |
| `npm run web` | Web sürümünü çalıştırır |
| `npm run build:web` | Web için üretim çıktısı alır |
| `npm run lint` | Kod denetimi yapar |

## 📖 Nasıl Çalışır?

1. Öğrenci derslerini ve ders konumlarını uygulamaya ekler.
2. Ders saatinde uygulama, cihazın anlık konumunu alır.
3. Konum, ders için belirlenen alanın içindeyse yoklama **"katıldı"** olarak kaydedilir.
4. Devamsızlık sayısı ve kalan hak ders bazında güncellenir.

> [Not: Doğrulama yarıçapı, devamsızlık limiti gibi gerçek değerleri buraya yaz.]

## 🔒 Gizlilik

Konum bilgisi yalnızca yoklama doğrulaması için kullanılır. Veriler cihazda saklanır ve [üçüncü taraflarla paylaşılmaz / sunucuya gönderilmez].

## 🗺️ Yol Haritası

- [ ] Sunucu tarafı doğrulama (sahte konum önlemi)
- [ ] Öğretim görevlisi paneli
- [ ] Çoklu cihaz senkronizasyonu
- [ ] Karanlık tema

## 🤝 Katkıda Bulunma

Katkılar memnuniyetle karşılanır. Bir issue açabilir veya pull request gönderebilirsin.

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

## 👤 Geliştirici

**Mehmethan Şentürk** · [@mehmethansenturk61-gif](https://github.com/mehmethansenturk61-gif)