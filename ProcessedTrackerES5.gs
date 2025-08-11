/**
 * 処理済みアイテム追跡システム（ES5互換版）
 * カレンダーイベントとGmailメッセージの処理状況を日付別で管理
 */
function ProcessedTracker() {
  this.storageKey = 'PROCESSED_ITEMS';
  this.version = '1.0';
}

/**
 * カレンダーイベントが処理済みかチェック（日付別管理）
 */
ProcessedTracker.prototype.isCalendarEventProcessed = function(event) {
  try {
    var eventDate = event.getStartTime().toISOString().split('T')[0]; // YYYY-MM-DD形式
    var eventId = this._generateCalendarEventIdWithDate(event, eventDate);
    var processedItems = this._getProcessedItems();
    
    // 日付別の処理済みチェック
    var processed = processedItems.calendar && processedItems.calendar[eventId];
    
    if (processed) {
      console.log('[ProcessedTracker] カレンダーイベント処理済み（' + eventDate + '）: "' + event.getTitle() + '"');
      console.log('  処理日時: ' + processed.processedAt);
      return true;
    }
    
    console.log('[ProcessedTracker] カレンダーイベント未処理（' + eventDate + '）: "' + event.getTitle() + '"');
    return false;
    
  } catch (error) {
    console.error('[ProcessedTracker] カレンダー処理済みチェックエラー: ' + error.message);
    return false; // エラー時は未処理扱い
  }
};

/**
 * Gmailメッセージが処理済みかチェック
 */
