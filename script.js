    function toggleStarterInput() {
  const box = document.getElementById("starterBox");
  const checked = document.getElementById("search").checked;
  box.style.display = checked ? "block" : "none";
}

   function toggleStarterTableInput() {
  const set = document.getElementById("starterTableSet");
  const starterChecked =
    document.getElementById("starterTable")?.checked;

  const bpChecked =
    document.getElementById("bpTable")?.checked;

  const nCheked = 
   document.getElementById("ncalc")?.checked;
  
   const sCheked = 
   document.getElementById("search")?.checked;

  set.style.display = (starterChecked || bpChecked ||!nCheked && !sCheked) ? "block" : "none";
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

  ["starterMatrixTable", "bpMatrixTable"].forEach(id => {
    const table = document.getElementById(id);
    if (!table) return;

    [...table.rows].forEach(row => {
      const cell = row.cells[0];
      if (cell) {
        cell.style.display = show ? "table-cell" : "none";
      }
    });
  });
}


let tempBP = null;

function setInitialBP(bp) {
  tempBP = bp;
}

function clearInitialBP() {
  tempBP = null;
}


function getInitialBP() {
  if (tempBP !== null) return tempBP;

  return [...document.querySelectorAll(".BP")]
    .filter(cb => cb.checked).length;
}


function lovecalc(love,parsed){
  let base = parsed.base
  if (love <= 8){
  if(parsed.base === "SBA")
  base = "2SBA";
if (parsed.base === "SSBA"){
  base = "2SSBA"
}
  }
  if(love <= 3){
    if(parsed.base === "SBA")
  base ="3SBA"
if (parsed.base === "SSBA"){
 base = "3SSBA"
}
  }
  return base;
}

function bladecalc(blade,parsed,data){
  let base = parsed.base
  if(data.cmd === true){
  if (blade === 5){
   base = "3" + parsed.base
  }else if(blade >= 4){
   base = "2" + parsed.base
  }else if(blade >= 2){
    base = "1" + parsed.base
}
}
  return base;
}

