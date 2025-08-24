/**
 * カレンダーマーク機能テストスイート
 * ロボットマークの追加、確認、修復機能をテスト
 */

/**
 * カレンダーマーク機能の総合テスト
 */
function testCalendarMarkSystem() {
  console.log('===================================');
  console.log('カレンダーマーク機能テスト開始');
  console.log('===================================');
  
  var results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // 1. CalendarEventUpdater機能テスト
  console.log('\n[テスト1] CalendarEventUpdater機能テスト');
  try {
    var test1 = testCalendarEventUpdater();
    results.total++;
    if (test1.success) {
      results.passed++;
      console.log('✅ テスト1: 成功');
    } else {
      results.failed++;
      console.log('❌ テスト1: 失敗');
      results.errors.push('CalendarEventUpdater: ' + test1.error);
    }
  } catch (error) {
    results.failed++;
    results.total++;
    console.error('❌ テスト1: エラー - ' + error.message);
    results.errors.push('CalendarEventUpdater: ' + error.message);
  }
  
  // 2. 処理済みイベント検索テスト
  console.log('\n[テスト2] 処理済みイベント検索テスト');
  try {
    var test2 = testFindProcessedEvents();
    results.total++;
    if (test2.success) {
      results.passed++;
      console.log('✅ テスト2: 成功');
    } else {
      results.failed++;
      console.log('❌ テスト2: 失敗');
      results.errors.push('FindProcessedEvents: ' + test2.error);
    }
  } catch (error) {
    results.failed++;
    results.total++;
    console.error('❌ テスト2: エラー - ' + error.message);
    results.errors.push('FindProcessedEvents: ' + error.message);
  }
  
  // 3. カレンダーマーク修復機能テスト
  console.log('\n[テスト3] カレンダーマーク修復機能テスト');
  try {
    var test3 = testCalendarMarkRepair();
    results.total++;
    if (test3.success) {
      results.passed++;
      console.log('✅ テスト3: 成功');
    } else {
      results.failed++;
      console.log('❌ テスト3: 失敗');
      results.errors.push('CalendarMarkRepair: ' + test3.error);
    }
  } catch (error) {
    results.failed++;
    results.total++;
    console.error('❌ テスト3: エラー - ' + error.message);
    results.errors.push('CalendarMarkRepair: ' + error.message);
  }
  
  // 4. 重複チェック機能テスト
  console.log('\n[テスト4] ロボットマーク付きイベントの重複チェック');
  try {
    var test4 = testDuplicateCheckWithRobotMark();
    results.total++;
    if (test4.success) {
      results.passed++;
      console.log('✅ テスト4: 成功');
    } else {
      results.failed++;
      console.log('❌ テスト4: 失敗');
      results.errors.push('DuplicateCheck: ' + test4.error);
    }
  } catch (error) {
    results.failed++;
    results.total++;
    console.error('❌ テスト4: エラー - ' + error.message);
    results.errors.push('DuplicateCheck: ' + error.message);
  }
  
  // テスト結果サマリー
  console.log('\n===================================');
  console.log('テスト結果サマリー');
  console.log('===================================');
  console.log('総テスト数: ' + results.total);
  console.log('成功: ' + results.passed);
  console.log('失敗: ' + results.failed);
  
  if (results.errors.length > 0) {
    console.log('\nエラー詳細:');
    for (var i = 0; i < results.errors.length; i++) {
      console.log('  - ' + results.errors[i]);
    }
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 全テスト成功！');
  } else {
    console.log('\n⚠️ 一部のテストが失敗しました');
  }
  
  return results;
}

/**
 * CalendarEventUpdater機能の個別テスト
 */
