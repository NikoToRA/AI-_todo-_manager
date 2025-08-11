# 開発テンプレート集

## 🎯 GASクラステンプレート

### 基本クラステンプレート
```javascript
/**
 * [クラス名] - [機能説明]
 * 要件[X.X]対応: [対応する要件の説明]
 */
class ClassName {
  
  constructor(config) {
    this.config = config;
    this._validateConfig();
  }
  
  /**
   * [メソッドの説明]
   * @param {Type} param パラメータの説明
   * @returns {Type} 戻り値の説明
   * @throws {Error} エラー条件
   */
  methodName(param) {
    try {
      console.log(`[ClassName.methodName] 開始: param=${param}`);
      
      // 実装内容
      const result = this._processData(param);
      
      console.log(`[ClassName.methodName] 完了: result=${result}`);
      return result;
      
    } catch (error) {
      console.error(`[ClassName.methodName] エラー: ${error.message}`);
      throw new Error(`[ClassName] ${error.message}`);
    }
  }
  
  /**
   * プライベートメソッド - 設定バリデーション
   */
  _validateConfig() {
    if (!this.config) {
      throw new Error('設定が指定されていません');
    }
    // 追加のバリデーション
  }
  
  /**
   * プライベートメソッド - データ処理
   */
  _processData(data) {
    // 処理実装
    return data;
  }
}
```

### API呼び出しテンプレート
```javascript
/**
 * [API名] API呼び出しクラス
 */
class ApiClient {
  
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeout = 30000; // 30秒
    this.retryCount = 3;
  }
  
  /**
   * API呼び出し実行
   */
  async callApi(endpoint, method = 'GET', payload = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true,
      timeout: this.timeout
    };
    
    if (payload && (method === 'POST' || method === 'PATCH')) {
      options.payload = JSON.stringify(payload);
    }
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`[ApiClient] API呼び出し試行 ${attempt}/${this.retryCount}: ${method} ${url}`);
        
        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();
        
        if (responseCode >= 200 && responseCode < 300) {
          console.log(`[ApiClient] API呼び出し成功: ${responseCode}`);
          return JSON.parse(responseText);
        } else {
          throw new Error(`API呼び出し失敗: ${responseCode} - ${responseText}`);
        }
        
      } catch (error) {
        console.error(`[ApiClient] 試行 ${attempt} 失敗: ${error.message}`);
        
        if (attempt === this.retryCount) {
          throw error;
        }
        
        // リトライ前の待機
        Utilities.sleep(1000 * attempt);
      }
    }
  }
}
```

## 🧪 テスト関数テンプレート

### 単体テストテンプレート
```javascript
/**
 * [クラス名]の単体テスト
 */
function testClassName() {
  console.log('=== ClassName テスト開始 ===');
  
  try {
    // テストデータ準備
    const testConfig = TestData.getConfig();
    const testInput = TestData.getTestInput();
    
    // テスト対象インスタンス作成
    const instance = new ClassName(testConfig);
    
    // 正常系テスト
    console.log('正常系テスト実行中...');
    const result = instance.methodName(testInput);
    
    // 結果検証
    if (result && result.success) {
      console.log('✅ 正常系テスト成功');
    } else {
      console.error('❌ 正常系テスト失敗:', result);
    }
    
    // 異常系テスト
    console.log('異常系テスト実行中...');
    try {
      instance.methodName(null);
      console.error('❌ 異常系テスト失敗: エラーが発生しませんでした');
    } catch (error) {
      console.log('✅ 異常系テスト成功: 期待通りエラーが発生');
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
  }
  
  console.log('=== ClassName テスト完了 ===');
}
```

