"use client";

import { useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/menu";

// 가격은 사용자 주문 화면/인쇄 라벨에는 표시하지 않고 관리자 "전체 내역" 탭에서만 보여줍니다.

// 카테고리별 대표 이모지가 없을 때 쓰는 기본값
const DEFAULT_EMOJI = "☕️";

function cartKey(item, categoryHasTemp, temp) {
  return categoryHasTemp ? `${item.id}::${temp}` : item.id;
}

export default function OrderPage() {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [cart, setCart] = useState({}); // { [cartKey]: {key, itemId, nameKo, nameEn, price, qty, temp, isExtra} }
  const [tempChoice, setTempChoice] = useState({}); // { [itemId]: "HOT" | "ICE" }
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0],
    [activeTab]
  );

  const cartEntries = useMemo(
    () => Object.values(cart).filter((entry) => entry.qty > 0),
    [cart]
  );

  const totalCups = useMemo(
    () => cartEntries.reduce((sum, e) => sum + e.qty, 0),
    [cartEntries]
  );

  function showToast(text) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  function handleUnavailableClick() {
    showToast("해당 메뉴는 출시 예정입니다");
  }

  function getTemp(itemId) {
    return tempChoice[itemId] || "HOT";
  }

  function setTemp(itemId, value) {
    setTempChoice((prev) => ({ ...prev, [itemId]: value }));
  }

  function getQty(category, item) {
    const key = cartKey(item, category.hasTemp, getTemp(item.id));
    return cart[key]?.qty || 0;
  }

  function updateQty(category, item, delta) {
    const temp = category.hasTemp ? getTemp(item.id) : null;
    const key = cartKey(item, category.hasTemp, temp);
    setCart((prev) => {
      const next = { ...prev };
      const current = next[key]?.qty || 0;
      const updated = Math.max(0, Math.min(20, current + delta));
      if (updated === 0) {
        delete next[key];
      } else {
        next[key] = {
          key,
          categoryId: category.id,
          itemId: item.id,
          nameKo: item.nameKo,
          nameEn: item.nameEn,
          price: item.price,
          qty: updated,
          temp,
          isExtra: false,
        };
      }
      return next;
    });
  }

  function toggleExtra(category, item) {
    const key = item.id;
    setCart((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          key,
          categoryId: category.id,
          itemId: item.id,
          nameKo: item.nameKo,
          nameEn: item.nameEn,
          price: item.price,
          qty: 1,
          temp: null,
          isExtra: true,
        };
      }
      return next;
    });
  }

  function isExtraSelected(item) {
    return Boolean(cart[item.id]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!customerName.trim()) {
      setMessage({ type: "error", text: "이름을 입력해주세요." });
      return;
    }
    if (cartEntries.length === 0) {
      setMessage({ type: "error", text: "메뉴를 한 개 이상 선택해주세요." });
      return;
    }

    const items = cartEntries.map((e) => ({
      id: e.itemId,
      name: e.nameKo,
      price: e.price,
      qty: e.qty,
      temp: e.temp || null,
    }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          note,
          items,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "주문에 실패했습니다." });
        return;
      }

      setMessage({
        type: "success",
        text: `${customerName}님, 주문이 접수되었어요! (총 ${totalCups}개)`,
      });
      setCart({});
      setNote("");
    } catch (err) {
      setMessage({ type: "error", text: "네트워크 오류로 주문에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <div className="hero">
        <div className="hero-badge">☕️</div>
        <h1>SIBC CAFE</h1>
        <p>
          메뉴를 선택하고 이름을 입력하면 주문이 접수돼요.
          <br />
          주문 내역은 모아서 한 번에 준비됩니다.
        </p>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <form onSubmit={handleSubmit}>
        <div className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="tab-bar">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`tab-btn ${activeTab === c.id ? "active" : ""}`}
                onClick={() => setActiveTab(c.id)}
              >
                <span className="tab-emoji">{c.emoji || DEFAULT_EMOJI}</span>
                <span className="tab-name-ko">{c.nameKo}</span>
                <span className="tab-name-en">{c.nameEn}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            {activeCategory.emoji || DEFAULT_EMOJI} {activeCategory.nameKo}{" "}
            <span className="name-en">{activeCategory.nameEn}</span>
          </div>

          {activeCategory.isExtra ? (
            <div className="extra-chip-list">
              {activeCategory.items.map((item) => {
                const selected = isExtraSelected(item);
                const disabled = item.available === false;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`extra-chip ${selected ? "selected" : ""} ${
                      disabled ? "disabled" : ""
                    }`}
                    onClick={() =>
                      disabled ? handleUnavailableClick() : toggleExtra(activeCategory, item)
                    }
                  >
                    <span className="chip-name-ko">{item.nameKo}</span>
                    <span className="chip-name-en">{item.nameEn}</span>
                    {disabled && <span className="chip-soon">출시예정</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="menu-list">
              {activeCategory.items.map((item) => {
                const disabled = item.available === false;
                const qty = disabled ? 0 : getQty(activeCategory, item);
                const temp = getTemp(item.id);
                return (
                  <div
                    className={`menu-card ${disabled ? "disabled" : ""}`}
                    key={item.id}
                  >
                    {disabled && (
                      <button
                        type="button"
                        className="disabled-overlay"
                        onClick={handleUnavailableClick}
                        aria-label={`${item.nameKo}는 출시 예정 메뉴입니다`}
                      />
                    )}
                    <div className="menu-emoji">{activeCategory.emoji || DEFAULT_EMOJI}</div>
                    <div className="menu-info">
                      <p className="name">
                        {item.nameKo} <span className="name-en">{item.nameEn}</span>
                        {disabled && <span className="badge-soon">출시예정</span>}
                      </p>
                      {activeCategory.hasTemp && (
                        <div className="temp-toggle">
                          <button
                            type="button"
                            className={`temp-btn ${temp === "HOT" ? "active" : ""}`}
                            onClick={() => setTemp(item.id, "HOT")}
                            disabled={disabled}
                          >
                            HOT
                          </button>
                          <button
                            type="button"
                            className={`temp-btn ${temp === "ICE" ? "active" : ""}`}
                            onClick={() => setTemp(item.id, "ICE")}
                            disabled={disabled}
                          >
                            ICE
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="qty-control">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQty(activeCategory, item, -1)}
                        disabled={disabled || qty === 0}
                        aria-label={`${item.nameKo} 수량 줄이기`}
                      >
                        −
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQty(activeCategory, item, 1)}
                        disabled={disabled}
                        aria-label={`${item.nameKo} 수량 늘리기`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartEntries.length > 0 && (
          <div className="section">
            <div className="section-title">담은 메뉴</div>
            <div className="form-card">
              {cartEntries.map((e) => (
                <div className="tally-row" key={e.key}>
                  <span>
                    {e.nameKo}
                    {e.temp ? ` (${e.temp})` : ""} x{e.qty}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-title">주문자 정보</div>
          <div className="form-card">
            <div className="field">
              <label htmlFor="customerName">이름 *</label>
              <input
                id="customerName"
                type="text"
                placeholder="이름을 입력해주세요"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="field">
              <label htmlFor="note">요청사항 (선택, 자유입력)</label>
              <textarea
                id="note"
                rows={2}
                placeholder="예: 얼음 적게, 달지 않게 등"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`banner ${message.type}`}>{message.text}</div>
        )}

        <div className="order-bar">
          <div className="order-bar-inner">
            <div className="total-info">
              <div className="amount">총 {totalCups}개</div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || cartEntries.length === 0}
            >
              {submitting ? "주문 접수 중..." : "주문하기"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