function testCalendarEventUpdater() {
  console.log('CalendarEventUpdater機能テスト開始...');
  
  try {
    var updater = new CalendarEventUpdater();
    
    // テスト用のイベント取得（今日のイベント）
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    var calendars = CalendarApp.getAllCalendars();
    if (calendars.length === 0) {
      return { success: false, error: 'カレンダーが見つかりません' };
    }
    
    var testCalendar = calendars[0];
    var events = testCalendar.getEvents(today, tomorrow);
    
    if (events.length === 0) {
      console.log('今日のイベントがないため、テストイベントを作成します');
      
      // テストイベントを作成
      var testEvent = testCalendar.createEvent(
        'テストイベント - ' + new Date().getTime(),
        new Date(),
        new Date(Date.now() + 60 * 60 * 1000) // 1時間後
      );
      
      // マーク追加テスト
      console.log('マーク追加テスト...');
      var markResult = updater.markEventAsProcessed(testEvent);
      
      if (!markResult) {
        // テストイベントを削除
        testEvent.deleteEvent();
        return { success: false, error: 'マーク追加に失敗しました' };
      }
      
      // マーク確認テスト
      console.log('マーク確認テスト...');
      var isProcessed = updater.isEventProcessed(testEvent);
      
      // テストイベントを削除
      testEvent.deleteEvent();
      
      if (!isProcessed) {
        return { success: false, error: 'マーク確認に失敗しました' };
      }
      
      return { success: true };
      
    } else {
      // 既存イベントでテスト
      var testEvent = events[0];
      var originalTitle = testEvent.getTitle();
      
      console.log('既存イベント「' + originalTitle + '」でテスト');
      
      // 既にマークがある場合は除去
      if (updater.isEventProcessed(testEvent)) {
        console.log('既存マークを除去...');
        updater.removeProcessedTag(testEvent);
      }
      
      // マーク追加テスト
      var markResult = updater.markEventAsProcessed(testEvent);
      
      if (!markResult) {
        return { success: false, error: 'マーク追加に失敗しました' };
      }
      
      // マーク確認テスト
      var isProcessed = updater.isEventProcessed(testEvent);
      
      // マークを除去（元に戻す）
      updater.removeProcessedTag(testEvent);
      
      if (!isProcessed) {
        return { success: false, error: 'マーク確認に失敗しました' };
      }
      
      return { success: true };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 処理済みイベント検索機能のテスト
 */
function testFindProcessedEvents() {
  console.log('処理済みイベント検索テスト開始...');
  
  try {
    var updater = new CalendarEventUpdater();
    
    // 過去7日間で検索
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // 処理済みイベントを検索
    var processedEvents = updater.findProcessedEventsInRange(startDate, endDate);
    console.log('処理済みイベント数: ' + processedEvents.length);
    
    // 未処理イベントを検索
    var unprocessedEvents = updater.findUnprocessedEventsInRange(startDate, endDate);
    console.log('未処理イベント数: ' + unprocessedEvents.length);
    
    // 少なくとも検索が実行できることを確認
    if (typeof processedEvents === 'object' && typeof unprocessedEvents === 'object') {
      return { success: true };
    } else {
      return { success: false, error: '検索結果の形式が不正です' };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * カレンダーマーク修復機能のテスト（軽量版）
 */
function testCalendarMarkRepair() {
  console.log('カレンダーマーク修復機能テスト開始...');
  
  try {
    // 設定確認
    var config = ConfigManager.getConfig();
    if (!config.notionToken || !config.notionDatabaseId) {
      console.log('Notion設定が不完全なため、修復機能の初期化のみテスト');
      
      // 初期化のみテスト
      var repair = new CalendarMarkRepair();
      return { success: true };
    }
    
    // 今日と昨日の範囲で軽量テスト
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    var repair = new CalendarMarkRepair();
    
    // getAllCalendarEventsのテスト
    var events = repair.getAllCalendarEvents(startDate, endDate);
    console.log('取得イベント数: ' + events.length);
    
    // 実際の修復は実行しない（軽量テストのため）
    console.log('修復機能の初期化とイベント取得テスト成功');
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * ロボットマーク付きイベントの重複チェックテスト
 */
function testDuplicateCheckWithRobotMark() {
  console.log('ロボットマーク付きイベントの重複チェックテスト開始...');
  
  try {
    var updater = new CalendarEventUpdater();
    
    // モックイベントオブジェクトを作成
    var mockEventWithMark = {
      getTitle: function() { return '🤖 会議の準備'; },
      getStartTime: function() { return new Date(); },
      getEndTime: function() { return new Date(); },
      getLocation: function() { return ''; },
      getDescription: function() { return ''; }
    };
    
    var mockEventWithoutMark = {
      getTitle: function() { return '会議の準備'; },
      getStartTime: function() { return new Date(); },
      getEndTime: function() { return new Date(); },
      getLocation: function() { return ''; },
      getDescription: function() { return ''; }
    };
    
    // ロボットマーク検出テスト
    var hasMarkTest1 = updater.isEventProcessed(mockEventWithMark);
    var hasMarkTest2 = updater.isEventProcessed(mockEventWithoutMark);
    
    console.log('ロボットマーク付きイベント検出: ' + hasMarkTest1);
    console.log('ロボットマークなしイベント検出: ' + hasMarkTest2);
    
    if (hasMarkTest1 === true && hasMarkTest2 === false) {
      return { success: true };
    } else {
      return { success: false, error: 'ロボットマーク検出が正しく動作していません' };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 手動での未処理イベント確認
 */
function manualCheckUnprocessedEvents() {
  console.log('=== 未処理イベント確認（手動実行） ===');
  
  try {
    var days = 7; // 過去7日間
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    var updater = new CalendarEventUpdater();
    var unprocessedEvents = updater.findUnprocessedEventsInRange(startDate, endDate);
    
    console.log('期間: ' + startDate.toLocaleDateString() + ' - ' + endDate.toLocaleDateString());
    console.log('未処理イベント総数: ' + unprocessedEvents.length);
    
    if (unprocessedEvents.length > 0) {
      console.log('\n未処理イベント一覧:');
      console.log('------------------------');
      
      for (var i = 0; i < unprocessedEvents.length; i++) {
        var event = unprocessedEvents[i];
        console.log((i + 1) + '. "' + event.title + '"');
        console.log('   日時: ' + event.start.toLocaleString());
        console.log('   カレンダー: ' + event.calendar);
        console.log('');
      }
      
      console.log('------------------------');
      console.log('これらのイベントにロボットマークを追加するには、');
      console.log('runCalendarMarkRepair() を実行してください。');
    } else {
      console.log('✅ 未処理イベントはありません');
    }
    
    return unprocessedEvents;
    
  } catch (error) {
    console.error('エラー: ' + error.message);
    throw error;
  }
}

/**
 * 手動でのカレンダーマーク修復実行
 */
function manualRunCalendarMarkRepair() {
  console.log('=== カレンダーマーク修復（手動実行） ===');
  
  try {
    var days = 7; // 過去7日間
    
    console.log('過去' + days + '日間のイベントを修復対象とします');
    console.log('処理を開始します...\n');
    
    var results = runCalendarMarkRepairForPeriod(days);
    
    console.log('\n=== 修復完了 ===');
    console.log('処理結果:');
    console.log('  - 総イベント数: ' + results.totalEvents);
    console.log('  - 既にマーク済み: ' + results.alreadyMarked);
    console.log('  - 新規マーク追加: ' + results.newlyMarked);
    console.log('  - マーク追加失敗: ' + results.markFailed);
    console.log('  - Notion未登録: ' + results.notInNotion);
    
    if (results.newlyMarked > 0) {
      console.log('\n✅ ' + results.newlyMarked + '件のイベントにロボットマークを追加しました！');
    }
    
    return results;
    
  } catch (error) {
    console.error('修復実行エラー: ' + error.message);
    throw error;
  }
}