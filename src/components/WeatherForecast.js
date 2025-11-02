import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

const API_KEY = "1dc94ac93349cfe32b98b04aba685819";
const CITY = "Ban Pong,TH";

function WeatherForecast() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    const loadingToast = toast.loading('กำลังโหลดข้อมูลพยากรณ์อากาศ...');
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric&lang=th`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.list || data.list.length === 0) {
        throw new Error('ไม่พบข้อมูลพยากรณ์อากาศ');
      }
      
      const daily = data.list.filter((_, i) => i % 8 === 0).slice(0, 5);
      setForecast(daily);
      toast.success('โหลดข้อมูลพยากรณ์อากาศสำเร็จ', { id: loadingToast });
      
    } catch (err) {
      console.error('Weather API error:', err);
      setError(err.message);
      
      if (err.message.includes('API Error')) {
        toast.error('บริการพยากรณ์อากาศชั่วคราวไม่พร้อมใช้งาน', { id: loadingToast });
      } else if (err.message.includes('Failed to fetch')) {
        toast.error('การเชื่อมต่ออินเทอร์เน็ตมีปัญหา', { id: loadingToast });
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลพยากรณ์อากาศได้', { id: loadingToast });
      }
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateStr) => {
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];
    return days[new Date(dateStr).getDay()];
  };

  const handleRetry = () => {
    fetchWeatherData();
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 font-[Prompt] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌤️</div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">กำลังโหลดข้อมูลพยากรณ์อากาศ...</h2>
          <p className="text-gray-600">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 font-[Prompt] flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-4">ไม่สามารถโหลดข้อมูลพยากรณ์อากาศได้</h2>
          <p className="text-gray-700 mb-2">เกิดข้อผิดพลาด: {error}</p>
          <button
            onClick={handleRetry}
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors font-medium"
          >
            🔄 โหลดใหม่
          </button>
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            <strong>ข้อแนะนำ:</strong>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
              <li>ลองใหม่อีกครั้งในภายหลัง</li>
              <li>บริการอาจชั่วคราวไม่พร้อมใช้งาน</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 font-[Prompt] flex flex-col items-center">
      <h1 className="text-2xl font-semibold text-green-800 mb-8 drop-shadow-sm">
        🌤️ พยากรณ์อากาศล่วงหน้า 5 วัน
      </h1>

      {/* ปุ่มโหลดใหม่ */}
      <button
        onClick={handleRetry}
        className="mb-6 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
      >
        🔄 อัปเดตข้อมูล
      </button>

      {/* การ์ดแสดงพยากรณ์ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-6xl mb-10">
        {forecast.map((day, i) => {
          const rainChance = day.pop ? Math.round(day.pop * 100) : 0;
          return (
            <div
              key={i}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg p-6 text-center transition transform hover:-translate-y-1 hover:scale-105 border border-green-100"
            >
              <p className="font-semibold text-green-700 text-lg mb-2">
                {getDayName(day.dt_txt)}
              </p>

              <img
                src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                alt="weather icon"
                className="mx-auto w-20 h-20"
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'%3E%3Cpath fill='%2343a047' d='M6 8a6 6 0 0 1 12 0c0 3.09-.78 5.34-1.84 6.69-.38.48-.82 1.03-1.16 1.31H9c-.34-.28-.78-.83-1.16-1.31C6.78 13.34 6 11.09 6 8z'/%3E%3C/svg%3E";
                }}
              />

              <p className="text-gray-700 capitalize mb-2">
                {day.weather[0].description}
              </p>

              <p className="text-lg font-medium text-green-900">
                🌡️ {day.main.temp.toFixed(1)}°C
              </p>

              <p className="text-blue-700 mt-1">💧 ความชื้น {day.main.humidity}%</p>

              <p
                className={`font-semibold mt-2 ${
                  rainChance > 60 ? "text-blue-600" : rainChance > 30 ? "text-green-700" : "text-gray-500"
                }`}
              >
                {rainChance > 30 ? "🌧️" : "☀️"} โอกาสฝนตก {rainChance}%
              </p>

              <div className="mt-3 text-xs text-gray-500">
                ความดัน: {day.main.pressure} hPa
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 กราฟแนวโน้มอุณหภูมิ */}
      {forecast.length > 0 && (
        <div className="w-full max-w-4xl bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-green-800 mb-4 text-center">
            📈 แนวโน้มอุณหภูมิ 5 วัน
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={forecast.map((d) => ({
                name: getDayName(d.dt_txt),
                temp: d.main.temp,
                hum: d.main.humidity,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "temp") return [`${value}°C`, "อุณหภูมิ"];
                  if (name === "hum") return [`${value}%`, "ความชื้น"];
                  return [value, name];
                }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#43a047"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="อุณหภูมิ (°C)"
              />
              <Line
                type="monotone"
                dataKey="hum"
                stroke="#1e88e5"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="ความชื้น (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <footer className="mt-10 text-sm text-gray-600 text-center">
        ข้อมูลจาก{" "}
        <a
          href="https://openweathermap.org/"
          className="text-blue-600 font-medium hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenWeatherMap.org
        </a>
        <br />
        <span className="text-xs text-gray-500">
          อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
        </span>
      </footer>
    </div>
  );
}

export default WeatherForecast;