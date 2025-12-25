// ============================================
// Smart Monitor Dashboard - یکپارچه
// ============================================

// تنظیمات
const CONFIG = {
    // استفاده از پروکسی برای حل CORS
    DATA_URL: 'https://api.allorigins.win/raw?url=' + 
        encodeURIComponent('https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json'),
    
    REFRESH_INTERVAL: 30000, // 30 ثانیه
    MAX_RECORDS: 50
};

// متغیرهای سراسری
let temperatureChart = null;
let humidityChart = null;
let sensorData = [];
let refreshInterval = null;

// شروع برنامه
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 داشبورد شروع شد');
    
    // راه‌اندازی اولیه
    initializeDashboard();
});

// راه‌اندازی داشبورد
function initializeDashboard() {
    // راه‌اندازی نمودارها
    initializeCharts();
    
    // بارگذاری اولیه داده
    loadSensorData();
    
    // تنظیم رفرش خودکار
    refreshInterval = setInterval(loadSensorData, CONFIG.REFRESH_INTERVAL);
    
    // رویداد دکمه رفرش
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بارگذاری...';
        loadSensorData();
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-redo"></i> رفرش داده‌ها';
        }, 1000);
    });
    
    console.log('✅ داشبورد آماده است');
}

// راه‌اندازی نمودارها
function initializeCharts() {
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    const humCtx = document.getElementById('humidityChart').getContext('2d');
    
    // نمودار دما
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'دما (°C)',
                data: [],
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }]
        },
        options: getChartOptions('دما (°C)', '#ff6b6b')
    });
    
    // نمودار رطوبت
    humidityChart = new Chart(humCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'رطوبت (%)',
                data: [],
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }]
        },
        options: getChartOptions('رطوبت (%)', '#4ecdc4')
    });
}

