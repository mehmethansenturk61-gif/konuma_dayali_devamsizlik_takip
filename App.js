// Devam Takip — Expo (React Native) MVP
// Kurulum: npx create-expo-app devam-takip && cd devam-takip
// npx expo install expo-location expo-notifications expo-document-picker @react-native-async-storage/async-storage @expo/vector-icons react-native-safe-area-context react-native-maps expo-linear-gradient
// npm install xlsx
// Bu dosyayı App.js ile değiştir, ardından: npx expo start -c
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text as RNText, TextInput, TouchableOpacity, ScrollView, Switch, Alert as RNAlert, StatusBar, Platform, useColorScheme, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
const Maps = Platform.OS === 'web' ? null : require('react-native-maps');
import { LinearGradient } from 'expo-linear-gradient';
import * as XLSX from 'xlsx';
const Text = ({ children, ...p }) => <RNText {...p}>{React.Children.map(children, ch => typeof ch === 'string' ? cap(ch) : ch)}</RNText>;
const Alert = {
  alert: (t, m, b, o) => {
    if (Platform.OS === 'web') {
      const text = cap(t) + (m ? '\n\n' + cap(m) : '');
      if (!b || b.length === 0) return window.alert(text);
      if (b.length === 1) { window.alert(text); return b[0].onPress && b[0].onPress(); }
      const btn = window.confirm(text) ? b[b.length - 1] : b[0];
      return btn.onPress && btn.onPress();
    }
    RNAlert.alert(cap(t), m ? cap(m) : m, b && b.map(x => ({ ...x, text: cap(x.text) })), o);
  },
};

const UNIS = [
  ['ktu', 'Karadeniz Teknik Üniversitesi', 40.9944, 39.7733], ['odtu', 'Orta Doğu Teknik Üniversitesi', 39.8913, 32.7787],
  ['itu', 'İstanbul Teknik Üniversitesi', 41.1055, 29.0252], ['boun', 'Boğaziçi Üniversitesi', 41.0846, 29.0509],
  ['hu', 'Hacettepe Üniversitesi', 39.8681, 32.7349], ['ege', 'Ege Üniversitesi', 38.4557, 27.2279],
  ['bilkent', 'Bilkent Üniversitesi', 39.8683, 32.7490], ['au', 'Ankara Üniversitesi', 39.9370, 32.8330],
  ['gazi', 'Gazi Üniversitesi', 39.9390, 32.8200], ['iu', 'İstanbul Üniversitesi', 41.0115, 28.9640],
  ['marmara', 'Marmara Üniversitesi', 40.9860, 29.0520], ['yildiz', 'Yıldız Teknik Üniversitesi', 41.0230, 28.8890],
  ['sabanci', 'Sabancı Üniversitesi', 40.8910, 29.3790], ['koc', 'Koç Üniversitesi', 41.2060, 29.0740],
  ['deu', 'Dokuz Eylül Üniversitesi', 38.3680, 27.2020], ['akdeniz', 'Akdeniz Üniversitesi', 36.8970, 30.6490],
  ['ataturk', 'Atatürk Üniversitesi', 39.9020, 41.2400], ['anadolu', 'Anadolu Üniversitesi', 39.7920, 30.5040],
  ['uludag', 'Bursa Uludağ Üniversitesi', 40.2260, 28.8710], ['selcuk', 'Selçuk Üniversitesi', 38.0250, 32.5130],
  ['cukurova', 'Çukurova Üniversitesi', 37.0500, 35.3550], ['omu', 'Ondokuz Mayıs Üniversitesi', 41.3760, 36.1880],
  ['erciyes', 'Erciyes Üniversitesi', 38.7080, 35.5280], ['pau', 'Pamukkale Üniversitesi', 37.7430, 29.1020],
].map(([id, name, lat, lng]) => ({ id, name, lat, lng }));

const BgDeco = () => (
  <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
    <Ionicons name="school" size={220} color={C.pri} style={{ position: 'absolute', right: -50, top: 60, opacity: 0.05, transform: [{ rotate: '12deg' }] }} />
    <Ionicons name="book" size={160} color={C.pri} style={{ position: 'absolute', left: -40, top: 380, opacity: 0.05, transform: [{ rotate: '-14deg' }] }} />
    <Ionicons name="location" size={140} color={C.pri} style={{ position: 'absolute', right: -20, bottom: 120, opacity: 0.05 }} />
  </View>
);

const Hero = ({ eyebrow, title, line }) => (
  <LinearGradient colors={[C.pri, C.pri + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 22, marginBottom: 16, overflow: 'hidden' }}>
    <Ionicons name="school" size={150} color="#fff" style={{ position: 'absolute', right: -20, top: -10, opacity: 0.14 }} />
    <Ionicons name="book" size={70} color="#fff" style={{ position: 'absolute', right: 90, bottom: -14, opacity: 0.12 }} />
    <Text style={{ color: '#C7D2FE', fontWeight: '600' }}>{eyebrow}</Text>
    <Text style={{ color: '#fff', fontSize: 27, fontWeight: '800', marginTop: 4 }}>{title}</Text>
    {line ? <Text style={{ color: '#E0E7FF', marginTop: 8 }}>{line}</Text> : null}
  </LinearGradient>
);

