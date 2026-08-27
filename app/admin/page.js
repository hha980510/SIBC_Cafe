"use client";

import { useEffect, useState } from "react";
import MaimLogo from "@/components/MaimLogo";

const STORAGE_KEY = "sibc_cafe_admin_passcode";
const PRINTED_KEY = "sibc_cafe_printed_ids";

// price/total은 센트(USD) 단위 정수로 저장되어 있습니다. (예: 300 = $3.00)
function formatUSD(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return iso;
  }
}

function itemLabel(i) {
  return i.temp ? `${i.name}(${i.temp}) x${i.qty}` : `${i.name} x${i.qty}`;
}

function summarizeItems(items) {
  return items.map(itemLabel).join(", ");
}

function loadPrintedIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(PRINTED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

function savePrintedIds(set) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PRINTED_KEY, JSON.stringify(Array.from(set)));
}

export default function AdminPage() {
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcode, setPasscode] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [tab, setTab] = useState("print"); // "print" | "history"
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [printedIds, setPrintedIds] = useState(() => new Set());
  const [selectedHistoryIds, setSelectedHistoryIds] = useState(() => new Set());
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPrintedIds(loadPrintedIds());
    const saved =
      typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved !== null) {
      setPasscode(saved);
      fetchOrders(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOrders(code) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        headers: { "x-admin-passcode": code ?? "" },
        cache: "no-store",
      });
      const data = await res.json();

      if (res.status === 401) {
        setAuthorized(false);
        setError("비밀번호가 올바르지 않습니다.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "주문 목록을 불러오지 못했습니다.");
        return;
      }

      const fetched = data.orders || [];
      setOrders(fetched);

      // 사라진 주문(초기화 등으로 삭제된) id는 printed 목록에서도 정리
      const validIds = new Set(fetched.map((o) => o.id));
      setPrintedIds((prev) => {
        const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
        savePrintedIds(next);
        return next;
      });

      setAuthorized(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(STORAGE_KEY, code ?? "");
      }
      setPasscode(code ?? "");
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleGateSubmit(e) {
    e.preventDefault();
    fetchOrders(passcodeInput);
  }

  async function handleReset() {
    if (!confirm("모든 주문 내역을 초기화할까요? 라벨을 먼저 출력했는지 확인해주세요.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "x-admin-passcode": passcode ?? "" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "초기화에 실패했습니다.");
        return;
      }
      setOrders([]);
      setPrintedIds(new Set());
      savePrintedIds(new Set());
      setSelectedHistoryIds(new Set());
    } catch (err) {
      setError("네트워크 오류로 초기화에 실패했습니다.");
    } finally {
      setResetting(false);
    }
  }

  function handlePrintLabels(ids) {
    window.print();
    setPrintedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      savePrintedIds(next);
      return next;
    });
  }

  function toggleHistorySelect(id) {
    setSelectedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleRequeueSelected() {
    if (selectedHistoryIds.size === 0) return;
    setPrintedIds((prev) => {
      const next = new Set(prev);
      selectedHistoryIds.forEach((id) => next.delete(id));
      savePrintedIds(next);
      return next;
    });
    const count = selectedHistoryIds.size;
    setSelectedHistoryIds(new Set());
    setNotice(`${count}건을 라벨 출력 대기 목록으로 올렸어요.`);
    setTab("print");
  }

  if (!authorized) {
    return (
      <main className="admin-page">
        <div className="passcode-gate">
          <MaimLogo size={64} className="passcode-logo" />
          <h1>MAIM CAFE 관리자</h1>
          <form onSubmit={handleGateSubmit}>
            <div className="field">
              <label htmlFor="passcode">관리자 비밀번호</label>
              <input
                id="passcode"
                type="password"
                placeholder="설정한 경우에만 입력"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
              />
            </div>
            {error && <div className="banner error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 10 }}>
              {loading ? "확인 중..." : "입장"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 라벨 출력 탭: 아직 출력 처리되지 않은(=대기 중인) 주문만
  const pendingOrders = (orders || []).filter((o) => !printedIds.has(o.id));

  const totalCups = pendingOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  const tally = {};
  pendingOrders.forEach((o) => {
    o.items.forEach((i) => {
      const label = i.temp ? `${i.name}(${i.temp})` : i.name;
      tally[label] = (tally[label] || 0) + i.qty;
    });
  });

  // 라벨 1장 = 음료 1잔. 한 주문에 여러 잔이 담겨 있으면 잔 수만큼 라벨을 각각 만듭니다.
  const labelSlips = [];
  pendingOrders.forEach((o) => {
    const cupsInOrder = o.items.reduce((s, i) => s + i.qty, 0);
    let cupIndex = 0;
    o.items.forEach((i) => {
      for (let n = 0; n < i.qty; n++) {
        cupIndex += 1;
        labelSlips.push({
          key: `${o.id}-${i.id}-${i.temp || "na"}-${n}`,
          order: o,
          item: i,
          cupIndex,
          cupsInOrder,
        });
      }
    });
  });

  // 전체 내역 탭: 기간(시작일~종료일) 필터링, printed 여부와 무관하게 전부 표시
  const filteredOrders = (orders || []).filter((o) => {
    if (!dateFrom && !dateTo) return true;
    const t = new Date(o.createdAt).getTime();
    if (dateFrom) {
      const fromTime = new Date(`${dateFrom}T00:00:00`).getTime();
      if (t < fromTime) return false;
    }
    if (dateTo) {
      const toTime = new Date(`${dateTo}T23:59:59`).getTime();
      if (t > toTime) return false;
    }
    return true;
  });
  const filteredCups = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  );
  const filteredTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <button
            type="button"
            className={`sidebar-tab ${tab === "print" ? "active" : ""}`}
            onClick={() => setTab("print")}
          >
            라벨 출력
          </button>
          <button
            type="button"
            className={`sidebar-tab ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >
            전체 내역
          </button>
        </aside>

        <div className="admin-content">
          {error && (
            <div className="banner error" style={{ margin: "0 0 16px" }}>
              {error}
            </div>
          )}
          {notice && (
            <div className="banner success" style={{ margin: "0 0 16px" }}>
              {notice}
            </div>
          )}

          {tab === "print" ? (
            <>
              <div className="admin-header">
                <h1>라벨 출력</h1>
                <div className="admin-actions">
                  <button className="btn-secondary" onClick={() => fetchOrders(passcode)} disabled={loading}>
                    {loading ? "불러오는 중..." : "새로고침"}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handlePrintLabels(pendingOrders.map((o) => o.id))}
                    disabled={pendingOrders.length === 0}
                  >
                    라벨 출력
                  </button>
                  <button
                    className="btn-danger"
                    onClick={handleReset}
                    disabled={resetting || !orders || orders.length === 0}
                  >
                    {resetting ? "초기화 중..." : "초기화"}
                  </button>
                </div>
              </div>

              <div className="summary-row">
                <div className="summary-chip">
                  <div className="chip-label">대기 중인 주문</div>
                  <div className="chip-value">{pendingOrders.length}건</div>
                </div>
                <div className="summary-chip">
                  <div className="chip-label">총 잔 수</div>
                  <div className="chip-value">{totalCups}잔</div>
                </div>
              </div>

              {Object.keys(tally).length > 0 && (
                <div className="menu-tally">
                  <h2>메뉴별 집계</h2>
                  {Object.entries(tally).map(([name, qty]) => (
                    <div className="tally-row" key={name}>
                      <span>{name}</span>
                      <span>{qty}잔</span>
                    </div>
                  ))}
                </div>
              )}

              {pendingOrders.length === 0 ? (
                <div className="banner info">
                  라벨 출력 대기 중인 주문이 없습니다. (전체 내역 탭에서 다시 올릴 수 있어요)
                </div>
              ) : (
                <>
                  <div className="banner info">
                    현재 {pendingOrders.length}건 대기 중 — "라벨 출력"을 누르면 라벨이 인쇄돼요.
                  </div>
                  <table className="order-table" style={{ marginTop: 14 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>이름</th>
                        <th>메뉴</th>
                        <th>주문일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labelSlips.map((slip, idx) => (
                        <tr key={slip.key}>
                          <td>{idx + 1}</td>
                          <td>
                            {slip.order.customerName}
                            {slip.cupsInOrder > 1 ? ` (${slip.cupIndex}/${slip.cupsInOrder})` : ""}
                          </td>
                          <td>{slip.item.temp ? `${slip.item.name}(${slip.item.temp})` : slip.item.name}</td>
                          <td>{formatTime(slip.order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          ) : (
            <>
              <div className="admin-header">
                <h1>전체 내역</h1>
                <div className="date-range">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="시작일"
                  />
                  <span className="date-range-sep">~</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="종료일"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                    >
                      기간 초기화
                    </button>
                  )}
                </div>
              </div>

              <div className="history-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: "none" }}
                  onClick={handleRequeueSelected}
                  disabled={selectedHistoryIds.size === 0}
                >
                  선택 {selectedHistoryIds.size}건 라벨 출력탭으로 올리기
                </button>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="banner info">해당 기간에 주문 내역이 없습니다.</div>
              ) : (
                <table className="order-table">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}></th>
                      <th>이름</th>
                      <th>메뉴</th>
                      <th>요청사항</th>
                      <th>금액</th>
                      <th>일시</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedHistoryIds.has(o.id)}
                            onChange={() => toggleHistorySelect(o.id)}
                            aria-label={`${o.customerName} 선택`}
                          />
                        </td>
                        <td>{o.customerName}</td>
                        <td>{summarizeItems(o.items)}</td>
                        <td>{o.note || "-"}</td>
                        <td>{formatUSD(o.total)}</td>
                        <td>{formatTime(o.createdAt)}</td>
                        <td>
                          {printedIds.has(o.id) ? (
                            <span className="status-pill done">출력완료</span>
                          ) : (
                            <span className="status-pill pending">대기중</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="history-total">
                <span>
                  총 {filteredOrders.length}건 · {filteredCups}잔
                </span>
                <span className="history-total-amount">{formatUSD(filteredTotal)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 인쇄 시에만 보이는 라벨 뷰: 음료 1잔 = 라벨 1장(2.4 x 1.3인치) */}
      <div className="receipt">
        {labelSlips.map((slip) => (
          <div className="label" key={slip.key}>
            <div className="label-top">
              <span className="label-name">{slip.order.customerName}</span>
              <span className="label-num">
                {slip.cupsInOrder > 1 ? `${slip.cupIndex}/${slip.cupsInOrder}` : ""}
              </span>
            </div>
            <div className="label-items">
              <div>{slip.item.temp ? `${slip.item.name}(${slip.item.temp})` : slip.item.name}</div>
            </div>
            {slip.order.note && <div className="label-note">메모: {slip.order.note}</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
