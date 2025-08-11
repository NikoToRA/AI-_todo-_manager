/**
 * タスク抽出エンジンクラス（ES5互換版）
 */
function TaskExtractor(config) {
  this.config = config;
  this.notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
  this.duplicateChecker = new TaskDuplicateChecker(this.notionClient);
  
  // ProcessedTrackerが存在しない場合は基本的な管理機能のみ
  this.processedTracker = null;
  try {
    this.processedTracker = new ProcessedTracker();
  } catch (error) {
    console.warn('[TaskExtractor] ProcessedTracker利用不可 - 基本モードで実行');
  }
}

/**
 * カレンダーからタスクを抽出
 */
TaskExtractor.prototype.extractFromCalendar = function(startDate, endDate) {
  try {
    console.log('[TaskExtractor.extractFromCalendar] 開始: ' + startDate + ' - ' + endDate);
    
    // 全カレンダーからイベントを取得
    var calendars = CalendarApp.getAllCalendars();
    console.log('[TaskExtractor] 検索対象カレンダー数: ' + calendars.length + '件');
    
    var allEvents = [];
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      try {
        var calendarEvents = calendar.getEvents(startDate, endDate);
        if (calendarEvents.length > 0) {
          console.log('[TaskExtractor] カレンダー「' + calendar.getName() + '」: ' + calendarEvents.length + '件のイベント');
          allEvents = allEvents.concat(calendarEvents);
        }
      } catch (error) {
        console.warn('[TaskExtractor] カレンダー「' + calendar.getName() + '」でエラー: ' + error.message);
      }
    }
    
    var tasks = [];
    var processedCount = 0;
    var skippedCount = 0;
    
    for (var j = 0; j < allEvents.length; j++) {
      var event = allEvents[j];
      console.log('[TaskExtractor] イベント処理中: ' + event.getTitle());
      
      // 処理済みチェック（ProcessedTrackerが使える場合のみ）
      if (this.processedTracker && this.processedTracker.isCalendarEventProcessed(event)) {
        console.log('[TaskExtractor] スキップ（処理済み）: ' + event.getTitle());
        skippedCount++;
        continue;
      }
      
      var extractedTasks = this.analyzeCalendarEvent(event);
      
      if (extractedTasks.length > 0) {
        tasks = tasks.concat(extractedTasks);
        
        // 処理済みマークを追加（ProcessedTrackerが使える場合のみ）
        if (this.processedTracker) {
          this.processedTracker.markCalendarEventAsProcessed(event, extractedTasks);
        }
        processedCount++;
      } else {
        // タスクが抽出されなかった場合も処理済みとしてマーク（再処理防止）
        if (this.processedTracker) {
          this.processedTracker.markCalendarEventAsProcessed(event, []);
        }
      }
    }
    
    // 重複チェックと Notion登録
    var processedTasks = this.processAndCreateTasks(tasks, 'calendar');
    
    console.log('[TaskExtractor.extractFromCalendar] 完了:');
    console.log('  - 処理したイベント: ' + processedCount + '件');
    console.log('  - スキップしたイベント: ' + skippedCount + '件');
    console.log('  - 抽出したタスク: ' + tasks.length + '件');
    console.log('  - 最終的に処理したタスク: ' + processedTasks.length + '件');
    
    return processedTasks;
    
  } catch (error) {
    console.error('[TaskExtractor.extractFromCalendar] エラー: ' + error.message);
    throw new Error('カレンダー抽出エラー: ' + error.message);
  }
};

/**
 * Gmailからタスクを抽出
 */
