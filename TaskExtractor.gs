/**
 * タスク抽出エンジンクラス
 * 要件1.1-1.3対応: 多様な入力方法からのタスク抽出
 */
class TaskExtractor {
  
  constructor(config) {
    this.config = config;
    this.notionClient = new NotionClient(config);
    this.duplicateChecker = new DuplicateChecker(this.notionClient);
    this._validateConfig();
  }
  
  /**
   * カレンダーからタスクを抽出
   * @param {Date} startDate 開始日
   * @param {Date} endDate 終了日
   * @returns {Array} 抽出されたタスク一覧
   */
  extractFromCalendar(startDate, endDate) {
    try {
      console.log(`[TaskExtractor.extractFromCalendar] 開始: ${startDate} - ${endDate}`);
      
      const events = CalendarApp.getDefaultCalendar().getEvents(startDate, endDate);
      const tasks = [];
      
      for (const event of events) {
        console.log(`[TaskExtractor] イベント処理中: ${event.getTitle()}`);
        
        const extractedTasks = this._analyzeCalendarEvent(event);
        tasks.push(...extractedTasks);
      }
      
      // 重複チェックと Notion登録
      const processedTasks = this._processAndCreateTasks(tasks, 'calendar');
      
      console.log(`[TaskExtractor.extractFromCalendar] 完了: ${processedTasks.length}件のタスクを処理`);
      return processedTasks;
      
    } catch (error) {
      console.error(`[TaskExtractor.extractFromCalendar] エラー: ${error.message}`);
      throw new Error(`カレンダー抽出エラー: ${error.message}`);
    }
  }
  
  /**
   * Gmailからタスクを抽出
   * @param {string} query 検索クエリ
   * @param {number} maxResults 最大取得件数
   * @returns {Array} 抽出されたタスク一覧
   */
  extractFromGmail(query = 'is:unread', maxResults = 50) {
    try {
      console.log(`[TaskExtractor.extractFromGmail] 開始: query=${query}`);
      
      if (!this.config.enableGmailAnalysis) {
        console.log('[TaskExtractor] Gmail分析が無効化されています');
        return [];
      }
      
      const threads = GmailApp.search(query, 0, maxResults);
      const tasks = [];
      
      for (const thread of threads) {
        const messages = thread.getMessages();
        for (const message of messages) {
          console.log(`[TaskExtractor] メール処理中: ${message.getSubject()}`);
          
          const extractedTasks = this._analyzeGmailMessage(message);
          tasks.push(...extractedTasks);
        }
      }
      
      // 重複チェックと Notion登録
      const processedTasks = this._processAndCreateTasks(tasks, 'gmail');
      
      console.log(`[TaskExtractor.extractFromGmail] 完了: ${processedTasks.length}件のタスクを処理`);
      return processedTasks;
      
    } catch (error) {
      console.error(`[TaskExtractor.extractFromGmail] エラー: ${error.message}`);
      throw new Error(`Gmail抽出エラー: ${error.message}`);
    }
  }
  
  /**
   * 音声入力からタスクを抽出
   * @param {string} transcription 音声認識テキスト
   * @returns {Array} 抽出されたタスク一覧
   */
  extractFromVoice(transcription) {
    try {
      console.log(`[TaskExtractor.extractFromVoice] 開始`);
      
      if (!this.config.enableVoiceInput) {
        console.log('[TaskExtractor] 音声入力が無効化されています');
        return [];
      }
      
      if (!transcription || transcription.trim().length === 0) {
        console.log('[TaskExtractor] 音声認識テキストが空です');
        return [];
      }
      
      const tasks = this._analyzeVoiceTranscription(transcription);
      
      // 重複チェックと Notion登録
      const processedTasks = this._processAndCreateTasks(tasks, 'voice');
      
      console.log(`[TaskExtractor.extractFromVoice] 完了: ${processedTasks.length}件のタスクを処理`);
      return processedTasks;
      
    } catch (error) {
      console.error(`[TaskExtractor.extractFromVoice] エラー: ${error.message}`);
      throw new Error(`音声入力抽出エラー: ${error.message}`);
    }
  }
  
