/**
 * ロボットマーク追加機能の徹底テスト
 */

/**
 * ロボットマーク追加の徹底テスト実行
 */
function testRobotMarkAddition() {
  console.log('=== 🤖ロボットマーク追加徹底テスト開始 ===');
  
  try {
    // 設定とコンポーネント初期化
    const config = ConfigManager.getConfig();
    const taskExtractor = new TaskExtractor(config);
    const calendarUpdater = new CalendarEventUpdater();
    
    // テスト期間設定
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log(`テスト期間: ${today.toDateString()} - ${nextWeek.toDateString()}`);
    
    // 実行前の状態確認
    console.log('\n--- 実行前の状態確認 ---');
    const initialStats = checkRobotMarkStatus(today, nextWeek);
    
    if (initialStats.unmarked === 0) {
      console.log('⚠️ 未マークイベントがありません。テストイベントを作成してください。');
      console.log('createUnmarkedTestEvent() を実行して未マークイベントを作成できます。');
      return {
        success: false,
        message: 'テスト用の未マークイベントが不足'
      };
    }
    
    // TaskExtractorでカレンダー処理実行
    console.log('\n--- TaskExtractor実行（ロボットマーク追加テスト） ---');
    console.log(`未マークイベント ${initialStats.unmarked}件 を処理します...`);
    
    const extractedTasks = taskExtractor.extractFromCalendar(today, nextWeek);
    
    console.log(`タスク抽出結果: ${extractedTasks.length}件のタスクを処理`);
    
    // 少し待機（カレンダー更新の反映待ち）
    console.log('\nカレンダー更新の反映待ち（5秒）...');
    Utilities.sleep(5000);
    
    // 実行後の状態確認
    console.log('\n--- 実行後の状態確認 ---');
    const finalStats = checkRobotMarkStatus(today, nextWeek);
    
    // 結果分析
    const markedCount = finalStats.robotMarked - initialStats.robotMarked;
    const expectedMarkedCount = initialStats.unmarked;
    
    console.log('\n--- テスト結果分析 ---');
    console.log(`実行前未マークイベント: ${initialStats.unmarked}件`);
    console.log(`実行前マーク済みイベント: ${initialStats.robotMarked}件`);
    console.log(`実行後マーク済みイベント: ${finalStats.robotMarked}件`);
    console.log(`新規マーク追加: ${markedCount}件`);
    console.log(`期待マーク追加数: ${expectedMarkedCount}件`);
    
    const success = markedCount >= expectedMarkedCount;
    const coverage = expectedMarkedCount > 0 ? (markedCount / expectedMarkedCount * 100).toFixed(1) : 100;
    
    const testResult = {
      success: success,
      initialUnmarked: initialStats.unmarked,
      initialMarked: initialStats.robotMarked,
      finalMarked: finalStats.robotMarked,
      newlyMarked: markedCount,
      expectedMarked: expectedMarkedCount,
      coverage: parseFloat(coverage),
      extractedTasks: extractedTasks.length,
      message: ''
    };
    
    if (success) {
      testResult.message = `✅ ロボットマーク追加成功！ カバレッジ: ${coverage}%`;
      console.log('🎉 ロボットマーク追加機能は正常に動作しています！');
      console.log(`✅ ${markedCount}/${expectedMarkedCount}件のイベントにマーク追加成功`);
    } else {
      testResult.message = `❌ ロボットマーク追加不完全 カバレッジ: ${coverage}%`;
      console.log('⚠️ ロボットマーク追加に問題があります');
      console.log(`❌ ${expectedMarkedCount - markedCount}件のイベントにマークが追加されませんでした`);
      
      // 未マークイベントの詳細表示
      console.log('\n--- 未マークイベント詳細 ---');
      showUnmarkedEvents(today, nextWeek);
    }
    
    console.log('\n=== テスト完了 ===');
    return testResult;
    
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
 * ロボットマーク状態をチェック
 */
function checkRobotMarkStatus(startDate, endDate) {
  const calendar = CalendarApp.getDefaultCalendar();
  const calendarUpdater = new CalendarEventUpdater();
  const events = calendar.getEvents(startDate, endDate);
  
  let robotMarked = 0;
  let unmarked = 0;
  
  console.log(`カレンダーイベント総数: ${events.length}件`);
  
  events.forEach((event, index) => {
    const isProcessed = calendarUpdater.isEventProcessed(event);
    if (isProcessed) {
      robotMarked++;
    } else {
      unmarked++;
    }
  });
  
  console.log(`🤖 マーク済み: ${robotMarked}件`);
  console.log(`⚪ 未マーク: ${unmarked}件`);
  
  return {
    total: events.length,
    robotMarked: robotMarked,
    unmarked: unmarked
  };
}

/**
 * 未マークイベントの詳細表示
 */
function showUnmarkedEvents(startDate, endDate) {
  const calendar = CalendarApp.getDefaultCalendar();
  const calendarUpdater = new CalendarEventUpdater();
  const events = calendar.getEvents(startDate, endDate);
  
  let unmarkedCount = 0;
  
  events.forEach((event, index) => {
    const title = event.getTitle();
    const isProcessed = calendarUpdater.isEventProcessed(event);
    const startTime = event.getStartTime();
    
    if (!isProcessed) {
      unmarkedCount++;
      console.log(`${unmarkedCount}. "${title}"`);
      console.log(`   日時: ${startTime.toLocaleString('ja-JP')}`);
      console.log(`   状態: ⚪ 未マーク`);
      console.log('');
    }
  });
  
  if (unmarkedCount === 0) {
    console.log('未マークイベントはありません。全てマーク済みです。');
  }
}

/**
 * テスト用の未マークイベントを作成
 */
function createUnmarkedTestEvent() {
  console.log('=== 未マークテストイベント作成 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const now = new Date();
    const testTime = new Date(now.getTime() + 30 * 60 * 1000); // 30分後
    const endTime = new Date(testTime.getTime() + 60 * 60 * 1000); // 1時間のイベント
    
    const testEvent = calendar.createEvent(
      'テストイベント - ロボットマーク追加テスト用',
      testTime,
      endTime,
      {
        description: 'ロボットマーク追加機能のテスト用に作成されたイベントです。処理後に🤖マークが追加される予定です。'
      }
    );
    
    console.log(`✅ 未マークテストイベント作成完了:`);
    console.log(`   タイトル: ${testEvent.getTitle()}`);
    console.log(`   日時: ${testEvent.getStartTime().toLocaleString('ja-JP')}`);
    console.log(`   ロボットマーク: なし（テスト用）`);
    
    console.log('\nテストを実行するには testRobotMarkAddition() を実行してください');
    
    return testEvent;
    
  } catch (error) {
    console.error('❌ テストイベント作成エラー:', error.message);
    throw error;
  }
}

/**
 * 徹底的なロボットマークテスト（複数イベント）
 */
function testRobotMarkAdditionMultiple() {
  console.log('=== 🤖複数イベントロボットマーク追加テスト ===');
  
  try {
    // 複数のテストイベントを作成
    const testEvents = [];
    const now = new Date();
    
    for (let i = 0; i < 3; i++) {
      const testTime = new Date(now.getTime() + (i * 20 + 10) * 60 * 1000); // 10, 30, 50分後
      const endTime = new Date(testTime.getTime() + 30 * 60 * 1000); // 30分間
      
      const testEvent = CalendarApp.getDefaultCalendar().createEvent(
        `マルチテスト${i + 1} - ロボットマーク追加確認`,
        testTime,
        endTime,
        {
          description: `複数イベントロボットマーク追加テスト用イベント${i + 1}`
        }
      );
      
      testEvents.push(testEvent);
      console.log(`テストイベント${i + 1}作成: ${testEvent.getTitle()}`);
    }
    
    console.log(`\n${testEvents.length}件のテストイベントを作成しました`);
    console.log('testRobotMarkAddition() を実行してテストしてください');
    
    return testEvents;
    
  } catch (error) {
    console.error('❌ 複数テストイベント作成エラー:', error.message);
    throw error;
  }
}

/**
 * 簡単テスト実行
 */
function runRobotMarkTest() {
  return testRobotMarkAddition();
}

/**
 * 現在のカレンダーでロボットマーク状態を確認
 */
function checkCurrentRobotMarkStatus() {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return checkRobotMarkStatus(today, nextWeek);
}