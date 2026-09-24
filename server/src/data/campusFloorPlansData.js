/**
 * 20-Rai Campus Topology Data for FTI Portal
 * Auto-generated complete multi-building topology:
 * 1 Campus Master Plan + 5 Office Buildings (16 floors total) + 5 Warehouses (5 floors total)
 * Total 21 floor plans with rich 2D assets and vehicles.
 */

export const CAMPUS_FACILITIES = [
  {
    "id": "campus",
    "name": "ผังบริเวณพื้นที่ทั้งหมด (Campus Master Plan)",
    "shortName": "ผังบริเวณพื้นที่ทั้งหมด",
    "type": "campus",
    "totalFloors": 1,
    "icon": "🌐",
    "description": "ภาพรวมพื้นที่ทั้งหมด (~32,000 ตร.ม.) เชื่อมต่อ 5 อาคารสำนักงาน, 5 โกดังสินค้า, ป้อม รปภ. และระบบ CCTV รอบแนวรั้ว"
  },
  {
    "id": "b1",
    "name": "อาคาร 1: สำนักงานใหญ่ (HQ Building)",
    "shortName": "อาคาร 1 (HQ)",
    "type": "office",
    "totalFloors": 4,
    "icon": "🏢",
    "description": "อาคารอำนวยการใหญ่ 4 ชั้น: ผู้บริหาร, ฝ่ายบุคคล (HR), ฝ่ายไอที (IT), ฝ่ายการเงิน และห้องประชุมสัมมนา"
  },
  {
    "id": "b2",
    "name": "อาคาร 2: วิศวกรรมและเทคโนโลยี (Engineering & Ops)",
    "shortName": "อาคาร 2 (วิศวกรรม)",
    "type": "office",
    "totalFloors": 3,
    "icon": "⚙️",
    "description": "อาคาร 3 ชั้น: ฝ่ายวิศวกรรมการผลิต, งานควบคุมระบบอัตโนมัติ และฝ่ายความปลอดภัย EHS"
  },
  {
    "id": "b3",
    "name": "อาคาร 3: วิจัยและพัฒนา (R&D Innovation Hub)",
    "shortName": "อาคาร 3 (R&D)",
    "type": "office",
    "totalFloors": 3,
    "icon": "🔬",
    "description": "อาคาร 3 ชั้น: ห้องปฏิบัติการทดสอบ, ทีมพัฒนาซอฟต์แวร์ และห้องทดลองวัสดุใหม่"
  },
  {
    "id": "b4",
    "name": "อาคาร 4: พาณิชย์และการตลาด (Commercial & Sales)",
    "shortName": "อาคาร 4 (การตลาด)",
    "type": "office",
    "totalFloors": 3,
    "icon": "💼",
    "description": "อาคาร 3 ชั้น: โชว์รูมผลิตภัณฑ์, ฝ่ายขายในและต่างประเทศ และสตูดิโอดิจิทัลมีเดีย"
  },
  {
    "id": "b5",
    "name": "อาคาร 5: บริการและสวัสดิการพนักงาน (Employee Services)",
    "shortName": "อาคาร 5 (สวัสดิการ)",
    "type": "office",
    "totalFloors": 3,
    "icon": "🏥",
    "description": "อาคาร 3 ชั้น: โรงอาหารส่วนกลาง, ห้องพยาบาล & ฟิตเนส และศูนย์ฝึกอบรมสถาบัน FTI Academy"
  },
  {
    "id": "w1",
    "name": "โกดัง 1: คลังวัตถุดิบหลัก (Raw Materials Warehouse)",
    "shortName": "โกดัง 1 (วัตถุดิบ)",
    "type": "warehouse",
    "totalFloors": 1,
    "icon": "🏭",
    "description": "พื้นที่จัดเก็บวัตถุดิบนำเข้า ชั้นวาง High-bay Racking และจุดรับสินค้าขาเข้า (Inbound Dock)"
  },
  {
    "id": "w2",
    "name": "โกดัง 2: คลังสินค้าสำเร็จรูป (Finished Goods Warehouse)",
    "shortName": "โกดัง 2 (สินค้าสำเร็จรูป)",
    "type": "warehouse",
    "totalFloors": 1,
    "icon": "📦",
    "description": "ศูนย์คัดแยกพาเลทสินค้าพร้อมส่ง ชานชาลาขนถ่าย (Outbound Dock) และระบบตรวจเช็ก RFID"
  },
  {
    "id": "w3",
    "name": "โกดัง 3: คลังบรรจุภัณฑ์ (Packaging Depot)",
    "shortName": "โกดัง 3 (บรรจุภัณฑ์)",
    "type": "warehouse",
    "totalFloors": 1,
    "icon": "🏷️",
    "description": "พื้นที่จัดเก็บกล่อง ลัง กระดาษ ฟิล์มห่อ และอุปกรณ์บรรจุภัณฑ์มาตรฐานสากล"
  },
  {
    "id": "w4",
    "name": "โกดัง 4: ศูนย์กระจายสินค้าด่วน (Express Fulfillment Hub)",
    "shortName": "โกดัง 4 (กระจายสินค้า)",
    "type": "warehouse",
    "totalFloors": 1,
    "icon": "🚚",
    "description": "ศูนย์กระจายสินค้าแบบ Cross-docking สำหรับขนส่งเร่งด่วน 24 ชั่วโมง"
  },
  {
    "id": "w5",
    "name": "โกดัง 5: คลังควบคุมอุณหภูมิ (Cold Chain & Sensitive Storage)",
    "shortName": "โกดัง 5 (ห้องเย็น & ควบคุม)",
    "type": "warehouse",
    "totalFloors": 1,
    "icon": "❄️",
    "description": "คลังสินค้าปรับอากาศและห้องเย็น ควบคุมอุณหภูมิ 15-25°C และ 2-8°C พร้อมระบบแจ้งเตือนฉุกเฉิน"
  }
];

