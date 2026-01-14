    function toggleStarterInput() {
  const box = document.getElementById("starterBox");
  const checked = document.getElementById("search").checked;
  box.style.display = checked ? "block" : "none";
}

    const input = document.getElementById("combo");
    input.addEventListener("keydown", (e) => {
  if (e.isComposing) return;

  // Enter → 計算
  if (e.key === "Enter") {
    e.preventDefault();
    calc();
    return;
  }

  // Space → >
  if (e.key === " ") {
    e.preventDefault();

    const pos = input.selectionStart;
    const value = input.value;

    input.value =
      value.slice(0, pos) + ">" + value.slice(pos);

    input.selectionStart =
    input.selectionEnd = pos + 1;
  }
});

function bpChanged(cb) {
  const boxes = Array.from(
    document.querySelectorAll("#bpGroup input[type=checkbox]")
  );

  const idx = Number(cb.dataset.i);

  if (cb.checked) {
    // ON → 左を全部ON
    for (let i = 0; i <= idx; i++) {
      boxes[i].checked = true;
    }
  } else {
    // OFF → 右を全部OFF
    for (let i = idx; i < boxes.length; i++) {
      boxes[i].checked = false;
    }
  }
}

function buildCharacterDatalist() {
  const datalist = document.getElementById("characterList");
  datalist.innerHTML = "";

  for (const id in characterCache) {
    const option = document.createElement("option");
    option.value = characterCache[id].name;
    option.dataset.id = id; // ← 後で逆引き用
    datalist.appendChild(option);
  }
}

let lockedStarters = null; // ← 始動固定用

function buildStarterUI(starters) {
  const ui = document.getElementById("starterUI");
  ui.innerHTML = "";

  starters.forEach((s, i) => {
    const label = document.createElement("label");
    label.style.display = "block";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.dataset.starter = s;

    label.appendChild(cb);
    label.append(" " + s);

    ui.appendChild(label);
  });
}

function getEnabledStarters() {
  return Array.from(
    document.querySelectorAll("#starterUI input[type=checkbox]")
  )
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.starter);
}

function updateDeleteColumn() {
  const show = document.getElementById("deleteMode").checked;
  const table = document.getElementById("starterMatrixTable");
  if (!table) return;

  [...table.rows].forEach(row => {
    const cell = row.cells[0];
    if (cell) {
      cell.style.display = show ? "table-cell" : "none";
    }
  });
}

function getInitialBP() {
  return [...document.querySelectorAll(".BP")]
    .filter(cb => cb.checked).length;
}


    // ======================
    // 技データ
    // ======================
const characterCache = {};

