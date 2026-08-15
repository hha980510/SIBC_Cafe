"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sibc_cafe_admin_passcode";

function formatWon(n) {
  return `${(n || 0).toLocaleString("ko-KR")}원`;
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

function summarizeItems(items) {
  return items.map((i) => `${i.name} x${i.qty}`).join(", ");
}

export default function AdminPage() {
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcode, setPasscode] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
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

      setOrders(data.orders || []);
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
    if (!confirm("모든 주문 내역을 초기화할까요? 영수증을 먼저 출력했는지 확인해주세요.")) {
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
    } catch (err) {
      setError("네트워크 오류로 초기화에 실패했습니다.");
    } finally {
      setResetting(false);
    }
  }

  if (!authorized) {
    return (
      <main className="admin-page">
        <div className="passcode-gate">
          <h1>SIBC CAFE 관리자</h1>
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

  const totalCups = (orders || []).reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  );
  const totalAmount = (orders || []).reduce((sum, o) => sum + o.total, 0);

  const tally = {};
  (orders || []).forEach((o) => {
    o.items.forEach((i) => {
      tally[i.name] = (tally[i.name] || 0) + i.qty;
    });
  });

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>주문 관리</h1>
        <div className="admin-actions">
          <button className="btn-secondary" onClick={() => fetchOrders(passcode)} disabled={loading}>
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
          <button className="btn-secondary" onClick={() => window.print()} disabled={!orders || orders.length === 0}>
            영수증 출력
          </button>
          <button className="btn-danger" onClick={handleReset} disabled={resetting || !orders || orders.length === 0}>
            {resetting ? "초기화 중..." : "초기화"}
          </button>
        </div>
      </div>

      {error && <div className="banner error" style={{ margin: "0 0 16px" }}>{error}</div>}

      <div className="summary-row">
        <div className="summary-chip">
          <div className="chip-label">총 주문 건수</div>
          <div className="chip-value">{(orders || []).length}건</div>
        </div>
        <div className="summary-chip">
          <div className="chip-label">총 잔 수</div>
          <div className="chip-value">{totalCups}잔</div>
        </div>
        <div className="summary-chip">
          <div className="chip-label">총 금액</div>
          <div className="chip-value">{formatWon(totalAmount)}</div>
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

      {!orders || orders.length === 0 ? (
        <div className="banner info">아직 접수된 주문이 없습니다.</div>
      ) : (
        <table className="order-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>메뉴</th>
              <th>요청사항</th>
              <th>금액</th>
              <th>시간</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.customerName}</td>
                <td>{summarizeItems(o.items)}</td>
                <td>{o.note || "-"}</td>
                <td>{formatWon(o.total)}</td>
                <td>{formatTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 인쇄 시에만 보이는 영수증 뷰 */}
      <div className="receipt">
        <h2>SIBC CAFE</h2>
        <p style={{ textAlign: "center" }}>주문 영수증 · {new Date().toLocaleString("ko-KR")}</p>
        {(orders || []).map((o, idx) => (
          <div className="receipt-order" key={o.id}>
            <div>
              #{idx + 1} {o.customerName} ({formatTime(o.createdAt)})
            </div>
            <table>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name} x{i.qty}</td>
                    <td style={{ textAlign: "right" }}>{formatWon(i.price * i.qty)}</td>
                  </tr>
                ))}
                {o.note && (
                  <tr>
                    <td colSpan={2}>메모: {o.note}</td>
                  </tr>
                )}
                <tr>
                  <td>
                    <strong>소계</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{formatWon(o.total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
        <div className="receipt-order" style={{ borderTop: "2px solid #000" }}>
          <table>
            <tbody>
              <tr>
                <td>
                  <strong>총 {totalCups}잔 / 총 {(orders || []).length}건</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>{formatWon(totalAmount)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
