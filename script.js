// تست 1: بررسی مستقیم فایل داده
fetch('https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json')
  .then(response => {
    console.log('🔍 وضعیت HTTP:', response.status, response.statusText);
    console.log('📋 هدرها:', [...response.headers.entries()]);
    return response.text();
  })
  .then(text => {
    console.log('📄 محتوای خام (۲۰۰ کاراکتر اول):', text.substring(0, 200));
    
    try {
      const data = JSON.parse(text);
      console.log('✅ JSON پارس شد!');
      console.log('📊 نوع داده:', Array.isArray(data) ? 'آرایه' : 'آبجکت');
      console.log('🔢 تعداد رکوردها:', Array.isArray(data) ? data.length : 1);
      console.log('📍 آخرین رکورد:', Array.isArray(data) ? data[data.length - 1] : data);
      
      // نمایش در UI برای تست
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1];
        document.getElementById('tempValue').textContent = latest.temperature?.toFixed(1) || '--';
        document.getElementById('humValue').textContent = latest.humidity?.toFixed(1) || '--';
        document.getElementById('espLastUpdate').textContent = latest.timestamp || '--:--:--';
        console.log('🎉 UI آپدیت شد!');
      }
    } catch (e) {
      console.error('❌ خطا در پارس JSON:', e.message);
    }
  })
  .catch(error => {
    console.error('❌ خطای شبکه:', error);
  });

// تست 2: بررسی CORS
fetch('https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/cors.json')
  .then(r => r.text())
  .then(t => console.log('🔗 CORS file:', t.substring(0, 100)))
  .catch(e => console.warn('⚠️ CORS file error:', e));
