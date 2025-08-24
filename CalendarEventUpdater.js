/**
 * カレンダーイベント更新クラス（ES5互換版）
 * 要件：カレンダーイベントをNotionに転記後、重複防止のためロボットマークを追加
 */
function CalendarEventUpdater() {
  this.processedTag = '🤖';
  this.maxRetries = 3; // マーク追加失敗時のリトライ回数
  this.retryDelay = 1000; // リトライ間隔（ミリ秒）
}

/**
 * カレンダーイベントが処理済みかチェック（強化版）
 * @param {CalendarEvent} event カレンダーイベント
 * @returns {boolean} 処理済みの場合true
 */
CalendarEventUpdater.prototype.isEventProcessed = function(event) {
  try {
    if (!event) {
      console.warn('[CalendarEventUpdater] nullイベントが渡されました');
      return false;
    }
    
    var title = event.getTitle();
    if (!title) {
      console.warn('[CalendarEventUpdater] タイトルが取得できません');
      return false;
    }
    
    // ロボットマーク（🤖）の存在チェック
    var isProcessed = title.indexOf(this.processedTag) !== -1;
    
    // より厳密なチェック：タイトルの先頭にロボットマークがあるかも確認
    var hasRobotAtStart = title.indexOf(this.processedTag) === 0;
    
    if (isProcessed) {
      console.log('[CalendarEventUpdater] 🤖処理済みイベント検出: "' + title + '"');
      console.log('[CalendarEventUpdater] ロボットマーク位置: ' + title.indexOf(this.processedTag));
      return true;
    }
    
    // デバッグ用：処理済みでない場合もログ出力
    console.log('[CalendarEventUpdater] 未処理イベント: "' + title + '"');
    
    return false;
  } catch (error) {
    console.error('[CalendarEventUpdater] 処理済みチェックエラー:', error.message);
    console.error('[CalendarEventUpdater] イベント詳細:', error.stack);
    return false;
  }
};

/**
 * カレンダーイベントに処理済みタグを追加（リトライ機能付き）
 * @param {CalendarEvent} event カレンダーイベント
 * @returns {boolean} 成功した場合true
 */
CalendarEventUpdater.prototype.markEventAsProcessed = function(event) {
  var retries = 0;
  var success = false;
  
  while (retries < this.maxRetries && !success) {
    try {
      var originalTitle = event.getTitle();
      
      // 既に処理済みタグが付いている場合はスキップ
      if (this.isEventProcessed(event)) {
        console.log('[CalendarEventUpdater] 既に処理済み: "' + originalTitle + '"');
        return true;
      }
      
      // 処理済みタグを追加（タイトルの先頭に配置して視認性を向上）
      var newTitle = this.processedTag + ' ' + originalTitle;
      
      console.log('[CalendarEventUpdater] イベントタイトル更新（試行 ' + (retries + 1) + '/' + this.maxRetries + '）:');
      console.log('  元: "' + originalTitle + '"');
      console.log('  新: "' + newTitle + '"');
      
      // カレンダーイベントのタイトルを更新
      event.setTitle(newTitle);
      
      // 更新確認（即座に読み直して確認）
      Utilities.sleep(500); // 更新の反映を待つ
      var updatedTitle = event.getTitle();
      if (updatedTitle.indexOf(this.processedTag) !== -1) {
        console.log('[CalendarEventUpdater] ✅ 処理済みタグ追加成功');
        success = true;
        return true;
      } else {
        throw new Error('タイトル更新が反映されませんでした');
      }
      
    } catch (error) {
      retries++;
      console.error('[CalendarEventUpdater] イベント更新エラー（試行 ' + retries + '/' + this.maxRetries + '）:', error.message);
      console.error('  イベント: "' + (event.getTitle ? event.getTitle() : 'unknown') + '"');
      
      if (retries < this.maxRetries) {
        console.log('[CalendarEventUpdater] ' + (this.retryDelay / 1000) + '秒後にリトライします...');
        Utilities.sleep(this.retryDelay);
      }
    }
  }
  
  console.error('[CalendarEventUpdater] ❌ マーク追加失敗（全リトライ終了）');
  return false;
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

/**
 * 指定期間の未処理イベントを検索
 * @param {Date} startDate 開始日
 * @param {Date} endDate 終了日
 * @returns {Array} 未処理イベント情報
 */
CalendarEventUpdater.prototype.findUnprocessedEventsInRange = function(startDate, endDate) {
  try {
    console.log('[CalendarEventUpdater] 未処理イベント検索: ' + startDate.toLocaleDateString() + ' - ' + endDate.toLocaleDateString());
    
    var calendars = CalendarApp.getAllCalendars();
    var unprocessedEvents = [];
    
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      try {
        var events = calendar.getEvents(startDate, endDate);
        
        for (var j = 0; j < events.length; j++) {
          var event = events[j];
          if (!this.isEventProcessed(event)) {
            unprocessedEvents.push({
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
    
    console.log('[CalendarEventUpdater] 未処理イベント検索完了: ' + unprocessedEvents.length + '件');
    return unprocessedEvents;
    
  } catch (error) {
    console.error('[CalendarEventUpdater] 未処理イベント検索エラー:', error.message);
    return [];
  }
};