TaskExtractor.prototype.extractFromGmail = function(query, maxResults) {
  try {
    // 設定から検索クエリを構築
    var gmailDateRangeDays = this.config.gmailDateRangeDays || 3;
    var gmailSearchQuery = this.config.gmailSearchQuery || ('in:inbox -is:archived newer_than:' + gmailDateRangeDays + 'd');
    
    query = query || gmailSearchQuery;
    maxResults = maxResults || (this.config.gmailMaxResults || 30);
    
    console.log('[TaskExtractor.extractFromGmail] 開始: query=' + query);
    
    if (!this.config.enableGmailAnalysis) {
      console.log('[TaskExtractor] Gmail分析が無効化されています');
      return [];
    }
    
    var threads = GmailApp.search(query, 0, maxResults);
    var tasks = [];
    var processedCount = 0;
    var skippedCount = 0;
    
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var messages = thread.getMessages();
      
      for (var j = 0; j < messages.length; j++) {
        var message = messages[j];
        console.log('[TaskExtractor] メール処理中: ' + message.getSubject());
        
        // 処理済みチェック（ProcessedTrackerが使える場合のみ）
        if (this.processedTracker && this.processedTracker.isGmailMessageProcessed && this.processedTracker.isGmailMessageProcessed(message)) {
          console.log('[TaskExtractor] スキップ（処理済み）: ' + message.getSubject());
          skippedCount++;
          continue;
        }
        
        var extractedTasks = this.analyzeGmailMessage(message);
        
        if (extractedTasks.length > 0) {
          tasks = tasks.concat(extractedTasks);
          
          // 処理済みマークを追加（ProcessedTrackerが使える場合のみ）
          if (this.processedTracker && this.processedTracker.markGmailMessageAsProcessed) {
            this.processedTracker.markGmailMessageAsProcessed(message, extractedTasks);
          }
          processedCount++;
        } else {
          // タスクが抽出されなかった場合も処理済みとしてマーク（再処理防止）
          if (this.processedTracker && this.processedTracker.markGmailMessageAsProcessed) {
            this.processedTracker.markGmailMessageAsProcessed(message, []);
          }
        }
      }
    }
    
    // 重複チェックと Notion登録
    var processedTasks = this.processAndCreateTasks(tasks, 'gmail');
    
    console.log('[TaskExtractor.extractFromGmail] 完了:');
    console.log('  - 処理したメッセージ: ' + processedCount + '件');
    console.log('  - スキップしたメッセージ: ' + skippedCount + '件');
    console.log('  - 抽出したタスク: ' + tasks.length + '件');
    console.log('  - 最終的に処理したタスク: ' + processedTasks.length + '件');
    
    return processedTasks;
    
  } catch (error) {
    console.error('[TaskExtractor.extractFromGmail] エラー: ' + error.message);
    throw new Error('Gmail抽出エラー: ' + error.message);
  }
};

/**
 * カレンダーイベントを分析してタスクを抽出
 */
TaskExtractor.prototype.analyzeCalendarEvent = function(event) {
  var title = event.getTitle();
  var description = event.getDescription() || '';
  var startTime = event.getStartTime();
  var location = event.getLocation() || '';
  
  console.log('[TaskExtractor.analyzeCalendarEvent] 全イベント抽出: "' + title + '"');
  
  // 繰り返しイベント対応：タスクタイトルに日付を含める
  var eventDate = startTime.toISOString().split('T')[0]; // YYYY-MM-DD形式
  var taskTitle = title + ' (' + eventDate + ')';
  
  // 全てのカレンダーイベントを無条件でタスクとして抽出
  var task = {
    title: taskTitle, // 日付付きタイトル
    type: 'task',
    priority: this.determinePriority(event),
    due_date: this.calculateDueDate(startTime),
    source: 'calendar',
    status: '未着手',
    created_by: 'auto',
    original_event: title, // 元のタイトルは保持
    context: this.buildContext(event)
  };
  
  return [task]; // 必ず1つのタスクを返す
};

/**
 * Gmailメッセージを分析してタスクを抽出
 */
TaskExtractor.prototype.analyzeGmailMessage = function(message) {
  var tasks = [];
  var subject = message.getSubject();
  var body = message.getPlainBody();
  var sender = message.getFrom();
  
  // アクションアイテムキーワード
  var actionKeywords = [
    '確認してください', '確認をお願い', '対応してください', '対応をお願い',
    '準備してください', '準備をお願い', '送付してください', '送付をお願い',
    '作成してください', '作成をお願い', '提出してください', '提出をお願い',
    '返信してください', '返信をお願い', '回答してください', '回答をお願い'
  ];
  
  var hasActionKeyword = false;
  for (var i = 0; i < actionKeywords.length; i++) {
    if (subject.indexOf(actionKeywords[i]) !== -1 || body.indexOf(actionKeywords[i]) !== -1) {
      hasActionKeyword = true;
      break;
    }
  }
  
  // 重要度判定（既読・未読に関係なく）
  var priority = this.determineEmailPriority(message);
  var isImportant = (priority === '高' || priority === '緊急');
  
  if (hasActionKeyword || message.isUnread() || isImportant) {
    var task = {
      title: this.generateTaskFromEmail(subject, body),
      type: 'task',
      priority: priority,
      due_date: this.extractDueDateFromEmail(body),
      source: 'gmail',
      status: '未着手',
      created_by: 'auto',
      original_event: subject,
      context: '差出人: ' + sender
    };
    
    tasks.push(task);
  }
  
  return tasks;
};

/**
 * タスクの重複チェックとNotion登録処理
 */