### 統合テストテンプレート
```javascript
/**
 * [機能名]の統合テスト
 */
function testIntegrationFeature() {
  console.log('=== 統合テスト開始: [機能名] ===');
  
  try {
    // 1. 前提条件確認
    const config = ConfigManager.getConfig();
    const validation = ConfigManager.validateConfig();
    
    if (!validation.isValid) {
      throw new Error(`設定エラー: ${validation.errors.join(', ')}`);
    }
    
    // 2. エンドツーエンドフロー実行
    console.log('エンドツーエンドフロー実行中...');
    
    // ステップ1: データ取得
    const extractor = new TaskExtractor(config);
    const tasks = extractor.extractFromCalendar(new Date(), new Date());
    console.log(`抽出されたタスク数: ${tasks.length}`);
    
    // ステップ2: 重複チェック
    const duplicateChecker = new TaskDuplicateChecker(config);
    const filteredTasks = tasks.filter(task => !duplicateChecker.checkBasicDuplicate(task));
    console.log(`重複除去後のタスク数: ${filteredTasks.length}`);
    
    // ステップ3: Notion登録
    const notionClient = new NotionClient(config);
    const results = [];
    for (const task of filteredTasks) {
      const result = await notionClient.createTask(task);
      results.push(result);
    }
    
    console.log(`✅ 統合テスト成功: ${results.length}件のタスクを処理`);
    
  } catch (error) {
    console.error('❌ 統合テスト失敗:', error.message);
  }
  
  console.log('=== 統合テスト完了 ===');
}
```

## 📊 テストデータテンプレート

### TestData.gs
```javascript
/**
 * テストデータ管理クラス
 */
class TestData {
  
  static getConfig() {
    return {
      notionToken: 'test_token',
      notionDatabaseId: 'test_database_id',
      claudeApiKey: 'test_claude_key',
      executionFrequency: 'daily',
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
  }
  
  static getCalendarEvent() {
    return {
      summary: "プロジェクト会議",
      start: new Date("2024-07-27T10:00:00+09:00"),
      end: new Date("2024-07-27T11:00:00+09:00"),
      description: "Q3計画の確認と次四半期の戦略検討",
      attendees: ["user@example.com", "manager@example.com"],
      location: "会議室A"
    };
  }
  
  static getGmailMessage() {
    return {
      subject: "プロジェクト資料の確認依頼",
      from: "client@example.com",
      date: new Date("2024-07-26T14:30:00+09:00"),
      body: "添付の資料を確認して、来週の会議までにフィードバックをお願いします。",
      isUnread: true
    };
  }
  
  static getVoiceTranscription() {
    return "明日の会議の資料を準備して、プレゼンテーションのスライドを更新する必要がある";
  }
  
  static getNotionTask() {
    return {
      title: "会議資料準備",
      type: "task",
      priority: "高",
      due_date: "2024-07-26",
      source: "calendar",
      status: "未着手",
      created_by: "auto",
      original_event: "プロジェクト会議",
      context: "Q3計画の確認"
    };
  }
  
  static getExecutionSummary() {
    return {
      title: "実行サマリー 2024-07-26",
      type: "summary",
      execution_date: new Date("2024-07-26T08:00:00+09:00"),
      processed_items: 5,
      created_tasks: 3,
      skipped_duplicates: 2,
      errors: "",
      execution_mode: "auto"
    };
  }
}
```

## 🎨 HTML/CSS/JSテンプレート

### styles.html
```html
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  header {
    text-align: center;
    margin-bottom: 40px;
    padding: 20px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  header h1 {
    color: #2563eb;
    margin-bottom: 10px;
  }
  
  .input-methods {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }
  
  .button-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
  }
  
  .method-btn {
    padding: 20px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
  }
  
  .method-btn:hover {
    border-color: #2563eb;
    background-color: #f0f9ff;
  }
  
  .method-btn.active {
    border-color: #2563eb;
    background-color: #2563eb;
    color: white;
  }
  
  .processing {
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .results {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .settings {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .settings-btn {
    padding: 15px 30px;
    background-color: #6b7280;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
  }
  
  .settings-btn:hover {
    background-color: #4b5563;
  }
  
  @media (max-width: 768px) {
    .container {
      padding: 10px;
    }
    
    .button-group {
      grid-template-columns: 1fr;
    }
  }
</style>
```

