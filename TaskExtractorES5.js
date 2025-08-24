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
      
      console.log('[TaskExtractor] イベント処理中: "' + eventTitle + '"');
      
      // 🤖ロボットマークチェック（最優先・強化版）
      if (this.calendarUpdater.isEventProcessed(event)) {
        console.log('[TaskExtractor] ✅ スキップ（🤖ロボットマーク検出）: "' + eventTitle + '"');
        skippedCount++;
        continue;
      }
      
      // 追加の安全チェック：タイトルに直接🤖が含まれている場合もスキップ
      if (eventTitle && eventTitle.indexOf('🤖') !== -1) {
        console.log('[TaskExtractor] ✅ スキップ（タイトルに🤖マーク含む）: "' + eventTitle + '"');
        skippedCount++;
        continue;
      }
      
      // ProcessedTrackerチェック（ローカル追跡によるフォールバック優先）
      if (this.processedTracker && this.processedTracker.isCalendarEventProcessed(event)) {
        console.log('[TaskExtractor] スキップ（ProcessedTracker）: ' + eventTitle);
        skippedCount++;
        continue;
      }
      
      // Notion処理済みチェック（フォールバック記録付き）
      if (this.notionClient.isAlreadyProcessed(eventTitle, eventDate)) {
        console.log('[TaskExtractor] スキップ（Notion処理済み）: ' + eventTitle);
        // 処理済みなのにカレンダーマークがない場合はマークを追加、失敗時はProcessedTrackerで記録
        try {
          var marked = this.calendarUpdater.markEventAsProcessed(event);
          if (!marked && this.processedTracker) {
            this.processedTracker.markCalendarEventAsProcessed(event, []);
          }
        } catch (markError) {
          console.warn('[TaskExtractor] カレンダーマーク追加エラー: ' + markError.message);
          if (this.processedTracker) {
            try { this.processedTracker.markCalendarEventAsProcessed(event, []); } catch (e2) {}
          }
        }
        skippedCount++;
        continue;
      }
      
      // タスク抽出
      var extractedTasks = this.analyzeCalendarEvent(event);
      if (extractedTasks.length > 0) {
        tasks = tasks.concat(extractedTasks);
        processedEvents.push(event); // 処理対象として記録
        
        console.log('[TaskExtractor] 📝 タスク抽出成功: "' + eventTitle + '" → ' + extractedTasks.length + '件のタスク');
        
        // ProcessedTrackerが使える場合のマーク
        if (this.processedTracker) {
          this.processedTracker.markCalendarEventAsProcessed(event, extractedTasks);
        }
        
        // 即座にロボットマークを追加（タスク作成成功前でもマーク）
        console.log('[TaskExtractor] 🤖 即座にロボットマーク追加試行: "' + eventTitle + '"');
        try {
          var immediateMarkResult = this.calendarUpdater.markEventAsProcessed(event);
          if (immediateMarkResult) {
            console.log('[TaskExtractor] ✅ 即座のロボットマーク追加成功: "' + eventTitle + '"');
          } else {
            console.log('[TaskExtractor] ⚠️ 即座のロボットマーク追加失敗 - 後で再試行: "' + eventTitle + '"');
          }
        } catch (markError) {
          console.warn('[TaskExtractor] ⚠️ 即座のロボットマーク追加エラー: ' + markError.message);
        }
      }
    }
    
    // 3. 重複チェックとNotion登録
    var processedTasks = this.processAndCreateTasks(tasks, 'calendar');
    
    // 4. カレンダーイベントの更新（徹底的なロボットマーク追加）
    var calendarUpdateStats = { processed: 0, errors: 0, skipped: 0, total: 0 };
    
    if (processedEvents.length > 0) {
      console.log('[TaskExtractor] 🤖 最終ロボットマーク確認・追加開始: ' + processedEvents.length + '件');
      console.log('[TaskExtractor] 【徹底モード】全ての処理対象イベントに確実にマーク追加');
      calendarUpdateStats = this.updateProcessedEventsAggressively(processedEvents);
      
      // 更に徹底: マーク失敗したイベントを再確認
      if (calendarUpdateStats.errors > 0) {
        console.log('[TaskExtractor] ⚠️ マーク失敗イベントの再試行開始: ' + calendarUpdateStats.errors + '件');
        var retryStats = this.retryFailedMarkings(processedEvents);
        console.log('[TaskExtractor] 再試行結果: 成功=' + retryStats.recovered + ', 失敗=' + retryStats.stillFailed);
      }
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
        // カレンダーマーク付与に失敗した場合のフォールバック
        if (this.processedTracker) {
          try {
            this.processedTracker.markCalendarEventAsProcessed(event, []);
            stats.skipped++; // 次回以降はローカルでブロックされる
            console.log('[TaskExtractor] ⚠ フォールバック記録(ProcessedTracker): ' + event.getTitle());
          } catch (fallbackError) {
            stats.errors++;
            console.log('[TaskExtractor] ❌ 直接更新失敗(フォールバック不可): ' + event.getTitle());
          }
        } else {
          stats.errors++;
          console.log('[TaskExtractor] ❌ 直接更新失敗: ' + event.getTitle());
        }
      }
    } catch (error) {
      stats.errors++;
      console.error('[TaskExtractor] 直接更新エラー: ' + error.message);
    }
  }
  
  console.log('[TaskExtractor] 直接更新統計: 成功=' + stats.processed + ', スキップ=' + stats.skipped + ', エラー=' + stats.errors);
  return stats;
};

