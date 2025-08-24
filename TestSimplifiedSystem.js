/**
 * 簡素化システムテスト（Notion重複チェック削除版）
 */

/**
 * 簡素化システムのテスト実行
 */
function testSimplifiedSystem() {
  console.log('=== 🚀簡素化システムテスト開始 ===');
  console.log('★ Notion重複チェックなし - カレンダーマークのみで重複防止 ★');
  
  try {
    // 設定とコンポーネント初期化
    const config = ConfigManager.getConfig();
    const taskExtractor = new TaskExtractor(config);
    const calendarUpdater = new CalendarEventUpdater();
    
    // テスト期間設定
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log(`テスト期間: ${today.toDateString()} - ${nextWeek.toDateString()}`);
    
    // カレンダーイベント取得・状態確認
    const calendar = CalendarApp.getDefaultCalendar();
    const events = calendar.getEvents(today, nextWeek);
    
    console.log(`\n--- カレンダーイベント状態 (${events.length}件) ---`);
    
    let robotMarkedCount = 0;
    let unmarkedCount = 0;
    
    events.forEach((event, index) => {
      const title = event.getTitle();
      const isProcessed = calendarUpdater.isEventProcessed(event);
      
      console.log(`${index + 1}. "${title}"`);
      console.log(`   🤖マーク: ${isProcessed ? '✅ あり' : '❌ なし'}`);
      
      if (isProcessed) {
        robotMarkedCount++;
      } else {
        unmarkedCount++;
      }
    });
    
    console.log(`\n🤖 マーク済み: ${robotMarkedCount}件`);
    console.log(`⚪ 未マーク: ${unmarkedCount}件`);
    
    if (unmarkedCount === 0) {
      console.log('\n⚠️ 全イベントがマーク済みです。新しいテストイベントを作成してください。');
      console.log('createTestEventForSimplified() でテストイベントを作成できます。');
      return {
        success: true,
        message: '全イベントがマーク済み - テストイベント不足',
        robotMarked: robotMarkedCount,
        unmarked: unmarkedCount
      };
    }
    
    // 簡素化システムでのタスク抽出実行
    console.log(`\n--- 簡素化システム実行 ---`);
    console.log(`未マークイベント ${unmarkedCount}件 を処理します...`);
    console.log('★ Notion重複チェックは行いません ★');
    
    const extractedTasks = taskExtractor.extractFromCalendar(today, nextWeek);
    
    console.log(`\nタスク抽出結果: ${extractedTasks.length}件`);
    
    // 各タスクの詳細表示
    if (extractedTasks.length > 0) {
      console.log('\n--- 抽出されたタスク詳細 ---');
      extractedTasks.forEach((task, index) => {
        console.log(`${index + 1}. "${task.title}"`);
        console.log(`   作成: ${task.created ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`   Notion ID: ${task.notionId || 'なし'}`);
        if (task.error) {
          console.log(`   エラー: ${task.error}`);
        }
        console.log('');
      });
    }
    
    // 少し待機してからカレンダー状態再確認
    console.log('\nカレンダーマーク反映待ち（3秒）...');
    Utilities.sleep(3000);
    
    // マーク状況の再確認
    console.log('\n--- マーク追加確認 ---');
    const updatedEvents = calendar.getEvents(today, nextWeek);
    let finalMarkedCount = 0;
    
    updatedEvents.forEach((event) => {
      if (calendarUpdater.isEventProcessed(event)) {
        finalMarkedCount++;
      }
    });
    
    const newlyMarked = finalMarkedCount - robotMarkedCount;
    
    console.log(`実行前マーク済み: ${robotMarkedCount}件`);
    console.log(`実行後マーク済み: ${finalMarkedCount}件`);
    console.log(`新規マーク追加: ${newlyMarked}件`);
    
    // 2回目実行テスト（重複防止確認）
    console.log(`\n--- 2回目実行（重複防止確認） ---`);
    const secondRunTasks = taskExtractor.extractFromCalendar(today, nextWeek);
    
    console.log(`2回目タスク抽出: ${secondRunTasks.length}件`);
    
    // 結果判定
    const duplicatePreventionWorking = secondRunTasks.length === 0;
    const markingWorking = newlyMarked >= Math.min(unmarkedCount, extractedTasks.length);
    
    const testResult = {
      success: duplicatePreventionWorking && markingWorking,
      initialUnmarked: unmarkedCount,
      initialMarked: robotMarkedCount,
      extractedTasks: extractedTasks.length,
      finalMarked: finalMarkedCount,
      newlyMarked: newlyMarked,
      secondRunTasks: secondRunTasks.length,
      duplicatePreventionWorking: duplicatePreventionWorking,
      markingWorking: markingWorking,
      message: ''
    };
    
    console.log(`\n--- テスト結果 ---`);
    
    if (testResult.success) {
      testResult.message = '✅ 簡素化システム正常動作';
      console.log('🎉 簡素化システムは正常に動作しています！');
      console.log('✅ カレンダーマークによる重複防止が機能');
      console.log('✅ Notion重複チェックなしでも問題なし');
    } else {
      if (!duplicatePreventionWorking) {
        testResult.message = '❌ カレンダーマークによる重複防止に問題';
        console.log('❌ カレンダーマークによる重複防止に問題があります');
      }
      if (!markingWorking) {
        testResult.message += (testResult.message ? ' / ' : '') + '❌ ロボットマーク追加に問題';
        console.log('❌ ロボットマーク追加に問題があります');
      }
    }
    
    console.log(`重複防止: ${duplicatePreventionWorking ? '✅' : '❌'}`);
    console.log(`マーク追加: ${markingWorking ? '✅' : '❌'}`);
    
    console.log('\n=== 簡素化システムテスト完了 ===');
    return testResult;
    
  } catch (error) {
    console.error('❌ 簡素化システムテストエラー:', error.message);
    console.error(error.stack);
    
    return {
      success: false,
      error: error.message,
      message: 'テスト実行中にエラーが発生'
    };
  }
}

/**
 * 簡素化システム用のテストイベントを作成
 */
function createTestEventForSimplified() {
  console.log('=== 簡素化システム用テストイベント作成 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const now = new Date();
    const testTime = new Date(now.getTime() + 15 * 60 * 1000); // 15分後
    const endTime = new Date(testTime.getTime() + 45 * 60 * 1000); // 45分間
    
    const testEvent = calendar.createEvent(
      '簡素化システムテスト - Notion重複チェックなし',
      testTime,
      endTime,
      {
        description: '簡素化システム（Notion重複チェック削除版）のテスト用イベントです。このイベントは🤖マークがない状態で作成され、処理後にマークが追加される予定です。'
      }
    );
    
    console.log(`✅ 簡素化システム用テストイベント作成完了:`);
    console.log(`   タイトル: ${testEvent.getTitle()}`);
    console.log(`   日時: ${testEvent.getStartTime().toLocaleString('ja-JP')}`);
    console.log(`   🤖マーク: なし（テスト用）`);
    console.log(`   特徴: Notion重複チェックを行わずに処理される`);
    
    console.log('\nテストを実行するには testSimplifiedSystem() を実行してください');
    
    return testEvent;
    
  } catch (error) {
    console.error('❌ テストイベント作成エラー:', error.message);
    throw error;
  }
}

/**
 * 複数のテストイベントを作成（簡素化システム用）
 */
function createMultipleTestEventsForSimplified() {
  console.log('=== 複数テストイベント作成（簡素化システム用） ===');
  
  try {
    const testEvents = [];
    const now = new Date();
    const calendar = CalendarApp.getDefaultCalendar();
    
    for (let i = 0; i < 3; i++) {
      const testTime = new Date(now.getTime() + (i * 15 + 10) * 60 * 1000); // 10, 25, 40分後
      const endTime = new Date(testTime.getTime() + 30 * 60 * 1000); // 30分間
      
      const testEvent = calendar.createEvent(
        `簡素化テスト${i + 1} - 重複チェックなし`,
        testTime,
        endTime,
        {
          description: `簡素化システム用テストイベント${i + 1}。Notion重複チェックを行わずに処理されます。`
        }
      );
      
      testEvents.push(testEvent);
      console.log(`テストイベント${i + 1}: ${testEvent.getTitle()}`);
    }
    
    console.log(`\n✅ ${testEvents.length}件の簡素化システム用テストイベント作成完了`);
    console.log('testSimplifiedSystem() でテストを実行してください');
    
    return testEvents;
    
  } catch (error) {
    console.error('❌ 複数テストイベント作成エラー:', error.message);
    throw error;
  }
}

/**
 * 現在の処理方式を確認
 */
function checkCurrentProcessingMode() {
  console.log('=== 現在の処理方式確認 ===');
  console.log('★ 簡素化モード: Notion重複チェック無効');
  console.log('★ カレンダーマーク🤖のみで重複防止');
  console.log('★ 全てのタスクがNotionに直接作成される');
  console.log('');
  console.log('利点:');
  console.log('✅ 処理速度の向上');
  console.log('✅ エラーの削減'); 
  console.log('✅ シンプルな重複防止（カレンダーマークのみ）');
  console.log('');
  console.log('注意点:');
  console.log('⚠️ Notionでの重複が発生する可能性');
  console.log('⚠️ カレンダーマークが最重要');
}

/**
 * 簡単テスト実行
 */
function runSimplifiedTest() {
  return testSimplifiedSystem();
}