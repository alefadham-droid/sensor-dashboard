// ============================================
// Real-Time Sensor Dashboard JavaScript
// کاملاً سازگار با ESP32 جدید
// ============================================

const CONFIG = {
    dataUrl: 'https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/sensor-data.json',
    corsUrl: 'https://raw.githubusercontent.com/alefadham-droid/sensor-dashboard/main/data/cors.json',
    refreshRate: 2000,
    maxHistory: 100,
    chartPoints: 20
};

class SensorDashboard {
    constructor() {
        this.data = [];
        this.chart = null;
        this.isConnected = false;
        this.intervalId = null;
        this.errorCount = 0;
        this.requestCount = 0;
        this.startTime = Date.now();
        
        this.init();
    }

    async init() {
        console.log('🚀 شروع داشبورد سنسور ESP32...');
        this.setupChart();
        this.setupEventListeners();
        this.updateStatus('در حال راه‌اندازی...', 'warning');
        await this.checkCORS();
        await this.loadData();
        this.startAutoRefresh();
        this.updateStatus('آماده', 'success');
        this.startUptimeCounter();
    }

    setupChart() {
        const ctx = document.getElementById('sensorChart')?.getContext('2d');
        if (!ctx) return;

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
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'رطوبت (%)',
                        data: [],
                        borderColor: '#4d96ff',
                        backgroundColor: 'rgba(77, 150, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
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
                        ticks: {
                            font: {
                                family: 'Vazir, sans-serif'
                            }
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            font: {
                                family: 'Vazir, sans-serif'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: 'Vazir, sans-serif',
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    setupEventListeners() {
        // دکمه‌های کنترل
        document.getElementById('connectBtn')?.addEventListener('click', () => this.toggleConnection());
        document.getElementById('resetBtn')?.addEventListener('click', () => this.resetData());
        
        // تنظیمات
        document.getElementById('refreshRate')?.addEventListener('change', (e) => {
            CONFIG.refreshRate = parseInt(e.target.value);
            this.restartAutoRefresh();
        });

        // کلیدهای میانبر
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') this.loadData();
            if (e.key === ' ') this.toggleConnection();
        });
    }

    async loadData() {
        this.requestCount++;
        const timestamp = Date.now();
        const url = `${CONFIG.dataUrl}?t=${timestamp}`;

        try {
            const response = await fetch(url, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const jsonData = await response.json();
            
            // تبدیل به آرایه (پشتیبانی از هر دو فرمت)
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
            
            this.processData(dataArray);
            this.errorCount = 0;
            this.updateStatus('متصل', 'success');

        } catch (error) {
            console.error('❌ خطا در دریافت داده:', error);
            this.errorCount++;
            this.updateStatus('خطا در اتصال', 'danger');
            
            // نمایش داده نمونه در صورت خطا
            if (this.errorCount > 3) {
                this.showSampleData();
            }
        }
    }

    processData(dataArray) {
        if (!dataArray || dataArray.length === 0) return;

        // ذخیره داده‌ها
        this.data = [...this.data, ...dataArray].slice(-CONFIG.maxHistory);

        // به‌روزرسانی آخرین مقادیر
        const latest = dataArray[dataArray.length - 1];
        this.updateCurrentValues(latest);

        // به‌روزرسانی جدول
        this.updateTable(dataArray.slice(-5).reverse());

        // به‌روزرسانی نمودار
        this.updateChart();

        // به‌روزرسانی آمار
        this.updateStats();
    }

    updateCurrentValues(latest) {
        const tempElement = document.getElementById('currentTemp');
        const humElement = document.getElementById('currentHum');
        
        if (tempElement && latest.temperature !== undefined) {
            tempElement.textContent = latest.temperature.toFixed(1);
        }
        
        if (humElement && latest.humidity !== undefined) {
            humElement.textContent = latest.humidity.toFixed(1);
        }

        // به‌روزرسانی زمان
        const now = new Date();
        const timeElement = document.getElementById('updateTime');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('fa-IR');
        }
    }

    updateTable(dataArray) {
        const tableContainer = document.getElementById('dataTable');
        if (!tableContainer) return;

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
        tableContainer.innerHTML = html;
    }

    updateChart() {
        if (!this.chart || this.data.length === 0) return;

        const chartData = this.data.slice(-CONFIG.chartPoints);
        
        this.chart.data.labels = chartData.map(d => 
            d.timestamp?.split(':').slice(0, 2).join(':') || '--:--'
        );
        
        this.chart.data.datasets[0].data = chartData.map(d => d.temperature || 0);
        this.chart.data.datasets[1].data = chartData.map(d => d.humidity || 0);
        
        this.chart.update('none');
    }

    async checkCORS() {
        try {
            const response = await fetch(CONFIG.corsUrl);
            if (response.ok) {
                const corsConfig = await response.json();
                console.log('✅ تنظیمات CORS فعال:', corsConfig);
                this.updateCorsStatus('فعال', 'success');
            }
        } catch (error) {
            console.warn('⚠️ خطا در بررسی CORS:', error);
            this.updateCorsStatus('خطا', 'danger');
        }
    }

    updateCorsStatus(text, type) {
        const element = document.getElementById('corsStatus');
        if (element) {
            element.textContent = text;
            element.className = `badge bg-${type}`;
        }
    }

    updateStatus(text, type) {
        const element = document.getElementById('connectionStatus');
        if (element) {
            element.innerHTML = `<i class="bi bi-circle-fill"></i> ${text}`;
            element.className = `badge bg-${type}`;
        }
    }

    updateStats() {
        // به‌روزرسانی شمارنده‌ها
        const countElement = document.getElementById('dataCount');
        if (countElement) {
            countElement.textContent = `داده‌ها: ${this.data.length}`;
        }

        const requestElement = document.getElementById('requestCount');
        if (requestElement) {
            requestElement.textContent = this.requestCount;
        }

        const errorElement = document.getElementById('errorCount');
        if (errorElement) {
            errorElement.textContent = this.errorCount;
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.intervalId = setInterval(() => {
            this.loadData();
        }, CONFIG.refreshRate);
        this.isConnected = true;
    }

    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isConnected = false;
    }

    restartAutoRefresh() {
        this.stopAutoRefresh();
        this.startAutoRefresh();
    }

    toggleConnection() {
        const btn = document.getElementById('connectBtn');
        if (!btn) return;

        if (this.isConnected) {
            this.stopAutoRefresh();
            btn.innerHTML = '<i class="bi bi-plug"></i> اتصال';
            btn.className = 'btn btn-success';
            this.updateStatus('قطع', 'secondary');
        } else {
            this.startAutoRefresh();
            btn.innerHTML = '<i class="bi bi-plug-fill"></i> قطع';
            btn.className = 'btn btn-danger';
            this.updateStatus('متصل', 'success');
        }
    }

    resetData() {
        if (confirm('آیا می‌خواهید داده‌های محلی پاک شوند؟')) {
            this.data = [];
            this.updateChart();
            this.updateTable([]);
            this.updateStats();
            console.log('♻️ داده‌ها بازنشانی شدند');
        }
    }

    showSampleData() {
        const sampleData = [
            {
                id: this.data.length + 1,
                timestamp: new Date().toLocaleTimeString('fa-IR').slice(0, 8),
                temperature: 24.5 + Math.random() * 2,
                humidity: 55 + Math.random() * 5,
                sensor: "AHT20",
                device: "ESP32"
            }
        ];
        this.processData(sampleData);
    }

    startUptimeCounter() {
        setInterval(() => {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            
            const element = document.getElementById('uptime');
            if (element) {
                element.textContent = 
                    `${hours.toString().padStart(2, '0')}:` +
                    `${minutes.toString().padStart(2, '0')}:` +
                    `${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
}

// راه‌اندازی هنگام بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
    window.sensorDashboard = new SensorDashboard();
    
    // اطلاعات اضافی
    console.log('📊 داشبورد Real-Time سنسور ESP32');
    console.log('📁 داده‌ها:', CONFIG.dataUrl);
    console.log('⚙️  CORS:', CONFIG.corsUrl);
});
