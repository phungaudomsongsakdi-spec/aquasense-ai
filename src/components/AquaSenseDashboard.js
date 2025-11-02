import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Droplets, Thermometer, Cloud, CheckCircle, TreePine, RefreshCw } from "lucide-react";

function AquaSenseDashboard() {
  const [data, setData] = useState({
    soilMoisture: 0,
    humidity: 0,
    temp: 0,
  });
  const [realtimeHistory, setRealtimeHistory] = useState([]);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [showLine, setShowLine] = useState({
    soil: true,
    hum: true,
    temp: true,
  });
  const [sensorError, setSensorError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [plantDetails, setPlantDetails] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // ✅ โหลดข้อมูลจาก Firebase
  useEffect(() => {
    console.log("🔗 Connecting to Firebase...");
    setLoading(true);

    const sensorRef = ref(db, "sensorData");
    const dailyRef = ref(db, "sensorHistory");
    const controlRef = ref(db, "control");
    const plantsRef = ref(db, "plants");

    let sensorUnsubscribe, dailyUnsubscribe, controlUnsubscribe, plantsUnsubscribe;

    try {
      sensorUnsubscribe = onValue(sensorRef, (snapshot) => {
        try {
          const val = snapshot.val();
          if (val) {
            setData({
              soilMoisture: val.soil ?? 0,
              humidity: val.humidity ?? 0,
              temp: val.temp ?? 0,
            });

            setRealtimeHistory((prev) => {
              const newHistory = [
                ...prev.slice(-9),
                {
                  time: new Date().toLocaleTimeString('th-TH', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }),
                  soilMoisture: val.soil ?? 0,
                  humidity: val.humidity ?? 0,
                  temp: val.temp ?? 0,
                },
              ];
              return newHistory;
            });
            
            setSensorError(false);
            setLoading(false);
            setLastUpdate(new Date());
          } else {
            setSensorError(true);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error processing sensor data:", error);
          setSensorError(true);
          setLoading(false);
        }
      }, (error) => {
        console.error("Firebase sensor error:", error);
        setSensorError(true);
        setLoading(false);
      });

      dailyUnsubscribe = onValue(dailyRef, (snapshot) => {
        try {
          const val = snapshot.val();
          if (val) {
            const sorted = Object.entries(val)
              .slice(-7)
              .map(([date, d]) => ({
                date: new Date(date).toLocaleDateString('th-TH', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
                soilMoisture: d.soil ?? 0,
                humidity: d.humidity ?? 0,
                temp: d.temp ?? 0,
              }));
            setDailyHistory(sorted);
          }
        } catch (error) {
          console.error("Error processing history data:", error);
        }
      });

      controlUnsubscribe = onValue(controlRef, (snapshot) => {
        try {
          const controlData = snapshot.val();
          if (controlData && controlData.selectedPlant) {
            setSelectedPlant(controlData.selectedPlant);
            
            plantsUnsubscribe = onValue(plantsRef, (plantsSnapshot) => {
              const plantsData = plantsSnapshot.val();
              if (plantsData) {
                const plantArray = Object.values(plantsData);
                const foundPlant = plantArray.find(
                  plant => plant.displayName === controlData.selectedPlant
                );
                if (foundPlant) {
                  setPlantDetails(foundPlant);
                }
              }
            });
          } else {
            setSelectedPlant(null);
            setPlantDetails(null);
          }
        } catch (error) {
          console.error("Error loading control data:", error);
        }
      });

    } catch (error) {
      console.error("Firebase connection error:", error);
      setSensorError(true);
      setLoading(false);
    }

    return () => {
      if (sensorUnsubscribe) sensorUnsubscribe();
      if (dailyUnsubscribe) dailyUnsubscribe();
      if (controlUnsubscribe) controlUnsubscribe();
      if (plantsUnsubscribe) plantsUnsubscribe();
    };
  }, []);

  const toggleLine = (key) => {
    setShowLine((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRetry = () => {
    setLoading(true);
    window.location.reload();
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const getWateringStatus = () => {
    if (!selectedPlant) return null;

    const currentSoil = data.soilMoisture;
    
    if (currentSoil < 30) {
      return {
        status: "จำเป็นต้องรดน้ำด่วน 🚨",
        color: "bg-red-100 border-red-400 text-red-800",
        message: `ความชื้นดินต่ำมาก (${currentSoil}%) ระบบจะรดน้ำอัตโนมัติให้ "${selectedPlant}"`
      };
    } else if (currentSoil < 60) {
      return {
        status: "ความชื้นพอเหมาะ ✅",
        color: "bg-green-100 border-green-400 text-green-800",
        message: `ความชื้นดินอยู่ในระดับดี (${currentSoil}%) เหมาะสมกับ "${selectedPlant}"`
      };
    } else {
      return {
        status: "ดินชื้นเพียงพอ 💧",
        color: "bg-blue-100 border-blue-400 text-blue-800",
        message: `ความชื้นดินสูง (${currentSoil}%) ไม่จำเป็นต้องรดน้ำ "${selectedPlant}"`
      };
    }
  };

  const wateringStatus = getWateringStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 safe-top safe-bottom">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">🌱</div>
          <h2 className="text-green-800 text-xl font-semibold mb-3">กำลังโหลดข้อมูล...</h2>
          <p className="text-gray-600">กรุณารอสักครู่</p>
          <div className="mt-6 loading-spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-6 safe-top safe-bottom">
      {/* Header Section */}
      <header className="text-center mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl text-green-800 font-bold mb-2">
              💧 AquaSense AI
            </h1>
            <p className="text-green-700 text-sm md:text-base">
              ระบบรดน้ำอัตโนมัติอัจฉริยะ
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-white text-green-700 px-4 py-3 rounded-xl border border-green-300 hover:bg-green-50 transition-colors flex items-center gap-2 btn-mobile self-center"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            อัปเดตข้อมูล
          </button>
        </div>
        
        {/* Last Update */}
        <div className="text-xs text-green-600 bg-white/50 rounded-full px-3 py-1 inline-block">
          อัปเดตล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
        </div>
      </header>

      {/* Plant Status Section */}
      {selectedPlant && (
        <section className="bg-white rounded-2xl p-4 md:p-6 mb-6 border-2 border-green-300 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3 mb-3 md:mb-0">
              <div className="bg-green-500 rounded-full p-2 md:p-3 flex items-center justify-center">
                <CheckCircle size={24} color="white" />
              </div>
              <div>
                <h2 className="text-green-800 text-lg md:text-xl font-semibold">
                  🌿 กำลังเลือกรดน้ำอัตโนมัติ
                </h2>
                <p className="text-green-700 font-bold text-base md:text-lg">
                  {selectedPlant}
                </p>
              </div>
            </div>
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold self-start md:self-center">
              โหมดอัตโนมัติ
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Plant Information */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 md:p-6 border border-green-200">
              {plantDetails?.image && (
                <img 
                  src={plantDetails.image} 
                  alt={selectedPlant}
                  className="w-full h-48 object-cover rounded-lg mb-4 shadow-md"
                  onError={(e) => {
                    e.target.src = "https://img.icons8.com/color/96/000000/plant-under-sun.png";
                  }}
                />
              )}
              
              <h3 className="text-green-700 font-semibold text-lg mb-4 flex items-center gap-2">
                <span>📋</span>
                ข้อมูลต้นไม้
              </h3>
              
              <div className="space-y-3 text-sm md:text-base">
                {plantDetails?.waterMl && (
                  <p className="flex items-center gap-2">
                    <span className="text-blue-500">💧</span>
                    <span><strong>ปริมาณน้ำ:</strong> {plantDetails.waterMl} ml/วัน</span>
                  </p>
                )}
                {plantDetails?.soil && (
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">🌱</span>
                    <span><strong>ประเภทดิน:</strong> {plantDetails.soil}</span>
                  </p>
                )}
                {plantDetails?.light && (
                  <p className="flex items-center gap-2">
                    <span className="text-yellow-500">☀️</span>
                    <span><strong>ความต้องการแสง:</strong> {plantDetails.light}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Sensor Data Section */}
            <div className="space-y-4 md:space-y-6">
              {wateringStatus && (
                <div className={`${wateringStatus.color} border-2 rounded-xl p-4 md:p-5 shadow-sm`}>
                  <h3 className="font-semibold text-lg mb-2">
                    {wateringStatus.status}
                  </h3>
                  <p className="text-sm md:text-base">
                    {wateringStatus.message}
                  </p>
                </div>
              )}

              {/* Sensor Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <SensorCard 
                  label="ความชื้นในดิน" 
                  value={`${data.soilMoisture}%`} 
                  icon="🌱"
                  error={sensorError}
                  trend={realtimeHistory.length > 1 ? 
                    realtimeHistory[realtimeHistory.length - 1].soilMoisture - realtimeHistory[realtimeHistory.length - 2].soilMoisture 
                    : 0}
                />
                <SensorCard 
                  label="อุณหภูมิ" 
                  value={`${data.temp}°C`} 
                  icon="🌡️"
                  error={sensorError}
                  trend={realtimeHistory.length > 1 ? 
                    realtimeHistory[realtimeHistory.length - 1].temp - realtimeHistory[realtimeHistory.length - 2].temp 
                    : 0}
                />
                <SensorCard 
                  label="ความชื้นอากาศ" 
                  value={`${data.humidity}%`} 
                  icon="💧"
                  error={sensorError}
                  trend={realtimeHistory.length > 1 ? 
                    realtimeHistory[realtimeHistory.length - 1].humidity - realtimeHistory[realtimeHistory.length - 2].humidity 
                    : 0}
                />
              </div>

              {/* Mini Chart */}
              {realtimeHistory.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-lg border border-green-200">
                  <h4 className="text-green-700 font-semibold text-center mb-4 flex items-center justify-center gap-2">
                    <span>📊</span>
                    แนวโน้มล่าสุด
                  </h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={realtimeHistory.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      {showLine.soil && (
                        <Line
                          type="monotone"
                          dataKey="soilMoisture"
                          stroke="#43a047"
                          strokeWidth={2}
                          dot={false}
                          name="ความชื้นดิน"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sensor Error Alert */}
      {sensorError && (
        <div className="bg-orange-100 border border-orange-400 rounded-xl p-4 md:p-6 mb-6 text-center">
          <h3 className="text-orange-800 font-semibold text-lg mb-2">⚠️ ไม่สามารถเชื่อมต่อเซนเซอร์ได้</h3>
          <p className="text-orange-700 mb-4">กรุณาตรวจสอบการเชื่อมต่ออุปกรณ์</p>
          <button
            onClick={handleRetry}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium btn-mobile"
          >
            🔄 ลองใหม่
          </button>
        </div>
      )}

      {/* Main Sensor Cards (เมื่อไม่มีพืชถูกเลือก) */}
      {!selectedPlant && !sensorError && (
        <section className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <SensorCard 
            label="ความชื้นในดิน" 
            value={`${data.soilMoisture}%`} 
            icon="🌱" 
            error={sensorError}
          />
          <SensorCard 
            label="อุณหภูมิ" 
            value={`${data.temp}°C`} 
            icon="🌡️" 
            error={sensorError}
          />
          <SensorCard 
            label="ความชื้นอากาศ" 
            value={`${data.humidity}%`} 
            icon="💧" 
            error={sensorError}
          />
        </section>
      )}

      {/* Chart Controls */}
      <section className="text-center mb-8 md:mb-12">
        <h3 className="text-green-800 font-semibold text-lg md:text-xl mb-4 md:mb-6">
          🔍 เลือกแสดงเส้นในกราฟ
        </h3>
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          <ToggleButton
            label="🌱 ความชื้นในดิน"
            active={showLine.soil}
            onClick={() => toggleLine("soil")}
            color="#43a047"
            disabled={sensorError}
          />
          <ToggleButton
            label="💧 ความชื้นอากาศ"
            active={showLine.hum}
            onClick={() => toggleLine("hum")}
            color="#1e88e5"
            disabled={sensorError}
          />
          <ToggleButton
            label="🌡️ อุณหภูมิ"
            active={showLine.temp}
            onClick={() => toggleLine("temp")}
            color="#e53935"
            disabled={sensorError}
          />
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-8 md:space-y-12">
        <GraphSection
          title="📊 กราฟข้อมูลเรียลไทม์"
          data={realtimeHistory}
          showLine={showLine}
          error={sensorError}
        />
        
        <GraphSection
          title="🕒 กราฟสรุปย้อนหลัง 7 วัน"
          data={dailyHistory}
          showLine={showLine}
          isDaily
          error={sensorError}
        />
      </section>

      {/* Footer */}
      <footer className="text-center mt-12 pt-6 border-t border-green-200">
        <p className="text-green-600 text-sm">
          AquaSense AI - ระบบรดน้ำอัตโนมัติ © 2024
        </p>
      </footer>
    </div>
  );
}

// ✅ Graph Section Component
function GraphSection({ title, data, showLine, isDaily = false, error }) {
  if (error) {
    return (
      <section className="mb-8 md:mb-12">
        <h2 className="text-green-800 text-center text-lg md:text-xl font-semibold mb-4">{title}</h2>
        <div className="bg-gray-100 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-600">⚠️ ไม่สามารถแสดงกราฟได้ในขณะนี้</p>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section className="mb-8 md:mb-12">
        <h2 className="text-green-800 text-center text-lg md:text-xl font-semibold mb-4">{title}</h2>
        <div className="bg-gray-100 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-600">📊 กำลังรวบรวมข้อมูล...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 md:mb-12">
      <h2 className="text-green-800 text-center text-lg md:text-xl font-semibold mb-6">{title}</h2>
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-green-200">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={isDaily ? "date" : "time"} 
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {showLine.soil && (
              <Line
                type="monotone"
                dataKey="soilMoisture"
                stroke="#43a047"
                strokeWidth={2}
                dot={false}
                name="ความชื้นในดิน (%)"
              />
            )}
            {showLine.hum && (
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#1e88e5"
                strokeWidth={2}
                dot={false}
                name="ความชื้นอากาศ (%)"
              />
            )}
            {showLine.temp && (
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#e53935"
                strokeWidth={2}
                dot={false}
                name="อุณหภูมิ (°C)"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ✅ Toggle Button Component
function ToggleButton({ label, active, onClick, color, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-3 rounded-xl font-medium transition-all duration-200 btn-mobile
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${active 
          ? 'text-white shadow-lg' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        }
      `}
      style={{
        backgroundColor: active ? color : undefined,
      }}
    >
      {label}
    </button>
  );
}

// ✅ Sensor Card Component
function SensorCard({ label, value, icon, error = false, trend = 0 }) {
  const getTrendIcon = () => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '➡️';
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className={`
      bg-white rounded-xl shadow-md p-4 text-center border-2 transition-all duration-200
      hover:shadow-lg hover:scale-105
      ${error ? 'border-red-300 bg-red-50' : 'border-green-200'}
      flex-1 min-w-[140px] max-w-[200px] mx-auto
    `}>
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className={`font-semibold text-sm md:text-base mb-2 ${error ? 'text-red-700' : 'text-green-700'}`}>
        {label}
      </h3>
      <h2 className={`text-xl md:text-2xl font-bold mb-1 ${error ? 'text-red-600' : 'text-green-800'}`}>
        {error ? "N/A" : value}
      </h2>
      
      {!error && trend !== 0 && (
        <div className={`text-xs ${getTrendColor()} flex items-center justify-center gap-1`}>
          <span>{getTrendIcon()}</span>
          <span>{Math.abs(trend).toFixed(1)}</span>
        </div>
      )}
      
      {error && (
        <p className="text-red-600 text-xs mt-2">ไม่พร้อมใช้งาน</p>
      )}
    </div>
  );
}

export default AquaSenseDashboard;