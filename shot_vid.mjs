import { spawn } from "child_process";
import http from "http";
import { writeFileSync } from "fs";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://localhost:8127/";
const OUT = "E:/网站 - 副本/shot-vid.png";

const edge = spawn(EDGE, [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9222",
  "--window-size=1440,3000",
  "about:blank",
], { stdio: "ignore" });

function getJSON(path) {
  return new Promise((res, rej) => {
    http.get(`http://127.0.0.1:9222${path}`, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
  });
}

await new Promise((r) => setTimeout(r, 1500));
const tabs = await getJSON("/json");
const tab = tabs.find((t) => t.type === "page") || tabs[0];
const wsUrl = tab.webSocketDebuggerUrl;
const ws = new WebSocket(wsUrl);
let id = 0;
const pend = new Map();
ws.addEventListener("message", async (ev) => {
  let text = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const o = JSON.parse(text);
  if (o.id && pend.has(o.id)) { pend.get(o.id)(o.result); pend.delete(o.id); }
});
function send(method, params) {
  return new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
}

ws.addEventListener("open", async () => {
await send("Page.enable");
await send("Page.navigate", { url: URL });
await new Promise((r) => setTimeout(r, 2500));

// 找到视频区节点截图
const r = await send("Runtime.evaluate", {
  expression: `(function(){
    var el = document.querySelector('.ai-col-cover-video');
    if(!el) return null;
    var rect = el.getBoundingClientRect();
    return {x:rect.x,y:rect.y,w:rect.width,h:rect.height,
      cap: getComputedStyle(document.querySelector('.ai-vid-cap')||document.body).color,
      ver: getComputedStyle(document.querySelector('.ai-vid-ver')||document.body).color,
      label: getComputedStyle(document.querySelector('.ai-vid-label')||document.body).color,
      metaBg: getComputedStyle(document.querySelector('.ai-vid-meta')||document.body).backgroundColor};
  })()`,
  returnByValue: true,
});
console.log("INFO", JSON.stringify(r.result));

const clip = r.result;
const info2 = await send("Runtime.evaluate", {
  expression: `(function(){
    var g = document.querySelector('.ai-vid-grid');
    var card = document.querySelector('.ai-vid-card');
    var vid = card ? card.querySelector('video') : null;
    var cover = document.querySelector('.ai-col-cover');
    function rect(e){ if(!e) return null; var r=e.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height)}; }
    return {
      grid: rect(g), card: rect(card),
      cover: rect(cover),
      vidW: vid?Math.round(vid.getBoundingClientRect().width):null,
      vidH: vid?Math.round(vid.getBoundingClientRect().height):null,
      poster: vid?vid.getAttribute('poster'):null,
      theme: document.documentElement.classList.contains('light')?'light':'dark'
    };
  })()`,
  returnByValue: true,
});
console.log("INFO2", JSON.stringify(info2.result));
const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
writeFileSync(OUT, Buffer.from(shot.data, "base64"));
console.log("SAVED", OUT);
ws.close();
edge.kill();
process.exit(0);
});
