/**
 * タスク抽出エンジンクラス（ES5互換版）
 */
function TaskExtractor(config) {
  this.config = config;
  this.notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
  this.duplicateChecker = new TaskDuplicateChecker(this.notionClient);
  this.calendarUpdater = new CalendarEventUpdater();
  
  // ProcessedTrackerが存在しない場合は基本的な管理機能のみ
  this.processedTracker = null;
  try {
    this.processedTracker = new ProcessedTracker();
  } catch (error) {
    console.warn('[TaskExtractor] ProcessedTracker利用不可 - 基本モードで実行');
  }
}

/**
 * カレンダーからタスクを抽出（最適化版）
 */
TaskExtractor.prototype.extractFromCalendar = function(startDate, endDate) {
  try {
    console.log('[TaskExtractor.extractFromCalendar] 開始: ' + startDate + ' - ' + endDate);
    
    // 1. 全カレンダーからイベントを取得
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
    
    // 2. イベント処理
    var tasks = [];
    var processedEvents = []; // 処理したイベントを追跡
    var skippedCount = 0;
    
    for (var j = 0; j < allEvents.length; j++) {
      var event = allEvents[j];
      var eventTitle = event.getTitle();
      var eventDate = event.getStartTime().toISOString().split('T')[0];
      
      console.log('[TaskExtractor] イベント処理中: ' + eventTitle);
      
      // カレンダー処理済みチェック（最優先）
      if (this.calendarUpdater.isEventProcessed(event)) {
        console.log('[TaskExtractor] スキップ（カレンダー処理済み）: ' + eventTitle);
        skippedCount++;
        continue;
      }
      
      // Notion処理済みチェック
      if (this.notionClient.isAlreadyProcessed(eventTitle, eventDate)) {
        console.log('[TaskExtractor] スキップ（Notion処理済み）: ' + eventTitle);
        // 処理済みなのにカレンダーマークがない場合はマークを追加
        try {
          this.calendarUpdater.markEventAsProcessed(event);
        } catch (markError) {
          console.warn('[TaskExtractor] カレンダーマーク追加エラー: ' + markError.message);
        }
        skippedCount++;
        continue;
      }
      
      // ProcessedTrackerチェック（従来機能との互換性）
      if (this.processedTracker && this.processedTracker.isCalendarEventProcessed(event)) {
        console.log('[TaskExtractor] スキップ（ProcessedTracker）: ' + eventTitle);
        skippedCount++;
        continue;
      }
      
      // タスク抽出
      var extractedTasks = this.analyzeCalendarEvent(event);
      if (extractedTasks.length > 0) {
        tasks = tasks.concat(extractedTasks);
        processedEvents.push(event); // 処理対象として記録
        
        // ProcessedTrackerが使える場合のマーク
        if (this.processedTracker) {
          this.processedTracker.markCalendarEventAsProcessed(event, extractedTasks);
        }
      }
    }
    
    // 3. 重複チェックとNotion登録
    var processedTasks = this.processAndCreateTasks(tasks, 'calendar');
    
    // 4. カレンダーイベントの更新（処理対象全てをマーク - 重複でもマーク）
    var calendarUpdateStats = { processed: 0, errors: 0, skipped: 0, total: 0 };
    
    if (processedEvents.length > 0) {
      console.log('[TaskExtractor] 処理済みイベントにマーク追加開始: ' + processedEvents.length + '件');
      console.log('[TaskExtractor] 重複チェック結果に関わらず、すべての処理対象イベントをマーク');
      calendarUpdateStats = this.updateProcessedEvents(processedEvents);
    } else {
      console.log('[TaskExtractor] マーク対象イベントなし');
    }
    
    console.log('[TaskExtractor.extractFromCalendar] 完了:');
    console.log('  - 処理対象イベント: ' + processedEvents.length + '件');
    console.log('  - スキップイベント: ' + skippedCount + '件');
    console.log('  - 抽出タスク: ' + tasks.length + '件');
    console.log('  - 最終処理タスク: ' + processedTasks.length + '件');
    console.log('  - カレンダー更新成功: ' + (calendarUpdateStats.processed || 0) + '件');
    console.log('  - カレンダー更新エラー: ' + (calendarUpdateStats.errors || 0) + '件');
    
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
    query = query || 'is:unread';
    maxResults = maxResults || 50;
    
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
  
  if (hasActionKeyword || message.isUnread()) {
    var task = {
      title: this.generateTaskFromEmail(subject, body),
      type: 'task',
      priority: this.determineEmailPriority(message),
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

/**
 * 処理済みタスクに対応するカレンダーイベントに処理済みタグを追加
 */
TaskExtractor.prototype.updateCalendarEventsAfterProcessing = function(processedTasks, allEvents) {
  var stats = {
    total: 0,
    processed: 0,
    skipped: 0,
    errors: 0
  };
  
  try {
    console.log('[TaskExtractor] カレンダーイベント更新開始');
    
    // 処理したタスクからイベント名を抽出（成功・失敗問わず）
    var processedEventTitles = [];
    for (var i = 0; i < processedTasks.length; i++) {
      var task = processedTasks[i];
      if (task.original_event) {
        processedEventTitles.push(task.original_event);
      }
    }
    
    console.log('[TaskExtractor] 更新対象イベント数: ' + processedEventTitles.length + '件');
    
    // 全処理対象イベントをマーク
    for (var j = 0; j < allEvents.length; j++) {
      var event = allEvents[j];
      var eventTitle = event.getTitle();
      
      stats.total++;
      
      // 重複防止: 既に処理済みかチェック
      if (this.calendarUpdater.isEventProcessed(event)) {
        stats.skipped++;
        console.log('[TaskExtractor] 既に処理済み: ' + eventTitle);
        continue;
      }
      
      // 処理対象イベントかチェック
      var shouldUpdate = processedEventTitles.indexOf(eventTitle) !== -1;
      
      if (shouldUpdate) {
        try {
          var success = this.calendarUpdater.markEventAsProcessed(event);
          if (success) {
            stats.processed++;
            console.log('[TaskExtractor] ✓ カレンダー更新成功: ' + eventTitle);
          } else {
            stats.errors++;
            console.log('[TaskExtractor] ❌ カレンダー更新失敗: ' + eventTitle);
          }
        } catch (error) {
          stats.errors++;
          console.error('[TaskExtractor] カレンダー更新エラー: ' + eventTitle + ' - ' + error.message);
        }
      } else {
        stats.skipped++;
      }
    }
    
    console.log('[TaskExtractor] カレンダー更新完了:');
    console.log('  - 総イベント数: ' + stats.total);
    console.log('  - 更新成功: ' + stats.processed);
    console.log('  - スキップ: ' + stats.skipped);
    console.log('  - エラー: ' + stats.errors);
    
    return stats;
    
  } catch (error) {
    console.error('[TaskExtractor] カレンダー更新処理エラー:', error.message);
    stats.errors = stats.total;
    return stats;
  }
};

/**
 * 処理対象イベントを直接更新（新しいヘルパーメソッド）
 */
TaskExtractor.prototype.updateProcessedEvents = function(events) {
  var stats = { total: events.length, processed: 0, errors: 0, skipped: 0 };
  
  console.log('[TaskExtractor] 処理済みイベント直接更新開始: ' + events.length + '件');
  
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    try {
      // 既に処理済みかチェック
      if (this.calendarUpdater.isEventProcessed(event)) {
        stats.skipped++;
        continue;
      }
      
      var success = this.calendarUpdater.markEventAsProcessed(event);
      if (success) {
        stats.processed++;
        console.log('[TaskExtractor] ✓ 直接更新成功: ' + event.getTitle());
      } else {
        stats.errors++;
        console.log('[TaskExtractor] ❌ 直接更新失敗: ' + event.getTitle());
      }
    } catch (error) {
      stats.errors++;
      console.error('[TaskExtractor] 直接更新エラー: ' + error.message);
    }
  }
  
  console.log('[TaskExtractor] 直接更新統計: 成功=' + stats.processed + ', スキップ=' + stats.skipped + ', エラー=' + stats.errors);
  return stats;
};