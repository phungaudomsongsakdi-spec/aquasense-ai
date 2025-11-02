// ✅ src/components/Reports.js
import React, { useState, useEffect } from "react";
import { ref, onValue, query, orderByKey, limitToLast } from "firebase/database";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, Droplets, Zap, Leaf } from "lucide-react";

export default function Reports() {
  const [reportData, setReportData] = useState({
    weeklyStats: {},
    monthlyStats: {},
    plantStats: [],
    waterUsage: [],
    energyUsage: []
  });

  const [timeRange, setTimeRange] = useState("weekly"); // weekly, monthly

  useEffect(() => {
    // โหลดข้อมูลรายงานจาก Firebase
    const loadReportData = async () => {
      // ตัวอย่างข้อมูล - ในจริงควรดึงจาก Firebase
      const mockData = {
        weeklyStats: {
          waterSaved: 45,
          plantsWatered: 12,
          energyUsed: 8.5,
          autoWateringCount: 18
        },
        monthlyStats: {
          waterSaved: 180,
          plantsWatered: 48,
          energyUsed: 34.2,
          autoWateringCount: 72
        },
        plantStats: [
          { name: "กะเพรา", waterUsage: 1200, wateringCount: 12 },
          { name: "โหระพา", waterUsage: 1100, wateringCount: 11 },
          { name: "กุหลาบ", waterUsage: 2000, wateringCount: 20 },
          { name: "มะลิ", waterUsage: 1500, wateringCount: 15 }
        ],
        waterUsage: [
          { day: "จันทร์", usage: 8.2 },
          { day: "อังคาร", usage: 7.8 },
          { day: "พุธ", usage: 9.1 },
          { day: "พฤหัส", usage: 8.5 },
          { day: "ศุกร์", usage: 7.9 },
          { day: "เสาร์", usage: 6.5 },
          { day: "อาทิตย์", usage: 5.8 }
        ],
        energyUsage: [
          { day: "จันทร์", usage: 2.1 },
          { day: "อังคาร", usage: 1.9 },
          { day: "พุธ", usage: 2.3 },
          { day: "พฤหัส", usage: 2.0 },
          { day: "ศุกร์", usage: 1.8 },
          { day: "เสาร์", usage: 1.5 },
          { day: "อาทิตย์", usage: 1.2 }
        ]
      };

      setReportData(mockData);
    };

    loadReportData();
  }, []);

  const currentStats = timeRange === "weekly" ? reportData.weeklyStats : reportData.monthlyStats;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const exportReport = () => {
    // ส่งออกรายงานเป็น PDF/CSV (mock function)
    alert("📊 ส่งออกรายงานเรียบร้อย!");
  };

  return (
    <div style={{
      padding: "30px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      minHeight: "100vh",
      fontFamily: "'Prompt', sans-serif"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px"
        }}>
          <h1 style={{
            color: "white",
            margin: 0,
            fontSize: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            📈 รายงานระบบ AquaSense AI
          </h1>
          <button
            onClick={exportReport}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(10px)"
            }}
          >
            <Download size={18} />
            ส่งออกรายงาน
          </button>
        </div>

        {/* Time Range Selector */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px"
        }}>
          {["weekly", "monthly"].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                background: timeRange === range ? "white" : "rgba(255,255,255,0.1)",
                color: timeRange === range ? "#667eea" : "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              {range === "weekly" ? "รายสัปดาห์" : "รายเดือน"}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          <StatCard
            icon={<Droplets size={24} />}
            title="น้ำที่ประหยัดได้"
            value={`${currentStats.waterSaved}L`}
            description="เทียบกับระบบปกติ"
            color="#0088FE"
          />
          <StatCard
            icon={<Leaf size={24} />}
            title="ต้นไม้ที่รดน้ำ"
            value={currentStats.plantsWatered}
            description="จำนวนครั้งที่รดน้ำ"
            color="#00C49F"
          />
          <StatCard
            icon={<Zap size={24} />}
            title="พลังงานที่ใช้"
            value={`${currentStats.energyUsed}kWh`}
            description="รวมทั้งหมด"
            color="#FFBB28"
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            title="การรดน้ำอัตโนมัติ"
            value={currentStats.autoWateringCount}
            description="จำนวนครั้ง"
            color="#FF8042"
          />
        </div>

        {/* Charts Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: "20px"
        }}>
          {/* Water Usage Chart */}
          <div style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#333", marginBottom: "15px" }}>💧 การใช้น้ำรายวัน</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.waterUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#0088FE" name="น้ำที่ใช้ (ลิตร)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Plant Water Usage Pie Chart */}
          <div style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#333", marginBottom: "15px" }}>🌿 การใช้น้ำตามพืช</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.plantStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="waterUsage"
                >
                  {reportData.plantStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Energy Usage Chart */}
          <div style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#333", marginBottom: "15px" }}>⚡ การใช้พลังงาน</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.energyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#FFBB28" name="พลังงาน (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#333", marginBottom: "15px" }}>💡 คำแนะนำ</h3>
            <div style={{ lineHeight: "1.6" }}>
              <p>• 🎯 ปรับเกณฑ์รดน้ำจาก 30% เป็น 25% เพื่อประหยัดน้ำเพิ่ม</p>
              <p>• 🌞 ใช้โหมดประหยัดพลังงานในช่วงกลางวัน</p>
              <p>• 💧 ตรวจสอบระบบท่อน้ำเพื่อป้องกันการรั่วไหล</p>
              <p>• 📱 อัปเดตเฟิร์มแวร์ ESP32 เป็นเวอร์ชันล่าสุด</p>
              <p>• 🔄 ตั้งเวลารดน้ำให้สอดคล้องกับสภาพอากาศ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, description, color }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "15px",
      padding: "20px",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      display: "flex",
      alignItems: "center",
      gap: "15px"
    }}>
      <div style={{
        background: color,
        borderRadius: "12px",
        padding: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ color: "white" }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ 
          fontSize: "1.5rem", 
          fontWeight: "bold", 
          color: "#333",
          marginBottom: "5px"
        }}>
          {value}
        </div>
        <div style={{ 
          fontWeight: "500", 
          color: "#666",
          marginBottom: "2px"
        }}>
          {title}
        </div>
        <div style={{ 
          fontSize: "0.8rem", 
          color: "#999" 
        }}>
          {description}
        </div>
      </div>
    </div>
  );
}