ProcessedTracker.prototype.isGmailMessageProcessed = function(message) {
  try {
    var messageId = this._generateGmailMessageId(message);
    var processedItems = this._getProcessedItems();
    
    var processed = processedItems.gmail && processedItems.gmail[messageId];
    
    if (processed) {
      console.log('[ProcessedTracker] Gmailメッセージ処理済み: "' + message.getSubject() + '"');
      console.log('  処理日時: ' + processed.processedAt);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('[ProcessedTracker] Gmail処理済みチェックエラー: ' + error.message);
    return false; // エラー時は未処理扱い
  }
};

/**
 * カレンダーイベントを処理済みとしてマーク（日付別管理）
 */
ProcessedTracker.prototype.markCalendarEventAsProcessed = function(event, createdTasks) {
  createdTasks = createdTasks || [];
  
  try {
    var eventDate = event.getStartTime().toISOString().split('T')[0]; // YYYY-MM-DD形式
    var eventId = this._generateCalendarEventIdWithDate(event, eventDate);
    var processedItems = this._getProcessedItems();
    
    // calendar分野の初期化
    if (!processedItems.calendar) {
      processedItems.calendar = {};
    }
    
    // 日付別の処理済み情報を記録
    processedItems.calendar[eventId] = {
      title: event.getTitle(),
      eventDate: eventDate,
      location: event.getLocation() || '',
      processedAt: new Date().toISOString(),
      version: this.version,
      tasksCreated: createdTasks.length,
      taskTitles: createdTasks.map(function(task) { return task.title; })
    };
    
    this._saveProcessedItems(processedItems);
    
    console.log('[ProcessedTracker] カレンダーイベントを処理済みマーク（' + eventDate + '）: "' + event.getTitle() + '"');
    console.log('  作成タスク数: ' + createdTasks.length);
    
  } catch (error) {
    console.error('[ProcessedTracker] カレンダー処理済みマークエラー: ' + error.message);
  }
};

/**
 * Gmailメッセージを処理済みとしてマーク
 */
ProcessedTracker.prototype.markGmailMessageAsProcessed = function(message, createdTasks) {
  createdTasks = createdTasks || [];
  
  try {
    var messageId = this._generateGmailMessageId(message);
    var processedItems = this._getProcessedItems();
    
    // gmail分野の初期化
    if (!processedItems.gmail) {
      processedItems.gmail = {};
    }
    
    // 処理済み情報を記録
    processedItems.gmail[messageId] = {
      subject: message.getSubject(),
      from: message.getFrom(),
      date: message.getDate().toISOString(),
      processedAt: new Date().toISOString(),
      version: this.version,
      tasksCreated: createdTasks.length,
      taskTitles: createdTasks.map(function(task) { return task.title; })
    };
    
    this._saveProcessedItems(processedItems);
    
    console.log('[ProcessedTracker] Gmailメッセージを処理済みマーク: "' + message.getSubject() + '"');
    console.log('  作成タスク数: ' + createdTasks.length);
    
  } catch (error) {
    console.error('[ProcessedTracker] Gmail処理済みマークエラー: ' + error.message);
  }
};

/**
 * 処理済みアイテムの統計を取得
 */
ProcessedTracker.prototype.getProcessingStats = function() {
  try {
    var processedItems = this._getProcessedItems();
    
    var calendarCount = processedItems.calendar ? Object.keys(processedItems.calendar).length : 0;
    var gmailCount = processedItems.gmail ? Object.keys(processedItems.gmail).length : 0;
    
    // 今日処理したアイテム数
    var today = new Date().toDateString();
    var todayCalendar = 0;
    var todayGmail = 0;
    
    if (processedItems.calendar) {
      var calendarValues = Object.keys(processedItems.calendar).map(function(key) {
        return processedItems.calendar[key];
      });
      todayCalendar = calendarValues.filter(function(item) {
        return new Date(item.processedAt).toDateString() === today;
      }).length;
    }
    
    if (processedItems.gmail) {
      var gmailValues = Object.keys(processedItems.gmail).map(function(key) {
        return processedItems.gmail[key];
      });
      todayGmail = gmailValues.filter(function(item) {
        return new Date(item.processedAt).toDateString() === today;
      }).length;
    }
    
    return {
      total: {
        calendar: calendarCount,
        gmail: gmailCount,
        combined: calendarCount + gmailCount
      },
      today: {
        calendar: todayCalendar,
        gmail: todayGmail,
        combined: todayCalendar + todayGmail
      }
    };
    
  } catch (error) {
    console.error('[ProcessedTracker] 統計取得エラー: ' + error.message);
    return { 
      total: { calendar: 0, gmail: 0, combined: 0 }, 
      today: { calendar: 0, gmail: 0, combined: 0 } 
    };
  }
};

/**
 * 古い処理済み記録をクリーンアップ
 */
ProcessedTracker.prototype.cleanupOldRecords = function(daysToKeep) {
  daysToKeep = daysToKeep || 30;
  
  try {
    var processedItems = this._getProcessedItems();
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    var cleanedCount = 0;
    
    // カレンダー記録のクリーンアップ
    if (processedItems.calendar) {
      var calendarKeys = Object.keys(processedItems.calendar);
      for (var i = 0; i < calendarKeys.length; i++) {
        var eventId = calendarKeys[i];
        var item = processedItems.calendar[eventId];
        if (new Date(item.processedAt) < cutoffDate) {
          delete processedItems.calendar[eventId];
          cleanedCount++;
        }
      }
    }
    
    // Gmail記録のクリーンアップ
    if (processedItems.gmail) {
      var gmailKeys = Object.keys(processedItems.gmail);
      for (var j = 0; j < gmailKeys.length; j++) {
        var messageId = gmailKeys[j];
        var item = processedItems.gmail[messageId];
        if (new Date(item.processedAt) < cutoffDate) {
          delete processedItems.gmail[messageId];
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      this._saveProcessedItems(processedItems);
      console.log('[ProcessedTracker] ' + cleanedCount + '件の古い処理済み記録をクリーンアップしました');
    }
    
    return cleanedCount;
    
  } catch (error) {
    console.error('[ProcessedTracker] クリーンアップエラー: ' + error.message);
    return 0;
  }
};

/**
 * カレンダーイベント用のユニークIDを生成（日付別版）
 */
ProcessedTracker.prototype._generateCalendarEventIdWithDate = function(event, eventDate) {
  var title = event.getTitle();
  var location = event.getLocation() || '';
  
  // タイトル + 日付 + 場所のハッシュ化（時間は除外して日付のみを考慮）
  var hashString = title + eventDate + location;
  return this._simpleHash(hashString);
};

/**
 * Gmailメッセージ用のユニークIDを生成
 */
ProcessedTracker.prototype._generateGmailMessageId = function(message) {
  var subject = message.getSubject();
  var from = message.getFrom();
  var date = message.getDate().toISOString();
  
  // 件名 + 送信者 + 日時のハッシュ化
  var hashString = subject + from + date;
  return this._simpleHash(hashString);
};

/**
 * 簡単なハッシュ関数
 */
ProcessedTracker.prototype._simpleHash = function(str) {
  var hash = 0;
  if (str.length === 0) return hash;
  
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  
  return Math.abs(hash).toString(16);
};

/**
 * 処理済みアイテムデータを取得
 */
ProcessedTracker.prototype._getProcessedItems = function() {
  try {
    var props = PropertiesService.getScriptProperties();
    var data = props.getProperty(this.storageKey);
    
    if (data) {
      return JSON.parse(data);
    }
    
    return { calendar: {}, gmail: {} };
    
  } catch (error) {
    console.error('[ProcessedTracker] データ取得エラー: ' + error.message);
    return { calendar: {}, gmail: {} };
  }
};

/**
 * 処理済みアイテムデータを保存
 */
ProcessedTracker.prototype._saveProcessedItems = function(processedItems) {
  try {
    var props = PropertiesService.getScriptProperties();
    var dataStr = JSON.stringify(processedItems);
    
    // PropertiesServiceの制限（9KB）をチェック
    if (dataStr.length > 8192) { // 8KBでワーニング
      console.warn('[ProcessedTracker] データサイズが大きくなっています: ' + dataStr.length + 'バイト');
      
      // 古いデータを自動クリーンアップ
      this.cleanupOldRecords(15); // 15日間のデータのみ保持
      return;
    }
    
    props.setProperty(this.storageKey, dataStr);
    
  } catch (error) {
    console.error('[ProcessedTracker] データ保存エラー: ' + error.message);
  }
};

/**
 * テスト用関数 - 処理済み追跡システムのテスト
 */
function testProcessedTrackerES5() {
  console.log('=== 処理済み追跡システムテスト（ES5版） ===');
  
  try {
    var tracker = new ProcessedTracker();
    
    // 統計表示
    console.log('1. 現在の統計:');
    var stats = tracker.getProcessingStats();
    console.log('累計 - カレンダー: ' + stats.total.calendar + '件, Gmail: ' + stats.total.gmail + '件');
    console.log('今日 - カレンダー: ' + stats.today.calendar + '件, Gmail: ' + stats.today.gmail + '件');
    
    // 実際のカレンダーイベントでテスト
    console.log('2. カレンダーイベントテスト:');
    var calendar = CalendarApp.getDefaultCalendar();
    var today = new Date();
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    var events = calendar.getEvents(today, tomorrow);
    
    if (events.length > 0) {
      var testEvent = events[0];
      console.log('テスト対象イベント: "' + testEvent.getTitle() + '"');
      
      var isProcessed = tracker.isCalendarEventProcessed(testEvent);
      console.log('処理済み状態: ' + isProcessed);
    } else {
      console.log('テスト用のカレンダーイベントがありません');
    }
    
    console.log('✅ テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト終了 ===');
}

/**
 * 処理済み統計表示用関数（ES5版）
 */
function showProcessedStatsES5() {
  var tracker = new ProcessedTracker();
  var stats = tracker.getProcessingStats();
  
  console.log('=== 処理済みアイテム統計 ===');
  console.log('📊 累計:');
  console.log('  カレンダー: ' + stats.total.calendar + '件');
  console.log('  Gmail: ' + stats.total.gmail + '件');
  console.log('  合計: ' + stats.total.combined + '件');
  
  console.log('📅 今日:');
  console.log('  カレンダー: ' + stats.today.calendar + '件');
  console.log('  Gmail: ' + stats.today.gmail + '件');
  console.log('  合計: ' + stats.today.combined + '件');
  
  console.log('=== 統計終了 ===');
}