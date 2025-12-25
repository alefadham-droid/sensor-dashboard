// آدرس فایل داده‌ها - این آدرس را بعداً باید تغییر دهید
let DATA_URL = '';
let tempChart = null;
let humChart = null;
let lastData = [];
let updateInterval;

// تنظیمات اولیه
function initializeDashboard() {
    // تنظیم آدرس داده‌ها بر اساس نام کاربری
  // تنظیمات اولیه
function initializeDashboard() {
    // تنظیم آدرس داده‌ها - نسخه بهبود یافته
    let username = 'alefadham-droid'; // مقدار ثابت بگذارید
    const hostParts = window.location.hostname.split('.');
    
    // اگر روی GitHub Pages هستیم
    if (hostParts.length >= 3 && hostParts[1] === 'github') {
        username = hostParts[0];
    }
    
    const repoName = 'sensor-dashboard';
    DATA_URL = `https://raw.githubusercontent.com/${username}/${repoName}/main/data/sensor-data.json`;
    
    // بقیه کدها...
    // نمایش آدرس داشبورد
    document.getElementById('dashboardUrl').textContent = 
        'https://alefadham-droid.github.io/sensor-dashboard/';
    
    // لینک مخزن
    document.getElementById('repoLink').href = 
        'https://github.com/alefadham-droid/sensor-dashboard';
    
    // بقیه کدها بدون تغییر...
    
    // نمایش آدرس داشبورد
    document.getElementById('dashboardUrl').textContent = 
        `https://${username}.github.io/${repoName}/`;
    
    // لینک مخزن
    document.getElementById('repoLink').href = 
        `https://github.com/${username}/${repoName}`;
    
    // بارگذاری اولیه داده‌ها
    loadSensorData();
    
    // تنظیم رفرش خودکار
    updateInterval = setInterval(loadSensorData, 30000);
    
    // رفرش دستی با کلیک
    document.querySelector('.refresh-btn').addEventListener('click', function() {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بارگذاری...';
        loadSensorData();
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-redo"></i> رفرش داده‌ها';
        }, 1000);
    });
}

