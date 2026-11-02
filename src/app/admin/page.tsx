import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20">
      <p className="text-[10px] tracking-[0.3em] text-neutral-600">MANAGEMENT</p>
      <h1 className="mt-3 text-4xl font-light">Admin</h1>
      <p className="mt-6 text-sm leading-7 text-neutral-400">管理画面は現在準備中です。公開リポジトリへの書き込み権限を安全に扱うため、GitHub OAuthまたは管理者認証とサーバー側APIを設定した後に有効化します。</p>
      <div className="mt-8 border border-line p-5">
        <p className="text-xs tracking-widest text-neutral-500">CURRENT WORKFLOW</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-neutral-400">
          <li>GitHub上でJSONを直接編集する</li>
          <li>変更をmainブランチへ反映する</li>
          <li>Vercelが自動でサイトを再デプロイする</li>
        </ol>
      </div>
      <Link href="https://github.com/mapleorzzz/PCC-Chart-Collection/tree/main/src/data" target="_blank" className="mt-6 inline-flex border border-neutral-700 px-4 py-3 text-xs text-white hover:border-white">OPEN DATA FILES ↗</Link>
    </div>
  );
}