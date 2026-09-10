# あかいうま ロゴ一式

ブランドカラー：`#C8102E`

## ファイル

| ファイル | 用途 |
|---|---|
| `logo.svg` | サイトヘッダー用の横組みロックアップ |
| `logo-mark.svg` | マーク単体（赤） |
| `logo-mono.svg` | `currentColor` 対応。CSSの `color` で色が変わる |
| `favicon.svg` | ファビコン |
| `favicon-32.png` | 旧ブラウザ用フォールバック |
| `apple-touch-icon.png` | 180×180。iOSのホーム画面用 |
| `og-default.png` | 1200×630。記事タイトルを乗せるベース |

## HTMLへの設置

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="https://akaiuma.com/og-default.png">
```

## ヘッダーのロックアップ（推奨：文字はCSS側で扱う）

`logo.svg` はフォントを埋め込んでいないため、環境によって字形が変わります。
ヘッダーではマークとテキストを分け、フォントをCSSで指定するほうが安全です。

```html
<a class="brand" href="/">
  <img src="/logo-mark.svg" alt="" width="44" height="44">
  <span class="brand-text">
    <strong>あかいうま</strong>
    <small>物販の売上アップと業務効率化</small>
  </span>
</a>
```

```css
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap');

.brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.brand-text { display: flex; flex-direction: column; line-height: 1.2;
  font-family: 'Zen Maru Gothic', sans-serif; }
.brand-text strong { font-size: 24px; font-weight: 700; color: #1A1A1A; letter-spacing: .04em; }
.brand-text small { font-size: 11px; font-weight: 500; color: #3A3A3A; }
```

## 使用ルール

- 余白はマークの高さの25%以上を四辺に確保する
- ロゴに `akaiuma.com` を含めない（小サイズで読めず、変更時に作り直しになる）
- 赤を変えない。モノクロが必要な場合は `logo-mono.svg` を使う
- マークを縦横比を変えて伸縮させない
- マスコット（疾走している馬）はSNSアイコン・サムネイル専用。サイトのロゴとして使わない