  /**
   * カレンダーイベントを分析してタスクを抽出
   * @param {CalendarEvent} event カレンダーイベント
   * @returns {Array} 抽出されたタスク一覧
   */
  _analyzeCalendarEvent(event) {
    const tasks = [];
    const title = event.getTitle();
    const description = event.getDescription() || '';
    const startTime = event.getStartTime();
    const endTime = event.getEndTime();
    const location = event.getLocation() || '';
    
    // 基本的なルールベース抽出
    const taskKeywords = [
      '準備', '確認', '作成', '更新', '整理', '調査', '検討', '検証',
      '実装', '修正', '改善', '最適化', 'テスト', 'レビュー', '承認',
      '送信', '提出', '報告', '共有', '配布', '公開', '発表'
    ];
    
    // イベントタイトルにタスクキーワードが含まれている場合
    const hasTaskKeyword = taskKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    
    if (hasTaskKeyword || this._shouldExtractFromEvent(event)) {
      const task = {
        title: this._generateTaskTitle(title, description),
        type: 'task',
        priority: this._determinePriority(event),
        due_date: this._calculateDueDate(startTime),
        source: 'calendar',
        status: '未着手',
        created_by: 'auto',
        original_event: title,
        context: this._buildContext(event)
      };
      
      tasks.push(task);
    }
    
    // 会議の場合は会議準備タスクを追加
    if (this._isMeeting(event)) {
      const prepTask = {
        title: `${title} - 会議準備`,
        type: 'task',
        priority: this._determinePriority(event),
        due_date: this._calculateDueDate(startTime, -1), // 1日前
        source: 'calendar',
        status: '未着手',
        created_by: 'auto',
        original_event: title,
        context: `会議準備タスク: ${location}`
      };
      
      tasks.push(prepTask);
    }
    
    return tasks;
  }
  