export const INITIAL_CAMPUS_PLANS = [
  {
    "name": "ผังบริเวณพื้นที่ทั้งหมด (Campus Master Plan)",
    "buildingId": "campus",
    "buildingName": "ผังบริเวณพื้นที่ทั้งหมด (Campus Master Plan)",
    "buildingType": "campus",
    "floorNumber": 0,
    "floorName": "พื้นที่ทั้งหมด",
    "totalFloors": 1,
    "gridSize": 20,
    "scaleMetersPerGrid": 2.5,
    "canvasWidth": 1200,
    "canvasHeight": 800,
    "rooms": [
      {
        "id": "camp-b1",
        "name": "🏢 อาคาร 1: สำนักงานใหญ่ HQ (4 ชั้น)",
        "department": "สำนักงานผู้บริหาร & HR & IT",
        "x": 80,
        "y": 80,
        "width": 240,
        "height": 180,
        "color": "#bfdbfe",
        "description": "อาคาร 4 ชั้น ประตูทางเข้าหลัก เชื่อมต่อฝ่ายบริหาร ไอที บุคคล และการเงิน (คลิกเพื่อเข้าดูผังชั้น 1-4)",
        "extension": "1000",
        "capacity": 150,
        "targetBuildingId": "b1"
      },
      {
        "id": "camp-b2",
        "name": "⚙️ อาคาร 2: วิศวกรรม & เทคโนโลยี (3 ชั้น)",
        "department": "วิศวกรรม & ปฏิบัติการ",
        "x": 360,
        "y": 80,
        "width": 200,
        "height": 160,
        "color": "#e2e8f0",
        "description": "อาคารวิศวกรรม 3 ชั้น ห้องควบคุมโรงงานและฝ่ายซ่อมบำรุง (คลิกเพื่อเข้าดูผัง)",
        "extension": "2000",
        "capacity": 90,
        "targetBuildingId": "b2"
      },
      {
        "id": "camp-b3",
        "name": "🔬 อาคาร 3: วิจัยและพัฒนา R&D (3 ชั้น)",
        "department": "วิจัยและพัฒนา R&D",
        "x": 600,
        "y": 80,
        "width": 200,
        "height": 160,
        "color": "#ccfbf1",
        "description": "ศูนย์นวัตกรรม R&D 3 ชั้น ห้อง Lab และทีมเทคโนโลยี (คลิกเพื่อเข้าดูผัง)",
        "extension": "3000",
        "capacity": 80,
        "targetBuildingId": "b3"
      },
      {
        "id": "camp-b4",
        "name": "💼 อาคาร 4: พาณิชย์ & การตลาด (3 ชั้น)",
        "department": "ฝ่ายขายและการตลาด",
        "x": 840,
        "y": 80,
        "width": 200,
        "height": 160,
        "color": "#fef3c7",
        "description": "โชว์รูมลูกค้าและสำนักงานฝ่ายพาณิชย์ 3 ชั้น (คลิกเพื่อเข้าดูผัง)",
        "extension": "4000",
        "capacity": 100,
        "targetBuildingId": "b4"
      },
      {
        "id": "camp-b5",
        "name": "🏥 อาคาร 5: บริการ & สวัสดิการ (3 ชั้น)",
        "department": "สวัสดิการ & สันทนาการ",
        "x": 80,
        "y": 320,
        "width": 240,
        "height": 160,
        "color": "#bbf7d0",
        "description": "โรงอาหารกลาง ห้องพยาบาล ฟิตเนส และศูนย์ฝึกอบรม (คลิกเพื่อเข้าดูผัง)",
        "extension": "5000",
        "capacity": 250,
        "targetBuildingId": "b5"
      },
      {
        "id": "camp-w1",
        "name": "🏭 โกดัง 1: คลังวัตถุดิบ (Raw Materials)",
        "department": "คลังสินค้า & ซัพพลายเชน",
        "x": 360,
        "y": 320,
        "width": 180,
        "height": 180,
        "color": "#fed7aa",
        "description": "โกดังจัดเก็บวัตถุดิบนำเข้าและชานชาลาตรวจรับ Inbound (คลิกเพื่อเข้าดูผัง)",
        "extension": "6001",
        "capacity": 30,
        "targetBuildingId": "w1"
      },
      {
        "id": "camp-w2",
        "name": "📦 โกดัง 2: สินค้าสำเร็จรูป (Finished Goods)",
        "department": "คลังสินค้า & ซัพพลายเชน",
        "x": 580,
        "y": 320,
        "width": 180,
        "height": 180,
        "color": "#fbcfe8",
        "description": "โกดังสินค้าสำเร็จรูปพร้อมส่ง Outbound Dock (คลิกเพื่อเข้าดูผัง)",
        "extension": "6002",
        "capacity": 35,
        "targetBuildingId": "w2"
      },
      {
        "id": "camp-w3",
        "name": "🏷️ โกดัง 3: คลังบรรจุภัณฑ์ (Packaging Depot)",
        "department": "คลังสินค้า & บรรจุภัณฑ์",
        "x": 800,
        "y": 320,
        "width": 180,
        "height": 180,
        "color": "#e9d5ff",
        "description": "โกดังเก็บบรรจุภัณฑ์ กล่อง ลัง อุปกรณ์แพ็กเกจจิ้ง (คลิกเพื่อเข้าดูผัง)",
        "extension": "6003",
        "capacity": 20,
        "targetBuildingId": "w3"
      },
      {
        "id": "camp-w4",
        "name": "🚚 โกดัง 4: กระจายสินค้าด่วน (Cross-docking)",
        "department": "โลจิสติกส์ & ขนส่งด่วน",
        "x": 360,
        "y": 540,
        "width": 220,
        "height": 180,
        "color": "#fef08a",
        "description": "ศูนย์กระจายสินค้าเร่งด่วน 24 ชม. และชานชาลารถบรรทุก (คลิกเพื่อเข้าดูผัง)",
        "extension": "6004",
        "capacity": 40,
        "targetBuildingId": "w4"
      },
      {
        "id": "camp-w5",
        "name": "❄️ โกดัง 5: คลังควบคุมอุณหภูมิ (Cold Storage)",
        "department": "คลังสินค้าพิเศษ",
        "x": 620,
        "y": 540,
        "width": 220,
        "height": 180,
        "color": "#bae6fd",
        "description": "คลังสินค้าควบคุมอุณหภูมิ 15-25°C และห้องเย็นพิเศษ 2-8°C (คลิกเพื่อเข้าดูผัง)",
        "extension": "6005",
        "capacity": 25,
        "targetBuildingId": "w5"
      },
      {
        "id": "camp-park",
        "name": "🌳 สวนหย่อมและบึงน้ำธรรมชาติ (Green Park & Lake)",
        "department": "สิ่งแวดล้อมส่วนกลาง",
        "x": 80,
        "y": 520,
        "width": 240,
        "height": 200,
        "color": "#a7f3d0",
        "description": "พื้นที่สีเขียวพักผ่อน ลู่วิ่งออกกำลังกาย",
        "extension": "",
        "capacity": 100
      },
      {
        "id": "camp-parking-zone",
        "name": "🅿️ ลานจอดรถผู้บริหารและผู้มาติดต่อ (Visitor & VIP Parking)",
        "department": "ส่วนกลาง",
        "x": 80,
        "y": 250,
        "width": 240,
        "height": 60,
        "color": "#f1f5f9",
        "description": "ลานจอดรถ 30 คัน พร้อมแท่นชาร์จยานยนต์ไฟฟ้า EV",
        "extension": "",
        "capacity": 30
      },
      {
        "id": "camp-gate1",
        "name": "🛡️ ป้อม รปภ. ประตู 1 (Main Security Gate 1)",
        "department": "ฝ่ายความปลอดภัย",
        "x": 10,
        "y": 120,
        "width": 50,
        "height": 80,
        "color": "#cbd5e1",
        "description": "จุดตรวจยานพาหนะ แลกบัตรผู้ติดต่อ",
        "extension": "1991",
        "capacity": 4
      },
      {
        "id": "camp-gate2",
        "name": "🚛 ป้อม รปภ. ประตู 2 (Logistics Gate 2)",
        "department": "ฝ่ายความปลอดภัย",
        "x": 1140,
        "y": 420,
        "width": 50,
        "height": 90,
        "color": "#cbd5e1",
        "description": "จุดชั่งน้ำหนักรถบรรทุกและตรวจเอกสารขนส่ง",
        "extension": "1992",
        "capacity": 4
      }
    ],
    "walls": [
      {
        "id": "w-perim-1",
        "points": [
          10,
          10,
          1190,
          10
        ],
        "strokeWidth": 10,
        "stroke": "#1e293b"
      },
      {
        "id": "w-perim-2",
        "points": [
          1190,
          10,
          1190,
          780
        ],
        "strokeWidth": 10,
        "stroke": "#1e293b"
      },
      {
        "id": "w-perim-3",
        "points": [
          1190,
          780,
          10,
          780
        ],
        "strokeWidth": 10,
        "stroke": "#1e293b"
      },
      {
        "id": "w-perim-4",
        "points": [
          10,
          780,
          10,
          10
        ],
        "strokeWidth": 10,
        "stroke": "#1e293b"
      },
      {
        "id": "w-road-1",
        "points": [
          10,
          300,
          1190,
          300
        ],
        "strokeWidth": 4,
        "stroke": "#94a3b8"
      },
      {
        "id": "w-road-2",
        "points": [
          340,
          10,
          340,
          780
        ],
        "strokeWidth": 4,
        "stroke": "#94a3b8"
      }
    ],
    "doors": [],
    "assets": [
      {
        "id": "camp-cctv-gate1",
        "code": "CCTV-CAMP-01",
        "name": "CCTV ป้อมประตู 1 (Main Gate ANPR)",
        "type": "cctv",
        "x": 60,
        "y": 120,
        "rotation": 0,
        "fovAngle": 90,
        "rangeMeters": 25,
        "status": "active",
        "specs": "Hikvision ANPR 4K License Plate Recognition",
        "assignedTo": "ฝ่ายความปลอดภัย",
        "department": "ฝ่ายความปลอดภัย"
      },
      {
        "id": "camp-cctv-gate2",
        "code": "CCTV-CAMP-02",
        "name": "CCTV ป้อมประตู 2 ขนส่ง (Logistics Gate)",
        "type": "cctv",
        "x": 1140,
        "y": 420,
        "rotation": 180,
        "fovAngle": 90,
        "rangeMeters": 28,
        "status": "active",
        "specs": "Dahua 4K Heavy Duty PTZ",
        "assignedTo": "ฝ่ายความปลอดภัย",
        "department": "ฝ่ายความปลอดภัย"
      },
      {
        "id": "camp-cctv-whdock",
        "code": "CCTV-CAMP-04",
        "name": "CCTV ชานชาลาขนถ่ายโกดัง 1-2",
        "type": "cctv",
        "x": 580,
        "y": 300,
        "rotation": 90,
        "fovAngle": 85,
        "rangeMeters": 25,
        "status": "maintenance",
        "specs": "Hikvision DarkFighter 4K",
        "assignedTo": "ฝ่ายโลจิสติกส์",
        "department": "คลังสินค้า"
      },
      {
        "id": "v-car-ceo",
        "code": "VIP-01",
        "name": "รถประจำตำแหน่งประธานเจ้าหน้าที่บริหาร (CEO)",
        "type": "vehicle_car",
        "x": 110,
        "y": 280,
        "rotation": 0,
        "status": "active",
        "specs": "Mercedes-Benz S 580e AMG Premium (Plug-in Hybrid)",
        "licensePlate": "1กข 8888 กทม.",
        "driverName": "ประธานเจ้าหน้าที่บริหาร (CEO)",
        "parkingSlot": "VIP-01",
        "vehicleModel": "Mercedes-Benz S 580e",
        "department": "ผู้บริหารระดับสูง"
      },
      {
        "id": "v-car-ev1",
        "code": "EV-01",
        "name": "รถยนต์ไฟฟ้าฝ่ายวิศวกรรมไอที (EV)",
        "type": "vehicle_car",
        "x": 160,
        "y": 280,
        "rotation": 0,
        "status": "active",
        "specs": "BYD Seal Performance (AWD 523hp)",
        "licensePlate": "9กผ 9090 กทม.",
        "driverName": "กิตติพัศ ทิพย์แสงวงค์",
        "parkingSlot": "EV-01",
        "vehicleModel": "BYD Seal AWD",
        "department": "เทคโนโลยีสารสนเทศ (IT)"
      },
      {
        "id": "v-car-staff2",
        "code": "CAR-02",
        "name": "รถยนต์ส่วนบุคคลพนักงาน (HR Manager)",
        "type": "vehicle_car",
        "x": 210,
        "y": 280,
        "rotation": 0,
        "status": "active",
        "specs": "Honda Civic e:HEV RS",
        "licensePlate": "5กม 4321 กทม.",
        "driverName": "กาญจนา มงคลสุข",
        "parkingSlot": "P-03",
        "vehicleModel": "Honda Civic RS",
        "department": "ทรัพยากรบุคคล (HR)"
      },
      {
        "id": "v-moto-1",
        "code": "MOTO-01",
        "name": "รถจักรยานยนต์พนักงาน (IT Support)",
        "type": "vehicle_motorcycle",
        "x": 260,
        "y": 280,
        "rotation": 0,
        "status": "active",
        "specs": "Honda PCX 160 ABS",
        "licensePlate": "1กพ 246 เชียงใหม่",
        "driverName": "สมชาย ใจดี",
        "parkingSlot": "M-01",
        "vehicleModel": "Honda PCX 160",
        "department": "เทคโนโลยีสารสนเทศ (IT)"
      },
      {
        "id": "v-ev-chg",
        "code": "EV-STATION-01",
        "name": "สถานีชาร์จยานยนต์ไฟฟ้า FTI Clean Energy",
        "type": "ev_charger",
        "x": 160,
        "y": 255,
        "rotation": 0,
        "status": "active",
        "specs": "ABB Terra DC Fast Charger 50kW Dual CCS2",
        "parkingSlot": "EV-01",
        "department": "ส่วนกลาง"
      },
      {
        "id": "v-truck-inbound",
        "code": "TRUCK-IN-01",
        "name": "รถบรรทุกตู้คอนเทนเนอร์ 10 ล้อ เทียบชานชาลาโกดัง 1",
        "type": "vehicle_truck",
        "x": 420,
        "y": 270,
        "rotation": 0,
        "status": "active",
        "specs": "Isuzu Giga 360 Heavy Container Bed",
        "licensePlate": "71-4567 สระบุรี",
        "driverName": "อนุชา ขนส่งดี",
        "parkingSlot": "Dock-01",
        "vehicleModel": "Isuzu Giga 10-Wheel",
        "department": "คลังสินค้า & ซัพพลายเชน"
      },
      {
        "id": "v-truck-outbound",
        "code": "TRUCK-OUT-02",
        "name": "รถบรรทุกพ่วงขนส่งสินค้าสำเร็จรูป โกดัง 2",
        "type": "vehicle_truck",
        "x": 640,
        "y": 270,
        "rotation": 0,
        "status": "active",
        "specs": "Scania R500 Prime Mover + 40ft Trailer",
        "licensePlate": "70-9876 พระนครศรีอยุธยา",
        "driverName": "ประเสริฐ วงศ์สว่าง",
        "parkingSlot": "Dock-02",
        "vehicleModel": "Scania R500 Trailer",
        "department": "คลังสินค้า & ซัพพลายเชน"
      },
      {
        "id": "p-bay-1",
        "code": "BAY-VIP",
        "name": "ช่องจอดรถ VIP-01",
        "type": "parking_bay",
        "x": 110,
        "y": 280,
        "rotation": 0,
        "status": "active",
        "parkingSlot": "VIP-01"
      },
      {
        "id": "p-bay-2",
        "code": "BAY-EV",
        "name": "ช่องจอดรถ EV-01",
        "type": "parking_bay",
        "x": 160,
        "y": 280,
        "rotation": 0,
        "status": "active",
        "parkingSlot": "EV-01"
      },
      {
        "id": "p-bay-3",
        "code": "BAY-P3",
        "name": "ช่องจอดรถ P-03",
        "type": "parking_bay",
        "x": 210,
        "y": 280,
        "rotation": 0,
        "status": "active",
        "parkingSlot": "P-03"
      }
    ]
  },
  {
    "name": "อาคาร 1: สำนักงานใหญ่ (HQ Building) - ชั้น 1: จุดต้อนรับ & ไอที & บุคคล",
    "buildingId": "b1",
    "buildingName": "อาคาร 1: สำนักงานใหญ่ (HQ Building)",
    "buildingType": "office",
    "totalFloors": 4,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b1-f1-r1",
        "name": "จุดต้อนรับ (Reception & Lobby)",
        "department": "ทรัพยากรบุคคล (HR)",
        "x": 60,
        "y": 60,
        "width": 240,
        "height": 180,
        "color": "#dbeafe",
        "description": "จุดติดต่อสอบถาม แลกบัตรผู้มาเยือน",
        "extension": "1000",
        "capacity": 10
      },
      {
        "id": "b1-f1-r2",
        "name": "ห้องประชุม A (Meeting Room A)",
        "department": "ส่วนกลาง",
        "x": 340,
        "y": 60,
        "width": 280,
        "height": 180,
        "color": "#e0e7ff",
        "description": "ห้องประชุม 14 ที่นั่ง พร้อมโปรเจกเตอร์ 4K",
        "extension": "1005",
        "capacity": 14
      },
      {
        "id": "b1-f1-r3",
        "name": "ฝ่ายเทคโนโลยีสารสนเทศ (IT Department)",
        "department": "เทคโนโลยีสารสนเทศ (IT)",
        "x": 660,
        "y": 60,
        "width": 280,
        "height": 240,
        "color": "#ccfbf1",
        "description": "ศูนย์บริการไอที แจกจ่ายโน้ตบุ๊ก และห้องเซิร์ฟเวอร์",
        "extension": "1201",
        "capacity": 16
      },
      {
        "id": "b1-f1-r4",
        "name": "ฝ่ายทรัพยากรบุคคล (HR Department)",
        "department": "ทรัพยากรบุคคล (HR)",
        "x": 60,
        "y": 300,
        "width": 280,
        "height": 240,
        "color": "#fef3c7",
        "description": "สำนักงานฝ่ายบุคคล สัญญาจ้าง และสวัสดิการ",
        "extension": "1101",
        "capacity": 12
      },
      {
        "id": "b1-f1-r5",
        "name": "ห้องพักผ่อนและรับประทานอาหาร (Pantry)",
        "department": "ส่วนกลาง",
        "x": 380,
        "y": 340,
        "width": 240,
        "height": 200,
        "color": "#d1fae5",
        "description": "โซนพักเบรก กาแฟ ตู้เย็น และมุมพักผ่อน",
        "extension": "",
        "capacity": 20
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b1-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b1-f1-cctv1",
        "code": "CCTV-B1-01",
        "name": "CCTV โถงต้อนรับ Lobby",
        "type": "cctv",
        "x": 80,
        "y": 60,
        "rotation": 55,
        "fovAngle": 85,
        "rangeMeters": 10,
        "status": "active",
        "specs": "Hikvision 4K Dome IP Camera",
        "assignedTo": "ฝ่ายความปลอดภัย",
        "department": "IT"
      },
      {
        "id": "b1-f1-pc1",
        "code": "FTI-PC-001",
        "name": "Workstation IT Specialist #1",
        "type": "computer",
        "x": 720,
        "y": 120,
        "rotation": 0,
        "status": "active",
        "specs": "Apple Mac mini M2 Pro 32GB RAM + Dual 27\"",
        "assignedTo": "กิตติพัศ ทิพย์แสงวงค์",
        "department": "เทคโนโลยีสารสนเทศ (IT)"
      },
      {
        "id": "b1-f1-pc2",
        "code": "FTI-PC-002",
        "name": "Workstation Helpdesk #2",
        "type": "computer",
        "x": 820,
        "y": 120,
        "rotation": 0,
        "status": "active",
        "specs": "Dell OptiPlex 7010 Micro, Core i7",
        "assignedTo": "สมชาย ใจดี",
        "department": "เทคโนโลยีสารสนเทศ (IT)"
      },
      {
        "id": "b1-f1-prn1",
        "code": "PRN-B1-01",
        "name": "เครื่องพิมพ์เลเซอร์สี Multifunction",
        "type": "printer",
        "x": 500,
        "y": 140,
        "rotation": 0,
        "status": "active",
        "specs": "Canon imageRUNNER ADVANCE DX C3826i",
        "assignedTo": "ส่วนกลาง",
        "department": "ส่วนกลาง"
      }
    ]
  },
  {
    "name": "อาคาร 1: สำนักงานใหญ่ (HQ Building) - ชั้น 2: บัญชี & การเงิน & จัดซื้อ",
    "buildingId": "b1",
    "buildingName": "อาคาร 1: สำนักงานใหญ่ (HQ Building)",
    "buildingType": "office",
    "totalFloors": 4,
    "floorNumber": 2,
    "floorName": "ชั้น 2",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b1-f2-r1",
        "name": "ฝ่ายบัญชีและการเงิน (Accounting & Finance)",
        "department": "การเงินและบัญชี",
        "x": 60,
        "y": 60,
        "width": 320,
        "height": 240,
        "color": "#fef3c7",
        "description": "งานบัญชีเจ้าหนี้/ลูกหนี้ ภาษี และเบิกจ่าย",
        "extension": "1300",
        "capacity": 18
      },
      {
        "id": "b1-f2-r2",
        "name": "ฝ่ายจัดซื้อและพัสดุ (Procurement)",
        "department": "จัดซื้อ (Procurement)",
        "x": 420,
        "y": 60,
        "width": 260,
        "height": 240,
        "color": "#e0f2fe",
        "description": "จัดซื้ออุปกรณ์ วัตถุดิบ และสัญญาคู่ค้า",
        "extension": "1400",
        "capacity": 12
      },
      {
        "id": "b1-f2-r3",
        "name": "ห้องประชุมผู้บริหาร B (Boardroom B)",
        "department": "ส่วนกลาง",
        "x": 720,
        "y": 60,
        "width": 220,
        "height": 240,
        "color": "#ede9fe",
        "description": "ห้องประชุมบอร์ดบริหาร 16 จุดไมค์",
        "extension": "1006",
        "capacity": 16
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b1-2-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b1-f2-pc1",
        "code": "FTI-PC-040",
        "name": "Workstation Finance Manager",
        "type": "computer",
        "x": 140,
        "y": 120,
        "rotation": 0,
        "status": "active",
        "specs": "HP EliteDesk 800 G9, Core i7, 32GB RAM",
        "assignedTo": "วิไลพร วิจิตรบรรจง",
        "department": "การเงินและบัญชี"
      },
      {
        "id": "b1-f2-pc2",
        "code": "FTI-PC-052",
        "name": "Workstation Senior Buyer",
        "type": "computer",
        "x": 480,
        "y": 120,
        "rotation": 0,
        "status": "active",
        "specs": "Dell Latitude 5540, Core i7",
        "assignedTo": "ธีรพล วรรณวงศ์",
        "department": "จัดซื้อ (Procurement)"
      }
    ]
  },
  {
    "name": "อาคาร 1: สำนักงานใหญ่ (HQ Building) - ชั้น 3: หอประชุม & นิติการ & กลยุทธ์",
    "buildingId": "b1",
    "buildingName": "อาคาร 1: สำนักงานใหญ่ (HQ Building)",
    "buildingType": "office",
    "totalFloors": 4,
    "floorNumber": 3,
    "floorName": "ชั้น 3",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b1-f3-r1",
        "name": "หอประชุมใหญ่ (Auditorium Hall - 120 ที่นั่ง)",
        "department": "ส่วนกลาง",
        "x": 60,
        "y": 60,
        "width": 500,
        "height": 480,
        "color": "#f3e8ff",
        "description": "ห้องสัมมนาใหญ่ ปฐมนิเทศ และทาวน์ฮอลล์",
        "extension": "1010",
        "capacity": 120
      },
      {
        "id": "b1-f3-r2",
        "name": "ฝ่ายนิติการและธรรมาภิบาล (Legal)",
        "department": "กฎหมาย",
        "x": 600,
        "y": 60,
        "width": 340,
        "height": 220,
        "color": "#f1f5f9",
        "description": "ตรวจสัญญานิติกรรมและข้อบังคับ",
        "extension": "1500",
        "capacity": 10
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b1-3-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b1-f3-pc1",
        "code": "FTI-PC-077",
        "name": "Workstation Head of Legal",
        "type": "computer",
        "x": 720,
        "y": 120,
        "rotation": 0,
        "status": "active",
        "specs": "ThinkPad X1 Carbon Gen 11, 32GB RAM",
        "assignedTo": "ธนวัฒน์ ศิริอักษร",
        "department": "กฎหมาย"
      }
    ]
  },
  {
    "name": "อาคาร 1: สำนักงานใหญ่ (HQ Building) - ชั้น 4: ผู้บริหารระดับสูง & VIP Lounge",
    "buildingId": "b1",
    "buildingName": "อาคาร 1: สำนักงานใหญ่ (HQ Building)",
    "buildingType": "office",
    "totalFloors": 4,
    "floorNumber": 4,
    "floorName": "ชั้น 4",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b1-f4-r1",
        "name": "ห้องทำงานประธานเจ้าหน้าที่บริหาร (CEO Suite)",
        "department": "ผู้บริหารระดับสูง",
        "x": 60,
        "y": 60,
        "width": 380,
        "height": 300,
        "color": "#fef9c3",
        "description": "ห้องทำงาน CEO พร้อมวิวสวนส่วนกลาง",
        "extension": "1001",
        "capacity": 8
      },
      {
        "id": "b1-f4-r2",
        "name": "ห้องรองกรรมการผู้จัดการ (Deputy MD)",
        "department": "ผู้บริหารระดับสูง",
        "x": 480,
        "y": 60,
        "width": 240,
        "height": 240,
        "color": "#fef3c7",
        "description": "ห้องทำงานรองกรรมการผู้จัดการ",
        "extension": "1002",
        "capacity": 6
      },
      {
        "id": "b1-f4-r3",
        "name": "ห้องรับรองแขกวีไอพี (VIP Sky Lounge)",
        "department": "ผู้บริหารระดับสูง",
        "x": 760,
        "y": 60,
        "width": 180,
        "height": 480,
        "color": "#ecfdf5",
        "description": "ห้องรับรองแขกพิเศษระดับสูง",
        "extension": "1008",
        "capacity": 20
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b1-4-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b1-f4-pc1",
        "code": "FTI-PC-CEO",
        "name": "Workstation Executive CEO",
        "type": "computer",
        "x": 200,
        "y": 160,
        "rotation": 0,
        "status": "active",
        "specs": "Apple Mac Studio M2 Ultra (64GB RAM)",
        "assignedTo": "ประธานเจ้าหน้าที่บริหาร (CEO)",
        "department": "ผู้บริหารระดับสูง"
      }
    ]
  },
  {
    "name": "อาคาร 2: วิศวกรรมและเทคโนโลยี (Engineering & Ops) - ชั้น 1: ปฏิบัติการซ่อมบำรุง & ศูนย์ควบคุม SCADA",
    "buildingId": "b2",
    "buildingName": "อาคาร 2: วิศวกรรมและเทคโนโลยี (Engineering & Ops)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b2-f1-r1",
        "name": "ห้องควบคุมระบบอัตโนมัติ (SCADA Room)",
        "department": "วิศวกรรมการผลิต",
        "x": 60,
        "y": 60,
        "width": 400,
        "height": 260,
        "color": "#e2e8f0",
        "description": "ศูนย์มอนิเตอร์สถานะเครื่องจักร",
        "extension": "2101",
        "capacity": 12
      },
      {
        "id": "b2-f1-r2",
        "name": "ฝ่ายความปลอดภัย อาชีวอนามัย (EHS)",
        "department": "ความปลอดภัย EHS",
        "x": 500,
        "y": 60,
        "width": 440,
        "height": 260,
        "color": "#fef08a",
        "description": "ตรวจสอบมาตรฐานความปลอดภัย ISO 45001",
        "extension": "2201",
        "capacity": 10
      },
      {
        "id": "b2-f1-r3",
        "name": "เวิร์กช็อปเครื่องมือช่าง (Maintenance Workshop)",
        "department": "ซ่อมบำรุง",
        "x": 60,
        "y": 360,
        "width": 880,
        "height": 200,
        "color": "#fed7aa",
        "description": "จัดเก็บเครื่องมือและอะไหล่ซ่อมบำรุง",
        "extension": "2301",
        "capacity": 25
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b2-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b2-f1-pc1",
        "code": "FTI-PC-ENG01",
        "name": "SCADA Monitoring Console",
        "type": "computer",
        "x": 200,
        "y": 160,
        "rotation": 0,
        "status": "active",
        "specs": "Advantech Industrial PC Core i9, 64GB RAM",
        "assignedTo": "หัวหน้ากะวิศวกรรม",
        "department": "วิศวกรรมการผลิต"
      }
    ]
  },
  {
    "name": "อาคาร 2: วิศวกรรมและเทคโนโลยี (Engineering & Ops) - ชั้น 2: ออกแบบอุตสาหกรรม & ระบบอัตโนมัติ (Automation Lab)",
    "buildingId": "b2",
    "buildingName": "อาคาร 2: วิศวกรรมและเทคโนโลยี (Engineering & Ops)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 2,
    "floorName": "ชั้น 2",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b2-f2-r1",
        "name": "ห้องออกแบบวิศวกรรม CAD/CAM",
        "department": "วิศวกรรมการผลิต",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 240,
        "color": "#dbeafe",
        "description": "ออกแบบแม่พิมพ์ ชิ้นส่วนเครื่องกล และระบบสายพาน",
        "extension": "2202",
        "capacity": 14
      },
      {
        "id": "b2-f2-r2",
        "name": "ห้องทดสอบหุ่นยนต์และระบบอัตโนมัติ (Robotics Rig)",
        "department": "วิศวกรรมการผลิต",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 240,
        "color": "#e0e7ff",
        "description": "แขนกลทดสอบการประกอบและหยิบจับชิ้นงาน",
        "extension": "2203",
        "capacity": 10
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b2-2-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b2-f2-pc1",
        "code": "FTI-PC-CAD01",
        "name": "Workstation 3D CAD Specialist",
        "type": "computer",
        "x": 160,
        "y": 140,
        "rotation": 0,
        "status": "active",
        "specs": "Dell Precision 5860, Xeon w7, RTX 4500 Ada",
        "assignedTo": "ภาณุเดช วิศวกรแม่พิมพ์",
        "department": "วิศวกรรมการผลิต"
      }
    ]
  },
  {
    "name": "อาคาร 2: วิศวกรรมและเทคโนโลยี (Engineering & Ops) - ชั้น 3: ห้องแล็บสอบเทียบและตรวจสอบคุณภาพ (QA/QC Lab)",
    "buildingId": "b2",
    "buildingName": "อาคาร 2: วิศวกรรมและเทคโนโลยี (Engineering & Ops)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 3,
    "floorName": "ชั้น 3",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b2-f3-r1",
        "name": "ห้องวัดละเอียดและสอบเทียบ (Metrology Room)",
        "department": "ควบคุมคุณภาพ (QC)",
        "x": 60,
        "y": 60,
        "width": 420,
        "height": 280,
        "color": "#fef3c7",
        "description": "เครื่องวัดพิกัด 3 มิติ CMM และเครื่องสแกนเลเซอร์",
        "extension": "2301",
        "capacity": 8
      },
      {
        "id": "b2-f3-r2",
        "name": "ฝ่ายรับประกันคุณภาพสินค้า (QA Assurance Office)",
        "department": "ควบคุมคุณภาพ (QC)",
        "x": 520,
        "y": 60,
        "width": 420,
        "height": 280,
        "color": "#ccfbf1",
        "description": "วิเคราะห์รายงานสถิติ Defect และข้อร้องเรียน",
        "extension": "2302",
        "capacity": 15
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b2-3-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b2-f3-pc1",
        "code": "FTI-PC-QC01",
        "name": "CMM Analysis Workstation",
        "type": "computer",
        "x": 180,
        "y": 150,
        "rotation": 0,
        "status": "active",
        "specs": "Lenovo ThinkStation P3, Core i7",
        "assignedTo": "นิภาดา หัวหน้าฝ่าย QC",
        "department": "ควบคุมคุณภาพ (QC)"
      }
    ]
  },
  {
    "name": "อาคาร 3: วิจัยและพัฒนา (R&D Innovation Hub) - ชั้น 1: เวิร์กช็อปชิ้นงานต้นแบบ (Prototyping Workshop)",
    "buildingId": "b3",
    "buildingName": "อาคาร 3: วิจัยและพัฒนา (R&D Innovation Hub)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b3-f1-r1",
        "name": "โซนเครื่องพิมพ์ 3D อุตสาหกรรม (Additive Lab)",
        "department": "วิจัยและพัฒนา R&D",
        "x": 60,
        "y": 60,
        "width": 420,
        "height": 260,
        "color": "#ccfbf1",
        "description": "3D Printer SLA/SLS ขึ้นรูปชิ้นงานพลาสติกและโลหะ",
        "extension": "3101",
        "capacity": 10
      },
      {
        "id": "b3-f1-r2",
        "name": "ห้องทดสอบความทนทาน (Stress Testing Rig)",
        "department": "วิจัยและพัฒนา R&D",
        "x": 520,
        "y": 60,
        "width": 420,
        "height": 260,
        "color": "#e0e7ff",
        "description": "ทดสอบแรงกด แรงบิด และอุณหภูมิสุดขั้ว",
        "extension": "3102",
        "capacity": 8
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b3-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b3-f1-pc1",
        "code": "FTI-PC-RD01",
        "name": "3D Printing Controller Station",
        "type": "computer",
        "x": 160,
        "y": 140,
        "rotation": 0,
        "status": "active",
        "specs": "HP Z4 G5 Workstation, Core i9",
        "assignedTo": "ธนภูมิ นักวิจัยวัสดุ",
        "department": "วิจัยและพัฒนา R&D"
      }
    ]
  },
  {
    "name": "อาคาร 3: วิจัยและพัฒนา (R&D Innovation Hub) - ชั้น 2: ทีมพัฒนาซอฟต์แวร์ & สมองกลฝังตัว (Embedded & IoT)",
    "buildingId": "b3",
    "buildingName": "อาคาร 3: วิจัยและพัฒนา (R&D Innovation Hub)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 2,
    "floorName": "ชั้น 2",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b3-f2-r1",
        "name": "ห้องปฏิบัติการเฟิร์มแวร์และฮาร์ดแวร์ IoT",
        "department": "วิจัยและพัฒนา R&D",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 280,
        "color": "#dbeafe",
        "description": "พัฒนาแผงวงจรไมโครคอนโทรลเลอร์และเซนเซอร์ส่งข้อมูล",
        "extension": "3201",
        "capacity": 16
      },
      {
        "id": "b3-f2-r2",
        "name": "โซนวิเคราะห์ข้อมูล AI & Big Data Lab",
        "department": "วิจัยและพัฒนา R&D",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 280,
        "color": "#f3e8ff",
        "description": "ฝึกสอนโมเดล AI พยากรณ์การซ่อมบำรุงล่วงหน้า",
        "extension": "3202",
        "capacity": 12
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b3-2-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b3-f2-pc1",
        "code": "FTI-PC-AI01",
        "name": "Deep Learning Training Rig",
        "type": "computer",
        "x": 640,
        "y": 140,
        "rotation": 0,
        "status": "active",
        "specs": "Custom Tower, Dual RTX 4090, 128GB RAM",
        "assignedTo": "วรภพ หัวหน้าทีม AI & Data",
        "department": "วิจัยและพัฒนา R&D"
      }
    ]
  },
  {
    "name": "อาคาร 3: วิจัยและพัฒนา (R&D Innovation Hub) - ชั้น 3: ห้องปฏิบัติการเคมีและสารเคลือบผิว (Chemical Formulation)",
    "buildingId": "b3",
    "buildingName": "อาคาร 3: วิจัยและพัฒนา (R&D Innovation Hub)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 3,
    "floorName": "ชั้น 3",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b3-f3-r1",
        "name": "ห้องแล็บเคมีและตู้ดูดควัน (Fume Hoods Lab)",
        "department": "วิจัยและพัฒนา R&D",
        "x": 60,
        "y": 60,
        "width": 460,
        "height": 300,
        "color": "#fef3c7",
        "description": "วิเคราะห์สูตรเคมี สารเคลือบผิวกันสนิม และสีทนความร้อน",
        "extension": "3301",
        "capacity": 10
      },
      {
        "id": "b3-f3-r2",
        "name": "ห้องประชุมแลกเปลี่ยนนวัตกรรม (Ideation Room)",
        "department": "วิจัยและพัฒนา R&D",
        "x": 560,
        "y": 60,
        "width": 380,
        "height": 300,
        "color": "#d1fae5",
        "description": "ห้อง Brainstorming ผนังเขียนไวท์บอร์ดรอบทิศทาง",
        "extension": "3302",
        "capacity": 14
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b3-3-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b3-f3-cctv1",
        "code": "CCTV-B3-03",
        "name": "CCTV ห้องแล็บเคมีพิเศษ",
        "type": "cctv",
        "x": 80,
        "y": 80,
        "rotation": 45,
        "fovAngle": 90,
        "rangeMeters": 12,
        "status": "active",
        "specs": "Hikvision Explosion-proof IP Camera",
        "assignedTo": "ฝ่ายความปลอดภัย EHS",
        "department": "วิจัยและพัฒนา R&D"
      }
    ]
  },
  {
    "name": "อาคาร 4: พาณิชย์และการตลาด (Commercial & Sales) - ชั้น 1: โชว์รูมผลิตภัณฑ์ & ศูนย์ต้อนรับคู่ค้า",
    "buildingId": "b4",
    "buildingName": "อาคาร 4: พาณิชย์และการตลาด (Commercial & Sales)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b4-f1-r1",
        "name": "โชว์รูมจัดแสดงนวัตกรรมสินค้า (Innovation Showcase)",
        "department": "ฝ่ายขายและการตลาด",
        "x": 60,
        "y": 60,
        "width": 500,
        "height": 320,
        "color": "#fef9c3",
        "description": "จัดแสดงสินค้าจริง แท่นโชว์ไฟ LED และจอสัมผัสแสดงสเปก",
        "extension": "4101",
        "capacity": 30
      },
      {
        "id": "b4-f1-r2",
        "name": "ห้องเจรจาธุรกิจ VIP Deal Room",
        "department": "ฝ่ายขายและการตลาด",
        "x": 600,
        "y": 60,
        "width": 340,
        "height": 320,
        "color": "#e0f2fe",
        "description": "ห้องรับรองปิดดีลสัญญาและลงนามข้อตกลง",
        "extension": "4102",
        "capacity": 12
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b4-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b4-f1-pc1",
        "code": "FTI-PC-SHOW01",
        "name": "Kiosk Interactive Showcase",
        "type": "computer",
        "x": 200,
        "y": 160,
        "rotation": 0,
        "status": "active",
        "specs": "Surface Studio 2+ All-in-one Touch",
        "assignedTo": "ทีมต้อนรับลูกค้า",
        "department": "ฝ่ายขายและการตลาด"
      }
    ]
  },
  {
    "name": "อาคาร 4: พาณิชย์และการตลาด (Commercial & Sales) - ชั้น 2: ฝ่ายขายในประเทศ & ต่างประเทศ (Sales Operation)",
    "buildingId": "b4",
    "buildingName": "อาคาร 4: พาณิชย์และการตลาด (Commercial & Sales)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 2,
    "floorName": "ชั้น 2",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b4-f2-r1",
        "name": "ฝ่ายขายในประเทศ (Domestic Key Account)",
        "department": "ฝ่ายขายและการตลาด",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 280,
        "color": "#fed7aa",
        "description": "บริหารยอดขายกลุ่มลูกค้าองค์กรและภาครัฐ",
        "extension": "4201",
        "capacity": 20
      },
      {
        "id": "b4-f2-r2",
        "name": "ฝ่ายส่งออกและการค้าระหว่างประเทศ (Overseas Export)",
        "department": "ฝ่ายขายและการตลาด",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 280,
        "color": "#bfdbfe",
        "description": "ติดต่อคู่ค้า CLMV ยุโรป และใบรับรองถิ่นกำเนิดสินค้า",
        "extension": "4202",
        "capacity": 15
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b4-2-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b4-f2-pc1",
        "code": "FTI-PC-SALES01",
        "name": "Sales Director Workstation",
        "type": "computer",
        "x": 160,
        "y": 140,
        "rotation": 0,
        "status": "active",
        "specs": "Dell OptiPlex 7010, Core i7",
        "assignedTo": "กิตติพงษ์ ผอ.ฝ่ายขาย",
        "department": "ฝ่ายขายและการตลาด"
      }
    ]
  },
  {
    "name": "อาคาร 4: พาณิชย์และการตลาด (Commercial & Sales) - ชั้น 3: สตูดิโอมัลติมีเดีย & การตลาดดิจิทัล (Creative Hub)",
    "buildingId": "b4",
    "buildingName": "อาคาร 4: พาณิชย์และการตลาด (Commercial & Sales)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 3,
    "floorName": "ชั้น 3",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b4-f3-r1",
        "name": "สตูดิโอถ่ายทำภาพและวิดีโอ (Media Production)",
        "department": "ฝ่ายขายและการตลาด",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 300,
        "color": "#e9d5ff",
        "description": "ห้องฉากเขียว Green Screen ไฟสตูดิโอ และอัดเสียงโฆษณา",
        "extension": "4301",
        "capacity": 10
      },
      {
        "id": "b4-f3-r2",
        "name": "ทีมสื่อสารองค์กรและคอนเทนต์ (Digital Marketing)",
        "department": "ฝ่ายขายและการตลาด",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 300,
        "color": "#fbcfe8",
        "description": "ทำกราฟิก ดูแลเว็บไซต์ และจัดแคมเปญโซเชียลมีเดีย",
        "extension": "4302",
        "capacity": 12
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b4-3-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b4-f3-pc1",
        "code": "FTI-PC-MEDIA01",
        "name": "Mac Studio Video Editing Rig",
        "type": "computer",
        "x": 180,
        "y": 150,
        "rotation": 0,
        "status": "active",
        "specs": "Apple Mac Studio M2 Max, 64GB RAM",
        "assignedTo": "ชานนท์ หัวหน้าทีมมีเดีย",
        "department": "ฝ่ายขายและการตลาด"
      }
    ]
  },
  {
    "name": "อาคาร 5: บริการและสวัสดิการพนักงาน (Employee Services) - ชั้น 1: โรงอาหารส่วนกลาง & มินิมาร์ทสวัสดิการ",
    "buildingId": "b5",
    "buildingName": "อาคาร 5: บริการและสวัสดิการพนักงาน (Employee Services)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b5-f1-r1",
        "name": "โรงอาหารกลางพนักงาน (Central Cafeteria)",
        "department": "สวัสดิการพนักงาน",
        "x": 60,
        "y": 60,
        "width": 560,
        "height": 420,
        "color": "#bbf7d0",
        "description": "ที่นั่งรับประทานอาหาร 250 ที่นั่ง พร้อมซุ้มอาหาร 8 ร้าน",
        "extension": "5100",
        "capacity": 250
      },
      {
        "id": "b5-f1-r2",
        "name": "ร้านกาแฟและมินิมาร์ท (FTI Coffee Kiosk)",
        "department": "สวัสดิการพนักงาน",
        "x": 660,
        "y": 60,
        "width": 280,
        "height": 420,
        "color": "#fef3c7",
        "description": "เครื่องดื่ม ชา กาแฟ และสินค้าสวัสดิการราคาพิเศษ",
        "extension": "5105",
        "capacity": 20
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b5-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b5-f1-cctv1",
        "code": "CCTV-B5-01",
        "name": "CCTV โถงโรงอาหารพนักงาน",
        "type": "cctv",
        "x": 80,
        "y": 80,
        "rotation": 55,
        "fovAngle": 90,
        "rangeMeters": 20,
        "status": "active",
        "specs": "Hikvision 4K Panoramic Dome Camera",
        "assignedTo": "ฝ่ายสวัสดิการ",
        "department": "สวัสดิการพนักงาน"
      }
    ]
  },
  {
    "name": "อาคาร 5: บริการและสวัสดิการพนักงาน (Employee Services) - ชั้น 2: ห้องพยาบาล & ศูนย์ฟิตเนสออกกำลังกาย",
    "buildingId": "b5",
    "buildingName": "อาคาร 5: บริการและสวัสดิการพนักงาน (Employee Services)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 2,
    "floorName": "ชั้น 2",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b5-f2-r1",
        "name": "ห้องพยาบาลและปฐมพยาบาล (Medical Clinic)",
        "department": "สวัสดิการพนักงาน",
        "x": 60,
        "y": 60,
        "width": 400,
        "height": 320,
        "color": "#fee2e2",
        "description": "พยาบาลวิชาชีพประจำ เตียงพักฟื้น 4 เตียง และยาเบื้องต้น",
        "extension": "5201",
        "capacity": 8
      },
      {
        "id": "b5-f2-r2",
        "name": "ฟิตเนสและห้องโยคะ (Wellness Center)",
        "department": "สวัสดิการพนักงาน",
        "x": 500,
        "y": 60,
        "width": 440,
        "height": 320,
        "color": "#a7f3d0",
        "description": "ลู่วิ่ง ดัมเบล ห้องโยคะ และห้องอาบน้ำแยกชาย-หญิง",
        "extension": "5202",
        "capacity": 30
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b5-2-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b5-f2-pc1",
        "code": "FTI-PC-MED01",
        "name": "Nurse Station Record Workstation",
        "type": "computer",
        "x": 160,
        "y": 140,
        "rotation": 0,
        "status": "active",
        "specs": "Lenovo ThinkCentre All-in-one, Core i5",
        "assignedTo": "พว.สุดารัตน์ พยาบาลประจำ",
        "department": "สวัสดิการพนักงาน"
      }
    ]
  },
  {
    "name": "อาคาร 5: บริการและสวัสดิการพนักงาน (Employee Services) - ชั้น 3: สถาบันอบรมและพัฒนาทักษะ (FTI Academy)",
    "buildingId": "b5",
    "buildingName": "อาคาร 5: บริการและสวัสดิการพนักงาน (Employee Services)",
    "buildingType": "office",
    "totalFloors": 3,
    "floorNumber": 3,
    "floorName": "ชั้น 3",
    "gridSize": 20,
    "scaleMetersPerGrid": 1,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "b5-f3-r1",
        "name": "ห้องอบรมคอมพิวเตอร์ (IT Training Lab)",
        "department": "ทรัพยากรบุคคล (HR)",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 320,
        "color": "#e0e7ff",
        "description": "เครื่องคอมพิวเตอร์ฝึกอบรม 30 เครื่องสำหรับคอร์สพัฒนาทักษะ",
        "extension": "5301",
        "capacity": 30
      },
      {
        "id": "b5-f3-r2",
        "name": "ห้องสัมมนาเชิงปฏิบัติการ (Workshop Studio)",
        "department": "ทรัพยากรบุคคล (HR)",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 320,
        "color": "#f3e8ff",
        "description": "จัดฝึกอบรมภาวะผู้นำ กิจกรรม Team Building",
        "extension": "5302",
        "capacity": 40
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-b5-3-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "b5-f3-pc1",
        "code": "FTI-PC-TRAIN01",
        "name": "Instructor Podium Workstation",
        "type": "computer",
        "x": 160,
        "y": 140,
        "rotation": 0,
        "status": "active",
        "specs": "HP ProDesk 600, Core i7 + Dual Projector",
        "assignedTo": "วิทยากรประจำศูนย์อบรม",
        "department": "ทรัพยากรบุคคล (HR)"
      }
    ]
  },
  {
    "name": "โกดัง 1: คลังวัตถุดิบหลัก (Raw Materials Warehouse) - ชั้น 1 (Ground Floor)",
    "buildingId": "w1",
    "buildingName": "โกดัง 1: คลังวัตถุดิบหลัก (Raw Materials Warehouse)",
    "buildingType": "warehouse",
    "totalFloors": 1,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1.5,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "w1-r1",
        "name": "ชานชาลาตรวจรับขาเข้า (Inbound Loading Bay)",
        "department": "คลังสินค้า",
        "x": 60,
        "y": 60,
        "width": 400,
        "height": 200,
        "color": "#ffedd5",
        "description": "จุดเทียบรถบรรทุกและตรวจสภาพวัตถุดิบ",
        "extension": "6101",
        "capacity": 15
      },
      {
        "id": "w1-r2",
        "name": "โซนกักกันเพื่อตรวจสอบ (QC Quarantine)",
        "department": "ควบคุมคุณภาพ (QC)",
        "x": 500,
        "y": 60,
        "width": 440,
        "height": 200,
        "color": "#fef3c7",
        "description": "รอผลแล็บก่อนนำเข้าชั้นวาง",
        "extension": "6102",
        "capacity": 10
      },
      {
        "id": "w1-r3",
        "name": "โซนชั้นวางวัตถุดิบสูง (High-Bay Racking)",
        "department": "คลังสินค้า",
        "x": 60,
        "y": 300,
        "width": 600,
        "height": 280,
        "color": "#fed7aa",
        "description": "ชั้นวางพาเลท 6 ชั้น 2,000 ตัน",
        "extension": "6103",
        "capacity": 30
      },
      {
        "id": "w1-r4",
        "name": "สำนักงานควบคุมคลัง (Warehouse Office)",
        "department": "คลังสินค้า",
        "x": 700,
        "y": 300,
        "width": 240,
        "height": 280,
        "color": "#e0f2fe",
        "description": "โต๊ะทำงานหัวหน้าคลังและระบบ ERP",
        "extension": "6100",
        "capacity": 8
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-w1-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "w1-fork1",
        "code": "FL-01",
        "name": "รถโฟล์กลิฟต์ไฟฟ้า 3 ตัน #01",
        "type": "vehicle_forklift",
        "x": 420,
        "y": 340,
        "rotation": 0,
        "status": "active",
        "specs": "Toyota 8-Series 3-Ton Electric Forklift",
        "licensePlate": "FL-01",
        "driverName": "สมศักดิ์ คลังเจริญ",
        "parkingSlot": "Bay-A",
        "department": "คลังสินค้า"
      },
      {
        "id": "w1-cctv1",
        "code": "CCTV-W1-01",
        "name": "CCTV ชานชาลาเทียบสินค้า Inbound",
        "type": "cctv",
        "x": 60,
        "y": 60,
        "rotation": 45,
        "fovAngle": 90,
        "rangeMeters": 20,
        "status": "active",
        "specs": "Hikvision 4K DarkFighter Wide Angle",
        "assignedTo": "ฝ่ายคลังสินค้า",
        "department": "คลังสินค้า"
      },
      {
        "id": "w1-pc1",
        "code": "FTI-PC-WH1",
        "name": "Workstation Warehouse Supervisor",
        "type": "computer",
        "x": 780,
        "y": 420,
        "rotation": 0,
        "status": "active",
        "specs": "Dell OptiPlex 5090, Core i5, Barcode Scanner",
        "assignedTo": "สมศักดิ์ คลังเจริญ",
        "department": "คลังสินค้า"
      }
    ]
  },
  {
    "name": "โกดัง 2: คลังสินค้าสำเร็จรูป (Finished Goods Warehouse) - ชั้น 1 (Ground Floor)",
    "buildingId": "w2",
    "buildingName": "โกดัง 2: คลังสินค้าสำเร็จรูป (Finished Goods Warehouse)",
    "buildingType": "warehouse",
    "totalFloors": 1,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1.5,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "w2-r1",
        "name": "ชานชาลาส่งสินค้าออก (Outbound Dispatch Dock)",
        "department": "คลังสินค้า",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 200,
        "color": "#fbcfe8",
        "description": "ชานชาลารถสิบล้อเทียบรับสินค้าพร้อมส่ง",
        "extension": "6201",
        "capacity": 20
      },
      {
        "id": "w2-r2",
        "name": "จุดคัดแยกพาเลทอัตโนมัติ (Pallet Sorting)",
        "department": "คลังสินค้า",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 200,
        "color": "#ede9fe",
        "description": "ระบบสายพานลำเลียงและสแกน RFID",
        "extension": "6202",
        "capacity": 15
      },
      {
        "id": "w2-r3",
        "name": "โซนจัดเก็บสินค้าสำเร็จรูปรอส่ง (Finished Goods Racking)",
        "department": "คลังสินค้า",
        "x": 60,
        "y": 300,
        "width": 880,
        "height": 280,
        "color": "#fed7aa",
        "description": "จัดเก็บสินค้าพร้อมจัดส่งเรียงตามโซนพื้นที่ภาค",
        "extension": "6203",
        "capacity": 35
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-w2-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "w2-fork1",
        "code": "FL-02",
        "name": "รถโฟล์กลิฟต์ยกสูง High-Reach #02",
        "type": "vehicle_forklift",
        "x": 300,
        "y": 340,
        "rotation": 90,
        "status": "active",
        "specs": "Linde Reach Truck R16 HD (11.5m Lift)",
        "licensePlate": "FL-02",
        "driverName": "มนตรี ขนย้าย",
        "parkingSlot": "Bay-B",
        "department": "คลังสินค้า"
      },
      {
        "id": "w2-truck1",
        "code": "TRUCK-01",
        "name": "รถบรรทุก 10 ล้อส่งสินค้า FTI Logistics",
        "type": "vehicle_truck",
        "x": 180,
        "y": 100,
        "rotation": 0,
        "status": "active",
        "specs": "Isuzu Giga FXZ 360 แรงม้า ตู้ทึบอลูมิเนียม",
        "licensePlate": "71-4567 สระบุรี",
        "driverName": "อนุชา ขนส่งดี",
        "parkingSlot": "Dock-01",
        "department": "คลังสินค้า"
      }
    ]
  },
  {
    "name": "โกดัง 3: คลังบรรจุภัณฑ์ (Packaging Depot) - ชั้น 1 (Ground Floor)",
    "buildingId": "w3",
    "buildingName": "โกดัง 3: คลังบรรจุภัณฑ์ (Packaging Depot)",
    "buildingType": "warehouse",
    "totalFloors": 1,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1.5,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "w3-r1",
        "name": "โซนจัดเก็บกล่องและลังกระดาษ (Carton Storage)",
        "department": "คลังบรรจุภัณฑ์",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 240,
        "color": "#e9d5ff",
        "description": "จัดเก็บกล่องลูกฟูกพับเก็บมาตรฐาน",
        "extension": "6301",
        "capacity": 10
      },
      {
        "id": "w3-r2",
        "name": "โซนฟิล์มหดและอุปกรณ์แพ็กเกจจิ้ง (Wrapping Materials)",
        "department": "คลังบรรจุภัณฑ์",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 240,
        "color": "#f3e8ff",
        "description": "ฟิล์มยืดพันพาเลท เทปกาว และสายรัดพลาสติก",
        "extension": "6302",
        "capacity": 10
      },
      {
        "id": "w3-r3",
        "name": "พื้นที่ประกอบกล่องและติดป้ายสลาก (Labeling Area)",
        "department": "คลังบรรจุภัณฑ์",
        "x": 60,
        "y": 340,
        "width": 880,
        "height": 240,
        "color": "#fed7aa",
        "description": "โต๊ะประกอบกล่องและติดฉลากบาร์โค้ด",
        "extension": "6303",
        "capacity": 15
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-w3-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "w3-prn1",
        "code": "PRN-W3-01",
        "name": "Zebra Label Printer High-Speed",
        "type": "printer",
        "x": 200,
        "y": 380,
        "rotation": 0,
        "status": "active",
        "specs": "Zebra ZT610 Industrial 600dpi Printer",
        "assignedTo": "ฝ่ายบรรจุภัณฑ์",
        "department": "คลังบรรจุภัณฑ์"
      }
    ]
  },
  {
    "name": "โกดัง 4: ศูนย์กระจายสินค้าด่วน (Express Fulfillment Hub) - ชั้น 1 (Ground Floor)",
    "buildingId": "w4",
    "buildingName": "โกดัง 4: ศูนย์กระจายสินค้าด่วน (Express Fulfillment Hub)",
    "buildingType": "warehouse",
    "totalFloors": 1,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1.5,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "w4-r1",
        "name": "โซน Cross-docking คัดแยกสินค้าเร่งด่วน 24 ชม.",
        "department": "โลจิสติกส์ด่วน",
        "x": 60,
        "y": 60,
        "width": 500,
        "height": 260,
        "color": "#fef08a",
        "description": "ถ่ายถ่ายสินค้าจากรถใหญ่เข้ารถเล็กทันทีโดยไม่เข้าชั้นวาง",
        "extension": "6401",
        "capacity": 25
      },
      {
        "id": "w4-r2",
        "name": "ชานชาลารถตู้ส่งของด่วน (Express Van Loading)",
        "department": "โลจิสติกส์ด่วน",
        "x": 600,
        "y": 60,
        "width": 340,
        "height": 260,
        "color": "#fed7aa",
        "description": "เทียบรถส่งด่วน 6 คันพร้อมกัน",
        "extension": "6402",
        "capacity": 20
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-w4-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "w4-truck1",
        "code": "VAN-01",
        "name": "รถกระบะทึบส่งสินค้าด่วน #01",
        "type": "vehicle_car",
        "x": 700,
        "y": 120,
        "rotation": 90,
        "status": "active",
        "specs": "Toyota Hilux Revo Smart Cab ตู้ทึบ 2.10 เมตร",
        "licensePlate": "3ฒผ 7890 กทม.",
        "driverName": "ธีรศักดิ์ ส่งไว",
        "parkingSlot": "Dock-Express",
        "department": "โลจิสติกส์ด่วน"
      }
    ]
  },
  {
    "name": "โกดัง 5: คลังควบคุมอุณหภูมิ (Cold Storage) - ชั้น 1 (Ground Floor)",
    "buildingId": "w5",
    "buildingName": "โกดัง 5: คลังควบคุมอุณหภูมิ (Cold Storage)",
    "buildingType": "warehouse",
    "totalFloors": 1,
    "floorNumber": 1,
    "floorName": "ชั้น 1",
    "gridSize": 20,
    "scaleMetersPerGrid": 1.5,
    "canvasWidth": 1000,
    "canvasHeight": 650,
    "rooms": [
      {
        "id": "w5-r1",
        "name": "ห้องควบคุมอุณหภูมิห้องเย็น 2-8°C (Cold Room)",
        "department": "คลังสินค้าพิเศษ",
        "x": 60,
        "y": 60,
        "width": 440,
        "height": 280,
        "color": "#bae6fd",
        "description": "ห้องเย็นควบคุมความเย็นแม่นยำ พร้อมระบบแจ้งเตือนอุณหภูมิ SMS",
        "extension": "6501",
        "capacity": 12
      },
      {
        "id": "w5-r2",
        "name": "ห้องปรับอากาศปรับสภาวะ 15-25°C (Cool Storage)",
        "department": "คลังสินค้าพิเศษ",
        "x": 540,
        "y": 60,
        "width": 400,
        "height": 280,
        "color": "#e0f2fe",
        "description": "จัดเก็บวัตถุดิบไวต่อความร้อนและสารชีวเคมี",
        "extension": "6502",
        "capacity": 12
      }
    ],
    "walls": [
      {
        "id": "w-1",
        "points": [
          40,
          40,
          960,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-2",
        "points": [
          960,
          40,
          960,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-3",
        "points": [
          960,
          580,
          40,
          580
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      },
      {
        "id": "w-4",
        "points": [
          40,
          580,
          40,
          40
        ],
        "strokeWidth": 8,
        "stroke": "#334155"
      }
    ],
    "doors": [
      {
        "id": "d-w5-1-1",
        "x": 500,
        "y": 580,
        "width": 40,
        "rotation": 0,
        "type": "double_door"
      }
    ],
    "assets": [
      {
        "id": "w5-cctv1",
        "code": "CCTV-W5-01",
        "name": "CCTV ห้องเย็นพร้อมวัดอุณหภูมิ Thermal",
        "type": "cctv",
        "x": 80,
        "y": 80,
        "rotation": 45,
        "fovAngle": 90,
        "rangeMeters": 15,
        "status": "active",
        "specs": "Hikvision Thermal Bi-spectrum Camera (วัดอุณหภูมิต่อเนื่อง)",
        "assignedTo": "ฝ่ายคลังสินค้าพิเศษ",
        "department": "คลังสินค้าพิเศษ"
      }
    ]
  }
];
