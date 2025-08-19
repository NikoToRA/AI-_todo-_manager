/**
 * 重複防止機能テスト
 */

/**
 * カレンダー重複防止機能のテスト
 */
function testCalendarDuplicatePrevention() {
  console.log('=== カレンダー重複防止機能テスト開始 ===');
  
  try {
    // 設定の確認
    const config = ConfigManager.getConfig();
    console.log('設定確認完了');
    
    // TaskExtractorのインスタンス化をテスト
    const taskExtractor = new TaskExtractor(config);
    console.log('✅ TaskExtractor初期化成功');
    
    // CalendarEventUpdaterの機能テスト
    console.log('CalendarEventUpdaterテスト中...');
    const calendarUpdater = new CalendarEventUpdater();
    console.log('✅ CalendarEventUpdater初期化成功');
    
    // テスト期間設定
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log(`テスト期間: ${today.toDateString()} - ${nextWeek.toDateString()}`);
    
    // カレンダーイベント取得
    const calendar = CalendarApp.getDefaultCalendar();
    const events = calendar.getEvents(today, nextWeek);
    
    console.log(`カレンダーイベント数: ${events.length}件`);
    
    if (events.length === 0) {
      console.log('⚠️ テスト用のカレンダーイベントがありません');
      console.log('テストイベントを作成するか、createTestCalendarEvent()を実行してください');
      return {
        success: false,
        message: 'テストイベントが不足'
      };
    }
    
    // 1回目のタスク抽出実行
    console.log('\n--- 1回目のタスク抽出 ---');
    const result1 = taskExtractor.extractFromCalendar(today, nextWeek);
    console.log(`1回目結果: ${result1.length}件のタスクを処理`);
    
    // イベントが処理済みマークされたかチェック
    console.log('\n--- 処理済みマークチェック ---');
    const eventsAfter = calendar.getEvents(today, nextWeek);
    let markedCount = 0;
    
    eventsAfter.forEach((event, index) => {
      const title = event.getTitle();
      const isProcessed = calendarUpdater.isEventProcessed(event);
      
      console.log(`${index + 1}. "${title}" - 処理済み: ${isProcessed ? 'はい' : 'いいえ'}`);
      
      if (isProcessed) {
        markedCount++;
      }
    });
    
    console.log(`処理済みマーク済みイベント: ${markedCount}/${eventsAfter.length}`);
    
    // 少し待機
    Utilities.sleep(2000);
    
    // 2回目のタスク抽出実行（重複チェック）
    console.log('\n--- 2回目のタスク抽出（重複チェック） ---');
    const result2 = taskExtractor.extractFromCalendar(today, nextWeek);
    console.log(`2回目結果: ${result2.length}件のタスクを処理`);
    
    // テスト結果判定
    console.log('\n--- テスト結果 ---');
    const duplicatePreventionWorking = result2.length === 0;
    
    if (duplicatePreventionWorking) {
      console.log('🎉 重複防止機能は正常に動作しています！');
      console.log('✅ 全てのイベントがスキップされ、重複処理されませんでした');
    } else {
      console.log('⚠️ 重複防止に問題があります');
      console.log(`❌ ${result2.length}件のタスクが重複処理されました`);
    }
    
    console.log('\n=== テスト完了 ===');
    
    return {
      success: duplicatePreventionWorking,
      firstRun: result1.length,
      secondRun: result2.length,
      markedEvents: markedCount,
      totalEvents: eventsAfter.length,
      message: duplicatePreventionWorking ? '重複防止機能正常' : '重複防止機能に問題あり'
    };
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    console.error(error.stack);
    
    return {
      success: false,
      error: error.message,
      message: 'テスト実行中にエラーが発生しました'
    };
  }
}

/**
 * テスト用カレンダーイベントを作成
 */
function createTestCalendarEvent() {
  console.log('=== テスト用カレンダーイベント作成 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const now = new Date();
    const testTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2時間後
    const endTime = new Date(testTime.getTime() + 60 * 60 * 1000); // 1時間のイベント
    
    const testEvent = calendar.createEvent(
      'テストイベント - 重複防止テスト用',
      testTime,
      endTime,
      {
        description: '重複防止機能のテスト用に作成されたイベントです。テスト完了後に削除できます。'
      }
    );
    
    console.log(`✅ テストイベント作成完了:`);
    console.log(`   タイトル: ${testEvent.getTitle()}`);
    console.log(`   日時: ${testEvent.getStartTime().toLocaleString('ja-JP')}`);
    console.log(`   ID: ${testEvent.getId()}`);
    
    console.log('\nテストを実行するには testCalendarDuplicatePrevention() を実行してください');
    
    return testEvent;
    
  } catch (error) {
    console.error('❌ テストイベント作成エラー:', error.message);
    throw error;
  }
}

/**
 * 簡単テスト実行
 */
function runDuplicateTest() {
  return testCalendarDuplicatePrevention();
}

/**
 * 処理済みタグの確認
 */
function checkProcessedTags() {
  console.log('=== 処理済みタグ確認 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const events = calendar.getEvents(today, nextWeek);
    const calendarUpdater = new CalendarEventUpdater();
    
    console.log(`カレンダーイベント数: ${events.length}件\n`);
    
    events.forEach((event, index) => {
      const title = event.getTitle();
      const isProcessed = calendarUpdater.isEventProcessed(event);
      const startTime = event.getStartTime();
      
      console.log(`${index + 1}. "${title}"`);
      console.log(`   日時: ${startTime.toLocaleString('ja-JP')}`);
      console.log(`   処理済み: ${isProcessed ? '✅ はい' : '❌ いいえ'}`);
      
      if (isProcessed) {
        console.log(`   タグ: 🤖処理済み AIタスク管理システムで処理済み`);
      }
      console.log('');
    });
    
    const processedCount = events.filter(event => 
      calendarUpdater.isEventProcessed(event)
    ).length;
    
    console.log(`処理済みイベント: ${processedCount}/${events.length}件`);
    
  } catch (error) {
    console.error('❌ 処理済みタグ確認エラー:', error.message);
  }
  
  console.log('\n=== 確認完了 ===');
}