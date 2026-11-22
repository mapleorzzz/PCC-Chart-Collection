# PCC private scheduled-post storage

予約投稿・下書きのメタデータは、公開リポジトリ内の専用GitHub Draft Releaseに保存します。Draft Releaseは公開されるまで一般ユーザーから見えず、GitHub Appの認証を通したサーバー処理だけが読み書きします。

## 保存先

- 公開済み譜面データ: `src/data/charts.json`
- .pezファイル: 譜面ごとのGitHub Draft Release
- 予約投稿・下書きメタデータ: `pcc-private-scheduled-data` タグの専用Draft Release本文

専用Draft Releaseは絶対に手動で公開・削除しないでください。公開すると予約・下書き情報が一般公開される可能性があります。

## 初回移行

初回アクセス時に専用Draft Releaseが存在しない場合、アプリは既存のSupabaseテーブル `pcc_private_data` から予約・下書き情報を一度だけ読み込み、専用Draft Releaseを作成します。既存データを移行するため、最初の管理画面表示が成功するまではVercelの `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を削除しないでください。

管理画面を開いて予約・下書き一覧が正常に表示され、GitHub Releasesに `PCC Private Scheduled Data` というDraft Releaseが作成されたことを確認したら、Vercelの `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を削除して構いません。その後、再デプロイしてください。

以後の予約・下書きの読み書きにはSupabaseを一切使用しません。
