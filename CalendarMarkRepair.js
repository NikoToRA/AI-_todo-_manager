/**
 * カレンダーマーク修復機能（ES5互換版）
 * Notionに登録済みのタスクから逆引きして、対応するカレンダーイベントにロボットマークを追加
 */

/**
 * カレンダーマーク修復クラス
 */
function CalendarMarkRepair() {
  this.calendarUpdater = new CalendarEventUpdater();
  this.config = ConfigManager.getConfig();
  this.notionClient = new NotionClient(this.config.notionToken, this.config.notionDatabaseId);
}

/**
 * 指定期間のカレンダーイベントをNotionタスクと照合して修復
 * @param {Date} startDate 開始日（省略時は7日前）
 * @param {Date} endDate 終了日（省略時は今日）
 * @returns {Object} 修復結果
 */
CalendarMarkRepair.prototype.repairCalendarMarks = function(startDate, endDate) {
  try {
    // デフォルト期間の設定
    if (!endDate) {
      endDate = new Date();
    }
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }
    
    console.log('=== カレンダーマーク修復処理開始 ===');
    console.log('期間: ' + startDate.toLocaleDateString() + ' - ' + endDate.toLocaleDateString());
    
    var results = {
      totalEvents: 0,
      alreadyMarked: 0,
      newlyMarked: 0,
      markFailed: 0,
      notInNotion: 0,
      errors: []
    };
    
    // 1. 指定期間の全カレンダーイベントを取得
    var allEvents = this.getAllCalendarEvents(startDate, endDate);
    results.totalEvents = allEvents.length;
    console.log('総イベント数: ' + results.totalEvents);
    
    // 2. Notionから既存タスクを取得（カレンダーソースのもの）
    var notionTasks = this.getNotionCalendarTasks(startDate, endDate);
    console.log('Notion内のカレンダー由来タスク数: ' + notionTasks.length);
    
    // 3. 各イベントを処理
    for (var i = 0; i < allEvents.length; i++) {
      var event = allEvents[i];
      var eventTitle = event.getTitle();
      var eventDate = event.getStartTime();
      
      console.log('処理中 [' + (i + 1) + '/' + allEvents.length + ']: "' + eventTitle + '"');
      
      // 既にマーク済みの場合はスキップ
      if (this.calendarUpdater.isEventProcessed(event)) {
        console.log('  → 既にマーク済み');
        results.alreadyMarked++;
        continue;
      }
      
      // Notionタスクと照合
      var matchingTask = this.findMatchingNotionTask(event, notionTasks);
      
      if (matchingTask) {
        console.log('  → Notionタスク発見: "' + matchingTask.title + '"');
        
        // マークを追加
        var markSuccess = this.calendarUpdater.markEventAsProcessed(event);
        
        if (markSuccess) {
          console.log('  → ✅ マーク追加成功');
          results.newlyMarked++;
        } else {
          console.log('  → ❌ マーク追加失敗');
          results.markFailed++;
          results.errors.push('マーク追加失敗: ' + eventTitle);
        }
      } else {
        console.log('  → Notionタスク未発見（未処理イベント）');
        results.notInNotion++;
      }
    }
    
    // 4. 結果サマリー
    console.log('=== カレンダーマーク修復処理完了 ===');
    console.log('処理結果:');
    console.log('  - 総イベント数: ' + results.totalEvents);
    console.log('  - 既にマーク済み: ' + results.alreadyMarked);
    console.log('  - 新規マーク追加: ' + results.newlyMarked);
    console.log('  - マーク追加失敗: ' + results.markFailed);
    console.log('  - Notion未登録: ' + results.notInNotion);
    
    if (results.errors.length > 0) {
      console.log('エラー詳細:');
      for (var j = 0; j < results.errors.length; j++) {
        console.log('  - ' + results.errors[j]);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('カレンダーマーク修復エラー: ' + error.message);
    throw error;
  }
};

/**
 * 指定期間の全カレンダーイベントを取得
 */
CalendarMarkRepair.prototype.getAllCalendarEvents = function(startDate, endDate) {
  var allEvents = [];
  
  try {
    var calendars = CalendarApp.getAllCalendars();
    
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      try {
        var events = calendar.getEvents(startDate, endDate);
        allEvents = allEvents.concat(events);
      } catch (error) {
        console.warn('カレンダー「' + calendar.getName() + '」取得エラー: ' + error.message);
      }
    }
    
  } catch (error) {
    console.error('カレンダーイベント取得エラー: ' + error.message);
  }
  
  return allEvents;
};

/**
 * Notionからカレンダー由来のタスクを取得
 */
CalendarMarkRepair.prototype.getNotionCalendarTasks = function(startDate, endDate) {
  try {
    // Notion APIを使用してタスクを取得
    var filter = {
      and: [
        {
          property: 'ソース',
          select: {
            equals: 'calendar'
          }
        },
        {
          property: '期日',
          date: {
            on_or_after: startDate.toISOString().split('T')[0]
          }
        },
        {
          property: '期日',
          date: {
            on_or_before: endDate.toISOString().split('T')[0]
          }
        }
      ]
    };
    
    var response = this.notionClient.queryDatabase(filter);
    
    if (response && response.results) {
      var tasks = [];
      for (var i = 0; i < response.results.length; i++) {
        var page = response.results[i];
        tasks.push({
          id: page.id,
          title: this.extractTitle(page),
          originalEvent: this.extractOriginalEvent(page),
          dueDate: this.extractDueDate(page)
        });
      }
      return tasks;
    }
    
  } catch (error) {
    console.error('Notionタスク取得エラー: ' + error.message);
  }
  
  return [];
};

