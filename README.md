# 📊 ESP32 Sensor Dashboard

داشبورد Real-Time برای نمایش داده‌های سنسور ESP32 + AHT20

## ✨ ویژگی‌ها
- ✅ نمایش Real-Time دما و رطوبت
- ✅ نمودار تغییرات
- ✅ ساعت تهران
- ✅ ذخیره 50 رکورد آخر
- ✅ به‌روزرسانی هر 30 ثانیه

## 🛠️ سخت‌افزار
- ESP32 Dev Board
- سنسور AHT20
- اتصال SDA -> GPIO21, SCL -> GPIO22

## 📁 فایل‌ها
- `data/sensor-data.json` - داده‌های سنسور (آرایه JSON)
- `data/cors.json` - تنظیمات CORS
- `index.html` - داشبورد اصلی

## 🔗 لینک‌ها
- 🌐 داشبورد: https://alefadham-droid.github.io/sensor-dashboard/
- 📊 داده‌ها: https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json
- ⚙️ CORS: https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/cors.json

## 📊 فرمت داده
```json
[
  {
    "id": 1,
    "timestamp": "14:30:25",
    "unix_time": 1678962625,
    "temperature": 24.5,
    "humidity": 55.2,
    "sensor": "AHT20",
    "device": "ESP32"
  },
  // ... تا 50 رکورد
]
