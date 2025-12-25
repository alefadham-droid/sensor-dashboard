// ============================================
// Smart Monitor Dashboard - Script
// برای مخزن: alefadham-droid/sensor-dashboard
// ============================================

// تنظیمات
const CONFIG = {
    DATA_URL: 'https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json',
    DASHBOARD_URL: 'https://alefadham-droid.github.io/sensor-dashboard/',
    REPO_URL: 'https://github.com/alefadham-droid/sensor-dashboard',
    REFRESH_INTERVAL: 30000, // 30 ثانیه
    ITEMS_PER_PAGE: 10
};

// متغیرهای سراسری
let temperatureChart = null;
let humidityChart = null;
let allSensorData = [];
let currentPage = 1;
let totalPages = 1;
let autoRefreshInterval = null;
let lastUpdateTime = null;

// ===== تابع اصلی شروع =====
function initializeDashboard() {
    console.log('🚀 شروع داشبورد Smart Monitor');
    
    // تنظیم اطلاعات اولیه
    setupDashboardInfo();
    
    // راه‌اندازی نمودارها
    initializeCharts();
    
    // بارگذاری اولیه داده‌ها
    loadSensorData();
    
    // تنظیم رفرش خودکار
    setupAutoRefresh();
    
    // تنظیم کنترل‌ها
    setupEventListeners();
    
    // نمایش وضعیت
    updateStatus('✅ داشبورد آماده است', 'success');
}

// ===== تنظیم اطلاعات داشبورد =====
function setupDashboardInfo() {
    document.getElementById('dataUrl').textContent = CONFIG.DATA_URL;
    document.getElementById('dashboardLink').href = CONFIG.DASHBOARD_URL;
    document.getElementById('refreshRate').textContent = CONFIG.REFRESH_INTERVAL / 1000;
}

// ===== راه‌اندازی نمودارها =====
function initializeCharts() {
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    const humCtx = document.getElementById('humidityChart').getContext('2d');
    
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
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: getChartOptions('دما (°C)', '#ff6b6b')
    });
    
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
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: getChartOptions('رطوبت (%)', '#4ecdc4')
    });
}