// بارگذاری داده از GitHub
async function loadSensorData() {
    try {
        updateStatus('در حال بارگذاری...', 'loading');
        
        const response = await fetch(CONFIG.DATA_URL + '&t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // بررسی ساختار داده
        if (!Array.isArray(data)) {
            throw new Error('فرمت داده نامعتبر است');
        }
        
        sensorData = data;
        
        // بروزرسانی UI
        updateDashboard(data);
        
        updateStatus('متصل ✅', 'success');
        console.log(`✅ ${data.length} رکورد بارگذاری شد`);
        
    } catch (error) {
        console.error('❌ خطا در بارگذاری:', error);
        updateStatus('خطا در اتصال ❌', 'error');
        showErrorMessage(error.message);
    }
}

// بروزرسانی داشبورد
function updateDashboard(data) {
    if (data.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // مرتب‌سازی بر اساس زمان
    data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // بروزرسانی کارت‌ها
    updateCards(data);
    
    // بروزرسانی نمودارها
    updateChartsData(data);
    
    // بروزرسانی جدول
    updateTable(data);
    
    // بروزرسانی زمان
    document.getElementById('lastUpdateTime').textContent = 
        new Date().toLocaleTimeString('fa-IR');
}

// بروزرسانی کارت‌های آمار
function updateCards(data) {
    const latest = data[data.length - 1];
    
    // دما
    document.getElementById('currentTemperature').textContent = 
        latest.temperature ? latest.temperature.toFixed(1) : '--';
    
    // رطوبت
    document.getElementById('currentHumidity').textContent = 
        latest.humidity ? latest.humidity.toFixed(1) : '--';
    
    // تعداد رکوردها
    document.getElementById('recordCount').textContent = data.length;
}

// بروزرسانی داده‌های نمودار
function updateChartsData(data) {
    // محدود کردن تعداد داده‌ها برای نمایش بهتر
    const displayData = data.slice(-CONFIG.MAX_RECORDS);
    
    // ایجاد برچسب‌های زمان
    const labels = displayData.map(item => 
        item.timestamp ? formatTime(item.timestamp) : ''
    );
    
    // داده‌های دما و رطوبت
    const temperatures = displayData.map(item => item.temperature || 0);
    const humidities = displayData.map(item => item.humidity || 0);
    
    // بروزرسانی نمودار دما
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temperatures;
    temperatureChart.update('none');
    
    // بروزرسانی نمودار رطوبت
    humidityChart.data.labels = labels;
    humidityChart.data.datasets[0].data = humidities;
    humidityChart.update('none');
}

// بروزرسانی جدول
function updateTable(data) {
    const tableBody = document.getElementById('dataTableBody');
    
    // مرتب‌سازی نزولی (جدیدترین اول)
    const reversedData = [...data].reverse();
    
    // محدود کردن به 15 رکورد
    const displayData = reversedData.slice(0, 15);
    
    let tableHTML = '';
    
    displayData.forEach(item => {
        const timeAgo = getTimeAgo(item.timestamp);
        
        tableHTML += `
            <tr>
                <td>${formatDate(item.timestamp)}</td>
                <td>${formatTime(item.timestamp)}</td>
                <td>
                    <span style="
                        background: rgba(255,107,107,0.1);
                        color: #ff6b6b;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-weight: 600;
                        display: inline-block;
                    ">
                        ${item.temperature?.toFixed(1) || '--'}°C
                    </span>
                </td>
                <td>
                    <span style="
                        background: rgba(78,205,196,0.1);
                        color: #4ecdc4;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-weight: 600;
                        display: inline-block;
                    ">
                        ${item.humidity?.toFixed(1) || '--'}%
                    </span>
                </td>
                <td style="color: #718096; font-size: 0.9rem;">
                    ${timeAgo}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHTML || '<tr><td colspan="5">داده‌ای یافت نشد</td></tr>';
}

// ============ توابع کمکی ============

// فرمت‌دهی زمان
function formatTime(timestamp) {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// فرمت‌دهی تاریخ
function formatDate(timestamp) {
    if (!timestamp) return '--/--/--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fa-IR');
}

// محاسبه زمان گذشته
function getTimeAgo(timestamp) {
    if (!timestamp) return '--';
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'همین الان';
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
}

// بروزرسانی وضعیت
function updateStatus(text, type) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    
    statusText.textContent = text;
    
    // تنظیم رنگ نقطه
    statusDot.className = 'status-dot';
    if (type === 'success') {
        statusDot.classList.add('connected');
    } else if (type === 'error') {
        statusDot.style.background = '#ff6b6b';
    }
}

// نمایش پیغام خطا
function showErrorMessage(message) {
    const tableBody = document.getElementById('dataTableBody');
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="
                color: #e63946;
                text-align: center;
                padding: 40px;
            ">
                <i class="fas fa-exclamation-triangle"></i>
                <div style="margin-top: 10px;">
                    <strong>خطا در بارگذاری داده‌ها</strong>
                    <p style="margin-top: 5px; font-size: 0.9rem;">${message}</p>
                </div>
            </td>
        </tr>
    `;
}

// نمایش پیغام عدم داده
function showNoDataMessage() {
    const tableBody = document.getElementById('dataTableBody');
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-cell">
                <i class="fas fa-database"></i>
                <div style="margin-top: 10px;">
                    داده‌ای برای نمایش وجود ندارد
                    <p style="margin-top: 5px; font-size: 0.9rem; color: #718096;">
                        منتظر دریافت داده از ESP32 باشید...
                    </p>
                </div>
            </td>
        </tr>
    `;
}

// تنظیمات نمودار
function getChartOptions(title, color) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                rtl: true,
                titleFont: { family: 'Vazirmatn, Vazir' },
                bodyFont: { family: 'Vazirmatn, Vazir' }
            }
        },
        scales: {
            x: {
                ticks: {
                    font: { family: 'Vazirmatn, Vazir' },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: { color: 'rgba(0,0,0,0.05)' }
            },
            y: {
                ticks: { font: { family: 'Vazirmatn, Vazir' } },
                grid: { color: 'rgba(0,0,0,0.05)' },
                title: {
                    display: true,
                    text: title,
                    font: { family: 'Vazirmatn, Vazir', size: 14 }
                }
            }
        }
    };
}

// تست دسترسی به داده
window.testData = function() {
    fetch(CONFIG.DATA_URL)
        .then(r => r.json())
        .then(data => console.log('داده تست:', data))
        .catch(e => console.error('خطای تست:', e));
};