// بارگذاری داده‌ها از GitHub
async function loadSensorData() {
    try {
        updateConnectionStatus('در حال بارگذاری...', 'loading');
        
        // افزودن timestamp برای جلوگیری از کش
        const timestamp = new Date().getTime();
        const response = await fetch(`${DATA_URL}?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`خطا در دریافت داده‌ها: ${response.status}`);
        }
        
        const data = await response.json();
        lastData = data;
        
        updateDashboard(data);
        updateCharts(data);
        updateTable(data);
        updateConnectionStatus('متصل ✅', 'online');
        
        // به‌روزرسانی زمان
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = 
            now.toLocaleTimeString('fa-IR');
        document.getElementById('refreshTime').textContent = 
            now.toLocaleTimeString('fa-IR');
            
    } catch (error) {
        console.error('خطا در بارگذاری داده‌ها:', error);
        updateConnectionStatus('قطع ارتباط ❌', 'offline');
        
        // نمایش پیغام خطا
        document.getElementById('tableBody').innerHTML = `
            <tr class="error-row">
                <td colspan="4">
                    <i class="fas fa-exclamation-triangle"></i>
                    خطا در بارگذاری داده‌ها: ${error.message}
                </td>
            </tr>
        `;
    }
}

// به‌روزرسانی وضعیت اتصال
function updateConnectionStatus(text, status) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = text;
    statusElement.className = `status-${status}`;
    statusElement.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
}

// به‌روزرسانی بخش آمار
function updateDashboard(data) {
    if (data.length > 0) {
        const latest = data[data.length - 1];
        
        // دما
        const tempElement = document.getElementById('currentTemp');
        const tempValue = latest.temperature.toFixed(1);
        tempElement.textContent = tempValue;
        tempElement.style.fontSize = '4rem';
        
        // رطوبت
        const humElement = document.getElementById('currentHum');
        const humValue = latest.humidity.toFixed(1);
        humElement.textContent = humValue;
        humElement.style.fontSize = '4rem';
        
        // زمان آخرین بروزرسانی
        const timeElement = document.getElementById('lastUpdate');
        if (latest.timestamp) {
            const date = new Date(latest.timestamp * 1000);
            timeElement.textContent = date.toLocaleTimeString('fa-IR');
        }
        
        // محاسبه روند تغییرات
        if (data.length > 1) {
            const prev = data[data.length - 2];
            const tempDiff = latest.temperature - prev.temperature;
            const humDiff = latest.humidity - prev.humidity;
            
            updateTrend('tempTrend', tempDiff, '°C');
            updateTrend('humTrend', humDiff, '%');
        }
    }
}

// محاسبه روند تغییرات
function updateTrend(elementId, diff, unit) {
    const element = document.getElementById(elementId);
    const icon = diff > 0 ? 'fas fa-arrow-up' : 
                 diff < 0 ? 'fas fa-arrow-down' : 
                 'fas fa-minus';
    const color = diff > 0 ? '#f72585' : 
                  diff < 0 ? '#4cc9f0' : 
                  '#6c757d';
    
    element.innerHTML = `
        <i class="${icon}" style="color: ${color}"></i>
        ${Math.abs(diff).toFixed(1)} ${unit}
    `;
}

// به‌روزرسانی نمودارها
function updateCharts(data) {
    if (data.length === 0) return;
    
    // آماده‌سازی داده‌ها
    const labels = data.map(item => {
        if (item.timestamp) {
            const date = new Date(item.timestamp * 1000);
            return date.toLocaleTimeString('fa-IR');
        }
        return '';
    });
    
    const temperatures = data.map(item => item.temperature);
    const humidities = data.map(item => item.humidity);
    
    // نمودار دما
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    
    if (!tempChart) {
        tempChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'دما (°C)',
                    data: temperatures,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Vazir'
                        },
                        bodyFont: {
                            family: 'Vazir'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Vazir'
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
                                family: 'Vazir'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        title: {
                            display: true,
                            text: 'دما (°C)',
                            font: {
                                family: 'Vazir',
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    } else {
        tempChart.data.labels = labels;
        tempChart.data.datasets[0].data = temperatures;
        tempChart.update('none');
    }
    
    // نمودار رطوبت
    const humCtx = document.getElementById('humChart').getContext('2d');
    
    if (!humChart) {
        humChart = new Chart(humCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'رطوبت (%)',
                    data: humidities,
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Vazir'
                        },
                        bodyFont: {
                            family: 'Vazir'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Vazir'
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
                                family: 'Vazir'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        title: {
                            display: true,
                            text: 'رطوبت (%)',
                            font: {
                                family: 'Vazir',
                                size: 14
                            }
                        },
                        max: 100,
                        min: 0
                    }
                }
            }
        });
    } else {
        humChart.data.labels = labels;
        humChart.data.datasets[0].data = humidities;
        humChart.update('none');
    }
}

// به‌روزرسانی جدول
function updateTable(data) {
    const tableBody = document.getElementById('tableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4">
                    <i class="fas fa-database"></i>
                    داده‌ای یافت نشد
                </td>
            </tr>
        `;
        return;
    }
    
    // نمایش 15 رکورد آخر
    const recentData = data.slice(-15).reverse();
    let tableHTML = '';
    
    recentData.forEach((item, index) => {
        const date = item.timestamp ? 
            new Date(item.timestamp * 1000) : 
            new Date();
        
        const timeAgo = getTimeAgo(item.timestamp);
        const rowClass = index % 2 === 0 ? 'even' : 'odd';
        
        tableHTML += `
            <tr class="${rowClass}">
                <td>
                    <i class="fas fa-calendar-day"></i>
                    ${date.toLocaleDateString('fa-IR')}
                    <br>
                    <small><i class="fas fa-clock"></i> ${date.toLocaleTimeString('fa-IR')}</small>
                </td>
                <td>
                    <span class="temp-badge">${item.temperature.toFixed(1)} °C</span>
                </td>
                <td>
                    <span class="hum-badge">${item.humidity.toFixed(1)} %</span>
                </td>
                <td>
                    <i class="fas fa-history"></i>
                    ${timeAgo}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHTML;
    
    // اضافه کردن استایل‌های داینامیک
    const style = document.createElement('style');
    style.textContent = `
        .temp-badge {
            background: rgba(255, 107, 107, 0.1);
            color: #ff6b6b;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: 600;
            border: 2px solid rgba(255, 107, 107, 0.3);
        }
        
        .hum-badge {
            background: rgba(78, 205, 196, 0.1);
            color: #4ecdc4;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: 600;
            border: 2px solid rgba(78, 205, 196, 0.3);
        }
        
        .even {
            background: rgba(0, 0, 0, 0.01);
        }
        
        .odd {
            background: white;
        }
        
        .error-row td {
            color: #f72585;
            text-align: center;
            padding: 40px !important;
        }
        
        .error-row i {
            margin-left: 10px;
        }
    `;
    document.head.appendChild(style);
    
    // به‌روزرسانی تعداد رکوردها
    document.getElementById('recordCount').textContent = data.length;
}

// محاسبه زمان گذشته
function getTimeAgo(timestamp) {
    if (!timestamp) return 'نامشخص';
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff} ثانیه پیش`;
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
}

// بارگذاری فونت فارسی
function loadPersianFont() {
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    document.body.style.fontFamily = 'Vazirmatn, Vazir, sans-serif';
}

// شروع برنامه
window.onload = function() {
    loadPersianFont();
    initializeDashboard();
    
    // اضافه کردن تاریخ در فوتر
    const now = new Date();
    const footer = document.querySelector('footer p');
    footer.innerHTML += ` | ${now.toLocaleDateString('fa-IR')}`;
};