// ===== بارگذاری داده از GitHub =====
async function loadSensorData() {
    try {
        updateStatus('🔄 در حال بارگذاری داده‌ها...', 'loading');
        
        // اضافه کردن timestamp برای جلوگیری از کش
        const timestamp = new Date().getTime();
        const url = `${CONFIG.DATA_URL}?t=${timestamp}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`خطا در دریافت داده‌ها (کد: ${response.status})`);
        }
        
        const data = await response.json();
        
        // بررسی ساختار داده
        if (!Array.isArray(data)) {
            throw new Error('ساختار داده نامعتبر است (آرایه مورد انتظار است)');
        }
        
        allSensorData = data;
        lastUpdateTime = new Date();
        
        // پردازش و نمایش داده‌ها
        processAndDisplayData(data);
        
        updateStatus('✅ داده‌ها با موفقیت بارگذاری شد', 'success');
        
    } catch (error) {
        console.error('❌ خطا در بارگذاری داده‌ها:', error);
        updateStatus('❌ خطا در بارگذاری داده‌ها', 'error');
        showErrorMessage(error.message);
    }
}

// ===== پردازش و نمایش داده‌ها =====
function processAndDisplayData(data) {
    if (data.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // مرتب‌سازی داده‌ها بر اساس timestamp
    data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // بروزرسانی کارت‌های آمار
    updateLiveStats(data);
    
    // بروزرسانی نمودارها
    updateCharts(data);
    
    // بروزرسانی جدول
    updateDataTable(data);
    
    // بروزرسانی اطلاعات سیستم
    updateSystemInfo(data);
}

// ===== بروزرسانی کارت‌های آمار زنده =====
function updateLiveStats(data) {
    if (data.length === 0) return;
    
    const latest = data[data.length - 1];
    
    // دما
    if (latest.temperature !== undefined) {
        const tempElement = document.getElementById('currentTemperature');
        const tempTimeElement = document.getElementById('tempTime');
        
        tempElement.textContent = latest.temperature.toFixed(1);
        tempTimeElement.textContent = formatTime(latest.timestamp);
        
        // محاسبه روند تغییرات
        if (data.length > 1) {
            const prev = data[data.length - 2];
            const diff = latest.temperature - prev.temperature;
            updateTrend('tempTrend', diff, '°C');
        }
    }
    
    // رطوبت
    if (latest.humidity !== undefined) {
        const humElement = document.getElementById('currentHumidity');
        const humTimeElement = document.getElementById('humTime');
        
        humElement.textContent = latest.humidity.toFixed(1);
        humTimeElement.textContent = formatTime(latest.timestamp);
        
        // محاسبه روند تغییرات
        if (data.length > 1) {
            const prev = data[data.length - 2];
            const diff = latest.humidity - prev.humidity;
            updateTrend('humTrend', diff, '%');
        }
    }
    
    // بروزرسانی تعداد رکوردها
    document.getElementById('recordCount').textContent = data.length;
    document.getElementById('totalRecords').textContent = data.length;
}

// ===== بروزرسانی نمودارها =====
function updateCharts(data) {
    // محدود کردن داده‌ها برای نمایش
    const displayData = data.slice(-50); // آخرین 50 رکورد
    
    // آماده‌سازی داده‌ها
    const labels = displayData.map(item => 
        item.timestamp ? formatTime(item.timestamp, true) : '--'
    );
    
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

// ===== بروزرسانی جدول داده‌ها =====
function updateDataTable(data) {
    const tableBody = document.getElementById('dataTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">
                    <i class="fas fa-database"></i>
                    داده‌ای برای نمایش وجود ندارد
                </td>
            </tr>
        `;
        return;
    }
    
    // مرتب‌سازی نزولی (جدیدترین ابتدا)
    const sortedData = [...data].reverse();
    
    // محاسبه صفحه‌بندی
    totalPages = Math.ceil(sortedData.length / CONFIG.ITEMS_PER_PAGE);
    currentPage = Math.min(currentPage, totalPages);
    
    // محاسبه رکوردهای قابل نمایش
    const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
    const pageData = sortedData.slice(startIndex, endIndex);
    
    // ایجاد ردیف‌های جدول
    let tableHTML = '';
    
    pageData.forEach((item, index) => {
        const absoluteIndex = startIndex + index + 1;
        const timeAgo = getTimeAgo(item.timestamp);
        
        tableHTML += `
            <tr>
                <td>${formatDate(item.timestamp)}</td>
                <td>${formatTime(item.timestamp)}</td>
                <td>
                    <span class="value-badge temp-badge">
                        ${item.temperature !== undefined ? item.temperature.toFixed(1) : '--'}°C
                    </span>
                </td>
                <td>
                    <span class="value-badge hum-badge">
                        ${item.humidity !== undefined ? item.humidity.toFixed(1) : '--'}%
                    </span>
                </td>
                <td>
                    <span class="time-ago">
                        <i class="far fa-clock"></i>
                        ${timeAgo}
                    </span>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHTML;
    
    // بروزرسانی کنترل‌های صفحه‌بندی
    updatePaginationControls();
    
    // بروزرسانی اطلاعات رکوردها
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('visibleRecords').textContent = pageData.length;
    document.getElementById('totalRecords').textContent = sortedData.length;
}

// ===== بروزرسانی وضعیت سیستم =====
function updateSystemInfo(data) {
    // زمان آخرین بروزرسانی
    if (lastUpdateTime) {
        const timeElement = document.getElementById('lastUpdateTime');
        const refreshElement = document.getElementById('lastRefreshTime');
        
        const timeStr = lastUpdateTime.toLocaleTimeString('fa-IR');
        timeElement.textContent = timeStr;
        refreshElement.textContent = timeStr;
    }
    
    // وضعیت سیستم
    const systemStatus = document.getElementById('systemStatus');
    const statusDot = document.querySelector('.status-dot');
    
    if (data.length > 0) {
        systemStatus.innerHTML = '<i class="fas fa-check-circle"></i> <span>سیستم فعال</span>';
        systemStatus.className = 'status-badge active';
        statusDot.className = 'status-dot connected';
        document.getElementById('statusText').textContent = 'متصل ✅';
    } else {
        systemStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>بدون داده</span>';
        systemStatus.className = 'status-badge warning';
        statusDot.className = 'status-dot';
        document.getElementById('statusText').textContent = 'بدون داده';
    }
}

// ===== توابع کمکی =====

// فرمت‌دهی زمان
function formatTime(timestamp, full = false) {
    if (!timestamp) return '--:--';
    
    const date = new Date(timestamp * 1000);
    
    if (full) {
        return date.toLocaleTimeString('fa-IR');
    }
    
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
    if (!timestamp) return 'نامشخص';
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'همین الان';
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
}

// بروزرسانی روند تغییرات
function updateTrend(elementId, diff, unit) {
    const element = document.getElementById(elementId);
    
    let icon, text, color;
    
    if (diff > 0.1) {
        icon = 'fas fa-arrow-up';
        text = `${diff.toFixed(1)} ${unit} افزایش`;
        color = '#f72585';
    } else if (diff < -0.1) {
        icon = 'fas fa-arrow-down';
        text = `${Math.abs(diff).toFixed(1)} ${unit} کاهش`;
        color = '#4cc9f0';
    } else {
        icon = 'fas fa-minus';
        text = 'بدون تغییر';
        color = '#6c757d';
    }
    
    element.innerHTML = `<i class="${icon}" style="color: ${color}"></i> <span>${text}</span>`;
}

// بروزرسانی وضعیت
function updateStatus(message, type = 'info') {
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    
    statusText.textContent = message;
    
    switch (type) {
        case 'success':
            statusDot.className = 'status-dot connected';
            break;
        case 'error':
            statusDot.className = 'status-dot error';
            break;
        case 'loading':
            statusDot.className = 'status-dot';
            break;
        default:
            statusDot.className = 'status-dot';
    }
}

// نمایش پیغام خطا
function showErrorMessage(message) {
    const tableBody = document.getElementById('dataTableBody');
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="error-cell">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>خطا در بارگذاری داده‌ها:</strong>
                    <p>${message}</p>
                    <button onclick="loadSensorData()" class="btn-action small">
                        <i class="fas fa-redo"></i>
                        تلاش مجدد
                    </button>
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
                <div>
                    <strong>داده‌ای یافت نشد</strong>
                    <p>هنوز داده‌ای از سنسور دریافت نشده است.</p>
                    <p>مطمئن شوید ESP32 به هات‌اسپات متصل است و داده ارسال می‌کند.</p>
                </div>
            </td>
        </tr>
    `;
}

// تنظیمات خودکار رفرش
function setupAutoRefresh() {
    // پاک کردن interval قبلی
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // تنظیم interval جدید
    autoRefreshInterval = setInterval(() => {
        loadSensorData();
    }, CONFIG.REFRESH_INTERVAL);
}

// تنظیم event listeners
function setupEventListeners() {
    // دکمه رفرش
    document.getElementById('refreshDataBtn').addEventListener('click', () => {
        loadSensorData();
        showToast('در حال بارگذاری داده‌های جدید...');
    });
    
    // پاک کردن کش
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('آیا از پاک کردن کش مرورگر اطمینان دارید؟')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    // کنترل‌های صفحه‌بندی
    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateDataTable(allSensorData);
        }
    });
    
    document.getElementById('nextPageBtn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateDataTable(allSensorData);
        }
    });
    
    // کنترل‌های نمودار
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        zoomChart(temperatureChart, 0.9);
        zoomChart(humidityChart, 0.9);
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        zoomChart(temperatureChart, 1.1);
        zoomChart(humidityChart, 1.1);
    });
    
    document.getElementById('resetZoomBtn').addEventListener('click', () => {
        resetZoom(temperatureChart);
        resetZoom(humidityChart);
    });
    
    // تغییر محدوده زمانی
    document.getElementById('timeRangeSelect').addEventListener('change', (e) => {
        filterDataByTimeRange(e.target.value);
    });
}

