# CLAUDE.md - Claude Code制御ルール

このドキュメントは、Claude Codeの安全な運用と暴走防止のためのルールを定義します。すべての開発者は本ルールを遵守し、プロジェクトの安全性と一貫性を確保してください。

## プロジェクト概要
Google Apps Script（GAS）をコアとし、Claude+MCPによるAI分析を統合したハイブリッドタスク管理システムの開発

## 1. ファイル操作ルール
- **MUST**: ファイル削除（`DeleteFile`）は一切禁止。`.claude/settings.json`で`"deny": ["DeleteFile:*"]`を設定。
- **MUST**: ファイル書き込みは`src/`ディレクトリ内のみ許可。例: `"allow": ["WriteFile:src/*"]`。
- **SHOULD**: ファイル編集前にユーザーの確認を必須とし、自動承認を避ける。

## 2. シェルコマンドルール
- **MUST**: 以下のコマンドは禁止: `curl`, `wget`, `rm`。`.claude/settings.json`で`"deny": ["Bash(curl:*)", "Bash(wget:*)", "Bash(rm:*)"]`を設定。
- **SHOULD**: 許可する`Bash`コマンドは具体的に指定（例: `Bash(git commit:*)`）。

## 3. 計画モードルール
- **MUST**: 実装前に計画モードでタスクを`xxx_implement.md`に記載し、ユーザーの承認を得る。
- **SHOULD**: 実装後の検証手順を`xxx_verify.md`に記録し、テスト通過を確認。

## 4. テストルール
- **MUST**: コード変更前にテストを書き、テスト失敗を確認後、実装を行う。
- **MUST**: 実装後、`npm run test`や`pytest`などプロジェクトのテストスイートを実行。
- **SHOULD**: テストカバレッジを維持し、変更が既存機能を壊さないことを確認。

## 5. バージョン管理ルール
- **MUST**: 変更ごとに`git commit`を行い、Claudeに従来のコミット形式に従ったメッセージを生成させる。
- **SHOULD**: 大規模な変更前にブランチを作成（例: `git checkout -b feature-xyz`）。
- **SHOULD**: 誤った変更時は`git revert`や`git reset`で迅速に対応。

## 6. コンテキスト管理ルール
- **MUST**: 長期間作業後、または動作が不安定な場合は`/clear`でコンテキストをリセット。
- **MUST**: リセット後は本`CLAUDE.md`を再読み込みし、プロジェクト規約を再確認。

## 7. プロジェクト固有ルール
- **MUST**: コードはGoogleスタイルガイド（2スペースインデント）に従う。
- **MUST**: 依存管理は`uv`を使用。`pip install`は禁止。
- **MUST**: コードフォーマットはPrettierを使用し、保存時に`npm run format`を実行。

## 8. ユーザー確認ルール
- **MUST**: ファイル編集、コミット、プッシュ前にユーザーの明示的な承認を得る。
- **SHOULD**: 自動承認モード（auto-accept）は使用しない。

## 設定例（`.claude/settings.json`）
```json
{
  "permissions": {
    "allow": [
      "ReadFile:*",
      "WriteFile:src/*",
      "Bash(git commit:*)",
      "Bash(npm run test:*)"
    ],
    "deny": [
      "DeleteFile:*",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(rm:*)"
    ]
  }
}
```

## Claude Code実行時の追加制御ルール

### 実装前確認プロセス
1. **MUST**: 実装開始前に`tasks.md`で対象タスクを確認
2. **MUST**: 要件定義書で関連要件を確認
3. **MUST**: 設計文書で実装方針を確認
4. **MUST**: ユーザーに実装内容と影響範囲を説明し、承認を得る

### 実装中の安全措置
1. **MUST**: 一度に変更するファイル数は最大3ファイルまで
2. **MUST**: 各ファイル変更後にユーザー確認を求める
3. **MUST**: エラーが発生した場合は即座に停止し、ユーザーに報告
4. **SHOULD**: 大きな変更は小さな単位に分割して段階的に実装

