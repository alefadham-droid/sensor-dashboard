// 📥 دریافت داده‌ها از فایل JSON روی GitHub
async function fetchData() {
  try {
    const response = await fetch("sensor-data.json");
    if (!response.ok) {
      throw new Error("خطا در دریافت داده‌ها: " + response.status);
    }
    const data = await response.json();
    renderData(data);
  } catch (error) {
    console.error("❌ مشکل در دریافت داده‌ها:", error);
  }
}

// 📊 نمایش داده‌ها روی صفحه
function renderData(data) {
  const container = document.getElementById("data");
  container.innerHTML = "";

  if (!Array.isArray(data)) {
    container.innerHTML = "<p>⚠️ داده‌ها معتبر نیستند</p>";
    return;
  }

  // نمایش آخرین رکوردها به ترتیب
  data.slice().reverse().forEach(item => {
    const timeString = new Date(item.timestamp * 1000).toLocaleString();
    const record = `
      <div class="record">
        <p>🕒 ${timeString}</p>
        <p>🌡️ دما: ${item.temperature} °C</p>
        <p>💧 رطوبت: ${item.humidity} %</p>
        <hr>
      </div>
    `;
    container.innerHTML += record;
  });
}

// ⏱️ رفرش خودکار هر 30 ثانیه
setInterval(fetchData, 30000);

// 🚀 بارگذاری اولیه
fetchData();
