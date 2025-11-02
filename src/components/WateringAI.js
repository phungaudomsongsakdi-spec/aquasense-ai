import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../firebase";
import toast from "react-hot-toast";

export default function WateringAI() {
  const [sensor, setSensor] = useState({ soil: 0, temp: 0, humidity: 0 });
  const [control, setControl] = useState({ pumpState: false, autoMode: false });
  const [loading, setLoading] = useState({ pump: false, auto: false });
  const [connectionError, setConnectionError] = useState(false);
  
  const lastPumpState = useRef(null);
  const lastAutoMode = useRef(null);

  useEffect(() => {
    const sensorRef = ref(db, "sensorData");
    const controlRef = ref(db, "control");

    let sensorUnsubscribe, controlUnsubscribe;

    try {
      sensorUnsubscribe = onValue(sensorRef, (snap) => {
        try {
          const val = snap.val() || {};
          setSensor({
            soil: val.soil ?? 0,
            temp: val.temp ?? 0,
            humidity: val.humidity ?? 0,
          });
          setConnectionError(false);
        } catch (error) {
          console.error("Error processing sensor data:", error);
          setConnectionError(true);
        }
      });

      controlUnsubscribe = onValue(controlRef, (snap) => {
        try {
          const val = snap.val() || {};
          const newPumpState = val.pumpState ?? false;
          const newAutoMode = val.autoMode ?? false;

          // แจ้งเตือนเมื่อสถานะเปลี่ยน (เฉพาะเมื่อไม่ใช่การโหลดครั้งแรก)
          if (lastPumpState.current !== null && newPumpState !== lastPumpState.current) {
            if (newPumpState) {
              toast.success('💧 เปิดปั๊มน้ำแล้ว', { 
                duration: 3000,
                id: 'pump-status'
              });
            } else {
              toast('⏹️ ปิดปั๊มน้ำแล้ว', { 
                icon: '🛑',
                duration: 3000,
                id: 'pump-status'
              });
            }
          }

          if (lastAutoMode.current !== null && newAutoMode !== lastAutoMode.current) {
            if (newAutoMode) {
              toast.success('🤖 เปิดโหมดอัตโนมัติแล้ว', {
                duration: 3000,
                id: 'auto-mode-status'
              });
            } else {
              toast('🔴 ปิดโหมดอัตโนมัติแล้ว', {
                icon: '📱',
                duration: 3000,
                id: 'auto-mode-status'
              });
            }
          }

          lastPumpState.current = newPumpState;
          lastAutoMode.current = newAutoMode;

          setControl({
            pumpState: newPumpState,
            autoMode: newAutoMode,
          });
        } catch (error) {
          console.error("Error processing control data:", error);
        }
      });

    } catch (error) {
      console.error("Firebase connection error:", error);
      setConnectionError(true);
      toast.error("การเชื่อมต่อระบบควบคุมมีปัญหา");
    }

    return () => {
      if (sensorUnsubscribe) sensorUnsubscribe();
      if (controlUnsubscribe) controlUnsubscribe();
    };
  }, []);

  const togglePump = async () => {
    if (connectionError) {
      toast.error("ไม่สามารถควบคุมปั๊มได้ในขณะนี้");
      return;
    }

    // เคลียร์ toast เก่าก่อน
    toast.dismiss();
    
    setLoading(prev => ({ ...prev, pump: true }));
    
    try {
      const newState = !control.pumpState;
      await set(ref(db, "control/pumpState"), newState);
      
    } catch (error) {
      console.error("Error toggling pump:", error);
      toast.error("ไม่สามารถควบคุมปั๊มได้");
    } finally {
      setLoading(prev => ({ ...prev, pump: false }));
    }
  };

  const toggleAuto = async () => {
    if (connectionError) {
      toast.error("ไม่สามารถตั้งค่าโหมดอัตโนมัติได้");
      return;
    }

    // เคลียร์ toast เก่าก่อน
    toast.dismiss();
    
    setLoading(prev => ({ ...prev, auto: true }));
    
    try {
      const newState = !control.autoMode;
      await set(ref(db, "control/autoMode"), newState);
      
    } catch (error) {
      console.error("Error toggling auto mode:", error);
      toast.error("ไม่สามารถตั้งค่าโหมดอัตโนมัติได้");
    } finally {
      setLoading(prev => ({ ...prev, auto: false }));
    }
  };

  // 🌿 AI Recommendation
  const getRecommendation = () => {
    if (connectionError) {
      return {
        message: "⚠️ ไม่สามารถอ่านค่าจากเซนเซอร์ได้",
        color: "bg-yellow-100 border-yellow-400",
        details: "กรุณาตรวจสอบการเชื่อมต่อเซนเซอร์"
      };
    }

    if (sensor.soil < 30) {
      return {
        message: "💧 ควรรดน้ำทันที พืชขาดน้ำ",
        color: "bg-red-100 border-red-400",
        details: `ความชื้นดินต่ำมาก (${sensor.soil}%)`
      };
    } else if (sensor.soil < 60) {
      return {
        message: "🌿 ความชื้นพอเหมาะ",
        color: "bg-green-100 border-green-400",
        details: `ความชื้นดินอยู่ในระดับดี (${sensor.soil}%)`
      };
    } else {
      return {
        message: "☀️ ดินชื้นมาก ไม่ควรรดน้ำเพิ่ม",
        color: "bg-blue-100 border-blue-400",
        details: `ความชื้นดินสูง (${sensor.soil}%)`
      };
    }
  };

  const recommendation = getRecommendation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="p-8 min-h-screen font-[Prompt] bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center">
      <h1 className="text-2xl font-semibold text-green-800 mb-6">
        🤖 ระบบแนะนำการรดน้ำอัตโนมัติ AquaSense AI
      </h1>

      {/* กล่องคำแนะนำ AI */}
      <div className={`p-6 rounded-2xl shadow-md text-center w-full max-w-2xl mb-8 border-2 ${recommendation.color}`}>
        <h2 className="text-xl font-bold text-green-800 mb-2">
          🤖 คำแนะนำจาก AI
        </h2>
        <p className="text-lg text-gray-800 mb-2">{recommendation.message}</p>
        <p className="text-sm text-gray-600">
          {recommendation.details}
          {!connectionError && (
            <>
              {" "}| อุณหภูมิ: {sensor.temp}°C | ความชื้นอากาศ: {sensor.humidity}%
            </>
          )}
        </p>
        
        {connectionError && (
          <button
            onClick={handleRetry}
            className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            🔄 ลองเชื่อมต่อใหม่
          </button>
        )}
      </div>

      {/* ปุ่มควบคุม */}
      <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
        <button
          onClick={togglePump}
          disabled={loading.pump || connectionError}
          className={`px-8 py-3 rounded-xl text-white font-medium shadow-md transition transform hover:scale-105 ${
            control.pumpState
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } ${(loading.pump || connectionError) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading.pump ? "⏳" : "🚿"} 
          {loading.pump ? "กำลังประมวลผล..." : control.pumpState ? "ปิดปั๊มน้ำ" : "เปิดปั๊มน้ำ"}
        </button>

        <button
          onClick={toggleAuto}
          disabled={loading.auto || connectionError}
          className={`px-8 py-3 rounded-xl text-white font-medium shadow-md transition transform hover:scale-105 ${
            control.autoMode
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-500 hover:bg-gray-600"
          } ${(loading.auto || connectionError) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading.auto ? "⏳" : "🤖"}
          {loading.auto ? "กำลังตั้งค่า..." : ` โหมดอัตโนมัติ: ${control.autoMode ? "เปิด" : "ปิด"}`}
        </button>
      </div>

      {/* สถานะระบบ */}
      <div className="text-center">
        <div className="bg-white rounded-lg p-4 shadow-md max-w-md">
          <h3 className="font-semibold text-green-800 mb-2">📊 สถานะระบบปัจจุบัน</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium">ปั๊มน้ำ</p>
              <p className={`font-bold ${control.pumpState ? 'text-green-600' : 'text-red-600'}`}>
                {control.pumpState ? '✅ เปิด' : '❌ ปิด'}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium">โหมดอัตโนมัติ</p>
              <p className={`font-bold ${control.autoMode ? 'text-blue-600' : 'text-gray-600'}`}>
                {control.autoMode ? '🤖 เปิด' : '🔴 ปิด'}
              </p>
            </div>
          </div>
          
          {!connectionError && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💚 ระบบอัปเดตแบบเรียลไทม์ผ่าน Firebase
              </p>
              <p className="text-xs text-gray-500 mt-1">
                อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
              </p>
            </div>
          )}
        </div>
        
        {connectionError && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg max-w-md">
            <p className="text-red-700 text-sm">
              <strong>วิธีแก้ไข:</strong><br/>
              1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต<br/>
              2. ตรวจสอบสถานะเซนเซอร์<br/>
              3. รอสักครู่แล้วลองใหม่
            </p>
          </div>
        )}
      </div>
    </div>
  );
}