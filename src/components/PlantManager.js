// ✅ src/components/PlantManager.js
import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  ref as dbRef,
  push,
  onValue,
  remove,
  set,
  update,
} from "firebase/database";
import { Droplets, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const PERENUAL_KEY = process.env.REACT_APP_PERENUAL_KEY || "";

// 🔹 cache helper
const cacheGet = (k) => {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};
const cacheSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const isThai = (text = "") => /[\u0E00-\u0E7F]/.test(text);

// 🔹 หมวดพืช - ปรับปรุงให้แม่นยำขึ้น
function detectCategory(text = "") {
  const t = text.toLowerCase();
  if (/ผัก|vegetable|herb|basil|mint|คะน้า|กะเพรา|โหระพา|สะระแหน่|ผักชี/.test(t)) return "vegetable";
  if (/ไม้ผล|fruit|มะม่วง|มะละกอ|ทุเรียน|ส้ม|เงาะ|ลำไย|มังคุด/.test(t)) return "fruit";
  if (/ดอก|flower|ornamental|กุหลาบ|กล้วยไม้|เบญจมาศ|มะลิ|ดาวเรือง/.test(t)) return "flower";
  if (/หญ้า|grass/.test(t)) return "grass";
  if (/ไม้ประดับ|ornamental|ficus|ไม้ใบ/.test(t)) return "ornamental";
  if (/สมุนไพร|herb|medicinal/.test(t)) return "herb";
  return "general";
}

// 🔹 ระบบวิเคราะห์ดินและแสงที่แม่นยำ
function analyzeSoilAndLight(plantName = "", summary = "", category = "") {
  const name = plantName.toLowerCase();
  const desc = summary.toLowerCase();
  
  // 🔸 วิเคราะห์จากชื่อพืช (เฉพาะภาษาไทย)
  const plantDatabase = {
    // ผักสวนครัว
    "กะเพรา": { soil: "ดินร่วนซุย", light: "แดดเต็มวัน" },
    "โหระพา": { soil: "ดินร่วนระบายน้ำดี", light: "แดดเต็มวัน" },
    "สะระแหน่": { soil: "ดินร่วนชื้น", light: "แดดรำไร" },
    "ผักชี": { soil: "ดินร่วนปนทราย", light: "แดดเต็มวัน" },
    "ต้นหอม": { soil: "ดินร่วนซุย", light: "แดดเต็มวัน" },
    "คะน้า": { soil: "ดินร่วนปนทราย", light: "แดดเต็มวัน" },
    
    // ไม้ดอก
    "กุหลาบ": { soil: "ดินร่วนปนทราย", light: "แดดเต็มวัน" },
    "กล้วยไม้": { soil: "ดินกล้วยไม้", light: "แสงรำไร" },
    "มะลิ": { soil: "ดินร่วน", light: "แดดเต็มวัน" },
    "เบญจมาศ": { soil: "ดินร่วนระบายน้ำดี", light: "แดดเต็มวัน" },
    "แก้ว": { soil: "ดินร่วน", light: "แดดรำไร" },
    
    // ไม้ผล
    "มะม่วง": { soil: "ดินร่วนปนทราย", light: "แดดเต็มวัน" },
    "มะละกอ": { soil: "ดินร่วนระบายน้ำดี", light: "แดดเต็มวัน" },
    "ทุเรียน": { soil: "ดินร่วนชื้น", light: "แดดเต็มวัน" },
  };

  // 🔸 ค้นหาในฐานข้อมูลพืชไทย
  for (const [key, value] of Object.entries(plantDatabase)) {
    if (name.includes(key)) {
      return value;
    }
  }

  // 🔸 วิเคราะห์จากคำในคำอธิบาย
  if (desc.includes("แดดจัด") || desc.includes("full sun")) {
    return { soil: "ดินร่วนปนทราย", light: "แดดเต็มวัน" };
  }
  if (desc.includes("ร่ม") || desc.includes("รำไร") || desc.includes("partial shade") || desc.includes("shade")) {
    return { soil: "ดินร่วนชื้น", light: "แสงรำไร" };
  }
  if (desc.includes("ชื้น") || desc.includes("moist")) {
    return { soil: "ดินร่วนชื้น", light: "แดดรำไร" };
  }
  if (desc.includes("แห้ง") || desc.includes("dry")) {
    return { soil: "ดินร่วนปนทราย", light: "แดดเต็มวัน" };
  }

  // 🔸 Fallback ตามหมวดหมู่
  const categoryDefaults = {
    vegetable: { soil: "ดินร่วนซุย", light: "แดดเต็มวัน" },
    fruit: { soil: "ดินร่วนปนทราย", light: "แดดเต็มวัน" },
    flower: { soil: "ดินร่วนระบายน้ำดี", light: "แดดเต็มวัน" },
    herb: { soil: "ดินร่วนซุย", light: "แดดเต็มวัน" },
    grass: { soil: "ดินร่วนทั่วไป", light: "แดดเต็มวัน" },
    ornamental: { soil: "ดินร่วน", light: "แดดรำไร" },
    general: { soil: "ดินร่วนทั่วไป", light: "แดดปานกลาง" }
  };

  return categoryDefaults[category] || { soil: "ดินร่วนทั่วไป", light: "แดดปานกลาง" };
}

// 🔹 คำนวณปริมาณน้ำที่เหมาะสม
function computeWater(category, container, plantName = "") {
  const name = plantName.toLowerCase();
  
  // 🔸 ฐานข้อมูลน้ำสำหรับพืชไทย
  const waterDatabase = {
    "กะเพรา": 250,
    "โหระพา": 250,
    "สะระแหน่": 300,
    "ผักชี": 200,
    "ต้นหอม": 180,
    "คะน้า": 350,
    "กุหลาบ": 400,
    "กล้วยไม้": 150,
    "มะลิ": 300,
    "เบญจมาศ": 280,
    "แก้ว": 320,
    "มะม่วง": 500,
    "มะละกอ": 450,
    "ทุเรียน": 600,
  };

  // 🔸 ค้นหาในฐานข้อมูล
  for (const [key, value] of Object.entries(waterDatabase)) {
    if (name.includes(key)) {
      const baseMl = value;
      const adjustedMl = container === "pot" ? Math.round(baseMl * 0.8) : baseMl;
      const level = baseMl > 400 ? "มาก" : baseMl > 250 ? "ปานกลาง" : "น้อย";
      return { level, ml: adjustedMl };
    }
  }

  // 🔸 Fallback ตามหมวดหมู่
  const base = {
    vegetable: 200 + Math.random() * 80,
    fruit: 450 + Math.random() * 150,
    flower: 300 + Math.random() * 100,
    herb: 250 + Math.random() * 80,
    grass: 350 + Math.random() * 100,
    ornamental: 280 + Math.random() * 120,
    general: 250 + Math.random() * 100,
  }[category];

  const adjustedMl = container === "pot" ? Math.round(base * 0.8) : Math.round(base);
  const level = base > 400 ? "มาก" : base > 250 ? "ปานกลาง" : "น้อย";
  
  return { level, ml: adjustedMl };
}

// 🔹 ดึงข้อมูลจาก Wikipedia
async function fetchWikipedia(name) {
  try {
    const q = encodeURIComponent(name.trim());
    const lang = isThai(name) ? "th" : "en";
    const s = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${q}&srlimit=1`
    ).then((r) => r.json());
    if (!s.query?.search?.length) return null;
    const title = s.query.search[0].title;
    const sum = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        title
      )}`
    ).then((r) => r.json());
    return {
      source: `wikipedia(${lang})`,
      name: sum.title,
      summary: sum.extract,
      image:
        sum.thumbnail?.source ||
        sum.originalimage?.source ||
        "https://img.icons8.com/color/96/000000/plant-under-sun.png",
    };
  } catch {
    return null;
  }
}

