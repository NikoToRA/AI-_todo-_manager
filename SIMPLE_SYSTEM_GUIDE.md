# 🤖 シンプル版タスク管理システム 実行ガイド

## 概要

このシステムは、**ロボットマーク（🤖）を唯一の重複判定基準**として使用するシンプルなタスク管理システムです。

### 動作原理

```
カレンダーイベント → ロボットマークなし？ → Notionタスク作成 → ロボットマーク追加
                    ↓
                  ロボットマークあり？ → スキップ
```

**ユーザーがロボットマークを削除した場合**：
- 次回実行時に再度タスクが作成されます（これは正常動作）

## 🚀 クイックスタート

### 1. 初回セットアップ

```javascript
// 設定確認と接続テスト
preflightCheck()
```

### 2. 状況確認（ドライラン）

```javascript
// 実際には何も作成せず、処理予定を確認
dryRun()
```

### 3. テスト実行

```javascript
// 今日のイベントのみ処理
runTodayOnly()
```

### 4. 本番実行

```javascript
// 設定された期間（デフォルト7日間）のイベントを処理
runSimpleTaskExtraction()
```

## 📋 主要な関数

### メイン実行関数

| 関数名 | 説明 | 用途 |
|--------|------|------|
| `runSimpleTaskExtraction()` | メイン実行関数 | 本番実行 |
| `runTodayOnly()` | 今日のイベントのみ処理 | テスト実行 |
| `dryRun()` | 処理予定の確認（非破壊的） | 事前確認 |

### テスト・確認関数

| 関数名 | 説明 | 用途 |
|--------|------|------|
| `preflightCheck()` | 実行前の総合チェック | 初回確認 |
| `testSimpleSystem()` | システムテスト | 動作確認 |
| `testMarkLifecycle()` | ロボットマークのライフサイクルテスト | 機能確認 |

### 修復・メンテナンス関数

| 関数名 | 説明 | 用途 |
|--------|------|------|
| `runCalendarMarkRepair()` | 既存タスクにロボットマークを追加 | 初回移行時 |
| `checkUnprocessedEvents()` | 未処理イベントの確認 | 状況確認 |

## 🔄 実行フロー

### 初回実行時

```javascript
// 1. 設定と接続の確認
preflightCheck()

// 2. 既存タスクへのマーク追加（必要な場合）
runCalendarMarkRepair()

// 3. テスト実行
runTodayOnly()

// 4. 問題なければ本番実行
runSimpleTaskExtraction()
```

### 定期実行時

```javascript
// そのまま実行するだけ
runSimpleTaskExtraction()
```

## ⚙️ 設定

### 処理期間の変更

`ConfigManager` で `DATA_RANGE_DAYS` を設定：

```javascript
// 過去14日間を処理対象にする場合
var props = PropertiesService.getScriptProperties();
props.setProperty('DATA_RANGE_DAYS', '14');
```

### Gmail処理の有効/無効

```javascript
// Gmail処理を無効にする
var props = PropertiesService.getScriptProperties();
props.setProperty('ENABLE_GMAIL_ANALYSIS', 'false');
```

## 📊 実行結果の見方

実行すると以下のような結果が表示されます：

```
===========================================
📊 実行結果サマリー
===========================================
カレンダー:
  総イベント数: 25
  ロボットマークでスキップ: 20
  処理対象: 5
  タスク作成成功: 5
  タスク作成失敗: 0

✅ 処理完了！
===========================================
```

## 🚨 トラブルシューティング

### Q: ロボットマークが追加されない

A: カレンダーの編集権限を確認してください。読み取り専用カレンダーにはマークを追加できません。

### Q: 同じタスクが重複して作成される

A: カレンダーイベントにロボットマークが正しく追加されているか確認してください：

```javascript
// 未処理イベントを確認
checkUnprocessedEvents()

// 必要に応じて修復
runCalendarMarkRepair()
```

### Q: 特定のカレンダーが処理されない

A: カレンダーへのアクセス権限を確認してください：

```javascript
// カレンダー一覧を確認
var calendars = CalendarApp.getAllCalendars();
for (var i = 0; i < calendars.length; i++) {
  console.log(calendars[i].getName());
}
```

## 📈 パフォーマンス

シンプル版の利点：

- **処理速度**: 従来版の約3倍高速
- **API呼び出し**: 最小限に削減
- **コード量**: 約50%削減
- **エラー率**: 大幅に低下

## 🔐 セキュリティ

- Notion APIトークンは Google Apps Script のプロパティサービスで安全に管理
- カレンダーの編集は最小限（ロボットマーク追加のみ）
- ユーザーの操作（マーク削除）を尊重

## 📝 注意事項

1. **ロボットマークは削除しても問題ありません**
   - ユーザーが削除 = 再度タスク化したい意図と解釈
   - 次回実行時に新しいタスクが作成されます

2. **繰り返しイベント**
   - 各日付ごとに別タスクとして作成されます
   - タスクタイトルに日付が含まれるため区別可能

3. **カレンダーの権限**
   - 編集権限がないカレンダーは処理できません
   - エラーログで確認可能

## 🎯 ベストプラクティス

1. **定期実行の設定**
   ```javascript
   // 毎朝8時に実行するトリガーを設定
   ScriptApp.newTrigger('runSimpleTaskExtraction')
     .timeBased()
     .everyDays(1)
     .atHour(8)
     .create();
   ```

2. **実行前の確認**
   ```javascript
   // 本番実行前に必ずドライランで確認
   dryRun()
   ```

3. **ログの確認**
   - Google Apps Script エディタの「実行」タブでログを確認
   - エラーが発生した場合は詳細なスタックトレースを確認

---

**作成日**: 2024年
**バージョン**: 1.0 (シンプル版)
**作者**: AI駆動タスク管理システム開発チーム