// بروزرسانی کنترل‌های صفحه‌بندی
function updatePaginationControls() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// زوم نمودار
function zoomChart(chart, factor) {
    if (chart.options.scales.x && chart.options.scales.x.min !== undefined) {
        const range = chart.options.scales.x.max - chart.options.scales.x.min;
        const center = (chart.options.scales.x.min + chart.options.scales.x.max) / 2;
        
        chart.options.scales.x.min = center - (range * factor) / 2;
        chart.options.scales.x.max = center + (range * factor) / 2;
        chart.update();
    }
}

// ریست زوم نمودار
function resetZoom(chart) {
    if (chart.options.scales.x) {
        delete chart.options.scales.x.min;
        delete chart.options.scales.x.max;
        chart.update();
    }
}

// فیلتر داده بر اساس محدوده زمانی
function filterDataByTimeRange(range) {
    const now = Math.floor(Date.now() / 1000);
    let cutoffTime;
    
    switch (range) {
        case '1h':
            cutoffTime = now - 3600;
            break;
        case '6h':
            cutoffTime = now - 21600;
            break;
        case '24h':
            cutoffTime = now - 86400;
            break;
        case '7d':
            cutoffTime = now - 604800;
            break;
        default:
            cutoffTime = 0;
    }
    
    const filteredData = allSensorData.filter(item => 
        item.timestamp && item.timestamp >= cutoffTime
    );
    
    updateCharts(filteredData);
}

