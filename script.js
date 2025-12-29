<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>📊 داشبورد سنسور ESP32</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Tahoma, sans-serif; background: #f8f9fa; padding: 15px; }
        .card { border-radius: 10px; margin-bottom: 15px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
        .temp-card { background: linear-gradient(135deg, #ff6b6b, #ffa8a8); color: white; }
        .hum-card { background: linear-gradient(135deg, #4d96ff, #6bc5ff); color: white; }
        .sensor-value { font-size: 3rem; font-weight: bold; }
    </style>
</head>
<body>
<div class="container">
    <div class="card bg-primary text-white mb-3">
        <div class="card-body text-center">
            <h1><i class="bi bi-graph-up"></i> داشبورد سنسور ESP32</h1>
            <p>داده‌های Real-Time از ESP32 + AHT20</p>
            <div>
                <span id="status" class="badge bg-warning">در حال اتصال...</span>
                <span id="lastUpdate" class="badge bg-info ms-2">--:--:--</span>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6 mb-3">
            <div class="card temp-card">
                <div class="card-body text-center">
                    <h5><i class="bi bi-thermometer-half"></i> دمای فعلی</h5>
                    <div class="sensor-value" id="tempValue">--</div>
                    <div>درجه سانتی‌گراد</div>
                </div>
            </div>
        </div>
        <div class="col-md-6 mb-3">
            <div class="card hum-card">
                <div class="card-body text-center">
                    <h5><i class="bi bi-moisture"></i> رطوبت فعلی</h5>
                    <div class="sensor-value" id="humValue">--</div>
                    <div>درصد</div>
                </div>
            </div>
        </div>
    </div>

    <div class="card mb-3">
        <div class="card-body">
            <h5><i class="bi bi-table"></i> آخرین داده</h5>
            <div id="dataTable">
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2">در حال بارگذاری...</p>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-body">
            <h5><i class="bi bi-bar-chart"></i> نمودار</h5>
            <canvas id="sensorChart" height="150"></canvas>
        </div>
    </div>
</div>

<script>
// کد ساده و مطمئن
const DATA_URL = 'https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json';

// تابع اصلی برای دریافت داده
async function fetchSensorData() {
    console.log('🔄 دریافت داده...');
    
    try {
        const timestamp = Date.now();
        const url = `${DATA_URL}?t=${timestamp}`;
        
        const response = await fetch(url);
        console.log('📡 وضعیت:', response.status);
        
        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ داده دریافت شد:', data);
        
        // پردازش و نمایش داده
        displayData(data);
        
    } catch (error) {
        console.error('❌ خطا:', error);
        document.getElementById('status').textContent = 'خطا در اتصال';
        document.getElementById('status').className = 'badge bg-danger';
        
        // نمایش داده نمونه
        showSampleData();
    }
}

// نمایش داده‌ها
function displayData(data) {
    // تبدیل به آرایه اگر آبجکت تک‌تایی است
    const dataArray = Array.isArray(data) ? data : [data];
    
    if (dataArray.length === 0) {
        console.warn('⚠️ داده‌ای موجود نیست');
        return;
    }
    
    // آخرین رکورد
    const latest = dataArray[dataArray.length - 1];
    console.log('📍 آخرین رکورد:', latest);
    
    // آپدیت UI
    document.getElementById('tempValue').textContent = latest.temperature?.toFixed(1) || '--';
    document.getElementById('humValue').textContent = latest.humidity?.toFixed(1) || '--';
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('fa-IR');
    document.getElementById('status').textContent = 'متصل';
    document.getElementById('status').className = 'badge bg-success';
    
    // آپدیت جدول
    updateTable(dataArray.slice(-5).reverse());
    
    // آپدیت نمودار (اگر نمودار وجود دارد)
    if (window.sensorChart) {
        updateChart(dataArray);
    }
}

// آپدیت جدول
function updateTable(dataArray) {
    let html = '<table class="table table-sm"><thead><tr><th>زمان</th><th>دما</th><th>رطوبت</th></tr></thead><tbody>';
    
    dataArray.forEach(item => {
        html += `
            <tr>
                <td>${item.timestamp || '--:--:--'}</td>
                <td>${item.temperature?.toFixed(1) || '--'}°C</td>
                <td>${item.humidity?.toFixed(1) || '--'}%</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    document.getElementById('dataTable').innerHTML = html;
}

// داده نمونه
function showSampleData() {
    const sampleData = [{
        id: 1,
        timestamp: new Date().toLocaleTimeString('fa-IR').slice(0, 8),
        temperature: 24.5,
        humidity: 55.0,
        sensor: "AHT20",
        device: "ESP32"
    }];
    
    displayData(sampleData);
    document.getElementById('dataTable').innerHTML = 
        '<div class="alert alert-warning">داده نمونه (اتصال برقرار نشد)</div>' +
        '<table class="table table-sm"><tr><td>' + sampleData[0].timestamp + '</td><td>24.5°C</td><td>55.0%</td></tr></table>';
}

// راه‌اندازی نمودار
function initChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    window.sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1', '2', '3', '4', '5'],
            datasets: [{
                label: 'دما (°C)',
                data: [24, 25, 24.5, 25.5, 24.8],
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { font: { family: 'Tahoma' } } }
            }
        }
    });
}

// آپدیت نمودار
function updateChart(dataArray) {
    const temps = dataArray.map(d => d.temperature || 0).slice(-10);
    const labels = dataArray.map((d, i) => `رکورد ${i + 1}`).slice(-10);
    
    window.sensorChart.data.labels = labels;
    window.sensorChart.data.datasets[0].data = temps;
    window.sensorChart.update();
}

// شروع کار
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 داشبورد راه‌اندازی شد');
    console.log('📁 داده‌ها:', DATA_URL);
    
    initChart();
    fetchSensorData();
    
    // آپدیت خودکار هر 10 ثانیه
    setInterval(fetchSensorData, 10000);
    
    // کلید R برای refresh دستی
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            fetchSensorData();
            console.log('🔄 بارگذاری دستی...');
        }
    });
});
</script>
</body>
</html>
