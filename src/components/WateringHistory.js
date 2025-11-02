// ✅ src/components/WateringHistory.js
import React, { useState, useEffect } from "react";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";
import { db } from "../firebase";
import { Filter, Search, Calendar, Droplets, CheckCircle, XCircle } from "lucide-react";

export default function WateringHistory() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("all"); // all, auto, manual
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // โหลดประวัติการรดน้ำจาก Firebase
    const historyRef = ref(db, "wateringHistory");
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.entries(data).map(([id, item]) => ({
          id,
          ...item
        })).reverse(); // เรียงจากใหม่ไปเก่า
        
        setHistory(historyArray);
      }
    });

    return () => unsubscribe();
  }, []);

  // กรองข้อมูล
  const filteredHistory = history.filter(item => {
    const matchesFilter = filter === "all" || item.type === filter.toUpperCase();
    const matchesSearch = item.plantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle size={16} color="#4caf50" />;
      case "FAILED":
        return <XCircle size={16} color="#f44336" />;
      default:
        return <Droplets size={16} color="#2196f3" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "#4caf50";
      case "FAILED":
        return "#f44336";
      default:
        return "#2196f3";
    }
  };

  return (
    <div style={{
      padding: "30px",
      background: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
      minHeight: "100vh",
      fontFamily: "'Prompt', sans-serif"
    }}>
      <div style={{
        maxWidth: "1000px",
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
            <Calendar size={28} />
            ประวัติการรดน้ำ
          </h1>
        </div>

        {/* Filters and Search */}
        <div style={{
          display: "flex",
          gap: "15px",
          marginBottom: "25px",
          flexWrap: "wrap"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "white",
            borderRadius: "8px",
            padding: "8px 12px",
            flex: "1",
            minWidth: "250px"
          }}>
            <Search size={18} color="#666" />
            <input
              type="text"
              placeholder="ค้นหาชื่อต้นไม้หรือข้อความ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                padding: "5px 10px",
                width: "100%",
                fontSize: "14px"
              }}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              background: "white",
              fontSize: "14px",
              minWidth: "150px"
            }}
          >
            <option value="all">ทั้งหมด</option>
            <option value="auto">อัตโนมัติ</option>
            <option value="manual">มือ</option>
          </select>
        </div>

        {/* History List */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          padding: "20px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
        }}>
          {filteredHistory.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#666"
            }}>
              <Droplets size={48} color="#ddd" />
              <p style={{ margin: "10px 0 0 0" }}>ไม่มีประวัติการรดน้ำ</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gap: "12px"
            }}>
              {filteredHistory.map((event, index) => (
                <div
                  key={event.id || index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    padding: "15px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    background: "#fafafa",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f0f0f0";
                    e.currentTarget.style.transform = "translateX(5px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: getStatusColor(event.status),
                    flexShrink: 0
                  }}>
                    {getStatusIcon(event.status)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "5px"
                    }}>
                      <h4 style={{
                        margin: 0,
                        color: "#333",
                        fontSize: "16px"
                      }}>
                        {event.plantName || "ไม่ระบุชื่อต้นไม้"}
                      </h4>
                      <span style={{
                        fontSize: "12px",
                        color: "#666",
                        background: "#e0e0e0",
                        padding: "2px 8px",
                        borderRadius: "10px"
                      }}>
                        {event.type === "AUTO" ? "อัตโนมัติ" : "มือ"}
                      </span>
                    </div>
                    
                    <p style={{
                      margin: "0 0 5px 0",
                      color: "#666",
                      fontSize: "14px"
                    }}>
                      {event.message || `รดน้ำ ${event.waterAmount || 0}ml`}
                    </p>

                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{
                        fontSize: "12px",
                        color: "#999"
                      }}>
                        {event.timestamp ? new Date(event.timestamp).toLocaleString('th-TH') : "ไม่ระบุเวลา"}
                      </span>
                      
                      {event.waterAmount && (
                        <span style={{
                          fontSize: "12px",
                          color: "#2196f3",
                          fontWeight: "500"
                        }}>
                          💧 {event.waterAmount}ml
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredHistory.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginTop: "20px"
          }}>
            <SummaryCard
              title="ทั้งหมด"
              value={filteredHistory.length}
              color="#74b9ff"
            />
            <SummaryCard
              title="อัตโนมัติ"
              value={filteredHistory.filter(item => item.type === "AUTO").length}
              color="#00b894"
            />
            <SummaryCard
              title="ด้วยมือ"
              value={filteredHistory.filter(item => item.type === "MANUAL").length}
              color="#fd79a8"
            />
            <SummaryCard
              title="น้ำใช้ไป"
              value={`${filteredHistory.reduce((sum, item) => sum + (item.waterAmount || 0), 0)}ml`}
              color="#fdcb6e"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "10px",
      padding: "15px",
      textAlign: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      <div style={{
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: color,
        marginBottom: "5px"
      }}>
        {value}
      </div>
      <div style={{
        fontSize: "0.9rem",
        color: "#666"
      }}>
        {title}
      </div>
    </div>
  );
}