function setBPCheckboxes(n) {
  const boxes = [...document.querySelectorAll(".BP")];
  boxes.forEach((cb, i) => {
    cb.checked = i < n;
  });
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
    .replace(/＾/g, "^")
    .replace(/＠/g,"@");

  const onCooldown = move.includes("!");
  const technical = move.includes("*") || move.includes("^");
  const techBonus = move.includes("*");
  const hitflag = move.includes("@");
  move = move.replace(/[!*^@]/g, "");

  const lm = move.match(/^(.*?)([LMHU]+)$/);
  if (lm) {
    return {
      base: lm[1],
      strength: lm[2][0],
      repeat: lm[2].length,
      hitRange,        // ← 追加
      technical,
      techBonus,
      onCooldown,
      hitflag
    };
  }

  if (movetable[move]) {
    return {
      base: move,
      strength: "",
      hitRange,
      technical,
      techBonus,
      onCooldown,
      hitflag
    };
  }

  return null;
}
    function filterHits(damages, hitRange) {
  if (!hitRange) return damages;
   // ★ データが1個しかない場合は使い回す
  if (damages.length === 1) {
    return damages;
  }
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

function upid(id, max ,num) {
  const input = document.getElementById(id);
  if (!input) return;
  const value = Number(input.value) || 0;

input.value = Math.min(max ,value +num);
}


function downid(id, min ,num) {
  const input = document.getElementById(id);
  if (!input) return;
  const value = Number(input.value) || 0;

  input.value = Math.max(min ,value -num);
}




function splitCombo(text) {
  const result = [];
  let buf = "";
  let depth = 0;
  for (const ch of text) {
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (ch === ">" && depth === 0) {
      result.push(buf.trim());
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf) result.push(buf.trim());
  return result;
}
function pushWithRepeat(raw, currentMoves, expanded) {
  const tmp = parseMove(raw, currentMoves);
  if (!tmp) return;
  expanded.push(raw);
  if (tmp.repeat === 2) {
    expanded.push("DA");
  }
  if (tmp.repeat >= 3) {
    expanded.push("DA");
    expanded.push("TA");
  }
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

function getOrCreateBPMatrix() {
  let table = document.getElementById("bpMatrixTable");

  if (!table) {
    table = document.createElement("table");
    table.id = "bpMatrixTable";
    table.border = "1";
    table.cellPadding = "6";
    const header = table.insertRow();

    // 削除列
    const del = header.insertCell();
    del.textContent = "削除";
    del.style.display = "none";

    header.insertCell().textContent = "コンボ";

    for (let bp = 0; bp <= 3; bp++) {
      header.insertCell().textContent = `BP${bp}`;
    }

    document.getElementById("result").innerHTML = "";
    document.getElementById("result").appendChild(table);
  }

  return table;
}


function recalcTable() {
  const table = document.getElementById("starterMatrixTable");
  if (!table) return;

  const starters = lockedStarters;
  const enabled = getEnabledStarters();

  for (let r = 1; r < table.rows.length; r++) {
    const row = table.rows[r];

    const initialBP = Number(row.cells[1].textContent);
    const combo = row.cells[2].textContent;

    setInitialBP(initialBP);

    starters.forEach((starter, i) => {
      const cell = row.cells[i + 3];

      if (!enabled.includes(starter)) {
        cell.textContent = "—";
        return;
      }

      const full = starter + ">" + combo;
      cell.textContent = calcDamage(full).total;
    });
  }

  clearInitialBP();
}

//最大ダメージマーキング
function highlightMaxDamagePerColumn(id, scol) {
  const table = document.getElementById(id);
  if (!table) return;

  const rowCount = table.rows.length;
  const colCount = table.rows[0].cells.length;

  for (let col = scol; col < colCount; col++) {
    const cells = [];

    for (let row = 1; row < rowCount; row++) {
      const cell = table.rows[row].cells[col];
      if (!cell) continue;

      const v = Number(cell.textContent);
      if (Number.isNaN(v)) continue;

      cells.push({ cell, value: v });
    }

    // リセット
    cells.forEach(o =>
      o.cell.classList.remove("max-damage", "second-damage")
    );

    if (cells.length === 0) continue;

    const uniq = [...new Set(cells.map(o => o.value))]
      .sort((a, b) => b - a);

    const max = uniq[0];
    const second = uniq[1];

    cells.forEach(o => {
      if (o.value === max) {
        o.cell.classList.add("max-damage");
      } else if (o.value === second) {
        o.cell.classList.add("second-damage");
      }
    });
  }
}


    
    function calc() {
  const inputCombo = document.getElementById("combo").value;
  const searchMode = document.getElementById("search").checked;
  const resultDiv = document.getElementById("result");
  const desc = document.getElementById("description");
  const makeBPTable =
  document.getElementById("bpTable")?.checked;

  desc.style.display = (searchMode||makeBPTable) ? "none" : "block";

  // BPモード
if (makeBPTable) {

   
  const table = getOrCreateBPMatrix();
  const combo = inputCombo;

  // ★ 1回の計算で1行だけ追加
  const row = table.insertRow();

  // 削除ボタン
  const delCell = row.insertCell();
  const btn = document.createElement("button");
  btn.textContent = "×";
  btn.onclick = () => row.remove();
  delCell.appendChild(btn);
  delCell.style.display =
    document.getElementById("deleteMode").checked
      ? "table-cell"
      : "none";

  // コンボ表示
  row.insertCell().textContent = combo;

  // BP0〜3
  for (let bp = 0; bp <= 3; bp++) {
    setBPCheckboxes(bp);   // BPを一時的に固定
    row.insertCell().textContent =
      calcDamage(combo).total;
      
  }
highlightMaxDamagePerColumn("bpMatrixTable",2)
  return;
}


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

//新規行
 let row = table.insertRow();
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
highlightMaxDamagePerColumn("starterMatrixTable",3)

}

function calcDamage(comboText) {
  const originalMoves = moves; // ★ 元を保存
  let currentMoves = moves;    // ★ 計算用

   let loves =
    Number(document.getElementById("loveinput").value) || 0;

    let blades =
    Number(document.getElementById("bladeinput").value) || 0;

  const expanded = [];
  const checked = document.getElementById("forceTech").checked;

   const list = splitCombo(comboText.replace(/＞/g, ">"));

  for (const raw of list) {

      // ===== 特殊構文: 214H[1,＞cH＞236H,2-3] =====
  const m = raw.match(/^(.*?)\[(.+)\]$/);
   if (m) {
    const base = m[1];
    const parts = m[2].split(",").map(s => s.trim());
      let first = true;

    for (const p of parts) {

      // ＞cH＞236H
     if (p.startsWith(">")) {
  const seq = p.slice(1).split(">").map(s => s.trim());

  for (const s of seq) {
    pushWithRepeat(s, currentMoves, expanded);
  }

  first = false;
  continue;
}
     // 1 / 2-3
      expanded.push(
        first
          ? `${base}[${p}]`
          : `${base}@[${p}]`
      );
      first = false;
    }

    continue; // ← 超重要
  }

pushWithRepeat(raw, currentMoves, expanded);

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

  let data = currentMoves[parsed.base];
  if (!data) continue;

  

const lovecount = Number( 
  data.love?.[parsed.strength] ??
  data.love?.[""] ??
  0
);

  const bladeArr =
  data.blade?.[parsed.strength] ??
  data.blade?.[""] ??
  [0, 0];

const bladecount = Number(bladeArr[0] ?? 0);
const bladehitcount = Number(bladeArr[1] ?? 0);

console.log("lovecount:", lovecount, "type:", typeof lovecount);

 if(lovecount < 0){
      loves = 13;
    }
    else{
    loves -= lovecount;
  }
    console.log("loves:", loves, "type:", typeof loves);
  

  if (blades !== 0){
  const bladed = bladecalc(blades,parsed,data);
  data = currentMoves[bladed];
  if (!data) continue;
  }

console.log("bladed" ,data.dmg);
if (loves!== 13){
  const loved = lovecalc(loves,parsed);
    data = currentMoves[loved];
  if (!data) continue;
}
  

 const transformTo =
  data.transform?.[parsed.strength] ??
  data.transform?.[""];

    const baseDmg =
      data.dmg?.[parsed.strength] ?? data.dmg?.[""];
    if (baseDmg == null) {
      continue
    }
    
    const ZeroDmg = Number(baseDmg)

let hitnum = 1;

if (parsed.hitflag || data.hitf || (ZeroDmg === 0 && transformTo)) {
  hitnum = 0;
}

console.log("baseDmg:", baseDmg, "type:", typeof baseDmg);

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
    
    
    hit += hitnum;
   blades = Math.min(5 ,blades + bladecount);
const stotal = damages.reduce((sum, dd) => sum + dd, 0);
if ( stotal !== 0 && !parsed.hitflag){
  blades = Math.min(5 ,blades + bladehitcount);
}

console.log("blades:", blades, "type:", typeof blades);

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
       scale * Math.floor(d * techRate * uPenalty * cooltimePenalty + 1e-8) * BPbonus + 1e-8
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
 

  if (transformTo) {
  const char = characterCache[transformTo];
  if (!char) {
    console.error("未ロードの変身先:", transformTo);
  } else {
    currentMoves = char.moves;
  }
}
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
        data.desc?.[""] ?? "" ,
         data.concl ?? false
      ]);
    }
    // 強度あり
    else {
      for (const s of strengths) {
        list.push([
          s === "" ? base : base + s,
          data.desc?.[s] ?? data.desc?.[""] ?? "" ,
           data.concl ?? false
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
    let [base, strengthStr, damageStr, minStr, scaleStr, BPStr, cmdStr, transStr, descStr ,loveStr ,bladeStr ,hitfStr ,conclStr] = line.split(",");

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
          desc: {},
          love: {},
          blade: {},
          hitf: hitfStr?.trim().toLowerCase() === "f",
          concl: conclStr?.trim().toLowerCase() === "c"
      };
    }

    const strengths = strengthStr
      ? strengthStr.split("|").map(s => s.trim().toUpperCase())
      : [""];

    const BPVariants = BPStr
      ? BPStr.split("|").map(s => s.trim().toUpperCase())
      : [""];

      const loveVariants = loveStr
      ? loveStr.split("|").map(s => s.trim().toUpperCase())
      : [""];

      const bladeVariants = bladeStr
      ? bladeStr.split("|").map(s => s.trim().toUpperCase())
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

      const trans =
    transVariants[i] ??
    transVariants[0] ??
    "";


    newMoves[base].transform[s] = trans || null;

    const loves =
    loveVariants[i] ??
    loveVariants[0] ??
    "";

    newMoves[base].love[s] = loves;

   let bladePart = bladeVariants[i] ?? bladeVariants[0] ?? "0";
      const blades = bladePart.includes("/")
        ? bladePart.split("/").map(Number)
        : [Number(bladePart)];


    newMoves[base].blade[s] = blades;

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
    .filter(([name, desc, concl]) => !concl) // concl=true を除外
      .map(([name, desc]) =>
        desc ? `${name} ： ${desc}` : name
      )
      .join("\n");

  alert("技表を読み込みました！");
}


//始動まとめ表作成用関数
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


const characterMap = [
  "vira" ,
  "cvira" ,
  "zooey" ,
  "grimnir" ,
  "gran" ,
  "dnarmaya" ,
  "fnarmaya" ,
  "djeeta" ,
  "katalina",
  "nier" ,
  "dnier" ,
  "lucilius"
    ];

    document.getElementById("csvInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    loadMovesFromCSV(reader.result);
  };
  reader.readAsText(file);
});


document
  .getElementById("loadCharBtn")
  .addEventListener("click", async () => {

    const input = document.getElementById("characterInput");

    const option = [...document.querySelectorAll("#characterList option")]
      .find(o => o.value === input.value);

    if (!option) {
      alert("キャラ名が正しくありません");
      return;
    }

    const id = option.dataset.id;

    try {
      // キャラ本体をロード
      await preloadCharacter(id);
      moves = characterCache[id].moves;

      // CSVプレビュー表示
      document.getElementById("csvPreview").textContent =
        getMoveNameList(moves)
        .filter(([name, desc, concl]) => !concl) // concl=true を除外
          .map(([name, desc]) =>
            desc ? `${name} ： ${desc}` : name
          )
          .join("\n");

      input.value = "";
      input.focus();

      alert(`${characterCache[id].name} を読み込みました`);
    } catch (e) {
      alert("CSVの読み込みに失敗しました");
      console.error(e);
    }
    if (id === "nier" || id === "dnier") {
document.getElementById("loved").style.display = "block";
    }else{
      document.getElementById("loved").style.display = "none";
      const input = document.getElementById("loveinput");
      input.value = 13; 
    }

    if (id === "lucilius") {
document.getElementById("bladed").style.display = "block";
    }else{
      document.getElementById("bladed").style.display = "none";
      const input = document.getElementById("bladeinput");
      input.value = 0; 
    }
  });



  document.getElementById("search").addEventListener("change", e => {
  document.getElementById("starterSummaryOptions").style.display =
    e.target.checked ? "block" : "none";
});

 document.getElementById("bpTable").addEventListener("change", e => {
  document.getElementById("starterSummaryOptions").style.display =
    e.target.checked ? "none" : "block";
});
 document.getElementById("ncalc").addEventListener("change", e => {
  document.getElementById("starterSummaryOptions").style.display =
    e.target.checked ? "none" : "block";
});

document
  .getElementById("deleteMode")
  .addEventListener("change", updateDeleteColumn);

  window.addEventListener("load", async () => {
  // 全キャラ事前ロードするならここ
  await Promise.all(
    characterMap.map(id => preloadCharacter(id))
  );
  buildCharacterDatalist();
});


