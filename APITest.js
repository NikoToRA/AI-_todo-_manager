/**
 * API実行用テスト関数
 */
function runAPITest() {
  console.log('=== API実行テスト開始 ===');
  
  try {
    // 1. システム状態確認
    console.log('1. システム状態確認中...');
    var systemStatus = checkSystemStatus();
    console.log('システム状態確認結果:', systemStatus);
    
    // 2. ProcessedTracker テスト
    console.log('2. ProcessedTracker テスト中...');
    testProcessedTrackerES5();
    
    // 3. 基本的な動作テスト
    console.log('3. 基本動作テスト中...');
    var manualTestResult = runManualTest();
    console.log('基本動作テスト結果:', manualTestResult);
    
    console.log('✅ API実行テスト完了');
    return {
      success: true,
      systemStatus: systemStatus,
      manualTest: manualTestResult
    };
    
  } catch (error) {
    console.error('❌ API実行テストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * 緊急時の最小限テスト
 */
function runMinimalTest() {
  console.log('=== 最小限テスト開始 ===');
  
  try {
    // 設定確認のみ
    var config = ConfigManager.getConfig();
    console.log('設定確認:', {
      notionToken: config.notionToken ? '設定済み' : '未設定',
      notionDatabaseId: config.notionDatabaseId ? '設定済み' : '未設定',
      geminiApiKey: config.geminiApiKey ? '設定済み' : '未設定'
    });
    
    // ProcessedTracker 初期化確認
    var tracker = new ProcessedTracker();
    var stats = tracker.getProcessingStats();
    console.log('ProcessedTracker統計:', stats);
    
    console.log('✅ 最小限テスト完了');
    return {
      success: true,
      config: config,
      trackerStats: stats
    };
    
  } catch (error) {
    console.error('❌ 最小限テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 緊急タスク作成テスト
 */
function testEmergencyTaskCreation() {
  console.log('=== 緊急タスク作成テスト ===');
  
  try {
    var result = createEmergencyTask('テスト用緊急タスク', '高');
    console.log('緊急タスク作成結果:', result);
    
    return {
      success: result,
      message: result ? '緊急タスク作成成功' : '緊急タスク作成失敗'
    };
    
  } catch (error) {
    console.error('❌ 緊急タスク作成エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * カレンダー統合テスト
 */
function testCalendarIntegration() {
  console.log('=== カレンダー統合テスト ===');
  
  try {
    var calendar = CalendarApp.getDefaultCalendar();
    var today = new Date();
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    var events = calendar.getEvents(today, tomorrow);
    
    console.log('取得したイベント数:', events.length);
    
    if (events.length > 0) {
      var testEvent = events[0];
      console.log('テストイベント:', testEvent.getTitle());
      
      // ProcessedTracker テスト
      var tracker = new ProcessedTracker();
      var isProcessed = tracker.isCalendarEventProcessed(testEvent);
      console.log('処理済み状態:', isProcessed);
      
      return {
        success: true,
        eventCount: events.length,
        testEvent: testEvent.getTitle(),
        isProcessed: isProcessed
      };
    } else {
      console.log('テスト用のイベントがありません');
      return {
        success: true,
        eventCount: 0,
        message: 'イベントなし'
      };
    }
    
  } catch (error) {
    console.error('❌ カレンダー統合テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}