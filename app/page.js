"use client";

import { useMemo, useState } from "react";
import { MENU } from "@/lib/menu";

const EMOJI = {
  americano: "☕️",
  latte: "🥛",
  "vanilla-latte": "🍦",
  "caramel-macchiato": "🍮",
  cappuccino: "☕️",
  "cold-brew": "🧊",
};

function formatWon(n) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function OrderPage() {
  const [cart, setCart] = useState({}); // { [menuId]: qty }
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  const selectedItems = useMemo(() => {
    return MENU.filter((m) => cart[m.id] > 0).map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      qty: cart[m.id],
    }));
  }, [cart]);

  const total = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [selectedItems]
  );

  function updateQty(id, delta) {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[id] || 0;
      const updated = Math.max(0, Math.min(20, current + delta));
      if (updated === 0) {
        delete next[id];
      } else {
        next[id] = updated;
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!customerName.trim()) {
      setMessage({ type: "error", text: "이름을 입력해주세요." });
      return;
    }
    if (selectedItems.length === 0) {
      setMessage({ type: "error", text: "메뉴를 한 개 이상 선택해주세요." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          note,
          items: selectedItems,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "주문에 실패했습니다." });
        return;
      }

      setMessage({
        type: "success",
        text: `${customerName}님, 주문이 접수되었어요! (총 ${formatWon(total)})`,
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

      <form onSubmit={handleSubmit}>
        <div className="section">
          <div className="section-title">메뉴 선택</div>
          <div className="menu-list">
            {MENU.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div className="menu-card" key={item.id}>
                  <div className="menu-emoji">{EMOJI[item.id] || "☕️"}</div>
                  <div className="menu-info">
                    <p className="name">{item.name}</p>
                    <p className="desc">{item.desc}</p>
                    <p className="price">{formatWon(item.price)}</p>
                  </div>
                  <div className="qty-control">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQty(item.id, -1)}
                      disabled={qty === 0}
                      aria-label={`${item.name} 수량 줄이기`}
                    >
                      −
                    </button>
                    <span className="qty-value">{qty}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQty(item.id, 1)}
                      aria-label={`${item.name} 수량 늘리기`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
              <label htmlFor="note">요청사항 (선택)</label>
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
              <div className="label">
                총 {selectedItems.reduce((s, i) => s + i.qty, 0)}잔
              </div>
              <div className="amount">{formatWon(total)}</div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || selectedItems.length === 0}
            >
              {submitting ? "주문 접수 중..." : "주문하기"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
