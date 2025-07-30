# AI統合実装ガイド

## 🤖 AI判断部分の実装方法

### 概要
メール内容の判断や重複チェックなどのAI処理は、以下の2つのアプローチで実装します：

## 🎯 アプローチ1: Claude API直接統合（推奨）

### 1.1 Claude APIをGAS内で直接呼び出し

**ClaudeAnalyzer.gs**
```javascript
/**
 * Claude API統合クラス
 * 要件2.1-2.4対応: AI分析による高度なタスク抽出
 */
class ClaudeAnalyzer {
  
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-sonnet-20240229';
  }
  
  /**
   * メール内容からタスクを抽出
   * @param {Object} emailData メールデータ
   * @param {Array} existingTasks 既存タスク一覧
   * @returns {Array} 抽出されたタスク配列
   */
  async analyzeEmailForTasks(emailData, existingTasks = []) {
    const prompt = this._buildEmailAnalysisPrompt(emailData, existingTasks);
    
    try {
      const response = await this._callClaudeAPI(prompt);
      return this._parseTaskResponse(response);
    } catch (error) {
      console.error('[ClaudeAnalyzer] メール分析エラー:', error.message);
      // フォールバック: ルールベース分析
      return this._fallbackEmailAnalysis(emailData);
    }
  }
  
  /**
   * カレンダーイベントからタスクを抽出
   * @param {Object} eventData イベントデータ
   * @param {Array} existingTasks 既存タスク一覧
   * @returns {Array} 抽出されたタスク配列
   */
  async analyzeCalendarForTasks(eventData, existingTasks = []) {
    const prompt = this._buildCalendarAnalysisPrompt(eventData, existingTasks);
    
    try {
      const response = await this._callClaudeAPI(prompt);
      return this._parseTaskResponse(response);
    } catch (error) {
      console.error('[ClaudeAnalyzer] カレンダー分析エラー:', error.message);
      // フォールバック: ルールベース分析
      return this._fallbackCalendarAnalysis(eventData);
    }
  }
  
  /**
   * 重複チェック（意味的類似性）
   * @param {Object} newTask 新しいタスク
   * @param {Array} existingTasks 既存タスク一覧
   * @returns {Object} 重複判定結果
   */
  async checkSemanticDuplicate(newTask, existingTasks) {
    const prompt = this._buildDuplicateCheckPrompt(newTask, existingTasks);
    
    try {
      const response = await this._callClaudeAPI(prompt);
      return this._parseDuplicateResponse(response);
    } catch (error) {
      console.error('[ClaudeAnalyzer] 重複チェックエラー:', error.message);
      // フォールバック: 基本的な文字列比較
      return this._fallbackDuplicateCheck(newTask, existingTasks);
    }
  }
  
  /**
   * Claude API呼び出し
   * @private
   */
  async _callClaudeAPI(prompt) {
    const payload = {
      model: this.model,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30000
    };
    
    const response = UrlFetchApp.fetch(this.baseUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      throw new Error(`Claude API エラー: ${responseCode} - ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    return data.content[0].text;
  }
  
  /**
   * メール分析用プロンプト構築
   * @private
   */
  _buildEmailAnalysisPrompt(emailData, existingTasks) {
    return `
あなたはタスク管理の専門家です。以下のメール内容を分析して、実行可能なタスクを抽出してください。

【メール情報】
件名: ${emailData.subject}
送信者: ${emailData.from}
日時: ${emailData.date}
本文: ${emailData.body}

【既存タスク】
${existingTasks.map(task => `- ${task.title} (優先度: ${task.priority})`).join('\n')}

【抽出ルール】
1. 明確なアクションが必要な項目のみ抽出
2. 期日が明記されている場合は due_date に設定
3. 緊急度・重要度から優先度を判定（高・中・低）
4. 既存タスクとの重複は避ける

【出力形式】
JSON配列で以下の形式で出力してください：
[
  {
    "title": "タスクタイトル",
    "priority": "高|中|低",
    "due_date": "YYYY-MM-DD または null",
    "context": "タスクの背景情報",
    "source": "gmail"
  }
]

タスクが抽出できない場合は空配列 [] を返してください。
`;
  }
  
  /**
   * カレンダー分析用プロンプト構築
   * @private
   */
  _buildCalendarAnalysisPrompt(eventData, existingTasks) {
    return `
あなたはタスク管理の専門家です。以下のカレンダーイベントを分析して、関連する準備タスクや事後タスクを抽出してください。

【イベント情報】
タイトル: ${eventData.summary}
開始時刻: ${eventData.start}
終了時刻: ${eventData.end}
場所: ${eventData.location || 'なし'}
説明: ${eventData.description || 'なし'}
参加者: ${eventData.attendees ? eventData.attendees.join(', ') : 'なし'}

【既存タスク】
${existingTasks.map(task => `- ${task.title} (優先度: ${task.priority})`).join('\n')}

【抽出ルール】
1. 会議の準備タスク（資料作成、事前確認など）
2. 会議後のフォローアップタスク（議事録作成、アクション実行など）
3. イベント開始時刻を考慮した適切な期日設定
4. 既存タスクとの重複は避ける

【出力形式】
JSON配列で以下の形式で出力してください：
[
  {
    "title": "タスクタイトル",
    "priority": "高|中|低",
    "due_date": "YYYY-MM-DD または null",
    "context": "元イベント: ${eventData.summary}",
    "source": "calendar"
  }
]

関連タスクが抽出できない場合は空配列 [] を返してください。
`;
  }
  
  /**
   * 重複チェック用プロンプト構築
   * @private
   */
  _buildDuplicateCheckPrompt(newTask, existingTasks) {
    return `
以下の新しいタスクが、既存のタスクと重複しているかを判定してください。

【新しいタスク】
タイトル: ${newTask.title}
優先度: ${newTask.priority}
期日: ${newTask.due_date || 'なし'}
コンテキスト: ${newTask.context || 'なし'}

【既存タスク一覧】
${existingTasks.map((task, index) => 
  `${index + 1}. ${task.title} (優先度: ${task.priority}, 期日: ${task.due_date || 'なし'})`
).join('\n')}

【判定基準】
1. タスクの内容が実質的に同じ
2. 期日が近い（±3日以内）
3. 優先度が同程度

【出力形式】
JSON形式で以下を出力してください：
{
  "is_duplicate": true/false,
  "duplicate_task_index": 重複する既存タスクのインデックス（重複しない場合は null）,
  "similarity_score": 0.0-1.0の類似度スコア,
  "reason": "判定理由の説明",
  "action": "skip|update|create" // skip: 作成しない, update: 既存を更新, create: 新規作成
}
`;
  }
  
  /**
   * タスク抽出レスポンス解析
   * @private
   */
  _parseTaskResponse(response) {
    try {
      // JSONの抽出（マークダウンコードブロックを除去）
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('[ClaudeAnalyzer] JSON形式のレスポンスが見つかりません');
        return [];
      }
      
      const tasks = JSON.parse(jsonMatch[0]);
      
      // バリデーション
      return tasks.filter(task => 
        task.title && 
        task.priority && 
        ['高', '中', '低'].includes(task.priority)
      );
      
    } catch (error) {
      console.error('[ClaudeAnalyzer] レスポンス解析エラー:', error.message);
      return [];
    }
  }
  
  /**
   * 重複チェックレスポンス解析
   * @private
   */
  _parseDuplicateResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { is_duplicate: false, action: 'create' };
      }
      
      return JSON.parse(jsonMatch[0]);
      
    } catch (error) {
      console.error('[ClaudeAnalyzer] 重複チェックレスポンス解析エラー:', error.message);
      return { is_duplicate: false, action: 'create' };
    }
  }
  
  /**
   * フォールバック: ルールベースメール分析
   * @private
   */
  _fallbackEmailAnalysis(emailData) {
    const actionKeywords = ['確認', '作成', '準備', '送信', '提出', '完了', '実行'];
    const tasks = [];
    
    // 件名からタスク抽出
    for (const keyword of actionKeywords) {
      if (emailData.subject.includes(keyword)) {
        tasks.push({
          title: `${emailData.subject}への対応`,
          priority: '中',
          due_date: null,
          context: `メールからの自動抽出: ${emailData.from}`,
          source: 'gmail'
        });
        break;
      }
    }
    
    return tasks;
  }
  
  /**
   * フォールバック: ルールベースカレンダー分析
   * @private
   */
  _fallbackCalendarAnalysis(eventData) {
    const tasks = [];
    const eventDate = new Date(eventData.start);
    const prepDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 1日前
    
    // 会議の場合は準備タスクを生成
    if (eventData.summary.includes('会議') || eventData.summary.includes('ミーティング')) {
      tasks.push({
        title: `${eventData.summary}の準備`,
        priority: '中',
        due_date: prepDate.toISOString().split('T')[0],
        context: `元イベント: ${eventData.summary}`,
        source: 'calendar'
      });
    }
    
    return tasks;
  }
  
  /**
   * フォールバック: 基本重複チェック
   * @private
   */
  _fallbackDuplicateCheck(newTask, existingTasks) {
    for (let i = 0; i < existingTasks.length; i++) {
      const existing = existingTasks[i];
      const similarity = this._calculateStringSimilarity(newTask.title, existing.title);
      
      if (similarity > 0.8) {
        return {
          is_duplicate: true,
          duplicate_task_index: i,
          similarity_score: similarity,
          reason: 'タイトルの類似度が高い',
          action: 'skip'
        };
      }
    }
    
    return {
      is_duplicate: false,
      similarity_score: 0,
      reason: '重複なし',
      action: 'create'
    };
  }
  
  /**
   * 文字列類似度計算（簡易版）
   * @private
   */
  _calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  /**
   * レーベンシュタイン距離計算
   * @private
   */
  _levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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
    
    return matrix[str2.length][str1.length];
  }
}
```

### 1.2 TaskExtractorでの統合使用

**TaskExtractor.gs（AI統合版）**
```javascript
/**
 * タスク抽出エンジン（AI統合版）
 */
