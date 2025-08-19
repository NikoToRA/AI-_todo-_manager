/**
 * 現在のカレンダー状況確認と修正
 */

/**
 * 現在のカレンダーイベントを広範囲で確認
 */
function checkCurrentCalendarEvents() {
  console.log('=== 現在のカレンダーイベント確認 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    
    // より広い範囲でイベントを検索
    const today = new Date();
    const pastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);  // 1週間前
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 1ヶ月後
    
    console.log(`検索期間: ${pastWeek.toDateString()} ～ ${nextMonth.toDateString()}`);
    
    const events = calendar.getEvents(pastWeek, nextMonth);
    
    console.log(`\n見つかったイベント数: ${events.length}件`);
    
    if (events.length === 0) {
      console.log('⚠️ カレンダーイベントが見つかりません');
      console.log('');
      console.log('📝 対処法:');
      console.log('1. Googleカレンダーでイベントを作成してください');
      console.log('2. または createTestEvents() を実行してテストイベントを作成');
      return;
    }
    
    // イベントを日付順にソートして表示
    events.sort((a, b) => a.getStartTime() - b.getStartTime());
    
    console.log('\n📅 イベント一覧:');
    events.forEach((event, index) => {
      const start = event.getStartTime();
      const end = event.getEndTime();
      const title = event.getTitle();
      const description = event.getDescription() || '';
      
      console.log(`\n${index + 1}. "${title}"`);
      console.log(`   日時: ${start.toLocaleString('ja-JP')} ～ ${end.toLocaleString('ja-JP')}`);
      console.log(`   説明: ${description ? description.substring(0, 50) + '...' : 'なし'}`);
      
      // 処理済みマークがあるかチェック
      const hasProcessedMark = description.includes('🤖処理済み') || description.includes('[PROCESSED-');
      console.log(`   処理済み: ${hasProcessedMark ? 'はい' : 'いいえ'}`);
    });
    
    console.log('\n✅ 現在のイベントでテストできます！');
    console.log('次のコマンドを実行してください:');
    console.log('- testCalendarMarkFeature() でマーク機能をテスト');
    console.log('- testCalendarMarkDuplicatePrevention() で重複防止をテスト');
    
  } catch (error) {
    console.error('❌ カレンダー確認エラー:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n=== 確認完了 ===');
}

/**
 * 今日から1週間のイベントで重複テストを実行
 */
function testWithCurrentEvents() {
  console.log('=== 現在のイベントで重複テスト実行 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const events = calendar.getEvents(today, nextWeek);
    
    if (events.length === 0) {
      console.log('今後1週間のイベントがありません');
      console.log('過去のイベントでテストしますか？ testWithPastEvents() を実行してください');
      return;
    }
    
    console.log(`今後1週間のイベント: ${events.length}件`);
    
    // TaskExtractorでテスト実行
    const config = ConfigManager.getConfig();
    const extractor = new TaskExtractor(config);
    
    console.log('\n--- 1回目の実行 ---');
    const result1 = extractor.extractFromCalendar(today, nextWeek);
    console.log(`1回目結果: ${result1.length}件のタスクを処理`);
    
    // 少し待機
    Utilities.sleep(3000);
    
    console.log('\n--- 2回目の実行（重複チェック）---');
    const result2 = extractor.extractFromCalendar(today, nextWeek);
    console.log(`2回目結果: ${result2.length}件のタスクを処理`);
    
    // 結果判定
    console.log('\n--- 結果 ---');
    if (result2.length === 0) {
      console.log('🎉 重複防止成功！全てのイベントがスキップされました');
    } else {
      console.log(`⚠️ ${result2.length}件のタスクが重複処理されました`);
    }
    
    // カレンダーの変化を確認
    console.log('\n--- カレンダーの変化確認 ---');
    const eventsAfter = calendar.getEvents(today, nextWeek);
    let markedCount = 0;
    
    eventsAfter.forEach(event => {
      const description = event.getDescription() || '';
      if (description.includes('🤖処理済み')) {
        markedCount++;
        console.log(`✅ マーク済み: "${event.getTitle()}"`);
      }
    });
    
    console.log(`\n総イベント数: ${eventsAfter.length}, マーク済み: ${markedCount}`);
    
  } catch (error) {
    console.error('❌ 現在イベントテストエラー:', error.message);
  }
  
  console.log('\n=== テスト完了 ===');
}

/**
 * 過去1週間のイベントでテスト
 */
function testWithPastEvents() {
  console.log('=== 過去のイベントでテスト実行 ===');
  
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const today = new Date();
    const pastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const events = calendar.getEvents(pastWeek, today);
    
    if (events.length === 0) {
      console.log('過去1週間のイベントがありません');
      console.log('createTestEvents() を実行してテストイベントを作成してください');
      return;
    }
    
    console.log(`過去1週間のイベント: ${events.length}件`);
    
    // TaskExtractorでテスト実行
    const config = ConfigManager.getConfig();
    const extractor = new TaskExtractor(config);
    
    console.log('\n--- 1回目の実行 ---');
    const result1 = extractor.extractFromCalendar(pastWeek, today);
    console.log(`1回目結果: ${result1.length}件のタスクを処理`);
    
    // 少し待機
    Utilities.sleep(3000);
    
    console.log('\n--- 2回目の実行（重複チェック）---');
    const result2 = extractor.extractFromCalendar(pastWeek, today);
    console.log(`2回目結果: ${result2.length}件のタスクを処理`);
    
    // 結果判定
    console.log('\n--- 結果 ---');
    if (result2.length === 0) {
      console.log('🎉 重複防止成功！');
    } else {
      console.log(`⚠️ ${result2.length}件が重複処理`);
    }
    
  } catch (error) {
    console.error('❌ 過去イベントテストエラー:', error.message);
  }
  
  console.log('\n=== テスト完了 ===');
}

/**
 * 手動でタスク抽出を実行（実運用テスト）
 */
function runActualTaskExtraction() {
  console.log('=== 実際のタスク抽出実行 ===');
  
  try {
    // 今日から1週間のイベントを処理
    const result = manualTaskExtraction('calendar');
    
    console.log('実行結果:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`🎉 ${result.tasks ? result.tasks.length : 0}件のタスクを処理しました`);
    } else {
      console.log('❌ エラーが発生しました:', result.error);
    }
    
  } catch (error) {
    console.error('❌ タスク抽出エラー:', error.message);
  }
  
  console.log('=== 実行完了 ===');
}

/**
 * 簡単実行用関数
 */
function checkCalendar() {
  checkCurrentCalendarEvents();
}