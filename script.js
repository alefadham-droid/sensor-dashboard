async function loadSensorData() {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const tableElement = document.getElementById('sensor-table');
    const tableBody = document.getElementById('table-body');
    
    try {
        // روش 1: اگر فایل در همان GitHub Pages قرار دارد
        // const response = await fetch('data/sensor-data.json');
        
        // روش 2: استفاده از CORS proxy ساده
        const githubRawUrl = 'https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json';
        const proxyUrl = 'https://api.codetabs.com/v1/proxy/?quest=';
        const response = await fetch(proxyUrl + githubRawUrl);
        
        // روش 3: بدون proxy (ممکن است کار نکند به خاطر CORS)
        // const response = await fetch(githubRawUrl);
        
        if (!response.ok) {
            // اگر با proxy خطا داشت، سعی کن مستقیم از GitHub Pages بخوانیم
            const fallbackResponse = await fetch('https://alefadham-droid.github.io/sensor-dashboard/data/sensor-data.json');
            if (!fallbackResponse.ok) {
                throw new Error(`خطا در دریافت داده‌ها: ${response.status}`);
            }
            const sensorData = await fallbackResponse.json();
            processSensorData(sensorData);
            return;
        }
        
        const sensorData = await response.json();
        processSensorData(sensorData);
        
    } catch (error) {
        console.error('خطا در بارگذاری داده‌ها:', error);
        
        // نمایش پیام خطا
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> 
            <div>خطا در بارگذاری داده‌ها</div>
            <div style="font-size: 0.9rem; margin-top: 10px; color: #666;">
                ${error.message}<br>
                لطفاً اتصال اینترنت خود را بررسی کنید.
            </div>
            <button onclick="retryLoad()" style="
                margin-top: 15px;
                padding: 8px 20px;
                background: var(--secondary-color);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">
                <i class="fas fa-redo"></i> تلاش مجدد
            </button>
        `;
    }
}

// تابع جداگانه برای پردازش داده‌ها
function processSensorData(sensorData) {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const tableElement = document.getElementById('sensor-table');
    const tableBody = document.getElementById('table-body');
    
    // مخفی کردن عنصر loading و خطا
    loadingElement.style.display = 'none';
    errorElement.style.display = 'none';
    
    // نمایش جدول
    tableElement.style.display = 'table';
    
    // پاک کردن محتوای قبلی جدول
    tableBody.innerHTML = '';
    
    // محاسبه اطلاعات آماری
    const recordCount = sensorData.length;
    const avgTemperature = calculateAverage(sensorData, 'temperature');
    const avgHumidity = calculateAverage(sensorData, 'humidity');
    
    // به‌روزرسانی اطلاعات سنسور
    document.getElementById('record-count').textContent = recordCount + ' رکورد';
    document.getElementById('avg-temperature').textContent = avgTemperature + ' °C';
    document.getElementById('avg-humidity').textContent = avgHumidity + ' %';
    
    // اضافه کردن ردیف‌ها به جدول
    sensorData.forEach((item, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="timestamp-cell">${formatTimestamp(item.timestamp)}</td>
            <td class="temperature-cell">${item.temperature} °C</td>
            <td class="humidity-cell">${item.humidity} %</td>
            <td>${item.sensor}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // به‌روزرسانی زمان آخرین بروزرسانی
    const now = new Date();
    const updateTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    document.getElementById('last-update-time').textContent = `آخرین به‌روزرسانی: ${updateTime}`;
}

// تابع برای تلاش مجدد
function retryLoad() {
    document.getElementById('error').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    loadSensorData();
}
