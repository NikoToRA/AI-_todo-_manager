
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
  analyzeEmailForTasks(emailData, existingTasks) {
    if (!existingTasks) existingTasks = [];
    
    const prompt = this._buildEmailAnalysisPrompt(emailData, existingTasks);
    
    try {
      const response = this._callGeminiAPI(prompt);
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
  analyzeCalendarForTasks(eventData, existingTasks) {
    if (!existingTasks) existingTasks = [];
    
    const prompt = this._buildCalendarAnalysisPrompt(eventData, existingTasks);
    
    try {
      const response = this._callGeminiAPI(prompt);
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
  checkSemanticDuplicate(newTask, existingTasks) {
    if (!existingTasks || existingTasks.length === 0) {
      return {
        is_duplicate: false,
        similarity_score: 0,
        reason: '既存タスクなし',
        action: 'create'
      };
    }
    
    const prompt = this._buildDuplicateCheckPrompt(newTask, existingTasks);
    
    try {
      const response = this._callGeminiAPI(prompt);
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
  _callGeminiAPI(prompt) {
    const url = this.baseUrl + '?key=' + this.apiKey;
    
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
      throw new Error('Gemini API エラー: ' + responseCode + ' - ' + responseText);
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
    const existingTasksText = existingTasks.length > 0 
      ? existingTasks.map(function(task, index) { return (index + 1) + '. ' + task.title + ' (優先度: ' + task.priority + ')'; }).join('\n')
      : 'なし';
    
    return 'あなたは日本語のタスク管理の専門家です。以下のメール内容を分析して、実行可能なタスクを抽出してください。\n\n' +
           '【メール情報】\n' +
           '件名: ' + emailData.subject + '\n' +
           '送信者: ' + emailData.from + '\n' +
           '日時: ' + new Date(emailData.date).toLocaleString('ja-JP') + '\n' +
           '本文: ' + emailData.body + '\n\n' +
           '【既存タスク】\n' + existingTasksText + '\n\n' +
           '【抽出ルール】\n' +
           '1. 明確なアクションが必要な項目のみ抽出\n' +
           '2. 期日が明記されている場合は due_date に設定（YYYY-MM-DD形式）\n' +
           '3. 緊急度・重要度から優先度を判定（高・中・低）\n' +
           '4. 既存タスクとの重複は避ける\n' +
           '5. 日本語のタスクタイトルを生成\n' +
           '6. タスクタイトルの頭に必ず「メール：」を付ける\n\n' +
           '【出力形式】\n' +
           '必ずJSON配列形式で出力してください。他の説明文は不要です：\n' +
           '[\n' +
           '  {\n' +
           '    "title": "メール：具体的なタスクタイトル（日本語）",\n' +
           '    "priority": "高",\n' +
           '    "due_date": "2024-07-27",\n' +
           '    "context": "タスクの背景情報",\n' +
           '    "source": "gmail"\n' +
           '  }\n' +
           ']\n\n' +
           'タスクが抽出できない場合は空配列 [] を返してください。';
  }
  
  /**
   * カレンダー分析用プロンプト構築
   * @private
   */
  _buildCalendarAnalysisPrompt(eventData, existingTasks) {
    const existingTasksText = existingTasks.length > 0 
      ? existingTasks.map(function(task, index) { return (index + 1) + '. ' + task.title + ' (優先度: ' + task.priority + ')'; }).join('\n')
      : 'なし';
    
    return 'あなたは日本語のタスク管理の専門家です。以下のカレンダーイベントを分析して、関連する準備タスクや事後タスクを抽出してください。\n\n' +
           '【イベント情報】\n' +
           'タイトル: ' + eventData.summary + '\n' +
           '開始時刻: ' + new Date(eventData.start).toLocaleString('ja-JP') + '\n' +
           '終了時刻: ' + new Date(eventData.end).toLocaleString('ja-JP') + '\n' +
           '場所: ' + (eventData.location || 'なし') + '\n' +
           '説明: ' + (eventData.description || 'なし') + '\n' +
           '参加者: ' + (eventData.attendees ? eventData.attendees.join(', ') : 'なし') + '\n\n' +
           '【既存タスク】\n' + existingTasksText + '\n\n' +
           '【抽出ルール】\n' +
           '1. 会議の準備タスク（資料作成、事前確認など）\n' +
           '2. 会議後のフォローアップタスク（議事録作成、アクション実行など）\n' +
           '3. イベント開始時刻を考慮した適切な期日設定\n' +
           '4. 既存タスクとの重複は避ける\n' +
           '5. 日本語のタスクタイトルを生成\n\n' +
           '【出力形式】\n' +
           '必ずJSON配列形式で出力してください。他の説明文は不要です：\n' +
           '[\n' +
           '  {\n' +
           '    "title": "具体的なタスクタイトル（日本語）",\n' +
           '    "priority": "中",\n' +
           '    "due_date": "2024-07-26",\n' +
           '    "context": "元イベント: ' + eventData.summary + '",\n' +
           '    "source": "calendar"\n' +
           '  }\n' +
           ']\n\n' +
           '関連タスクが抽出できない場合は空配列 [] を返してください。';
  }
  
  /**
   * 重複チェック用プロンプト構築
   * @private
   */
  _buildDuplicateCheckPrompt(newTask, existingTasks) {
    const existingTasksText = existingTasks.map(function(task, index) {
      return (index + 1) + '. ' + task.title + ' (優先度: ' + task.priority + ', 期日: ' + (task.due_date || 'なし') + ')';
    }).join('\n');
    
    return '以下の新しいタスクが、既存のタスクと重複しているかを判定してください。\n\n' +
           '【新しいタスク】\n' +
           'タイトル: ' + newTask.title + '\n' +
           '優先度: ' + newTask.priority + '\n' +
           '期日: ' + (newTask.due_date || 'なし') + '\n' +
           'コンテキスト: ' + (newTask.context || 'なし') + '\n\n' +
           '【既存タスク一覧】\n' + existingTasksText + '\n\n' +
           '【判定基準】\n' +
           '1. タスクの内容が実質的に同じ\n' +
           '2. 期日が近い（±3日以内）\n' +
           '3. 優先度が同程度\n\n' +
           '【出力形式】\n' +
           '必ずJSON形式で出力してください。他の説明文は不要です：\n' +
           '{\n' +
           '  "is_duplicate": false,\n' +
           '  "duplicate_task_index": null,\n' +
           '  "similarity_score": 0.2,\n' +
           '  "reason": "判定理由の説明",\n' +
           '  "action": "create"\n' +
           '}\n\n' +
           'actionの値は以下のいずれか：\n' +
           '- "skip": 作成しない（重複のため）\n' +
           '- "update": 既存タスクを更新\n' +
           '- "create": 新規作成';
  }
  
  /**
   * タスク抽出レスポンス解析
   * @private
   */
  _parseTaskResponse(response) {
    try {
      // JSONの抽出（マークダウンコードブロックやその他のテキストを除去）
      var jsonText = response.trim();
      
      // ```json ``` の除去
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // 配列の開始を探す
      var arrayStart = jsonText.indexOf('[');
      var arrayEnd = jsonText.lastIndexOf(']');
      
      if (arrayStart === -1 || arrayEnd === -1) {
        console.warn('[GeminiAnalyzer] JSON配列が見つかりません');
        return [];
      }
      
      jsonText = jsonText.substring(arrayStart, arrayEnd + 1);
      
      var tasks = JSON.parse(jsonText);
      
      // バリデーション
      if (!Array.isArray(tasks)) {
        console.warn('[GeminiAnalyzer] レスポンスが配列ではありません');
        return [];
      }
      
      var validTasks = [];
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (task.title && task.priority && ['高', '中', '低'].indexOf(task.priority) !== -1) {
          validTasks.push(task);
        }
      }
      
      return validTasks;
      
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
      var jsonText = response.trim();
      
      // ```json ``` の除去
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // オブジェクトの開始を探す
      var objStart = jsonText.indexOf('{');
      var objEnd = jsonText.lastIndexOf('}');
      
      if (objStart === -1 || objEnd === -1) {
        return { is_duplicate: false, action: 'create' };
      }
      
      jsonText = jsonText.substring(objStart, objEnd + 1);
      
      var result = JSON.parse(jsonText);
      
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
    var actionKeywords = ['確認', '作成', '準備', '送信', '提出', '完了', '実行', '検討', '対応'];
    var tasks = [];
    
    // 件名からタスク抽出
    for (var i = 0; i < actionKeywords.length; i++) {
      if (emailData.subject.indexOf(actionKeywords[i]) !== -1) {
        tasks.push({
          title: 'メール：' + emailData.subject + 'への対応',
          priority: '中',
          due_date: null,
          context: 'メールからの自動抽出: ' + emailData.from,
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
    var tasks = [];
    var eventDate = new Date(eventData.start);
    var prepDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 1日前
    
    // 会議の場合は準備タスクを生成
    if (eventData.summary.indexOf('会議') !== -1 || 
        eventData.summary.indexOf('ミーティング') !== -1 || 
        eventData.summary.indexOf('打ち合わせ') !== -1) {
      tasks.push({
        title: eventData.summary + 'の準備',
        priority: '中',
        due_date: prepDate.toISOString().split('T')[0],
        context: '元イベント: ' + eventData.summary,
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
    for (var i = 0; i < existingTasks.length; i++) {
      var existing = existingTasks[i];
      var similarity = this._calculateStringSimilarity(newTask.title, existing.title);
      
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
    var longer = str1.length > str2.length ? str1 : str2;
    var shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    var editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  /**
   * レーベンシュタイン距離計算
   * @private
   */
  _levenshteinDistance(str1, str2) {
    var matrix = [];
    
    for (var i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (var j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (var i = 1; i <= str2.length; i++) {
      for (var j = 1; j <= str1.length; j++) {
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

/**
 * テスト用関数 - Gemini統合テスト
 */
function testGeminiIntegration() {
  console.log('=== Gemini統合テスト ===');
  
  try {
    // 1. 設定取得
    var config = ConfigManager.getConfig();
    
    if (!config.geminiApiKey) {
      console.error('❌ Gemini APIキーが設定されていません');
      return;
    }
    
    var analyzer = new GeminiAnalyzer(config.geminiApiKey);
    
    // 2. メール分析テスト
    console.log('1. メール分析テスト');
    var testEmail = {
      subject: "プロジェクト資料の確認依頼",
      from: "client@example.com",
      date: new Date(),
      body: "添付の資料を確認して、来週の会議までにフィードバックをお願いします。"
    };
    
    var emailTasks = analyzer.analyzeEmailForTasks(testEmail, []);
    console.log('メール分析結果:', emailTasks);
    
    // 3. カレンダー分析テスト
    console.log('2. カレンダー分析テスト');
    var testEvent = {
      summary: "プロジェクト会議",
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明日
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 明日+1時間
      location: "会議室A",
      description: "Q3計画の確認",
      attendees: ["user@example.com"]
    };
    
    var calendarTasks = analyzer.analyzeCalendarForTasks(testEvent, []);
    console.log('カレンダー分析結果:', calendarTasks);
    
    // 4. 重複チェックテスト
    if (emailTasks.length > 0) {
      console.log('3. 重複チェックテスト');
      var duplicateCheck = analyzer.checkSemanticDuplicate(emailTasks[0], calendarTasks);
      console.log('重複チェック結果:', duplicateCheck);
    }
    
    console.log('✅ Gemini統合テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 簡単実行用関数
 */
function testGemini() {
  testGeminiIntegration();
}