// ============================================
// Smart Monitor Dashboard - Fixed CORS Issue
// ============================================

// تنظیمات
const CONFIG = {
    // استفاده از پروکسی برای حل مشکل CORS
    DATA_URL: 'https://api.allorigins.win/raw?url=' + 
        encodeURIComponent('https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json'),
    DASHBOARD_URL: 'https://alefadham-droid.github.io/sensor-dashboard/',
    REFRESH_INTERVAL: 30000,
    ITEMS_PER_PAGE: 10
};

// متغیرهای سراسری
let temperatureChart = null;
let humidityChart = null;
let allSensorData = [];
let currentPage = 1;

// شروع برنامه
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 داشبورد شروع شد');
    initializeDashboard();
});

// تنظیمات اولیه
function initializeDashboard() {
    // بارگذاری اولیه
    loadSensorData();
    
    // تنظیم رفرش خودکار
    setInterval(loadSensorData, CONFIG.REFRESH_INTERVAL);
    
    // راه‌اندازی نمودارها
    initializeCharts();
    
    // دکمه رفرش
    document.getElementById('refreshDataBtn').addEventListener('click', loadSensorData);
    
    console.log('✅ داشبورد آماده است');
}

// بارگذاری داده
async function loadSensorData() {
    try {
        console.log('📥 در حال بارگذاری داده...');
        updateStatus('در حال بارگذاری...', 'loading');
        
        const response = await fetch(CONFIG.DATA_URL + '&t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`خطا: ${response.status}`);
        }
        
        const data = await response.json();
        allSensorData = data;
        
        // بروزرسانی UI
        updateUI(data);
        
        updateStatus('متصل ✅', 'success');
        console.log(`✅ ${data.length} رکورد بارگذاری شد`);
        
    } catch (error) {
        console.error('❌ خطا:', error);
        updateStatus('خطا در اتصال ❌', 'error');
        showError(error.message);
    }
}

// بروزرسانی UI
function updateUI(data) {
    if (data.length === 0) {
        showNoData();
        return;
    }
    
    // آخرین داده
    const latest = data[data.length - 1];
    
    // دما
    document.getElementById('currentTemperature').textContent = 
        latest.temperature ? latest.temperature.toFixed(1) : '--';
    
    // رطوبت
    document.getElementById('currentHumidity').textContent = 
        latest.humidity ? latest.humidity.toFixed(1) : '--';
    
    // زمان
    document.getElementById('lastUpdateTime').textContent = 
        new Date().toLocaleTimeString('fa-IR');
    
    // بروزرسانی نمودارها
    updateCharts(data);
    
    // بروزرسانی جدول
    updateTable(data);
    
    // تعداد رکوردها
    document.getElementById('recordCount').textContent = data.length;
    document.getElementById('totalRecords').textContent = data.length;
}

// راه‌اندازی نمودارها
function initializeCharts() {
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    const humCtx = document.getElementById('humidityChart').getContext('2d');
    
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: { labels: [], datasets: [{
            label: 'دما (°C)',
            data: [],
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]},
        options: getChartOptions('دما (°C)', '#ff6b6b')
    });
    
    humidityChart = new Chart(humCtx, {
        type: 'line',
        data: { labels: [], datasets: [{
            label: 'رطوبت (%)',
            data: [],
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]},
        options: getChartOptions('رطوبت (%)', '#4ecdc4')
    });
}

// بروزرسانی نمودارها
function updateCharts(data) {
    const labels = data.map(item => 
        item.timestamp ? formatTime(item.timestamp) : ''
    );
    
    const temps = data.map(item => item.temperature || 0);
    const hums = data.map(item => item.humidity || 0);
    
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temps;
    temperatureChart.update('none');
    
    humidityChart.data.labels = labels;
    humidityChart.data.datasets[0].data = hums;
    humidityChart.update('none');
}

// بروزرسانی جدول
function updateTable(data) {
    const tableBody = document.getElementById('dataTableBody');
    const displayData = [...data].reverse().slice(0, 10); // 10 مورد آخر
    
    let html = '';
    
    displayData.forEach(item => {
        html += `
            <tr>
                <td>${formatDate(item.timestamp)}</td>
                <td>${formatTime(item.timestamp)}</td>
                <td><span class="temp-badge">${item.temperature?.toFixed(1) || '--'}°C</span></td>
                <td><span class="hum-badge">${item.humidity?.toFixed(1) || '--'}%</span></td>
                <td>${getTimeAgo(item.timestamp)}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html || '<tr><td colspan="5">داده‌ای یافت نشد</td></tr>';
}

// توابع کمکی
function formatTime(timestamp) {
    if (!timestamp) return '--:--';
    return new Date(timestamp * 1000).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(timestamp) {
    if (!timestamp) return '--/--/--';
    return new Date(timestamp * 1000).toLocaleDateString('fa-IR');
}

function getTimeAgo(timestamp) {
    if (!timestamp) return '--';
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return 'همین الان';
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
}

function updateStatus(text, type) {
    const statusEl = document.getElementById('statusText');
    const dotEl = document.querySelector('.status-dot');
    
    statusEl.textContent = text;
    
    dotEl.className = 'status-dot';
    if (type === 'success') dotEl.classList.add('connected');
    if (type === 'error') dotEl.classList.add('error');
}

function showError(message) {
    document.getElementById('dataTableBody').innerHTML = `
        <tr>
            <td colspan="5" class="error-cell">
                <i class="fas fa-exclamation-triangle"></i>
                <div>${message}</div>
            </td>
        </tr>
    `;
}

function showNoData() {
    document.getElementById('currentTemperature').textContent = '--';
    document.getElementById('currentHumidity').textContent = '--';
    document.getElementById('dataTableBody').innerHTML = `
        <tr>
            <td colspan="5" class="loading-cell">
                <i class="fas fa-database"></i>
                داده‌ای برای نمایش وجود ندارد
            </td>
        </tr>
    `;
}

function getChartOptions(title, color) {
    return {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { 
                ticks: { font: { family: 'Vazirmatn, Vazir' } },
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

// استایل‌های داینامیک
const style = document.createElement('style');
style.textContent = `
    .temp-badge {
        background: rgba(255,107,107,0.1);
        color: #ff6b6b;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
        border: 1px solid rgba(255,107,107,0.3);
    }
    .hum-badge {
        background: rgba(78,205,196,0.1);
        color: #4ecdc4;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
        border: 1px solid rgba(78,205,196,0.3);
    }
    .error-cell {
        color: #e63946;
        text-align: center;
        padding: 2rem !important;
    }
    .loading-cell {
        text-align: center;
        color: #718096;
        padding: 2rem !important;
    }
    .status-dot.connected { background: #4ecdc4; }
    .status-dot.error { background: #ff6b6b; animation: blink 1s infinite; }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
`;
document.head.appendChild(style);