const CampusMap = ({ uni, radius, me }) => {
  if (!Maps) {
    const col = me ? (me.inside ? '#16A34A' : '#DC2626') : C.pri;
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>html,body,#m{height:100%;margin:0}</style></head><body><div id="m"></div><script>
var m=L.map('m',{zoomControl:false}).setView([${uni.lat},${uni.lng}],16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(m);
var c=L.circle([${uni.lat},${uni.lng}],{radius:${radius},color:'${col}',fillOpacity:0.2}).addTo(m);
L.marker([${uni.lat},${uni.lng}]).addTo(m);
${me ? `L.circleMarker([${me.lat},${me.lng}],{radius:7,color:'#4F46E5',fillOpacity:1}).addTo(m);` : ''}
m.fitBounds(c.getBounds());
</script></body></html>`;
    return <View style={{ height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 12, backgroundColor: '#E6E9F2' }}>
      {React.createElement('iframe', { key: `${radius}-${me ? 1 : 0}`, srcDoc: html, style: { border: 0, width: '100%', height: '100%' } })}
    </View>;
  }
  const MapView = Maps.default, Marker = Maps.Marker, Circle = Maps.Circle;
  const delta = Math.max(0.006, (radius * 5) / 111000);
  const hr = new Date().getHours(), night = hr < 6 || hr >= 19;
  const color = me ? (me.inside ? '#16A34A' : '#DC2626') : C.pri;
  return (
    <View style={{ height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 12, backgroundColor: '#E6E9F2' }}>
      <MapView key={`${radius}-${me ? 1 : 0}-${night ? 'n' : 'd'}`} userInterfaceStyle={night ? 'dark' : 'light'} customMapStyle={night ? DARK_MAP : []} style={{ flex: 1 }} initialRegion={{ latitude: uni.lat, longitude: uni.lng, latitudeDelta: delta, longitudeDelta: delta }}>
        <Circle center={{ latitude: uni.lat, longitude: uni.lng }} radius={radius} strokeColor={color} strokeWidth={2} fillColor={color + '33'} />
        <Marker coordinate={{ latitude: uni.lat, longitude: uni.lng }} title={uni.name} />
        {me && <Marker coordinate={{ latitude: me.lat, longitude: me.lng }} title="Sen" pinColor={C.pri} />}
      </MapView>
    </View>
  );
};


/* ---------- Sabitler & tema ---------- */
const C = { bg: '#F4F6FB', card: '#fff', ink: '#1B2236', mute: '#7A8499', pri: '#4F46E5', priSoft: '#4F46E51A', ok: '#16A34A', okSoft: '#E7F7EC', bad: '#DC2626', badSoft: '#FDECEC', line: '#E6E9F2' };
const ACCENTS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];
const LIGHT = { bg: '#F4F6FB', card: '#fff', ink: '#1B2236', mute: '#7A8499', line: '#E6E9F2', ok: '#16A34A', okSoft: '#E7F7EC', bad: '#DC2626', badSoft: '#FDECEC' };
const DARK = { bg: '#0E1120', card: '#1A1F33', ink: '#F1F3FA', mute: '#9AA3BA', line: '#2A3050', ok: '#22C55E', okSoft: '#12301F', bad: '#F87171', badSoft: '#3A1717' };
const applyTheme = (dark, accent) => Object.assign(C, dark ? DARK : LIGHT, { pri: accent, priSoft: accent + (dark ? '33' : '1A') });
const DARK_MAP = [{ elementType: 'geometry', stylers: [{ color: '#1d2233' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#9aa3ba' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2233' }] }, { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1020' }] }, { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3050' }] }];
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

/* ---------- Yardımcılar ---------- */
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayIdx = d => (d.getDay() + 6) % 7; // 0 = Pazartesi
const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const nowMins = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const uid = () => Math.random().toString(36).slice(2, 9);
const fmtDate = k => { const d = new Date(k + 'T00:00:00'); return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' }); };
const dist = (a, b, c, d) => { const R = 6371000, r = x => x * Math.PI / 180; const dLa = r(c - a), dLo = r(d - b);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

const cfgOf = st => ({ limit: st.settings.limit || 30, weeks: st.settings.weeks || 14, start: st.settings.semStart || null });
const parseDate = t => { const m = String(t).trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/); if (!m) return null; const k = `${m[3]}-${pad(m[2])}-${pad(m[1])}`; return isNaN(new Date(k)) || k > dkey(new Date()) ? null : k; };

const cap = t => String(t || '').replace(/(^|[\s(\[“"'-])([a-zçğıöşü])/g, (m, a, b, off, str) => (b === 'm' && !/[a-zçğıöşüA-ZÇĞİÖŞÜ]/.test(str[off + m.length] || '')) ? m : a + b.toLocaleUpperCase('tr'));
const normNames = st => ({ ...st, courses: (st.courses || []).map(c => ({ ...c, name: cap(c.name), teacher: cap(c.teacher) })), profile: st.profile && { ...st.profile, ad: cap(st.profile.ad), soyad: cap(st.profile.soyad), bolum: cap(st.profile.bolum) } });
// Geçmiş oturumlar: dönem başından (yoksa ders eklenme gününden) bugüne. Kayıt: present | absent | cancelled
function sessions(course, records, cfg = {}) {
  const out = [], start = new Date(cfg.start || course.createdAt), today = new Date();
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (dayIdx(d) !== course.day) continue;
    const k = dkey(d), rec = records[course.id]?.[k];
    if (k === dkey(today) && nowMins() < mins(course.end) && !rec) { if (!course.repeat) break; continue; }
    out.push({ date: k, status: rec || 'absent' });
    if (!course.repeat) break;
  }
  return out;
}
function stats(course, records, cfg = {}) {
  const all = sessions(course, records, cfg), s = all.filter(x => x.status !== 'cancelled');
  const att = s.filter(x => x.status === 'present').length, abs = s.length - att;
  const limit = cfg.limit || 30, planned = course.repeat ? (cfg.weeks || 14) : 1;
  const noLimit = course.maxAbs === 'none', allowed = noLimit ? null : course.maxAbs != null ? course.maxAbs : Math.floor(planned * limit / 100), left = noLimit ? null : allowed - abs;
  const remaining = Math.max(0, planned - s.length), rate = s.length ? abs / s.length : 0;
  const projected = Math.round((abs + rate * remaining) / planned * 100);
  const level = noLimit ? 'free' : allowed === 0 ? (abs ? 'over' : 'ok') : abs > allowed ? 'over' : left === 0 ? 'edge' : left === 1 ? 'warn' : projected > limit ? 'risk' : 'ok';
  const last = [...s].reverse().find(x => x.status === 'present');
  return { total: s.length, att, abs, pct: s.length ? Math.round(abs / s.length * 100) : 0, last: last?.date, list: [...all].reverse(), planned, allowed, left, projected, level, ratio: noLimit ? 0 : allowed ? Math.min(1, abs / allowed) : (abs ? 1 : 0), cancelled: all.length - s.length };
}
function courseState(course, records) {
  const k = dkey(new Date()), r = records[course.id]?.[k], n = nowMins();
  if (r === 'cancelled') return { key: 'cancel', label: '🚫 Ders iptal edildi', color: C.mute };
  if (r === 'present') return { key: 'done', label: '✅ Katılım kaydedildi', color: C.ok };
  if (n > mins(course.end)) return { key: 'missed', label: '🔴 Katılmadı', color: C.bad };
  if (n >= mins(course.start) - 15) return { key: 'open', label: '🟢 Devam kontrolü yapılabilir', color: C.ok };
  return { key: 'wait', label: '⚪ Henüz başlamadı', color: C.mute };
}
function backfillPast(st) {
  const cfg = cfgOf(st), rec = { ...st.records };
  st.courses.forEach(c => { const r = { ...(rec[c.id] || {}) }; sessions(c, rec, cfg).forEach(x => { if (!r[x.date]) r[x.date] = 'present'; }); rec[c.id] = r; });
  return { ...st, records: rec };
}
const LVL = { over: ['🚨', 'Devamsızlık sınırını aştın', 'bad'], edge: ['⚠️', 'Devamsızlık hakkın bitti', 'bad'], warn: ['⚠️', 'Son 1 hakkın kaldı', 'warn'], risk: ['📉', 'Bu tempoda risk var', 'warn'], ok: ['', 'Harika gidiyorsun', 'ok'], free: ['', 'Devamsızlık Sınırı Yok', 'ok'] };
const lvlColor = k => k === 'bad' ? C.bad : k === 'warn' ? '#F59E0B' : C.ok;
const ST = { present: '✅ Katıldı', absent: '❌ Katılmadı', cancelled: '🚫 Ders iptal' };

/* ---------- Depolama (ileride backend ile değiştirilebilir) ---------- */
const store = {
  async load() { try { return JSON.parse(await AsyncStorage.getItem('devam-v1')) || null; } catch { return null; } },
  async save(s) { try { await AsyncStorage.setItem('devam-v1', JSON.stringify(s)); } catch {} },
  async clear() { await AsyncStorage.removeItem('devam-v1'); },
};
const initial = { uni: null, profile: null, courses: [], records: {}, settings: { radius: 150, notif: true, locOk: false, theme: 'auto', accent: '#4F46E5' }, setupDone: false };

/* ---------- Konum servisi ---------- */
async function getPosition() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('PERMISSION');
  try { return (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })).coords; }
  catch { throw new Error('UNAVAILABLE'); }
}
const locError = e => e.message === 'PERMISSION' ? 'Konum izni verilmedi. Telefon ayarlarından izin verip tekrar dene.' : 'Konum alınamadı. GPS\'in açık olduğundan emin ol ve tekrar dene.';

/* ---------- Bildirimler ---------- */
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }) });
async function scheduleReminders(courses, enabled) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    for (const c of courses) {
      let m = mins(c.start) - 15, day = c.day; if (m < 0) { m += 1440; day = (day + 6) % 7; }
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Ders hatırlatma', body: `${c.name} dersin 15 dakika sonra başlıyor.` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: day === 6 ? 1 : day + 2, hour: Math.floor(m / 60), minute: m % 60 },
      });
    }
  } catch {}
}

/* ---------- UI parçaları ---------- */
const Card = ({ children, style, onPress }) => { const P = onPress ? TouchableOpacity : View;
  return <P onPress={onPress} activeOpacity={0.8} style={[{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#1B2236', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, style]}>{children}</P>; };
const Btn = ({ title, onPress, kind = 'pri', icon, disabled, style }) => {
  const bg = kind === 'pri' ? C.pri : kind === 'bad' ? C.badSoft : C.priSoft, fg = kind === 'pri' ? '#fff' : kind === 'bad' ? C.bad : C.pri;
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[{ backgroundColor: bg, opacity: disabled ? 0.5 : 1, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }, style]}>
    {icon && <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 8 }} />}<Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text></TouchableOpacity>; };
const H1 = ({ children }) => <Text style={{ fontSize: 28, fontWeight: '800', color: C.ink, marginBottom: 6 }}>{children}</Text>;
const Sub = ({ children, style }) => <Text style={[{ color: C.mute, fontSize: 14 }, style]}>{children}</Text>;
const Input = props => <TextInput placeholderTextColor={C.mute} {...props} placeholder={cap(props.placeholder)} style={[{ backgroundColor: C.card, borderRadius: 14, padding: 14, fontSize: 16, color: C.ink, borderWidth: 1, borderColor: C.line, marginBottom: 10 }, props.style]} />;
const Bar = ({ ratio }) => <View style={{ height: 8, backgroundColor: C.line, borderRadius: 4, marginTop: 8 }}><View style={{ height: 8, borderRadius: 4, width: `${Math.max(3, ratio * 100)}%`, backgroundColor: ratio >= 0.8 ? C.bad : ratio >= 0.5 ? '#F59E0B' : C.ok }} /></View>;
const Screen = ({ children }) => <View style={{ flex: 1 }}><BgDeco /><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">{children}</ScrollView></View>;
const Back = ({ onPress, label = 'Geri' }) => <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: C.card, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: C.line }}><Ionicons name="chevron-back" size={18} color={C.pri} /><Text style={{ color: C.pri, fontWeight: '700', marginLeft: 2 }}>{label}</Text></TouchableOpacity>;

/* ---------- Kurulum: üniversite ---------- */
const BOLUMLER = ['Acil Yardım ve Afet Yönetimi', 'Adalet', 'Aktüerya Bilimleri', 'Alman Dili ve Edebiyatı', 'Ameliyathane Hizmetleri', 'Antrenörlük Eğitimi', 'Antropoloji', 'Arap Dili ve Edebiyatı', 'Arkeoloji', 'Arşivcilik', 'Astronomi ve Uzay Bilimleri', 'Ağız ve Diş Sağlığı', 'Aşçılık', 'Bankacılık ve Finans', 'Bankacılık ve Sigortacılık', 'Beden Eğitimi ve Spor Öğretmenliği', 'Beslenme ve Diyetetik', 'Bilgi Güvenliği Teknolojisi', 'Bilgisayar Mühendisliği', 'Bilgisayar Programcılığı', 'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği', 'Bilişim Sistemleri Mühendisliği', 'Bilişim Sistemleri ve Teknolojileri', 'Bitki Koruma', 'Biyokimya', 'Biyoloji', 'Biyomedikal Mühendisliği', 'Biyomühendislik', 'Büro Yönetimi ve Yönetici Asistanlığı', 'Coğrafya', 'Deniz Ulaştırma İşletme Mühendisliği', 'Denizcilik İşletmeleri Yönetimi', 'Dil ve Konuşma Terapisi', 'Diş Hekimliği', 'Dış Ticaret', 'Ebelik', 'Eczacılık', 'Eczane Hizmetleri', 'Ekonometri', 'Ekonomi', 'Elektrik Mühendisliği', 'Elektrik Programı', 'Elektrik-Elektronik Mühendisliği', 'Elektronik Teknolojisi', 'Elektronik ve Haberleşme Mühendisliği', 'Endüstri Mühendisliği', 'Endüstriyel Tasarım', 'Enerji Sistemleri Mühendisliği', 'Ergoterapi', 'Felsefe', 'Fen Bilgisi Öğretmenliği', 'Fizik', 'Fizik Mühendisliği', 'Fizyoterapi ve Rehabilitasyon', 'Fransız Dili ve Edebiyatı', 'Gastronomi ve Mutfak Sanatları', 'Gazetecilik', 'Gemi İnşaatı ve Gemi Makineleri Mühendisliği', 'Genetik ve Biyomühendislik', 'Girişimcilik', 'Grafik Tasarım', 'Gıda Mühendisliği', 'Halkla İlişkiler ve Tanıtım', 'Harita Mühendisliği', 'Harita ve Kadastro', 'Hava Trafik Kontrol', 'Havacılık ve Uzay Mühendisliği', 'Havacılık Yönetimi', 'Hemşirelik', 'Heykel', 'Hukuk', 'İktisat', 'İlahiyat', 'İletişim Tasarımı', 'İlk ve Acil Yardım', 'İngiliz Dili ve Edebiyatı', 'İngilizce Öğretmenliği', 'İnsan Kaynakları Yönetimi', 'İnşaat Mühendisliği', 'İnşaat Teknolojisi', 'İslami İlimler', 'İstatistik', 'İç Mimarlık', 'İşletme', 'Japon Dili ve Edebiyatı', 'Jeofizik Mühendisliği', 'Jeoloji Mühendisliği', 'Kamu Yönetimi', 'Kimya', 'Kimya Mühendisliği', 'Kontrol ve Otomasyon Mühendisliği', 'Kütüphanecilik ve Bilgi Belge Yönetimi', 'Lojistik Yönetimi', 'Maden Mühendisliği', 'Makine Mühendisliği', 'Maliye', 'Matematik', 'Matematik Mühendisliği', 'Matematik Öğretmenliği', 'Mekatronik Mühendisliği', 'Mekatronik Programı', 'Metalurji ve Malzeme Mühendisliği', 'Mimarlık', 'Moda Tasarımı', 'Moleküler Biyoloji ve Genetik', 'Muhasebe ve Finans Yönetimi', 'Mütercim Tercümanlık', 'Müzik', 'Müzik Öğretmenliği', 'Nükleer Enerji Mühendisliği', 'Odyoloji', 'Okul Öncesi Öğretmenliği', 'Optisyenlik', 'Orman Endüstri Mühendisliği', 'Orman Mühendisliği', 'Otel Yönetimi', 'Otomotiv Mühendisliği', 'Pazarlama', 'Petrol ve Doğalgaz Mühendisliği', 'Peyzaj Mimarlığı', 'Pilot Yetiştirme', 'Pilotaj', 'Polimer Mühendisliği', 'Psikoloji', 'Psikolojik Danışmanlık ve Rehberlik', 'Radyo, Televizyon ve Sinema', 'Radyoterapi', 'Rehberlik ve Psikolojik Danışmanlık', 'Reklamcılık', 'Rekreasyon', 'Resim', 'Resim-İş Öğretmenliği', 'Rus Dili ve Edebiyatı', 'Sahne Sanatları', 'Sanat Tarihi', 'Sağlık Yönetimi', 'Seramik ve Cam Tasarımı', 'Siber Güvenlik', 'Sigortacılık', 'Sinema ve Televizyon', 'Siyaset Bilimi ve Kamu Yönetimi', 'Sosyal Bilgiler Öğretmenliği', 'Sosyal Hizmet', 'Sosyoloji', 'Spor Bilimleri', 'Spor Yöneticiliği', 'Su Ürünleri Mühendisliği', 'Sınıf Öğretmenliği', 'Tarih', 'Tarım Ekonomisi', 'Tekstil Mühendisliği', 'Tekstil ve Moda Tasarımı', 'Ticaret ve Lojistik', 'Tiyatro', 'Toprak Bilimi ve Bitki Besleme', 'Turizm İşletmeciliği', 'Turizm Rehberliği', 'Türk Dili ve Edebiyatı', 'Türkçe Öğretmenliği', 'Tıbbi Dokümantasyon ve Sekreterlik', 'Tıbbi Laboratuvar Teknikleri', 'Tıp', 'Uluslararası İlişkiler', 'Uluslararası Ticaret ve Finansman', 'Uluslararası Ticaret ve Lojistik', 'Uçak Mühendisliği', 'Veri Bilimi ve Analitiği', 'Veterinerlik', 'Yapay Zeka Mühendisliği', 'Yazılım Mühendisliği', 'Yeni Medya ve İletişim', 'Yönetim Bilişim Sistemleri', 'Ziraat Mühendisliği', 'Zootekni', 'Çalışma Ekonomisi ve Endüstri İlişkileri', 'Çevre Mühendisliği', 'Çocuk Gelişimi', 'Özel Eğitim Öğretmenliği', 'Şehir ve Bölge Planlama'];
const Field = ({ icon, ...rest }) => <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: C.line }}>
  <Ionicons name={icon} size={18} color={C.pri} /><TextInput placeholderTextColor={C.mute} {...rest} placeholder={cap(rest.placeholder)} style={{ flex: 1, padding: 13, fontSize: 16, color: C.ink }} /></View>;

function UniStep({ onPick, initial, onBack }) {
  const [q, setQ] = useState('');
  const [p, setP] = useState(initial || { ad: '', soyad: '', bolum: '', sinif: '' });
  const set = (k, v) => setP(x => ({ ...x, [k]: v }));
  const [showSug, setShowSug] = useState(false);
  const lc = t => t.toLocaleLowerCase('tr');
  const sugg = showSug && p.bolum.trim() ? BOLUMLER.filter(b => lc(b).includes(lc(p.bolum.trim())) && b !== p.bolum).slice(0, 5) : [];
  const list = UNIS.filter(u => u.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')));
  const pick = u => {
    if (!p.ad.trim() || !p.soyad.trim() || !p.bolum.trim() || !p.sinif) return Alert.alert('Bilgilerini tamamla', 'Ad, soyad, bölüm ve sınıf bilgisi gerekli.');
    onPick(u, { ...p, ad: cap(p.ad.trim()), soyad: cap(p.soyad.trim()), bolum: cap(p.bolum.trim()) });
  };
  return <Screen>
    {onBack && <Back onPress={onBack} />}
    <Hero eyebrow="Hoş geldin 🎓" title="Seni tanıyalım" line="Birkaç bilgi, sonra üniversiteni seç. Hepsi sadece telefonunda kalır." />
    <Text style={{ fontWeight: '800', color: C.ink, fontSize: 18, marginBottom: 10 }}>1 · Bilgilerin</Text>
    <Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field icon="person" placeholder="Ad" value={p.ad} onChangeText={v => set('ad', v)} autoCapitalize="words" /></View>
        <View style={{ flex: 1 }}><Field icon="person-outline" placeholder="Soyad" value={p.soyad} onChangeText={v => set('soyad', v)} autoCapitalize="words" /></View>
      </View>
      <Field icon="library" placeholder="Bölüm" value={p.bolum} onChangeText={v => { set('bolum', v); setShowSug(true); }} autoCapitalize="words" />
      {sugg.length > 0 && <View style={{ marginTop: -4, marginBottom: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
        {sugg.map(b => <TouchableOpacity key={b} onPress={() => { set('bolum', b); setShowSug(false); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Ionicons name="search" size={16} color={C.mute} /><Text style={{ marginLeft: 10, color: C.ink, fontSize: 15 }}>{b}</Text></TouchableOpacity>)}</View>}
      <Text style={{ color: C.mute, marginBottom: 8, fontWeight: '600' }}>Sınıf</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['Hazırlık', '1', '2', '3', '4', '5', '6'].map(x => { const on = p.sinif === x; return <TouchableOpacity key={x} onPress={() => set('sinif', x)} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: on ? C.pri : C.bg, borderWidth: 1, borderColor: on ? C.pri : C.line }}>
          <Text style={{ color: on ? '#fff' : C.ink, fontWeight: '700' }}>{x === 'Hazırlık' ? x : `${x}. sınıf`}</Text></TouchableOpacity>; })}
      </View>
    </Card>
    <Text style={{ fontWeight: '800', color: C.ink, fontSize: 18, marginVertical: 10 }}>2 · Önce üniversiteni seç</Text>
    <Input placeholder="🔍 Üniversite ara…" value={q} onChangeText={setQ} />
    {list.map(u => <Card key={u.id} onPress={() => pick(u)} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.priSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="school" size={22} color={C.pri} /></View>
      <Text style={{ marginLeft: 12, fontSize: 16, color: C.ink, flex: 1, fontWeight: '600' }}>{u.name}</Text><Ionicons name="chevron-forward" size={18} color={C.mute} /></Card>)}
    <Card onPress={() => pick({ id: 'custom', name: 'Üniversitem', lat: null, lng: null })} style={{ backgroundColor: C.priSoft }}>
      <Text style={{ color: C.pri, fontWeight: '700', fontSize: 16 }}>Üniversitem listede yok</Text><Sub>Kampüs konumunu sonra sen belirlersin.</Sub></Card>
  </Screen>;
}

/* ---------- Ders formu ---------- */
function CourseForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: '', day: 0, start: '09:00', end: '10:40', room: '', teacher: '', repeat: true });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const ok = t => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t);
  const submit = () => {
    if (!f.name.trim() || !f.room.trim()) return Alert.alert('Eksik bilgi', 'Ders adı ve derslik gerekli.');
    if (!ok(f.start) || !ok(f.end) || mins(f.end) <= mins(f.start)) return Alert.alert('Saat hatalı', 'Saatleri SS:DD formatında gir (örn. 13:00).');
    const n = t => { const [h, m] = t.split(':'); return `${pad(h)}:${m}`; };
    onSave({ ...f, name: cap(f.name.trim()), teacher: cap(f.teacher.trim()), start: n(f.start), end: n(f.end), id: uid(), createdAt: dkey(new Date()) });
    setF({ ...f, name: '', room: '', teacher: '' });
  };
  return <View>
    <Input placeholder="Ders adı (örn. Veri Yapıları)" value={f.name} onChangeText={v => set('name', v)} autoCapitalize="words" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      {DAYS.map((d, i) => <TouchableOpacity key={d} onPress={() => set('day', i)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginRight: 8, backgroundColor: f.day === i ? C.pri : C.card, borderWidth: 1, borderColor: C.line }}>
        <Text style={{ color: f.day === i ? '#fff' : C.ink, fontWeight: '600' }}>{d}</Text></TouchableOpacity>)}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Input style={{ flex: 1 }} placeholder="Başlangıç 13:00" value={f.start} onChangeText={v => set('start', v)} />
      <Input style={{ flex: 1 }} placeholder="Bitiş 14:40" value={f.end} onChangeText={v => set('end', v)} />
    </View>
    <Input placeholder="Derslik (örn. B-204)" value={f.room} onChangeText={v => set('room', v)} />
    <Input placeholder="Öğretim elemanı (isteğe bağlı)" value={f.teacher} onChangeText={v => set('teacher', v)} autoCapitalize="words" />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><Text style={{ color: C.ink, fontSize: 16 }}>Her hafta tekrarla</Text><Switch value={f.repeat} onValueChange={v => set('repeat', v)} trackColor={{ true: C.pri }} /></View>
    <Btn title="Dersi Ekle" icon="add-circle" onPress={submit} />
    {onCancel && <Btn kind="soft" title="Vazgeç" onPress={onCancel} style={{ marginTop: 10 }} />}
  </View>;
}

/* ---------- Excel içe aktarma (gün sütunlu ders programı) ---------- */
const trUp = t => String(t || '').toLocaleUpperCase('tr').trim();
const TR_DAYS = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];
function parseGrid(wb) {
  const out = [];
  wb.SheetNames.forEach(sn => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' });
    const hi = rows.findIndex(r => r.filter(c => TR_DAYS.includes(trUp(c))).length >= 2);
    if (hi < 0) return;
    const dayCol = {}; let roomCol = -1;
    rows[hi].forEach((c, i) => { const d = TR_DAYS.indexOf(trUp(c)); if (d >= 0) dayCol[i] = d; else if (/DERSL[İI]K/.test(trUp(c))) roomCol = i; });
    rows.slice(hi + 1).forEach(r => {
      const label = String(r[0] || '').trim(); if (!label) return;
      const k = label.lastIndexOf(' - '), name = cap(k > 0 ? label.slice(0, k).trim() : label), teacher = cap(k > 0 ? label.slice(k + 3).trim() : '');
      Object.entries(dayCol).forEach(([i, d]) => {
        const m = String(r[i] || '').match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
        if (!m) return;
        out.push({ id: uid(), name, day: d, start: `${pad(m[1])}:${m[2]}`, end: `${pad(m[3])}:${m[4]}`, room: (roomCol >= 0 && String(r[roomCol] || '').trim()) || '—', teacher, repeat: true, createdAt: dkey(new Date()) });
      });
    });
  });
  return out;
}

/* ---------- Kurulum: ders programı ---------- */
function ScheduleStep({ courses, onAdd, onFinish, onBack }) {
  const [mode, setMode] = useState(null);
  const [dt, setDt] = useState(''), [past, setPast] = useState(false);
  const finish = () => { let start = null; if (dt.trim()) { start = parseDate(dt); if (!start) return Alert.alert('Tarih hatalı', 'GG.AA.YYYY biçiminde, geçmiş bir tarih yaz (örn. 15.09.2026) ya da boş bırak.'); } onFinish({ start, past: !!start && past }); };
  const upload = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/pdf', 'image/*', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], copyToCacheDirectory: true });
      if (r.canceled) return;
      const file = r.assets[0];
      if (/\.xlsx?$/i.test(file.name || '')) {
        const buf = await (await fetch(file.uri)).arrayBuffer();
        const list = parseGrid(XLSX.read(buf, { type: 'array' }));
        list.forEach(c => onAdd(c));
        return Alert.alert(list.length ? `${list.length} ders eklendi` : 'Ders bulunamadı', list.length ? 'Listeyi kontrol edebilirsin.' : 'Excel düzeni tanınmadı. Dersleri elle ekleyebilirsin.');
      }
      if (!/\.csv$/i.test(file.name || '')) return Alert.alert('Dosya alındı', `"${file.name}" otomatik okunamıyor. Şimdilik sadece CSV ve Excel okunabiliyor. Dersleri elle ekleyebilirsin.`, [{ text: 'Elle Ekle', onPress: () => setMode('manual') }]);
      const text = await (await fetch(file.uri)).text();
      const rows = text.split(/\r?\n/).map(l => l.split(/[;,]/).map(x => x.trim())).filter(r => r.length >= 5);
      let n = 0;
      rows.forEach(([name, day, start, end, room, teacher]) => {
        const d = DAYS.findIndex(x => x.toLocaleLowerCase('tr') === (day || '').toLocaleLowerCase('tr'));
        if (d < 0 || !/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) return;
        onAdd({ id: uid(), name: cap(name), day: d, start: pad(start.split(':')[0]) + ':' + start.split(':')[1], end: pad(end.split(':')[0]) + ':' + end.split(':')[1], room, teacher: cap(teacher || ''), repeat: true, createdAt: dkey(new Date()) }); n++;
      });
      Alert.alert(n ? `${n} ders eklendi` : 'Ders bulunamadı', n ? 'Listeyi kontrol edebilirsin.' : 'CSV formatı: ders,gün,başlangıç,bitiş,derslik,hoca. Dersleri elle ekleyebilirsin.');
    } catch { Alert.alert('Dosya okunamadı', 'Dersleri elle ekleyebilirsin.'); }
  };
  return <Screen>
    {!mode && onBack && <Back onPress={onBack} label="Üniversiteye dön" />}
    {mode && <Back onPress={() => setMode(null)} label="Seçeneklere dön" />}
    <Text style={{ fontSize: 40, marginTop: 20 }}>🗓️</Text><H1>Ders programını oluşturalım</H1>
    {!mode && <>
      <Sub style={{ marginBottom: 16 }}>Programını yükle ya da dersleri tek tek ekle.</Sub>
      <Card onPress={upload}><Ionicons name="cloud-upload" size={26} color={C.pri} /><Text style={{ fontSize: 18, fontWeight: '700', color: C.ink, marginTop: 8 }}>Ders Programımı Yükle</Text><Sub>CSV ve Excel otomatik okunur. PDF / JPG alınır, okunamazsa elle eklemeye yönlendirilirsin.</Sub></Card>
      <Card onPress={() => setMode('manual')}><Ionicons name="create" size={26} color={C.pri} /><Text style={{ fontSize: 18, fontWeight: '700', color: C.ink, marginTop: 8 }}>Elle Ekle</Text><Sub>Dersleri tek tek gir.</Sub></Card>
    </>}
    {mode === 'manual' && <CourseForm onSave={onAdd} />}
    {courses.length > 0 && <>
      <Text style={{ fontWeight: '700', color: C.ink, marginVertical: 12 }}>Eklenen dersler ({courses.length})</Text>
      {courses.map(c => <Card key={c.id} style={{ padding: 12 }}><Text style={{ fontWeight: '700', color: C.ink }}>{c.name}</Text><Sub>{DAYS[c.day]} · {c.start}-{c.end} · {c.room}</Sub></Card>)}
      <Card style={{ marginTop: 8 }}><Text style={{ fontWeight: '700', color: C.ink }}>📅 Dönem ne zaman başladı?</Text><Sub style={{ marginBottom: 8 }}>İsteğe bağlı. Geçmiş haftalar da devam hesabına girer.</Sub>
        <Input placeholder="GG.AA.YYYY (örn. 15.09.2026)" value={dt} onChangeText={setDt} keyboardType="numbers-and-punctuation" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: C.ink, flex: 1, paddingRight: 10 }}>O günden beri tüm derslere katıldım</Text><Switch value={past} onValueChange={setPast} trackColor={{ true: C.pri }} /></View></Card>
      <Btn title="Tamamla" icon="checkmark-circle" onPress={finish} />
    </>}
    {courses.length === 0 && <Btn kind="soft" title="Şimdilik atla" onPress={() => onFinish({})} style={{ marginTop: 8 }} />}
  </Screen>;
}

/* ---------- Konum durumu kartı ---------- */
function useCampus(state, update) {
  const [res, setRes] = useState(null); // {inside, d} | {error}
  const check = useCallback(async () => {
    if (!state.uni?.lat) { const r = { error: 'Üniversite konumu belirlenmemiş. Ayarlar > Üniversite konumunu düzenle.' }; setRes(r); return r; }
    try {
      const p = await getPosition(); update(s => ({ ...s, settings: { ...s.settings, locOk: true } }));
      const d = dist(p.latitude, p.longitude, state.uni.lat, state.uni.lng), r = { inside: d <= state.settings.radius, d: Math.round(d), lat: p.latitude, lng: p.longitude };
      setRes(r); return r;
    } catch (e) { const r = { error: locError(e) }; setRes(r); return r; }
  }, [state.uni, state.settings.radius]);
  return [res, check];
}

/* ---------- Ana sayfa ---------- */
function Home({ state, update, openCourse }) {
  const [tick, setTick] = useState(0), [busy, setBusy] = useState(null);
  const [res, check] = useCampus(state, update);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 30000); return () => clearInterval(t); }, []);
  const today = state.courses.filter(c => c.day === dayIdx(new Date())).sort((a, b) => mins(a.start) - mins(b.start));

  const askPermission = () => new Promise(r => state.settings.locOk ? r(true) : Alert.alert('Konumunu kullanmamıza izin ver', 'Derse katıldığını doğrulamak için konumunu sadece kampüste olup olmadığını kontrol etmek amacıyla kullanırız. Konum cihazından çıkmaz.', [{ text: 'Vazgeç', onPress: () => r(false) }, { text: 'İzin Ver', onPress: () => r(true) }]));
  const checkIn = async c => {
    if (!(await askPermission())) return;
    setBusy(c.id);
    const r = await check(); setBusy(null);
    if (r.error) return Alert.alert('Konum alınamadı', r.error);
    if (!r.inside) return Alert.alert('📍 Üniversite alanında görünmüyorsun.', `Kampüs merkezine ${r.d} m uzaktasın (limit ${state.settings.radius} m).`);
    if (courseState(c, state.records).key !== 'open') return Alert.alert('Ders saati uygun değil', 'Devam kontrolü ders başlamadan 15 dk önce açılır, ders bitince kapanır.');
    update(s => ({ ...s, records: { ...s.records, [c.id]: { ...s.records[c.id], [dkey(new Date())]: 'present' } } }));
    Alert.alert('✅ Derse katılımın kaydedildi.');
  };
  return <Screen>
    <Hero eyebrow={`👋 Merhaba ${state.profile?.ad || ''} · ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`} title={`Bugün — ${DAYS[dayIdx(new Date())]}`} line={`${state.uni?.name || ''} · ${today.length} ders`} />
    <Card onPress={async () => { if (await askPermission()) check(); }} style={{ backgroundColor: res?.inside ? C.okSoft : res ? C.badSoft : C.priSoft, flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name={res?.inside ? 'location' : 'location-outline'} size={26} color={res?.inside ? C.ok : res ? C.bad : C.pri} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontWeight: '700', color: C.ink, fontSize: 16 }}>{!res ? 'Konumunu kontrol et' : res.error ? 'Konum alınamadı' : res.inside ? '🟢 Kampüstesin' : '🔴 Üniversite alanı dışındasın'}</Text>
        <Sub>{res?.error || (res ? `Merkeze ${res.d} m` : 'Dokun ve kampüste olup olmadığını gör')}</Sub></View></Card>
    {state.uni?.lat && <CampusMap uni={state.uni} radius={state.settings.radius} me={res && !res.error ? res : null} />}
    {(() => { const r = state.courses.map(c => ({ c, s: stats(c, state.records, cfgOf(state)) })).filter(x => ['over', 'edge', 'warn'].includes(x.s.level)); return r.length ? <Card onPress={() => openCourse(r[0].c.id)} style={{ borderLeftWidth: 4, borderLeftColor: C.bad }}><Text style={{ fontWeight: '800', color: C.ink }}>⚠️ Devamsızlık uyarısı</Text>{r.slice(0, 3).map(x => <Text key={x.c.id} style={{ color: C.mute, marginTop: 4 }}>{x.c.name}: {LVL[x.s.level][1]}</Text>)}</Card> : null; })()}
    {today.length === 0 && <Card><Text style={{ textAlign: 'center', color: C.mute, padding: 20 }}>🎉 Bugün dersin yok.</Text></Card>}
    {today.map(c => { const st = courseState(c, state.records); return <Card key={c.id} onPress={() => openCourse(c.id)}>
      <Text style={{ color: C.pri, fontWeight: '700' }}>{c.start} - {c.end}</Text>
      <Text style={{ fontSize: 19, fontWeight: '800', color: C.ink, marginTop: 4 }}>📚 {c.name}</Text>
      <Text style={{ color: C.mute, marginTop: 2 }}>🏫 {c.room}</Text>
      <Text style={{ color: st.color, fontWeight: '600', marginTop: 8 }}>{st.label}</Text>
      {st.key === 'open' && <Btn title={busy === c.id ? 'Kontrol ediliyor…' : 'Devamı Kontrol Et'} icon="navigate" disabled={busy === c.id} onPress={() => checkIn(c)} style={{ marginTop: 12 }} />}
    </Card>; })}
  </Screen>;
}

/* ---------- Dersler / Devam ---------- */
const CourseRow = ({ c, records, cfg, onPress }) => { const s = stats(c, records, cfg), L = LVL[s.level]; return <Card onPress={onPress}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 17, fontWeight: '800', color: C.ink, flex: 1 }}>{c.name}</Text><Text style={{ fontWeight: '800', color: lvlColor(L[2]) }}>%{s.pct}</Text></View>
  <Sub>Toplam {s.total} · Katıldığın {s.att} · Katılmadığın {s.abs}</Sub><Bar ratio={s.ratio} />
  <Text style={{ color: lvlColor(L[2]), fontWeight: '600', marginTop: 8, fontSize: 13 }}>{L[0]} {s.level === 'ok' ? `Kalan devamsızlık hakkın: ${Math.max(0, s.left)}` : L[1]}</Text>
  <Sub style={{ marginTop: 4 }}>Son katılım: {s.last ? fmtDate(s.last) : '—'}</Sub></Card>; };

function Courses({ state, openCourse, title = 'Dersler' }) {
  return <Screen><H1>{title}</H1>{state.courses.length === 0 && <Sub>Henüz ders eklenmedi. Ayarlar'dan ekleyebilirsin.</Sub>}
    {state.courses.map(c => <CourseRow key={c.id} c={c} cfg={cfgOf(state)} records={state.records} onPress={() => openCourse(c.id)} />)}</Screen>;
}

function Detail({ course, state, update, back }) {
  const [open, setOpen] = useState(null);
  if (!course) return null;
  const cfg = cfgOf(state), s = stats(course, state.records, cfg), L = LVL[s.level], col = lvlColor(L[2]);
  const setRec = (date, st) => update(x => ({ ...x, records: { ...x.records, [course.id]: { ...x.records[course.id], [date]: st } } }));
  const today = dkey(new Date()), canCancel = course.day === dayIdx(new Date()) && !state.records[course.id]?.[today] && nowMins() < mins(course.end);
  const tips = { over: 'Hocanla görüşmeni öneririm. Mazeretin varsa raporunu iletmeyi unutma.', edge: 'Bundan sonra tek bir devamsızlık bile seni sınırın dışına atar.', warn: 'Bir devamsızlık daha yaparsan hakkın biter.', risk: `Bu tempoda dönem sonunda yaklaşık %${s.projected} devamsızlığa ulaşırsın.`, ok: 'Böyle devam, devamlılığın güvende.', free: 'Bu ders için devamsızlık sınırı yok.' };
  return <Screen>
    <Back onPress={back} />
    <H1>{course.name}</H1><Sub>{DAYS[course.day]} · {course.start} - {course.end} · {course.room}{course.teacher ? ` · ${course.teacher}` : ''}</Sub>
    <Card style={{ marginTop: 16, borderLeftWidth: 4, borderLeftColor: col }}>
      <Text style={{ fontSize: 17, fontWeight: '800', color: col }}>{L[0]} {L[1]}</Text>
      <Text style={{ color: C.ink, marginTop: 6 }}>{tips[s.level]}</Text>
      <Sub style={{ marginTop: 8 }}>{s.allowed == null ? 'Devamsızlık sınırı yok' : `Kalan hak: ${Math.max(0, s.left)} / ${s.allowed} · Dönem sonu tahmini: %${s.projected} (sınır %${cfg.limit})`}</Sub></Card>
    <Card><Text style={{ fontWeight: '700', color: C.ink, marginBottom: 6 }}>Devam Durumu</Text>
      <Text style={{ color: C.ink }}>{s.total} ders yapıldı{s.cancelled ? ` (${s.cancelled} iptal)` : ''}</Text><Text style={{ color: C.ok }}>{s.att} katılım</Text><Text style={{ color: C.bad }}>{s.abs} devamsızlık (%{s.pct})</Text><Bar ratio={s.ratio} /></Card>
    {canCancel && <Btn kind="soft" icon="close-circle" title="Bugünkü dersi iptal et" onPress={() => setRec(today, 'cancelled')} style={{ marginBottom: 12 }} />}
    <Text style={{ fontWeight: '700', color: C.ink, marginTop: 8 }}>Geçmiş</Text><Sub style={{ marginBottom: 8 }}>Düzeltmek için bir satıra dokun</Sub>
    {s.list.length === 0 && <Sub>Henüz tamamlanmış ders yok.</Sub>}
    {s.list.map(x => { const o = open === x.date; return <Card key={x.date} onPress={() => setOpen(o ? null : x.date)} style={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: C.ink }}>{fmtDate(x.date)} → {ST[x.status]}</Text><Ionicons name={o ? 'chevron-up' : 'create-outline'} size={16} color={C.mute} /></View>
      {o && <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {[['present', 'Katıldı', C.ok], ['absent', 'Katılmadı', C.bad], ['cancelled', 'İptal', C.mute]].map(([k, l, cl]) => { const on = x.status === k; return <TouchableOpacity key={k} onPress={() => setRec(x.date, k)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: on ? cl : C.bg, borderWidth: 1, borderColor: on ? cl : C.line }}><Text style={{ color: on ? '#fff' : C.ink, fontWeight: '700', fontSize: 12 }}>{l}</Text></TouchableOpacity>; })}</View>}</Card>; })}
  </Screen>;
}

/* ---------- Takvim ---------- */
function Calendar({ state, openCourse }) {
  const [d, setD] = useState(Math.min(dayIdx(new Date()), 6));
  const list = state.courses.filter(c => c.day === d).sort((a, b) => mins(a.start) - mins(b.start));
  return <Screen><H1>Haftalık Program</H1>
    <View style={{ flexDirection: 'row', marginBottom: 14 }}>{DAYS.slice(0, 5).map((n, i) => <TouchableOpacity key={n} onPress={() => setD(i)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, marginHorizontal: 2, alignItems: 'center', backgroundColor: d === i ? C.pri : C.card }}>
      <Text style={{ color: d === i ? '#fff' : C.ink, fontWeight: '700', fontSize: 12 }}>{n.slice(0, 3)}</Text></TouchableOpacity>)}</View>
    <Text style={{ fontWeight: '700', color: C.ink, marginBottom: 8 }}>{DAYS[d]}</Text>
    {list.length === 0 && <Sub>Bu gün ders yok.</Sub>}
    {list.map(c => <Card key={c.id} onPress={() => openCourse(c.id)}><Text style={{ color: C.pri, fontWeight: '700' }}>{c.start} - {c.end}</Text><Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{c.name}</Text><Sub>🏫 {c.room}</Sub></Card>)}
  </Screen>;
}

/* ---------- Ayarlar ---------- */
function WeekEditor({ state, update, back }) {
  const [off, setOff] = useState(0);
  const cfg = cfgOf(state), todayK = dkey(new Date());
  const mon = d => { const t = new Date(d); t.setDate(t.getDate() - dayIdx(t)); return t; };
  const base = mon(new Date()); base.setDate(base.getDate() + off * 7);
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => { const d = new Date(base); d.setDate(base.getDate() + i); return { i, k: dkey(d) }; });
  const startK = cfg.start || state.courses.map(c => c.createdAt).sort()[0] || todayK;
  const minOff = Math.min(0, Math.round((mon(new Date(startK)) - mon(new Date())) / 604800000));
  const cs = c => cfg.start || c.createdAt;
  const first = c => { const d = new Date(cs(c)); while (dayIdx(d) !== c.day) d.setDate(d.getDate() + 1); return dkey(d); };
  const occurs = (c, k) => k >= cs(c) && (c.repeat || k === first(c));
  const setRec = (c, k, st) => update(x => ({ ...x, records: { ...x.records, [c.id]: { ...x.records[c.id], [k]: st } } }));
  const cycle = (c, k) => { const r = state.records[c.id]?.[k]; setRec(c, k, r === 'present' ? 'cancelled' : r === 'cancelled' ? 'absent' : 'present'); };
  const allPresent = () => update(x => { const rec = { ...x.records }; days.forEach(({ i, k }) => { if (k > todayK) return; x.courses.filter(c => c.day === i && occurs(c, k)).forEach(c => { if (rec[c.id]?.[k] !== 'cancelled') rec[c.id] = { ...rec[c.id], [k]: 'present' }; }); }); return { ...x, records: rec }; });
  const label = (c, k) => { const r = state.records[c.id]?.[k]; if (k > todayK) return '⏳ Henüz değil'; if (r === 'present') return '✅ Katıldı'; if (r === 'cancelled') return '🚫 İptal'; if (k === todayK && !r && nowMins() < mins(c.end)) return '⚪ Bekliyor'; return '❌ Katılmadı'; };
  const any = days.some(({ i, k }) => state.courses.some(c => c.day === i && occurs(c, k)));
  const Arrow = ({ icon, dis, onPress }) => <TouchableOpacity disabled={dis} onPress={onPress} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: dis ? 0.35 : 1 }}><Ionicons name={icon} size={22} color={C.pri} /></TouchableOpacity>;
  return <Screen>
    <Back onPress={back} />
    <H1>Katıldığın Dersler</H1><Sub>Derse dokun: Katıldı → İptal → Katılmadı</Sub>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 14 }}>
      <Arrow icon="chevron-back" dis={off <= minOff} onPress={() => setOff(off - 1)} />
      <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: '800', color: C.ink, fontSize: 16 }}>{fmtDate(days[0].k)} – {fmtDate(days[6].k)}</Text><Sub>{off === 0 ? 'Bu hafta' : `${-off} hafta önce`}</Sub></View>
      <Arrow icon="chevron-forward" dis={off >= 0} onPress={() => setOff(off + 1)} />
    </View>
    {off !== 0 && <Btn kind="soft" title="Bu Haftaya Dön" onPress={() => setOff(0)} style={{ marginBottom: 12 }} />}
    {days.map(({ i, k }) => { const list = state.courses.filter(c => c.day === i && occurs(c, k)).sort((a, b) => mins(a.start) - mins(b.start)); if (!list.length) return null;
      return <View key={k}><Text style={{ fontWeight: '700', color: C.ink, marginVertical: 8 }}>{DAYS[i]} · {fmtDate(k)}</Text>
        {list.map(c => <Card key={c.id} onPress={k > todayK ? undefined : () => cycle(c, k)} style={{ opacity: k > todayK ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 8 }}><Text style={{ color: C.pri, fontWeight: '700' }}>{c.start} - {c.end}</Text><Text style={{ fontSize: 16, fontWeight: '800', color: C.ink }}>{c.name}</Text><Sub>🏫 {c.room}</Sub></View>
          <Text style={{ color: C.ink, fontWeight: '700' }}>{label(c, k)}</Text></Card>)}</View>; })}
    {!any && <Sub>Bu haftada ders yok.</Sub>}
    {any && off <= 0 && <Btn kind="soft" icon="checkmark-done" title="Bu Haftanın Hepsine Katıldım" onPress={allPresent} style={{ marginTop: 8 }} />}
  </Screen>;
}

function Settings({ state, update, onChangeUni, openCourse }) {
  const [adding, setAdding] = useState(false);
  const [dt, setDt] = useState(''), [weekView, setWeekView] = useState(false);
  const set = (k, v) => update(s => ({ ...s, settings: { ...s.settings, [k]: v } }));
  const Row = ({ icon, label, onPress, right }) => <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
    <Ionicons name={icon} size={20} color={C.pri} /><Text style={{ marginLeft: 12, flex: 1, color: C.ink, fontSize: 16 }}>{label}</Text>{right}</TouchableOpacity>;
  const setHere = async () => { try { const p = await getPosition(); update(s => ({ ...s, uni: { ...s.uni, lat: p.latitude, lng: p.longitude } })); Alert.alert('Kaydedildi', 'Üniversite konumu şu anki konumun olarak ayarlandı.'); } catch (e) { Alert.alert('Konum alınamadı', locError(e)); } };
  const del = c => Alert.alert('Ders silinsin mi?', c.name, [{ text: 'Vazgeç' }, { text: 'Sil', style: 'destructive', onPress: () => update(s => ({ ...s, courses: s.courses.filter(x => x.id !== c.id) })) }]);
  const saveStart = () => { const k = parseDate(dt); if (!k) return Alert.alert('Tarih hatalı', 'GG.AA.YYYY biçiminde, geçmiş bir tarih yaz (örn. 15.09.2026).'); set('semStart', k); setDt(''); Alert.alert('Kaydedildi', 'Geçmişte hepsine katıldıysan "Hepsine Katıldım", bazılarına katıldıysan "Sadece Bu Derslere Katıldım" butonunu kullan.'); };
  const markPast = () => Alert.alert('Geçmiş dersler', 'Dönem başından bugüne kaydı olmayan tüm dersler "katıldı" yapılsın mı? Sonra ders detayından tek tek düzeltebilirsin.', [{ text: 'Vazgeç' }, { text: 'Evet, hepsine katıldım', onPress: () => update(st => backfillPast(st)) }]);
  const setMax = (c, v) => update(st => ({ ...st, courses: st.courses.map(x => x.id === c.id ? { ...x, maxAbs: v } : x) }));
  const lim = state.settings.limit || 30, wk = state.settings.weeks || 14;
  if (weekView) return <WeekEditor state={state} update={update} back={() => setWeekView(false)} />;
  if (adding) return <Screen><Back onPress={() => setAdding(false)} /><H1>Yeni Ders</H1><CourseForm onSave={c => { update(s => ({ ...s, courses: [...s.courses, c] })); setAdding(false); }} onCancel={() => setAdding(false)} /></Screen>;
  return <Screen><H1>Ayarlar</H1>
    <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: C.pri, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{(state.profile?.ad?.[0] || '?') + (state.profile?.soyad?.[0] || '')}</Text></View>
      <View style={{ marginLeft: 14, flex: 1 }}><Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{state.profile?.ad} {state.profile?.soyad}</Text><Sub>{state.profile?.bolum} · {state.profile?.sinif === 'Hazırlık' ? 'Hazırlık' : `${state.profile?.sinif}. sınıf`}</Sub></View>
      <TouchableOpacity onPress={onChangeUni}><Text style={{ color: C.pri, fontWeight: '700' }}>Düzenle</Text></TouchableOpacity></Card>
    <Card><Row icon="school" label={state.uni?.name || 'Üniversite'} onPress={onChangeUni} right={<Text style={{ color: C.pri }}>Değiştir</Text>} />
      <Row icon="add-circle" label="Yeni ders ekle" onPress={() => setAdding(true)} /></Card>
    <Card><Text style={{ fontWeight: '700', color: C.ink }}>Konum</Text>
      <Row icon="locate" label="Üniversite konumunu şu an bulunduğum yer yap" onPress={setHere} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
        <Text style={{ color: C.ink }}>Yarıçap: {state.settings.radius} m</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}><Btn kind="soft" title="−50" onPress={() => set('radius', Math.max(50, state.settings.radius - 50))} style={{ paddingVertical: 8 }} /><Btn kind="soft" title="+50" onPress={() => set('radius', Math.min(1000, state.settings.radius + 50))} style={{ paddingVertical: 8 }} /></View></View></Card>
    <Card><Text style={{ fontWeight: '700', color: C.ink, marginBottom: 4 }}>📅 Dönem ve devamsızlık</Text>
      <Sub style={{ marginBottom: 10 }}>Başlangıç: {state.settings.semStart ? fmtDate(state.settings.semStart) : 'ayarlanmadı (ders eklediğin gün)'}</Sub>
      <Input placeholder="Dönem başlangıcı (GG.AA.YYYY)" value={dt} onChangeText={setDt} keyboardType="numbers-and-punctuation" />
      <Btn kind="soft" title="Başlangıç tarihini kaydet" onPress={saveStart} />
      <Btn kind="soft" icon="checkmark-done" title="Hepsine Katıldım" onPress={markPast} style={{ marginTop: 8 }} />
      <Btn kind="soft" icon="calendar" title="Sadece Bu Derslere Katıldım" onPress={() => setWeekView(true)} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}><Text style={{ color: C.ink }}>Devamsızlık sınırı: %{lim}</Text><View style={{ flexDirection: 'row', gap: 8 }}><Btn kind="soft" title="−5" onPress={() => set('limit', Math.max(5, lim - 5))} style={{ paddingVertical: 8 }} /><Btn kind="soft" title="+5" onPress={() => set('limit', Math.min(60, lim + 5))} style={{ paddingVertical: 8 }} /></View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}><Text style={{ color: C.ink }}>Dönem uzunluğu: {wk} hafta</Text><View style={{ flexDirection: 'row', gap: 8 }}><Btn kind="soft" title="−1" onPress={() => set('weeks', Math.max(4, wk - 1))} style={{ paddingVertical: 8 }} /><Btn kind="soft" title="+1" onPress={() => set('weeks', Math.min(20, wk + 1))} style={{ paddingVertical: 8 }} /></View></View></Card>
    <Card><Text style={{ fontWeight: '700', color: C.ink, marginBottom: 10 }}>🎨 Görünüm</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[['light', 'Açık', 'sunny'], ['dark', 'Koyu', 'moon'], ['auto', 'Otomatik', 'phone-portrait']].map(([k, l, ic]) => { const on = (state.settings.theme || 'auto') === k; return <TouchableOpacity key={k} onPress={() => set('theme', k)} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: on ? C.pri : C.bg, borderWidth: 1, borderColor: on ? C.pri : C.line }}><Ionicons name={ic} size={20} color={on ? '#fff' : C.mute} /><Text style={{ color: on ? '#fff' : C.ink, fontWeight: '700', marginTop: 4, fontSize: 12 }}>{l}</Text></TouchableOpacity>; })}
      </View>
      <Text style={{ color: C.mute, marginBottom: 8 }}>Vurgu rengi</Text>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>{ACCENTS.map(a => { const on = (state.settings.accent || ACCENTS[0]) === a; return <TouchableOpacity key={a} onPress={() => set('accent', a)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: a, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 3 : 0, borderColor: C.ink }}>{on && <Ionicons name="checkmark" size={18} color="#fff" />}</TouchableOpacity>; })}</View>
      <Text style={{ color: C.mute, marginTop: 12, fontSize: 12 }}>Harita gündüz (06:00–19:00) açık, akşam koyu görünür.</Text></Card>
    <Card><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: C.ink, fontSize: 16 }}>🔔 Ders hatırlatmaları (15 dk önce)</Text><Switch value={state.settings.notif} onValueChange={v => set('notif', v)} trackColor={{ true: C.pri }} /></View></Card>
    <Card><Text style={{ fontWeight: '700', color: C.ink, marginBottom: 4 }}>Dersleri düzenle</Text>
      {state.courses.map(c => { const sa = stats(c, state.records, cfgOf(state)).allowed, none = sa == null, al = none ? 7 : sa; return <View key={c.id}>
        <Row icon="book" label={`${c.name} · ${DAYS[c.day].slice(0, 3)} ${c.start}`} onPress={() => openCourse(c.id)} right={<TouchableOpacity onPress={() => del(c)}><Ionicons name="trash" size={20} color={C.bad} /></TouchableOpacity>} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ color: C.mute }}>{none ? 'Devamsızlık Sınırı Yok' : `Devamsızlık hakkı: ${al} ders`}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><Btn kind="soft" title="−" onPress={() => setMax(c, none ? 6 : Math.max(0, al - 1))} style={{ paddingVertical: 6, paddingHorizontal: 16 }} /><Btn kind="soft" title="+" onPress={() => setMax(c, al >= 6 ? 'none' : al + 1)} style={{ paddingVertical: 6, paddingHorizontal: 16 }} /></View></View></View>; })}</Card>
    <Btn kind="bad" title="Verileri Sıfırla" icon="warning" onPress={() => Alert.alert('Tüm veriler silinsin mi?', 'Bu işlem geri alınamaz.', [{ text: 'Vazgeç' }, { text: 'Sıfırla', style: 'destructive', onPress: async () => { await store.clear(); update(() => initial); } }])} />
  </Screen>;
}

/* ---------- Uygulama ---------- */
const TABS = [['home', 'Ana Sayfa', 'home'], ['courses', 'Dersler', 'book'], ['calendar', 'Takvim', 'calendar'], ['attend', 'Devam', 'stats-chart'], ['settings', 'Ayarlar', 'settings']];

export default function App() {
  const scheme = useColorScheme();
  const [state, setState] = useState(null), [tab, setTab] = useState('home'), [detail, setDetail] = useState(null), [changingUni, setChangingUni] = useState(false);
  useEffect(() => { store.load().then(s => setState(s ? normNames(s) : initial)); }, []);
  const update = useCallback(fn => setState(prev => { const next = fn(prev); store.save(next); return next; }), []);
  useEffect(() => { if (state?.setupDone) scheduleReminders(state.courses, state.settings.notif); }, [state?.courses, state?.settings?.notif, state?.setupDone]);

  useEffect(() => { const h = BackHandler.addEventListener('hardwareBackPress', () => { if (detail) { setDetail(null); return true; } if (changingUni) { setChangingUni(false); return true; } if (tab !== 'home') { setTab('home'); return true; } return false; }); return () => h.remove(); }, [detail, tab, changingUni]);
  if (!state) return null;
  const mode = state.settings.theme || 'auto', dark = mode === 'dark' || (mode === 'auto' && scheme === 'dark');
  applyTheme(dark, state.settings.accent || '#4F46E5');
  const wrap = c => <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />{c}</SafeAreaView></SafeAreaProvider>;
  if (!state.uni || !state.profile || changingUni) return wrap(<UniStep initial={state.profile} onBack={state.uni && state.profile ? () => setChangingUni(false) : undefined} onPick={(u, p) => { update(s => ({ ...s, uni: u, profile: p })); setChangingUni(false); }} />);
  if (!state.setupDone) return wrap(<ScheduleStep onBack={() => setChangingUni(true)} courses={state.courses} onAdd={c => update(s => ({ ...s, courses: [...s.courses, c] }))} onFinish={o => update(s => { const n = { ...s, setupDone: true, settings: { ...s.settings, semStart: o?.start || s.settings.semStart || null } }; return o?.past ? backfillPast(n) : n; })} />);

  const course = state.courses.find(c => c.id === detail);
  const open = id => setDetail(id);
  return wrap(<>
    <View style={{ flex: 1 }}>
      {detail ? <Detail course={course} state={state} update={update} back={() => setDetail(null)} /> :
        tab === 'home' ? <Home state={state} update={update} openCourse={open} /> :
        tab === 'courses' ? <Courses state={state} openCourse={open} /> :
        tab === 'calendar' ? <Calendar state={state} openCourse={open} /> :
        tab === 'attend' ? <Courses state={state} openCourse={open} title="Devamsızlık Takibi" /> :
        <Settings state={state} update={update} onChangeUni={() => setChangingUni(true)} openCourse={open} />}
    </View>
    <View style={{ flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line, paddingBottom: Platform.OS === 'ios' ? 18 : 6, paddingTop: 8 }}>
      {TABS.map(([k, label, icon]) => { const on = tab === k && !detail; return <TouchableOpacity key={k} onPress={() => { setDetail(null); setTab(k); }} style={{ flex: 1, alignItems: 'center' }}>
        <Ionicons name={on ? icon : icon + '-outline'} size={22} color={on ? C.pri : C.mute} /><Text style={{ fontSize: 11, marginTop: 2, color: on ? C.pri : C.mute, fontWeight: on ? '700' : '500' }}>{label}</Text></TouchableOpacity>; })}
    </View>
  </>);
}