/**
 * カレンダーイベントとNotionタスクのマッチング
 */
CalendarMarkRepair.prototype.findMatchingNotionTask = function(event, notionTasks) {
  var eventTitle = event.getTitle();
  var eventDate = event.getStartTime().toISOString().split('T')[0];
  
  // タイトルの正規化（ロボットマークを除去）
  var normalizedEventTitle = eventTitle.replace(/🤖\s*/g, '').trim().toLowerCase();
  
  for (var i = 0; i < notionTasks.length; i++) {
    var task = notionTasks[i];
    
    // 日付が一致するかチェック
    if (task.dueDate === eventDate) {
      // originalEventが一致する場合（最も確実）
      if (task.originalEvent && task.originalEvent.toLowerCase() === normalizedEventTitle) {
        return task;
      }
      
      // タイトルの類似度チェック
      var normalizedTaskTitle = task.title.toLowerCase();
      
      // 完全一致
      if (normalizedTaskTitle === normalizedEventTitle) {
        return task;
      }
      
      // 部分一致（タスクタイトルがイベントタイトルを含む、またはその逆）
      if (normalizedTaskTitle.indexOf(normalizedEventTitle) !== -1 || 
          normalizedEventTitle.indexOf(normalizedTaskTitle) !== -1) {
        return task;
      }
      
      // タスクタイトルから自動生成部分を除去して比較
      var cleanTaskTitle = normalizedTaskTitle
        .replace(/\s*-\s*準備・フォローアップ$/, '')
        .replace(/\s*-\s*会議準備$/, '')
        .replace(/\s*-\s*準備$/, '')
        .replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, '')
        .trim();
      
      if (cleanTaskTitle === normalizedEventTitle) {
        return task;
      }
    }
  }
  
  return null;
};

/**
 * NotionページからタイトルILL
 */
CalendarMarkRepair.prototype.extractTitle = function(page) {
  try {
    if (page.properties && page.properties['名前'] && page.properties['名前'].title) {
      var titleArray = page.properties['名前'].title;
      if (titleArray.length > 0 && titleArray[0].plain_text) {
        return titleArray[0].plain_text;
      }
    }
  } catch (error) {
    console.warn('タイトル抽出エラー: ' + error.message);
  }
  return '';
};

/**
 * Notionページから元イベント名を抽出
 */
CalendarMarkRepair.prototype.extractOriginalEvent = function(page) {
  try {
    // カスタムプロパティから抽出を試みる
    if (page.properties && page.properties['元イベント']) {
      if (page.properties['元イベント'].rich_text && 
          page.properties['元イベント'].rich_text.length > 0) {
        return page.properties['元イベント'].rich_text[0].plain_text;
      }
    }
    
    // コンテキストプロパティから抽出
    if (page.properties && page.properties['コンテキスト']) {
      if (page.properties['コンテキスト'].rich_text && 
          page.properties['コンテキスト'].rich_text.length > 0) {
        var context = page.properties['コンテキスト'].rich_text[0].plain_text;
        var match = context.match(/元イベント:\s*([^|]+)/);
        if (match) {
          return match[1].trim();
        }
      }
    }
  } catch (error) {
    console.warn('元イベント抽出エラー: ' + error.message);
  }
  return '';
};

/**
 * Notionページから期日を抽出
 */
CalendarMarkRepair.prototype.extractDueDate = function(page) {
  try {
    if (page.properties && page.properties['期日'] && page.properties['期日'].date) {
      return page.properties['期日'].date.start;
    }
  } catch (error) {
    console.warn('期日抽出エラー: ' + error.message);
  }
  return '';
};

// =============================================================================
// 実行関数
// =============================================================================

/**
 * カレンダーマーク修復を実行（デフォルト: 過去7日間）
 */
function runCalendarMarkRepair() {
  console.log('=== カレンダーマーク修復実行 ===');
  
  try {
    var repair = new CalendarMarkRepair();
    var results = repair.repairCalendarMarks();
    
    console.log('修復完了！');
    console.log('新規マーク追加: ' + results.newlyMarked + '件');
    
    return results;
    
  } catch (error) {
    console.error('修復実行エラー: ' + error.message);
    throw error;
  }
}

/**
 * 指定期間のカレンダーマーク修復を実行
 */
function runCalendarMarkRepairForPeriod(days) {
  days = days || 30; // デフォルト30日
  
  console.log('=== カレンダーマーク修復実行（過去' + days + '日間） ===');
  
  try {
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    var repair = new CalendarMarkRepair();
    var results = repair.repairCalendarMarks(startDate, endDate);
    
    console.log('修復完了！');
    console.log('新規マーク追加: ' + results.newlyMarked + '件');
    
    return results;
    
  } catch (error) {
    console.error('修復実行エラー: ' + error.message);
    throw error;
  }
}

/**
 * 未処理イベントの確認（修復前の確認用）
 */
function checkUnprocessedEvents() {
  console.log('=== 未処理イベント確認 ===');
  
  try {
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    var updater = new CalendarEventUpdater();
    var unprocessedEvents = updater.findUnprocessedEventsInRange(startDate, endDate);
    
    console.log('未処理イベント数: ' + unprocessedEvents.length);
    
    for (var i = 0; i < Math.min(10, unprocessedEvents.length); i++) {
      var event = unprocessedEvents[i];
      console.log((i + 1) + '. "' + event.title + '" (' + event.start.toLocaleDateString() + ')');
    }
    
    if (unprocessedEvents.length > 10) {
      console.log('... 他' + (unprocessedEvents.length - 10) + '件');
    }
    
    return unprocessedEvents;
    
  } catch (error) {
    console.error('確認エラー: ' + error.message);
    throw error;
  }
}