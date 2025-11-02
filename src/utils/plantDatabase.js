// src/utils/plantDatabase.js
export const localPlantDatabase = {
  "ต้นหอม": {
    name: "ต้นหอม",
    watering: "ปานกลาง",
    sunlight: "แสงแดดรำไร", 
    description: "พืชสมุนไพรใช้ประกอบอาหาร ปลูกง่าย โตเร็ว ต้องการน้ำพอประมาณ",
    image_url: "https://img.freepik.com/free-photo/green-spring-onions_1353-238.jpg?w=200",
    water_per_day: 120,
    soil: "ดินร่วนซุย"
  },
  "โหระพา": {
    name: "โหระพา",
    watering: "ปานกลาง",
    sunlight: "แดดเต็มวัน",
    description: "พืชสมุนไพรกลิ่นหอม ใช้ทำอาหารไทย ต้องการแดดจัด",
    image_url: "https://img.freepik.com/free-photo/fresh-basil-leaves_1353-259.jpg?w=200",
    water_per_day: 150,
    soil: "ดินร่วนระบายน้ำดี"
  },
  "กะเพรา": {
    name: "กะเพรา", 
    watering: "ปานกลาง",
    sunlight: "แดดเต็มวัน",
    description: "พืชสมุนไพรคู่ครัวไทย ปลูกง่ายทนแล้ง กลิ่นหอมแรง",
    image_url: "https://img.freepik.com/free-photo/holy-basil-leaves_1353-238.jpg?w=200",
    water_per_day: 140,
    soil: "ดินร่วนปนทราย"
  },
  "สะระแหน่": {
    name: "สะระแหน่",
    watering: "มาก",
    sunlight: "แสงรำไร",
    description: "พืชสมุนไพรกลิ่นหอมเย็น ใช้ทำเครื่องดื่ม ต้องการความชื้นสูง",
    image_url: "https://img.freepik.com/free-photo/fresh-mint-leaves_1353-238.jpg?w=200",
    water_per_day: 180,
    soil: "ดินร่วนชื้น"
  },
  "ผักชี": {
    name: "ผักชี",
    watering: "มาก", 
    sunlight: "แสงรำไร",
    description: "พืชสมุนไพรใช้ตกแต่งอาหาร กลิ่นหอมเฉพาะตัว ปลูกในที่ร่ม",
    image_url: "https://img.freepik.com/free-photo/fresh-coriander-leaves_1353-238.jpg?w=200",
    water_per_day: 160,
    soil: "ดินร่วนชื้น"
  },
  "พริก": {
    name: "พริก",
    watering: "น้อย",
    sunlight: "แดดเต็มวัน", 
    description: "พืชผักผลไม้รสเผ็ด ปลูกได้ตลอดปี ทนแล้งได้ดี",
    image_url: "https://img.freepik.com/free-photo/fresh-chili-peppers_1353-238.jpg?w=200",
    water_per_day: 100,
    soil: "ดินร่วนปนทราย"
  },
  "มะเขือเทศ": {
    name: "มะเขือเทศ",
    watering: "ปานกลาง",
    sunlight: "แดดเต็มวัน",
    description: "พืชผักผลไม้ ใช้ทำอาหารได้หลากหลาย ต้องการแดดมาก",
    image_url: "https://img.freepik.com/free-photo/ripe-tomatoes_1353-238.jpg?w=200",
    water_per_day: 200,
    soil: "ดินร่วนระบายน้ำดี"
  },
  "แตงกวา": {
    name: "แตงกวา", 
    watering: "มาก",
    sunlight: "แดดเต็มวัน",
    description: "พืชผักผลไม้รสเย็นฉ่ำน้ำ ต้องการน้ำมากและแดดเต็มที่",
    image_url: "https://img.freepik.com/free-photo/fresh-cucumbers_1353-238.jpg?w=200",
    water_per_day: 220,
    soil: "ดินร่วนชื้น"
  }
};

export const searchLocalDatabase = (plantName) => {
  const normalizedQuery = plantName.toLowerCase().trim();
  
  // ค้นหาตรงกัน
  for (const [key, value] of Object.entries(localPlantDatabase)) {
    if (key.toLowerCase() === normalizedQuery) {
      return { ...value, source: 'local' };
    }
  }
  
  // ค้นหาจากคำใกล้เคียง
  const closeMatches = Object.keys(localPlantDatabase).filter(key => 
    key.toLowerCase().includes(normalizedQuery) ||
    normalizedQuery.includes(key.toLowerCase())
  );
  
  if (closeMatches.length > 0) {
    return { 
      ...localPlantDatabase[closeMatches[0]], 
      name: plantName,
      source: 'local_suggested' 
    };
  }
  
  return null;
};

export const getSuggestedPlants = () => {
  return Object.keys(localPlantDatabase);
};