# 08 · การใช้งานจริง การแก้ปัญหา และงานในอนาคต

## คำสั่งที่ใช้บ่อย

| ต้องการ | คำสั่ง |
|---|---|
| รันทั้งระบบ | `docker compose up --build` แล้วเปิด http://localhost:8080 |
| รันเบื้องหลัง | `docker compose up -d --build` |
| หยุด | `docker compose down` |
| ดู log ของ api | `docker compose logs -f api` |
| เปลี่ยน port | `WEB_PORT=9000 docker compose up --build` |
| เช็กสถานะ | `docker compose ps` (ทั้งสอง service ควรเป็น `healthy`) |
| ดูข้อมูลดิบ | `curl localhost:8080/api/summary` |

## สัญญาณที่ควรเฝ้าดู

| สัญญาณ | ความหมาย |
|---|---|
| `stale: true` ใน `/api/*` | backend ดึง RID ครั้งล่าสุดไม่สำเร็จ และกำลังใช้ข้อมูลเก่า |
| `fetchedAt` เก่ากว่า `CACHE_TTL_SECONDS` มาก | RID ล่มต่อเนื่องมาสักพักแล้ว |
| `date` เก่ากว่าวันนี้ 2 วันขึ้นไป | RID เองยังไม่อัปเดตข้อมูล ⚠️ ตอนนี้ระบบ**ยังไม่เตือน**กรณีนี้ |
| HTTP 503 | RID ล่มและ cache ว่าง ซึ่งเกิดได้หลัง restart |
| log `RID fetch failed: ...` | สาเหตุที่ดึงข้อมูลไม่สำเร็จ |
| log `skipping invalid reservoir record` | RID ส่งข้อมูลรูปแบบใหม่มา ควรเพิ่ม fixture และ test |

## แก้ปัญหา

### หน้าเว็บขึ้นว่า "โหลดข้อมูลไม่สำเร็จ"
1. `curl localhost:8080/api/health` ถ้าไม่ตอบ แปลว่า api ไม่ทำงาน ให้ดู `docker compose ps` และ `logs api`
2. `curl localhost:8080/api/summary` ถ้าได้ 503 แปลว่า RID ล่มและไม่มี cache
3. ลองเรียก RID ตรงจากเครื่อง: `curl -I https://app.rid.go.th/reservoir/api/reservoir/public`
4. ถ้า RID ใช้ได้แต่ api ดึงไม่ได้ ให้ตรวจ DNS หรือ network ของ container และค่า `RID_TIMEOUT_MS`

### หน้าเว็บช้ามากในบางครั้ง
อาจเป็นช่วงที่ RID ตอบช้าหรือล่ม request ที่เกิน TTL จะต้องรอได้ถึง `RID_TIMEOUT_MS` (10 วินาที) ดูข้อจำกัดข้อ 1

### `docker compose up` ค้างที่ `web` Waiting
`web` รอให้ `api` เป็น healthy ให้ดู `docker compose logs api` สาเหตุที่พบบ่อยคือค่า env ผิด เช่น `CACHE_TTL_SECONDS=abc` ซึ่งทำให้ process หยุดตั้งแต่เริ่ม

### `failed to connect to the docker API`
Docker daemon ไม่ได้ทำงาน ให้เปิด OrbStack หรือ Docker Desktop ก่อน

### e2e บอกว่า port 8080 ถูกใช้อยู่
`WEB_PORT=8081 docker compose ... up` แล้วรัน e2e ด้วย `BASE_URL=http://localhost:8081`

## ข้อจำกัดที่รู้อยู่

