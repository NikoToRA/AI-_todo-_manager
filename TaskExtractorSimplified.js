/**
 * タスク抽出エンジン - シンプル版（ロボットマーク一元化）
 * ロボットマークを唯一の重複判定基準として使用
 */
function TaskExtractorSimplified(config) {
  this.config = config;
  this.notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
  this.calendarUpdater = new CalendarEventUpdater();
}

/**
 * カレンダーからタスクを抽出（シンプル版）
 * ロボットマークのみで重複判定
 */
TaskExtractorSimplified.prototype.extractFromCalendar = function(startDate, endDate) {
  try {
    console.log('[TaskExtractorSimplified] 開始: ' + startDate + ' - ' + endDate);
    console.log('[TaskExtractorSimplified] ロボットマーク一元管理モード');
    
    // 1. 全カレンダーからイベントを取得
    var calendars = CalendarApp.getAllCalendars();
    console.log('[TaskExtractorSimplified] カレンダー数: ' + calendars.length);
    
    var results = {
      totalEvents: 0,
      skippedByMark: 0,
      processed: 0,
      created: 0,
      failed: 0,
      errors: []
    };
    
    // 2. 各カレンダーのイベントを処理
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      
      try {
        var events = calendar.getEvents(startDate, endDate);
        results.totalEvents += events.length;
        
        console.log('[TaskExtractorSimplified] カレンダー「' + calendar.getName() + '」: ' + events.length + '件');
        
        // 3. 各イベントを処理
        for (var j = 0; j < events.length; j++) {
          var event = events[j];
          var eventTitle = event.getTitle();
          
          // ===========================
          // 最重要: ロボットマークチェック
          // ===========================
          if (this.calendarUpdater.isEventProcessed(event)) {
            console.log('[TaskExtractorSimplified] ✓ 処理済み（ロボットマーク検出）: ' + eventTitle);
            results.skippedByMark++;
            continue; // スキップ
          }
          
          // ===========================
          // 未処理イベント = タスク作成対象
          // ===========================
          console.log('[TaskExtractorSimplified] 処理対象: ' + eventTitle);
          results.processed++;
          
          try {
            // タスクデータを生成
            var taskData = this.createTaskFromEvent(event);
            
            // Notionにタスク作成
            var createResult = this.notionClient.createTask(taskData);
            
            if (createResult && createResult.success) {
              console.log('[TaskExtractorSimplified] ✅ タスク作成成功: ' + taskData.title);
              results.created++;
              
              // 成功したらロボットマークを追加
              var markSuccess = this.calendarUpdater.markEventAsProcessed(event);
              if (!markSuccess) {
                console.warn('[TaskExtractorSimplified] ⚠️ マーク追加失敗（タスクは作成済み）: ' + eventTitle);
              }
            } else {
              console.error('[TaskExtractorSimplified] ❌ タスク作成失敗: ' + eventTitle);
              results.failed++;
              results.errors.push('作成失敗: ' + eventTitle);
              
              // 失敗してもマークを追加（再試行防止）
              // ※必要に応じてこの動作は変更可能
              // this.calendarUpdater.markEventAsProcessed(event);
            }
            
          } catch (error) {
            console.error('[TaskExtractorSimplified] エラー: ' + error.message);
            results.failed++;
            results.errors.push(eventTitle + ': ' + error.message);
          }
        }
        
      } catch (calendarError) {
        console.error('[TaskExtractorSimplified] カレンダーエラー: ' + calendarError.message);
        results.errors.push('カレンダー「' + calendar.getName() + '」: ' + calendarError.message);
      }
    }
    
    // 4. 結果サマリー
    console.log('=== 処理完了 ===');
    console.log('総イベント数: ' + results.totalEvents);
    console.log('ロボットマークでスキップ: ' + results.skippedByMark);
    console.log('処理対象: ' + results.processed);
    console.log('作成成功: ' + results.created);
    console.log('作成失敗: ' + results.failed);
    
    if (results.errors.length > 0) {
      console.log('エラー詳細:');
      for (var k = 0; k < results.errors.length; k++) {
        console.log('  - ' + results.errors[k]);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('[TaskExtractorSimplified] 致命的エラー: ' + error.message);
    throw error;
  }
};

/**
 * カレンダーイベントからタスクデータを生成
 */
TaskExtractorSimplified.prototype.createTaskFromEvent = function(event) {
  var title = event.getTitle();
  var startTime = event.getStartTime();
  var eventDate = startTime.toISOString().split('T')[0];
  
  // タスクデータ
  var taskData = {
    title: title + ' (' + eventDate + ')', // 日付付きタイトル
    type: 'task',
    priority: this.determinePriority(event),
    due_date: eventDate,
    source: 'calendar',
    status: '未着手',
    created_by: 'auto',
    original_event: title,
    context: this.buildContext(event)
  };
  
  return taskData;
};

/**
 * 優先度を判定
 */
TaskExtractorSimplified.prototype.determinePriority = function(event) {
  var title = event.getTitle().toLowerCase();
  var description = (event.getDescription() || '').toLowerCase();
  
  if (title.indexOf('緊急') !== -1 || title.indexOf('至急') !== -1 || 
      description.indexOf('緊急') !== -1 || description.indexOf('至急') !== -1) {
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
TaskExtractorSimplified.prototype.buildContext = function(event) {
  var parts = [];
  
  // 元のイベント名を最初に記録
  parts.push('元イベント: ' + event.getTitle());
  
  // 時間情報
  var startTime = event.getStartTime();
  var endTime = event.getEndTime();
  parts.push('時間: ' + startTime.toLocaleTimeString() + ' - ' + endTime.toLocaleTimeString());
  
  // 場所
  if (event.getLocation()) {
    parts.push('場所: ' + event.getLocation());
  }
  
  // 参加者数
  try {
    var guests = event.getGuestList();
    if (guests && guests.length > 0) {
      parts.push('参加者: ' + guests.length + '名');
    }
  } catch (e) {
    // ゲストリスト取得エラーは無視
  }
  
  // 説明（最初の100文字）
  if (event.getDescription()) {
    var desc = event.getDescription();
    if (desc.length > 100) {
      desc = desc.substring(0, 100) + '...';
    }
    parts.push('詳細: ' + desc);
  }
  
  return parts.join(' | ');
};

// =============================================================================
// 実行関数
// =============================================================================

/**
 * シンプル版タスク抽出を実行
 */
function runSimplifiedTaskExtraction() {
  console.log('=== シンプル版タスク抽出（ロボットマーク一元化） ===');
  
  try {
    var config = ConfigManager.getConfig();
    var validation = ConfigManager.validateConfig();
    
    if (!validation.isValid) {
      console.error('❌ 設定が無効です:', validation.errors.join(', '));
      return {
        success: false,
        error: '設定が無効: ' + validation.errors.join(', ')
      };
    }
    
    // 日付範囲
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - (config.dataRangeDays || 7));
    
    // シンプル版エクストラクター
    var extractor = new TaskExtractorSimplified(config);
    var results = extractor.extractFromCalendar(startDate, endDate);
    
    // 実行サマリーをNotionに作成
    if (results.created > 0 || results.failed > 0) {
      try {
        var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
        var summaryData = {
          processed_items: results.processed,
          created_tasks: results.created,
          skipped_duplicates: results.skippedByMark,
          execution_mode: 'simplified',
          errors: results.errors.join('; ')
        };
        notionClient.createExecutionSummary(summaryData);
      } catch (summaryError) {
        console.error('サマリー作成エラー: ' + summaryError.message);
      }
    }
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 実行エラー: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * テスト実行（今日のイベントのみ）
 */
function testSimplifiedExtraction() {
  console.log('=== シンプル版テスト（今日のイベントのみ） ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    // 今日の範囲のみ
    var startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    var endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    var extractor = new TaskExtractorSimplified(config);
    var results = extractor.extractFromCalendar(startDate, endDate);
    
    console.log('\n✅ テスト完了');
    return results;
    
  } catch (error) {
    console.error('❌ テストエラー: ' + error.message);
    throw error;
  }
}

/**
 * ドライラン（実際には作成せず、シミュレーションのみ）
 */
function dryRunSimplifiedExtraction() {
  console.log('=== ドライラン（シミュレーション） ===');
  
  try {
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    var calendars = CalendarApp.getAllCalendars();
    var updater = new CalendarEventUpdater();
    
    var stats = {
      total: 0,
      withMark: 0,
      withoutMark: 0,
      calendars: {}
    };
    
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      var calendarName = calendar.getName();
      stats.calendars[calendarName] = {
        total: 0,
        withMark: 0,
        withoutMark: 0,
        events: []
      };
      
      try {
        var events = calendar.getEvents(startDate, endDate);
        
        for (var j = 0; j < events.length; j++) {
          var event = events[j];
          var hasRobotMark = updater.isEventProcessed(event);
          
          stats.total++;
          stats.calendars[calendarName].total++;
          
          if (hasRobotMark) {
            stats.withMark++;
            stats.calendars[calendarName].withMark++;
          } else {
            stats.withoutMark++;
            stats.calendars[calendarName].withoutMark++;
            stats.calendars[calendarName].events.push({
              title: event.getTitle(),
              date: event.getStartTime().toLocaleDateString()
            });
          }
        }
      } catch (error) {
        console.warn('カレンダー「' + calendarName + '」エラー: ' + error.message);
      }
    }
    
    // 結果表示
    console.log('\n=== ドライラン結果 ===');
    console.log('期間: ' + startDate.toLocaleDateString() + ' - ' + endDate.toLocaleDateString());
    console.log('総イベント数: ' + stats.total);
    console.log('ロボットマーク付き: ' + stats.withMark + '件（スキップ予定）');
    console.log('ロボットマークなし: ' + stats.withoutMark + '件（処理予定）');
    
    console.log('\n各カレンダーの詳細:');
    for (var calName in stats.calendars) {
      var cal = stats.calendars[calName];
      if (cal.total > 0) {
        console.log('\n「' + calName + '」');
        console.log('  - 総数: ' + cal.total);
        console.log('  - マーク付き: ' + cal.withMark);
        console.log('  - マークなし: ' + cal.withoutMark);
        
        if (cal.withoutMark > 0 && cal.events.length <= 5) {
          console.log('  - 処理予定イベント:');
          for (var k = 0; k < cal.events.length; k++) {
            console.log('    * ' + cal.events[k].title + ' (' + cal.events[k].date + ')');
          }
        } else if (cal.withoutMark > 5) {
          console.log('  - 処理予定イベント: ' + cal.withoutMark + '件（表示省略）');
        }
      }
    }
    
    console.log('\n実際に実行するには runSimplifiedTaskExtraction() を使用してください');
    
    return stats;
    
  } catch (error) {
    console.error('ドライランエラー: ' + error.message);
    throw error;
  }
}