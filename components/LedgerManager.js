"use client";

import { useEffect, useState } from "react";

// amount/balance는 센트(USD) 단위 정수로 저장됩니다.
function formatUSD(cents) {
  const n = (cents || 0) / 100;
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
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

export default function LedgerManager({ passcode }) {
  const [transactions, setTransactions] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [depositUserId, setDepositUserId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [ledgerRes, usersRes] = await Promise.all([
        fetch("/api/ledger", {
          headers: { "x-admin-passcode": passcode ?? "" },
          cache: "no-store",
        }),
        fetch("/api/users", { cache: "no-store" }),
      ]);
      const ledgerData = await ledgerRes.json();
      const usersData = await usersRes.json();

      if (!ledgerRes.ok) {
        setError(ledgerData.error || "회계 기록을 불러오지 못했습니다.");
        setTransactions([]);
      } else {
        setTransactions(ledgerData.transactions || []);
      }

      const sortedUsers = [...(usersData.users || [])].sort((a, b) =>
        a.name.localeCompare(b.name, "ko")
      );
      setUsers(sortedUsers);
    } catch (err) {
      setError("네트워크 오류로 불러오지 못했습니다.");
      setTransactions((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    setError("");
    setNotice("");
    if (!depositUserId) {
      setError("입금할 이름을 선택해주세요.");
      return;
    }
    const amount = Math.round(parseFloat(depositAmount || "0") * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("입금액을 올바르게 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode ?? "",
        },
        body: JSON.stringify({ userId: depositUserId, amount, note: depositNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "입금 처리에 실패했습니다.");
        return;
      }

      setTransactions((prev) => [data.transaction, ...(prev || [])]);
      setUsers((prev) =>
        prev.map((u) => (u.id === data.user.id ? { ...u, balance: data.user.balance } : u))
      );
      setDepositAmount("");
      setDepositNote("");
      setNotice(`${data.transaction.userName}님에게 ${formatUSD(data.transaction.amount)} 입금을 기록했어요.`);
    } catch (err) {
      setError("네트워크 오류로 입금 처리에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !transactions) {
    return <div className="banner info">회계 기록을 불러오는 중...</div>;
  }

  const list = transactions || [];

  return (
    <div>
      <div className="admin-header">
        <h1>회계</h1>
        <div className="admin-actions">
          <button className="btn-secondary" onClick={loadAll} disabled={loading || saving}>
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>
      </div>

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
      <div className="banner info" style={{ margin: "0 0 16px" }}>
        출금은 등록된 이름으로 주문이 들어올 때 자동으로 기록돼요. 입금(충전)은 아래에서
        이름과 금액을 선택해 직접 추가해주세요.
      </div>

      <div className="menu-manage-card">
        <h2>사용자별 현재 잔액</h2>
        {users.length === 0 ? (
          <div className="banner info">등록된 사용자가 없어요. 사용자 관리 탭에서 먼저 추가해주세요.</div>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>이름</th>
                <th style={{ width: 120 }}>현재 잔액</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className={(u.balance || 0) < 0 ? "amount-negative" : "amount-positive"}>
                    {formatUSD(u.balance || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="menu-add-row">
          <select value={depositUserId} onChange={(e) => setDepositUserId(e.target.value)}>
            <option value="">입금할 이름 선택</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="입금액($)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <input
            type="text"
            placeholder="메모(선택)"
            value={depositNote}
            maxLength={60}
            onChange={(e) => setDepositNote(e.target.value)}
          />
          <button type="button" className="btn-primary" style={{ flex: "none" }} onClick={handleDeposit} disabled={saving}>
            {saving ? "처리 중..." : "+ 입금 추가"}
          </button>
        </div>
      </div>

      <div className="menu-manage-card">
        <h2>입출금 기록</h2>
        {list.length === 0 ? (
          <div className="banner info">아직 입출금 기록이 없어요.</div>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>구분</th>
                <th>이름</th>
                <th>금액</th>
                <th>메모</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {list.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    {tx.type === "deposit" ? (
                      <span className="status-pill done">입금</span>
                    ) : (
                      <span className="status-pill pending">출금</span>
                    )}
                  </td>
                  <td>{tx.userName}</td>
                  <td className={tx.type === "deposit" ? "amount-positive" : "amount-negative"}>
                    {tx.type === "deposit" ? "+" : "-"}
                    {formatUSD(tx.amount)}
                  </td>
                  <td>{tx.note || "-"}</td>
                  <td>{formatTime(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