class TaskExtractor {
  
  constructor(config) {
    this.config = config;
    this.notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // AI分析が有効な場合のみClaudeAnalyzerを初期化
    if (config.enableAiAnalysis && config.claudeApiKey) {
      this.claudeAnalyzer = new ClaudeAnalyzer(config.claudeApiKey);
    }
  }
  
  /**
   * Gmailからタスク抽出（AI統合版）
   */
  async extractFromGmail(query = 'is:unread', maxResults = 50) {
    try {
      console.log('[TaskExtractor] Gmail分析開始');
      
      // Gmail APIでメール取得
      const threads = GmailApp.search(query, 0, maxResults);
      const allTasks = [];
      
      // 既存タスクを取得（重複チェック用）
      const existingTasks = await this.notionClient.getExistingTasks();
      
      for (const thread of threads) {
        const messages = thread.getMessages();
        
        for (const message of messages) {
          const emailData = {
            subject: message.getSubject(),
            from: message.getFrom(),
            date: message.getDate(),
            body: message.getPlainBody().substring(0, 1000) // 最初の1000文字
          };
          
          let tasks = [];
          
          // AI分析が有効な場合
          if (this.claudeAnalyzer) {
            console.log(`[TaskExtractor] AI分析実行: ${emailData.subject}`);
            tasks = await this.claudeAnalyzer.analyzeEmailForTasks(emailData, existingTasks);
          } else {
            // フォールバック: ルールベース分析
            tasks = this._extractTasksFromEmailBasic(emailData);
          }
          
          // 重複チェック
          for (const task of tasks) {
            const duplicateCheck = await this._checkDuplicate(task, existingTasks);
            
            if (duplicateCheck.action === 'create') {
              allTasks.push(task);
            } else if (duplicateCheck.action === 'update') {
              // 既存タスクの更新
              await this._updateExistingTask(duplicateCheck.duplicate_task_index, task, existingTasks);
            }
            // 'skip'の場合は何もしない
          }
        }
      }
      
      console.log(`[TaskExtractor] Gmail分析完了: ${allTasks.length}件のタスクを抽出`);
      return allTasks;
      
    } catch (error) {
      console.error('[TaskExtractor] Gmail分析エラー:', error.message);
      throw error;
    }
  }
  