| # | ข้อจำกัด | ผลกระทบ | แนวทางแก้ |
|---|---|---|---|
| 1 | ไม่มี backoff ตอน RID ล่ม | request หลังเกิน TTL รอได้นานถึง 10 วินาทีทุกครั้งจนกว่า RID จะกลับมา | จำเวลาที่ล้มเหลวครั้งล่าสุด แล้วไม่ลองใหม่จนกว่าจะผ่านไปสักระยะ เช่น 1–5 นาที |
| 2 | ไม่เตือนเมื่อข้อมูลจาก RID เองเก่า | ผู้ใช้อาจเข้าใจว่าเป็นข้อมูลวันนี้ | เทียบ `date` กับวันปัจจุบัน (เวลาไทย) แล้วแสดงป้ายเตือน |
| 3 | Health check ไม่ได้ดูสถานะข้อมูล | ตอบ ok ได้แม้ RID ล่มมานาน | เพิ่ม `/api/ready` หรือใส่อายุของข้อมูลไว้ใน health |
| 4 | Cache อยู่ในหน่วยความจำ | restart แล้ว cache หาย ถ้า RID ล่มพร้อมกันจะได้ 503 และ cache ไม่แชร์กันระหว่าง instance | เขียน snapshot ล่าสุดลงไฟล์หรือ Redis |
| 5 | type ซ้ำกันระหว่าง backend กับ frontend | ถ้าแก้ฝั่งหนึ่งแล้วลืมอีกฝั่ง unit test จะไม่จับ มีแค่ e2e ที่จับได้ | ทำ package ร่วม หรือ export type จาก Elysia (Eden) |
| 6 | JS bundle 670 KB (gzip 198 KB) | โหลดครั้งแรกช้าบนเน็ตมือถือ | แยก chunk ของ Recharts หรือ lazy-load กราฟ |
| 7 | คลิกแท่งกราฟได้แค่กับเมาส์ | ผู้ใช้คีย์บอร์ดกรองผ่านกราฟไม่ได้ | ใช้ dropdown ได้อยู่แล้ว หรือเพิ่มปุ่มให้แต่ละภาค |
| 8 | ไม่มี CI | test ไม่รันอัตโนมัติตอน push | เพิ่ม GitHub Actions |
| 9 | ไม่มี Content-Security-Policy | ป้องกัน XSS ได้น้อยลง | เพิ่ม CSP ใน `security-headers.conf` (ต้องทดสอบกับ inline style ของ Recharts) |

## คำถามที่ยังไม่มีคำตอบ

- หน่วยเวลาของ `inflow` / `outflow` (ต่อวันหรือไม่)
- RID อัปเดตข้อมูลกี่โมง และกี่ครั้งต่อวัน (ใช้กำหนด `CACHE_TTL_SECONDS`)
- เกณฑ์ระดับสถานะทางการของกรมชลประทาน ถ้ามี

## งานในอนาคต (เรียงตามความคุ้มค่า)

1. **GitHub Actions CI:** รัน unit test, typecheck, build และ e2e กับ Docker stack ทุก push และทุก PR
2. **เตือนเมื่อข้อมูลจาก RID เก่า** (ข้อจำกัดข้อ 2) และ **backoff** (ข้อจำกัดข้อ 1)
3. **Deploy:** เลือกระหว่าง
   - **Docker บน server หรือ PaaS:** ใช้ของที่มีอยู่ได้ทันที
   - **Vercel:** frontend เป็น static ส่วน backend เป็น serverless function ต้องเพิ่ม `vercel.json` กับ function entry และเปลี่ยนจาก in-memory cache เป็น `Cache-Control: s-maxage=1800, stale-while-revalidate` บน CDN รวมถึงทดสอบว่า RID ยอมให้เรียกจาก region ของ Vercel หรือไม่
4. **เก็บ snapshot รายวัน:** เตรียมไว้สำหรับกราฟแนวโน้ม เพราะ RID ไม่มีข้อมูลย้อนหลัง ยิ่งเริ่มเก็บเร็ว ข้อมูลยิ่งมาก
5. แชร์ type, แยก chunk และ CSP (ข้อจำกัดข้อ 5, 6 และ 9)
6. **มุมมองแผนที่:** ทำได้เมื่อมีแหล่งพิกัดทางการที่ใช้ `id` เดียวกับ RID
