# 🤖 AI駆動タスク管理システム

Gmail、Googleカレンダーからタスクを自動抽出してNotionに登録するAI駆動のタスク管理システムです。

## ⚡ 5分でセットアップ

### 🚀 ワンクリックセットアップ（推奨）

1. **[OneClickSetup.gs](OneClickSetup.gs)** をコピー
2. 新しい[Google Apps Script](https://script.google.com/)プロジェクトに貼り付け
3. `startOneClickSetup()` を実行
4. 設定ウィザードに従って入力
5. 完了！

### 📺 デモ動画
*（準備中）*

## 🎯 主な機能

- **📧 Gmail自動分析**: 重要なメールからタスクを自動抽出
- **📅 カレンダー連携**: 予定から関連タスクを生成
- **🤖 AI重複除去**: Gemini APIで意味的重複を判定
- **📝 Notion自動登録**: 抽出されたタスクを自動でNotionに登録
- **⏰ 自動実行**: 毎日定時に自動でタスク抽出
- **🔍 高度なフィルタリング**: スパム除外、優先度判定

## 📋 必要なもの

- [Google Apps Script](https://script.google.com/) アカウント
- [Notion](https://notion.so/) アカウント + APIトークン
- [Gemini API](https://makersuite.google.com/) キー

## 🛠 詳細セットアップ

### 1. API設定

#### Notion API
1. [Notion Developers](https://developers.notion.com/) でインテグレーション作成
2. APIトークンをコピー
3. データベースを作成してIDをコピー

#### Gemini API
1. [Google AI Studio](https://makersuite.google.com/) でAPIキー取得

### 2. Notionデータベース設定

以下のプロパティを持つデータベースを作成：

| プロパティ名 | タイプ | 選択肢 |
|-------------|--------|--------|
| `title` | タイトル | - |
| `type` | セレクト | task, summary |
| `priority` | セレクト | 高, 中, 低 |
| `due_date` | 日付 | - |
| `source` | セレクト | calendar, gmail, auto |
| `status` | セレクト | 未着手, 進行中, 完了 |
| `created_by` | セレクト | auto, manual |

### 3. 動作確認

```javascript
// 手動でタスク抽出
runBoth();

// カレンダーのみ
runCalendarOnly();

// Gmailのみ
runGmailOnly();
```

## 🔧 高度な設定

### メールフィルタ設定
```javascript
// メールフィルタ設定を開く
openEmailFilterSettings();

// 現在の設定を確認
showCurrentEmailFilterSettings();
```

### 自動実行設定
```javascript
// 毎日8時に自動実行
setupAutoTriggers();

// トリガー状況確認
checkTriggerDetails();
```

## 🆘 トラブルシューティング

### よくある問題

#### メールが重複して処理される
```javascript
// 緊急修正を実行
emergencyFixDuplicateExecution();
```

#### 設定がうまくいかない
```javascript
// 手動セットアップ
manualSetup();

// 問題診断
diagnoseIssues();
```

#### 完全リセットしたい
```javascript
// 全設定をリセット
resetAllSettings();
```

## 📚 ドキュメント

- [セットアップガイド](SETUP_GUIDE.md) - 詳細なセットアップ手順
- [配布ガイド](DISTRIBUTION_GUIDE.md) - 配布方法の詳細
- [トラブルシューティング](TROUBLESHOOTING.md) - よくある問題と解決方法

## 🎯 使用例

### 日常的な使用
```javascript
// 朝の定期実行（自動）
// 8:00 AM に自動でカレンダーとGmailを分析

// 手動実行
runBoth(); // カレンダー + Gmail
```

### 設定カスタマイズ
```javascript
// ビジネス向けフィルタ適用
applyEmailFilterTemplate('business');

// 個人向けフィルタ適用
applyEmailFilterTemplate('personal');
```

## 🔄 更新履歴

### v1.0.0 (2024-07-30)
- ✅ メール重複実行問題の修正
- ✅ ワンクリックセットアップの実装
- ✅ 処理済みメール管理の強化
- ✅ 緊急対応スクリプトの追加

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

## 📄 ライセンス

MIT License

## 🙏 謝辞

- Google Apps Script
- Notion API
- Gemini API

---

**🎯 AIがあなたのタスク管理を自動化します！**