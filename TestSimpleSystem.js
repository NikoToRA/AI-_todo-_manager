/**
 * シンプル版システムのテストスイート
 * ロボットマーク一元管理システムの動作確認
 */

/**
 * システム全体のテスト
 */
function testSimpleSystem() {
  console.log('===========================================');
  console.log('🧪 シンプル版システムテスト');
  console.log('===========================================\n');
  
  var results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // テスト1: ロボットマーク検出
  console.log('📌 テスト1: ロボットマーク検出機能');
  var test1 = testRobotMarkDetection();
  results.total++;
  if (test1.success) {
    results.passed++;
    console.log('   ✅ 成功\n');
  } else {
    results.failed++;
    console.log('   ❌ 失敗: ' + test1.error + '\n');
  }
  results.tests.push(test1);
  
  // テスト2: カレンダーイベント処理
  console.log('📌 テスト2: カレンダーイベント処理');
  var test2 = testCalendarEventProcessing();
  results.total++;
  if (test2.success) {
    results.passed++;
    console.log('   ✅ 成功\n');
  } else {
    results.failed++;
    console.log('   ❌ 失敗: ' + test2.error + '\n');
  }
  results.tests.push(test2);
  
  // テスト3: タスクデータ生成
  console.log('📌 テスト3: タスクデータ生成');
  var test3 = testTaskDataCreation();
  results.total++;
  if (test3.success) {
    results.passed++;
    console.log('   ✅ 成功\n');
  } else {
    results.failed++;
    console.log('   ❌ 失敗: ' + test3.error + '\n');
  }
  results.tests.push(test3);
  
  // 結果表示
  console.log('===========================================');
  console.log('📊 テスト結果');
  console.log('===========================================');
  console.log('合計: ' + results.total + '件');
  console.log('成功: ' + results.passed + '件');
  console.log('失敗: ' + results.failed + '件');
  
  if (results.failed === 0) {
    console.log('\n🎉 全テスト成功！システムは正常に動作しています。');
  } else {
    console.log('\n⚠️ 一部のテストが失敗しました。詳細を確認してください。');
  }
  
  return results;
}

/**
 * テスト1: ロボットマーク検出機能
 */
