/* =========================================================
   PROMPT 작성지 (exam.html)
   - 왼쪽에 6요소를 입력하면 오른쪽에 전체 프롬프트가 나타난다
   - 작성한 내용은 이 브라우저에 자동으로 저장된다
   ========================================================= */
const STORE = "prompt-exam-free-v1";

const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const filled = data => EL.filter(e => (data[e.k] || "").trim());
const toText = data => filled(data).map(e => e.label + "\n" + data[e.k].replace(/\s+$/, "")).join("\n\n");
const sectionsHTML = data => filled(data).map(e =>
  `<div class="psec" data-k="${e.k}"><span class="plabel">${esc(e.label)}</span><pre class="ptext">${esc(data[e.k].replace(/\s+$/, ""))}</pre></div>`).join("");
const hasText = data => Object.values(data || {}).some(v => (v || "").trim());

/* 알림 */
const toastEl = document.getElementById("toast");
let toastTimer;
function toast(msg, action){
  toastEl.innerHTML = `<span>${esc(msg)}</span>`;
  if(action){
    const b = document.createElement("button");
    b.type = "button"; b.textContent = action.label;
    b.addEventListener("click", () => { action.run(); toastEl.classList.remove("show"); });
    toastEl.appendChild(b);
  }
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), action ? 5000 : 1800);
}

/* 복사 */
async function copy(text){ return copyText(text, "프롬프트를 복사했습니다"); }
async function copyText(text, okMsg){
  if(!text.trim()){ toast("복사할 내용이 없습니다. 입력창을 먼저 채우세요."); return; }
  let ok = false;
  try{ await navigator.clipboard.writeText(text); ok = true; }catch(e){}
  if(!ok){
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try{ ok = document.execCommand("copy"); }catch(_){}
    ta.remove();
  }
  toast(ok ? okMsg : "복사하지 못했습니다. 내용을 직접 선택해 복사하세요.");
}

/* 입력창 만들기 */
const form = document.getElementById("form");
const builtBody = document.getElementById("builtBody");
const dots = document.getElementById("dots");
const progressText = document.getElementById("progressText");

form.innerHTML = EL.map(e =>
  `<div class="field" data-k="${e.k}">
     <label for="f-${e.k}"><span class="plabel">${esc(e.label)}</span><span class="hint">${e.q}</span></label>
     <textarea id="f-${e.k}" rows="3"></textarea>
   </div>`).join("");
const tas = Object.fromEntries(EL.map(e => [e.k, document.getElementById("f-" + e.k)]));
dots.innerHTML = EL.map(e => `<i data-k="${e.k}"></i>`).join("");

const current = () => Object.fromEntries(EL.map(e => [e.k, tas[e.k].value]));
function autosize(ta){ ta.style.height = "auto"; ta.style.height = Math.max(84, ta.scrollHeight + 4) + "px"; }

function update(){
  const data = current();
  builtBody.innerHTML = sectionsHTML(data) || '<div class="empty">왼쪽 입력창에 내용을 쓰면 여기에 프롬프트가 완성됩니다.</div>';
  let n = 0;
  EL.forEach((e, i) => { const on = !!data[e.k].trim(); if(on) n++; dots.children[i].classList.toggle("on", on); });
  progressText.textContent = `6개 중 ${n}개 작성`;
  try{ localStorage.setItem(STORE, JSON.stringify(data)); }catch(_){}
}

function fill(data){
  EL.forEach(e => { tas[e.k].value = (data && data[e.k]) || ""; autosize(tas[e.k]); });
  update();
}

Object.values(tas).forEach(ta => ta.addEventListener("input", () => { autosize(ta); update(); }));

/* 모두 지우기: 확인창 대신 되돌리기 제공 */
document.getElementById("clearAll").addEventListener("click", () => {
  const before = current();
  if(!hasText(before)){ toast("지울 내용이 없습니다"); return; }
  fill({});
  toast("모두 지웠습니다", { label:"되돌리기", run: () => { fill(before); toast("되돌렸습니다"); } });
});

document.getElementById("copyBuilt").addEventListener("click", () => copy(toText(current())));

/* 코드를 받은 다음에 할 일 + 후속 질문 틀 (자유 연습 탭과 같은 내용) */
const FOLLOWUPS = PRACTICE.find(p => p.id === "free").followups.concat(COMMON_FU);
const afterEl = document.getElementById("after");
afterEl.innerHTML = `
  <h3>코드를 받은 다음에는</h3>
  <ol class="steps">
    <li>O에 적은 실행 화면 예시를 그대로 입력해 결과가 같은지 직접 확인합니다.</li>
    <li>AI가 제안한 테스트 표의 값을 차례로 넣어 결과를 비교하고, 기대 결과 중 하나 이상은 계산기로 직접 확인합니다.</li>
    <li>주석과 실행 순서 요약을 읽으며 이해가 안 되는 줄에 표시합니다.</li>
    <li>표시한 줄이나 결과가 다른 부분을 그대로 인용해서 AI에게 후속 질문을 합니다.</li>
  </ol>
  <h4>후속 질문 틀</h4>
  <p class="fu-hint">질문은 코드를 읽은 뒤에 떠오른 것을 쓰는 것이 가장 좋습니다. 무엇을 물어야 할지 막막할 때 참고하세요.</p>
  <ul class="fu">${FOLLOWUPS.map((q, i) =>
    `<li><span>${esc(q)}</span><button class="btn ghost sm" type="button" data-i="${i}">복사</button></li>`).join("")}</ul>`;
afterEl.querySelectorAll(".fu button").forEach(b =>
  b.addEventListener("click", () => copyText(FOLLOWUPS[+b.dataset.i], "질문을 복사했습니다")));

/* 저장된 내용 불러오기 */
let saved = null;
try{ saved = JSON.parse(localStorage.getItem(STORE) || "null"); }catch(_){}
fill(saved || {});
