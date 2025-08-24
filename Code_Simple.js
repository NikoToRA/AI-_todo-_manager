/**
 * AI駆動タスク管理システム - シンプル版
 * ロボットマーク（🤖）を唯一の重複判定基準として使用
 * 
 * 動作原理：
 * 1. カレンダーイベントにロボットマークがない → Notionタスク作成 → ロボットマーク追加
 * 2. カレンダーイベントにロボットマークがある → スキップ
 * 3. ユーザーがロボットマークを削除 → 再度タスク作成（これは正常動作）
 */

/**
 * メイン実行関数（シンプル版）
 */
function runSimpleTaskExtraction() {
  console.log('===========================================');
  console.log('🤖 シンプル版タスク管理システム実行開始');
  console.log('===========================================');
  console.log('処理方式: ロボットマーク一元管理');
  console.log('');
  
  try {
    // 設定取得と検証
    var config = ConfigManager.getConfig();
    var validation = ConfigManager.validateConfig();
    
    if (!validation.isValid) {
      console.error('❌ 設定エラー: ' + validation.errors.join(', '));
      return { success: false, error: '設定が無効です' };
    }
    
    // 日付範囲の設定
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - (config.dataRangeDays || 7));
    
    console.log('📅 処理期間: ' + startDate.toLocaleDateString() + ' ～ ' + endDate.toLocaleDateString());
    console.log('');
    
    // カレンダー処理の実行
    var results = processCalendarEvents(startDate, endDate, config);
    
    // Gmail処理（有効な場合のみ）
    if (config.enableGmailAnalysis) {
      console.log('\n📧 Gmail処理を開始...');
      var gmailResults = processGmailMessages(config);
      
      // 結果を統合
      results.gmailProcessed = gmailResults.processed;
      results.gmailCreated = gmailResults.created;
    }
    
    // 実行サマリー作成
    createExecutionSummary(results, config);
    
    // 結果表示
    displayResults(results);
    
    return { success: true, results: results };
    
  } catch (error) {
    console.error('❌ システムエラー: ' + error.message);
    console.error('スタックトレース: ' + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * カレンダーイベントを処理
 */
function processCalendarEvents(startDate, endDate, config) {
  var results = {
    totalEvents: 0,
    skippedByMark: 0,
    processed: 0,
    created: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // CalendarEventUpdaterとNotionClientの初期化
    var calendarUpdater = new CalendarEventUpdater();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 全カレンダーの取得
    var calendars = CalendarApp.getAllCalendars();
    console.log('📚 カレンダー数: ' + calendars.length);
    console.log('');
    
    // 各カレンダーを処理
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      var calendarName = calendar.getName();
      
      try {
        // イベント取得
        var events = calendar.getEvents(startDate, endDate);
        if (events.length === 0) continue;
        
        console.log('📅 [' + (i + 1) + '/' + calendars.length + '] ' + calendarName);
        console.log('   イベント数: ' + events.length);
        
        results.totalEvents += events.length;
        
        // 各イベントを処理
        for (var j = 0; j < events.length; j++) {
          var event = events[j];
          var eventTitle = event.getTitle();
          
          // ========================================
          // 核心: ロボットマークチェック（唯一の判定）
          // ========================================
          if (calendarUpdater.isEventProcessed(event)) {
            // ロボットマークあり = 処理済み = スキップ
            results.skippedByMark++;
            continue;
          }
          
          // ========================================
          // ロボットマークなし = 新規処理対象
          // ========================================
          console.log('   📌 処理: ' + eventTitle);
          results.processed++;
          
          try {
            // タスクデータ作成
            var taskData = createTaskFromCalendarEvent(event);
            
            // Notionにタスク作成
            var createResult = notionClient.createTask(taskData);
            
            if (createResult && createResult.success) {
              results.created++;
              console.log('      ✅ タスク作成成功');
              
              // 成功したらロボットマークを追加
              var markAdded = calendarUpdater.markEventAsProcessed(event);
              if (!markAdded) {
                console.log('      ⚠️ ロボットマーク追加失敗（タスクは作成済み）');
              } else {
                console.log('      🤖 ロボットマーク追加完了');
              }
              
            } else {
              results.failed++;
              console.log('      ❌ タスク作成失敗');
              results.errors.push(eventTitle + ': 作成失敗');
            }
            
          } catch (taskError) {
            results.failed++;
            console.error('      ❌ エラー: ' + taskError.message);
            results.errors.push(eventTitle + ': ' + taskError.message);
          }
        }
        
        console.log('');
        
      } catch (calendarError) {
        console.error('   ❌ カレンダーアクセスエラー: ' + calendarError.message);
        results.errors.push(calendarName + ': アクセスエラー');
      }
    }
    
  } catch (error) {
    console.error('カレンダー処理エラー: ' + error.message);
    results.errors.push('システムエラー: ' + error.message);
  }
  
  return results;
}

/**
 * カレンダーイベントからタスクデータを作成
 */
function createTaskFromCalendarEvent(event) {
  var title = event.getTitle();
  var startTime = event.getStartTime();
  var endTime = event.getEndTime();
  var eventDate = startTime.toISOString().split('T')[0];
  
  // タスクタイトル（日付を含める）
  var taskTitle = title + ' (' + eventDate + ')';
  
  // コンテキスト情報の構築
  var contextParts = [];
  contextParts.push('元イベント: ' + title);
  contextParts.push('時間: ' + formatTime(startTime) + ' - ' + formatTime(endTime));
  
  if (event.getLocation()) {
    contextParts.push('場所: ' + event.getLocation());
  }
  
  // 参加者情報（エラーを回避）
  try {
    var guests = event.getGuestList();
    if (guests && guests.length > 0) {
      contextParts.push('参加者: ' + guests.length + '名');
    }
  } catch (e) {
    // ゲストリスト取得エラーは無視
  }
  
  // 説明文（最初の100文字）
  var description = event.getDescription();
  if (description) {
    if (description.length > 100) {
      description = description.substring(0, 100) + '...';
    }
    contextParts.push('詳細: ' + description);
  }
  
  // 優先度の判定
  var priority = '中';
  var titleLower = title.toLowerCase();
  var descLower = (event.getDescription() || '').toLowerCase();
  
  if (titleLower.indexOf('緊急') !== -1 || titleLower.indexOf('至急') !== -1 ||
      descLower.indexOf('緊急') !== -1 || descLower.indexOf('至急') !== -1) {
    priority = '高';
  } else if (titleLower.indexOf('重要') !== -1 || descLower.indexOf('重要') !== -1) {
    priority = '高';
  }
  
  // タスクデータ
  return {
    title: taskTitle,
    type: 'task',
    priority: priority,
    due_date: eventDate,
    source: 'calendar',
    status: '未着手',
    created_by: 'auto',
    original_event: title,
    context: contextParts.join(' | ')
  };
}

/**
 * Gmailメッセージを処理（シンプル版）
 */
function processGmailMessages(config) {
  var results = {
    processed: 0,
    created: 0,
    errors: []
  };
  
  try {
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 未読メールを検索
    var threads = GmailApp.search('is:unread', 0, 20); // 最大20スレッド
    
    for (var i = 0; i < threads.length; i++) {
      var messages = threads[i].getMessages();
      
      for (var j = 0; j < messages.length; j++) {
        var message = messages[j];
        
        if (!message.isUnread()) continue;
        
        results.processed++;
        
        // タスク化が必要かチェック
        if (shouldCreateTaskFromEmail(message)) {
          var taskData = createTaskFromEmail(message);
          
          try {
            var createResult = notionClient.createTask(taskData);
            if (createResult && createResult.success) {
              results.created++;
              // 既読にする
              message.markRead();
            }
          } catch (error) {
            results.errors.push('Gmail: ' + error.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Gmail処理エラー: ' + error.message);
    results.errors.push('Gmailシステムエラー: ' + error.message);
  }
  
  return results;
}

/**
 * メールからタスクを作成すべきか判定
 */
function shouldCreateTaskFromEmail(message) {
  var subject = message.getSubject();
  var body = message.getPlainBody();
  
  var keywords = [
    '確認', '対応', '準備', '送付', '作成', '提出', '返信', '回答',
    'TODO', 'タスク', '宿題', '締切', '期限'
  ];
  
  for (var i = 0; i < keywords.length; i++) {
    if (subject.indexOf(keywords[i]) !== -1 || body.indexOf(keywords[i]) !== -1) {
      return true;
    }
  }
  
  return false;
}

/**
 * メールからタスクデータを作成
 */
function createTaskFromEmail(message) {
  var subject = message.getSubject();
  var sender = message.getFrom();
  
  return {
    title: subject + ' - メール対応',
    type: 'task',
    priority: '中',
    due_date: null,
    source: 'gmail',
    status: '未着手',
    created_by: 'auto',
    original_event: subject,
    context: '差出人: ' + sender
  };
}

/**
 * 実行サマリーを作成
 */
function createExecutionSummary(results, config) {
  try {
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    var summaryData = {
      processed_items: results.processed + (results.gmailProcessed || 0),
      created_tasks: results.created + (results.gmailCreated || 0),
      skipped_duplicates: results.skippedByMark,
      execution_mode: 'simple',
      errors: results.errors.join('; ')
    };
    
    notionClient.createExecutionSummary(summaryData);
    
  } catch (error) {
    console.error('サマリー作成エラー: ' + error.message);
  }
}

/**
 * 結果を表示
 */
function displayResults(results) {
  console.log('\n===========================================');
  console.log('📊 実行結果サマリー');
  console.log('===========================================');
  console.log('カレンダー:');
  console.log('  総イベント数: ' + results.totalEvents);
  console.log('  ロボットマークでスキップ: ' + results.skippedByMark);
  console.log('  処理対象: ' + results.processed);
  console.log('  タスク作成成功: ' + results.created);
  console.log('  タスク作成失敗: ' + results.failed);
  
  if (results.gmailProcessed !== undefined) {
    console.log('\nGmail:');
    console.log('  処理メール数: ' + results.gmailProcessed);
    console.log('  タスク作成数: ' + results.gmailCreated);
  }
  
  if (results.errors.length > 0) {
    console.log('\n⚠️ エラー一覧:');
    for (var i = 0; i < Math.min(results.errors.length, 5); i++) {
      console.log('  - ' + results.errors[i]);
    }
    if (results.errors.length > 5) {
      console.log('  ... 他' + (results.errors.length - 5) + '件のエラー');
    }
  }
  
  console.log('\n✅ 処理完了！');
  console.log('===========================================');
}

/**
 * 時刻フォーマット
 */
function formatTime(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  return hours + ':' + (minutes < 10 ? '0' + minutes : minutes);
}

// =============================================================================
// 便利な実行関数
// =============================================================================

/**
 * 今日のイベントのみ処理（テスト用）
 */
function runTodayOnly() {
  console.log('=== 今日のイベントのみ処理 ===\n');
  
  try {
    var config = ConfigManager.getConfig();
    
    var startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    var endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    var results = processCalendarEvents(startDate, endDate, config);
    displayResults(results);
    
    return results;
    
  } catch (error) {
    console.error('エラー: ' + error.message);
    throw error;
  }
}

/**
 * ドライラン（実際には作成しない、状況確認のみ）
 */
function dryRun() {
  console.log('===========================================');
  console.log('🔍 ドライラン（状況確認のみ）');
  console.log('===========================================\n');
  
  try {
    var calendarUpdater = new CalendarEventUpdater();
    
    // 期間設定
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 過去7日間
    
    console.log('📅 確認期間: ' + startDate.toLocaleDateString() + ' ～ ' + endDate.toLocaleDateString());
    console.log('');
    
    var stats = {
      total: 0,
      withMark: 0,
      withoutMark: 0,
      byCalendar: {}
    };
    
    // カレンダーごとに確認
    var calendars = CalendarApp.getAllCalendars();
    
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      var calendarName = calendar.getName();
      
      try {
        var events = calendar.getEvents(startDate, endDate);
        if (events.length === 0) continue;
        
        stats.byCalendar[calendarName] = {
          total: 0,
          withMark: 0,
          withoutMark: 0,
          unmarkedEvents: []
        };
        
        for (var j = 0; j < events.length; j++) {
          var event = events[j];
          stats.total++;
          stats.byCalendar[calendarName].total++;
          
          if (calendarUpdater.isEventProcessed(event)) {
            stats.withMark++;
            stats.byCalendar[calendarName].withMark++;
          } else {
            stats.withoutMark++;
            stats.byCalendar[calendarName].withoutMark++;
            
            // 未処理イベントを記録（最初の5件まで）
            if (stats.byCalendar[calendarName].unmarkedEvents.length < 5) {
              stats.byCalendar[calendarName].unmarkedEvents.push({
                title: event.getTitle(),
                date: event.getStartTime().toLocaleDateString(),
                time: formatTime(event.getStartTime())
              });
            }
          }
        }
        
      } catch (error) {
        console.warn('カレンダー「' + calendarName + '」エラー: ' + error.message);
      }
    }
    
    // 結果表示
    console.log('📊 確認結果:');
    console.log('-------------------------------------------');
    console.log('総イベント数: ' + stats.total);
    console.log('🤖 ロボットマーク付き: ' + stats.withMark + '件（処理済み）');
    console.log('📌 ロボットマークなし: ' + stats.withoutMark + '件（新規処理対象）');
    console.log('');
    
    // カレンダー別詳細
    for (var calName in stats.byCalendar) {
      var cal = stats.byCalendar[calName];
      if (cal.total > 0) {
        console.log('📅 ' + calName);
        console.log('   総数: ' + cal.total + '件');
        console.log('   処理済み: ' + cal.withMark + '件');
        console.log('   未処理: ' + cal.withoutMark + '件');
        
        if (cal.unmarkedEvents.length > 0) {
          console.log('   未処理イベント例:');
          for (var k = 0; k < cal.unmarkedEvents.length; k++) {
            var evt = cal.unmarkedEvents[k];
            console.log('     • ' + evt.title);
            console.log('       ' + evt.date + ' ' + evt.time);
          }
          if (cal.withoutMark > cal.unmarkedEvents.length) {
            console.log('     ... 他' + (cal.withoutMark - cal.unmarkedEvents.length) + '件');
          }
        }
        console.log('');
      }
    }
    
    console.log('-------------------------------------------');
    console.log('💡 実際に処理を実行するには:');
    console.log('   runSimpleTaskExtraction() を実行してください');
    console.log('===========================================');
    
    return stats;
    
  } catch (error) {
    console.error('ドライランエラー: ' + error.message);
    throw error;
  }
}

/**
 * 旧バージョンとの互換性のためのエイリアス
 */
function main() {
  return runSimpleTaskExtraction();
}

function run() {
  return runSimpleTaskExtraction();
}