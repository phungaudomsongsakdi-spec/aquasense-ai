// ✅ src/components/SystemSettings.js
import React, { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../firebase";
import { Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // เกณฑ์การรดน้ำ
    autoWateringThreshold: 30,
    criticalSoilMoisture: 20,
    
    // เกณฑ์อุณหภูมิ
    maxTemperature: 35,
    minTemperature: 10,
    
    // การแจ้งเตือน
    enableNotifications: true,
    notifyOnLowMoisture: true,
    notifyOnHighTemp: true,
    notifyOnWatering: true,
    
    // การตั้งค่าระบบ
    wateringDuration: 5,
    checkInterval: 10,
    
    // ระบบประหยัดพลังงาน
    powerSavingMode: false,
    sleepFrom: "22:00",
    sleepUntil: "06:00"
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // โหลดการตั้งค่าจาก Firebase
    const settingsRef = ref(db, "systemSettings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    });

    return () => unsubscribe();
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await set(ref(db, "systemSettings"), settings);
      toast.success("💾 บันทึกการตั้งค่าสำเร็จ!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    const defaultSettings = {
      autoWateringThreshold: 30,
      criticalSoilMoisture: 20,
      maxTemperature: 35,
      minTemperature: 10,
      enableNotifications: true,
      notifyOnLowMoisture: true,
      notifyOnHighTemp: true,
      notifyOnWatering: true,
      wateringDuration: 5,
      checkInterval: 10,
      powerSavingMode: false,
      sleepFrom: "22:00",
      sleepUntil: "06:00"
    };
    
    setSettings(defaultSettings);
    toast("🔄 รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้น");
  };

  return (
    <div style={{
      padding: "30px",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "100vh",
      fontFamily: "'Prompt', sans-serif"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "white",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "30px",
          borderBottom: "2px solid #e8f5e9",
          paddingBottom: "15px"
        }}>
          <h1 style={{
            color: "#0b7a57",
            margin: 0,
            fontSize: "1.8rem",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            ⚙️ ตั้งค่าระบบ AquaSense AI
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={resetToDefault}
              style={{
                background: "#ff9800",
                color: "white",
                border: "none",
                padding: "10px 15px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <RotateCcw size={16} />
              ค่าเริ่มต้น
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              style={{
                background: loading ? "#ccc" : "#0b7a57",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Save size={16} />
              {loading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "30px" }}>
          {/* การตั้งค่าการรดน้ำ */}
          <SettingSection 
            icon="💧" 
            title="การตั้งค่าการรดน้ำ"
            description="ปรับแต่งเกณฑ์การรดน้ำอัตโนมัติ"
          >
            <SliderSetting
              label="เกณฑ์รดน้ำอัตโนมัติ"
              value={settings.autoWateringThreshold}
              min="10"
              max="50"
              unit="%"
              onChange={(value) => updateSetting("autoWateringThreshold", value)}
              helpText="ระบบจะรดน้ำเมื่อความชื้นดินต่ำกว่าค่านี้"
            />
            <SliderSetting
              label="ความชื้นดินขั้นวิกฤต"
              value={settings.criticalSoilMoisture}
              min="5"
              max="30"
              unit="%"
              onChange={(value) => updateSetting("criticalSoilMoisture", value)}
              helpText="แจ้งเตือนด่วนเมื่อความชื้นดินต่ำกว่าค่านี้"
            />
            <SliderSetting
              label="ระยะเวลารดน้ำ"
              value={settings.wateringDuration}
              min="1"
              max="15"
              unit="นาที"
              onChange={(value) => updateSetting("wateringDuration", value)}
              helpText="ระยะเวลาที่ปั๊มน้ำทำงานในแต่ละครั้ง"
            />
          </SettingSection>

          {/* การตั้งค่าอุณหภูมิ */}
          <SettingSection 
            icon="🌡️" 
            title="การตั้งค่าอุณหภูมิ"
            description="เกณฑ์การแจ้งเตือนอุณหภูมิ"
          >
            <SliderSetting
              label="อุณหภูมิสูงสุด"
              value={settings.maxTemperature}
              min="25"
              max="45"
              unit="°C"
              onChange={(value) => updateSetting("maxTemperature", value)}
              helpText="แจ้งเตือนเมื่ออุณหภูมิสูงกว่าค่านี้"
            />
            <SliderSetting
              label="อุณหภูมิต่ำสุด"
              value={settings.minTemperature}
              min="0"
              max="20"
              unit="°C"
              onChange={(value) => updateSetting("minTemperature", value)}
              helpText="แจ้งเตือนเมื่ออุณหภูมิต่ำกว่าค่านี้"
            />
          </SettingSection>

          {/* การตั้งค่าการแจ้งเตือน */}
          <SettingSection 
            icon="🔔" 
            title="การตั้งค่าการแจ้งเตือน"
            description="จัดการการแจ้งเตือนไปยัง ESP32"
          >
            <ToggleSetting
              label="เปิดใช้งานการแจ้งเตือน"
              checked={settings.enableNotifications}
              onChange={(checked) => updateSetting("enableNotifications", checked)}
              helpText="ส่งการแจ้งเตือนไปยัง ESP32"
            />
            <ToggleSetting
              label="แจ้งเตือนเมื่อความชื้นดินต่ำ"
              checked={settings.notifyOnLowMoisture}
              onChange={(checked) => updateSetting("notifyOnLowMoisture", checked)}
              helpText="แจ้งเตือนเมื่อความชื้นดินต่ำกว่าเกณฑ์"
            />
            <ToggleSetting
              label="แจ้งเตือนเมื่ออุณหภูมิสูง"
              checked={settings.notifyOnHighTemp}
              onChange={(checked) => updateSetting("notifyOnHighTemp", checked)}
              helpText="แจ้งเตือนเมื่ออุณหภูมิสูงกว่าเกณฑ์"
            />
            <ToggleSetting
              label="แจ้งเตือนเมื่อรดน้ำสำเร็จ"
              checked={settings.notifyOnWatering}
              onChange={(checked) => updateSetting("notifyOnWatering", checked)}
              helpText="แจ้งเตือนเมื่อระบบรดน้ำทำงานสำเร็จ"
            />
          </SettingSection>

          {/* การตั้งค่าระบบ */}
          <SettingSection 
            icon="⚙️" 
            title="การตั้งค่าระบบ"
            description="การตั้งค่าระบบพื้นฐาน"
          >
            <SliderSetting
              label="ช่วงเวลาตรวจสอบ"
              value={settings.checkInterval}
              min="1"
              max="30"
              unit="นาที"
              onChange={(value) => updateSetting("checkInterval", value)}
              helpText="ช่วงเวลาที่ระบบตรวจสอบเซนเซอร์"
            />
            <ToggleSetting
              label="โหมดประหยัดพลังงาน"
              checked={settings.powerSavingMode}
              onChange={(checked) => updateSetting("powerSavingMode", checked)}
              helpText="ลดการทำงานในช่วงกลางคืน"
            />
            
            {settings.powerSavingMode && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginTop: "10px"
              }}>
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                    color: "#555"
                  }}>
                    เวลาเริ่มพักระบบ
                  </label>
                  <input
                    type="time"
                    value={settings.sleepFrom}
                    onChange={(e) => updateSetting("sleepFrom", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "6px"
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                    color: "#555"
                  }}>
                    เวลาออกจากโหมดพัก
                  </label>
                  <input
                    type="time"
                    value={settings.sleepUntil}
                    onChange={(e) => updateSetting("sleepUntil", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "6px"
                    }}
                  />
                </div>
              </div>
            )}
          </SettingSection>
        </div>
      </div>
    </div>
  );
}

// ✅ Component ย่อยสำหรับการตั้งค่า
function SettingSection({ icon, title, description, children }) {
  return (
    <div style={{
      border: "1px solid #e0e0e0",
      borderRadius: "12px",
      padding: "20px",
      background: "#fafafa"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
        <div>
          <h3 style={{ margin: "0 0 5px 0", color: "#0b7a57" }}>{title}</h3>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>{description}</p>
        </div>
      </div>
      <div style={{ display: "grid", gap: "20px" }}>
        {children}
      </div>
    </div>
  );
}

function SliderSetting({ label, value, min, max, unit, onChange, helpText }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ fontWeight: "500", color: "#333" }}>{label}</label>
        <span style={{ fontWeight: "bold", color: "#0b7a57" }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: "100%",
          marginBottom: "5px"
        }}
      />
      {helpText && (
        <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.8rem" }}>{helpText}</p>
      )}
    </div>
  );
}

function ToggleSetting({ label, checked, onChange, helpText }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <label style={{ fontWeight: "500", color: "#333", display: "block", marginBottom: "4px" }}>
          {label}
        </label>
        {helpText && (
          <p style={{ margin: 0, color: "#666", fontSize: "0.8rem" }}>{helpText}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: "50px",
          height: "26px",
          background: checked ? "#0b7a57" : "#ccc",
          border: "none",
          borderRadius: "13px",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.3s"
        }}
      >
        <div style={{
          width: "20px",
          height: "20px",
          background: "white",
          borderRadius: "50%",
          position: "absolute",
          top: "3px",
          left: checked ? "27px" : "3px",
          transition: "left 0.3s"
        }} />
      </button>
    </div>
  );
}