TaskExtractor.prototype.processAndCreateTasks = function(tasks, source) {
  var processedTasks = [];
  
  try {
    // 既存タスクを取得
    var existingTasks = this.notionClient.getExistingTasks({ source: source });
    
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      try {
        // 重複チェック
        var isDuplicate = this.duplicateChecker.checkBasicDuplicate(task, existingTasks);
        
        if (!isDuplicate) {
          // Notionに作成
          var result = this.notionClient.createTask(task);
          if (result && result.success) {
            task.created = true;
            task.notionId = result.id;
          } else {
            task.created = false;
            task.error = result ? result.error : 'unknown error';
          }
          processedTasks.push(task);
        } else {
          console.log('[TaskExtractor] 重複スキップ: ' + task.title);
          task.created = false;
          task.skipped = true;
          processedTasks.push(task);
        }
        
      } catch (error) {
        console.error('[TaskExtractor] タスク処理エラー: ' + error.message);
        task.created = false;
        task.error = error.message;
        processedTasks.push(task);
      }
    }
    
  } catch (error) {
    console.error('[TaskExtractor] 既存タスク取得エラー: ' + error.message);
    // 既存タスク取得に失敗した場合は、重複チェックなしで処理続行
    for (var j = 0; j < tasks.length; j++) {
      var task = tasks[j];
      try {
        var result = this.notionClient.createTask(task);
        if (result && result.success) {
          task.created = true;
          task.notionId = result.id;
        } else {
          task.created = false;
          task.error = result ? result.error : 'unknown error';
        }
        processedTasks.push(task);
      } catch (createError) {
        console.error('[TaskExtractor] タスク作成エラー: ' + createError.message);
        task.created = false;
        task.error = createError.message;
        processedTasks.push(task);
      }
    }
  }
  
  return processedTasks;
};

/**
 * 優先度を判定
 */
TaskExtractor.prototype.determinePriority = function(event) {
  var title = event.getTitle().toLowerCase();
  var description = event.getDescription().toLowerCase();
  
  if (title.indexOf('緊急') !== -1 || title.indexOf('至急') !== -1 || description.indexOf('緊急') !== -1) {
    return '高';
  }
  if (title.indexOf('重要') !== -1 || description.indexOf('重要') !== -1) {
    return '高';
  }
  
  return '中';
};

/**
 * コンテキスト情報を構築
 */
TaskExtractor.prototype.buildContext = function(event) {
  var parts = [];
  
  if (event.getLocation()) {
    parts.push('場所: ' + event.getLocation());
  }
  
  if (event.getGuestList().length > 0) {
    parts.push('参加者: ' + event.getGuestList().length + '名');
  }
  
  if (event.getDescription()) {
    var desc = event.getDescription();
    if (desc.length > 100) {
      desc = desc.substring(0, 100) + '...';
    }
    parts.push('詳細: ' + desc);
  }
  
  return parts.join(' | ');
};

/**
 * 期日を計算
 */
TaskExtractor.prototype.calculateDueDate = function(eventDate, dayOffset) {
  dayOffset = dayOffset || 0;
  var dueDate = new Date(eventDate);
  dueDate.setDate(dueDate.getDate() + dayOffset);
  return dueDate;
};

/**
 * メールからタスクタイトルを生成
 */
TaskExtractor.prototype.generateTaskFromEmail = function(subject, body) {
  if (subject.indexOf('Re:') !== -1) {
    return subject.replace('Re:', '').trim() + ' - 返信対応';
  }
  
  return subject + ' - 対応・確認';
};

/**
 * メールの優先度を判定
 */
TaskExtractor.prototype.determineEmailPriority = function(message) {
  var subject = message.getSubject().toLowerCase();
  var body = message.getPlainBody().toLowerCase();
  
  if (subject.indexOf('緊急') !== -1 || subject.indexOf('至急') !== -1 || 
      body.indexOf('緊急') !== -1 || body.indexOf('至急') !== -1) {
    return '高';
  }
  
  return '中';
};

/**
 * メール本文から期日を抽出
 */
TaskExtractor.prototype.extractDueDateFromEmail = function(body) {
  // 簡単な期日パターンマッチング
  var datePatterns = [
    /(\d{1,2}月\d{1,2}日)/,
    /(\d{4}\/\d{1,2}\/\d{1,2})/,
    /(明日|明後日)/
  ];
  
  for (var i = 0; i < datePatterns.length; i++) {
    var match = body.match(datePatterns[i]);
    if (match) {
      // 日付解析ロジック（簡略化）
      var futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 一週間後をデフォルト
      return futureDate;
    }
  }
  
  return null;
};