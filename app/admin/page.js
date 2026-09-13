"use client";

import { useEffect, useState } from "react";
import MaimLogo from "@/components/MaimLogo";
import MenuManager from "@/components/MenuManager";
import UsersManager from "@/components/UsersManager";
import LedgerManager from "@/components/LedgerManager";
import { CATEGORIES } from "@/lib/menu";

const STORAGE_KEY = "sibc_cafe_admin_passcode";
// 라벨 1장(=음료 1잔) 단위로 출력 여부를 기억합니다. (예전에는 주문 단위였습니다)
const PRINTED_LABEL_KEYS_KEY = "sibc_cafe_printed_label_keys";

// 추가요청 항목은 더 이상 별도 라벨/잔으로 세지 않고 주문의 요청사항(note)으로 들어갑니다.
// 예전에 저장된 주문이 여전히 items에 추가요청을 포함하고 있을 수 있어 방어적으로 걸러냅니다.
const EXTRA_ITEM_IDS = new Set(
  (CATEGORIES.find((c) => c.isExtra)?.items || []).map((i) => i.id)
);

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

// 계정(customerName)은 잔액 차감용 실제 등록 계정이고, displayName은 한 계정을
// 여럿이 같이 쓸 때 실제 주문자를 구분하려고 손님이 직접 적은 이름입니다.
// 화면/라벨에는 displayName이 있으면 그걸 우선 보여줍니다.
function displayNameOf(order) {
  return (order?.displayName || "").trim() || order?.customerName || "";
}

// 같은 날짜(현지 기준) 묶음을 구분하기 위한 키입니다.
function dateKeyOf(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// 날짜 구분줄에 보여줄 한글/영문 병기 문구입니다. 예: "9월 13일 (일) · Sep 13 (Sun)"
function formatDateHeading(iso) {
  const d = new Date(iso);
  const ko = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const en = d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
  return `${ko} · ${en}`;
}

// 정렬된 주문 목록을 날짜(현지 기준)별로 묶습니다.
function groupOrdersByDay(sortedOrders) {
  const groups = [];
  let current = null;
  sortedOrders.forEach((o) => {
    const key = dateKeyOf(o.createdAt);
    if (!current || current.key !== key) {
      current = { key, heading: formatDateHeading(o.createdAt), orders: [] };
      groups.push(current);
    }
    current.orders.push(o);
  });
  return groups;
}

// 추가요청 항목인지 판단합니다. 새 주문은 isExtra 플래그로, 그 플래그가 없던
// 예전 주문은 메뉴 id가 추가요청 카테고리 id 목록에 있는지로 방어적으로 판단합니다.
function isExtraItem(i) {
  return Boolean(i.isExtra) || EXTRA_ITEM_IDS.has(i.id);
}

function itemLabel(i) {
  const name = i.temp ? `${i.name}(${i.temp})` : i.name;
  return isExtraItem(i) ? `+${name}` : `${name} x${i.qty}`;
}

function summarizeItems(items) {
  return items.map(itemLabel).join(", ");
}

// 라벨 1장 = 음료 1잔. 한 주문에 여러 잔이 담겨 있으면 잔 수만큼 라벨을 각각 만듭니다.
// 추가요청 항목은 별도 라벨을 만들지 않고 주문의 note로만 표시됩니다.
// (주문 목록을 받아 전체 라벨 목록을 만드는 순수 함수 — 대기중/출력완료 여부와 무관합니다)
function buildLabelSlips(orders) {
  const slips = [];
  orders.forEach((o) => {
    const drinkItems = o.items.filter((i) => !isExtraItem(i));
    const cupsInOrder = drinkItems.reduce((s, i) => s + i.qty, 0);
    let cupIndex = 0;
    drinkItems.forEach((i) => {
      for (let n = 0; n < i.qty; n++) {
        cupIndex += 1;
        slips.push({
          key: `${o.id}-${i.id}-${i.temp || "na"}-${n}`,
          order: o,
          item: i,
          cupIndex,
          cupsInOrder,
        });
      }
    });
  });
  return slips;
}

// 주문 id -> 그 주문에 속한 라벨 key 목록. 주문 삭제/재대기 처리 시 재사용합니다.
function groupSlipKeysByOrderId(slips) {
  const map = new Map();
  slips.forEach((slip) => {
    if (!map.has(slip.order.id)) map.set(slip.order.id, []);
    map.get(slip.order.id).push(slip.key);
  });
  return map;
}

// 라벨 목록을 날짜(현지 기준)별로 묶습니다. groupOrdersByDay와 달리 입력이 미리
// 정렬돼 있지 않아도 되고(같은 날짜가 떨어져 있어도 됨), 묶은 뒤 날짜가 최신순으로
// 오도록 그룹만 재정렬합니다 — 그룹 내부 라벨 순서(조리 순서: 오래된 순)는 유지됩니다.
function groupLabelSlipsByDay(slips) {
  const map = new Map();
  slips.forEach((slip) => {
    const key = dateKeyOf(slip.order.createdAt);
    if (!map.has(key)) {
      const d = new Date(slip.order.createdAt);
      map.set(key, {
        key,
        heading: formatDateHeading(slip.order.createdAt),
        dayStart: d.setHours(0, 0, 0, 0),
        slips: [],
      });
    }
    map.get(key).slips.push(slip);
  });
  return Array.from(map.values()).sort((a, b) => b.dayStart - a.dayStart);
}

function loadPrintedLabelKeys() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(PRINTED_LABEL_KEYS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

function savePrintedLabelKeys(set) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PRINTED_LABEL_KEYS_KEY, JSON.stringify(Array.from(set)));
}

