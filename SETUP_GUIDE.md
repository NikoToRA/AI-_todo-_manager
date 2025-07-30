# 🤖 AI駆動タスク管理システム - セットアップガイド

## 📋 概要
Gmail、Googleカレンダーからタスクを自動抽出してNotionに登録するAIシステムです。

## 🚀 クイックセットアップ（15分で完了）

### ステップ1: Google Apps Scriptプロジェクト作成
1. [Google Apps Script](https://script.google.com/) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「AI Task Manager」に変更

### ステップ2: ファイルのコピー
以下のファイルを順番にコピー＆ペーストしてください：

#### 必須ファイル（9個）
1. `Config.gs` - 設定管理
2. `TriggerSetup.gs` - トリガー管理
3. `Code.gs` - メイン処理
4. `EmailFilter.gs` - メールフィルタ
5. `GeminiAnalyzer.gs` - AI分析
6. `NotionClient.gs` - Notion連携
7. `ProcessedEmailTracker.gs` - 処理済み管理
8. `WebApp.html` - Web UI
9. `emergency_fix.gs` - セットアップ支援

### ステップ3: 自動セットアップ実行
```javascript
// GASエディタで以下を実行
quickSetup();
```

### ステップ4: API設定
1. **Notion API**
   - [Notion Developers](https://developers.notion.com/) でインテグレーション作成
   - APIトークンをコピー
   - データベースを作成してIDをコピー

2. **Gemini API**
   - [Google AI Studio](https://makersuite.google.com/) でAPIキー取得

### ステップ5: 設定入力
```javascript
// 設定を入力
configureAPIs();
```

### ステップ6: 動作確認
```javascript
// 動作確認
testAllSystems();
```

## 🔧 詳細設定

### Gmail API有効化
1. GASエディタ → 「サービス」 → Gmail API を追加
2. Calendar API も同様に追加

### Notion データベース設定
必要なプロパティ：
- `title` (タイトル)
- `type` (セレクト): task, summary
- `priority` (セレクト): 高, 中, 低
- `due_date` (日付)
- `source` (セレクト): calendar, gmail, auto
- `status` (セレクト): 未着手, 進行中, 完了
- `created_by` (セレクト): auto, manual

### 自動実行設定
```javascript
// 毎日8時に自動実行
setupAutoTriggers();
```

## 🆘 トラブルシューティング

### よくある問題
1. **権限エラー** → `authorizeAPIs()` を実行
2. **Notion接続エラー** → データベースIDとトークンを確認
3. **重複実行** → `emergencyFixDuplicateExecution()` を実行

### サポート関数
```javascript
// 問題診断
diagnoseIssues();

// 完全リセット
resetAllSettings();

// ヘルプ表示
showHelp();
```

## 📞 サポート
- GitHub Issues: [リンク]
- 設定ガイド: [リンク]
- FAQ: [リンク]

---
**🎯 15分で完了！AIがあなたのタスク管理を自動化します**