  /**
   * カレンダーからタスク抽出（AI統合版）
   */
  async extractFromCalendar(startDate, endDate) {
    try {
      console.log('[TaskExtractor] カレンダー分析開始');
      
      // Calendar APIでイベント取得
      const events = CalendarApp.getDefaultCalendar().getEvents(startDate, endDate);
      const allTasks = [];
      
      // 既存タスクを取得（重複チェック用）
      const existingTasks = await this.notionClient.getExistingTasks();
      
      for (const event of events) {
        const eventData = {
          summary: event.getTitle(),
          start: event.getStartTime(),
          end: event.getEndTime(),
          location: event.getLocation(),
          description: event.getDescription(),
          attendees: event.getGuestList().map(guest => guest.getEmail())
        };
        
        let tasks = [];
        
        // AI分析が有効な場合
        if (this.claudeAnalyzer) {
          console.log(`[TaskExtractor] AI分析実行: ${eventData.summary}`);
          tasks = await this.claudeAnalyzer.analyzeCalendarForTasks(eventData, existingTasks);
        } else {
          // フォールバック: ルールベース分析
          tasks = this._extractTasksFromCalendarBasic(eventData);
        }
        
        // 重複チェック
        for (const task of tasks) {
          const duplicateCheck = await this._checkDuplicate(task, existingTasks);
          
          if (duplicateCheck.action === 'create') {
            allTasks.push(task);
          } else if (duplicateCheck.action === 'update') {
            // 既存タスクの更新
            await this._updateExistingTask(duplicateCheck.duplicate_task_index, task, existingTasks);
          }
          // 'skip'の場合は何もしない
        }
      }
      
      console.log(`[TaskExtractor] カレンダー分析完了: ${allTasks.length}件のタスクを抽出`);
      return allTasks;
      
    } catch (error) {
      console.error('[TaskExtractor] カレンダー分析エラー:', error.message);
      throw error;
    }
  }
  
