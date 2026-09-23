# あかいうま（akaiuma.com）

物販の売上アップと業務効率化のメディア。このリポジトリの中身が、そのまま GitHub Pages で akaiuma.com として公開されている。

**GitHub の右側の列（Last commit message）は、ファイルの説明ではない。**
そのファイルを最後に変更したときのコミットのメッセージが出ているだけ。
同じコミットで複数のファイルを変更すると、同じ文が何行も並ぶ。

---

## まず見るところ

| 知りたいこと | 見るファイル |
|---|---|
| 今日の問い（1日1問） | `knowledge/今日の質問.md` |
| これまでに答えた実体験 | `knowledge/体験バンク.md` |
| 次に書く記事 | `knowledge/記事の企画リスト.md` |
| エージェントに守らせているルール | `CLAUDE.md` |

---

## フォルダの中身

### サイトとして公開されるもの（生成スクリプトが作る。手で直さない）

| 場所 | 中身 |
|---|---|
| `index.html` | トップページ |
| `blog/` | 記事。1記事＝1フォルダ（`blog/<slug>/index.html`）。`_template/` はひな形 |
| `about/` | このサイトについて |
| `tag/` | タグページ。同じタグの記事が3本たまると自動で生まれる |
| `assets/` | CSS・ロゴ・図解（`figure/`）・サムネイル（`thumb/`） |
| `sitemap.xml` `search-index.json` `robots.txt` | 検索エンジン用・サイト内検索用 |
| `favicon*` `apple-touch-icon.png` `og-default.png` | アイコンとSNS共有画像 |
| `CNAME` | 独自ドメインの設定（akaiuma.com） |

### 運営者とエージェントのためのもの

| 場所 | 中身 |
|---|---|
| `CLAUDE.md` | ルールの正本。ほかの文書と食い違ったらこれが正しい |
| `knowledge/` | 運営者の一次情報。体験バンク・質問キュー・企画リスト・inbox（iOSショートカットの投稿先） |
| `research/` | エージェントが調べた公式情報と出典のメモ |
| `keywords/` | 記事ごとのキーワード設計 |
| `.claude/agents/` | 担当エージェント6体の定義（リサーチ・執筆・エディター・SEO・校正・SNS） |
| `.claude/workflows/` | Routine（自動実行）の手順書。週次の記事生産と日次の質問 |
| `.github/spec/` | 仕様書。2026-09-11 時点の内容で、その後の変更は `CLAUDE.md` のほうが新しい |
| `.github/handoff/` | 引き継ぎ資料。いまの版が直下、古い版は `archive/` |
| `.github/scripts/` | サイト生成スクリプト `generate-site.js` |
| `.github/workflows/` | main に push したとき、生成スクリプトを自動で走らせる設定 |

---

## ブランチ

公開されるのは `main` だけ。`claude/…` で始まるブランチは、エージェントが作業中に作るもの。
下書き記事は `claude/draft-<slug>` に置かれ、運営者が確認してから main に入る。
