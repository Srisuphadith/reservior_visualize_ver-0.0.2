import {
  formatFlow,
  formatPercent,
  formatSignedFlow,
  formatThaiDate,
  formatThaiDateTime,
  formatVolume,
} from "../src/lib/format";

describe("format", () => {
  test("volume uses 2 decimals and th-TH grouping", () => {
    expect(formatVolume(1234.567)).toBe("1,234.57");
    expect(formatVolume(0)).toBe("0.00");
  });

  test("percent uses 1 decimal and is never capped", () => {
    expect(formatPercent(79.4)).toBe("79.4%");
    expect(formatPercent(182.72)).toBe("182.7%");
  });

  test("null shows ไม่มีข้อมูล, never 0", () => {
    expect(formatVolume(null)).toBe("ไม่มีข้อมูล");
    expect(formatPercent(null)).toBe("ไม่มีข้อมูล");
    expect(formatFlow(null)).toBe("ไม่มีข้อมูล");
    expect(formatSignedFlow(null)).toBe("ไม่มีข้อมูล");
  });

  test("signed flow shows a plus for inflow surplus", () => {
    expect(formatSignedFlow(0.3)).toBe("+0.300");
    expect(formatSignedFlow(-0.064)).toBe("-0.064");
  });

  test("dates use the Thai Buddhist calendar", () => {
    expect(formatThaiDate("2026-10-03")).toBe("3 ต.ค. 2569");
    expect(formatThaiDate("not-a-date")).toBe("not-a-date");
  });

  test("date-times are shown in Bangkok time", () => {
    // 08:15 UTC = 15:15 in Bangkok (UTC+7)
    expect(formatThaiDateTime("2026-10-03T08:15:00Z")).toContain("15:15");
    expect(formatThaiDateTime("2026-10-03T08:15:00Z")).toContain("2569");
  });
});
