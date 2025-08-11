# AI駆動タスク管理システム - デプロイガイド

## 🚀 必要なファイル一覧

Google Apps Scriptプロジェクトに以下のファイルをアップロードしてください：

### 🔧 コアファイル（必須）
1. **CodeDeploy.gs** - メインエントリーポイント
2. **config.gs** - 設定管理（ES5互換版）
3. **NotionClient.gs** - Notion API統合
4. **TaskExtractorES5.gs** - タスク抽出エンジン
5. **DuplicateCheckerES5.gs** - 重複チェック機能
6. **ProcessedTrackerES5.gs** - 処理済み追跡（日付別管理）
7. **Utils.gs** - ユーティリティ関数
8. **BasicTests.gs** - 基本テスト関数

### 🧪 テスト・サポートファイル（オプション）
- **EmailFilter.gs** - メールフィルタリング
- **GeminiAnalyzer.gs** - Gemini AI統合
- **ProcessedTracker.gs** - 処理済み管理

### 🌐 Webアプリファイル（オプション）
- **WebApp.html** - Web UI
- **styles.html** - CSS スタイル
- **script.html** - JavaScript ロジック

## 📋 デプロイ手順

### 1. Google Apps Scriptプロジェクト作成
1. https://script.google.com にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「AI Task Manager」に変更

### 2. ファイルアップロード
1. デフォルトの「Code.gs」を削除
2. 上記の必須ファイルを順番にアップロード
3. ファイル名は拡張子「.gs」のまま保持

### 3. 権限設定
Google Apps Scriptで以下の権限を承認：
```
- Google Calendar API
- Gmail API
- Google Drive API
- External URL Fetch
```

### 4. 設定値の登録

#### A. Notion設定
```javascript
// 関数 quickSetup() を実行
quickSetup(
  'YOUR_NOTION_TOKEN',
  'YOUR_DATABASE_ID', 
  'YOUR_GEMINI_API_KEY'
);
```

#### B. 手動設定（代替方法）
```javascript
var props = PropertiesService.getScriptProperties();
props.setProperty('NOTION_TOKEN', 'your_token_here');
props.setProperty('NOTION_DATABASE_ID', 'your_database_id_here');
props.setProperty('GEMINI_API_KEY', 'your_gemini_key_here');
```

## 🔧 初期設定確認

### 1. システムチェック実行
```javascript
checkSystemStatus();
```

### 2. 基本テスト実行
```javascript
runFullIntegrationTest();
```

### 3. 手動実行テスト
```javascript
runManualTest();
```

## 🏃‍♂️ 実行方法

### メイン実行
```javascript
main();          // メイン関数
run();           // 簡単実行
runTaskExtraction(); // フル機能実行
```

### 部分実行
```javascript
runCalendarOnly(); // カレンダーのみ
runGmailOnly();    // Gmailのみ
```

### 緊急時
```javascript
createEmergencyTask('緊急タスク', '高');
```

## ⏰ 自動実行設定

### 1. トリガー作成
1. GASエディタで「トリガー」→「トリガーを追加」
2. 実行する関数: `scheduledExecution`
3. イベントのソース: 時間主導型
4. 時間の間隔: 日タイマー
5. 時刻: 8:00〜9:00（推奨）

### 2. トリガー関数
```javascript
function scheduledExecution() {
  return runTaskExtraction();
}
```

## 🛠️ トラブルシューティング

### 権限エラー
```
Error: 権限が必要です
```
**解決策**: スクリプトエディタで権限を再承認

### Notion接続エラー
```
Error: Notion API エラー: 401
```
**解決策**: 
1. NotionトークンとデータベースIDを確認
2. Notionでインテグレーション招待を確認

### カレンダー・Gmail権限エラー
```
Error: カレンダー権限: NG
```
**解決策**: Googleアカウントの権限設定を確認

## 📊 ログ確認方法

### 1. 実行ログ確認
```javascript
// GASエディタで「実行」→「ログを表示」
console.log('ログ内容を確認');
```

### 2. エラー詳細確認
```javascript
try {
  runTaskExtraction();
} catch (error) {
  console.error('詳細エラー:', error.message);
  console.error('スタックトレース:', error.stack);
}
```

## 🔄 繰り返しカレンダーイベント対応

### 日付別タスク生成システム
- **同じ会議でも異なる日付で個別タスク作成**
- タスクタイトル: `会議名 (YYYY-MM-DD)` 形式
- 処理済み管理: 日付別PropertiesService管理（カレンダー変更なし）

### 重複防止スキーム
1. **ProcessedTracker**: 日付別処理済みチェック
2. **DuplicateChecker**: 同じoriginal_eventでも異なる日付は重複ではない
3. **結果**: 毎日の定例会議も適切に個別タスク化

## 🔍 動作確認チェックリスト

- [ ] 必須ファイルがすべてアップロードされている
- [ ] 設定値（Notion Token、Database ID）が正しく設定されている
- [ ] 権限が正しく承認されている
- [ ] `checkSystemStatus()` で全項目が ✅ になっている
- [ ] `runManualTest()` が成功している
- [ ] Notionデータベースにテストタスクが作成されている
- [ ] 繰り返しイベントが日付別に適切にタスク化されている

## ⚡ 最小限クイックスタート

```javascript
// 1. 設定
quickSetup('notion_token', 'database_id', 'gemini_key');

// 2. テスト
checkSystemStatus();

// 3. 実行
run();
```

## 🆘 緊急時の復旧手順

システムが動作しない場合：

### 1. 基本チェック
```javascript
runBasicSystemCheck();
```

### 2. 設定リセット
```javascript
// 設定を再入力
PropertiesService.getScriptProperties().setProperty('NOTION_TOKEN', 'new_token');
```

### 3. 最小限実行
```javascript
createEmergencyTask('手動テスト');
```

---

## 📞 サポート

問題が解決しない場合は：
1. ログ出力を確認
2. エラーメッセージをコピー
3. システム状態(`checkSystemStatus()`)の結果を確認

**正常動作時の出力例：**
```
✅ 設定検証成功 - システム利用可能
✅ Notion接続成功
✅ カレンダータスク抽出完了: 5件
✅ 実行完了
作成タスク: 3件
スキップ: 2件
```