### script.html
```html
<script>
  let currentMethod = null;
  
  /**
   * 入力方法選択
   */
  function selectMethod(method) {
    currentMethod = method;
    
    // ボタンの状態更新
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`${method}-btn`).classList.add('active');
    
    // 処理開始
    startProcessing(method);
  }
  
  /**
   * 処理開始
   */
  function startProcessing(method) {
    // UI更新
    document.querySelector('.input-methods').style.display = 'none';
    document.getElementById('processing').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    updateStatus(`${getMethodName(method)}からタスクを抽出中...`);
    
    // GAS関数呼び出し
    google.script.run
      .withSuccessHandler(onProcessingSuccess)
      .withFailureHandler(onProcessingError)
      .manualTaskExtraction(method);
  }
  
  /**
   * 処理成功時のコールバック
   */
  function onProcessingSuccess(result) {
    console.log('処理成功:', result);
    
    document.getElementById('processing').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    if (result.success) {
      displayResults(result);
    } else {
      displayError(result.error);
    }
  }
  
  /**
   * 処理エラー時のコールバック
   */
  function onProcessingError(error) {
    console.error('処理エラー:', error);
    
    document.getElementById('processing').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    displayError(error.message || 'エラーが発生しました');
  }
  
  /**
   * 結果表示
   */
  function displayResults(result) {
    const content = document.getElementById('result-content');
    content.innerHTML = `
      <div class="success">
        <h4>✅ 処理完了</h4>
        <p>${result.message}</p>
        <div class="task-list">
          ${result.tasks.map(task => `
            <div class="task-item">
              <strong>${task.title}</strong>
              <span class="priority priority-${task.priority}">${task.priority}</span>
              ${task.due_date ? `<span class="due-date">期日: ${task.due_date}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      <button onclick="resetUI()" class="reset-btn">新しい処理を開始</button>
    `;
  }
  
  /**
   * エラー表示
   */
  function displayError(error) {
    const content = document.getElementById('result-content');
    content.innerHTML = `
      <div class="error">
        <h4>❌ エラーが発生しました</h4>
        <p>${error}</p>
      </div>
      <button onclick="resetUI()" class="reset-btn">再試行</button>
    `;
  }
  
  /**
   * UI リセット
   */
  function resetUI() {
    document.querySelector('.input-methods').style.display = 'block';
    document.getElementById('processing').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    
    // ボタンの状態リセット
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    currentMethod = null;
  }
  
  /**
   * ステータス更新
   */
  function updateStatus(message) {
    document.getElementById('status-message').textContent = message;
  }
  
  /**
   * メソッド名取得
   */
  function getMethodName(method) {
    const names = {
      'calendar': 'カレンダー',
      'gmail': 'Gmail',
      'voice': '音声入力'
    };
    return names[method] || method;
  }
  
  /**
   * 設定画面表示
   */
  function showSettings() {
    // 設定画面の実装（後のタスクで実装）
    alert('設定画面は後のタスクで実装予定です');
  }
</script>
```

## 🔧 ユーティリティ関数テンプレート

### Utils.gs
```javascript
/**
 * ユーティリティ関数集
 */
class Utils {
  
  /**
   * 日付フォーマット（JST）
   */
  static formatDateJST(date) {
    if (!date) return null;
    
    const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return jstDate.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  
  /**
   * 文字列の類似度計算（レーベンシュタイン距離）
   */
  static calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }
  
  /**
   * レート制限対応の待機
   */
  static async rateLimitWait(delayMs = 1000) {
    await Utilities.sleep(delayMs);
  }
  
  /**
   * 安全なJSON解析
   */
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn(`JSON解析エラー: ${error.message}`);
      return defaultValue;
    }
  }
  
  /**
   * 配列のチャンク分割
   */
  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
```

---

**これらのテンプレートを使用して、効率的で一貫性のあるコードを実装しましょう！**