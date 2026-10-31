'use strict';
/* =========================================================
   Small Compounding Sync — plugin Obsidian
   Đồng bộ hai chiều "Việc hôm nay" của app Small Compounding với Daily note.
   - Đọc/ghi cùng gist đồng bộ (đã mã hóa AES-GCM) mà app dùng, mở bằng mã kết nối.
   - Chỉ sửa nội dung nằm giữa hai dấu %% small-compounding:start %% và %% small-compounding:end %%.
   ========================================================= */
const { Plugin, PluginSettingTab, Setting, Notice, requestUrl, moment, TFile, normalizePath } = require('obsidian');

const GIST_FILE = 'small-compounding.sync.json';
const PAIR_PREFIX = 'SC1.';
const START = '%% small-compounding:start %%';
const END = '%% small-compounding:end %%';
const LINE_RE = /^\s*[-*]\s+\[( |x|X)\]\s+(.*?)\s*(?:%%\s*sc:([\w-]+)\s*%%)?\s*$/;
const COLLS = ['notes', 'tasks', 'readings', 'reminders'];
const DEFAULTS = { token: '', pass: '', gistId: '', folder: '', format: '', heading: 'Việc hôm nay', interval: 60, lastWritten: {} };

// ---------- Mã hóa (giống hệt app) ----------
const enc = new TextEncoder(), dec = new TextDecoder();
function b64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
async function deriveKey(pw, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function aesSeal(key, text) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)); return { iv: b64(iv), ct: b64(ct) }; }
async function aesOpen(key, iv, ct) { return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct))); }
const passVariants = p => [...new Set([p.normalize('NFC'), p, p.normalize('NFD'), p.trim().normalize('NFC'), p.trim()])];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

function parsePair(code) {
  code = (code || '').trim().replace(/\s+/g, '');
  if (!code.startsWith(PAIR_PREFIX)) return null;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(code.slice(PAIR_PREFIX.length))))); return o.t && o.p ? o : null; } catch (e) { return null; }
}
function normalizeState(s) {
  s = Object.assign({ notes: [], tasks: [], readings: [], reminders: [], logs: {}, del: {}, habits: [] }, s || {});
  COLLS.forEach(c => { if (!Array.isArray(s[c])) s[c] = []; });
  if (!s.del || typeof s.del !== 'object') s.del = {};
  return s;
}

