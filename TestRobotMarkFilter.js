/**
 * ロボットマークフィルタリング機能テスト
 */

/**
 * ロボットマークフィルタリングのテスト実行
 */
function testRobotMarkFiltering() {
  console.log('=== 🤖ロボットマークフィルタリングテスト開始 ===');
  
  try {
    // 設定とコンポーネント初期化
    const config = ConfigManager.getConfig();
    const taskExtractor = new TaskExtractor(config);
    const calendarUpdater = new CalendarEventUpdater();
    
    // テスト期間設定
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log(`テスト期間: ${today.toDateString()} - ${nextWeek.toDateString()}`);
    
    // カレンダーイベント取得
    const calendar = CalendarApp.getDefaultCalendar();
    const events = calendar.getEvents(today, nextWeek);
    
    console.log(`\n--- カレンダーイベント一覧 (${events.length}件) ---`);
    
    let processedCount = 0;
    let unprocessedCount = 0;
    
    // 各イベントのロボットマーク状態をチェック
    events.forEach((event, index) => {
      const title = event.getTitle();
      const isProcessed = calendarUpdater.isEventProcessed(event);
      const hasRobot = title.indexOf('🤖') !== -1;
      
      console.log(`${index + 1}. "${title}"`);
      console.log(`   ロボットマーク: ${hasRobot ? '🤖 あり' : '❌ なし'}`);
      console.log(`   処理済み判定: ${isProcessed ? '✅ 処理済み' : '⚪ 未処理'}`);
      console.log('');
      
      if (isProcessed) {
        processedCount++;
      } else {
        unprocessedCount++;
      }
    });
    
    console.log(`--- 処理状況サマリー ---`);
    console.log(`🤖 処理済みイベント: ${processedCount}件`);
    console.log(`⚪ 未処理イベント: ${unprocessedCount}件`);
    
    // TaskExtractorでの実際の処理テスト
    console.log(`\n--- TaskExtractor処理テスト ---`);
    const extractedTasks = taskExtractor.extractFromCalendar(today, nextWeek);
    
    console.log(`抽出されたタスク数: ${extractedTasks.length}件`);
    
    // 結果検証
    const shouldHaveNoTasks = processedCount === events.length;
    const testResult = {
      success: shouldHaveNoTasks ? (extractedTasks.length === 0) : true,
      totalEvents: events.length,
      processedEvents: processedCount,
      unprocessedEvents: unprocessedCount,
      extractedTasks: extractedTasks.length,
      message: ''
    };
    
    if (shouldHaveNoTasks && extractedTasks.length === 0) {
      testResult.message = '✅ 全イベントが処理済み - タスク抽出なし（正常）';
    } else if (!shouldHaveNoTasks && extractedTasks.length > 0) {
      testResult.message = '✅ 未処理イベントからタスクを抽出（正常）';
    } else if (shouldHaveNoTasks && extractedTasks.length > 0) {
      testResult.success = false;
      testResult.message = '❌ 処理済みイベントからタスクが抽出された（異常）';
    } else {
      testResult.message = '⚠️ 未処理イベントがあるがタスク抽出されず';
    }
    
    console.log(`\n--- テスト結果 ---`);
    console.log(testResult.message);
    console.log(`フィルタリング機能: ${testResult.success ? '✅ 正常' : '❌ 異常'}`);
    
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
 * テスト用イベントを作成（ロボットマーク付き）
 */
function createRobotMarkedTestEvent() {
  console.log('=== 🤖ロボットマーク付きテストイベント作成 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const now = new Date();
    const testTime = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1時間後
    const endTime = new Date(testTime.getTime() + 60 * 60 * 1000); // 1時間のイベント
    
    const testEvent = calendar.createEvent(
      '🤖 テストイベント（処理済み）',
      testTime,
      endTime,
      {
        description: 'ロボットマークフィルタリングのテスト用に作成されたイベントです。'
      }
    );
    
    console.log(`✅ ロボットマーク付きテストイベント作成完了:`);
    console.log(`   タイトル: ${testEvent.getTitle()}`);
    console.log(`   日時: ${testEvent.getStartTime().toLocaleString('ja-JP')}`);
    
    return testEvent;
    
  } catch (error) {
    console.error('❌ テストイベント作成エラー:', error.message);
    throw error;
  }
}

/**
 * 現在のカレンダーイベントのロボットマーク状態をチェック
 */
function checkCurrentRobotMarks() {
  console.log('=== 現在のロボットマーク状態確認 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const calendarUpdater = new CalendarEventUpdater();
    
    const events = calendar.getEvents(today, nextWeek);
    
    console.log(`カレンダーイベント総数: ${events.length}件\n`);
    
    let robotMarkedCount = 0;
    
    events.forEach((event, index) => {
      const title = event.getTitle();
      const hasRobot = title.indexOf('🤖') !== -1;
      const isProcessed = calendarUpdater.isEventProcessed(event);
      const startTime = event.getStartTime();
      
      if (hasRobot) {
        robotMarkedCount++;
      }
      
      console.log(`${index + 1}. "${title}"`);
      console.log(`   日時: ${startTime.toLocaleString('ja-JP')}`);
      console.log(`   ロボットマーク: ${hasRobot ? '🤖 あり' : '❌ なし'}`);
      console.log(`   処理済み判定: ${isProcessed ? '✅ はい' : '❌ いいえ'}`);
      
      if (hasRobot !== isProcessed) {
        console.log(`   ⚠️ 判定不整合: マーク${hasRobot ? 'あり' : 'なし'} vs 判定${isProcessed ? '処理済み' : '未処理'}`);
      }
      
      console.log('');
    });
    
    console.log(`🤖 ロボットマーク付きイベント: ${robotMarkedCount}/${events.length}件`);
    
    return {
      total: events.length,
      robotMarked: robotMarkedCount,
      unmarked: events.length - robotMarkedCount
    };
    
  } catch (error) {
    console.error('❌ ロボットマーク状態確認エラー:', error.message);
    return null;
  }
}

/**
 * 簡単テスト実行
 */
function runRobotMarkTest() {
  return testRobotMarkFiltering();
}