# 次のステップ - 開発開始準備

## 🚀 即座に開始可能な実装手順

### ステップ1: GASプロジェクト作成（10分）

#### 1.1 Google Apps Script プロジェクト作成
```
1. https://script.google.com にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「AI Task Manager」に変更
4. 以下のファイル構成を作成：
   - Code.gs (メインファイル)
   - Config.gs
   - NotionClient.gs
   - TaskExtractor.gs
   - WebApp.html
```

#### 1.2 必要なAPIサービス有効化
```
1. GASエディタで「サービス」→「Google Calendar API」を追加
2. 「サービス」→「Gmail API」を追加
3. 「ライブラリ」で必要に応じて外部ライブラリを追加
```

### ステップ2: Notion準備（5分）

#### 2.1 Notionインテグレーション作成
```
1. https://www.notion.so/my-integrations にアクセス
2. 「新しいインテグレーション」を作成
3. 名前: "AI Task Manager"
4. インテグレーショントークンをコピー
```

#### 2.2 Notionデータベース作成
```
1. 新しいページを作成
2. データベースを追加
3. 以下のプロパティを設定：
   - title (タイトル) - タイトル
   - type (タイプ) - セレクト ["task", "summary"]
   - priority (優先度) - セレクト ["高", "中", "低"]
   - due_date (期日) - 日付
   - source (ソース) - セレクト ["calendar", "gmail", "voice", "auto"]
   - status (ステータス) - セレクト ["未着手", "進行中", "完了"]
   - created_by (作成者) - セレクト ["auto", "manual"]
   - original_event (元イベント) - テキスト
   - context (コンテキスト) - テキスト
4. データベースIDをコピー（URLの一部）
```

### ステップ3: 初期実装（タスク1-2の実行）

#### 3.1 基盤コード実装
以下のコードをGASに実装：

**Code.gs**
```javascript
/**
 * AI駆動タスク管理システム - メインエントリーポイント
 * 要件1.1対応: 多様な入力方法によるタスク整理
 */

function doGet() {
  return HtmlService.createTemplateFromFile('WebApp')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 手動実行エントリーポイント
 * Claude経由での「整理してtodoに入れて」に対応
 */
function manualTaskExtraction(source = 'calendar', options = {}) {
  try {
    console.log(`[manualTaskExtraction] 開始: source=${source}`);
    
    const config = ConfigManager.getConfig();
    const extractor = new TaskExtractor(config);
    
    let tasks = [];
    switch(source) {
      case 'calendar':
        tasks = extractor.extractFromCalendar(
          options.startDate || new Date(),
          options.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );
        break;
      case 'gmail':
        tasks = extractor.extractFromGmail(options.query || 'is:unread', 50);
        break;
      case 'voice':
        tasks = extractor.extractFromVoice(options.transcription || '');
        break;
    }
    
    console.log(`[manualTaskExtraction] 抽出されたタスク数: ${tasks.length}`);
    return {
      success: true,
      tasks: tasks,
      message: `${tasks.length}件のタスクを処理しました`
    };
    
  } catch (error) {
    console.error(`[manualTaskExtraction] エラー: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 自動実行エントリーポイント
 * 時間ベーストリガーから呼び出される
 */
function autoTaskExtraction() {
  try {
    console.log('[autoTaskExtraction] 自動実行開始');
    
    const result = manualTaskExtraction('calendar');
    
    // 実行サマリーをNotionに記録
    const notionClient = new NotionClient();
    notionClient.createExecutionSummary({
      execution_date: new Date(),
      processed_items: result.tasks ? result.tasks.length : 0,
      created_tasks: result.tasks ? result.tasks.filter(t => t.created).length : 0,
      execution_mode: 'auto',
      errors: result.success ? '' : result.error
    });
    
    console.log('[autoTaskExtraction] 自動実行完了');
    
  } catch (error) {
    console.error(`[autoTaskExtraction] エラー: ${error.message}`);
  }
}
```

**Config.gs**
```javascript
/**
 * 設定管理クラス
 * 要件4.1, 9.1対応: セキュアな認証情報管理
 */
class ConfigManager {
  
  static getConfig() {
    const props = PropertiesService.getScriptProperties();
    
    return {
      notionToken: props.getProperty('NOTION_TOKEN'),
      notionDatabaseId: props.getProperty('NOTION_DATABASE_ID'),
      claudeApiKey: props.getProperty('CLAUDE_API_KEY'),
      executionFrequency: props.getProperty('EXECUTION_FREQUENCY') || 'daily',
      dataRangeDays: parseInt(props.getProperty('DATA_RANGE_DAYS') || '7'),
      enableAiAnalysis: props.getProperty('ENABLE_AI_ANALYSIS') === 'true',
      enableVoiceInput: props.getProperty('ENABLE_VOICE_INPUT') === 'true',
      enableGmailAnalysis: props.getProperty('ENABLE_GMAIL_ANALYSIS') === 'true'
    };
  }
  
