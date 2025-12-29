<script>
class SensorDashboard {
    constructor() {
        this.dataUrl = 'https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json';
        this.dataHistory = [];  // تاریخچه محلی داده‌ها
        this.chart = null;
        this.updateInterval = null;
        this.retryCount = 0;
        this.totalRecords = 0;
        this.lastDataTime = null;
        
        this.init();
    }

    init() {
        console.log('🚀 راه‌اندازی داشبورد...');
        this.initChart();
        this.setupEventListeners();
        this.updateStatus('در حال راه‌اندازی...', 'warning');
        this.startAutoUpdate();
    }

    async fetchData() {
        try {
            // جلوگیری از کش
            const timestamp = Date.now();
            const url = `${this.dataUrl}?t=${timestamp}`;
            
            console.log(`📡 دریافت داده از: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const jsonData = await response.json();
            console.log('✅ داده دریافت شد (نوع):', Array.isArray(jsonData) ? 'آرایه' : 'آبجکت');
            
            // پردازش داده
            this.processData(jsonData);
            this.retryCount = 0;
            this.updateStatus('متصل', 'success');
            
        } catch (error) {
            console.error('❌ خطا در دریافت داده:', error);
            this.retryCount++;
            
            if (this.retryCount > 3) {
                this.updateStatus('خطا در اتصال', 'danger');
                this.showSampleData();
            } else {
                this.updateStatus(`تلاش مجدد (${this.retryCount}/3)`, 'warning');
            }
        }
    }

    processData(data) {
        // تبدیل به آرایه اگر آبجکت تک‌تایی است
        let dataArray = [];
        
        if (Array.isArray(data)) {
            dataArray = data;
            console.log(`📊 دریافت آرایه با ${data.length} رکورد`);
        } else if (data && typeof data === 'object') {
            dataArray = [data];
            console.log('📊 دریافت آبجکت تک‌تایی، تبدیل به آرایه');
        } else {
            console.warn('⚠️ فرمت داده نامعتبر:', data);
            return;
        }
        
        if (dataArray.length === 0) {
            console.warn('⚠️ داده‌ای برای پردازش وجود ندارد');
            return;
        }
        
        // اضافه کردن به تاریخچه محلی
        dataArray.forEach(item => {
            // فقط اگر رکورد جدید است اضافه کن
            if (!this.dataHistory.find(d => d.id === item.id)) {
                this.dataHistory.push(item);
                this.totalRecords++;
            }
        });
        
        // محدود کردن تاریخچه به 50 رکورد
        if (this.dataHistory.length > 50) {
            this.dataHistory = this.dataHistory.slice(-50);
        }
        
        // آخرین رکورد
        const latest = dataArray[dataArray.length - 1];
        console.log('📍 آخرین رکورد:', latest);
        
        // آپدیت مقادیر فعلی
        this.updateCurrentValues(latest);
        
        // آپدیت جدول (آخرین 8 رکورد)
        const recentData = this.dataHistory.slice(-8).reverse();
        this.updateTable(recentData);
        
        // آپدیت نمودار
        this.updateChart();
        
        // آپدیت آمار
        this.updateStats();
        
        // ذخیره زمان آخرین آپدیت
        this.lastDataTime = new Date();
    }

    updateCurrentValues(latest) {
        // دما
        if (latest.temperature !== undefined && latest.temperature !== null) {
            document.getElementById('tempValue').textContent = latest.temperature.toFixed(1);
        } else {
            document.getElementById('tempValue').textContent = '--';
        }
        
        // رطوبت
        if (latest.humidity !== undefined && latest.humidity !== null) {
            document.getElementById('humValue').textContent = latest.humidity.toFixed(1);
        } else {
            document.getElementById('humValue').textContent = '--';
        }
        
        // زمان به‌روزرسانی داشبورد
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fa-IR');
        document.getElementById('updateTime').textContent = timeStr;
        
        // زمان آپدیت ESP32
        if (latest.timestamp) {
            document.getElementById('espLastUpdate').textContent = latest.timestamp;
        } else {
            document.getElementById('espLastUpdate').textContent = '--:--:--';
        }
        
        // محاسبه زمان گذشته
        if (this.lastDataTime) {
            const secondsAgo = Math.floor((now - this.lastDataTime) / 1000);
            document.getElementById('tempUpdateRate').textContent = secondsAgo;
            document.getElementById('humUpdateRate').textContent = secondsAgo;
        }
    }

    updateTable(dataArray) {
        const tableContainer = document.getElementById('dataTable');
        
        if (dataArray.length === 0) {
            tableContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        هنوز داده‌ای دریافت نشده است
                    </div>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>زمان</th>
                            <th>دما</th>
                            <th>رطوبت</th>
                            <th>شناسه</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        dataArray.forEach((item, index) => {
            // تعیین رنگ بر اساس مقدار
            const tempClass = item.temperature > 28 ? 'table-warning' : '';
            const humClass = item.humidity > 70 ? 'table-info' : '';
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.timestamp || '--:--:--'}</td>
                    <td class="${tempClass}">
                        ${item.temperature !== undefined ? item.temperature.toFixed(1) + '°C' : '--'}
                    </td>
                    <td class="${humClass}">
                        ${item.humidity !== undefined ? item.humidity.toFixed(1) + '%' : '--'}
                    </td>
                    <td><span class="badge bg-secondary">${item.id || '--'}</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        tableContainer.innerHTML = html;
    }

    initChart() {
        const ctx = document.getElementById('sensorChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'دما (°C)',
                        data: [],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'رطوبت (%)',
                        data: [],
                        borderColor: '#4d96ff',
                        backgroundColor: 'rgba(77, 150, 255, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            font: {
                                family: 'Tahoma, sans-serif',
                                size: 11
                            },
                            maxRotation: 45
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'دما (°C)',
                            font: {
                                family: 'Tahoma, sans-serif',
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        suggestedMin: 0,
                        suggestedMax: 50
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'رطوبت (%)',
                            font: {
                                family: 'Tahoma, sans-serif',
                                size: 12
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: 'Tahoma, sans-serif',
                                size: 13
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Tahoma, sans-serif'
                        },
                        bodyFont: {
                            family: 'Tahoma, sans-serif'
                        },
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateChart() {
        if (!this.chart || this.dataHistory.length === 0) {
            console.warn('⚠️ داده‌ای برای نمودار وجود ندارد');
            return;
        }
        
        // آخرین 20 رکورد برای نمودار
        const chartData = this.dataHistory.slice(-20);
        console.log(`📈 رسم نمودار با ${chartData.length} رکورد`);
        
        // برچسب‌های زمانی
        const labels = chartData.map(d => {
            if (d.timestamp) {
                // فقط ساعت و دقیقه
                return d.timestamp.split(':').slice(0, 2).join(':');
            }
            return '--:--';
        });
        
        // داده‌های دما و رطوبت
        const temps = chartData.map(d => d.temperature || 0);
        const hums = chartData.map(d => d.humidity || 0);
        
        // آپدیت نمودار
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = temps;
        this.chart.data.datasets[1].data = hums;
        
        // تنظیم min/max دینامیک
        if (temps.length > 0) {
            const minTemp = Math.min(...temps);
            const maxTemp = Math.max(...temps);
            this.chart.options.scales.y.suggestedMin = Math.floor(minTemp) - 2;
            this.chart.options.scales.y.suggestedMax = Math.ceil(maxTemp) + 2;
        }
        
        if (hums.length > 0) {
            const minHum = Math.min(...hums);
            const maxHum = Math.max(...hums);
            this.chart.options.scales.y1.suggestedMin = Math.floor(minHum) - 5;
            this.chart.options.scales.y1.suggestedMax = Math.ceil(maxHum) + 5;
        }
        
        this.chart.update('none');
        console.log('✅ نمودار آپدیت شد');
    }

    updateStats() {
        document.getElementById('dataCount').textContent = 
            `داده‌ها: ${this.dataHistory.length}`;
        
        document.getElementById('recordCount').textContent = 
            `${this.totalRecords} رکورد دریافتی`;
        
        // محاسبه نرخ آپدیت
        const rate = this.configRefreshRate || 5000;
        document.getElementById('updateRate').textContent = 
            `${(1000 / rate).toFixed(1)}/s`;
    }

    updateStatus(text, type) {
        const element = document.getElementById('status');
        element.innerHTML = `<i class="bi bi-circle-fill"></i> ${text}`;
        element.className = `badge bg-${type}`;
    }

    startAutoUpdate() {
        // بارگیری اولیه
        this.fetchData();
        
        // تنظیم بازه آپدیت
        this.configRefreshRate = 5000; // هر 5 ثانیه
        this.updateInterval = setInterval(() => {
            this.fetchData();
        }, this.configRefreshRate);
        
        this.isConnected = true;
        document.getElementById('connectBtn').innerHTML = '<i class="bi bi-plug-fill"></i> قطع';
        document.getElementById('connectBtn').className = 'btn btn-danger';
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isConnected = false;
        document.getElementById('connectBtn').innerHTML = '<i class="bi bi-plug"></i> اتصال';
        document.getElementById('connectBtn').className = 'btn btn-success';
        this.updateStatus('قطع', 'secondary');
    }

    toggleConnection() {
        if (this.isConnected) {
            this.stopAutoUpdate();
        } else {
            this.startAutoUpdate();
        }
    }

    restartAutoUpdate() {
        this.stopAutoUpdate();
        this.startAutoUpdate();
    }

    resetData() {
        if (confirm('آیا می‌خواهید داده‌های محلی پاک شوند؟')) {
            this.dataHistory = [];
            this.totalRecords = 0;
            this.updateTable([]);
            this.updateChart();
            this.updateStats();
            console.log('♻️ داده‌ها بازنشانی شدند');
        }
    }

    showSampleData() {
        const sampleData = [
            {
                id: this.totalRecords + 1,
                timestamp: new Date().toLocaleTimeString('fa-IR').slice(0, 8),
                temperature: 24.5 + Math.random() * 2,
                humidity: 55 + Math.random() * 5,
                sensor: "AHT20",
                device: "ESP32"
            }
        ];
        
        // شبیه‌سازی پردازش داده نمونه
        this.dataHistory.push(...sampleData);
        this.totalRecords += sampleData.length;
        
        const latest = sampleData[0];
        this.updateCurrentValues(latest);
        this.updateTable(sampleData);
        this.updateChart();
        this.updateStats();
        
        document.getElementById('dataTable').innerHTML = 
            '<div class="alert alert-warning">در حال نمایش داده نمونه (اتصال به سرور برقرار نشد)</div>' +
            this.generateTableHTML(sampleData);
    }

    generateTableHTML(dataArray) {
        let html = `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>زمان</th>
                            <th>دما</th>
                            <th>رطوبت</th>
                            <th>ID</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        dataArray.forEach(item => {
            html += `
                <tr>
                    <td>${item.timestamp || '--:--:--'}</td>
                    <td>${item.temperature?.toFixed(1) || '--'}°C</td>
                    <td>${item.humidity?.toFixed(1) || '--'}%</td>
                    <td><span class="badge bg-secondary">${item.id || '--'}</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        return html;
    }
}

// راه‌اندازی داشبورد
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new SensorDashboard();
    
    // اطلاعات کنسول
    console.log('📊 داشبورد Real-Time سنسور ESP32');
    console.log('📁 داده‌ها: https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json');
    console.log('🚀 سیستم آماده است!');
    
    // تست خودکار
    setTimeout(() => {
        console.log('🧪 تست سیستم...');
        dashboard.fetchData();
    }, 1000);
});

// تست مستقیم داده‌ها در کنسول
function testDataFetch() {
    fetch('https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json')
        .then(r => r.json())
        .then(data => {
            console.log('🧪 تست داده‌ها:', {
                type: Array.isArray(data) ? 'آرایه' : 'آبجکت',
                length: Array.isArray(data) ? data.length : 1,
                data: data
            });
        })
        .catch(e => console.error('❌ تست ناموفق:', e));
}

// اجرای تست بعد از 3 ثانیه
setTimeout(testDataFetch, 3000);
</script>