// 🔹 ดึงข้อมูลจาก Perenual
async function fetchPerenual(name) {
  if (!PERENUAL_KEY) return null;
  try {
    const query = encodeURIComponent(name);
    const url = `https://perenual.com/api/species-list?key=${PERENUAL_KEY}&q=${query}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const plant = data.data?.[0];
    if (!plant) return null;
    return {
      source: "perenual",
      name: plant.common_name || name,
      summary: plant.description || plant.brief_description || "",
      image:
        plant.default_image?.regular_url ||
        plant.default_image?.medium_url ||
        "https://img.icons8.com/color/96/000000/plant-under-sun.png",
    };
  } catch {
    return null;
  }
}

export default function PlantManager() {
  const [query, setQuery] = useState("");
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [containerType, setContainerType] = useState("ground");
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const plantsRef = useRef(dbRef(db, "/plants"));

  // 🔸 โหลดจาก Firebase
  useEffect(() => {
    const plantsUnsubscribe = onValue(plantsRef.current, (snap) => {
      const val = snap.val() || {};
      setPlants(Object.entries(val).map(([id, data]) => ({ id, ...data })));
    });

    // โหลดสถานะต้นไม้ที่ถูกเลือกรดน้ำ
    const controlUnsubscribe = onValue(dbRef(db, "control"), (snap) => {
      const data = snap.val();
      if (data && data.selectedPlant) {
        setSelectedPlant(data.selectedPlant);
      } else {
        setSelectedPlant(null);
      }
    });

    // โหลดประวัติการค้นหา
    const savedHistory = localStorage.getItem('plantSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    return () => {
      plantsUnsubscribe();
      controlUnsubscribe();
    };
  }, []);

  // 🔸 เพิ่มต้นไม้
  const addPlant = async () => {
    if (!query.trim()) {
      toast.error("กรุณากรอกชื่อต้นไม้");
      return;
    }

    const name = query.trim();
    if (plants.some((p) => p.displayName === name)) {
      toast.error("ต้นไม้ชื่อนี้มีอยู่แล้ว");
      return;
    }

    setLoading(true);
    const cacheKey = `plant:${name.toLowerCase()}`;
    let info = cacheGet(cacheKey);
    
    const loadingToast = toast.loading(`กำลังค้นหาข้อมูล "${name}"...`);
    
    try {
      if (!info) {
        info = (await fetchPerenual(name)) || (await fetchWikipedia(name));
        if (info) cacheSet(cacheKey, info);
      }
      
      if (!info) {
        toast.error(`ไม่พบข้อมูลต้นไม้ "${name}"`, { id: loadingToast });
        setLoading(false);
        return;
      }

      const cat = detectCategory(info.summary + " " + info.name);
      const soilLight = analyzeSoilAndLight(info.name, info.summary, cat);
      const water = computeWater(cat, containerType, info.name);

      const newPlant = {
        displayName: info.name || name,
        summary: info.summary || "ไม่มีข้อมูล",
        image: info.image,
        soil: soilLight.soil,
        light: soilLight.light,
        category: cat,
        waterLevel: water.level,
        waterMl: water.ml,
        containerType,
        addedAt: new Date().toISOString(),
      };

      await set(push(plantsRef.current), newPlant);
      
      // บันทึกประวัติการค้นหา
      const updatedHistory = [name, ...searchHistory.filter(item => item !== name)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('plantSearchHistory', JSON.stringify(updatedHistory));
      
      toast.success(`เพิ่ม "${info.name || name}" สำเร็จ! 🌿`, { id: loadingToast });
      setQuery("");
      
    } catch (error) {
      console.error("Error adding plant:", error);
      toast.error('ไม่สามารถเพิ่มต้นไม้ได้ กรุณาลองใหม่', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const deletePlant = async (id) => {
    const plantToDelete = plants.find(plant => plant.id === id);
    if (!plantToDelete) return;

    if (!window.confirm(`ยืนยันการลบ "${plantToDelete.displayName}"?`)) return;
    
    try {
      await remove(dbRef(db, `/plants/${id}`));
      toast.success(`ลบ "${plantToDelete.displayName}" สำเร็จ`);
    } catch (error) {
      console.error("Error deleting plant:", error);
      toast.error("ไม่สามารถลบต้นไม้ได้");
    }
  };

  // 🔸 ระบบเลือกรดน้ำอัตโนมัติ
  const handleSelectPlant = async (plantName) => {
    try {
      await update(dbRef(db, "control"), {
        selectedPlant: plantName,
        command: "AUTO_WATER",
        last_watered: new Date().toISOString(),
      });
      setSelectedPlant(plantName);
      toast.success(`ตั้งค่ารดน้ำอัตโนมัติสำหรับ "${plantName}" 💧`);
    } catch (error) {
      console.error("Error selecting plant:", error);
      toast.error("ไม่สามารถตั้งค่ารดน้ำอัตโนมัติได้");
    }
  };

  const handleDeselectPlant = async () => {
    try {
      await update(dbRef(db, "control"), {
        selectedPlant: null,
        command: "STOP_WATER",
      });
      setSelectedPlant(null);
      toast.success("ยกเลิกการเลือกรดน้ำอัตโนมัติแล้ว");
    } catch (error) {
      console.error("Error deselecting plant:", error);
      toast.error("ไม่สามารถยกเลิกการเลือกรดน้ำได้");
    }
  };

  const handleSelectFromHistory = (plantName) => {
    setQuery(plantName);
  };

  const total = plants.length;
  const waterSum = plants.reduce((a, p) => a + (p.waterMl || 0), 0);

  // ต้นไม้แนะนำ
  const suggestedPlants = [
    "กะเพรา", "โหระพา", "สะระแหน่", "ผักชี", 
    "กุหลาบ", "มะลิ", "กล้วยไม้", "เบญจมาศ"
  ];

  return (
    <div style={{ 
      padding: "20px", 
      background: "linear-gradient(to bottom right, #eaffea, #e4f9e4)", 
      minHeight: "100vh",
      fontFamily: "'Prompt', sans-serif"
    }}>
      {/* แบนเนอร์แสดงต้นไม้ที่ถูกเลือก */}
      {selectedPlant && (
        <div style={{
          background: "linear-gradient(135deg, #0077cc, #00a8ff)",
          color: "white",
          padding: "15px 20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0, 119, 204, 0.3)",
          animation: "slideDown 0.3s ease-out"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            <CheckCircle size={24} style={{ color: "#4cd137", flexShrink: 0 }} />
            <div style={{ flex: 1, margin: "0 15px" }}>
              <strong style={{ display: "block", fontSize: "0.9rem", marginBottom: "2px" }}>
                กำลังเลือกรดน้ำอัตโนมัติ:
              </strong>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{selectedPlant}</span>
            </div>
            <button
              onClick={handleDeselectPlant}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
              onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}

      <h2 style={{ 
        textAlign: "center", 
        color: "#0b7a57", 
        marginBottom: "20px",
        fontSize: "1.8rem",
        fontWeight: "bold"
      }}>
        🌿 จัดการต้นไม้ของฉัน — AquaSense AI
      </h2>

      {/* ช่องค้นหาและเพิ่มต้นไม้ */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        justifyContent: "center", 
        marginBottom: "15px", 
        flexWrap: "wrap" 
      }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addPlant()}
          placeholder="พิมพ์ชื่อพืช เช่น กะเพรา โหระพา กุหลาบ..."
          style={{
            width: "60%",
            minWidth: "250px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #cfeee0",
            fontSize: "16px",
            outline: "none"
          }}
        />
        <select
          value={containerType}
          onChange={(e) => setContainerType(e.target.value)}
          style={{ 
            padding: "12px", 
            borderRadius: "10px", 
            fontSize: "16px",
            border: "1px solid #cfeee0"
          }}
        >
          <option value="ground">ปลูกลงดิน</option>
          <option value="pot">ปลูกในกระถาง</option>
        </select>
        <button
          onClick={addPlant}
          disabled={loading || !query.trim()}
          style={{
            background: loading ? "#ccc" : "#0b7a57",
            color: "white",
            padding: "12px 20px",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          {loading ? "⏳" : "➕"} 
          {loading ? "กำลังค้นหา..." : "เพิ่มต้นไม้"}
        </button>
      </div>

      {/* ประวัติการค้นหาและคำแนะนำ */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}>
        {/* ประวัติการค้นหา */}
        {searchHistory.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>
              🔍 ค้นหาล่าสุด:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {searchHistory.map((plant, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectFromHistory(plant)}
                  style={{
                    background: "#e8f5e8",
                    border: "1px solid #c8e6c9",
                    borderRadius: "15px",
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    color: "#2e7d32",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {plant}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ต้นไม้แนะนำ */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>
            💡 ลองค้นหา:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {suggestedPlants.map(plant => (
              <button
                key={plant}
                onClick={() => handleSelectFromHistory(plant)}
                style={{
                  background: "#fff3e0",
                  border: "1px solid #ffcc80",
                  borderRadius: "15px",
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  color: "#e65100",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {plant}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ 
        textAlign: "center", 
        color: "#145a3f", 
        marginBottom: "20px", 
        fontSize: "14px" 
      }}>
        แหล่งข้อมูล: Perenual → Wikipedia (สำรอง) - ข้อมูลครบถ้วนและรูปภาพสวยงาม
      </div>

      {/* สรุปข้อมูล */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "15px", 
        marginBottom: "25px", 
        flexWrap: "wrap" 
      }}>
        <div style={{ 
          background: "white", 
          borderRadius: "12px", 
          padding: "15px 25px", 
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)", 
          minWidth: "140px", 
          textAlign: "center",
          border: "2px solid #e8f5e9"
        }}>
          <div style={{ fontSize: "14px", color: "#666" }}>ต้นไม้ทั้งหมด</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0b7a57" }}>{total}</div>
        </div>
        <div style={{ 
          background: "white", 
          borderRadius: "12px", 
          padding: "15px 25px", 
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)", 
          minWidth: "180px", 
          textAlign: "center",
          border: "2px solid #e3f2fd"
        }}>
          <div style={{ fontSize: "14px", color: "#666" }}>น้ำรวมที่ต้องการ</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1976d2" }}>{waterSum} ml / วัน</div>
        </div>
      </div>

      {/* รายการต้นไม้ */}
      {plants.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "#666" 
        }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>🌱</div>
          <p>ยังไม่มีต้นไม้ในระบบ</p>
          <p style={{ fontSize: "14px" }}>เพิ่มต้นไม้แรกของคุณโดยพิมพ์ชื่อด้านบน หรือเลือกจากคำแนะนำ</p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
          gap: "20px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {plants.map((p) => (
            <div key={p.id} style={{ 
              background: "white", 
              borderRadius: "16px", 
              padding: "20px", 
              boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
              border: selectedPlant === p.displayName ? "2px solid #0077cc" : "1px solid #e0e0e0",
              transition: "all 0.3s ease",
              cursor: "pointer",
              position: "relative"
            }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
            }} 
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              
              {/* Badge แสดงสถานะถูกเลือก */}
              {selectedPlant === p.displayName && (
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  right: "20px",
                  background: "#0077cc",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 2px 8px rgba(0, 119, 204, 0.3)"
                }}>
                  <CheckCircle size={16} />
                  กำลังเลือกรดน้ำอัตโนมัติ
                </div>
              )}

              <img 
                src={p.image} 
                alt={p.displayName} 
                style={{ 
                  width: "100%", 
                  height: "200px", 
                  objectFit: "cover", 
                  borderRadius: "12px",
                  marginBottom: "15px"
                }} 
                onError={(e) => {
                  e.target.src = "https://img.icons8.com/color/96/000000/plant-under-sun.png";
                }}
              />
              
              <h3 style={{ 
                margin: "0 0 12px 0", 
                color: "#0b7a57", 
                fontSize: "18px",
                fontWeight: "bold"
              }}>
                {p.displayName}
              </h3>
              
              <div style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "15px" }}>
                <p>💧 <strong>รดน้ำ:</strong> {p.waterLevel} ({p.waterMl} ml/วัน)</p>
                <p>🌱 <strong>ดิน:</strong> {p.soil}</p>
                <p>☀️ <strong>แสง:</strong> {p.light}</p>
                <p>🪴 <strong>วิธีปลูก:</strong> {p.containerType === "pot" ? "ปลูกในกระถาง" : "ปลูกลงดิน"}</p>
              </div>
              
              {p.summary && p.summary !== "ไม่มีข้อมูล" && (
                <p style={{ 
                  fontSize: "13px", 
                  color: "#444", 
                  marginBottom: "15px",
                  lineHeight: "1.4",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {p.summary}
                </p>
              )}
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleSelectPlant(p.displayName)}
                  disabled={selectedPlant === p.displayName}
                  style={{
                    background: selectedPlant === p.displayName ? "#4cd137" : "#0077cc",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px",
                    cursor: selectedPlant === p.displayName ? "not-allowed" : "pointer",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    if (selectedPlant !== p.displayName) {
                      e.target.style.background = "#005fa3";
                      e.target.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedPlant !== p.displayName) {
                      e.target.style.background = "#0077cc";
                      e.target.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <Droplets size={16} />
                  {selectedPlant === p.displayName ? 'กำลังเลือกรดน้ำ' : 'เลือกรดน้ำอัตโนมัติ'}
                </button>
                
                <button
                  onClick={() => deletePlant(p.id)}
                  style={{
                    background: "#ff6b6b",
                    border: "none",
                    color: "white",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#ff4d4d";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#ff6b6b";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}