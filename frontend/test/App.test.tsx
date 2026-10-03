import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import { reservoirsResponse, summaryResponse } from "./data";

function mockApi(responses: Record<string, () => Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const handler = responses[url];
    return handler ? handler() : new Response("not found", { status: 404 });
  });
}

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

const ok = { "/api/summary": () => Response.json(summaryResponse()), "/api/reservoirs": () => Response.json(reservoirsResponse()) };

afterEach(() => vi.restoreAllMocks());

const tableRowIds = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).getAllByRole("cell")[1]!.textContent);

describe("App", () => {
  test("shows loading, then the dashboard", async () => {
    mockApi(ok);
    renderApp();
    expect(screen.getByText("กำลังโหลดข้อมูล…")).toBeInTheDocument();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText("3 ต.ค. 2569")).toBeInTheDocument();
    expect(tableRowIds()).toHaveLength(5);
  });

  test("shows an error with retry when the API fails", async () => {
    mockApi({ "/api/summary": () => new Response("", { status: 503 }), "/api/reservoirs": ok["/api/reservoirs"] });
    renderApp();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("โหลดข้อมูลไม่สำเร็จ");
    expect(within(alert).getByRole("button", { name: "ลองใหม่" })).toBeInTheDocument();
  });

  test("shows the stale badge when the backend serves stale data", async () => {
    mockApi({ ...ok, "/api/summary": () => Response.json(summaryResponse({ stale: true })) });
    renderApp();
    expect(await screen.findByText(/ข้อมูลอาจไม่เป็นปัจจุบัน/)).toBeInTheDocument();
  });

  test("region filter updates the lists, table and URL", async () => {
    const user = userEvent.setup();
    mockApi(ok);
    renderApp();
    await screen.findByRole("table");

    await user.selectOptions(screen.getByLabelText("ภาค"), "ภาคเหนือ");

    expect(tableRowIds()).toEqual(["rsv01", "rsv531"]);
    const over = screen.getByRole("region", { name: /อ่างที่น้ำเกินความจุ/ });
    expect(within(over).getByText("ไม่มีอ่างที่น้ำเกินความจุ")).toBeInTheDocument();
    const lowestList = screen.getByRole("region", { name: /10 อ่างที่น้ำน้อยที่สุด/ });
    expect(within(lowestList).queryByText(/rsv74/)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /จำนวนอ่างตามสถานะน้ำ/ })).toHaveTextContent("ภาคเหนือ");
    expect(window.location.search).toBe(`?region=${encodeURIComponent("ภาคเหนือ")}`);

    await user.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));
    expect(tableRowIds()).toHaveLength(5);
    expect(window.location.search).toBe("");
  });

  test("restores filters from the URL", async () => {
    window.history.replaceState(null, "", "/?band=over");
    mockApi(ok);
    renderApp();
    await screen.findByRole("table");
    expect(tableRowIds()).toEqual(["rsv545"]);
  });

  test("search and status filters narrow the table", async () => {
    const user = userEvent.setup();
    mockApi(ok);
    renderApp();
    await screen.findByRole("table");

    await user.type(screen.getByLabelText("ค้นหา"), "บึง ละหาน");
    expect(tableRowIds()).toEqual(["rsv545"]);

    await user.clear(screen.getByLabelText("ค้นหา"));
    await user.selectOptions(screen.getByLabelText("สถานะ"), "nodata");
    expect(tableRowIds()).toEqual(["rsv524"]);
  });

  test("clicking a ranked reservoir opens the detail drawer", async () => {
    const user = userEvent.setup();
    mockApi(ok);
    renderApp();
    await screen.findByRole("table");

    const over = screen.getByRole("region", { name: /อ่างที่น้ำเกินความจุ/ });
    await user.click(within(over).getByRole("button", { name: /บึงละหาน/ }));
    const dialog = screen.getByRole("dialog", { name: "อ่างเก็บน้ำบึงละหาน" });
    expect(dialog).toHaveTextContent("182.7%");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