### 実装後検証プロセス
1. **MUST**: 実装完了後にテスト実行を提案
2. **MUST**: 動作確認の結果をユーザーに報告
3. **MUST**: tasks.mdのタスクステータス更新をユーザーに確認
4. **SHOULD**: 次のタスクへの影響を評価し報告

### 緊急停止条件
以下の場合は即座に実行を停止し、ユーザーの指示を仰ぐ：
1. 予期しないエラーが連続で発生
2. ファイルシステムへの予期しない変更を検出
3. 設定ファイルの破損を検出
4. メモリ使用量やCPU使用率の異常な上昇

## 9. AI駆動タスク管理システム開発方針

### 9.1 実装優先順位
1. **コア機能優先**: GAS基盤 → Notion連携 → 基本UI → AI統合の順
2. **段階的構築**: 各フェーズで動作確認してから次へ進む
3. **最小実装**: 必要最小限の機能で動作させてから拡張

### 9.2 ファイル構成ルール

#### Google Apps Script構成
```
Code.gs              // メインエントリーポイント
Config.gs             // 設定管理クラス
NotionClient.gs       // Notion API統合
TaskExtractor.gs      // タスク抽出エンジン
DuplicateChecker.gs   // 重複チェック機能
ClaudeAnalyzer.gs     // Claude+MCP統合
ErrorHandler.gs       // エラーハンドリング
WebApp.html           // Web App UI
styles.html           // CSS スタイル
script.html           // JavaScript ロジック
```

#### プロジェクト管理ファイル
```
README.md                           // プロジェクト概要
CLAUDE.md                          // 開発ルール（このファイル）
.kiro/specs/ai-task-manager/       // 仕様書ディレクトリ
├── requirements.md                // 要件定義
├── design.md                     // 設計文書
└── tasks.md                      // 実装計画
```

### 9.3 コーディング規約

#### JavaScript/GAS規約
```javascript
// クラス名: PascalCase
class TaskExtractor {
  // メソッド名: camelCase
  extractFromCalendar() {}
  
  // 定数: UPPER_SNAKE_CASE
  static MAX_RETRY_COUNT = 3;
  
  // プライベートメソッド: _で開始
  _validateInput() {}
}

// 関数名: camelCase
function processCalendarEvents() {}

// 変数名: camelCase
const notionClient = new NotionClient();
```

#### エラーハンドリング規約
```javascript
// 必ず try-catch を使用
try {
  const result = await apiCall();
  return result;
} catch (error) {
  ErrorHandler.logError(error, 'TaskExtractor.extractFromCalendar');
  throw new Error(`カレンダー抽出に失敗: ${error.message}`);
}

// ログ出力は統一フォーマット
console.log(`[${className}.${methodName}] ${message}`);
```

### 9.4 コメント規約

#### クラス・メソッドコメント
```javascript
/**
 * カレンダーイベントからタスクを抽出するクラス
 * 要件2.1, 2.2に対応
 */
class TaskExtractor {
  /**
   * カレンダーAPIからイベントを取得してタスク候補を抽出
   * @param {Date} startDate 開始日
   * @param {Date} endDate 終了日
   * @returns {Array<Object>} 抽出されたタスク配列
   * @throws {Error} API呼び出し失敗時
   */
  extractFromCalendar(startDate, endDate) {
    // 実装
  }
}
```

#### 要件対応コメント
```javascript
// 要件1.2: カレンダーから設定期間のイベントを分析
const events = CalendarApp.getEvents(startDate, endDate);

// 要件3.1: 既存Notionタスクとの重複チェック
const isDuplicate = await this.duplicateChecker.check(newTask);
```

### 9.5 テスト規約

#### テスト関数命名
```javascript
// test + 機能名 + シナリオ
function testTaskExtractorCalendarSuccess() {}
function testTaskExtractorCalendarError() {}
function testNotionClientCreateTask() {}
```

#### テストデータ管理
```javascript
// TestData.gs で一元管理
class TestData {
  static getCalendarEvent() {
    return {
      summary: "プロジェクト会議",
      start: new Date("2024-07-27T10:00:00+09:00"),
      description: "Q3計画の確認"
    };
  }
}
```

