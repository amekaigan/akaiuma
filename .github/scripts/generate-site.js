const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

/* =========================================================
   ▼▼▼ ここだけ書き換えれば全ページに反映されます ▼▼▼
   ========================================================= */

const SITE = {
  name: 'あかいうま',
  tagline: '物販の売上アップと業務効率化',
  url: 'https://akaiuma.com',
  // 記事を置くディレクトリ名（/blog/xxxxx/ という形になります）
  articlesDir: 'blog',
  logoWhite: '/assets/logo/logo-white.svg',
  logoColor: '/assets/logo/logo-mark.svg',
  description: '物販の現場で実際に手を動かしている運営者が、売上と効率化の実務を書いています。',
};

// 配色。ここを変えるとサイト全体の色が変わります
const C = {
  brand: '#C8102E',      // ブランドの赤
  brandDark: '#9E0C24',  // ホバー時の濃い赤
  brandBg: '#FDF2F4',    // 赤の薄い背景
  brandBorder: '#F5C6CE',
  ink: '#1A1A1A',        // 見出し・本文の黒
  inkSub: '#3A3A3A',
  dark: '#1C1C1E',       // ヘッダー・フッターの地色
  darkSub: '#2C2C2E',
  textOnDark: '#E8E8E8',
  muted: '#6B7280',
  line: '#E5E7EB',
  bgSoft: '#FAFAFA',
};

// お知らせバー：text を空文字 '' にするとバー自体が非表示になります
const ANNOUNCE = {
  text: '',
  url: '/',
};

// トップページのスライダーに出す「おすすめ記事」の slug（表示順）
const FEATURED_SLUGS = [];

// 記事下の大きめCTA
const CTA = {
  heading: '在庫と発注の判断を、勘から数字に変える',
  body: '複数チャネルの販売実績から発注量を判断するための考え方を、実際の運用手順としてまとめています。',
  publisher:
    '物販の現場で複数チャネルを運用している運営者が、実務で使っているやり方をそのまま書いています。',
  button: '詳しく見る →',
  url: '/tool/',
  previews: [],
};

// 本文中の広告枠（AUTO:AD マーカーがある記事だけに挿入されます）
const AD_SLOT = {
  label: 'PR',
  html: `<p style="margin:0 0 10px; font-weight:bold; color:${'#1A1A1A'};">在庫の持ちすぎと欠品を、同時に減らす</p>
<a href="/tool/" style="display:inline-block; background:#C8102E; color:#fff; text-decoration:none; font-weight:bold; padding:9px 20px; border-radius:6px; font-size:0.9em;">詳しく見る →</a>`,
};

// 開示ブロック（AUTO:DISCLOSURE マーカーがある記事に挿入されます）
// アフィリエイトリンクや自社ツールに触れる記事には必ず入れてください
const DISCLOSURE = {
  affiliate: '本記事にはアフィリエイトリンクを含みます。',
  owned: `本記事で紹介している自社ツールは、当サイト運営者が開発・販売しているものです。作っている側の立場であることを明示したうえで、向き不向きを書いています。`,
};

// ===== 記事本文中への自動挿入の設定 =====
const TOC_MIN_H2 = 4;
const AD_MIN_H2 = 5;
const AD_BEFORE_NTH_H2 = 3;

// PR枠を入れないパス（正規表現）
const NO_AD_PATH = /(^|\/)(tool|about|privacy|law)\//;

// Google Analytics 4 の測定ID（G-XXXXXXXXXX の形式）
const GA4_ID = '';

// カテゴリ。左が表示名、右がURLのアンカーになるID
const CATEGORY_TO_ID = {
  'リサーチ': 'research',
  '仕入れ': 'sourcing',
  '販路・集客': 'sales',
  '在庫管理': 'inventory',
  '数字管理': 'numbers',
  '業務効率化': 'efficiency',
};

/* =========================================================
   ▲▲▲ 書き換えるのはここまで ▲▲▲
   ========================================================= */