async function preloadCharacter(id) {
  if (characterCache[id]) return;

  const res = await fetch(`./csv/${id}.csv`);
  if (!res.ok) throw new Error(id);

  const text = await res.text();
  characterCache[id] = parseMovesFromCSV(text);
}


   

    const commonMoves = {
  RS: {
    min: { "": 0.2 },
    dmg: { "": 1500 },
    scale: { "": 1 },
    BP: {"": 0 },
    cmd: false,
    desc: {"":"レイジングストライク"}
  },
  RC: {
    min: { "": 0.2 },
    dmg: { "": 1000 },
    scale: { "": 1 },
    BP: {"": 0 },
    cmd: false,
    desc: {"":"レイジングチェイン"}
  },
  DA: {
    min: { "": 0.2 },
    dmg: { "": 700 },
    scale: { "": 1 },
    BP: {"": 0 },
    cmd: false,
    desc: {"":"ダブルアタック"}
  },
  TA: {
    min: { "": 0.2 },
    dmg: { "": 1000 },
    scale: { "": 1 },
    BP: {"": 0 },
    cmd: false,
    desc: {"":"トリプルアタック"}
  }
};

    let moves = null;
    // ======================
    // 補正計算
    // ======================
    function calcScale(n, minRate) {
      if (n <= 2) return 1.0;
      return Math.max((10 - n) / 10, minRate);
    }

    // ======================
    // 入力解析
    // ======================
    function parseMove(move,movetable = moves) {
  move = move.trim().toUpperCase();

  // ===== 段指定取得 =====
  let hitRange = null;
  const rangeMatch = move.match(/\[(.+?)\]/);
  if (rangeMatch) {
    hitRange = rangeMatch[1]; // "2", "2-3", "-2"
    move = move.replace(/\[.+?\]/, "");
  }

  move = move
    .replace(/！/g, "!")
    .replace(/＊/g, "*")
    .replace(/＾/g, "^");

  const onCooldown = move.includes("!");
  const technical = move.includes("*") || move.includes("^");
  const techBonus = move.includes("*");
  move = move.replace(/[!*^]/g, "");

  const lm = move.match(/^(.*?)([LMHU]+)$/);
  if (lm) {
    return {
      base: lm[1],
      strength: lm[2][0],
      repeat: lm[2].length,
      hitRange,        // ← 追加
      technical,
      techBonus,
      onCooldown
    };
  }

  if (movetable[move]) {
    return {
      base: move,
      strength: "",
      hitRange,
      technical,
      techBonus,
      onCooldown
    };
  }

  return null;
}
    function filterHits(damages, hitRange) {
  if (!hitRange) return damages;

  const n = damages.length;
  const result = [];

  const parts = hitRange.split(",");

  for (const part of parts) {
    // 単発 [4]
    if (/^\d+$/.test(part)) {
      const i = Number(part) - 1;
      if (damages[i] != null) result.push(damages[i]);
    }

    // 範囲 [2-4]
    else if (/^\d+-\d+$/.test(part)) {
      const [a, b] = part.split("-").map(Number);
      for (let i = a - 1; i < b && i < n; i++) {
        if (damages[i] != null) result.push(damages[i]);
      }
    }

    // 後ろから [-2]
    else if (/^-\d+$/.test(part)) {
      const k = Number(part.slice(1));
      for (let i = Math.max(0, n - k); i < n; i++) {
        result.push(damages[i]);
      }
    }
  }

  return result;
}


    // ======================
    // メイン処理
    // ======================
    function getStartersFromInput() {
  const text = document.getElementById("startersInput").value;
  return text
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

    
    function calc() {
  const inputCombo = document.getElementById("combo").value;
  const searchMode = document.getElementById("search").checked;
  const resultDiv = document.getElementById("result");
  const desc = document.getElementById("description");

  desc.style.display = searchMode ? "none" : "block";

  // 通常モード
  if (!searchMode) {
  const result = calcDamage(inputCombo);

  let html = `<table border="1" cellpadding="6">
  <tr>
      <th colspan="5">合計</th>
      <th>${result.total}</th>
    </tr>
    
    <tr>
      <th>#</th>
      <th>技</th>
      <th>補正段</th>
      <th>生ダメ</th>
      <th>補正率</th>
      <th>最終ダメ</th>
    </tr>`;

  result.details.forEach((d, i) => {

  html += `
    <tr>
      <td>${i + 1}</td>
      <td>
        <b>${d.move}</b>
      </td>
      <td>${d.hit}</td>
      <td>${d.raw}</td>
      <td>${Math.round(d.scale * 100)}%</td>
      <td>${d.final}</td>
    </tr>`;
});


  html += `
  </table>`;

  resultDiv.innerHTML = html;
  return;
}


// ===== 始動別まとめ =====

// ★ ここで始動を確定・ロックする
let starters = lockedStarters ?? getStartersFromInput();

if (!lockedStarters) {
  lockedStarters = starters;

  // 始動入力欄をロック
  document.getElementById("startersInput").disabled = true;

   // UI生成
  buildStarterUI(starters);
}

const makeMatrix =
  document.getElementById("starterTable")?.checked;


// --- 縦表（今まで通り） ---
if (!makeMatrix) {
  clearStarterSummary();
  const table = getOrCreateStarterTable();
  for (const starter of starters) {
    const combo = starter + ">" + inputCombo;
    const dmg = calcDamage(combo);

    const row = table.insertRow();
    row.insertCell().textContent = starter;
    row.insertCell().textContent = combo;
    row.insertCell().textContent = dmg.total;
  }
  return;
}

// --- 横マトリクス表 ---
const table = getOrCreateStarterMatrix(starters);

// すでに同じコンボ行があるか探す
const initialBP = getInitialBP();

let row = [...table.rows].find(r =>
  r.cells[1].textContent === String(initialBP) &&
  r.cells[2].textContent === inputCombo
);


// 無ければ新規行
if (!row) {
  row = table.insertRow();
  // 削除セル
const delCell = row.insertCell();
const btn = document.createElement("button");
btn.textContent = "×";
btn.onclick = () => row.remove();
delCell.appendChild(btn);
delCell.style.display =
  document.getElementById("deleteMode").checked
    ? "table-cell"
    : "none";

// ★ 初期BPセル
row.insertCell().textContent = initialBP;

// コンボセル
row.insertCell().textContent = inputCombo;

// 始動セル
for (let i = 0; i < starters.length; i++) {
  row.insertCell();
}

}

// ダメージを横に埋める
const enabled = getEnabledStarters();

starters.forEach((starter, i) => {
  if (!enabled.includes(starter)) {
    row.cells[i + 3].textContent = "—";
    return;
  }

  const full = starter + ">" + inputCombo;
  row.cells[i + 3].textContent = calcDamage(full).total;
});

}

function calcDamage(comboText) {
  const originalMoves = moves; // ★ 元を保存
  let currentMoves = moves;    // ★ 計算用

  const expanded = [];
  const checked = document.getElementById("forceTech").checked;

  const list = comboText
    .replace(/＞/g, ">")
    .split(">")
    .map(s => s.trim());

  for (const raw of list) {
    const tmp = parseMove(raw, currentMoves);
if (!tmp) continue;

// ★ raw（文字列）を入れる
expanded.push(raw);

if (tmp.repeat === 2) {
  expanded.push("DA");
}
if (tmp.repeat >= 3) {
  expanded.push("DA");
  expanded.push("TA");
}
}

  

  //BPボーナス
  const checkedCount = [...document.querySelectorAll(".BP")]
  .filter(cb => cb.checked).length;
  let BPn = checkedCount;
  let BPbonus = 1;

  let total = 0;
  let hit = 0;
  const details = []; 

  for (const raw of expanded) {
  const parsed = parseMove(raw, currentMoves);
  if (!parsed) continue;

  const data = currentMoves[parsed.base];
  if (!data) continue;

    const transformTo =
  data.transform?.[parsed.strength] ??
  data.transform?.[""];

  if (transformTo) {
  const char = characterCache[transformTo];
  if (!char) {
    console.error("未ロードの変身先:", transformTo);
  } else {
    currentMoves = char.moves;
  }
}



    const baseDmg =
      data.dmg?.[parsed.strength] ?? data.dmg?.[""];
    if (baseDmg == null) continue;

    const baseMin =
      data.min?.[parsed.strength] ?? data.min?.[""];
    if (baseMin == null) continue;

    const baseBP = 
    data.BP?.[parsed.strength] ?? data.BP?.[""];
    if (baseBP == null) continue;

    let damages = Array.isArray(baseDmg) ? baseDmg : [baseDmg];
    damages = filterHits(damages, parsed.hitRange);

    let mins = Array.isArray(baseMin) ? baseMin : [baseMin];
    mins = filterHits(mins, parsed.hitRange);

    let BPs = Array.isArray(baseBP) ? baseBP : [baseBP];
    BPs = filterHits(BPs, parsed.hitRange);

    if (BPs.length === 1 && damages.length > 1) {
  BPs = [BPs[0], ...Array(damages.length - 1).fill(0)];
}

    const baseScale = 
    data.scale?.[parsed.strength] ?? data.scale?.[""] ?? 1.0;
    
    hit++;

    // RC補正 
    if (parsed.base === "RC" && hit >= 2 && hit <= 5){ 
    hit = 5; }

    for (let i = 0; i < damages.length; i++) {
  const d = damages[i];
  const min = mins[i] ?? mins[0]; // 段指定時も安全
  const b = BPs[i] ?? BPs[0];
  const scale = calcScale(hit, min);

  BPn -= b

      const techRate =
        checked ? 1.0 : (parsed.techBonus ? 1.1 : 1.0);

      const uPenalty =
        parsed.strength === "U" &&
        data.cmd &&
        !parsed.technical
          ? 0.6 : 1.0;

      const cooltimePenalty =
        parsed.strength === "U" &&
        data.cmd &&
        parsed.onCooldown
          ? 0.5 : 1.0;
          
      if (BPn <= 1){
    BPbonus = 1.2;
    if (BPn <= 0){
      BPbonus = 1.5;
    }
  }

      const finalDmg = Math.floor(
        d * scale * techRate * uPenalty * cooltimePenalty * BPbonus + 1e-8
      );

      total += finalDmg;

      // ★ 内訳を保存
      details.push({
        move: parsed.base + parsed.strength,
        hit: hit,
        raw: d,
        scale,
        final: finalDmg,
        base: parsed.base,          // ← 追加
  strength: parsed.strength,
      });
    }
    if (baseScale <= 0.7 && hit === 1){
      hit = 9 - baseScale*10
    };
  }

  return {
  total,
  details
};

}

function getMoveNameList(movesObj) {
  const list = [];

  for (const base in movesObj) {
    const data = movesObj[base];
    const strengths = Object.keys(data.dmg || {});

    // 強度なし
    if (
      strengths.length === 0 ||
      (strengths.length === 1 && strengths[0] === "")
    ) {
      list.push([
        base,
        data.desc?.[""] ?? ""
      ]);
    }
    // 強度あり
    else {
      for (const s of strengths) {
        list.push([
          s === "" ? base : base + s,
          data.desc?.[s] ?? data.desc?.[""] ?? ""
        ]);
      }
    }
  }

  return list;
}



function parseMovesFromCSV(text) {
  const lines = text
  .trim()
  .replace(/\r/g, "")
  .split("\n");

  // ===== キャラ名取得 =====
  let characterName = "UNKNOWN";

  if (lines[0].startsWith("#CHARA")) {
    characterName = lines[0].split(",")[1]?.trim() ?? characterName;
    lines.shift(); // メタ行削除
  }

  lines.shift(); // ヘッダ削除

  const newMoves = {};

  for (const line of lines) {
    let [base, strengthStr, damageStr, minStr, scaleStr, BPStr, cmdStr, transStr, descStr] = line.split(",");

    base = base.trim().toUpperCase();
    strengthStr = strengthStr
      ? strengthStr.trim().toUpperCase()
      : "";

    if (!newMoves[base]) {
      newMoves[base] = {
        min: {},
        dmg: {},
        scale: {},
        BP: {},
    cmd: cmdStr?.trim().toLowerCase() === "c",
    transform: {},
          desc: {}
      };
    }

    const strengths = strengthStr
      ? strengthStr.split("|").map(s => s.trim().toUpperCase())
      : [""];

    const BPVariants = BPStr
      ? BPStr.split("|").map(s => s.trim().toUpperCase())
      : [""];
      
      const transVariants =transStr.split("|");

    const damageVariants = damageStr.split("|");
    const scaleVariants = scaleStr
      ? scaleStr.split("|").map(Number)
      : [];
    const minVariants = minStr
  ? minStr.split("|")
  : [];

    
const descVariants = descStr
  ? descStr.split("|").map(s => s.trim())
  : [];



    strengths.forEach((s, i) => {
      const dmgPart = damageVariants[i];
      const hits = dmgPart.includes("/")
        ? dmgPart.split("/").map(Number)
        : [Number(dmgPart)];
        const desc =
    descVariants[i] ??
    descVariants[0] ??
    "";

  newMoves[base].desc[s] = desc;

      newMoves[base].dmg[s] = hits;

      // ===== 最低保証（★追加） =====
      let minPart = minVariants[i] ?? minVariants[0] ?? "0";
      const mins = minPart.includes("/")
        ? minPart.split("/").map(Number)
        : [Number(minPart)];

      newMoves[base].min[s] = mins;

      let BPPart = BPVariants[i] ?? BPVariants[0] ?? "0";
      const BPs = BPPart.includes("/")
        ? BPPart.split("/").map(Number)
        : [Number(BPPart)];

      newMoves[base].BP[s] = BPs;

      let scale;
      if (scaleVariants.length === 1) {
        scale = scaleVariants[0];
      } else if (scaleVariants[i] != null) {
        scale = scaleVariants[i];
      } else {
        scale = 1.0;
      }

      newMoves[base].scale[s] = scale;
    });
  }


 return {
    name: characterName,
    moves: {
      ...commonMoves,
      ...newMoves
    }
  };
}

function loadMovesFromCSV(text){
  const char = parseMovesFromCSV(text);
  moves = char.moves; // ← ここ重要

  document.getElementById("csvPreview").textContent =
    getMoveNameList(moves)
      .map(([name, desc]) =>
        desc ? `${name} ： ${desc}` : name
      )
      .join("\n");

  alert("技表を読み込みました！");
}


//指導まとめ表作成用関数
function getOrCreateStarterTable() {
  let table = document.getElementById("starterSummaryTable");

  if (!table) {
    table = document.createElement("table");
    table.id = "starterSummaryTable";
    table.border = "1";
    table.cellPadding = "6";

    const header = table.insertRow();

    // 削除列（最初は非表示）
    const delTh = header.insertCell();
    delTh.textContent = "削除";
    delTh.style.display = "none";
    header.insertCell().textContent = "始動";
    header.insertCell().textContent = "コンボ";
    header.insertCell().textContent = "ダメージ";

    document.getElementById("result").innerHTML = "";
    document.getElementById("result").appendChild(table);
  }

  return table;
}


function clearStarterSummary() {
  const vTable = document.getElementById("starterSummaryTable");
  if (vTable) vTable.remove();

  const mTable = document.getElementById("starterMatrixTable");
  if (mTable) mTable.remove();

  // 表示エリアも空にする
  document.getElementById("result").innerHTML = "";
    // ★ 始動ロック解除
  lockedStarters = null;
  document.getElementById("starterUI").innerHTML = "";
  document.getElementById("startersInput").disabled = false;
}


function getOrCreateStarterMatrix(starters) {
  let table = document.getElementById("starterMatrixTable");

  if (!table) {
    table = document.createElement("table");
    table.id = "starterMatrixTable";
    table.border = "1";
    table.cellPadding = "6";

    // ===== ヘッダ行 =====
    const header = table.insertRow();

// 削除列
const delTh = header.insertCell();
delTh.textContent = "削除";
delTh.style.display = "none";

header.insertCell().textContent = "初期BP";

header.insertCell().textContent = "コンボ";


    for (const s of starters) {
      header.insertCell().textContent = s;
    }

    document.getElementById("result").innerHTML = "";
    document.getElementById("result").appendChild(table);
  }

  return table;
}



    document.getElementById("csvInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    loadMovesFromCSV(reader.result);
  };
  reader.readAsText(file);
});

