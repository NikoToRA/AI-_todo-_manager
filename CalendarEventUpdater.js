/**
 * カレンダーイベント更新クラス（ES5互換版）
 */
function CalendarEventUpdater() {
  this.processedTag = '🤖';
}

/**
 * カレンダーイベントが処理済みかチェック
 * @param {CalendarEvent} event カレンダーイベント
 * @returns {boolean} 処理済みの場合true
 */
CalendarEventUpdater.prototype.isEventProcessed = function(event) {
  try {
    var title = event.getTitle();
    var isProcessed = title.indexOf(this.processedTag) !== -1;
    
    if (isProcessed) {
      console.log('[CalendarEventUpdater] 処理済みイベント検出: "' + title + '"');
    }
    
    return isProcessed;
  } catch (error) {
    console.error('[CalendarEventUpdater] 処理済みチェックエラー:', error.message);
    return false;
  }
};

/**
 * カレンダーイベントに処理済みタグを追加
 * @param {CalendarEvent} event カレンダーイベント
 * @returns {boolean} 成功した場合true
 */
CalendarEventUpdater.prototype.markEventAsProcessed = function(event) {
  try {
    var originalTitle = event.getTitle();
    
    // 既に処理済みタグが付いている場合はスキップ
    if (this.isEventProcessed(event)) {
      console.log('[CalendarEventUpdater] 既に処理済み: "' + originalTitle + '"');
      return true;
    }
    
    // 処理済みタグを追加
    var newTitle = originalTitle + ' ' + this.processedTag;
    
    console.log('[CalendarEventUpdater] イベントタイトル更新:');
    console.log('  元: "' + originalTitle + '"');
    console.log('  新: "' + newTitle + '"');
    
    // カレンダーイベントのタイトルを更新
    event.setTitle(newTitle);
    
    console.log('[CalendarEventUpdater] ✓ 処理済みタグ追加完了');
    return true;
    
  } catch (error) {
    console.error('[CalendarEventUpdater] イベント更新エラー:', error.message);
    console.error('  イベント: "' + (event.getTitle ? event.getTitle() : 'unknown') + '"');
    return false;
  }
};

/**
 * 複数のカレンダーイベントに処理済みタグを追加
 * @param {Array<CalendarEvent>} events カレンダーイベント配列
 * @returns {Object} 処理結果統計
 */
CalendarEventUpdater.prototype.markMultipleEventsAsProcessed = function(events) {
  var stats = {
    total: events.length,
    processed: 0,
    skipped: 0,
    errors: 0
  };
  
  try {
    console.log('[CalendarEventUpdater] 複数イベント処理開始: ' + events.length + '件');
    
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      try {
        if (this.isEventProcessed(event)) {
          stats.skipped++;
        } else {
          var success = this.markEventAsProcessed(event);
          if (success) {
            stats.processed++;
          } else {
            stats.errors++;
          }
        }
      } catch (error) {
        console.error('[CalendarEventUpdater] 個別イベント処理エラー:', error.message);
        stats.errors++;
      }
    }
    
    console.log('[CalendarEventUpdater] 複数イベント処理完了:');
    console.log('  - 総数: ' + stats.total);
    console.log('  - 処理済み追加: ' + stats.processed);
    console.log('  - スキップ: ' + stats.skipped);
    console.log('  - エラー: ' + stats.errors);
    
    return stats;
    
  } catch (error) {
    console.error('[CalendarEventUpdater] 複数イベント処理エラー:', error.message);
    stats.errors = events.length;
    return stats;
  }
};

/**
 * 処理済みタグを削除（テスト用）
 * @param {CalendarEvent} event カレンダーイベント
 * @returns {boolean} 成功した場合true
 */
CalendarEventUpdater.prototype.removeProcessedTag = function(event) {
  try {
    var currentTitle = event.getTitle();
    
    if (!this.isEventProcessed(event)) {
      console.log('[CalendarEventUpdater] 処理済みタグなし: "' + currentTitle + '"');
      return true;
    }
    
    // 処理済みタグを除去
    var originalTitle = currentTitle.replace(' ' + this.processedTag, '').replace(this.processedTag, '').trim();
    
    console.log('[CalendarEventUpdater] 処理済みタグ除去:');
    console.log('  元: "' + currentTitle + '"');
    console.log('  新: "' + originalTitle + '"');
    
    event.setTitle(originalTitle);
    
    console.log('[CalendarEventUpdater] ✓ 処理済みタグ除去完了');
    return true;
    
  } catch (error) {
    console.error('[CalendarEventUpdater] タグ除去エラー:', error.message);
    return false;
  }
};

/**
 * 指定期間のカレンダーイベントから処理済みタグを検索
 * @param {Date} startDate 開始日
 * @param {Date} endDate 終了日
 * @returns {Array} 処理済みイベント情報
 */
CalendarEventUpdater.prototype.findProcessedEventsInRange = function(startDate, endDate) {
  try {
    console.log('[CalendarEventUpdater] 処理済みイベント検索: ' + startDate.toLocaleDateString() + ' - ' + endDate.toLocaleDateString());
    
    var calendars = CalendarApp.getAllCalendars();
    var processedEvents = [];
    
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      try {
        var events = calendar.getEvents(startDate, endDate);
        
        for (var j = 0; j < events.length; j++) {
          var event = events[j];
          if (this.isEventProcessed(event)) {
            processedEvents.push({
              title: event.getTitle(),
              start: event.getStartTime(),
              calendar: calendar.getName(),
              event: event
            });
          }
        }
      } catch (error) {
        console.warn('[CalendarEventUpdater] カレンダー「' + calendar.getName() + '」でエラー:', error.message);
      }
    }
    
    console.log('[CalendarEventUpdater] 処理済みイベント検索完了: ' + processedEvents.length + '件');
    return processedEvents;
    
  } catch (error) {
    console.error('[CalendarEventUpdater] 処理済みイベント検索エラー:', error.message);
    return [];
  }
};