/**
 * 徹底的なロボットマーク追加（強化版）
 */
TaskExtractor.prototype.updateProcessedEventsAggressively = function(events) {
  var stats = { total: events.length, processed: 0, errors: 0, skipped: 0 };
  var failedEvents = [];
  
  console.log('[TaskExtractor] 🤖【徹底モード】ロボットマーク追加開始: ' + events.length + '件');
  
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var eventTitle = '';
    
    try {
      eventTitle = event.getTitle();
      console.log('[TaskExtractor] 🤖 マーク処理中 [' + (i + 1) + '/' + events.length + ']: "' + eventTitle + '"');
      
      // 既に処理済みかチェック
      if (this.calendarUpdater.isEventProcessed(event)) {
        console.log('[TaskExtractor] ✅ 既にマーク済み: "' + eventTitle + '"');
        stats.skipped++;
        continue;
      }
      
      // 3回リトライでマーク追加
      var success = false;
      var attempts = 0;
      var maxAttempts = 3;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        console.log('[TaskExtractor] 🤖 マーク試行 ' + attempts + '/' + maxAttempts + ': "' + eventTitle + '"');
        
        try {
          success = this.calendarUpdater.markEventAsProcessed(event);
          if (success) {
            console.log('[TaskExtractor] ✅ マーク成功 (試行' + attempts + '): "' + eventTitle + '"');
            stats.processed++;
            break;
          } else {
            console.log('[TaskExtractor] ⚠️ マーク失敗 (試行' + attempts + '): "' + eventTitle + '"');
            if (attempts < maxAttempts) {
              Utilities.sleep(1000); // 1秒待機してリトライ
            }
          }
        } catch (markError) {
          console.warn('[TaskExtractor] ⚠️ マーク例外 (試行' + attempts + '): ' + markError.message);
          if (attempts < maxAttempts) {
            Utilities.sleep(1000);
          }
        }
      }
      
      if (!success) {
        console.error('[TaskExtractor] ❌ 全試行失敗: "' + eventTitle + '"');
        failedEvents.push(event);
        
        // フォールバック記録
        if (this.processedTracker) {
          try {
            this.processedTracker.markCalendarEventAsProcessed(event, []);
            console.log('[TaskExtractor] 🔄 フォールバック記録完了: "' + eventTitle + '"');
          } catch (fallbackError) {
            console.error('[TaskExtractor] ❌ フォールバック記録失敗: ' + fallbackError.message);
          }
        }
        stats.errors++;
      }
      
    } catch (error) {
      console.error('[TaskExtractor] ❌ イベント処理エラー: "' + eventTitle + '": ' + error.message);
      failedEvents.push(event);
      stats.errors++;
    }
  }
  
  console.log('[TaskExtractor] 🤖【徹底モード】完了統計:');
  console.log('  - 成功: ' + stats.processed + '件');
  console.log('  - スキップ: ' + stats.skipped + '件'); 
  console.log('  - 失敗: ' + stats.errors + '件');
  
  stats.failedEvents = failedEvents;
  return stats;
};

/**
 * マーク失敗イベントの再試行
 */
TaskExtractor.prototype.retryFailedMarkings = function(events) {
  var stats = { recovered: 0, stillFailed: 0 };
  
  console.log('[TaskExtractor] 🔄 失敗イベントの再試行開始');
  
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    
    try {
      // まだマークされていないイベントのみ再試行
      if (!this.calendarUpdater.isEventProcessed(event)) {
        console.log('[TaskExtractor] 🔄 再試行: "' + event.getTitle() + '"');
        
        // 少し時間をおいて再試行
        Utilities.sleep(2000);
        
        var success = this.calendarUpdater.markEventAsProcessed(event);
        if (success) {
          stats.recovered++;
          console.log('[TaskExtractor] ✅ 再試行成功: "' + event.getTitle() + '"');
        } else {
          stats.stillFailed++;
          console.log('[TaskExtractor] ❌ 再試行失敗: "' + event.getTitle() + '"');
        }
      }
    } catch (error) {
      stats.stillFailed++;
      console.error('[TaskExtractor] ❌ 再試行エラー: ' + error.message);
    }
  }
  
  return stats;
};