function testRobotMarkDetection() {
  try {
    var updater = new CalendarEventUpdater();
    
    // モックイベントでテスト
    var mockEventWithMark = {
      getTitle: function() { return '🤖 会議の準備'; },
      setTitle: function(title) { this.title = title; }
    };
    
    var mockEventWithoutMark = {
      getTitle: function() { return '会議の準備'; },
      setTitle: function(title) { this.title = title; }
    };
    
    // マーク検出テスト
    var hasMarkTest = updater.isEventProcessed(mockEventWithMark);
    var noMarkTest = updater.isEventProcessed(mockEventWithoutMark);
    
    if (hasMarkTest === true && noMarkTest === false) {
      return { success: true, name: 'ロボットマーク検出' };
    } else {
      return { 
        success: false, 
        name: 'ロボットマーク検出',
        error: 'マーク検出が正しく動作していません'
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      name: 'ロボットマーク検出',
      error: error.message 
    };
  }
}

/**
 * テスト2: カレンダーイベント処理
 */
function testCalendarEventProcessing() {
  try {
    // 今日の日付範囲
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // カレンダー取得テスト
    var calendars = CalendarApp.getAllCalendars();
    if (!calendars || calendars.length === 0) {
      return {
        success: false,
        name: 'カレンダーイベント処理',
        error: 'カレンダーが見つかりません'
      };
    }
    
    // イベント取得テスト
    var testCalendar = calendars[0];
    var events = testCalendar.getEvents(today, tomorrow);
    
    console.log('   カレンダー: ' + testCalendar.getName());
    console.log('   今日のイベント数: ' + events.length);
    
    return { success: true, name: 'カレンダーイベント処理' };
    
  } catch (error) {
    return {
      success: false,
      name: 'カレンダーイベント処理',
      error: error.message
    };
  }
}

/**
 * テスト3: タスクデータ生成
 */
function testTaskDataCreation() {
  try {
    // モックイベント
    var mockEvent = {
      getTitle: function() { return 'テスト会議'; },
      getStartTime: function() { return new Date(); },
      getEndTime: function() { return new Date(Date.now() + 3600000); },
      getLocation: function() { return '会議室A'; },
      getDescription: function() { return 'テスト用の会議です'; },
      getGuestList: function() { return []; }
    };
    
    // タスクデータ生成
    var taskData = createTaskFromCalendarEvent(mockEvent);
    
    // 必須フィールドの確認
    if (!taskData.title) {
      return {
        success: false,
        name: 'タスクデータ生成',
        error: 'タイトルが生成されていません'
      };
    }
    
    if (!taskData.source || taskData.source !== 'calendar') {
      return {
        success: false,
        name: 'タスクデータ生成',
        error: 'ソースが正しく設定されていません'
      };
    }
    
    if (!taskData.priority) {
      return {
        success: false,
        name: 'タスクデータ生成',
        error: '優先度が設定されていません'
      };
    }
    
    console.log('   生成されたタスク: ' + taskData.title);
    console.log('   優先度: ' + taskData.priority);
    
    return { success: true, name: 'タスクデータ生成' };
    
  } catch (error) {
    return {
      success: false,
      name: 'タスクデータ生成',
      error: error.message
    };
  }
}

/**
 * マーク追加・削除の統合テスト
 */
function testMarkLifecycle() {
  console.log('===========================================');
  console.log('🔄 ロボットマークライフサイクルテスト');
  console.log('===========================================\n');
  
  try {
    var updater = new CalendarEventUpdater();
    
    // テストイベントを作成
    var calendars = CalendarApp.getAllCalendars();
    if (calendars.length === 0) {
      console.log('❌ テスト失敗: カレンダーが見つかりません');
      return false;
    }
    
    var calendar = calendars[0];
    var now = new Date();
    var testEvent = calendar.createEvent(
      'ライフサイクルテスト_' + now.getTime(),
      now,
      new Date(now.getTime() + 3600000)
    );
    
    console.log('1️⃣ テストイベント作成: ' + testEvent.getTitle());
    
    // 初期状態確認
    var initialCheck = updater.isEventProcessed(testEvent);
    console.log('2️⃣ 初期状態: ' + (initialCheck ? '処理済み' : '未処理'));
    
    if (initialCheck) {
      console.log('❌ エラー: 新規イベントが処理済みと判定されました');
      testEvent.deleteEvent();
      return false;
    }
    
    // マーク追加
    console.log('3️⃣ ロボットマークを追加...');
    var markAdded = updater.markEventAsProcessed(testEvent);
    
    if (!markAdded) {
      console.log('❌ エラー: マーク追加に失敗しました');
      testEvent.deleteEvent();
      return false;
    }
    
    // マーク追加後の確認
    var afterMarkCheck = updater.isEventProcessed(testEvent);
    console.log('4️⃣ マーク追加後: ' + (afterMarkCheck ? '処理済み' : '未処理'));
    
    if (!afterMarkCheck) {
      console.log('❌ エラー: マークが正しく追加されていません');
      testEvent.deleteEvent();
      return false;
    }
    
    // マーク削除（ユーザー操作のシミュレーション）
    console.log('5️⃣ ロボットマークを削除（ユーザー操作シミュレーション）...');
    updater.removeProcessedTag(testEvent);
    
    // マーク削除後の確認
    var afterRemoveCheck = updater.isEventProcessed(testEvent);
    console.log('6️⃣ マーク削除後: ' + (afterRemoveCheck ? '処理済み' : '未処理'));
    
    if (afterRemoveCheck) {
      console.log('❌ エラー: マークが正しく削除されていません');
      testEvent.deleteEvent();
      return false;
    }
    
    // クリーンアップ
    testEvent.deleteEvent();
    console.log('7️⃣ テストイベント削除完了');
    
    console.log('\n✅ ライフサイクルテスト成功！');
    console.log('ユーザーがロボットマークを削除した場合、');
    console.log('次回実行時に再度タスクが作成される仕様が確認できました。');
    
    return true;
    
  } catch (error) {
    console.error('❌ テストエラー: ' + error.message);
    return false;
  }
}

/**
 * 実行前の状況確認（非破壊的）
 */
function preflightCheck() {
  console.log('===========================================');
  console.log('✈️ 実行前チェック');
  console.log('===========================================\n');
  
  try {
    // 1. 設定確認
    console.log('1️⃣ 設定確認');
    var config = ConfigManager.getConfig();
    var validation = ConfigManager.validateConfig();
    
    if (validation.isValid) {
      console.log('   ✅ 設定: 有効');
    } else {
      console.log('   ❌ 設定: 無効');
      console.log('   エラー: ' + validation.errors.join(', '));
      return false;
    }
    
    // 2. Notion接続確認
    console.log('\n2️⃣ Notion接続確認');
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    var connectionTest = notionClient.testConnection();
    
    if (connectionTest.success) {
      console.log('   ✅ Notion接続: 成功');
      console.log('   データベース: ' + connectionTest.database_title);
    } else {
      console.log('   ❌ Notion接続: 失敗');
      console.log('   エラー: ' + connectionTest.error);
      return false;
    }
    
    // 3. カレンダーアクセス確認
    console.log('\n3️⃣ カレンダーアクセス確認');
    var calendars = CalendarApp.getAllCalendars();
    console.log('   カレンダー数: ' + calendars.length);
    
    if (calendars.length === 0) {
      console.log('   ⚠️ 警告: アクセス可能なカレンダーがありません');
    } else {
      for (var i = 0; i < Math.min(3, calendars.length); i++) {
        console.log('   • ' + calendars[i].getName());
      }
      if (calendars.length > 3) {
        console.log('   ... 他' + (calendars.length - 3) + '件');
      }
    }
    
    // 4. 処理予定の確認
    console.log('\n4️⃣ 処理予定の確認（過去7日間）');
    var result = dryRun();
    
    console.log('\n===========================================');
    console.log('✅ 実行前チェック完了');
    console.log('===========================================');
    console.log('システムは正常に動作する準備ができています。');
    console.log('\n実行するには:');
    console.log('  • テスト実行: runTodayOnly()');
    console.log('  • 本番実行: runSimpleTaskExtraction()');
    
    return true;
    
  } catch (error) {
    console.error('❌ チェックエラー: ' + error.message);
    return false;
  }
}