export default function AdminPage() {
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcode, setPasscode] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [tab, setTab] = useState("print"); // "print" | "history" | "menu" | "users" | "ledger"
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [printedLabelKeys, setPrintedLabelKeys] = useState(() => new Set());
  const [selectedHistoryIds, setSelectedHistoryIds] = useState(() => new Set());
  const [selectedLabelKeys, setSelectedLabelKeys] = useState(() => new Set());
  const [printQueue, setPrintQueue] = useState(null); // 출력 대상 라벨 key 배열, 없으면 null
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPrintedLabelKeys(loadPrintedLabelKeys());
    const saved =
      typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved !== null) {
      setPasscode(saved);
      fetchOrders(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // printQueue가 채워지면(=출력 버튼을 눌러 리시트 DOM이 그 내용으로 다시 그려진 뒤)
  // 실제로 인쇄를 실행하고, 인쇄한 라벨들을 출력완료로 표시합니다. setState 직후 바로
  // window.print()를 부르면 아직 리렌더 전의(=출력하려는 것과 다른) 화면이 인쇄될 수
  // 있어 useEffect로 커밋 이후에 실행합니다.
  useEffect(() => {
    if (!printQueue) return;
    window.print();
    setPrintedLabelKeys((prev) => {
      const next = new Set(prev);
      printQueue.forEach((k) => next.add(k));
      savePrintedLabelKeys(next);
      return next;
    });
    setSelectedLabelKeys((prev) => {
      const next = new Set(prev);
      printQueue.forEach((k) => next.delete(k));
      return next;
    });
    setPrintQueue(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printQueue]);

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

      // 사라진 주문(초기화 등으로 삭제된)에 딸린 라벨 key는 printed/selected 목록에서도 정리
      const validKeys = new Set(buildLabelSlips(fetched).map((s) => s.key));
      setPrintedLabelKeys((prev) => {
        const next = new Set(Array.from(prev).filter((k) => validKeys.has(k)));
        savePrintedLabelKeys(next);
        return next;
      });
      setSelectedLabelKeys((prev) => new Set(Array.from(prev).filter((k) => validKeys.has(k))));

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
      setPrintedLabelKeys(new Set());
      savePrintedLabelKeys(new Set());
      setSelectedHistoryIds(new Set());
      setSelectedLabelKeys(new Set());
    } catch (err) {
      setError("네트워크 오류로 초기화에 실패했습니다.");
    } finally {
      setResetting(false);
    }
  }

  function toggleLabelSelect(key) {
    setSelectedLabelKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleDayLabelSelection(daySlips) {
    const keys = daySlips.map((s) => s.key);
    const allSelected = keys.every((k) => selectedLabelKeys.has(k));
    setSelectedLabelKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function handlePrintAll() {
    if (pendingLabelSlips.length === 0) return;
    setPrintQueue(pendingLabelSlips.map((s) => s.key));
  }

  function handlePrintSelected() {
    if (selectedLabelKeys.size === 0) return;
    setPrintQueue(Array.from(selectedLabelKeys));
  }

  function handleDeleteSelectedLabels() {
    if (selectedLabelKeys.size === 0) return;
    const count = selectedLabelKeys.size;
    if (!confirm(`선택한 라벨 ${count}장을 목록에서 삭제할까요? (주문 자체는 삭제되지 않아요)`)) return;
    setPrintedLabelKeys((prev) => {
      const next = new Set(prev);
      selectedLabelKeys.forEach((k) => next.add(k));
      savePrintedLabelKeys(next);
      return next;
    });
    setSelectedLabelKeys(new Set());
    setNotice(`라벨 ${count}장을 목록에서 삭제했어요.`);
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
    const keysToRequeue = new Set();
    selectedHistoryIds.forEach((id) => {
      (slipKeysByOrderId.get(id) || []).forEach((k) => keysToRequeue.add(k));
    });
    setPrintedLabelKeys((prev) => {
      const next = new Set(Array.from(prev).filter((k) => !keysToRequeue.has(k)));
      savePrintedLabelKeys(next);
      return next;
    });
    const count = selectedHistoryIds.size;
    setSelectedHistoryIds(new Set());
    setNotice(`${count}건을 라벨 출력 대기 목록으로 올렸어요.`);
    setTab("print");
  }

  async function handleDeleteOrders(ids) {
    if (ids.length === 0) return;
    const confirmText =
      ids.length === 1
        ? "이 주문 내역을 삭제할까요? 되돌릴 수 없습니다."
        : `선택한 ${ids.length}건을 삭제할까요? 되돌릴 수 없습니다.`;
    if (!confirm(confirmText)) return;

    setDeletingIds((prev) => new Set([...Array.from(prev), ...ids]));
    try {
      // DELETE 요청 body는 일부 환경에서 누락될 수 있어, 지울 id는 쿼리스트링으로 보냅니다.
      const query = new URLSearchParams({ ids: ids.join(",") }).toString();
      const res = await fetch(`/api/orders?${query}`, {
        method: "DELETE",
        headers: { "x-admin-passcode": passcode ?? "" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "삭제에 실패했습니다.");
        return;
      }

      const idSet = new Set(ids);
      setOrders((prev) => (prev || []).filter((o) => !idSet.has(o.id)));

      const keysToRemove = new Set();
      ids.forEach((id) => {
        (slipKeysByOrderId.get(id) || []).forEach((k) => keysToRemove.add(k));
      });
      setPrintedLabelKeys((prev) => {
        const next = new Set(Array.from(prev).filter((k) => !keysToRemove.has(k)));
        savePrintedLabelKeys(next);
        return next;
      });
      setSelectedLabelKeys((prev) => new Set(Array.from(prev).filter((k) => !keysToRemove.has(k))));
      setSelectedHistoryIds((prev) => new Set(Array.from(prev).filter((id) => !idSet.has(id))));
      setNotice(`${ids.length}건을 삭제했어요.`);
    } catch (err) {
      setError("네트워크 오류로 삭제에 실패했습니다.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
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

  // 라벨(=음료 1잔) 단위로 출력 여부를 추적합니다. 이 주문 목록 기준 전체 라벨과,
  // 주문별 라벨 key 목록(재대기/삭제 시 재사용)을 먼저 만들어둡니다.
  const allLabelSlips = buildLabelSlips(orders || []);
  const slipKeysByOrderId = groupSlipKeysByOrderId(allLabelSlips);
  const labelSlipsByKey = new Map(allLabelSlips.map((s) => [s.key, s]));

  // 아직 출력하지 않은 라벨만 모읍니다. (한 주문의 일부 잔만 출력된 "부분 출력" 상태도 가능)
  const pendingLabelSlips = allLabelSlips.filter((slip) => !printedLabelKeys.has(slip.key));

  // 주문 단위 출력완료/부분출력 여부는 그 주문에 속한 라벨 key들로부터 계산합니다.
  const printedOrderIds = new Set();
  const partialOrderIds = new Set();
  (orders || []).forEach((o) => {
    const keys = slipKeysByOrderId.get(o.id) || [];
    if (keys.length === 0 || keys.every((k) => printedLabelKeys.has(k))) {
      printedOrderIds.add(o.id);
    } else if (keys.some((k) => printedLabelKeys.has(k))) {
      partialOrderIds.add(o.id);
    }
  });

  // 라벨 출력 탭: 아직 출력이 다 끝나지 않은(=대기 중이거나 부분 출력된) 주문만
  const pendingOrders = (orders || []).filter((o) => !printedOrderIds.has(o.id));

  const totalCups = pendingLabelSlips.length;

  const tally = {};
  pendingLabelSlips.forEach((slip) => {
    const label = slip.item.temp ? `${slip.item.name}(${slip.item.temp})` : slip.item.name;
    tally[label] = (tally[label] || 0) + 1;
  });

  // 라벨 출력 탭도 전체 내역처럼 날짜별로 묶되(최신 날짜가 위로), 각 날짜 안에서는
  // 조리 순서(오래된 순)를 유지합니다. 목록 전체에 걸친 연속 번호도 미리 매겨둡니다.
  const printDayGroups = groupLabelSlipsByDay(pendingLabelSlips);
  const labelNumberByKey = new Map();
  let labelCounter = 0;
  printDayGroups.forEach((group) => {
    group.slips.forEach((slip) => {
      labelCounter += 1;
      labelNumberByKey.set(slip.key, labelCounter);
    });
  });

  // 인쇄 시에만 실제로 렌더할 라벨 목록 (printQueue가 채워져 있는 순간에만 존재)
  const printSlips = printQueue
    ? printQueue.map((k) => labelSlipsByKey.get(k)).filter(Boolean)
    : [];

  // 전체 내역 탭: 기간(시작일~종료일) 필터링, printed 여부와 무관하게 전부 표시.
  // 최신 주문이 맨 위로 오도록 정렬한 뒤, 날짜별로 묶어서 구분줄과 함께 보여줍니다.
  const filteredOrders = (orders || [])
    .filter((o) => {
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
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const filteredCups = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  );
  const filteredTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const filteredDayGroups = groupOrdersByDay(filteredOrders);
  const HISTORY_COLS = 8;

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
          <button
            type="button"
            className={`sidebar-tab ${tab === "menu" ? "active" : ""}`}
            onClick={() => setTab("menu")}
          >
            메뉴 관리
          </button>
          <button
            type="button"
            className={`sidebar-tab ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            사용자 관리
          </button>
          <button
            type="button"
            className={`sidebar-tab ${tab === "ledger" ? "active" : ""}`}
            onClick={() => setTab("ledger")}
          >
            회계
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
                <h1>
                  라벨 출력 <span className="name-en">Print Labels</span>
                </h1>
                <div className="admin-actions">
                  <button className="btn-secondary" onClick={() => fetchOrders(passcode)} disabled={loading}>
                    {loading ? "불러오는 중..." : "새로고침"}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handlePrintAll}
                    disabled={pendingLabelSlips.length === 0}
                  >
                    전체 출력 Print All
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

              {pendingLabelSlips.length === 0 ? (
                <div className="banner info">
                  라벨 출력 대기 중인 항목이 없습니다. (전체 내역 탭에서 다시 올릴 수 있어요)
                </div>
              ) : (
                <>
                  <div className="banner info">
                    "전체 출력"을 누르면 대기 중인 라벨을 모두 인쇄해요. 체크박스로 선택하면 선택한
                    라벨만 출력하거나 목록에서 삭제할 수 있어요.
                  </div>

                  <div className="history-actions">
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ flex: "none" }}
                      onClick={handleDeleteSelectedLabels}
                      disabled={selectedLabelKeys.size === 0}
                    >
                      선택 {selectedLabelKeys.size}장 삭제 Delete
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ flex: "none" }}
                      onClick={handlePrintSelected}
                      disabled={selectedLabelKeys.size === 0}
                    >
                      선택 {selectedLabelKeys.size}장 출력 Print Selected
                    </button>
                  </div>

                  <table className="order-table" style={{ marginTop: 14 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}></th>
                        <th style={{ width: 40 }}>#</th>
                        <th>
                          이름 <span className="name-en">Name</span>
                        </th>
                        <th>
                          메뉴 <span className="name-en">Menu</span>
                        </th>
                        <th>
                          주문일시 <span className="name-en">Time</span>
                        </th>
                      </tr>
                    </thead>
                    {printDayGroups.map((group) => {
                      const groupKeys = group.slips.map((s) => s.key);
                      const selectedCount = groupKeys.filter((k) => selectedLabelKeys.has(k)).length;
                      const allSelected = selectedCount === groupKeys.length;
                      const someSelected = selectedCount > 0 && !allSelected;
                      return (
                        <tbody key={group.key}>
                          <tr className="date-divider">
                            <td colSpan={5}>
                              <div className="date-divider-inner">
                                <label className="date-divider-select">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                      if (el) el.indeterminate = someSelected;
                                    }}
                                    onChange={() => toggleDayLabelSelection(group.slips)}
                                    aria-label={`${group.heading} 전체 선택`}
                                  />
                                  <span className="date-divider-label">{group.heading}</span>
                                </label>
                                <span className="date-divider-meta">{group.slips.length}장</span>
                              </div>
                            </td>
                          </tr>
                          {group.slips.map((slip) => (
                            <tr key={slip.key}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedLabelKeys.has(slip.key)}
                                  onChange={() => toggleLabelSelect(slip.key)}
                                  aria-label={`${displayNameOf(slip.order)} 라벨 선택`}
                                />
                              </td>
                              <td>{labelNumberByKey.get(slip.key)}</td>
                              <td>
                                {displayNameOf(slip.order)}
                                {slip.cupsInOrder > 1 ? ` (${slip.cupIndex}/${slip.cupsInOrder})` : ""}
                              </td>
                              <td>{slip.item.temp ? `${slip.item.name}(${slip.item.temp})` : slip.item.name}</td>
                              <td>{formatTime(slip.order.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      );
                    })}
                  </table>
                </>
              )}
            </>
          ) : tab === "history" ? (
            <>
              <div className="admin-header">
                <h1>
                  전체 내역 <span className="name-en">All History</span>
                </h1>
                <div className="date-range">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="시작일 Start date"
                  />
                  <span className="date-range-sep">~</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="종료일 End date"
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
                      기간 초기화 Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="history-actions">
                <button
                  type="button"
                  className="btn-danger"
                  style={{ flex: "none" }}
                  onClick={() => handleDeleteOrders(Array.from(selectedHistoryIds))}
                  disabled={selectedHistoryIds.size === 0}
                >
                  선택 {selectedHistoryIds.size}건 삭제 Delete
                </button>
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
                      <th>
                        이름 <span className="name-en">Name</span>
                      </th>
                      <th>
                        메뉴 <span className="name-en">Menu</span>
                      </th>
                      <th>
                        요청사항 <span className="name-en">Memo</span>
                      </th>
                      <th>
                        금액 <span className="name-en">Amount</span>
                      </th>
                      <th>
                        일시 <span className="name-en">Date</span>
                      </th>
                      <th>
                        상태 <span className="name-en">Status</span>
                      </th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  {filteredDayGroups.map((group) => (
                    <tbody key={group.key}>
                      <tr className="date-divider">
                        <td colSpan={HISTORY_COLS}>
                          <div className="date-divider-inner">
                            <span className="date-divider-label">{group.heading}</span>
                            <span className="date-divider-meta">
                              {group.orders.length}건 · {formatUSD(
                                group.orders.reduce((sum, o) => sum + o.total, 0)
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {group.orders.map((o) => {
                        const shownName = displayNameOf(o);
                        const showAccountTag =
                          Boolean((o.displayName || "").trim()) && shownName !== o.customerName;
                        return (
                          <tr key={o.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedHistoryIds.has(o.id)}
                                onChange={() => toggleHistorySelect(o.id)}
                                aria-label={`${shownName} 선택`}
                              />
                            </td>
                            <td>
                              {shownName}
                              {showAccountTag && (
                                <span className="name-account-tag">계정 Acct: {o.customerName}</span>
                              )}
                            </td>
                            <td>{summarizeItems(o.items)}</td>
                            <td>
                              {o.note ? <span className="note-chip">{o.note}</span> : "-"}
                            </td>
                            <td>{formatUSD(o.total)}</td>
                            <td>{formatTime(o.createdAt)}</td>
                            <td>
                              {printedOrderIds.has(o.id) ? (
                                <span className="status-pill done">출력완료 Printed</span>
                              ) : partialOrderIds.has(o.id) ? (
                                <span className="status-pill partial">일부출력 Partial</span>
                              ) : (
                                <span className="status-pill pending">대기중 Pending</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-danger btn-danger-sm"
                                onClick={() => handleDeleteOrders([o.id])}
                                disabled={deletingIds.has(o.id)}
                                aria-label={`${shownName} 주문 삭제`}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  ))}
                </table>
              )}

              <div className="history-total">
                <span>
                  총 {filteredOrders.length}건 · {filteredCups}잔
                </span>
                <span className="history-total-amount">{formatUSD(filteredTotal)}</span>
              </div>
            </>
          ) : tab === "menu" ? (
            <MenuManager passcode={passcode} />
          ) : tab === "users" ? (
            <UsersManager passcode={passcode} />
          ) : (
            <LedgerManager passcode={passcode} />
          )}
        </div>
      </div>

      {/* 인쇄 시에만 보이는 라벨 뷰: 음료 1잔 = 라벨 1장(2.4 x 1.3인치).
          printQueue에 담긴 라벨만(전체 출력/선택 출력) 실제로 렌더합니다. */}
      <div className="receipt">
        {printSlips.map((slip) => (
          <div className="label" key={slip.key}>
            <div className="label-top">
              <span className="label-name">{displayNameOf(slip.order)}</span>
              <span className="label-num">
                {slip.cupsInOrder > 1 ? `${slip.cupIndex}/${slip.cupsInOrder}` : ""}
              </span>
            </div>
            <div className="label-items">
              <div>{slip.item.temp ? `${slip.item.name}(${slip.item.temp})` : slip.item.name}</div>
            </div>
            {slip.order.note && <div className="label-note">메모 Memo: {slip.order.note}</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