// تنظیمات نمودار
function getChartOptions(title, color) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                rtl: true,
                titleFont: {
                    family: 'Vazirmatn, Vazir'
                },
                bodyFont: {
                    family: 'Vazirmatn, Vazir'
                },
                callbacks: {
                    label: function(context) {
                        return `${title.split(' ')[0]}: ${context.parsed.y.toFixed(1)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        family: 'Vazirmatn, Vazir'
                    },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            y: {
                ticks: {
                    font: {
                        family: 'Vazirmatn, Vazir'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        family: 'Vazirmatn, Vazir',
                        size: 14
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            duration: 1000
        }
    };
}

// نمایش toast
function showToast(message, type = 'info') {
    // ساخت toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // اضافه کردن به صفحه
    document.body.appendChild(toast);
    
    // نمایش با انیمیشن
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // حذف بعد از 3 ثانیه
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// باز و بسته کردن پنل اطلاعات
function togglePanel() {
    const panelContent = document.getElementById('panelContent');
    const toggleIcon = document.getElementById('panelToggleIcon');
    
    panelContent.classList.toggle('collapsed');
    toggleIcon.classList.toggle('fa-chevron-down');
    toggleIcon.classList.toggle('fa-chevron-up');
}

// ===== شروع برنامه =====
document.addEventListener('DOMContentLoaded', function() {
    // بارگذاری فونت فارسی
    const fontLink = document.createElement('link');
    fontLink.href = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // شروع داشبورد
    setTimeout(() => {
        initializeDashboard();
    }, 100);
});

// ===== استایل‌های داینامیک =====
const dynamicStyles = `
    .value-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
        display: inline-block;
    }
    
    .temp-badge {
        background: rgba(255, 107, 107, 0.1);
        color: #ff6b6b;
        border: 1px solid rgba(255, 107, 107, 0.3);
    }
    
    .hum-badge {
        background: rgba(78, 205, 196, 0.1);
        color: #4ecdc4;
        border: 1px solid rgba(78, 205, 196, 0.3);
    }
    
    .time-ago {
        color: #718096;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .error-cell {
        text-align: center;
        padding: 2rem !important;
        color: #e63946;
    }
    
    .error-cell i {
        font-size: 2rem;
        margin-bottom: 1rem;
        display: block;
    }
    
    .btn-action.small {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
        margin-top: 1rem;
    }
    
    .toast {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }
    
    .toast.show {
        transform: translateX(0);
    }
    
    .toast.success {
        border-right: 4px solid #4ecdc4;
    }
    
    .toast.info {
        border-right: 4px solid #4361ee;
    }
    
    .toast i {
        font-size: 1.2rem;
    }
    
    .toast.success i {
        color: #4ecdc4;
    }
    
    .toast.info i {
        color: #4361ee;
    }
    
    .status-badge.active {
        background: linear-gradient(135deg, #4ecdc4, #44a08d);
    }
    
    .status-badge.warning {
        background: linear-gradient(135deg, #ff9a8b, #ff6b6b);
    }
`;

// اضافه کردن استایل‌های داینامیک
const styleElement = document.createElement('style');
styleElement.textContent = dynamicStyles;
document.head.appendChild(styleElement);