  /**
   * 重複チェック（AI統合版）
   * @private
   */
  async _checkDuplicate(newTask, existingTasks) {
    if (this.claudeAnalyzer) {
      // AI による意味的類似性チェック
      return await this.claudeAnalyzer.checkSemanticDuplicate(newTask, existingTasks);
    } else {
      // フォールバック: 基本的な文字列比較
      return this._basicDuplicateCheck(newTask, existingTasks);
    }
  }
  
  /**
   * 基本的な重複チェック
   * @private
   */
  _basicDuplicateCheck(newTask, existingTasks) {
    for (let i = 0; i < existingTasks.length; i++) {
      const existing = existingTasks[i];
      
      // タイトルの完全一致
      if (newTask.title === existing.title) {
        return {
          is_duplicate: true,
          duplicate_task_index: i,
          action: 'skip'
        };
      }
      
      // タイトルの部分一致（70%以上）
      const similarity = this._calculateSimilarity(newTask.title, existing.title);
      if (similarity > 0.7) {
        return {
          is_duplicate: true,
          duplicate_task_index: i,
          action: 'skip'
        };
      }
    }
    
    return {
      is_duplicate: false,
      action: 'create'
    };
  }
  
  /**
   * 既存タスクの更新
   * @private
   */
  async _updateExistingTask(taskIndex, newTaskData, existingTasks) {
    const existingTask = existingTasks[taskIndex];
    
    // 更新データの準備
    const updateData = {
      priority: newTaskData.priority,
      context: `${existingTask.context}\n\n[更新] ${newTaskData.context}`
    };
    
    if (newTaskData.due_date && !existingTask.due_date) {
      updateData.due_date = newTaskData.due_date;
    }
    
    // Notion APIで更新
    await this.notionClient.updateTask(existingTask.id, updateData);
    console.log(`[TaskExtractor] 既存タスクを更新: ${existingTask.title}`);
  }
}
```

## 🎯 アプローチ2: Claude+MCP統合（高度）

### 2.1 MCPサーバー経由でのデータアクセス

この方法では、Claude側でMCPを使用してGoogleカレンダーやGmailに直接アクセスし、分析結果をGASに送信します。

**GAS側: Claude分析結果受信エンドポイント**
```javascript
/**
 * Claude+MCP分析結果を受信するエンドポイント
 */
