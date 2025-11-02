// ✅ src/services/NotificationService.js
import { ref, push, onValue, set } from "firebase/database";
import { db } from "../firebase";

class NotificationService {
  constructor() {
    this.notificationsRef = ref(db, "notifications");
    this.messagesRef = ref(db, "messages");
  }

  // 🔹 ส่งการแจ้งเตือนไปยัง ESP32
  async sendToESP32(message, type = "INFO", priority = "MEDIUM") {
    try {
      const notification = {
        message,
        type,
        priority,
        timestamp: new Date().toISOString(),
        read: false,
        source: "WEB_APP"
      };

      // บันทึกลง Firebase (ESP32 จะอ่านจากนี้)
      await push(this.messagesRef, notification);
      
      console.log(`📢 Sent to ESP32: ${message}`);
      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  // 🔹 แจ้งเตือนความชื้นดินต่ำ
  async notifyLowSoilMoisture(plantName, moistureLevel) {
    const message = `🚨 ความชื้นดินต่ำ! ${plantName} มีความชื้น ${moistureLevel}% จำเป็นต้องรดน้ำด่วน`;
    return await this.sendToESP32(message, "CRITICAL", "HIGH");
  }

  // 🔹 แจ้งเตือนอุณหภูมิสูง
  async notifyHighTemperature(temperature) {
    const message = `🌡️ อุณหภูมิสูงเกินไป! ${temperature}°C อาจทำลายพืช`;
    return await this.sendToESP32(message, "WARNING", "HIGH");
  }

  // 🔹 แจ้งเตือนการรดน้ำสำเร็จ
  async notifyWateringSuccess(plantName, waterAmount) {
    const message = `💧 รดน้ำสำเร็จ! ${plantName} ได้รับน้ำ ${waterAmount}ml`;
    return await this.sendToESP32(message, "SUCCESS", "LOW");
  }

  // 🔹 แจ้งเตือนโหมดอัตโนมัติ
  async notifyAutoModeChange(enabled, plantName = null) {
    const message = enabled 
      ? `🤖 เปิดโหมดอัตโนมัติ${plantName ? ` สำหรับ ${plantName}` : ''}`
      : `🔴 ปิดโหมดอัตโนมัติ`;
    return await this.sendToESP32(message, "SYSTEM", "MEDIUM");
  }

  // 🔹 แจ้งเตือนข้อผิดพลาด
  async notifyError(errorType, details = "") {
    const message = `⚠️ ข้อผิดพลาดระบบ: ${errorType} ${details}`;
    return await this.sendToESP32(message, "ERROR", "HIGH");
  }

  // 🔹 ส่งคำสั่งไปยัง ESP32
  async sendCommand(command, value = null) {
    try {
      const commandData = {
        command,
        value,
        timestamp: new Date().toISOString(),
        executed: false
      };

      await set(ref(db, "esp32/command"), commandData);
      console.log(`📡 Command sent: ${command}`);
      return true;
    } catch (error) {
      console.error("Error sending command:", error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();