const ARTICLES_DIR = path.join(ROOT, SITE.articlesDir);
const ARTICLES_INDEX = path.join(ARTICLES_DIR, 'index.html');
const TOP_INDEX = path.join(ROOT, 'index.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const SEARCH_INDEX = path.join(ROOT, 'search-index.json');
const THUMB_DIR = path.join(ROOT, 'assets', 'thumb');
const SITE_URL = SITE.url;
const VISIBLE_COUNT = 5;
const CATEGORY_ORDER = Object.values(CATEGORY_TO_ID);
const LEVEL_LABEL = { beginner: '初心者向け', intermediate: '中級者向け' };

function extractMeta(content) {
  const m = content.match(/<!--([\s\S]*?)-->/);
  if (!m) return null;
  const block = m[1];
  const get = (key) => {
    const mm = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return mm ? mm[1].trim() : null;
  };
  return {
    title: get('title'),
    meta: get('meta'),
    permalink: get('permalink'),
    published: get('published'),
    updated: get('updated'),
    verified: get('verified'),
    category: get('category'),
    level: get('level'),
    disclosure: get('disclosure'),
    thumb: get('thumb'),
  };
}

function slugOf(permalink) {
  return (permalink || '').replace(/\/$/, '').split('/').pop();
}

function thumbOf(article) {
  if (article.thumb) return article.thumb;
  const slug = slugOf(article.permalink);
  const p = path.join(THUMB_DIR, `${slug}.png`);
  return fs.existsSync(p) ? `/assets/thumb/${slug}.png` : null;
}

function loadArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const dirs = fs
    .readdirSync(ARTICLES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'));
  const articles = [];
  for (const d of dirs) {
    const filePath = path.join(ARTICLES_DIR, d.name, 'index.html');
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('name="robots" content="noindex')) continue;
    const info = extractMeta(content);
    if (!info || !info.permalink || !info.category) continue;
    if (!CATEGORY_TO_ID[info.category]) {
      console.warn(`未定義のカテゴリ: ${info.category} (${info.permalink})`);
      continue;
    }
    if (!info.level) console.warn(`level がありません: ${info.permalink}`);
    info.file = filePath;
    articles.push(info);
  }
  articles.sort((a, b) => (b.published || '').localeCompare(a.published || ''));
  return articles;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function levelBadge(level) {
  if (!level || !LEVEL_LABEL[level]) return '';
  const isBeg = level === 'beginner';
  const bg = isBeg ? '#EEF2FF' : C.brandBg;
  const fg = isBeg ? '#3730A3' : C.brandDark;
  return `<span style="display:inline-block; font-size:0.72em; font-weight:bold; color:${fg}; background:${bg}; border-radius:4px; padding:2px 8px; margin-left:8px;">${LEVEL_LABEL[level]}</span>`;
}

function cardHtml(article) {
  return `<div style="border:1px solid ${C.line}; border-radius:8px; padding:20px; margin:20px 0;">
  <p style="font-size:0.8em; color:${C.brand}; font-weight:bold; margin:0 0 6px;">${escapeHtml(article.category)}${levelBadge(article.level)}</p>
  <h3 style="margin:0 0 8px; font-size:1.1em;"><a href="${article.permalink}" style="color:${C.ink}; text-decoration:none;">${escapeHtml(article.title)}</a></h3>
  <p style="color:${C.muted}; margin:0;">${escapeHtml(article.meta)}</p>
</div>`;
}

function categoryBlockHtml(catArticles) {
  const visible = catArticles.slice(0, VISIBLE_COUNT);
  const rest = catArticles.slice(VISIBLE_COUNT);
  let html = visible.map(cardHtml).join('\n\n');
  if (rest.length > 0) {
    const restHtml = rest.map(cardHtml).join('\n\n');
    html += `\n\n<details style="margin-top:8px;">
  <summary style="cursor:pointer; color:${C.brand}; font-weight:bold; padding:10px 0; font-size:0.95em;">もっと見る（残り${rest.length}件）</summary>
  <div style="margin-top:8px;">
${restHtml}
  </div>
</details>`;
  }
  return html;
}

function replaceBetweenMarkers(content, markerName, innerHtml, quiet) {
  const startMarker = `<!-- AUTO:${markerName}:START -->`;
  const endMarker = `<!-- AUTO:${markerName}:END -->`;
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
  if (!regex.test(content)) {
    if (!quiet) console.warn(`マーカーが見つかりません: ${markerName}`);
    return content;
  }
  return content.replace(regex, `${startMarker}\n${innerHtml}\n${endMarker}`);
}

function hasMarker(content, markerName) {
  return content.includes(`<!-- AUTO:${markerName}:START -->`);
}

/* ---------------- 共通パーツ ---------------- */

function headerHtml() {
  const A = SITE.articlesDir;
  return `<header style="background:${C.dark}; border-bottom:2px solid ${C.brand}; position:sticky; top:0; z-index:100; box-shadow:0 2px 16px rgba(0,0,0,.25);">
  <div style="max-width:860px; margin:0 auto; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
    <a href="/" style="text-decoration:none; display:flex; align-items:center; gap:10px; min-width:0;"><img src="${SITE.logoWhite}" alt="${SITE.name}" style="height:32px; width:auto; display:block;"><span style="font-size:0.62em; color:${C.muted}; white-space:nowrap;">${SITE.tagline}</span></a>
    <input type="checkbox" id="navToggle">
    <label for="navToggle" id="navBtn" aria-label="メニュー">
      <svg class="ic-open" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      <svg class="ic-close" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
    </label>
    <nav id="siteNav">
      <div id="searchWrap">
        <input id="siteSearch" type="search" placeholder="記事を検索" autocomplete="off">
        <button id="searchClear" type="button" aria-label="検索をやめる">✕</button>
        <div id="searchResults"></div>
      </div>
      <a href="/">ホーム</a>
      <a href="/${A}/">記事一覧</a>
      <a href="/${A}/#inventory">在庫管理</a>
      <a href="/about/">このサイトについて</a>
      <a href="/tool/" class="nav-cta">ツール</a>
      <label for="navToggle" class="nav-close">✕ 閉じる</label>
    </nav>
  </div>
</header>
<style>
  body { margin:0; }
  #navToggle { display:none; }
  #siteNav, #siteNav *, #searchWrap, #searchWrap * { box-sizing:border-box; }
  #searchClear { display:none; position:absolute; top:50%; transform:translateY(-50%); right:10px; background:none; border:0; color:${C.muted}; font-size:0.9em; cursor:pointer; padding:4px 6px; line-height:1; }
  #searchClear:hover { color:${C.textOnDark}; }
  #navBtn .ic-close { display:none; }
  #navToggle:checked ~ #navBtn .ic-open { display:none; }
  #navToggle:checked ~ #navBtn .ic-close { display:block; }
  .nav-close { display:none; }
  #siteNav a { color:${C.textOnDark}; text-decoration:none; font-size:0.9em; }
  #siteNav a.nav-cta { color:#fff; background:${C.brand}; font-weight:bold; padding:7px 16px; border-radius:999px; font-size:0.85em; }
  #searchWrap { position:relative; }
  #siteSearch { box-sizing:border-box; max-width:100%; background:${C.darkSub}; border:1px solid #3F3F46; color:${C.textOnDark}; border-radius:999px; padding:7px 30px 7px 34px; font-size:0.85em; width:140px; outline:none; background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236B7280' stroke-width='2'><circle cx='7' cy='7' r='5'/><line x1='11' y1='11' x2='15' y2='15' stroke-linecap='round'/></svg>"); background-repeat:no-repeat; background-position:11px center; }
  #siteSearch::placeholder { color:${C.muted}; }
  #siteSearch:focus { border-color:${C.brand}; }
  #searchResults { display:none; position:absolute; top:42px; right:0; width:300px; max-height:320px; overflow-y:auto; background:#fff; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.25); z-index:200; text-align:left; }
  @media (min-width: 681px) {
    label[for="navToggle"] { display:none; }
    #siteNav { display:flex; align-items:center; gap:22px; }
    #siteSearch { width:210px; }
    .nav-close { display:none !important; }
    #siteNav a { position:relative; padding:6px 0; transition:color .15s; }
    #siteNav a:not(.nav-cta):hover { color:#fff; }
    #siteNav a:not(.nav-cta)::after { content:""; position:absolute; left:0; right:0; bottom:0; height:2px; background:${C.brand}; transform:scaleX(0); transition:transform .15s; }
    #siteNav a:not(.nav-cta):hover::after { transform:scaleX(1); }
    #siteNav a.nav-cta:hover { background:${C.brandDark}; }
  }
  @media (max-width: 680px) {
    label[for="navToggle"] { display:block; cursor:pointer; padding:4px; }
    #siteNav { display:none; order:3; width:100%; flex-direction:column; align-items:stretch; gap:0; margin:6px -16px -4px; padding:6px 16px 14px; border-top:1px solid ${C.darkSub}; }
    #navToggle:checked ~ #siteNav { display:flex; }
    #siteNav a { display:flex; align-items:center; justify-content:space-between; padding:15px 2px; border-bottom:1px solid ${C.darkSub}; font-size:0.95em; }
    #siteNav a::after { content:"›"; color:#52525B; font-size:1.2em; }
    #siteNav a.nav-cta { justify-content:center; margin-top:16px; padding:14px; border-radius:8px; border-bottom:none; font-size:0.95em; }
    #siteNav a.nav-cta::after { content:""; }
    #searchWrap { margin:8px 0 10px; width:100%; }
    #siteSearch { width:100%; font-size:16px; padding-top:11px; padding-bottom:11px; }
    .nav-close { display:block; text-align:center; color:${C.muted}; font-size:0.85em; padding:16px 0 4px; cursor:pointer; }
    #searchResults { width:100%; right:auto; left:0; top:50px; }
  }
  .ak-article h2, .ak-article h3 { scroll-margin-top: 84px; }
  #toTop { position:fixed; right:16px; bottom:20px; width:46px; height:46px; border-radius:50%; background:${C.dark}; border:1px solid #3F3F46; color:#fff; display:none; align-items:center; justify-content:center; cursor:pointer; z-index:90; box-shadow:0 6px 18px rgba(0,0,0,.3); padding:0; }
  #toTop:hover { background:${C.darkSub}; border-color:${C.brand}; }
  #toTop.show { display:flex; }
  @media (min-width: 681px) { #toTop { right:28px; bottom:28px; width:50px; height:50px; } }
</style>
<button id="toTop" type="button" aria-label="ページ上部へ戻る">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="6"/><polyline points="5,13 12,6 19,13"/></svg>
</button>
<script>
(function(){
  var input=document.getElementById('siteSearch');
  var box=document.getElementById('searchResults');
  if(!input||!box)return;
  var data=null,loading=false;
  function load(){
    if(data||loading)return;loading=true;
    fetch('/search-index.json').then(function(r){return r.json();}).then(function(j){data=j;loading=false;render();}).catch(function(){loading=false;});
  }
  function closeRow(){
    return '<button type="button" id="searchClose" style="display:block; width:100%; background:#FAFAFA; border:0; border-top:1px solid #E5E7EB; color:#6B7280; font-size:0.8em; padding:11px; cursor:pointer;">閉じる</button>';
  }
  function render(){
    var q=input.value.trim().toLowerCase();
    if(!q||!data){box.style.display='none';box.innerHTML='';return;}
    var hits=data.filter(function(a){
      return (a.t+' '+a.m+' '+a.c).toLowerCase().indexOf(q)>-1;
    }).slice(0,8);
    if(hits.length===0){
      box.innerHTML='<p style="margin:0; padding:16px; color:#6B7280; font-size:0.85em;">該当する記事がありません</p>'+closeRow();
    }else{
      box.innerHTML=hits.map(function(a){
        return '<a href="'+a.u+'" style="display:block; padding:12px 15px; border-bottom:1px solid #F3F4F6; text-decoration:none;">'+
        '<span style="display:block; font-size:0.7em; color:#C8102E; font-weight:bold; margin-bottom:3px;">'+a.c+'</span>'+
        '<span style="display:block; font-size:0.85em; color:#1A1A1A; line-height:1.45;">'+a.t+'</span></a>';
      }).join('')+closeRow();
    }
    box.style.display='block';
  }
  var clr=document.getElementById('searchClear');
  function close(){box.style.display='none';}
  function toggleClear(){if(clr)clr.style.display=input.value?'block':'none';}
  input.addEventListener('focus',load);
  input.addEventListener('input',function(){load();render();toggleClear();});
  input.addEventListener('keydown',function(e){if(e.key==='Escape'){input.value='';close();toggleClear();input.blur();}});
  if(clr)clr.addEventListener('click',function(){input.value='';close();toggleClear();input.focus();});
  box.addEventListener('click',function(e){
    if(e.target.id==='searchClose'){input.value='';close();toggleClear();}
  });
  document.addEventListener('click',function(e){
    if(!document.getElementById('searchWrap').contains(e.target)){close();}
  });
})();
(function(){
  var btn=document.getElementById('toTop');
  if(!btn)return;
  function upd(){ if(window.scrollY>400){btn.classList.add('show');}else{btn.classList.remove('show');} }
  window.addEventListener('scroll',upd,{passive:true});
  btn.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });
  upd();
})();
</script>`;
}

const HEAD_START = '<!-- AUTO:HEAD:START -->';
const HEAD_END = '<!-- AUTO:HEAD:END -->';

// level と category を GA4 に渡す。3ヶ月後の層別集計はこれを使います
function headTagsHtml(info) {
  const css = `<link rel="stylesheet" href="/assets/css/article.css">`;
  if (!GA4_ID) return css;
  const dims =
    info && info.level
      ? `\n  gtag('set', 'user_properties', {});\n  gtag('set', { article_level: '${info.level}', article_category: '${(info.category || '').replace(/'/g, '')}' });`
      : '';
  return `${css}
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());${dims}
  gtag('config', '${GA4_ID}');
</script>`;
}

function applyHeadTags(content) {
  const info = extractMeta(content);
  const inner = headTagsHtml(info);
  const block = `${HEAD_START}\n${inner}\n${HEAD_END}`;
  const regex = new RegExp(`${HEAD_START}[\\s\\S]*?${HEAD_END}`);
  if (regex.test(content)) return content.replace(regex, block);
  if (!content.includes('</head>')) return content;
  return content.replace('</head>', `${block}\n</head>`);
}

function announceHtml() {
  if (!ANNOUNCE.text) return '';
  return `<div style="background:${C.brandBg}; border-bottom:1px solid ${C.brandBorder};">
  <div style="max-width:860px; margin:0 auto; padding:9px 16px; font-size:0.86em; line-height:1.5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
    <span style="background:${C.brand}; color:#fff; font-weight:bold; font-size:0.85em; padding:2px 8px; border-radius:4px; margin-right:8px;">お知らせ</span><a href="${ANNOUNCE.url}" style="color:${C.ink}; text-decoration:underline;">${escapeHtml(ANNOUNCE.text)} →</a>
  </div>
</div>`;
}

// 開示ブロック。記事のメタに disclosure: affiliate / owned / both を書くと出し分けます
function disclosureHtml(article) {
  if (!article) return '';
  const kind = (article.disclosure || '').trim();
  const parts = [];
  if (kind === 'affiliate' || kind === 'both') parts.push(DISCLOSURE.affiliate);
  if (kind === 'owned' || kind === 'both') parts.push(DISCLOSURE.owned);
  if (parts.length === 0) return '';
  return `<div style="background:${C.bgSoft}; border:1px solid ${C.line}; border-radius:6px; padding:12px 14px; margin:0 0 24px; font-size:0.82em; line-height:1.75; color:${C.inkSub};">
${parts.map((p) => `  <p style="margin:0 0 4px;">${escapeHtml(p)}</p>`).join('\n')}
</div>`;
}

function articleSchemaHtml(article) {
  if (!article) return '';
  const img = thumbOf(article);
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta,
    datePublished: article.published,
    dateModified: article.updated || article.published,
    mainEntityOfPage: { '@type': 'WebPage', '@id': SITE_URL + article.permalink },
    author: { '@type': 'Organization', name: SITE.name },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}${SITE.logoColor}` },
    },
  };
  if (img) obj.image = SITE_URL + img;
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

/* ---------------- 記事上部の見出しブロック ---------------- */

function headlineHtml(title) {
  const t = (title || '').replace(new RegExp(`\\s*[|｜]\\s*${SITE.name}.*$`), '');
  const parts = t.split(/[|｜]/);
  return parts.map((s) => escapeHtml(s.trim())).join('<br>');
}

function formatJpDate(d) {
  if (!d) return '';
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}

function articleHeadHtml(article) {
  if (!article) return '';
  const pub = formatJpDate(article.published);
  const upd = formatJpDate(article.updated);
  const ver = formatJpDate(article.verified);
  let meta = `<span>公開：${pub}</span>`;
  if (upd && upd !== pub) meta += `<span>更新：${upd}</span>`;
  if (ver) meta += `<span>料金・仕様の確認：${ver}</span>`;
  return `<div class="article-header" data-level="${escapeHtml(article.level || '')}">
  <div class="article-category">${escapeHtml(article.category)}${levelBadge(article.level)}</div>
  <h1>${headlineHtml(article.title)}</h1>
  <div class="article-meta">${meta}</div>
</div>
${disclosureHtml(article)}`;
}

/* ---------------- 記事下のブロック ---------------- */

function thumbBoxHtml(article) {
  const img = thumbOf(article);
  if (img) {
    return `<div style="aspect-ratio:1200/630; background:${C.dark} url('${img}') center/cover no-repeat; border-radius:6px;"></div>`;
  }
  return `<div style="aspect-ratio:1200/630; background:${C.dark}; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; border-bottom:3px solid ${C.brand};"><span style="color:${C.brand}; font-size:0.7em; font-weight:bold; letter-spacing:.1em;">${escapeHtml(article.category)}</span><span style="color:${C.muted}; font-size:0.6em; letter-spacing:.14em;">AKAIUMA</span></div>`;
}

function shortTitle(title) {
  const t = (title || '').replace(new RegExp(`\\s*[|｜]\\s*${SITE.name}.*$`), '');
  const sep = t.search(/[|｜]/);
  return sep > 0 && sep <= 24 ? t.slice(0, sep).trim() : t;
}

function thumbCardHtml(article) {
  return `<a href="${article.permalink}" style="display:block; text-decoration:none; background:#fff; border:1px solid ${C.line}; border-radius:8px; overflow:hidden;">
  ${thumbBoxHtml(article)}
  <div style="padding:11px 13px;">
    <span style="display:block; font-size:0.72em; color:${C.brand}; font-weight:bold; margin-bottom:4px;">${escapeHtml(article.category)}</span>
    <span style="display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; font-size:0.86em; color:${C.ink}; font-weight:bold; line-height:1.55;">${escapeHtml(shortTitle(article.title))}</span>
  </div>
</a>`;
}

function gridHtml(list) {
  return `<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:12px;">
${list.map(thumbCardHtml).join('\n')}
</div>`;
}

function sectionTitle(text) {
  return `<h2 style="font-size:1.05em; color:${C.ink}; font-weight:700; letter-spacing:.02em; margin:0 0 16px; padding:0 0 8px; border-bottom:2px solid ${C.line}; position:relative;"><span style="border-bottom:2px solid ${C.brand}; padding-bottom:8px;">${text}</span></h2>`;
}

function ctaHtml() {
  const prev =
    CTA.previews && CTA.previews.length
      ? `<div style="display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x mandatory; padding:2px 0 14px; -webkit-overflow-scrolling:touch;">
${CTA.previews
  .map(
    (p) => `<figure style="flex:0 0 128px; margin:0; scroll-snap-align:start;">
  <img src="${p.src}" alt="${escapeHtml(p.label)}" loading="lazy" style="width:100%; height:auto; display:block; border:1px solid ${C.line}; border-radius:5px; box-shadow:0 4px 12px rgba(0,0,0,.12);">
  <figcaption style="margin:6px 0 0; font-size:0.68em; color:${C.muted}; text-align:center; line-height:1.4;">${escapeHtml(p.label)}</figcaption>
</figure>`
  )
  .join('\n')}
</div>
<p style="margin:0 0 18px; color:${C.muted}; font-size:0.72em;">← 中身を少しだけ公開しています</p>`
      : '';
  return `<div style="background:${C.brandBg}; border:1px solid ${C.brandBorder}; border-radius:12px; padding:28px 22px; margin:0 0 44px;">
  <img src="${SITE.logoColor}" alt="${SITE.name}" style="height:38px; width:auto; display:block; margin:0 0 16px;">
  <p style="margin:0 0 10px; color:${C.ink}; font-weight:bold; font-size:1.1em; line-height:1.55;">${escapeHtml(CTA.heading)}</p>
  <p style="margin:0 0 16px; color:${C.inkSub}; font-size:0.89em; line-height:1.8;">${escapeHtml(CTA.body)}</p>
${prev}
  <a href="${CTA.url}" style="display:block; background:${C.brand}; color:#fff; text-decoration:none; font-weight:bold; padding:15px; border-radius:8px; font-size:0.98em; text-align:center;">${escapeHtml(CTA.button)}</a>
  <p style="margin:16px 0 0; padding:14px 0 0; border-top:1px solid ${C.brandBorder}; color:${C.muted}; font-size:0.76em; line-height:1.75;">${escapeHtml(CTA.publisher)}</p>
</div>`;
}

function relatedHtml(articles, current) {
  if (!current) return '';
  let list = articles.filter((a) => a.permalink !== current.permalink && a.category === current.category).slice(0, 4);
  if (list.length < 4) {
    const extra = articles.filter(
      (a) => a.permalink !== current.permalink && !list.some((x) => x.permalink === a.permalink)
    );
    list = list.concat(extra.slice(0, 4 - list.length));
  }
  if (list.length === 0) return '';
  return `<section style="margin:0 0 40px;">
${sectionTitle('関連記事')}
${gridHtml(list)}
</section>`;
}

// 初心者記事には、同カテゴリの中級記事への導線を必ず出す
function stepUpHtml(articles, current) {
  if (!current || current.level !== 'beginner') return '';
  let list = articles.filter(
    (a) => a.level === 'intermediate' && a.category === current.category && a.permalink !== current.permalink
  );
  if (list.length === 0) {
    list = articles.filter((a) => a.level === 'intermediate' && a.permalink !== current.permalink);
  }
  if (list.length === 0) return '';
  const items = list
    .slice(0, 3)
    .map(
      (a) =>
        `<li style="margin:0 0 10px;"><a href="${a.permalink}" style="color:${C.brandDark}; font-weight:bold; text-decoration:none; font-size:0.93em; line-height:1.6;">${escapeHtml(shortTitle(a.title))}</a></li>`
    )
    .join('\n');
  return `<section style="margin:0 0 40px; background:#fff; border:1px solid ${C.line}; border-left:4px solid ${C.brand}; border-radius:0; padding:20px 22px;">
  <p style="margin:0 0 4px; color:${C.ink}; font-weight:bold; font-size:0.98em;">次に読むと、もう一段先に進めます</p>
  <p style="margin:0 0 14px; color:${C.muted}; font-size:0.83em; line-height:1.7;">基本ができたあと、実際に詰まりやすいところを扱っています。</p>
  <ul style="margin:0; padding:0 0 0 18px;">
${items}
  </ul>
</section>`;
}

function tagsHtml(articles) {
  const items = CATEGORY_ORDER.map((id) => {
    const name = Object.keys(CATEGORY_TO_ID).find((k) => CATEGORY_TO_ID[k] === id);
    const count = articles.filter((a) => a.category === name).length;
    return `<a href="/${SITE.articlesDir}/#${id}" style="display:inline-block; background:#F3F4F6; color:${C.ink}; text-decoration:none; font-size:0.85em; padding:7px 15px; border-radius:999px; margin:0 8px 8px 0;">${escapeHtml(name)} <span style="color:${C.muted};">${count}</span></a>`;
  }).join('\n');
  return `<section style="margin:0 0 40px;">
${sectionTitle('カテゴリから探す')}
<div>
${items}
</div>
</section>`;
}

function latestHtml(articles, current) {
  const list = articles.filter((a) => !current || a.permalink !== current.permalink).slice(0, 4);
  if (list.length === 0) return '';
  return `<section style="margin:0 0 40px;">
${sectionTitle('最新記事')}
${gridHtml(list)}
<p style="margin:18px 0 0;"><a href="/${SITE.articlesDir}/" style="color:${C.brand}; font-weight:bold; text-decoration:none; font-size:0.92em;">記事一覧をすべて見る →</a></p>
</section>`;
}

function footerHtml(articles) {
  const A = SITE.articlesDir;
  const cats = CATEGORY_ORDER.map((id) => {
    const name = Object.keys(CATEGORY_TO_ID).find((k) => CATEGORY_TO_ID[k] === id);
    return `<a href="/${A}/#${id}" style="color:${C.muted}; text-decoration:none; font-size:0.86em; display:block; padding:5px 0;">${escapeHtml(name)}</a>`;
  }).join('\n');
  const sns = [['X', 'https://x.com/']]
    .map(
      ([n, u]) =>
        `<a href="${u}" style="color:${C.textOnDark}; text-decoration:none; font-size:0.8em; border:1px solid #3F3F46; border-radius:999px; padding:6px 16px;">${n}</a>`
    )
    .join('\n');
  return `<footer style="background:${C.dark}; color:${C.muted};">
  <div style="max-width:860px; margin:0 auto; padding:36px 16px 28px;">

    <div style="display:flex; flex-wrap:wrap; gap:28px 40px; margin:0 0 28px;">
      <div style="flex:1 1 200px; min-width:0;">
        <img src="${SITE.logoWhite}" alt="${SITE.name}" style="height:30px; width:auto; display:block; margin:0 0 12px;">
        <p style="margin:0; font-size:0.84em; line-height:1.85; color:${C.muted};">${escapeHtml(SITE.description)}</p>
      </div>
      <div style="flex:0 1 130px;">
        <p style="margin:0 0 8px; color:#fff; font-size:0.8em; font-weight:bold; letter-spacing:.06em;">カテゴリ</p>
${cats}
      </div>
      <div style="flex:0 1 130px;">
        <p style="margin:0 0 8px; color:#fff; font-size:0.8em; font-weight:bold; letter-spacing:.06em;">サイト情報</p>
        <a href="/" style="color:${C.muted}; text-decoration:none; font-size:0.86em; display:block; padding:5px 0;">ホーム</a>
        <a href="/${A}/" style="color:${C.muted}; text-decoration:none; font-size:0.86em; display:block; padding:5px 0;">記事一覧</a>
        <a href="/about/" style="color:${C.muted}; text-decoration:none; font-size:0.86em; display:block; padding:5px 0;">このサイトについて</a>
        <a href="/tool/" style="color:${C.muted}; text-decoration:none; font-size:0.86em; display:block; padding:5px 0;">ツール</a>
      </div>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:10px; margin:0 0 26px;">
${sns}
    </div>

    <div style="border-top:1px solid ${C.darkSub}; padding-top:20px;">
      <p style="margin:0 0 10px; color:${C.muted}; font-size:0.78em; line-height:1.85;">本サイトの記事は情報提供を目的としたものです。掲載内容は執筆時点の公表資料にもとづきます。記載の手数料・料金・仕様は変更されることがあるため、実際の判断は各社の公式情報をご確認のうえ、ご自身の責任で行ってください。収益を保証するものではありません。</p>
      <p style="margin:0; color:#52525B; font-size:0.78em;">&copy; ${new Date().getFullYear()} ${SITE.name}</p>
    </div>

  </div>
</footer>`;
}

function belowHtml(articles, current) {
  return `<div style="background:${C.bgSoft}; border-top:1px solid ${C.line};"><div style="max-width:860px; margin:0 auto; padding:36px 16px 24px;">
${stepUpHtml(articles, current)}
${ctaHtml()}
${relatedHtml(articles, current)}
${tagsHtml(articles)}
${latestHtml(articles, current)}
</div></div>
${footerHtml(articles)}`;
}

function adHtml() {
  return `<div style="border:1px solid ${C.line}; border-radius:8px; padding:18px; margin:28px 0; background:${C.bgSoft};">
  <span style="display:inline-block; font-size:0.7em; color:${C.muted}; border:1px solid #D1D5DB; border-radius:3px; padding:1px 6px; margin-bottom:10px;">${AD_SLOT.label}</span>
  ${AD_SLOT.html}
</div>`;
}

/* ---------------- スライダー（トップページ） ---------------- */

function sliderHtml(articles) {
  const picked = FEATURED_SLUGS.map((s) => articles.find((a) => slugOf(a.permalink) === s)).filter(Boolean);
  const list = picked.length > 0 ? picked : articles.slice(0, 5);
  if (list.length === 0) return '';
  const slides = list
    .map(
      (a) => `<div style="flex:0 0 260px; scroll-snap-align:start;">
${thumbCardHtml(a)}
</div>`
    )
    .join('\n');
  return `<div style="display:flex; gap:16px; overflow-x:auto; scroll-snap-type:x mandatory; padding:4px 0 16px; -webkit-overflow-scrolling:touch;">
${slides}
</div>
<p style="margin:0; color:${C.muted}; font-size:0.8em;">← 横にスクロールできます</p>`;
}

/* ---------------- 共通ブロックの一括反映 ---------------- */

function collectHtmlFiles(dir, acc) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.name.startsWith('.') || d.name === 'node_modules' || d.name === 'assets') continue;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) collectHtmlFiles(p, acc);
    else if (d.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

/* ===== 記事本文中への自動挿入（目次・広告枠） ===== */

function getBodyRange(html) {
  const artRe = /<(article|div|section)\b[^>]*class=["'][^"']*\bak-article\b[^"']*["'][^>]*>/i;
  const m = html.match(artRe);
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  const scan = new RegExp(`<${m[1]}\\b[^>]*>|</${m[1]}\\s*>`, 'gi');
  scan.lastIndex = start;
  let s;
  while ((s = scan.exec(html)) !== null) {
    if (s[0][1] === '/') { depth--; if (depth === 0) return { start, end: s.index }; }
    else depth++;
  }
  return { start, end: html.length };
}

function autoRanges(html) {
  const ranges = [];
  const re = /<!--\s*AUTO:([A-Za-z0-9_]+):START\s*-->/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const endRe = new RegExp('<!--\\s*AUTO:' + m[1] + ':END\\s*-->', 'i');
    const em = html.slice(m.index).match(endRe);
    ranges.push({ start: m.index, end: m.index + (em ? em.index + em[0].length : 0) });
  }
  return ranges;
}

function insideAuto(ranges, i) {
  return ranges.some((r) => i >= r.start && i < r.end);
}

function stripAutoBlock(html, name) {
  const re = new RegExp(
    `\\n?[ \\t]*<!--\\s*AUTO:${name}:START\\s*-->[\\s\\S]*?<!--\\s*AUTO:${name}:END\\s*-->[ \\t]*`,
    'gi'
  );
  return html.replace(re, '');
}

function findH2s(html) {
  const range = getBodyRange(html);
  if (!range) return [];
  const auto = autoRanges(html);
  const re = /<h2\b([^>]*)>([\s\S]*?)<\/h2\s*>/gi;
  re.lastIndex = range.start;
  const list = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m.index >= range.end) break;
    if (insideAuto(auto, m.index)) continue;
    const attrs = m[1] || '';
    const idM = attrs.match(/\bid=["']([^"']+)["']/i);
    list.push({
      start: m.index,
      end: m.index + m[0].length,
      attrs,
      id: idM ? idM[1] : null,
      text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      inner: m[2],
    });
  }
  return list;
}

function tocBlockHtml(items) {
  const li = items
    .map((it) => `    <li><a href="#${it.id}">${escapeHtml(it.text)}</a></li>`)
    .join('\n');
  return `<!-- AUTO:TOC:START -->
<nav class="ak-toc" aria-label="目次">
  <p class="ak-toc-title">目次</p>
  <ol>
${li}
  </ol>
</nav>
<!-- AUTO:TOC:END -->`;
}

function adBlockHtml() {
  return `<!-- AUTO:AD:START -->
<div class="ak-ad">
  <span class="ak-ad-label">${escapeHtml(AD_SLOT.label)}</span>
${AD_SLOT.html}
</div>
<!-- AUTO:AD:END -->`;
}

function applyInArticleBlocks(html, file) {
  let out = stripAutoBlock(stripAutoBlock(html, 'TOC'), 'AD');
  let h2s = findH2s(out);
  if (h2s.length === 0) return out;
  const noAd = NO_AD_PATH.test(file || '');

  if (h2s.length >= TOC_MIN_H2) {
    for (let i = h2s.length - 1; i >= 0; i--) {
      const h = h2s[i];
      if (h.id) continue;
      const newTag = `<h2${h.attrs} id="h2-${i + 1}">${h.inner}</h2>`;
      out = out.slice(0, h.start) + newTag + out.slice(h.end);
    }
  }

  const items = findH2s(out);
  if (!noAd && items.length >= AD_MIN_H2 && AD_SLOT && AD_SLOT.html) {
    const target = items[AD_BEFORE_NTH_H2 - 1];
    if (target) {
      out = out.slice(0, target.start) + adBlockHtml() + '\n' + out.slice(target.start);
    }
  }

  const items2 = findH2s(out);
  if (items2.length >= TOC_MIN_H2) {
    const withId = items2.filter((i) => i.id);
    if (withId.length >= TOC_MIN_H2) {
      out = out.slice(0, items2[0].start) + tocBlockHtml(withId) + '\n' + out.slice(items2[0].start);
    }
  }

  return out;
}

function applyCommonBlocks(articles) {
  const files = collectHtmlFiles(ROOT, []);
  let count = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const before = content;
    content = applyHeadTags(content);
    if (
      !hasMarker(content, 'HEADER') &&
      !hasMarker(content, 'BELOW') &&
      !hasMarker(content, 'AD') &&
      !hasMarker(content, 'ARTICLEHEAD')
    ) {
      if (content !== before) fs.writeFileSync(file, content);
      continue;
    }

    const info = extractMeta(content);
    const current = info && info.permalink ? articles.find((a) => a.permalink === info.permalink) : null;
    if (current && info) current.disclosure = info.disclosure || current.disclosure;

    content = applyInArticleBlocks(content, file);

    if (hasMarker(content, 'ANNOUNCE')) {
      content = replaceBetweenMarkers(content, 'ANNOUNCE', announceHtml(), true);
    }
    if (hasMarker(content, 'HEADER')) {
      const isTop = /(^|\/)index\.html$/.test(file) && !new RegExp(`${SITE.articlesDir}|about|tool|lp\\/`).test(file);
      const parts = isTop
        ? [headerHtml(), articleSchemaHtml(current)]
        : [headerHtml(), announceHtml(), articleSchemaHtml(current)];
      content = replaceBetweenMarkers(content, 'HEADER', parts.filter(Boolean).join('\n'), true);
    }
    if (hasMarker(content, 'BELOW')) {
      content = replaceBetweenMarkers(content, 'BELOW', belowHtml(articles, current), true);
    }
    if (hasMarker(content, 'AD')) {
      content = replaceBetweenMarkers(content, 'AD', adHtml(), true);
    }
    if (hasMarker(content, 'ARTICLEHEAD')) {
      content = replaceBetweenMarkers(content, 'ARTICLEHEAD', articleHeadHtml(current), true);
    }
    fs.writeFileSync(file, content);
    count++;
  }
  console.log(`共通ブロック反映: ${count}ファイル`);
}

/* ---------------- 一覧・サイトマップ ---------------- */

function updateArticlesIndex(articles) {
  if (!fs.existsSync(ARTICLES_INDEX)) return;
  let content = fs.readFileSync(ARTICLES_INDEX, 'utf-8');
  for (const catId of CATEGORY_ORDER) {
    const catArticles = articles.filter((a) => CATEGORY_TO_ID[a.category] === catId);
    content = replaceBetweenMarkers(content, catId, categoryBlockHtml(catArticles));
    const countRegex = new RegExp(`(<span id="count-${catId}">)[^<]*(</span>)`);
    content = content.replace(countRegex, `$1${catArticles.length}$2`);
  }
  fs.writeFileSync(ARTICLES_INDEX, content);
}

function updateTopPage(articles) {
  if (!fs.existsSync(TOP_INDEX)) return;
  let content = fs.readFileSync(TOP_INDEX, 'utf-8');
  const latest = articles.slice(0, 5);
  content = replaceBetweenMarkers(content, 'latest', latest.map(cardHtml).join('\n\n'));
  if (hasMarker(content, 'SLIDER')) {
    content = replaceBetweenMarkers(content, 'SLIDER', sliderHtml(articles), true);
  }
  fs.writeFileSync(TOP_INDEX, content);
}

function updateSearchIndex(articles) {
  const data = articles.map((a) => ({
    t: a.title,
    m: a.meta,
    c: a.category,
    l: a.level || '',
    u: a.permalink,
  }));
  fs.writeFileSync(SEARCH_INDEX, JSON.stringify(data));
  console.log(`検索インデックス生成: ${data.length}件`);
}

function updateSitemap(articles) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  urls.push({ loc: `${SITE_URL}/`, lastmod: today });
  urls.push({ loc: `${SITE_URL}/about/`, lastmod: today });
  urls.push({ loc: `${SITE_URL}/${SITE.articlesDir}/`, lastmod: today });
  for (const a of articles) {
    urls.push({ loc: `${SITE_URL}${a.permalink}`, lastmod: a.updated || a.published || today });
  }
  const body = urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(SITEMAP, xml);
}

// level 別の本数を出す。3ヶ月後の方針判断はここを見ます
function reportLevels(articles) {
  const beg = articles.filter((a) => a.level === 'beginner').length;
  const int = articles.filter((a) => a.level === 'intermediate').length;
  const none = articles.length - beg - int;
  console.log(`level内訳: 初心者${beg}件 / 中級${int}件${none ? ` / 未設定${none}件` : ''}`);
}

function main() {
  const articles = loadArticles();
  updateArticlesIndex(articles);
  updateTopPage(articles);
  updateSearchIndex(articles);
  applyCommonBlocks(articles);
  updateSitemap(articles);
  reportLevels(articles);
  console.log(`サイト生成完了:記事${articles.length}件を反映しました`);
}

main();