function receiveClaudeAnalysis(analysisData) {
  try {
    console.log('[receiveClaudeAnalysis] Claude分析結果を受信');
    
    const config = ConfigManager.getConfig();
    const notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 分析結果からタスクを作成
    const results = [];
    for (const task of analysisData.tasks) {
      const result = await notionClient.createTask(task);
      results.push(result);
    }
    
    // 実行サマリーを記録
    await notionClient.createExecutionSummary({
      execution_date: new Date(),
      processed_items: analysisData.processed_items,
      created_tasks: results.length,
      skipped_duplicates: analysisData.skipped_duplicates,
      execution_mode: 'manual',
      errors: ''
    });
    
    return {
      success: true,
      created_tasks: results.length,
      message: `${results.length}件のタスクを作成しました`
    };
    
  } catch (error) {
    console.error('[receiveClaudeAnalysis] エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
```

## 🔧 設定と使い分け

### 設定での制御
```javascript
// Config.gs での設定
const AI_INTEGRATION_MODE = {
  DISABLED: 'disabled',        // AI分析無効（ルールベースのみ）
  CLAUDE_API: 'claude_api',    // Claude API直接統合
  CLAUDE_MCP: 'claude_mcp'     // Claude+MCP統合
};

// 設定例
ConfigManager.setConfig({
  aiIntegrationMode: AI_INTEGRATION_MODE.CLAUDE_API,
  claudeApiKey: 'your_claude_api_key',
  enableAiAnalysis: true
});
```

### 使い分けの指針

#### Claude API直接統合を選ぶ場合：
- ✅ シンプルな実装
- ✅ GAS内で完結
- ✅ レスポンス時間が早い
- ❌ MCPの高度な機能は使えない

#### Claude+MCP統合を選ぶ場合：
- ✅ より高度なAI分析
- ✅ リアルタイムデータアクセス
- ✅ 複雑なコンテキスト理解
- ❌ 実装が複雑
- ❌ 外部依存が増える

## 🚀 推奨実装手順

1. **フェーズ1**: ルールベース実装で基本動作確認
2. **フェーズ2**: Claude API直接統合で AI機能追加
3. **フェーズ3**: 必要に応じてClaude+MCP統合に拡張

この段階的アプローチにより、確実に動作するシステムを構築できます。

## 💡 実装のポイント

### エラーハンドリング
- AI分析失敗時は必ずルールベース処理にフォールバック
- API制限やネットワークエラーに対する適切な対応
- ユーザーにわかりやすいエラーメッセージを提供

### パフォーマンス最適化
- バッチ処理でAPI呼び出し回数を削減
- キャッシュ機能で重複する分析を避ける
- 非同期処理でユーザー体験を向上

### セキュリティ
- API キーの安全な管理
- ログに機密情報を出力しない
- 適切な権限設定とアクセス制御

この実装により、メール内容の判断や重複チェックなどの高度なAI処理が実現できます！