const characterMap = {
  "ヴィーラ": "vira",
  "変身後ヴィーラ": "cvira",
  "ゾーイ": "zooey",
  "グリームニル": "grimnir",
  "グラン": "gran"
  
};

document
  .getElementById("loadCharBtn")
  .addEventListener("click", async () => {

    const input = document.getElementById("characterInput");
    const name = input.value;
    const id = characterMap[name];

    if (!id) {
      alert("キャラ名が正しくありません");
      return;
    }

    try {
      // ★ 選択キャラを事前ロード
      await preloadCharacter(id);

      // ★ このキャラを現在の技表にする
     moves = characterCache[id].moves;


      // ★ このキャラの「変身先」も事前ロード
      for (const base in moves) {
        const data = moves[base];
        for (const s in data.transform || {}) {
          const to = data.transform[s];
          if (to) await preloadCharacter(to);
        }
      }

      // プレビュー更新
      document.getElementById("csvPreview").textContent =
        getMoveNameList(moves)
          .map(([name, desc]) =>
            desc ? `${name} ： ${desc}` : name
          )
          .join("\n");

      input.value = "";
      input.focus();

      alert(`${name} を読み込みました`);
    } catch (e) {
      alert("CSVの読み込みに失敗しました");
      console.error(e);
    }
  });


  document.getElementById("search").addEventListener("change", e => {
  document.getElementById("starterSummaryOptions").style.display =
    e.target.checked ? "block" : "none";
});

document
  .getElementById("deleteMode")
  .addEventListener("change", updateDeleteColumn);

  window.addEventListener("load", async () => {
  // 全キャラ事前ロードするならここ
  await Promise.all(
    Object.values(characterMap).map(id => preloadCharacter(id))
  );
  buildCharacterDatalist();
});


