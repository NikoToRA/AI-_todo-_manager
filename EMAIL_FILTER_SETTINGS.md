# メールフィルタリング設定ガイド（改善版）

## 📧 改善されたメール調査設定

### 🔍 新しいデフォルト設定
- **調査範囲**: 受信箱のアーカイブされていないメール (`in:inbox -is:archived`)
- **最大件数**: 50件
- **自動除外**: プロモーション、ソーシャル、スパムカテゴリ
- **Gemini分析**: 有効（メール内容からタスク自動抽出）

## 🎯 詳細設定項目

### 1. 基本設定
```javascript
// 受信箱のアーカイブされていないメールを対象
GMAIL_SEARCH_QUERY = 'in:inbox -is:archived'

// 調査期間（日数）
GMAIL_DATE_RANGE_DAYS = 7

// 最大取得件数
GMAIL_MAX_RESULTS = 50
```

### 2. 除外設定（詳細）
```javascript
// 除外送信者（部分一致）
GMAIL_EXCLUDE_SENDERS = 'noreply@,newsletter@,marketing@'

// 除外ドメイン（完全一致）
GMAIL_EXCLUDE_DOMAINS = 'mailchimp.com,constantcontact.com'

// 除外ラベル
GMAIL_EXCLUDE_LABELS = 'ニュースレター,宣伝'

// 除外キーワード（件名・本文）
GMAIL_EXCLUDE_KEYWORDS = '配信停止,unsubscribe,広告,セール,キャンペーン'

// 最小件名文字数（これより短い件名は除外）
GMAIL_MIN_SUBJECT_LENGTH = 3
```

### 3. 含める設定（優先度付き）
```javascript
// 高優先度キーワード（最優先で処理）
GMAIL_HIGH_PRIORITY_KEYWORDS = '緊急,至急,重要,ASAP,締切'

// 含めるキーワード（中優先度）
GMAIL_INCLUDE_KEYWORDS = '会議,打ち合わせ,確認,依頼,締切,提出,作成'

// 含める送信者（除外設定を上書き）
GMAIL_INCLUDE_SENDERS = 'boss@company.com,client@important.com'
```

### 4. AI分析設定
```javascript
// スパムフィルタ有効化
GMAIL_ENABLE_SPAM_FILTER = true

// Geminiによるメール内容分析
GMAIL_ENABLE_GEMINI_ANALYSIS = true

// 処理済みメール管理
GMAIL_PROCESSED_TRACKING = true
```

## 🤖 Gemini分析機能

### 自動タスク抽出
- メール内容を分析して実行可能なタスクを自動抽出
- 期日、優先度、コンテキストを自動設定
- 既存タスクとの重複チェック

### 分析対象
- 件名と本文の内容
- 送信者情報
- 添付ファイル名
- メール受信日時

### 抽出されるタスク例
```json
{
  "title": "プロジェクト資料の確認と修正",
  "priority": "高",
  "due_date": "2024-07-30",
  "context": "クライアントからの確認依頼メール",
  "source": "gmail"
}
```

## 📊 フィルタリング統計

### 取得可能な統計情報
- 総メール数
- 処理対象メール数
- スキップされたメール数
- スパム判定メール数
- 優先度別メール数
- 除外理由別統計

## 🔧 設定方法

### 1. スプレッドシート設定
```javascript
// 設定初期化
ConfigManager.initialize()

// 設定確認
checkEmailFilterSettings()
```

### 2. テスト実行
```javascript
// フィルタリングテスト
testEnhancedEmailFiltering()

// 設定確認
checkEmailFilterSettings()
```

## 💡 使用例

### 営業チーム向け設定
```javascript
GMAIL_HIGH_PRIORITY_KEYWORDS = '契約,見積,提案,商談'
GMAIL_INCLUDE_KEYWORDS = '会議,打ち合わせ,フォロー'
GMAIL_EXCLUDE_KEYWORDS = 'ニュースレター,セミナー案内'
```

### 開発チーム向け設定
```javascript
GMAIL_HIGH_PRIORITY_KEYWORDS = 'バグ,障害,緊急,リリース'
GMAIL_INCLUDE_KEYWORDS = 'レビュー,テスト,デプロイ,会議'
GMAIL_EXCLUDE_DOMAINS = 'github.com,slack.com'
```

### 管理職向け設定
```javascript
GMAIL_HIGH_PRIORITY_KEYWORDS = '承認,決裁,重要,緊急'
GMAIL_INCLUDE_SENDERS = 'ceo@,director@,manager@'
GMAIL_MIN_SUBJECT_LENGTH = 5
```