// ---------- Khối việc trong Daily note ----------
const oneLine = s => String(s || '').replace(/\s*\n\s*/g, ' ').replace(/%%/g, '%').trim();
function parseBlock(text) {
  const a = text.indexOf(START), b = text.indexOf(END);
  if (a < 0 || b < a) return null;
  const lines = [];
  for (const raw of text.slice(a + START.length, b).split('\n')) {
    const m = raw.match(LINE_RE);
    if (m) lines.push({ done: m[1] !== ' ', title: oneLine(m[2]), id: m[3] || null });
  }
  return { lines };
}
function blockText(tasks) {
  const rows = tasks.map(t => `- [${t.done ? 'x' : ' '}] ${oneLine(t.title)} %%sc:${t.id}%%`);
  return [START, ...rows, END].join('\n');
}
function writeBlock(text, tasks, heading) {
  const block = blockText(tasks);
  const a = text.indexOf(START), b = text.indexOf(END);
  if (a >= 0 && b > a) return text.slice(0, a) + block + text.slice(b + END.length);
  // Chưa có khối: đặt ở cuối mục có tiêu đề `heading`, nếu không có thì thêm mục mới ở cuối note.
  const lines = text.split('\n');
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hi = lines.findIndex(l => new RegExp(`^(#{1,6})\\s+${esc}\\s*$`).test(l.trim()));
  if (hi >= 0) {
    const level = lines[hi].trim().match(/^#+/)[0].length;
    let end = lines.length;
    for (let i = hi + 1; i < lines.length; i++) { const m = lines[i].match(/^(#{1,6})\s/); if (m && m[1].length <= level) { end = i; break; } }
    while (end > hi + 1 && lines[end - 1].trim() === '') end--;
    lines.splice(end, 0, '', block, '');
    return lines.join('\n');
  }
  return text.replace(/\s*$/, '') + `\n\n## ${heading} (Small Compounding)\n${block}\n`;
}
// Áp thay đổi người dùng làm trong khối vào dữ liệu. Trả về true nếu có thay đổi.
// `last` là những gì plugin đã ghi lần trước ({ id: { d, t } }): một dòng chỉ được coi là
// người dùng sửa khi nó khác với lần ghi đó; còn lại là app đã đổi và app thắng.
function applyEdits(state, block, today, last) {
  const now = Date.now(), byId = new Map(state.tasks.map(t => [t.id, t])), seen = new Set();
  last = last && !Array.isArray(last) ? last : {};
  let changed = false;
  for (const l of block.lines) {
    if (l.id) {
      seen.add(l.id);
      const t = byId.get(l.id), prev = last[l.id]; if (!t || !prev) continue;
      if (l.done !== prev.d && !!t.done !== l.done) { t.done = l.done; t.doneAt = l.done ? now : null; t.u = now; changed = true; }
      if (l.title && l.title !== prev.t && l.title !== oneLine(t.title)) { t.title = l.title; t.u = now; changed = true; }
    } else if (l.title) {
      state.tasks.push({ id: uid(), title: l.title, date: today, done: l.done, doneAt: l.done ? now : null, min: 0, created: now, u: now });
      changed = true;
    }
  }
  for (const id of Object.keys(last)) {
    const t = byId.get(id);
    if (!seen.has(id) && t && t.date === today) { state.tasks = state.tasks.filter(x => x.id !== id); state.del[id] = now; changed = true; }
  }
  return changed;
}
const tasksFor = (state, day) => state.tasks.filter(t => t.date === day).sort((a, b) => (a.created || 0) - (b.created || 0));

// ---------- Plugin ----------
class SmallCompoundingSync extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.keyCache = null; this.busy = false; this.again = false; this.ignoreUntil = 0; this.timer = null;
    this.statusEl = this.addStatusBarItem();
    this.setStatus(this.configured() ? 'Small Compounding' : 'Small Compounding: chưa kết nối');
    this.addSettingTab(new SettingTab(this.app, this));
    this.addRibbonIcon('refresh-cw', 'Small Compounding: đồng bộ việc hôm nay', () => this.sync(true));
    this.addCommand({ id: 'sync-now', name: 'Đồng bộ việc hôm nay', callback: () => this.sync(true) });
    this.addCommand({ id: 'open-daily-and-sync', name: 'Mở Daily note hôm nay và ghi việc vào', callback: async () => { await this.ensureDaily(); await this.sync(true); } });
    this.registerEvent(this.app.vault.on('modify', f => {
      if (Date.now() < this.ignoreUntil || !(f instanceof TFile) || f.path !== this.dailyPath()) return;
      clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(false), 2500);
    }));
    this.registerEvent(this.app.workspace.on('file-open', f => { if (f && f.path === this.dailyPath()) this.sync(false); }));
    this.registerInterval(window.setInterval(() => this.sync(false), Math.max(30, +this.settings.interval || 60) * 1000));
    this.app.workspace.onLayoutReady(() => this.sync(false));
  }
  onunload() { clearTimeout(this.timer); }
  async saveSettings() { await this.saveData(this.settings); }
  configured() { return !!(this.settings.token && this.settings.pass); }
  setStatus(t) { if (this.statusEl) this.statusEl.setText(t); }

  dailyOptions() {
    const dn = this.app.internalPlugins && this.app.internalPlugins.getPluginById && this.app.internalPlugins.getPluginById('daily-notes');
    const o = (dn && dn.instance && dn.instance.options) || {};
    return { folder: (this.settings.folder || o.folder || '').replace(/^\/+|\/+$/g, ''), format: this.settings.format || o.format || 'YYYY-MM-DD' };
  }
  dailyPath() { const { folder, format } = this.dailyOptions(); return normalizePath(`${folder ? folder + '/' : ''}${moment().format(format)}.md`); }
  async ensureDaily() {
    if (this.app.vault.getAbstractFileByPath(this.dailyPath())) return;
    try { await this.app.commands.executeCommandById('daily-notes'); } catch (e) { }
    for (let i = 0; i < 20 && !this.app.vault.getAbstractFileByPath(this.dailyPath()); i++) await new Promise(r => setTimeout(r, 150));
    if (!this.app.vault.getAbstractFileByPath(this.dailyPath())) await this.app.vault.create(this.dailyPath(), `## ${this.settings.heading}\n`);
  }

  async gh(path, method = 'GET', body) {
    const r = await requestUrl({
      url: 'https://api.github.com' + path, method, throw: false, contentType: body ? 'application/json' : undefined,
      headers: { Authorization: 'Bearer ' + this.settings.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.status >= 400) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    return r.json;
  }
  async findGists() {
    const out = [];
    for (let p = 1; p <= 5; p++) {
      const list = await this.gh(`/gists?per_page=100&page=${p}`);
      list.forEach(g => { if (g.files && g.files[GIST_FILE]) out.push(g); });
      if (list.length < 100) break;
    }
    return out.sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || ''))).map(g => g.id);
  }
  async readGist(id) {
    const g = await this.gh('/gists/' + id), f = g && g.files && g.files[GIST_FILE];
    if (!f) return null;
    return JSON.parse(f.truncated ? (await requestUrl({ url: f.raw_url })).text : f.content);
  }
  async open(p) {
    const c = this.keyCache;
    if (c && c.salt === p.salt && c.pass === this.settings.pass) return aesOpen(c.key, p.iv, p.ct);
    let err;
    for (const v of passVariants(this.settings.pass)) {
      const key = await deriveKey(v, unb64(p.salt), p.iter || 310000);
      try { const t = await aesOpen(key, p.iv, p.ct); this.keyCache = { salt: p.salt, pass: this.settings.pass, key, iter: p.iter || 310000 }; return t; } catch (e) { err = e; }
    }
    throw err;
  }
  async loadRemote() {
    if (this.settings.gistId) {
      try { const p = await this.readGist(this.settings.gistId); if (p) return { p, state: normalizeState(JSON.parse(await this.open(p))) }; }
      catch (e) { if (e.status !== 404 && e.name !== 'OperationError') throw e; }
    }
    for (const id of await this.findGists()) {
      if (id === this.settings.gistId) continue;
      const p = await this.readGist(id); if (!p) continue;
      try { const state = normalizeState(JSON.parse(await this.open(p))); this.settings.gistId = id; await this.saveSettings(); return { p, state }; } catch (e) { }
    }
    const e = new Error('Không mở được dữ liệu đồng bộ. Hãy dán lại mã kết nối mới từ app.'); e.name = 'OperationError'; throw e;
  }

  async sync(manual) {
    if (!this.configured()) { if (manual) new Notice('Small Compounding: hãy dán mã kết nối trong phần cài đặt plugin.'); return; }
    if (this.busy) { this.again = true; return; }
    this.busy = true; this.setStatus('Small Compounding: đang đồng bộ…');
    try {
      const { p, state } = await this.loadRemote();
      const today = moment().format('YYYY-MM-DD');
      const file = this.app.vault.getAbstractFileByPath(this.dailyPath());
      if (!(file instanceof TFile)) {
        this.setStatus('Small Compounding: chưa có Daily note hôm nay');
        if (manual) new Notice('Chưa có Daily note hôm nay. Dùng lệnh "Mở Daily note hôm nay và ghi việc vào".');
        return;
      }
      const text = await this.app.vault.read(file);
      const block = parseBlock(text);
      if (block && applyEdits(state, block, today, this.settings.lastWritten[today])) {
        const sealed = await aesSeal(this.keyCache.key, JSON.stringify(state));
        const content = JSON.stringify({ app: 'small-compounding', v: 1, salt: p.salt, iter: this.keyCache.iter, ...sealed, at: Date.now() });
        await this.gh('/gists/' + this.settings.gistId, 'PATCH', { files: { [GIST_FILE]: { content } } });
      }
      const tasks = tasksFor(state, today);
      const next = writeBlock(text, tasks, this.settings.heading);
      if (next !== text) { this.ignoreUntil = Date.now() + 4000; await this.app.vault.modify(file, next); }
      this.settings.lastWritten = { [today]: Object.fromEntries(tasks.map(t => [t.id, { d: !!t.done, t: oneLine(t.title) }])) };
      await this.saveSettings();
      this.setStatus(`Small Compounding: ${tasks.filter(t => t.done).length}/${tasks.length} việc · ${moment().format('HH:mm')}`);
      if (manual) new Notice('Small Compounding: đã đồng bộ việc hôm nay');
    } catch (e) {
      const msg = e.name === 'OperationError' ? e.message.startsWith('Không') ? e.message : 'Mật khẩu đồng bộ không khớp. Hãy dán lại mã kết nối mới từ app.'
        : e.status === 401 ? 'Token GitHub không hợp lệ hoặc đã hết hạn.' : (e.message || 'Lỗi không rõ');
      this.setStatus('Small Compounding: lỗi đồng bộ');
      if (manual) new Notice('Small Compounding: ' + msg);
      console.error('[small-compounding-sync]', e);
    } finally {
      this.busy = false;
      if (this.again) { this.again = false; setTimeout(() => this.sync(false), 500); }
    }
  }
}

class SettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this, s = this.plugin.settings, d = this.plugin.dailyOptions();
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Small Compounding Sync' });
    containerEl.createEl('p', { text: this.plugin.configured() ? `Đã kết nối. Daily note hôm nay: ${this.plugin.dailyPath()}` : 'Chưa kết nối. Trong app Small Compounding, vào Cài đặt → Kết nối máy khác → Sao chép mã kết nối, rồi dán vào ô dưới.' });
    new Setting(containerEl).setName('Mã kết nối').setDesc('Bắt đầu bằng SC1. Mã chứa token và mật khẩu đồng bộ, được lưu trong thư mục .obsidian của vault.')
      .addTextArea(t => t.setPlaceholder('SC1.…').onChange(async v => {
        const o = parsePair(v); if (!o) return;
        Object.assign(s, { token: o.t, pass: o.p, gistId: o.g || '' }); this.plugin.keyCache = null;
        await this.plugin.saveSettings(); new Notice('Small Compounding: đã nhận mã kết nối'); this.plugin.sync(true); this.display();
      }));
    new Setting(containerEl).setName('Thư mục Daily notes').setDesc(`Để trống để dùng theo plugin Daily notes (hiện tại: ${d.folder || 'thư mục gốc'}).`)
      .addText(t => t.setPlaceholder(d.folder).setValue(s.folder).onChange(async v => { s.folder = v.trim(); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('Định dạng tên Daily note').setDesc(`Để trống để dùng theo plugin Daily notes (hiện tại: ${d.format}).`)
      .addText(t => t.setPlaceholder(d.format).setValue(s.format).onChange(async v => { s.format = v.trim(); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('Tiêu đề mục').setDesc('Danh sách việc được đặt ở cuối mục có tiêu đề này.')
      .addText(t => t.setValue(s.heading).onChange(async v => { s.heading = v.trim() || DEFAULTS.heading; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('Đồng bộ mỗi (giây)').setDesc('Áp dụng sau khi tắt và bật lại plugin. Tối thiểu 30.')
      .addText(t => t.setValue(String(s.interval)).onChange(async v => { s.interval = Math.max(30, +v || 60); await this.plugin.saveSettings(); }));
    new Setting(containerEl).addButton(b => b.setButtonText('Đồng bộ ngay').setCta().onClick(() => this.plugin.sync(true)))
      .addButton(b => b.setButtonText('Ngắt kết nối').onClick(async () => { Object.assign(s, { token: '', pass: '', gistId: '' }); await this.plugin.saveSettings(); this.display(); }));
  }
}

module.exports = SmallCompoundingSync;
module.exports._test = { parseBlock, writeBlock, applyEdits, blockText, parsePair };
