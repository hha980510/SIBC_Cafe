// 메뉴 아이콘(벡터 일러스트) 데이터입니다.
// 실제 사진 대신, 항목마다 어울리는 색상 + 토핑 모티프를 조합한 아이콘을 사용합니다.
// vessel(그릇 모양)은 카테고리 + HOT/ICE 상태로 자동 결정되고,
// 여기서는 액체 색(liquid)과 위에 올라가는 모티프(motif/motifColor)만 지정합니다.

// 카테고리별 그릇 모양: hot일 때 모양 / cold(ICE)일 때는 항상 유리컵(glass)
// hasTemp가 없는 카테고리는 fixed 값을 그대로 씁니다.
export const CATEGORY_VESSEL = {
  coffee: { hot: "mug", cold: "glass" },
  latte: { hot: "mug", cold: "glass" },
  tea: { hot: "teacup", cold: "glass" },
  ade: { fixed: "glass" },
  smoothie: { fixed: "glass" },
  "ice-cream": { fixed: "bowl" },
};

export function resolveVessel(categoryId, hasTemp, temp) {
  const conf = CATEGORY_VESSEL[categoryId];
  if (!conf) return "mug";
  if (conf.fixed) return conf.fixed;
  return temp === "ICE" ? conf.cold : conf.hot;
}

// itemId -> { liquid: 액체/스쿱 색, motif: 토핑 종류, motifColor: 토핑 색 }
export const ICONS = {
  // 커피
  americano: { liquid: "#4a2c1d", motif: "bean", motifColor: "#2e1a10" },
  "cafe-latte": { liquid: "#c8a27a", motif: "cream", motifColor: "#fff8ee" },
  "vanilla-latte": { liquid: "#e8d3ae", motif: "cream", motifColor: "#fffaf0" },
  "mocha-latte": { liquid: "#6b4226", motif: "choco", motifColor: "#3b2415" },
  "caramel-macchiato": { liquid: "#c68642", motif: "caramel", motifColor: "#8a5a20" },
  "cinnamon-dolce": { liquid: "#caa06a", motif: "stick", motifColor: "#8b4513" },
  "hazelnut-latte": { liquid: "#b98655", motif: "nut", motifColor: "#6b3f1d" },
  "condensed-milk-latte": { liquid: "#e0b56c", motif: "drip", motifColor: "#fff2cc" },
  "ajae-coffee": { liquid: "#3b2412", motif: "bean", motifColor: "#1f120a" },

  // 라떼
  "matcha-latte": { liquid: "#7ba05b", motif: "leaf", motifColor: "#4f7942" },
  "choco-latte": { liquid: "#5c3a21", motif: "choco", motifColor: "#2e1c10" },
  "nutty-cream-latte": { liquid: "#d8b88a", motif: "nut", motifColor: "#7a4e23" },
  "milk-tea": { liquid: "#e3c9a3", motif: "leaf", motifColor: "#6b8a4f" },
  "sweet-potato-latte": { liquid: "#8e6b8f", motif: "fruit", motifColor: "#5b3d5c" },
  "walnut-almond-grain-latte": { liquid: "#c9a97a", motif: "nut", motifColor: "#6b4423" },
  "earl-grey-milk-tea": { liquid: "#b7a08a", motif: "flower", motifColor: "#8a6bab" },
  "mugwort-latte": { liquid: "#8a9a5b", motif: "leaf", motifColor: "#5c6b3a" },

  // 티
  "ginger-citron-tea": { liquid: "#e0a030", motif: "citrus", motifColor: "#f2c14e" },
  "bellflower-ginger-tea": { liquid: "#d9a05b", motif: "flower", motifColor: "#8266b0" },
  "strawberry-milk-tea": { liquid: "#f0a8b8", motif: "berries", motifColor: "#d1425b" },
  "caramel-milk-tea": { liquid: "#d3a066", motif: "caramel", motifColor: "#8a5a20" },
  "sweet-chamomile-tea": { liquid: "#e8cf8a", motif: "flower", motifColor: "#e8b93c" },
  "peach-tea": { liquid: "#f2ab7d", motif: "fruit", motifColor: "#e8795a" },
  "grapefruit-honey-black-tea": { liquid: "#b5502e", motif: "citrus", motifColor: "#e8735a" },
  "apple-chamomile-tea": { liquid: "#e4c26b", motif: "fruit", motifColor: "#c23b3b" },
  kombucha: { liquid: "#c9963f", motif: "bubble", motifColor: "#fff4d6" },

  // 에이드
  "green-grape-ade": { liquid: "#8bc34a", motif: "grape", motifColor: "#4a7c1f" },
  "passion-fruit-ade": { liquid: "#f4a520", motif: "citrus", motifColor: "#7a4a12" },
  "peach-ade": { liquid: "#f5a97f", motif: "fruit", motifColor: "#e8795a" },
  "grapefruit-ade": { liquid: "#e8607a", motif: "citrus", motifColor: "#f2c14e" },
  "apple-mango-ade": { liquid: "#f5b942", motif: "fruit", motifColor: "#e8641a" },
  "hallabong-ade": { liquid: "#f5921e", motif: "citrus", motifColor: "#ffce54" },

  // 스무디
  "blueberry-smoothie": { liquid: "#5b4b8a", motif: "grape", motifColor: "#33265c" },
  "strawberry-smoothie": { liquid: "#e8536b", motif: "berries", motifColor: "#b52c42" },
  "mango-smoothie": { liquid: "#f5a623", motif: "fruit", motifColor: "#d9820a" },
  "peach-strawberry-smoothie": { liquid: "#f0899a", motif: "fruit", motifColor: "#e8607a" },
  "mint-choco-java-chip-smoothie": { liquid: "#7fd1ae", motif: "chip", motifColor: "#2e2e2e" },

  // 아이스크림
  "vanilla-ice-cream": { liquid: "#f5e9d0", motif: "cream", motifColor: "#ffffff" },
  "choco-ice-cream": { liquid: "#6b4226", motif: "choco", motifColor: "#3b2415" },
  "strawberry-ice-cream": { liquid: "#f0a0b0", motif: "berries", motifColor: "#c23b55" },
  "haagen-dazs-choco-vanilla": { liquid: "#c9a876", motif: "choco", motifColor: "#3b2415" },
};

// 추가요청 칩 옆에 붙는 작은 글리프 아이콘
export const EXTRA_ICONS = {
  "less-ice": { type: "ice", color: "#8ec6e8", accent: "minus" },
  "more-ice": { type: "ice", color: "#8ec6e8", accent: "plus" },
  "no-ice": { type: "ice", color: "#8ec6e8", accent: "slash" },
  "extra-shot": { type: "shot", color: "#4a2c1d", accent: "plus" },
  "lychee-jelly": { type: "jelly", color: "#e8d9ec", accent: null },
  "extra-syrup": { type: "syrup", color: "#c68642", accent: null },
  "oat-milk": { type: "carton", color: "#e8d9b8", accent: null },
  "less-sweet": { type: "sugar", color: "#e8dcc8", accent: "slash" },
};
