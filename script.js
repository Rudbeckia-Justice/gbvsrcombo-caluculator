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



    // ======================
    // 技データ
    // ======================
    const moves = {
      "C": {
        min: 0.2,
        dmg: { L: 600, M: 1100, H: 1600 },
        scale: { L: 1.0, M: 1.0, H: 1.0 },
        cmd: false
      },
      "236": {
        min: 0.2,
        dmg: { L: [300,300,300], M: 1200, H: 1400 },
        scale: { L: 1.0, M: 1.0, H: 1.0 },
        cmd: true
      },
      "奥義": {
        min: 0.5,
        dmg: { "": 4000 },
        scale: { L: 1.0, M: 1.0, H: 1.0 },
        cmd: true
      },
      "RS": {
  min: { "": 0.2 },
  dmg: { "": 1500 },
  scale: { "": 1 },
  cmd: false
},
"RC": {
  min: { "": 0.2 },
  dmg: { "": 1000 },
  scale: { "": 1 },
 cmd: false
},
"DA": {
  min: { "": 0.2 },
  dmg: { "": 700 },
  scale: { "": 1 },
  cmd: false
},
"TA": {
  min: { "": 0.2 },
  dmg: { "": 1000 },
  scale: { "": 1 },
  cmd: false
}
};

//キャラ表検索
const charMap = {
  "ゾーイ": "zooey",
  "ヴィーラ": "vira",
  "グリームニエル": "grimnir"
};

document.getElementById("characterInput").addEventListener("change", async (e) => {
  const name = e.target.value;
  const id = charMap[name];
  if (!id) return;

  moves = {
  "RS": {
  min: { "": 0.2 },
  dmg: { "": 1500 },
  scale: { "": 1 },
  cmd: false
},
"RC": {
  min: { "": 0.2 },
  dmg: { "": 1000 },
  scale: { "": 1 },
 cmd: false
},
"DA": {
  min: { "": 0.2 },
  dmg: { "": 700 },
  scale: { "": 1 },
  cmd: false
},
"TA": {
  min: { "": 0.2 },
  dmg: { "": 1000 },
  scale: { "": 1 },
  cmd: false
}
}; // 技表リセット

  const res = await fetch(`csv/${id}.csv`);
  const text = await res.text();
  loadMovesFromCSV(text);

  console.log(`${name} の技表を読み込みました`);
});


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
    function parseMove(move) {
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
      onCooldown
    };
  }

  if (moves[move]) {
    return {
      base: move,
      strength: "",
      hitRange,
      technical,
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
        <td>${d.move}</td>
        <td>${d.hit}</td>
        <td>${d.raw}</td>
        <td>${Math.round(d.scale * 100)}%</td>
        <td>${d.final}</td>
      </tr>`;
  });

  html += `
    <tr>
      <th colspan="5">合計</th>
      <th>${result.total}</th>
    </tr>
  </table>`;

  resultDiv.innerHTML = html;
  return;
}


  // ===== 始動別まとめ =====
  const starters = getStartersFromInput();

  let html = `<table border="1" cellpadding="6">
    <tr>
      <th>始動</th>
      <th>コンボ</th>
      <th>ダメージ</th>
    </tr>`;

  for (const starter of starters) {
    const combo =
      starter + ">" + inputCombo;

    const dmg = calcDamage(combo);

    html += `
      <tr>
        <td>${starter}</td>
        <td>${combo}</td>
        <td>${dmg.total}</td>
      </tr>`;
  }

  html += "</table>";
  resultDiv.innerHTML = html;
}

function calcDamage(comboText) {
  const expanded = [];
  const checked = document.getElementById("forceTech").checked;

  const list = comboText
    .replace(/＞/g, ">")
    .split(">")
    .map(s => s.trim());

  for (const raw of list) {
    const parsed = parseMove(raw);
    if (!parsed) continue;
    expanded.push(parsed);

    if (parsed.repeat === 2) {
      expanded.push({ base: "DA", strength: "", technical: false, onCooldown: false });
    }
    if (parsed.repeat >= 3) {
      expanded.push({ base: "DA", strength: "", technical: false, onCooldown: false });
      expanded.push({ base: "TA", strength: "", technical: false, onCooldown: false });
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

  for (const parsed of expanded) {
    const data = moves[parsed.base];
    if (!data) continue;

    const baseDmg =
      data.dmg?.[parsed.strength] ?? data.dmg?.[""];
    if (baseDmg == null) continue;

    const baseMin =
      data.min?.[parsed.strength] ?? data.min?.[""];
    if (baseMin == null) continue;

    let damages = Array.isArray(baseDmg) ? baseDmg : [baseDmg];
    damages = filterHits(damages, parsed.hitRange);

    let mins = Array.isArray(baseMin) ? baseMin : [baseMin];
    mins = filterHits(mins, parsed.hitRange);

    const baseScale = 
    data.scale?.[parsed.strength] ?? data.scale?.[""] ?? 1.0;
    const baseBP = 
    data.BP?.[parsed.strength] ?? data.BP?.[""] ?? 0;

    hit++;
    BPn -= baseBP;

    // RC補正 
    if (parsed.base === "RC" && hit <= 5){ 
    hit = 5; }

    for (let i = 0; i < damages.length; i++) {
  const d = damages[i];
  const min = mins[i] ?? mins[0]; // 段指定時も安全

  const scale = calcScale(hit, min);

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
    if (BPn === 0){
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
        final: finalDmg
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
  const names = [];

  for (const base in movesObj) {
    const data = movesObj[base];

    // 強度（L/M/H/U など）
    const strengths = Object.keys(data.dmg || {});

    if (strengths.length === 0 || (strengths.length === 1 && strengths[0] === "")) {
      // 強度なし技
      names.push(base);
    } else {
      for (const s of strengths) {
        if (s === "") {
          names.push(base);
        } else {
          names.push(base + s);
        }
      }
    }
  }

  return names;
}


function loadMovesFromCSV(text) {
  const lines = text
  .trim()
  .replace(/\r/g, "")
  .split("\n");

  lines.shift(); // ヘッダ削除

  const newMoves = {};

  for (const line of lines) {
    let [base, strengthStr, damageStr, minStr, scaleStr, BPStr, cmdStr] = line.split(",");

    base = base.trim().toUpperCase();
    strengthStr = strengthStr
      ? strengthStr.trim().toUpperCase()
      : "";

    if (!newMoves[base]) {
      newMoves[base] = {
        min: {},
        dmg: {},
        scale: {},
        BP: { "" : BPStr },
    cmd: cmdStr?.trim().toLowerCase() === "c"
      };
    }

    const strengths = strengthStr
      ? strengthStr.split("|").map(s => s.trim().toUpperCase())
      : [""];

    const damageVariants = damageStr.split("|");
    const scaleVariants = scaleStr
      ? scaleStr.split("|").map(Number)
      : [];
    const minVariants = minStr
  ? minStr.split("|")
  : [];


    strengths.forEach((s, i) => {
      const dmgPart = damageVariants[i];
      const hits = dmgPart.includes("/")
        ? dmgPart.split("/").map(Number)
        : [Number(dmgPart)];

      newMoves[base].dmg[s] = hits;

      // ===== 最低保証（★追加） =====
      let minPart = minVariants[i] ?? minVariants[0] ?? "0";
      const mins = minPart.includes("/")
        ? minPart.split("/").map(Number)
        : [Number(minPart)];

      newMoves[base].min[s] = mins;

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

  Object.assign(moves, newMoves);

  document.getElementById("csvPreview").textContent =
    JSON.stringify(getMoveNameList(newMoves), null, 2);

  alert("技表を読み込みました！");
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