### 9.6 セキュリティ規約

#### 認証情報管理
```javascript
// PropertiesService必須使用
const token = PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN');

// ログに機密情報を出力しない
console.log(`API呼び出し成功: ${response.status}`); // OK
console.log(`Token: ${token}`); // NG
```

#### API呼び出し
```javascript
// レート制限対応
const RATE_LIMIT_DELAY = 1000; // 1秒
await Utilities.sleep(RATE_LIMIT_DELAY);

// タイムアウト設定
const response = UrlFetchApp.fetch(url, {
  method: 'POST',
  headers: headers,
  payload: JSON.stringify(data),
  muteHttpExceptions: true,
  timeout: 30000 // 30秒
});
```

### 9.7 進捗管理ルール

#### タスク実行時
1. **tasks.mdでタスクステータス更新**: `[ ]` → `[x]`
2. **実装完了時にコメント追加**: 実装内容と検証結果を記録
3. **次タスクへの依存関係確認**: 前提条件が満たされているか確認

#### コミット規約
```
feat: カレンダーイベント抽出機能を実装 (タスク4.2)
fix: Notion API認証エラーを修正 (タスク3.1)
test: TaskExtractorの単体テストを追加 (タスク10.1)
docs: API仕様書を更新
```

### 9.8 デプロイメント規約

#### 段階的デプロイ
1. **開発版**: 個人GASプロジェクトでテスト
2. **ステージング版**: 限定ユーザーでの動作確認
3. **本番版**: 正式リリース

#### 設定管理
```javascript
// 環境別設定
const CONFIG = {
  development: {
    logLevel: 'DEBUG',
    apiTimeout: 60000
  },
  production: {
    logLevel: 'ERROR',
    apiTimeout: 30000
  }
};
```

### 9.9 開発フロー

#### 1. タスク開始前
- [ ] tasks.mdで対象タスクを確認
- [ ] 要件定義書で関連要件を確認
- [ ] 設計文書で実装方針を確認

#### 2. 実装中
- [ ] コーディング規約に従って実装
- [ ] 要件対応コメントを記載
- [ ] エラーハンドリングを実装

#### 3. 実装完了後
- [ ] 単体テストを実行
- [ ] 動作確認を実施
- [ ] tasks.mdのタスクステータスを更新
- [ ] 次タスクの前提条件を確認

### 9.10 チェックリスト

#### コード品質チェック
- [ ] 命名規約に準拠している
- [ ] エラーハンドリングが実装されている
- [ ] ログ出力が適切に設定されている
- [ ] セキュリティ要件を満たしている
- [ ] 要件対応コメントが記載されている

#### 機能チェック
- [ ] 要件定義の受入基準を満たしている
- [ ] 設計文書の仕様に準拠している
- [ ] エラーケースが適切に処理されている
- [ ] パフォーマンス要件を満たしている

### 9.11 成功基準

#### フェーズ1完了基準（基盤構築）
- [ ] GASプロジェクトが作成され、基本設定が完了
- [ ] Notion APIとの基本連携が動作
- [ ] 設定管理システムが機能

#### フェーズ2完了基準（コア機能）
- [ ] カレンダーからのタスク抽出が動作
- [ ] 重複チェック機能が動作
- [ ] Web App UIが基本機能で動作

#### フェーズ3完了基準（AI統合）
- [ ] Claude+MCP統合が動作
- [ ] 自動実行システムが動作
- [ ] 全機能の統合テストが完了

### 9.12 トラブルシューティング

#### よくある問題と対処法
1. **GAS実行時間制限**: 処理を分割して複数回実行
2. **API制限**: レート制限対応とリトライ機能実装
3. **認証エラー**: OAuth2スコープとトークン更新確認
4. **Notion API制限**: バッチ処理と適切な間隔設定

#### デバッグ手順
1. GASログでエラー詳細を確認
2. API レスポンスの内容を検証
3. 設定値の妥当性を確認
4. 段階的に機能を無効化して原因を特定

---

**このルールに従って、効率的で保守性の高いAI駆動タスク管理システムを構築しましょう！**