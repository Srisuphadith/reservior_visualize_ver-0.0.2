import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DetailDrawer } from "../src/components/DetailDrawer";
import { Header } from "../src/components/Header";
import { KpiTiles } from "../src/components/KpiTiles";
import { ReservoirTable } from "../src/components/ReservoirTable";
import { StatusBadge } from "../src/components/StatusBadge";
import { RESERVOIRS, reservoir, summaryResponse } from "./data";

const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
const firstCells = () => bodyRows().map((r) => within(r).getAllByRole("cell")[1]!.textContent);

describe("StatusBadge", () => {
  test("shows a text label, not color alone", () => {
    render(<StatusBadge band="critical" />);
    expect(screen.getByText("น้ำน้อยวิกฤต")).toBeInTheDocument();
  });
});

describe("Header", () => {
  test("shows the Thai date and a stale badge when stale", () => {
    render(<Header date="2026-10-03" fetchedAt="2026-10-03T08:15:00Z" stale />);
    expect(screen.getByText("3 ต.ค. 2569")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("ข้อมูลอาจไม่เป็นปัจจุบัน");
  });

  test("hides the stale badge when fresh", () => {
    render(<Header date="2026-10-03" fetchedAt="2026-10-03T08:15:00Z" stale={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("KpiTiles", () => {
  test("renders national values", () => {
    render(<KpiTiles stats={summaryResponse().national} />);
    expect(screen.getByText("ปริมาณน้ำต่อความจุ").parentElement).toHaveTextContent("146.3%");
    expect(screen.getByText("ปริมาณน้ำในอ่าง").parentElement).toHaveTextContent("56.47");
    expect(screen.getByText("ไม่มีข้อมูลวันนี้ 1 อ่าง")).toBeInTheDocument();
  });
});

describe("ReservoirTable", () => {
  test("sorts by percent ascending by default with no-data rows last", () => {
    render(<ReservoirTable rows={RESERVOIRS} onSelect={() => {}} />);
    expect(firstCells()).toEqual(["rsv74", "rsv01", "rsv531", "rsv545", "rsv524"]);
  });

  test("keeps no-data rows last when sorting descending", async () => {
    const user = userEvent.setup();
    render(<ReservoirTable rows={RESERVOIRS} onSelect={() => {}} />);
    await user.click(screen.getByRole("button", { name: /% ความจุ/ }));
    expect(firstCells()).toEqual(["rsv545", "rsv531", "rsv01", "rsv74", "rsv524"]);
  });

  test("shows ไม่มีข้อมูล for null values and > 100% uncapped", () => {
    render(<ReservoirTable rows={RESERVOIRS} onSelect={() => {}} />);
    const noData = bodyRows().find((r) => r.textContent?.includes("rsv524"))!;
    expect(within(noData).getAllByText("ไม่มีข้อมูล").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("182.7%")).toBeInTheDocument();
  });

  test("clicking or pressing Enter on a row selects it", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ReservoirTable rows={RESERVOIRS} onSelect={onSelect} />);
    await user.click(screen.getByText("อ่างเก็บน้ำบึงละหาน"));
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: "rsv545" }));
    bodyRows()[0]!.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: "rsv74" }));
  });

  test("shows an empty message when nothing matches", () => {
    render(<ReservoirTable rows={[]} onSelect={() => {}} />);
    expect(screen.getByText("ไม่พบอ่างเก็บน้ำที่ตรงกับตัวกรอง")).toBeInTheDocument();
  });
});

describe("DetailDrawer", () => {
  test("shows details, net flow and the raw name when it differs", () => {
    const r = reservoir({ id: "rsv531", name: "อ่างเก็บน้ำ แม่สะลวม", displayName: "อ่างเก็บน้ำแม่สะลวม", netFlow: -0.022 });
    render(<DetailDrawer reservoir={r} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "อ่างเก็บน้ำแม่สะลวม" });
    expect(dialog).toHaveTextContent("-0.022");
    expect(dialog).toHaveTextContent("ชื่อตามต้นฉบับ: อ่างเก็บน้ำ แม่สะลวม");
  });

  test("shows ไม่มีข้อมูล for null net flow", () => {
    render(<DetailDrawer reservoir={reservoir({ inflow: null, netFlow: null })} onClose={() => {}} />);
    const row = screen.getByText("สุทธิ (ไหลเข้า − ระบาย)").parentElement!;
    expect(row).toHaveTextContent("ไม่มีข้อมูล");
  });

  test("closes with Escape and the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DetailDrawer reservoir={reservoir()} onClose={onClose} />);
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "ปิด" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test("renders nothing without a reservoir", () => {
    const { container } = render(<DetailDrawer reservoir={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