  /**
   * Gmailメッセージを分析してタスクを抽出
   * @param {GmailMessage} message Gmailメッセージ
   * @returns {Array} 抽出されたタスク一覧
   */
  _analyzeGmailMessage(message) {
    const tasks = [];
    const subject = message.getSubject();
    const body = message.getPlainBody();
    const sender = message.getFrom();
    const date = message.getDate();
    
    // アクションアイテムキーワード
    const actionKeywords = [
      '確認してください', '確認をお願い', '対応してください', '対応をお願い',
      '準備してください', '準備をお願い', '送付してください', '送付をお願い',
      '作成してください', '作成をお願い', '提出してください', '提出をお願い',
      '返信してください', '返信をお願い', '回答してください', '回答をお願い'
    ];
    
    const hasActionKeyword = actionKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
    
    if (hasActionKeyword || message.isUnread()) {
      const task = {
        title: this._generateTaskFromEmail(subject, body),
        type: 'task',
        priority: this._determineEmailPriority(message),
        due_date: this._extractDueDateFromEmail(body),
        source: 'gmail',
        status: '未着手',
        created_by: 'auto',
        original_event: subject,
        context: `差出人: ${sender}`
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }
  
  /**
   * 音声認識テキストを分析してタスクを抽出
   * @param {string} transcription 音声認識テキスト
   * @returns {Array} 抽出されたタスク一覧
   */
  _analyzeVoiceTranscription(transcription) {
    const tasks = [];
    
    // 音声入力から複数のタスクを抽出
    const sentences = transcription.split(/[。．]/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      if (this._isTaskSentence(sentence)) {
        const task = {
          title: sentence.trim(),
          type: 'task',
          priority: this._determineVoicePriority(sentence),
          due_date: this._extractDueDateFromVoice(sentence),
          source: 'voice',
          status: '未着手',
          created_by: 'auto',
          original_event: transcription,
          context: '音声入力から抽出'
        };
        
        tasks.push(task);
      }
    }
    
    return tasks;
  }
  
  /**
   * タスクの重複チェックとNotion登録処理
   * @param {Array} tasks タスク一覧
   * @param {string} source データソース
   * @returns {Array} 処理結果
   */
  _processAndCreateTasks(tasks, source) {
    const processedTasks = [];
    
    try {
      // 既存タスクを取得
      const existingTasks = this.notionClient.getExistingTasks({ source });
      
      for (const task of tasks) {
        try {
          // 重複チェック
          const isDuplicate = this.duplicateChecker.checkBasicDuplicate(task, existingTasks);
          
          if (!isDuplicate) {
            // Notionに作成
            const result = this.notionClient.createTask(task);
            task.created = true;
            task.notionId = result.id;
            
            processedTasks.push(task);
          } else {
            console.log(`[TaskExtractor] 重複スキップ: ${task.title}`);
            task.created = false;
            task.skipped = true;
            processedTasks.push(task);
          }
          
        } catch (error) {
          console.error(`[TaskExtractor] タスク処理エラー: ${error.message}`);
          task.created = false;
          task.error = error.message;
          processedTasks.push(task);
        }
      }
      
    } catch (error) {
      console.error(`[TaskExtractor] 既存タスク取得エラー: ${error.message}`);
      // 既存タスク取得に失敗した場合は、重複チェックなしで処理続行
      for (const task of tasks) {
        try {
          const result = this.notionClient.createTask(task);
          task.created = true;
          task.notionId = result.id;
          processedTasks.push(task);
        } catch (createError) {
          console.error(`[TaskExtractor] タスク作成エラー: ${createError.message}`);
          task.created = false;
          task.error = createError.message;
          processedTasks.push(task);
        }
      }
    }
    
    return processedTasks;
  }
  
  /**
   * イベントからタスクを抽出すべきか判断
   */
  _shouldExtractFromEvent(event) {
    const title = event.getTitle().toLowerCase();
    const excludeKeywords = ['休暇', '休み', '移動', '昼食', '休憩'];
    
    return !excludeKeywords.some(keyword => title.includes(keyword));
  }
  
  /**
   * 会議かどうかを判断
   */
  _isMeeting(event) {
    const title = event.getTitle().toLowerCase();
    const meetingKeywords = ['会議', 'mtg', 'meeting', '打ち合わせ', '相談'];
    
    return meetingKeywords.some(keyword => title.includes(keyword)) ||
           event.getGuestList().length > 0;
  }
  
  /**
   * 優先度を判定
   */
  _determinePriority(event) {
    const title = event.getTitle().toLowerCase();
    const description = event.getDescription().toLowerCase();
    
    if (title.includes('緊急') || title.includes('至急') || description.includes('緊急')) {
      return '高';
    }
    if (title.includes('重要') || description.includes('重要')) {
      return '高';
    }
    
    return '中';
  }
  
  /**
   * タスクタイトルを生成
   */
  _generateTaskTitle(eventTitle, description) {
    // イベントタイトルから適切なタスクタイトルを生成
    const cleanTitle = eventTitle.replace(/【.*?】/g, '').trim();
    
    if (cleanTitle.includes('準備')) {
      return cleanTitle;
    }
    
    return `${cleanTitle} - 準備・フォローアップ`;
  }
  
  /**
   * コンテキスト情報を構築
   */
  _buildContext(event) {
    const parts = [];
    
    if (event.getLocation()) {
      parts.push(`場所: ${event.getLocation()}`);
    }
    
    if (event.getGuestList().length > 0) {
      parts.push(`参加者: ${event.getGuestList().length}名`);
    }
    
    if (event.getDescription()) {
      parts.push(`詳細: ${event.getDescription().substring(0, 100)}...`);
    }
    
    return parts.join(' | ');
  }
  
  /**
   * 期日を計算
   */
  _calculateDueDate(eventDate, dayOffset = 0) {
    const dueDate = new Date(eventDate);
    dueDate.setDate(dueDate.getDate() + dayOffset);
    return dueDate;
  }
  
  /**
   * 音声入力がタスクかどうかを判断
   */
  _isTaskSentence(sentence) {
    const taskIndicators = [
      'する', 'やる', '準備', '確認', '作成', '送る', '連絡',
      'しなければ', 'する必要', 'しないと', 'やらなければ'
    ];
    
    return taskIndicators.some(indicator => sentence.includes(indicator));
  }
  
  /**
   * メールからタスクタイトルを生成
   */
  _generateTaskFromEmail(subject, body) {
    if (subject.includes('Re:')) {
      return `${subject.replace('Re:', '').trim()} - 返信対応`;
    }
    
    return `${subject} - 対応・確認`;
  }
  
  /**
   * メールの優先度を判定
   */
  _determineEmailPriority(message) {
    const subject = message.getSubject().toLowerCase();
    const body = message.getPlainBody().toLowerCase();
    
    if (subject.includes('緊急') || subject.includes('至急') || 
        body.includes('緊急') || body.includes('至急')) {
      return '高';
    }
    
    return '中';
  }
  
  /**
   * メール本文から期日を抽出
   */
  _extractDueDateFromEmail(body) {
    // 簡単な期日パターンマッチング
    const datePatterns = [
      /(\d{1,2}月\d{1,2}日)/,
      /(\d{4}\/\d{1,2}\/\d{1,2})/,
      /(明日|明後日)/
    ];
    
    for (const pattern of datePatterns) {
      const match = body.match(pattern);
      if (match) {
        // 日付解析ロジック（簡略化）
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 一週間後をデフォルト
      }
    }
    
    return null;
  }
  
  /**
   * 音声入力の優先度を判定
   */
  _determineVoicePriority(sentence) {
    if (sentence.includes('緊急') || sentence.includes('急いで')) {
      return '高';
    }
    
    return '中';
  }
  
  /**
   * 音声入力から期日を抽出
   */
  _extractDueDateFromVoice(sentence) {
    if (sentence.includes('今日')) {
      return new Date();
    }
    if (sentence.includes('明日')) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    if (sentence.includes('来週')) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    
    return null;
  }
  
  /**
   * 設定バリデーション
   */
  _validateConfig() {
    if (!this.config) {
      throw new Error('設定が指定されていません');
    }
  }
}