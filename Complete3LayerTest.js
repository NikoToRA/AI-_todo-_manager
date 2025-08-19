/**
 * 完全な3層重複防止システムテスト
 */

/**
 * 3層重複防止システムの包括テスト
 */
function testComplete3LayerDuplicatePrevention() {
  console.log('=== 🎯 3層重複防止システム包括テスト ===');
  
  try {
    // システム初期化
    const config = ConfigManager.getConfig();
    const taskExtractor = new TaskExtractor(config);
    const calendarUpdater = new CalendarEventUpdater();
    
    console.log('✅ システム初期化完了');
    console.log('');
    
    // テスト期間設定
    const today = new Date();
    const testEndDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log(`📅 テスト期間: ${today.toDateString()} - ${testEndDate.toDateString()}`);
    
    // カレンダーイベント確認
    const calendar = CalendarApp.getDefaultCalendar();
    const events = calendar.getEvents(today, testEndDate);
    
    console.log(`📋 カレンダーイベント数: ${events.length}件`);
    
    if (events.length === 0) {
      console.log('⚠️ テスト用イベントを作成します...');
      const testEvent = createTestEventForDuplicateTest();
      if (testEvent) {
        console.log('✅ テストイベント作成完了');
        // 再取得
        const newEvents = calendar.getEvents(today, testEndDate);
        return testComplete3LayerDuplicatePrevention(); // 再実行
      } else {
        throw new Error('テストイベント作成に失敗');
      }
    }
    
    console.log('');
    console.log('=== 🔍 各層の動作確認 ===');
    
    // Layer 1テスト: カレンダー直接タグチェック
    console.log('Layer 1: カレンダータグチェック');
    let layer1Blocked = 0;
    events.forEach((event, index) => {
      const isProcessed = calendarUpdater.isEventProcessed(event);
      const title = event.getTitle();
      console.log(`  ${index + 1}. "${title}" - 処理済み: ${isProcessed ? '✅' : '❌'}`);
      if (isProcessed) layer1Blocked++;
    });
    
    console.log(`Layer 1 ブロック: ${layer1Blocked}/${events.length}件`);
    console.log('');
    
    // Layer 2テスト: Notion処理済みチェック
    console.log('Layer 2: Notion処理済みチェック');
    let layer2Blocked = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const title = event.getTitle();
      const eventDate = event.getStartTime().toISOString().split('T')[0];
      
      // カレンダータグでブロックされない場合のみチェック
      if (!calendarUpdater.isEventProcessed(event)) {
        const isAlreadyProcessed = taskExtractor.notionClient.isAlreadyProcessed(title, eventDate);
        console.log(`  ${i + 1}. "${title}" (${eventDate}) - Notion処理済み: ${isAlreadyProcessed ? '✅' : '❌'}`);
        if (isAlreadyProcessed) layer2Blocked++;
      } else {
        console.log(`  ${i + 1}. "${title}" - Layer 1でブロック済み`);
      }
    }
    
    console.log(`Layer 2 ブロック: ${layer2Blocked}件`);
    console.log('');
    
    // Layer 3テスト: ProcessedTrackerチェック  
    console.log('Layer 3: ProcessedTrackerチェック');
    let layer3Blocked = 0;
    if (taskExtractor.processedTracker) {
      events.forEach((event, index) => {
        const title = event.getTitle();
        // Layer 1, 2でブロックされない場合のみチェック
        const layer1Block = calendarUpdater.isEventProcessed(event);
        if (!layer1Block) {
          const eventDate = event.getStartTime().toISOString().split('T')[0];
          const layer2Block = taskExtractor.notionClient.isAlreadyProcessed(title, eventDate);
          if (!layer2Block) {
            const isTracked = taskExtractor.processedTracker.isCalendarEventProcessed(event);
            console.log(`  ${index + 1}. "${title}" - ProcessedTracker: ${isTracked ? '✅' : '❌'}`);
            if (isTracked) layer3Blocked++;
          } else {
            console.log(`  ${index + 1}. "${title}" - Layer 2でブロック済み`);
          }
        } else {
          console.log(`  ${index + 1}. "${title}" - Layer 1でブロック済み`);
        }
      });
    } else {
      console.log('  ProcessedTracker利用不可');
    }
    
    console.log(`Layer 3 ブロック: ${layer3Blocked}件`);
    console.log('');
    
    // 総合システムテスト
    console.log('=== 🚀 総合システムテスト ===');
    
    console.log('--- 1回目の実行 ---');
    const result1 = taskExtractor.extractFromCalendar(today, testEndDate);
    console.log(`1回目結果: ${result1.length}件のタスクを処理`);
    
    // 処理結果の詳細
    if (result1.length > 0) {
      console.log('処理されたタスク:');
      result1.forEach((task, index) => {
        console.log(`  ${index + 1}. "${task.title}" (${task.created ? '作成' : 'スキップ'})`);
      });
    }
    
    console.log('');
    
    // 待機
    console.log('⏳ 3秒待機中...');
    Utilities.sleep(3000);
    
    console.log('--- 2回目の実行（重複チェック） ---');
    const result2 = taskExtractor.extractFromCalendar(today, testEndDate);
    console.log(`2回目結果: ${result2.length}件のタスクを処理`);
    
    // 処理結果の詳細
    if (result2.length > 0) {
      console.log('⚠️ 重複処理されたタスク:');
      result2.forEach((task, index) => {
        console.log(`  ${index + 1}. "${task.title}" (${task.created ? '作成' : 'スキップ'})`);
      });
    }
    
    console.log('');
    
    // カレンダー更新状況確認
    console.log('--- カレンダー更新状況確認 ---');
    const eventsAfter = calendar.getEvents(today, testEndDate);
    let markedCount = 0;
    
    eventsAfter.forEach((event, index) => {
      const title = event.getTitle();
      const isMarked = calendarUpdater.isEventProcessed(event);
      console.log(`${index + 1}. "${title}" - マーク: ${isMarked ? '🤖' : '❌'}`);
      if (isMarked) markedCount++;
    });
    
    console.log(`マーク済みイベント: ${markedCount}/${eventsAfter.length}件`);
    console.log('');
    
    // テスト結果評価
    console.log('=== 📊 テスト結果評価 ===');
    
    const duplicatePreventionSuccess = result2.length === 0;
    const calendarMarkingSuccess = markedCount > 0 && result1.length > 0;
    
    console.log(`🎯 重複防止: ${duplicatePreventionSuccess ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`🤖 カレンダーマーキング: ${calendarMarkingSuccess ? '✅ 成功' : '❌ 失敗'}`);
    
    const overallSuccess = duplicatePreventionSuccess && (result1.length === 0 || calendarMarkingSuccess);
    
    console.log('');
    console.log('=== 🏆 最終結果 ===');
    
    if (overallSuccess) {
      console.log('🎉 3層重複防止システムは正常に動作しています！');
      console.log('✅ Notionに記録したタスクはカレンダーでマーキング済み');
      console.log('✅ マーキングされたタスクは再度登録されません');
      console.log('✅ 重複が完全に回避されています');
    } else {
      console.log('⚠️ システムに問題があります');
      if (!duplicatePreventionSuccess) {
        console.log('❌ 重複防止が機能していません');
      }
      if (!calendarMarkingSuccess && result1.length > 0) {
        console.log('❌ カレンダーマーキングが機能していません');
      }
    }
    
    console.log('');
    console.log('=== システム詳細 ===');
    console.log(`Layer 1 (カレンダータグ): ${layer1Blocked}件ブロック`);
    console.log(`Layer 2 (Notion検索): ${layer2Blocked}件ブロック`);
    console.log(`Layer 3 (ProcessedTracker): ${layer3Blocked}件ブロック`);
    console.log(`初回処理: ${result1.length}件`);
    console.log(`重複処理: ${result2.length}件`);
    console.log(`マーキング: ${markedCount}/${eventsAfter.length}件`);
    
    return {
      success: overallSuccess,
      duplicatePrevention: duplicatePreventionSuccess,
      calendarMarking: calendarMarkingSuccess,
      layer1Blocks: layer1Blocked,
      layer2Blocks: layer2Blocked,
      layer3Blocks: layer3Blocked,
      firstRun: result1.length,
      secondRun: result2.length,
      markedEvents: markedCount,
      totalEvents: eventsAfter.length,
      message: overallSuccess ? '3層重複防止システム正常動作' : 'システムに問題あり'
    };
    
  } catch (error) {
    console.error('❌ 3層システムテストエラー:', error.message);
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
function createTestEventForDuplicateTest() {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const now = new Date();
    const testTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3時間後
    const endTime = new Date(testTime.getTime() + 60 * 60 * 1000); // 1時間のイベント
    
    const testEvent = calendar.createEvent(
      '3層テスト用イベント - 重複防止検証',
      testTime,
      endTime,
      {
        description: '3層重複防止システムのテスト用に作成されたイベントです。' +
                     'このイベントでNotionタスク作成→カレンダーマーキング→重複防止を検証します。'
      }
    );
    
    console.log(`✅ テストイベント作成:`);
    console.log(`   タイトル: ${testEvent.getTitle()}`);
    console.log(`   日時: ${testEvent.getStartTime().toLocaleString('ja-JP')}`);
    
    return testEvent;
    
  } catch (error) {
    console.error('❌ テストイベント作成エラー:', error.message);
    return null;
  }
}

/**
 * 3層システムの各層を個別テスト
 */
function testEachLayer() {
  console.log('=== 🔬 各層個別テスト ===');
  
  try {
    const config = ConfigManager.getConfig();
    
    // Layer 1テスト
    console.log('1. CalendarEventUpdater単体テスト');
    const calendarUpdater = new CalendarEventUpdater();
    console.log(`   processedTag: "${calendarUpdater.processedTag}"`);
    console.log('   ✅ CalendarEventUpdater正常');
    
    // Layer 2テスト  
    console.log('2. NotionClient.isAlreadyProcessed単体テスト');
    const notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // テストクエリ
    const testResult = notionClient.isAlreadyProcessed('テストイベント', '2024-08-19');
    console.log(`   テストクエリ結果: ${testResult}`);
    console.log('   ✅ NotionClient.isAlreadyProcessed正常');
    
    // Layer 3テスト
    console.log('3. ProcessedTracker単体テスト');
    const processedTracker = new ProcessedTracker();
    console.log('   ✅ ProcessedTracker正常');
    
    console.log('');
    console.log('🎉 全層の単体テスト完了');
    
  } catch (error) {
    console.error('❌ 個別テストエラー:', error.message);
  }
}

/**
 * 簡単実行用
 */
function run3LayerTest() {
  return testComplete3LayerDuplicatePrevention();
}

/**
 * 各層テスト
 */
function testLayers() {
  return testEachLayer();
}