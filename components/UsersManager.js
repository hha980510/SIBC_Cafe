"use client";

import { useEffect, useState } from "react";

// 적립금(balance)은 센트(USD) 단위 정수로 저장됩니다. 입력창에는 보기 편하게 달러($) 단위로 보여줍니다.
function centsToDollarsInput(cents) {
  return ((cents || 0) / 100).toFixed(2);
}

function dollarsInputToCents(value) {
  const n = Math.round(parseFloat(value || "0") * 100);
  return Number.isFinite(n) ? n : 0;
}

function slugify(text, fallbackPrefix) {
  const base = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base) return base;
  return `${fallbackPrefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueId(baseId, existingIds) {
  if (!existingIds.has(baseId)) return baseId;
  let n = 2;
  while (existingIds.has(`${baseId}-${n}`)) n += 1;
  return `${baseId}-${n}`;
}

export default function UsersManager({ passcode }) {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftBalance, setDraftBalance] = useState("");

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError("사용자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAll(nextUsers) {
    const list = nextUsers ?? users;
    if (!list) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode ?? "",
        },
        body: JSON.stringify({ users: list }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "저장에 실패했습니다.");
        return;
      }
      setUsers(data.users);
      setNotice("사용자 목록을 저장했어요. 손님 주문 화면 드롭다운에도 바로 반영됩니다.");
    } catch (err) {
      setError("네트워크 오류로 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function addUser() {
    const name = draftName.trim();
    if (!name) {
      setError("추가할 이름을 입력해주세요.");
      return;
    }
    if ((users || []).some((u) => u.name === name)) {
      setError("이미 등록된 이름이에요.");
      return;
    }
    const existingIds = new Set((users || []).map((u) => u.id));
    const id = uniqueId(slugify(name, "user"), existingIds);
    const balance = dollarsInputToCents(draftBalance);
    setUsers((prev) => [...(prev || []), { id, name, balance }]);
    setDraftName("");
    setDraftBalance("");
    setError("");
    setNotice("");
  }

  function removeUser(id) {
    if (!confirm("이 이름을 삭제할까요? '전체 저장'을 눌러야 실제로 반영돼요.")) return;
    setUsers((prev) => (prev || []).filter((u) => u.id !== id));
    setNotice("");
  }

  function updateBalance(id, cents) {
    setUsers((prev) => (prev || []).map((u) => (u.id !== id ? u : { ...u, balance: cents })));
    setNotice("");
  }

  if (loading && !users) {
    return <div className="banner info">사용자 목록을 불러오는 중...</div>;
  }

  if (!users) {
    return <div className="banner error">{error || "사용자 목록을 불러오지 못했습니다."}</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>사용자 관리</h1>
        <div className="admin-actions">
          <button className="btn-secondary" onClick={loadUsers} disabled={loading || saving}>
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: "none" }}
            onClick={() => handleSaveAll()}
            disabled={saving}
          >
            {saving ? "저장 중..." : "전체 저장"}
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
        여기서 추가한 이름이 손님 주문 화면의 이름 드롭다운에 그대로 나타나요. 적립금은
        관리자 화면에만 보이고 손님에게는 표시되지 않아요. 이름 추가/삭제, 적립금 변경 후
        반드시 "전체 저장"을 눌러야 실제로 저장돼요. (여기서 적립금을 직접 고치면 회계
        탭에는 기록이 남지 않아요 — 입금 기록을 남기려면 회계 탭에서 추가해주세요.)
      </div>

      <div className="menu-manage-card">
        <table className="order-table">
          <thead>
            <tr>
              <th>이름</th>
              <th style={{ width: 120 }}>적립금 ($)</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "var(--sibc-muted)" }}>
                  등록된 이름이 없어요. 아래에서 추가해주세요.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={centsToDollarsInput(u.balance)}
                      onChange={(e) => updateBalance(u.id, dollarsInputToCents(e.target.value))}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger btn-danger-sm"
                      onClick={() => removeUser(u.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="menu-add-row">
          <input
            type="text"
            lang="ko"
            placeholder="이름 입력"
            value={draftName}
            maxLength={30}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUser();
              }
            }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="적립금($)"
            value={draftBalance}
            onChange={(e) => setDraftBalance(e.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={addUser}>
            + 이름 추가
          </button>
        </div>
      </div>
    </div>
  );
}
