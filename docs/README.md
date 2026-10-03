# เอกสารอธิบายการทำงาน — Thailand Reservoir Dashboard

เอกสารชุดนี้อธิบายว่าระบบทำงานอย่างไร ตั้งแต่ดึงข้อมูลจากกรมชลประทานจนแสดงผลบนหน้าเว็บ
สำหรับนักพัฒนาที่จะดูแลหรือต่อยอดโปรเจกต์นี้

ส่วน [README.md](../README.md) ที่ root เป็นสเปกและวิธีเริ่มใช้งาน ส่วนเอกสารชุดนี้เน้นอธิบายว่า **"ทำไม"** และ **"ทำงานอย่างไร"**

## ลำดับการอ่าน

| # | ไฟล์ | เนื้อหา |
|---|---|---|
| 1 | [01-overview.md](01-overview.md) | ภาพรวมระบบ ส่วนประกอบ และเส้นทางของ request ตั้งแต่ต้นจนจบ |
| 2 | [02-data-source.md](02-data-source.md) | API ของกรมชลประทาน ความผิดปกติของข้อมูล และวิธีจัดการ |
| 3 | [03-metrics-and-bands.md](03-metrics-and-bands.md) | สูตรคำนวณ ระดับสถานะน้ำ และการเลือกสี |
| 4 | [04-backend.md](04-backend.md) | Backend (Bun + Elysia): module, cache, error และ API |
| 5 | [05-frontend.md](05-frontend.md) | Frontend (React): component, state และตัวกรองใน URL |
| 6 | [06-infrastructure.md](06-infrastructure.md) | Docker, nginx, docker-compose และ environment variable |
| 7 | [07-testing.md](07-testing.md) | กลยุทธ์การทดสอบ, fixture, mock RID และการเพิ่ม test |
| 8 | [08-operations.md](08-operations.md) | การรัน, การแก้ปัญหา, ข้อจำกัดที่รู้อยู่ และงานในอนาคต |

ถ้าเวลาน้อย อ่านแค่ไฟล์ 01 กับ 02 ก็พอเข้าใจระบบ 80%

## ข้อตกลงในเอกสาร

- **RID** = กรมชลประทาน (Royal Irrigation Department)
- **ล้าน ลบ.ม.** = ล้านลูกบาศก์เมตร เป็นหน่วยปริมาณน้ำของทั้งระบบ
- ตัวเลขตัวอย่างทั้งหมดมาจากข้อมูลจริงวันที่ 2026-10-03 (ไฟล์ `backend/test/fixtures/rid-2026-10-03.json`)
- อ้างถึงไฟล์ด้วย path จาก root ของ repo
