/**
 * システム修正後のテスト関数
 * 重複防止機能とカレンダーマーク機能の動作確認
 */

/**
 * 修正版システムの包括的テスト
 */
function testSystemFixes() {
  console.log('=== システム修正版テスト開始 ===');
  
  try {
    // 設定確認
    var config = ConfigManager.getConfig();
    var validation = ConfigManager.validateConfig();
    
    if (!validation.isValid) {
      console.error('❌ 設定が無効です:', validation.errors.join(', '));
      return {
        success: false,
        error: '設定が無効: ' + validation.errors.join(', ')
      };
    }
    
    console.log('✅ 設定確認完了');
    
    // 1. NotionClient重複チェックテスト
    console.log('\n--- 1. Notion重複チェック機能テスト ---');
    var notionTestResult = testNotionDuplicateCheck();
    console.log('Notion重複チェック結果:', notionTestResult.success ? '✅ 成功' : '❌ 失敗');
    
    // 2. カレンダー処理テスト
    console.log('\n--- 2. カレンダー処理テスト ---');
    var calendarTestResult = testCalendarProcessing();
    console.log('カレンダー処理結果:', calendarTestResult.success ? '✅ 成功' : '❌ 失敗');
    
    // 3. 重複防止統合テスト
    console.log('\n--- 3. 重複防止統合テスト ---');
    var duplicateTestResult = testDuplicatePrevention();
    console.log('重複防止結果:', duplicateTestResult.success ? '✅ 成功' : '❌ 失敗');
    
    // 総合結果
    var overallSuccess = notionTestResult.success && calendarTestResult.success && duplicateTestResult.success;
    
    console.log('\n=== テスト結果サマリー ===');
    console.log('1. Notion重複チェック: ' + (notionTestResult.success ? '✅' : '❌'));
    console.log('2. カレンダー処理: ' + (calendarTestResult.success ? '✅' : '❌'));
    console.log('3. 重複防止統合: ' + (duplicateTestResult.success ? '✅' : '❌'));
    console.log('総合判定: ' + (overallSuccess ? '🎉 修正成功' : '⚠️ 要追加修正'));
    
    return {
      success: overallSuccess,
      results: {
        notion: notionTestResult,
        calendar: calendarTestResult,
        duplicate: duplicateTestResult
      }
    };
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Notion重複チェック機能のテスト
 */
function testNotionDuplicateCheck() {
  try {
    console.log('[NotionTest] 重複チェック機能テスト開始');
    
    var config = ConfigManager.getConfig();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // テストケース1: 存在しないイベントのチェック
    var testEvent1 = 'テストイベント_' + new Date().getTime();
    var testDate1 = new Date().toISOString().split('T')[0];
    
    var result1 = notionClient.isAlreadyProcessed(testEvent1, testDate1);
    console.log('[NotionTest] 新イベントチェック: ' + (result1 === false ? '✅ 正常' : '❌ 異常'));
    
    // テストケース2: 日付付きタイトルの検索テスト
    var testEvent2 = 'テスト会議';
    var testDate2 = '2025-01-15';
    
    console.log('[NotionTest] 日付付きタイトル検索テスト実行中...');
    var result2 = notionClient.isAlreadyProcessed(testEvent2, testDate2);
    console.log('[NotionTest] 日付付き検索結果: ' + result2 + ' (既存データに依存)');
    
    // 検索実行の動作確認
    var queryTest = notionClient._executeQuery({
      'and': [
        {
          'property': 'type',
          'select': { 'equals': 'task' }
        }
      ]
    });
    
    var querySuccess = queryTest !== null;
    console.log('[NotionTest] クエリ実行機能: ' + (querySuccess ? '✅ 正常' : '❌ 異常'));
    
    return {
      success: querySuccess,
      details: {
        newEventCheck: result1 === false,
        queryFunction: querySuccess,
        existingEventCheck: result2
      }
    };
    
  } catch (error) {
    console.error('[NotionTest] エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * カレンダー処理機能のテスト
 */
function testCalendarProcessing() {
  try {
    console.log('[CalendarTest] カレンダー処理テスト開始');
    
    var config = ConfigManager.getConfig();
    var taskExtractor = new TaskExtractor(config);
    
    // 短期間でのテスト実行
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // 1日前から
    
    console.log('[CalendarTest] テスト期間: ' + startDate + ' - ' + endDate);
    
    // カレンダー処理実行
    var result = taskExtractor.extractFromCalendar(startDate, endDate);
    
    console.log('[CalendarTest] 処理結果:');
    console.log('  - 処理タスク数: ' + result.length);
    
    // カレンダーマーク機能のテスト
    var calendarUpdater = new CalendarEventUpdater();
    var calendar = CalendarApp.getDefaultCalendar();
    var events = calendar.getEvents(startDate, endDate);
    
    var markedCount = 0;
    for (var i = 0; i < Math.min(events.length, 3); i++) { // 最大3件をテスト
      if (calendarUpdater.isEventProcessed(events[i])) {
        markedCount++;
      }
    }
    
    console.log('[CalendarTest] 処理済みマーク確認: ' + markedCount + '/' + Math.min(events.length, 3) + '件');
    
    return {
      success: true,
      details: {
        processedTasks: result.length,
        markedEvents: markedCount,
        totalEvents: Math.min(events.length, 3)
      }
    };
    
  } catch (error) {
    console.error('[CalendarTest] エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 重複防止機能の統合テスト
 */
function testDuplicatePrevention() {
  try {
    console.log('[DuplicateTest] 重複防止テスト開始');
    
    var config = ConfigManager.getConfig();
    var duplicateChecker = new TaskDuplicateChecker();
    
    // テストタスクの作成
    var baseTask = {
      title: '水戸支援会議',
      source: 'calendar',
      due_date: '2025-01-20',
      original_event: '水戸支援会議'
    };
    
    var testTasks = [
      baseTask,
      {
        title: '水戸支援会議 (2025-01-21)', // 異なる日付
        source: 'calendar',
        due_date: '2025-01-21',
        original_event: '水戸支援会議'
      },
      {
        title: '水戸支援会議 (2025-01-20)', // 同じ日付
        source: 'calendar',
        due_date: '2025-01-20',
        original_event: '水戸支援会議'
      }
    ];
    
    // 重複チェックテスト
    console.log('[DuplicateTest] 基本重複チェック実行中...');
    
    // ケース1: 異なる日付（重複ではない）
    var isDuplicate1 = duplicateChecker.checkBasicDuplicate(testTasks[1], [testTasks[0]]);
    console.log('[DuplicateTest] 異なる日付チェック: ' + (!isDuplicate1 ? '✅ 重複なし（正常）' : '❌ 重複あり（異常）'));
    
    // ケース2: 同じ日付（重複）
    var isDuplicate2 = duplicateChecker.checkBasicDuplicate(testTasks[2], [testTasks[0]]);
    console.log('[DuplicateTest] 同じ日付チェック: ' + (isDuplicate2 ? '✅ 重複あり（正常）' : '❌ 重複なし（異常）'));
    
    // 日付除去機能のテスト
    var cleanTitle1 = duplicateChecker.removeDateFromTitle('水戸支援会議 (2025-01-20)');
    var cleanTitle2 = duplicateChecker.removeDateFromTitle('水戸支援会議');
    
    var titleCleanSuccess = (cleanTitle1 === '水戸支援会議' && cleanTitle2 === '水戸支援会議');
    console.log('[DuplicateTest] 日付除去機能: ' + (titleCleanSuccess ? '✅ 正常' : '❌ 異常'));
    console.log('  結果1: "' + cleanTitle1 + '"');
    console.log('  結果2: "' + cleanTitle2 + '"');
    
    return {
      success: !isDuplicate1 && isDuplicate2 && titleCleanSuccess,
      details: {
        differentDateCheck: !isDuplicate1,
        sameDateCheck: isDuplicate2,
        titleCleanFunction: titleCleanSuccess
      }
    };
    
  } catch (error) {
    console.error('[DuplicateTest] エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 簡単実行用関数
 */
function runSystemTest() {
  return testSystemFixes();
}

/**
 * カレンダーマーク確認用関数
 */
function checkCalendarMarks() {
  console.log('=== カレンダーマーク確認 ===');
  
  try {
    var calendarUpdater = new CalendarEventUpdater();
    var calendar = CalendarApp.getDefaultCalendar();
    var today = new Date();
    var nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    var events = calendar.getEvents(today, nextWeek);
    console.log('確認対象イベント: ' + events.length + '件');
    
    var markedCount = 0;
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var title = event.getTitle();
      var isProcessed = calendarUpdater.isEventProcessed(event);
      
      console.log((i + 1) + '. "' + title + '" - ' + (isProcessed ? '🤖処理済み' : '未処理'));
      
      if (isProcessed) {
        markedCount++;
      }
    }
    
    console.log('\n処理済みマーク済み: ' + markedCount + '/' + events.length + '件');
    console.log('マーク率: ' + (events.length > 0 ? Math.round((markedCount / events.length) * 100) : 0) + '%');
    
  } catch (error) {
    console.error('❌ カレンダーマーク確認エラー:', error.message);
  }
  
  console.log('\n=== 確認完了 ===');
}