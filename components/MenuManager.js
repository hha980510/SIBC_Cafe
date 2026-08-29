"use client";

import { useEffect, useState } from "react";

// price는 센트(USD) 단위 정수로 저장됩니다. 입력창에는 보기 편하게 달러($) 단위로 보여줍니다.
function centsToDollarsInput(cents) {
  return ((cents || 0) / 100).toFixed(2);
}

function dollarsInputToCents(value) {
  const n = Math.round(parseFloat(value || "0") * 100);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function slugify(text, fallbackPrefix) {
  const base = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
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

const emptyDraft = { nameKo: "", nameEn: "", price: "" };

export default function MenuManager({ passcode }) {
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState({}); // { [categoryId]: {nameKo, nameEn, price} }

  useEffect(() => {
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMenu() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/menu", { cache: "no-store" });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError("메뉴를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAll() {
    if (!categories) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode ?? "",
        },
        body: JSON.stringify({ categories }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "저장에 실패했습니다.");
        return;
      }
      setCategories(data.categories);
      setNotice("메뉴를 저장했어요. 손님 주문 화면에도 바로 반영됩니다.");
    } catch (err) {
      setError("네트워크 오류로 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function updateItemField(categoryId, itemId, field, value) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              items: cat.items.map((item) =>
                item.id !== itemId ? item : { ...item, [field]: value }
              ),
            }
      )
    );
  }

  function toggleAvailable(categoryId, itemId) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              items: cat.items.map((item) =>
                item.id !== itemId ? item : { ...item, available: item.available === false }
              ),
            }
      )
    );
  }

  function removeItem(categoryId, itemId) {
    if (!confirm("이 메뉴 항목을 삭제할까요? '전체 저장'을 눌러야 실제로 반영돼요.")) return;
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
      )
    );
  }

  function updateDraft(categoryId, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] || emptyDraft), [field]: value },
    }));
  }

  function addItem(categoryId) {
    const draft = drafts[categoryId] || emptyDraft;
    const nameKo = draft.nameKo.trim();
    if (!nameKo) {
      setError("추가할 메뉴의 한글 이름을 입력해주세요.");
      return;
    }
    const nameEn = draft.nameEn.trim();
    const price = dollarsInputToCents(draft.price);

    setCategories((prev) => {
      const cat = prev.find((c) => c.id === categoryId);
      const existingIds = new Set((cat?.items || []).map((i) => i.id));
      const id = uniqueId(slugify(nameEn || nameKo, categoryId), existingIds);
      return prev.map((c) =>
        c.id !== categoryId
          ? c
          : { ...c, items: [...c.items, { id, nameKo, nameEn, price, available: true }] }
      );
    });
    setDrafts((prev) => ({ ...prev, [categoryId]: emptyDraft }));
    setError("");
    setNotice("");
  }

  if (loading && !categories) {
    return <div className="banner info">메뉴를 불러오는 중...</div>;
  }

  if (!categories) {
    return <div className="banner error">{error || "메뉴를 불러오지 못했습니다."}</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>메뉴 관리</h1>
        <div className="admin-actions">
          <button className="btn-secondary" onClick={loadMenu} disabled={loading || saving}>
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: "none" }}
            onClick={handleSaveAll}
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
        가격/이름/활성화 여부를 바꾸고 새 메뉴를 추가한 뒤, 반드시 위의 "전체 저장" 버튼을 눌러야 저장돼요.
      </div>

      {categories.map((cat) => (
        <div className="menu-manage-card" key={cat.id}>
          <h2>
            {cat.emoji} {cat.nameKo} <span className="name-en">{cat.nameEn}</span>
          </h2>

          <table className="order-table">
            <thead>
              <tr>
                <th>한글명</th>
                <th>영문명</th>
                <th style={{ width: 110 }}>가격 ($)</th>
                <th style={{ width: 80 }}>판매상태</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {cat.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      lang="ko"
                      value={item.nameKo}
                      onChange={(e) => updateItemField(cat.id, item.id, "nameKo", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      lang="en"
                      value={item.nameEn}
                      onChange={(e) => updateItemField(cat.id, item.id, "nameEn", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={centsToDollarsInput(item.price)}
                      onChange={(e) =>
                        updateItemField(cat.id, item.id, "price", dollarsInputToCents(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    <label className="menu-toggle">
                      <input
                        type="checkbox"
                        checked={item.available !== false}
                        onChange={() => toggleAvailable(cat.id, item.id)}
                      />
                      {item.available !== false ? "판매중" : "품절"}
                    </label>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger btn-danger-sm"
                      onClick={() => removeItem(cat.id, item.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="menu-add-row">
            <input
              type="text"
              lang="ko"
              placeholder="한글 이름 (필수)"
              value={drafts[cat.id]?.nameKo || ""}
              onChange={(e) => updateDraft(cat.id, "nameKo", e.target.value)}
            />
            <input
              type="text"
              lang="en"
              placeholder="영문 이름"
              value={drafts[cat.id]?.nameEn || ""}
              onChange={(e) => updateDraft(cat.id, "nameEn", e.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="가격($)"
              value={drafts[cat.id]?.price || ""}
              onChange={(e) => updateDraft(cat.id, "price", e.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={() => addItem(cat.id)}>
              + 메뉴 추가
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