  static setConfig(config) {
    const props = PropertiesService.getScriptProperties();
    
    if (config.notionToken) props.setProperty('NOTION_TOKEN', config.notionToken);
    if (config.notionDatabaseId) props.setProperty('NOTION_DATABASE_ID', config.notionDatabaseId);
    if (config.claudeApiKey) props.setProperty('CLAUDE_API_KEY', config.claudeApiKey);
    if (config.executionFrequency) props.setProperty('EXECUTION_FREQUENCY', config.executionFrequency);
    if (config.dataRangeDays) props.setProperty('DATA_RANGE_DAYS', config.dataRangeDays.toString());
    if (config.enableAiAnalysis !== undefined) props.setProperty('ENABLE_AI_ANALYSIS', config.enableAiAnalysis.toString());
    if (config.enableVoiceInput !== undefined) props.setProperty('ENABLE_VOICE_INPUT', config.enableVoiceInput.toString());
    if (config.enableGmailAnalysis !== undefined) props.setProperty('ENABLE_GMAIL_ANALYSIS', config.enableGmailAnalysis.toString());
  }
  
  static validateConfig() {
    const config = this.getConfig();
    const errors = [];
    
    if (!config.notionToken) errors.push('Notion APIトークンが設定されていません');
    if (!config.notionDatabaseId) errors.push('NotionデータベースIDが設定されていません');
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}
```

#### 3.2 基本Web App UI実装

**WebApp.html**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Task Manager</title>
  <?!= include('styles'); ?>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 AI Task Manager</h1>
      <p>AIがあなたのタスクを整理します</p>
    </header>
    
    <main>
      <div class="input-methods">
        <h2>入力方法を選択</h2>
        <div class="button-group">
          <button id="calendar-btn" class="method-btn" onclick="selectMethod('calendar')">
            📅 カレンダーから
          </button>
          <button id="gmail-btn" class="method-btn" onclick="selectMethod('gmail')">
            📧 Gmailから
          </button>
          <button id="voice-btn" class="method-btn" onclick="selectMethod('voice')">
            🎤 音声入力から
          </button>
        </div>
      </div>
      
      <div id="processing" class="processing" style="display: none;">
        <div class="spinner"></div>
        <p id="status-message">処理中...</p>
      </div>
      
      <div id="results" class="results" style="display: none;">
        <h3>処理結果</h3>
        <div id="result-content"></div>
      </div>
      
      <div class="settings">
        <h2>設定</h2>
        <button onclick="showSettings()" class="settings-btn">⚙️ 設定を開く</button>
      </div>
    </main>
  </div>
  
  <?!= include('script'); ?>
</body>
</html>
```

### ステップ4: 初期テスト（5分）

#### 4.1 設定テスト
```javascript
// GASエディタで実行
function testConfig() {
  // 設定を保存
  ConfigManager.setConfig({
    notionToken: 'YOUR_NOTION_TOKEN',
    notionDatabaseId: 'YOUR_DATABASE_ID'
  });
  
  // 設定を確認
  const config = ConfigManager.getConfig();
  console.log('設定確認:', config);
  
  // バリデーション
  const validation = ConfigManager.validateConfig();
  console.log('バリデーション結果:', validation);
}
```

#### 4.2 Web App デプロイ
```
1. GASエディタで「デプロイ」→「新しいデプロイ」
2. 種類: ウェブアプリ
3. 実行者: 自分
4. アクセス: 全員
5. デプロイしてURLを取得
```

### ステップ5: Gemini API連携準備（2分）

#### 5.1 Gemini APIキー設定
```
1. Google AI Studio (https://makersuite.google.com/) にアクセス
2. 「Get API key」をクリックしてAPIキーを取得
3. GASの設定でGemini APIキーを設定
4. 「整理してtodoに入れて」でテスト実行
```

## 📋 開発チェックリスト

### 準備完了チェック
- [ ] Google Apps Scriptプロジェクト作成完了
- [ ] 必要なAPIサービス有効化完了
- [ ] Notionインテグレーション作成完了
- [ ] Notionデータベース作成完了
- [ ] 基盤コード実装完了
- [ ] Web App UI実装完了
- [ ] 初期テスト実行完了
- [ ] Web Appデプロイ完了
- [ ] Gemini API連携設定完了

### 次の実装タスク
1. **タスク3: Notion API統合の実装** (tasks.md 3.1-3.3)
2. **タスク4: データ抽出エンジンの実装** (tasks.md 4.1-4.4)
3. **タスク5: 重複チェックシステムの実装** (tasks.md 5.1-5.2)

## 🎯 成功確認方法

### 基盤動作確認
```javascript
// GASエディタで実行して確認
function verifySetup() {
  console.log('=== セットアップ確認 ===');
  
  // 1. 設定確認
  const config = ConfigManager.getConfig();
  console.log('設定:', config);
  
  // 2. バリデーション
  const validation = ConfigManager.validateConfig();
  console.log('バリデーション:', validation);
  
  // 3. 手動実行テスト
  const result = manualTaskExtraction('calendar');
  console.log('手動実行結果:', result);
  
  console.log('=== 確認完了 ===');
}
```

### Web App動作確認
1. デプロイされたURLにアクセス
2. UI が正常に表示されることを確認
3. ボタンクリックでJavaScriptが動作することを確認

---

**これで開発開始の準備が完了です！tasks.mdのタスク1から順次実装を開始できます。**