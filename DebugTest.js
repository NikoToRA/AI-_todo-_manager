/**
 * デバッグ用テスト関数
 * 修正後の動作確認を行う
 */

/**
 * カレンダーマーク機能の詳細テスト
 */
function testCalendarMarkFunction() {
  console.log('=== カレンダーマーク機能テスト ===');
  
  try {
    var calendarUpdater = new CalendarEventUpdater();
    var calendar = CalendarApp.getDefaultCalendar();
    var today = new Date();
    var nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    var events = calendar.getEvents(today, nextDay);
    console.log('テスト対象イベント: ' + events.length + '件');
    
    if (events.length === 0) {
      console.log('⚠️ テスト用イベントがありません');
      return;
    }
    
    // 最初の1件をテスト
    var testEvent = events[0];
    var originalTitle = testEvent.getTitle();
    
    console.log('テストイベント: "' + originalTitle + '"');
    
    // 処理済みかチェック
    var isProcessed = calendarUpdater.isEventProcessed(testEvent);
    console.log('処理済み状態: ' + (isProcessed ? 'はい' : 'いいえ'));
    
    if (!isProcessed) {
      console.log('マーク追加テスト実行中...');
      var markResult = calendarUpdater.markEventAsProcessed(testEvent);
      console.log('マーク追加結果: ' + (markResult ? '✅ 成功' : '❌ 失敗'));
      
      // 再チェック
      var isProcessedAfter = calendarUpdater.isEventProcessed(testEvent);
      console.log('マーク後状態: ' + (isProcessedAfter ? '✅ 処理済み' : '❌ 未処理'));
    } else {
      console.log('既に処理済みマーク付き');
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 重複チェック機能の詳細テスト
 */
function testDuplicateLogic() {
  console.log('=== 重複チェック詳細テスト ===');
  
  try {
    var duplicateChecker = new TaskDuplicateChecker();
    
    // テストケース: Train to 新札幌
    var newTask = {
      title: 'Train to 新札幌 (2025-08-13)',
      source: 'calendar',
      due_date: '2025-08-13',
      original_event: 'Train to 新札幌'
    };
    
    var existingTask = {
      title: 'Train to 新札幌 (17:55-18:55)',
      source: 'calendar',
      due_date: '2025-08-13',
      original_event: 'Train to 新札幌'
    };
    
    console.log('新タスク: "' + newTask.title + '"');
    console.log('既存タスク: "' + existingTask.title + '"');
    
    // 日付除去テスト
    var newClean = duplicateChecker.removeDateFromTitle(newTask.title);
    var existingClean = duplicateChecker.removeDateFromTitle(existingTask.title);
    
    console.log('日付除去後:');
    console.log('  新: "' + newClean + '"');
    console.log('  既存: "' + existingClean + '"');
    console.log('  一致: ' + (newClean === existingClean));
    
    // 類似度計算
    if (typeof Utils !== 'undefined' && Utils.calculateSimilarity) {
      var similarity = Utils.calculateSimilarity(newClean, existingClean);
      console.log('類似度: ' + similarity.toFixed(2));
    }
    
    // 重複チェック実行
    var isDuplicate = duplicateChecker.isDateConflict(newTask, existingTask);
    console.log('重複判定: ' + (isDuplicate ? '✅ 重複' : '❌ 重複ではない'));
    
  } catch (error) {
    console.error('❌ 重複チェックテストエラー:', error.message);
  }
  
  console.log('=== 重複チェックテスト完了 ===');
}

/**
 * Notion検索機能のテスト
 */
function testNotionSearch() {
  console.log('=== Notion検索機能テスト ===');
  
  try {
    var config = ConfigManager.getConfig();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 検索テスト
    var testEvent = 'Train to 新札幌';
    var testDate = '2025-08-13';
    
    console.log('検索対象: "' + testEvent + '" (' + testDate + ')');
    
    var result = notionClient.isAlreadyProcessed(testEvent, testDate);
    console.log('検索結果: ' + (result ? '✅ 処理済み' : '❌ 未処理'));
    
    // 検索エラーの詳細確認
    var queryTest = notionClient._executeQuery({
      'and': [
        {
          'property': 'type',
          'select': { 'equals': 'task' }
        },
        {
          'property': 'source',
          'select': { 'equals': 'calendar' }
        }
      ]
    });
    
    if (queryTest !== null) {
      console.log('基本クエリ成功: ' + queryTest.length + '件');
    } else {
      console.log('❌ 基本クエリ失敗');
    }
    
  } catch (error) {
    console.error('❌ Notion検索テストエラー:', error.message);
  }
  
  console.log('=== Notion検索テスト完了 ===');
}

/**
 * 総合デバッグテスト
 */
function runDebugTest() {
  console.log('🔍 === 総合デバッグテスト開始 ===');
  
  console.log('\n1. カレンダーマーク機能テスト');
  testCalendarMarkFunction();
  
  console.log('\n2. 重複チェック機能テスト');
  testDuplicateLogic();
  
  console.log('\n3. Notion検索機能テスト');
  testNotionSearch();
  
  console.log('\n🎯 === 総合デバッグテスト完了 ===');
}

/**
 * 1件のイベント処理テスト
 */
function testSingleEventProcessing() {
  console.log('=== 1件イベント処理テスト ===');
  
  try {
    var config = ConfigManager.getConfig();
    var taskExtractor = new TaskExtractor(config);
    var calendar = CalendarApp.getDefaultCalendar();
    
    var today = new Date();
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    var events = calendar.getEvents(today, tomorrow);
    
    if (events.length === 0) {
      console.log('⚠️ テスト用イベントがありません');
      return;
    }
    
    // 未処理のイベントを1件選択
    var testEvent = null;
    for (var i = 0; i < events.length; i++) {
      if (!taskExtractor.calendarUpdater.isEventProcessed(events[i])) {
        testEvent = events[i];
        break;
      }
    }
    
    if (!testEvent) {
      console.log('未処理のイベントがありません - 新しいテストイベントを作成してください');
      return;
    }
    
    console.log('テストイベント: "' + testEvent.getTitle() + '"');
    
    // 1件だけの抽出テスト
    var eventDate = testEvent.getStartTime().toISOString().split('T')[0];
    var originalTitle = testEvent.getTitle();
    
    // Notionチェック
    var notionCheck = taskExtractor.notionClient.isAlreadyProcessed(originalTitle, eventDate);
    console.log('Notion処理済みチェック: ' + (notionCheck ? 'はい' : 'いいえ'));
    
    // タスク抽出
    var extractedTasks = taskExtractor.analyzeCalendarEvent(testEvent);
    console.log('抽出されたタスク数: ' + extractedTasks.length);
    
    if (extractedTasks.length > 0) {
      console.log('タスクタイトル: "' + extractedTasks[0].title + '"');
      
      // カレンダーマーク追加
      var markResult = taskExtractor.calendarUpdater.markEventAsProcessed(testEvent);
      console.log('カレンダーマーク追加: ' + (markResult ? '✅ 成功' : '❌ 失敗'));
    }
    
  } catch (error) {
    console.error('❌ 1件処理テストエラー:', error.message);
  }
  
  console.log('=== 1件処理テスト完了 ===');
}