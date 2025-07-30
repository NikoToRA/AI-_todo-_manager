# Gemini API統合ガイド

## 🤖 Gemini APIを使用したAI統合

### MCPの対応状況
現在、Gemini APIは直接的なMCP（Model Context Protocol）サポートはありませんが、以下の方法で統合可能です：

1. **Gemini API直接統合**（推奨）
2. **Function Calling機能**を活用した疑似MCP実装
3. **Google Apps Script内蔵のGoogle APIサービス**との連携

## 🎯 Gemini API統合実装

### 1. GeminiAnalyzer クラス実装

**GeminiAnalyzer.gs**
```javascript
/**
 * Gemini API統合クラス
 * 要件2.1-2.4対応: AI分析による高度なタスク抽出
 */
class GeminiAnalyzer {
  
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    this.model = 'gemini-1.5-pro';
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
      const response = await this._callGeminiAPI(prompt);
      return this._parseTaskResponse(response);
    } catch (error) {
      console.error('[GeminiAnalyzer] メール分析エラー:', error.message);
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
      const response = await this._callGeminiAPI(prompt);
      return this._parseTaskResponse(response);
    } catch (error) {
      console.error('[GeminiAnalyzer] カレンダー分析エラー:', error.message);
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
      const response = await this._callGeminiAPI(prompt);
      return this._parseDuplicateResponse(response);
    } catch (error) {
      console.error('[GeminiAnalyzer] 重複チェックエラー:', error.message);
      // フォールバック: 基本的な文字列比較
      return this._fallbackDuplicateCheck(newTask, existingTasks);
    }
  }
  
  /**
   * Gemini API呼び出し
   * @private
   */
  async _callGeminiAPI(prompt) {
    const url = `${this.baseUrl}?key=${this.apiKey}`;
    
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30000
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      throw new Error(`Gemini API エラー: ${responseCode} - ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Gemini API レスポンスが不正です');
    }
    
    return data.candidates[0].content.parts[0].text;
  }
  
  /**
   * メール分析用プロンプト構築
   * @private
   */
  _buildEmailAnalysisPrompt(emailData, existingTasks) {
    return `
あなたは日本語のタスク管理の専門家です。以下のメール内容を分析して、実行可能なタスクを抽出してください。

【メール情報】
件名: ${emailData.subject}
送信者: ${emailData.from}
日時: ${new Date(emailData.date).toLocaleString('ja-JP')}
本文: ${emailData.body}

【既存タスク】
${existingTasks.map(task => `- ${task.title} (優先度: ${task.priority})`).join('\n') || 'なし'}

【抽出ルール】
1. 明確なアクションが必要な項目のみ抽出
2. 期日が明記されている場合は due_date に設定（YYYY-MM-DD形式）
3. 緊急度・重要度から優先度を判定（高・中・低）
4. 既存タスクとの重複は避ける
5. 日本語のタスクタイトルを生成

【出力形式】
必ずJSON配列形式で出力してください。他の説明文は不要です：
[
  {
    "title": "具体的なタスクタイトル（日本語）",
    "priority": "高",
    "due_date": "2024-07-27",
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
あなたは日本語のタスク管理の専門家です。以下のカレンダーイベントを分析して、関連する準備タスクや事後タスクを抽出してください。

【イベント情報】
タイトル: ${eventData.summary}
開始時刻: ${new Date(eventData.start).toLocaleString('ja-JP')}
終了時刻: ${new Date(eventData.end).toLocaleString('ja-JP')}
場所: ${eventData.location || 'なし'}
説明: ${eventData.description || 'なし'}
参加者: ${eventData.attendees ? eventData.attendees.join(', ') : 'なし'}

【既存タスク】
${existingTasks.map(task => `- ${task.title} (優先度: ${task.priority})`).join('\n') || 'なし'}

【抽出ルール】
1. 会議の準備タスク（資料作成、事前確認など）
2. 会議後のフォローアップタスク（議事録作成、アクション実行など）
3. イベント開始時刻を考慮した適切な期日設定
4. 既存タスクとの重複は避ける
5. 日本語のタスクタイトルを生成

【出力形式】
必ずJSON配列形式で出力してください。他の説明文は不要です：
[
  {
    "title": "具体的なタスクタイトル（日本語）",
    "priority": "中",
    "due_date": "2024-07-26",
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
).join('\n') || 'なし'}

【判定基準】
1. タスクの内容が実質的に同じ
2. 期日が近い（±3日以内）
3. 優先度が同程度

【出力形式】
必ずJSON形式で出力してください。他の説明文は不要です：
{
  "is_duplicate": false,
  "duplicate_task_index": null,
  "similarity_score": 0.2,
  "reason": "判定理由の説明",
  "action": "create"
}

actionの値は以下のいずれか：
- "skip": 作成しない（重複のため）
- "update": 既存タスクを更新
- "create": 新規作成
`;
  }
  
  /**
   * タスク抽出レスポンス解析
   * @private
   */
  _parseTaskResponse(response) {
    try {
      // JSONの抽出（マークダウンコードブロックやその他のテキストを除去）
      let jsonText = response.trim();
      
      // ```json ``` の除去
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // 配列の開始を探す
      const arrayStart = jsonText.indexOf('[');
      const arrayEnd = jsonText.lastIndexOf(']');
      
      if (arrayStart === -1 || arrayEnd === -1) {
        console.warn('[GeminiAnalyzer] JSON配列が見つかりません');
        return [];
      }
      
      jsonText = jsonText.substring(arrayStart, arrayEnd + 1);
      
      const tasks = JSON.parse(jsonText);
      
      // バリデーション
      if (!Array.isArray(tasks)) {
        console.warn('[GeminiAnalyzer] レスポンスが配列ではありません');
        return [];
      }
      
      return tasks.filter(task => 
        task.title && 
        task.priority && 
        ['高', '中', '低'].includes(task.priority)
      );
      
    } catch (error) {
      console.error('[GeminiAnalyzer] レスポンス解析エラー:', error.message);
      console.error('レスポンス内容:', response);
      return [];
    }
  }
  
  /**
   * 重複チェックレスポンス解析
   * @private
   */
  _parseDuplicateResponse(response) {
    try {
      let jsonText = response.trim();
      
      // ```json ``` の除去
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // オブジェクトの開始を探す
      const objStart = jsonText.indexOf('{');
      const objEnd = jsonText.lastIndexOf('}');
      
      if (objStart === -1 || objEnd === -1) {
        return { is_duplicate: false, action: 'create' };
      }
      
      jsonText = jsonText.substring(objStart, objEnd + 1);
      
      const result = JSON.parse(jsonText);
      
      // デフォルト値の設定
      return {
        is_duplicate: result.is_duplicate || false,
        duplicate_task_index: result.duplicate_task_index || null,
        similarity_score: result.similarity_score || 0,
        reason: result.reason || '判定なし',
        action: result.action || 'create'
      };
      
    } catch (error) {
      console.error('[GeminiAnalyzer] 重複チェックレスポンス解析エラー:', error.message);
      console.error('レスポンス内容:', response);
      return { is_duplicate: false, action: 'create' };
    }
  }
  
  /**
   * フォールバック: ルールベースメール分析
   * @private
   */
  _fallbackEmailAnalysis(emailData) {
    const actionKeywords = ['確認', '作成', '準備', '送信', '提出', '完了', '実行', '検討', '対応'];
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
    if (eventData.summary.includes('会議') || 
        eventData.summary.includes('ミーティング') || 
        eventData.summary.includes('打ち合わせ')) {
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

## 🔧 設定での切り替え

**Config.gs（Gemini対応版）**
```javascript
/**
 * AI統合モード
 */
const AI_PROVIDER = {
  DISABLED: 'disabled',
  CLAUDE: 'claude',
  GEMINI: 'gemini'
};

class ConfigManager {
  
  static getConfig() {
    const props = PropertiesService.getScriptProperties();
    
    return {
      // 既存の設定...
      aiProvider: props.getProperty('AI_PROVIDER') || AI_PROVIDER.GEMINI,
      claudeApiKey: props.getProperty('CLAUDE_API_KEY'),
      geminiApiKey: props.getProperty('GEMINI_API_KEY'),
      enableAiAnalysis: props.getProperty('ENABLE_AI_ANALYSIS') === 'true'
    };
  }
  
  static setConfig(config) {
    const props = PropertiesService.getScriptProperties();
    
    // 既存の設定処理...
    if (config.aiProvider) props.setProperty('AI_PROVIDER', config.aiProvider);
    if (config.geminiApiKey) props.setProperty('GEMINI_API_KEY', config.geminiApiKey);
    if (config.claudeApiKey) props.setProperty('CLAUDE_API_KEY', config.claudeApiKey);
  }
}
```

## 🎯 TaskExtractorでの統合

**TaskExtractor.gs（Gemini対応版）**
```javascript
class TaskExtractor {
  
  constructor(config) {
    this.config = config;
    this.notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // AI分析エンジンの初期化
    if (config.enableAiAnalysis) {
      switch (config.aiProvider) {
        case AI_PROVIDER.CLAUDE:
          if (config.claudeApiKey) {
            this.aiAnalyzer = new ClaudeAnalyzer(config.claudeApiKey);
          }
          break;
        case AI_PROVIDER.GEMINI:
          if (config.geminiApiKey) {
            this.aiAnalyzer = new GeminiAnalyzer(config.geminiApiKey);
          }
          break;
        default:
          this.aiAnalyzer = null;
      }
    }
  }
  
  // 既存のメソッドはそのまま使用可能
  // this.aiAnalyzer が GeminiAnalyzer または ClaudeAnalyzer のインスタンスになる
}
```

## 🚀 Gemini APIの利点

### ✅ メリット
1. **取得しやすい**: Google Cloud Consoleで簡単に取得
2. **無料枠が大きい**: 月間15リクエスト/分まで無料
3. **日本語対応**: 日本語の理解が優秀
4. **レスポンス速度**: 比較的高速
5. **Google サービス統合**: GASとの親和性が高い

### ❌ デメリット
1. **MCP非対応**: 直接的なMCP統合はなし
2. **Function Calling制限**: Claude程の柔軟性はない

## 🔧 実装手順

### 1. Gemini API キー取得
```
1. Google AI Studio (https://makersuite.google.com/) にアクセス
2. 「Get API key」をクリック
3. 新しいプロジェクトを作成またはプロジェクトを選択
4. API キーを生成・コピー
```

### 2. GASでの設定
```javascript
// 設定例
ConfigManager.setConfig({
  aiProvider: AI_PROVIDER.GEMINI,
  geminiApiKey: 'YOUR_GEMINI_API_KEY',
  enableAiAnalysis: true
});
```

### 3. テスト実行
```javascript
function testGeminiIntegration() {
  const config = ConfigManager.getConfig();
  const analyzer = new GeminiAnalyzer(config.geminiApiKey);
  
  // テストデータ
  const testEmail = {
    subject: "プロジェクト資料の確認依頼",
    from: "client@example.com",
    date: new Date(),
    body: "添付の資料を確認して、来週の会議までにフィードバックをお願いします。"
  };
  
  // AI分析実行
  analyzer.analyzeEmailForTasks(testEmail, [])
    .then(tasks => {
      console.log('抽出されたタスク:', tasks);
    })
    .catch(error => {
      console.error('エラー:', error);
    });
}
```

## 💡 推奨設定

Gemini APIの方が取りやすく、日本語対応も優秀なので、**Gemini統合を推奨**します！

```javascript
// 推奨設定
const RECOMMENDED_CONFIG = {
  aiProvider: AI_PROVIDER.GEMINI,
  geminiApiKey: 'your_gemini_api_key',
  enableAiAnalysis: true,
  enableVoiceInput: true,
  enableGmailAnalysis: true
};
```

この実装により、Gemini APIを使用した高度なAI分析が可能になります！MCPは直接サポートされていませんが、GAS内でのAPI統合により同等の機能を実現できます。