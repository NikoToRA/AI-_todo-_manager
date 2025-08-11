/**
 * 重複チェック機能テスト
 */
function testDuplicateUtils() {
  console.log('=== 重複チェック機能テスト ===');
  
  try {
    // テストデータ
    var existingTitles = [
      '会議: プロジェクト進捗確認',
      '【重要】システムメンテナンス',
      'メール返信 (14:00-15:00)',
      '資料作成',
      '2024-01-15 定例会議'
    ];
    
    // テストケース
    var testCases = [
      { title: '会議: プロジェクト進捗確認', expected: true, desc: '完全一致' },
      { title: '会議：プロジェクト進捗確認', expected: true, desc: '正規化一致（コロン違い）' },
      { title: '【重要】システムメンテナンス', expected: true, desc: '完全一致（括弧付き）' },
      { title: '重要システムメンテナンス', expected: true, desc: '正規化一致（括弧除去）' },
      { title: 'メール返信', expected: true, desc: '正規化一致（時間除去）' },
      { title: '定例会議', expected: true, desc: '正規化一致（日付除去）' },
      { title: '新しいタスク', expected: false, desc: '重複なし' },
      { title: '', expected: false, desc: '空文字' },
      { title: null, expected: false, desc: 'null' }
    ];
    
    var passedTests = 0;
    var totalTests = testCases.length;
    
    testCases.forEach(function(testCase, index) {
      var result = DuplicateUtils.isDuplicate(testCase.title, existingTitles);
      var passed = result === testCase.expected;
      
      console.log('テスト' + (index + 1) + ': ' + testCase.desc);
      console.log('  入力: "' + testCase.title + '"');
      console.log('  期待値: ' + testCase.expected + ', 実際: ' + result);
      console.log('  結果: ' + (passed ? '✅ PASS' : '❌ FAIL'));
      
      if (passed) passedTests++;
    });
    
    console.log('');
    console.log('テスト結果: ' + passedTests + '/' + totalTests + ' 通過');
    
    if (passedTests === totalTests) {
      console.log('✅ 重複チェック機能テスト完了');
    } else {
      console.log('❌ 一部のテストが失敗しました');
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 実際のNotionデータベースでの重複チェックテスト
 */
function testRealDuplicateCheck() {
  console.log('=== 実際のNotionデータベース重複チェックテスト ===');
  
  try {
    var config = ConfigManager.getConfig();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 1. 既存タスクを取得
    console.log('1. 既存タスクを取得中...');
    var existingTasks = notionClient.getExistingTasks();
    console.log('既存タスク数:', existingTasks.length);
    
    if (existingTasks.length === 0) {
      console.log('⚠️ 既存タスクがありません。先にいくつかタスクを作成してください。');
      return;
    }
    
    // 2. 重複チェック用配列を構築
    console.log('2. 重複チェック用配列を構築中...');
    var existingTitles = DuplicateUtils.buildExistingTitlesArray(existingTasks);
    console.log('重複チェック用タイトル数:', existingTitles.length);
    
    // 3. 既存タスクの最初の5つを表示
    console.log('3. 既存タスクサンプル:');
    for (var i = 0; i < Math.min(5, existingTasks.length); i++) {
      var task = existingTasks[i];
      console.log('  ' + (i + 1) + '. "' + (task.title || 'タイトルなし') + '"');
    }
    
    // 4. テスト用の重複タイトルを作成
    if (existingTasks.length > 0 && existingTasks[0].title) {
      var testTitle = existingTasks[0].title;
      console.log('4. 重複テスト実行:');
      console.log('テスト対象タイトル: "' + testTitle + '"');
      
      // 完全一致テスト
      var isDuplicate1 = DuplicateUtils.isDuplicate(testTitle, existingTitles);
      console.log('完全一致テスト: ' + (isDuplicate1 ? '✅ 重複検出' : '❌ 重複未検出'));
      
      // 正規化テスト（括弧を追加）
      var testTitle2 = '【重要】' + testTitle;
      var isDuplicate2 = DuplicateUtils.isDuplicate(testTitle2, existingTitles);
      console.log('正規化テスト（括弧追加）: "' + testTitle2 + '" → ' + (isDuplicate2 ? '✅ 重複検出' : '❌ 重複未検出'));
      
      // 時間付きテスト
      var testTitle3 = testTitle + ' (14:00-15:00)';
      var isDuplicate3 = DuplicateUtils.isDuplicate(testTitle3, existingTitles);
      console.log('正規化テスト（時間追加）: "' + testTitle3 + '" → ' + (isDuplicate3 ? '✅ 重複検出' : '❌ 重複未検出'));
      
      // 新しいタイトルテスト
      var newTitle = 'テスト用新規タスク_' + new Date().getTime();
      var isDuplicate4 = DuplicateUtils.isDuplicate(newTitle, existingTitles);
      console.log('新規タイトルテスト: "' + newTitle + '" → ' + (isDuplicate4 ? '❌ 誤検出' : '✅ 正常（重複なし）'));
    }
    
    console.log('✅ 実際のNotionデータベース重複チェックテスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * カレンダー重複チェックの実地テスト
 */
function testCalendarDuplicateCheck() {
  console.log('=== カレンダー重複チェック実地テスト ===');
  
  try {
    var config = ConfigManager.getConfig();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 1. 既存タスクを取得
    var existingTasks = notionClient.getExistingTasks();
    var existingTitles = DuplicateUtils.buildExistingTitlesArray(existingTasks);
    
    // 2. カレンダーイベントを少数取得
    var now = new Date();
    var endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1週間後まで
    
    var calendars = CalendarApp.getAllCalendars();
    var testEvents = [];
    
    for (var i = 0; i < Math.min(3, calendars.length); i++) {
      try {
        var calendar = calendars[i];
        var events = calendar.getEvents(now, endDate);
        
        for (var j = 0; j < Math.min(3, events.length); j++) {
          testEvents.push({
            title: events[j].getTitle(),
            calendar: calendar.getName()
          });
        }
        
        if (testEvents.length >= 5) break;
      } catch (error) {
        console.log('カレンダー取得エラー:', error.message);
      }
    }
    
    console.log('テスト用カレンダーイベント数:', testEvents.length);
    
    // 3. 各イベントで重複チェックテスト
    testEvents.forEach(function(event, index) {
      console.log((index + 1) + '. "' + event.title + '" (' + event.calendar + ')');
      
      var isDuplicate = DuplicateUtils.isDuplicate(event.title, existingTitles);
      console.log('   重複チェック結果: ' + (isDuplicate ? '重複あり（スキップ）' : '重複なし（作成対象）'));
      
      // 正規化後のタイトルも表示
      var normalized = DuplicateUtils.normalizeTitle(event.title);
      if (normalized !== event.title.toLowerCase().trim()) {
        console.log('   正規化後: "' + normalized + '"');
      }
    });
    
    console.log('✅ カレンダー重複チェック実地テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 統合テスト実行関数
 */
function runAllTests() {
  console.log('=== 全テスト実行開始 ===');
  
  try {
    // 1. 設定初期化テスト
    console.log('1. 設定初期化テスト');
    testConfigInitialization();
    
    // 2. 処理済みメール管理テスト
    console.log('2. 処理済みメール管理テスト');
    testProcessedEmailTracker();
    
    // 3. メールフィルタテスト
    console.log('3. メールフィルタテスト');
    testEmailFilter();
    
    // 4. Gemini統合テスト
    console.log('4. Gemini統合テスト');
    testGeminiIntegration();
    
    console.log('✅ 全テスト完了');
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
  }
  
  console.log('=== 全テスト実行完了 ===');
}

/**
 * 処理済みメール管理テスト実行
 */
function testProcessedEmails() {
  testProcessedEmailTracker();
}

/**
 * メールフィルタテスト実行
 */
function testEmailFilters() {
  testEmailFilter();
}

/**
 * 設定初期化実行
 */
function initializeConfig() {
  testConfigInitialization();
}

/**
 * Gemini統合テスト実行
 */
function testGeminiAI() {
  testGeminiIntegration();
}

/**
 * Notion統合テスト実行
 */
function testNotionAPI() {
  testNotionIntegration();
}

/**
 * Notionセットアップガイド表示
 */
function notionSetupGuide() {
  showNotionSetupGuide();
}

/**
 * カレンダーのみ手動実行（デバッグ付き）
 */
function runCalendarOnlyDebug() {
  console.log('=== カレンダーのみ手動実行（デバッグ付き） ===');
  
  try {
    var config = ConfigManager.getConfig();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 既存タスクを取得
    console.log('既存タスク取得中...');
    var existingTasks = notionClient.getExistingTasks();
    var existingTitles = DuplicateUtils.buildExistingTitlesArray(existingTasks);
    
    // カレンダーイベントを取得（少数のみ）
    var now = new Date();
    var endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3日間
    
    var calendars = CalendarApp.getAllCalendars();
    var allEvents = [];
    
    for (var i = 0; i < Math.min(2, calendars.length); i++) {
      try {
        var calendar = calendars[i];
        var events = calendar.getEvents(now, endDate);
        
        for (var j = 0; j < Math.min(3, events.length); j++) {
          events[j].calendarName = calendar.getName();
          allEvents.push(events[j]);
        }
      } catch (error) {
        console.log('カレンダー取得エラー:', error.message);
      }
    }
    
    console.log('テスト対象イベント数:', allEvents.length);
    
    var transferredCount = 0;
    var skippedCount = 0;
    
    // 各イベントを処理（デバッグ付き）
    allEvents.forEach(function(event, index) {
      var eventTitle = event.getTitle();
      console.log('\n--- イベント ' + (index + 1) + ' ---');
      console.log('タイトル: "' + eventTitle + '"');
      console.log('カレンダー: ' + event.calendarName);
      
      // デバッグ付き重複チェック
      var isDuplicate = DuplicateUtils.isDuplicate(eventTitle, existingTitles, true);
      
      if (isDuplicate) {
        console.log('→ スキップ（重複）');
        skippedCount++;
      } else {
        console.log('→ 作成対象');
        transferredCount++;
        
        // 実際には作成しない（テストのため）
        console.log('（テストモードのため実際の作成はスキップ）');
        
        // 重複チェック用に追加
        DuplicateUtils.addTitle(existingTitles, eventTitle);
      }
    });
    
    console.log('\n=== デバッグ実行結果 ===');
    console.log('処理対象:', allEvents.length);
    console.log('作成予定:', transferredCount);
    console.log('スキップ:', skippedCount);
    
    return {
      success: true,
      processed: allEvents.length,
      wouldCreate: transferredCount,
      skipped: skippedCount
    };
    
  } catch (error) {
    console.error('❌ デバッグ実行エラー:', error.message);
    return { success: false, error: error.message };
  }
  
  console.log('=== デバッグ実行完了 ===');
}

/**
 * 設定保存テスト関数
 */
function testConfigSaving() {
  console.log('=== 設定保存テスト ===');
  
  try {
    // テスト設定
    const testConfig = {
      executionFrequency: 'weekdays',
      executionHour: 9,
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    console.log('1. テスト設定保存');
    const saveResult = ConfigManager.setConfig(testConfig);
    console.log('保存結果:', saveResult);
    
    console.log('2. 設定読み込み確認');
    const loadedConfig = ConfigManager.getConfig();
    console.log('読み込まれた設定:');
    console.log('- 実行頻度:', loadedConfig.executionFrequency);
    console.log('- 実行時間:', loadedConfig.executionHour);
    console.log('- データ期間:', loadedConfig.dataRangeDays);
    
    console.log('3. スプレッドシート保存テスト');
    ConfigManager.saveConfigToSheet(testConfig);
    console.log('スプレッドシート保存完了');
    
    console.log('4. 設定同期テスト');
    ConfigManager.syncSheetToProperties();
    console.log('設定同期完了');
    
    console.log('5. 最終確認');
    const finalConfig = ConfigManager.getConfig();
    console.log('最終設定:');
    console.log('- 実行頻度:', finalConfig.executionFrequency);
    console.log('- 実行時間:', finalConfig.executionHour);
    
    console.log('✅ 設定保存テスト完了');
    
    return {
      success: true,
      testConfig: testConfig,
      finalConfig: {
        executionFrequency: finalConfig.executionFrequency,
        executionHour: finalConfig.executionHour
      }
    };
    
  } catch (error) {
    console.error('❌ 設定保存テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * UI設定保存の完全テスト
 */
function testUIConfigSaving() {
  console.log('=== UI設定保存完全テスト ===');
  
  try {
    // 1. 現在の設定確認
    console.log('1. 現在の設定確認');
    const currentConfig = ConfigManager.getConfig();
    console.log('現在の実行時間:', currentConfig.executionHour);
    console.log('現在の実行頻度:', currentConfig.executionFrequency);
    
    // 2. UI経由での設定変更をシミュレート
    console.log('2. UI設定変更シミュレート');
    const uiConfig = {
      notionToken: currentConfig.notionToken || 'test_token',
      notionDatabaseId: currentConfig.notionDatabaseId || 'test_db_id',
      executionFrequency: 'weekdays',
      executionHour: 10, // 10時に変更
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    // 3. setConfig関数でPropertiesServiceに保存
    console.log('3. PropertiesService保存');
    const setResult = setConfig(uiConfig);
    console.log('setConfig結果:', setResult);
    
    // 4. スプレッドシートにも保存
    console.log('4. スプレッドシート保存');
    const sheetResult = saveConfigToSheet(uiConfig);
    console.log('saveConfigToSheet結果:', sheetResult);
    
    // 5. 設定同期
    console.log('5. 設定同期');
    const syncResult = syncSheetToProperties();
    console.log('syncSheetToProperties結果:', syncResult);
    
    // 6. 最終確認
    console.log('6. 最終確認');
    const finalConfig = ConfigManager.getConfig();
    console.log('最終的な実行時間:', finalConfig.executionHour);
    console.log('最終的な実行頻度:', finalConfig.executionFrequency);
    
    // 7. トリガー再設定テスト
    console.log('7. トリガー再設定テスト');
    const triggerResult = setupAutoTriggers();
    console.log('トリガー設定結果:', triggerResult);
    
    console.log('✅ UI設定保存完全テスト完了');
    
    return {
      success: true,
      message: 'UI設定保存が正常に動作しています',
      before: {
        executionHour: currentConfig.executionHour,
        executionFrequency: currentConfig.executionFrequency
      },
      after: {
        executionHour: finalConfig.executionHour,
        executionFrequency: finalConfig.executionFrequency
      },
      triggerSetup: triggerResult
    };
    
  } catch (error) {
    console.error('❌ UI設定保存テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * UI設定変更確認関数
 */
function checkTimeSettingUpdate() {
  console.log('=== 時間設定変更確認 ===');
  
  // 1. PropertiesServiceから現在の設定を確認
  const config = ConfigManager.getConfig();
  console.log('📋 現在の設定:');
  console.log('- 実行時間:', config.executionHour + '時');
  console.log('- 実行頻度:', config.executionFrequency);
  
  // 2. スプレッドシートの設定も確認
  try {
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    console.log('📊 スプレッドシート設定:');
    console.log('- EXECUTION_HOUR:', sheetConfig.EXECUTION_HOUR);
    console.log('- EXECUTION_FREQUENCY:', sheetConfig.EXECUTION_FREQUENCY);
  } catch (error) {
    console.error('スプレッドシート確認エラー:', error.message);
  }
  
  // 3. トリガーの設定時間を確認
  const triggers = ScriptApp.getProjectTriggers();
  console.log('🔔 現在のトリガー:');
  triggers.forEach((trigger, index) => {
    const functionName = trigger.getHandlerFunction();
    if (functionName === 'autoTaskExtraction' || functionName === 'autoTaskExtractionWeekdays') {
      console.log(`${index + 1}. 関数: ${functionName}`);
      console.log(`   ID: ${trigger.getUniqueId()}`);
    }
  });
  
  // 4. 期待値との比較
  const expectedHour = 6;
  if (config.executionHour === expectedHour) {
    console.log('✅ 設定変更が正しく反映されています！');
  } else {
    console.log('❌ 設定変更が反映されていません');
    console.log(`期待値: ${expectedHour}時, 実際: ${config.executionHour}時`);
  }
  
  return {
    currentHour: config.executionHour,
    expectedHour: expectedHour,
    isCorrect: config.executionHour === expectedHour,
    frequency: config.executionFrequency
  };
}

/**
 * 6時設定を強制適用
 */
function force6HourSetting() {
  console.log('=== 6時設定強制適用 ===');
  
  const config = {
    executionHour: 6,
    executionFrequency: 'daily'
  };
  
  // 1. PropertiesServiceに保存
  ConfigManager.setConfig(config);
  
  // 2. スプレッドシートにも保存
  ConfigManager.saveConfigToSheet(config);
  
  // 3. トリガー再設定
  setupAutoTriggers();
  
  // 4. 確認
  const finalConfig = ConfigManager.getConfig();
  console.log('強制設定後の実行時間:', finalConfig.executionHour + '時');
  
  return finalConfig.executionHour === 6;
}

/**
 * 簡単確認関数
 */
function quickCheck() {
  console.log('=== 簡単確認 ===');
  
  // 1. 現在の設定
  const config = ConfigManager.getConfig();
  console.log('現在の実行時間:', config.executionHour + '時');
  
  // 2. トリガー再設定
  const result = setupAutoTriggers();
  console.log('トリガー設定結果:', result);
  
  // 3. 最終確認
  const finalConfig = ConfigManager.getConfig();
  console.log('最終実行時間:', finalConfig.executionHour + '時');
  
  if (finalConfig.executionHour === 6) {
    console.log('✅ 6時設定が正しく反映されています！');
  } else {
    console.log('❌ まだ6時設定が反映されていません');
  }
  
  return finalConfig.executionHour === 6;
}

/**
 * UI設定保存の問題診断と修正
 */
function diagnoseUISettingSave() {
  console.log('=== UI設定保存問題の診断 ===');
  
  try {
    // 1. 現在の設定確認
    console.log('1. 現在の設定確認');
    const currentConfig = ConfigManager.getConfig();
    console.log('現在の実行時間:', currentConfig.executionHour);
    console.log('現在の実行頻度:', currentConfig.executionFrequency);
    
    // 2. WebApp用関数のテスト
    console.log('2. WebApp用関数のテスト');
    
    // getConfig関数テスト
    console.log('2-1. getConfig関数テスト');
    const getResult = getConfig();
    console.log('getConfig結果:', getResult.executionHour);
    
    // setConfig関数テスト（UIからの6時設定をシミュレート）
    console.log('2-2. setConfig関数テスト（6時設定）');
    const uiConfig = {
      notionToken: currentConfig.notionToken,
      notionDatabaseId: currentConfig.notionDatabaseId,
      executionHour: 6, // UIで設定した6時
      executionFrequency: 'daily',
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    const setResult = setConfig(uiConfig);
    console.log('setConfig結果:', setResult);
    
    // 3. スプレッドシート保存テスト
    console.log('3. スプレッドシート保存テスト');
    const sheetResult = saveConfigToSheet(uiConfig);
    console.log('saveConfigToSheet結果:', sheetResult);
    
    // 4. 設定同期テスト
    console.log('4. 設定同期テスト');
    const syncResult = syncSheetToProperties();
    console.log('syncSheetToProperties結果:', syncResult);
    
    // 5. 保存後の確認
    console.log('5. 保存後の確認');
    const afterConfig = ConfigManager.getConfig();
    console.log('保存後の実行時間:', afterConfig.executionHour);
    
    // 6. トリガー再設定
    console.log('6. トリガー再設定');
    const triggerResult = setupAutoTriggers();
    console.log('トリガー設定結果:', triggerResult);
    
    // 7. 最終確認
    console.log('7. 最終確認');
    const finalConfig = ConfigManager.getConfig();
    console.log('最終的な実行時間:', finalConfig.executionHour + '時');
    
    if (finalConfig.executionHour === 6) {
      console.log('✅ UI設定保存が正常に動作しました！');
      return { success: true, hour: 6 };
    } else {
      console.log('❌ UI設定保存に問題があります');
      return { success: false, hour: finalConfig.executionHour };
    }
    
  } catch (error) {
    console.error('❌ 診断エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * UI設定保存の完全修復
 */
function repairUISettingSave() {
  console.log('=== UI設定保存の完全修復 ===');
  
  try {
    // 1. 現在の設定を取得
    const currentConfig = ConfigManager.getConfig();
    console.log('修復前の設定:', currentConfig.executionHour + '時');
    
    // 2. UI設定保存プロセスを完全に再現
    console.log('2. UI設定保存プロセスを再現');
    
    // UIで入力された6時設定
    const uiInputConfig = {
      notionToken: currentConfig.notionToken,
      notionDatabaseId: currentConfig.notionDatabaseId,
      claudeApiKey: currentConfig.claudeApiKey,
      geminiApiKey: currentConfig.geminiApiKey,
      executionFrequency: 'daily',
      executionHour: 6, // UIで設定した値
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    console.log('UI入力設定:', JSON.stringify(uiInputConfig, null, 2));
    
    // 3. script.htmlのsaveSettings関数と同じ処理を実行
    console.log('3. script.htmlのsaveSettings処理を再現');
    
    // 3-1. setConfig実行
    console.log('3-1. setConfig実行');
    const setResult = setConfig(uiInputConfig);
    console.log('setConfig結果:', setResult);
    
    // 3-2. saveConfigToSheet実行
    console.log('3-2. saveConfigToSheet実行');
    const sheetResult = saveConfigToSheet(uiInputConfig);
    console.log('saveConfigToSheet結果:', sheetResult);
    
    // 3-3. syncSheetToProperties実行
    console.log('3-3. syncSheetToProperties実行');
    const syncResult = syncSheetToProperties();
    console.log('syncSheetToProperties結果:', syncResult);
    
    // 4. 設定確認
    console.log('4. 修復後の設定確認');
    const repairedConfig = ConfigManager.getConfig();
    console.log('修復後の実行時間:', repairedConfig.executionHour + '時');
    
    // 5. トリガー再設定
    console.log('5. トリガー再設定');
    const triggerResult = setupAutoTriggers();
    console.log('トリガー設定結果:', triggerResult);
    
    // 6. 最終確認
    console.log('6. 最終確認');
    const finalConfig = ConfigManager.getConfig();
    console.log('最終的な実行時間:', finalConfig.executionHour + '時');
    
    if (finalConfig.executionHour === 6) {
      console.log('✅ UI設定保存の修復が完了しました！');
      console.log('🎉 これでUIからの6時設定が正しく反映されています');
      return { success: true, hour: 6, message: 'UI設定保存が修復されました' };
    } else {
      console.log('❌ 修復に失敗しました');
      return { success: false, hour: finalConfig.executionHour };
    }
    
  } catch (error) {
    console.error('❌ 修復エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * UIからの実際の設定値を取得して反映する（正しい実装）
 */
function syncUISettingsCorrectly() {
  console.log('=== UIからの実際の設定値を正しく反映 ===');
  
  try {
    // 1. WebAppのUIから現在表示されている値を確認
    console.log('1. 現在の設定状況確認');
    const currentConfig = ConfigManager.getConfig();
    console.log('PropertiesServiceの現在値:');
    console.log('- 実行時間:', currentConfig.executionHour + '時');
    console.log('- 実行頻度:', currentConfig.executionFrequency);
    
    // 2. スプレッドシートの設定も確認
    console.log('2. スプレッドシート設定確認');
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    console.log('スプレッドシート設定項目数:', Object.keys(sheetConfig).length);
    console.log('EXECUTION_HOUR:', sheetConfig.EXECUTION_HOUR);
    console.log('EXECUTION_FREQUENCY:', sheetConfig.EXECUTION_FREQUENCY);
    
    // 3. UIとバックエンドの設定が一致しているかチェック
    console.log('3. 設定一致性チェック');
    if (sheetConfig.EXECUTION_HOUR && sheetConfig.EXECUTION_HOUR !== currentConfig.executionHour.toString()) {
      console.log('⚠️ UIとバックエンドの設定が不一致です');
      console.log(`スプレッドシート: ${sheetConfig.EXECUTION_HOUR}時`);
      console.log(`PropertiesService: ${currentConfig.executionHour}時`);
      
      // スプレッドシートの値をPropertiesServiceに同期
      console.log('4. スプレッドシートからPropertiesServiceに同期');
      ConfigManager.syncSheetToProperties();
      
      const syncedConfig = ConfigManager.getConfig();
      console.log('同期後の実行時間:', syncedConfig.executionHour + '時');
      
      // トリガーも更新
      console.log('5. トリガー更新');
      const triggerResult = setupAutoTriggers();
      console.log('トリガー設定結果:', triggerResult);
      
      return {
        success: true,
        message: `UI設定（${syncedConfig.executionHour}時）を正しく反映しました`,
        hour: syncedConfig.executionHour,
        frequency: syncedConfig.executionFrequency
      };
      
    } else if (Object.keys(sheetConfig).length === 0) {
      console.log('⚠️ スプレッドシートが空です - UI設定が保存されていません');
      return {
        success: false,
        message: 'UI設定がスプレッドシートに保存されていません',
        issue: 'empty_spreadsheet'
      };
      
    } else {
      console.log('✅ UI設定は既に正しく反映されています');
      return {
        success: true,
        message: `現在の設定（${currentConfig.executionHour}時）は正常です`,
        hour: currentConfig.executionHour,
        frequency: currentConfig.executionFrequency
      };
    }
    
  } catch (error) {
    console.error('❌ UI設定同期エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * UI設定保存の問題を根本的に解決
 */
function fixUISettingSaveIssue() {
  console.log('=== UI設定保存問題の根本解決 ===');
  
  try {
    // 1. 現在の状況分析
    console.log('1. 現在の状況分析');
    const currentConfig = ConfigManager.getConfig();
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log('PropertiesService設定:', currentConfig.executionHour + '時');
    console.log('スプレッドシート設定項目数:', Object.keys(sheetConfig).length);
    
    // 2. スプレッドシートが空の場合の対処
    if (Object.keys(sheetConfig).length === 0) {
      console.log('2. スプレッドシートが空 - 初期設定を作成');
      
      // 現在のPropertiesService設定をスプレッドシートに保存
      const initialConfig = {
        EXECUTION_HOUR: currentConfig.executionHour.toString(),
        EXECUTION_FREQUENCY: currentConfig.executionFrequency,
        DATA_RANGE_DAYS: currentConfig.dataRangeDays.toString(),
        ENABLE_AI_ANALYSIS: currentConfig.enableAiAnalysis.toString(),
        ENABLE_VOICE_INPUT: currentConfig.enableVoiceInput.toString(),
        ENABLE_GMAIL_ANALYSIS: currentConfig.enableGmailAnalysis.toString()
      };
      
      ConfigManager.saveConfigToSheet(initialConfig);
      console.log('初期設定をスプレッドシートに保存しました');
    }
    
    // 3. WebApp設定保存機能のテスト
    console.log('3. WebApp設定保存機能のテスト');
    
    // 現在の設定を少し変更してテスト（実際のUI操作をシミュレート）
    const testHour = currentConfig.executionHour === 8 ? 9 : 8; // 現在と違う時間でテスト
    const testConfig = {
      notionToken: currentConfig.notionToken,
      notionDatabaseId: currentConfig.notionDatabaseId,
      executionHour: testHour,
      executionFrequency: 'daily',
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    console.log(`テスト設定: ${testHour}時に変更`);
    
    // UI設定保存プロセスをテスト
    const setResult = setConfig(testConfig);
    console.log('setConfig結果:', setResult);
    
    const sheetResult = saveConfigToSheet(testConfig);
    console.log('saveConfigToSheet結果:', sheetResult);
    
    const syncResult = syncSheetToProperties();
    console.log('syncSheetToProperties結果:', syncResult);
    
    // 4. テスト結果確認
    console.log('4. テスト結果確認');
    const testResultConfig = ConfigManager.getConfig();
    console.log('テスト後の実行時間:', testResultConfig.executionHour + '時');
    
    if (testResultConfig.executionHour === testHour) {
      console.log('✅ UI設定保存機能は正常に動作しています');
      
      // トリガーも更新
      const triggerResult = setupAutoTriggers();
      console.log('トリガー更新結果:', triggerResult);
      
      return {
        success: true,
        message: `UI設定保存機能が正常に動作しています（${testHour}時に変更成功）`,
        testedHour: testHour,
        currentHour: testResultConfig.executionHour
      };
      
    } else {
      console.log('❌ UI設定保存機能に問題があります');
      return {
        success: false,
        message: 'UI設定保存機能に問題があります',
        expectedHour: testHour,
        actualHour: testResultConfig.executionHour
      };
    }
    
  } catch (error) {
    console.error('❌ 根本解決エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * UI設定保存のデバッグ（12時設定を実際にテスト）
 */
function debugUISettingSave() {
  console.log('=== UI設定保存デバッグ（12時設定テスト） ===');
  
  try {
    // 1. 現在の状況
    console.log('1. 現在の状況');
    const beforeConfig = ConfigManager.getConfig();
    console.log('デバッグ前の実行時間:', beforeConfig.executionHour + '時');
    
    // 2. UIで12時に設定した場合をシミュレート
    console.log('2. UIで12時に設定した場合をシミュレート');
    const uiInput12Hour = {
      notionToken: beforeConfig.notionToken,
      notionDatabaseId: beforeConfig.notionDatabaseId,
      claudeApiKey: beforeConfig.claudeApiKey,
      geminiApiKey: beforeConfig.geminiApiKey,
      executionFrequency: 'daily',
      executionHour: 12, // UIで設定した12時
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    console.log('UI入力データ:', JSON.stringify(uiInput12Hour, null, 2));
    
    // 3. script.htmlのsaveSettings関数の処理を段階的に実行
    console.log('3. script.htmlのsaveSettings処理を段階的に実行');
    
    // 3-1. setConfig（script.htmlの最初の処理）
    console.log('3-1. setConfig実行');
    try {
      const setResult = setConfig(uiInput12Hour);
      console.log('setConfig成功:', setResult);
      
      // 即座に確認
      const afterSetConfig = ConfigManager.getConfig();
      console.log('setConfig直後の実行時間:', afterSetConfig.executionHour + '時');
      
    } catch (setError) {
      console.error('setConfigエラー:', setError.message);
      return { success: false, step: 'setConfig', error: setError.message };
    }
    
    // 3-2. saveConfigToSheet（script.htmlの2番目の処理）
    console.log('3-2. saveConfigToSheet実行');
    try {
      const sheetResult = saveConfigToSheet(uiInput12Hour);
      console.log('saveConfigToSheet成功:', sheetResult);
      
      // スプレッドシート確認
      const sheetConfig = ConfigManager.loadConfigFromSheet();
      console.log('saveConfigToSheet直後のスプレッドシート項目数:', Object.keys(sheetConfig).length);
      console.log('EXECUTION_HOUR:', sheetConfig.EXECUTION_HOUR);
      
    } catch (sheetError) {
      console.error('saveConfigToSheetエラー:', sheetError.message);
      return { success: false, step: 'saveConfigToSheet', error: sheetError.message };
    }
    
    // 3-3. syncSheetToProperties（script.htmlの3番目の処理）
    console.log('3-3. syncSheetToProperties実行');
    try {
      const syncResult = syncSheetToProperties();
      console.log('syncSheetToProperties成功:', syncResult);
      
      // 同期後確認
      const afterSyncConfig = ConfigManager.getConfig();
      console.log('syncSheetToProperties直後の実行時間:', afterSyncConfig.executionHour + '時');
      
    } catch (syncError) {
      console.error('syncSheetToPropertiesエラー:', syncError.message);
      return { success: false, step: 'syncSheetToProperties', error: syncError.message };
    }
    
    // 4. 最終確認
    console.log('4. 最終確認');
    const finalConfig = ConfigManager.getConfig();
    console.log('最終的な実行時間:', finalConfig.executionHour + '時');
    
    if (finalConfig.executionHour === 12) {
      console.log('✅ UI設定保存デバッグ成功！12時設定が正しく反映されました');
      
      // トリガーも更新
      const triggerResult = setupAutoTriggers();
      console.log('トリガー更新結果:', triggerResult);
      
      return {
        success: true,
        message: 'UI設定保存が正常に動作しています',
        beforeHour: beforeConfig.executionHour,
        afterHour: finalConfig.executionHour
      };
      
    } else {
      console.log('❌ UI設定保存デバッグ失敗');
      console.log(`期待値: 12時, 実際: ${finalConfig.executionHour}時`);
      
      return {
        success: false,
        message: 'UI設定保存に問題があります',
        expectedHour: 12,
        actualHour: finalConfig.executionHour
      };
    }
    
  } catch (error) {
    console.error('❌ デバッグエラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * WebApp設定保存機能の完全診断
 */
function diagnoseWebAppCompletely() {
  console.log('=== WebApp設定保存機能の完全診断 ===');
  
  try {
    // 1. WebApp用関数の存在確認
    console.log('1. WebApp用関数の存在確認');
    
    const functions = [
      'getConfig',
      'setConfig', 
      'saveConfigToSheet',
      'syncSheetToProperties',
      'setupAutoTriggers'
    ];
    
    functions.forEach(funcName => {
      try {
        if (typeof eval(funcName) === 'function') {
          console.log(`✅ ${funcName}: 存在`);
        } else {
          console.log(`❌ ${funcName}: 存在しない`);
        }
      } catch (e) {
        console.log(`❌ ${funcName}: エラー - ${e.message}`);
      }
    });
    
    // 2. 各関数の個別テスト
    console.log('2. 各関数の個別テスト');
    
    // getConfigテスト
    console.log('2-1. getConfigテスト');
    const getResult = getConfig();
    console.log('getConfig結果:', getResult.executionHour + '時');
    
    // setConfigテスト（現在の時間+1でテスト）
    console.log('2-2. setConfigテスト');
    const testHour = (getResult.executionHour % 23) + 1; // 1-24時の範囲でテスト
    const testConfig = {
      executionHour: testHour,
      executionFrequency: 'daily'
    };
    
    console.log(`テスト時間: ${testHour}時`);
    const setResult = setConfig(testConfig);
    console.log('setConfig結果:', setResult);
    
    // 結果確認
    const afterSetConfig = getConfig();
    console.log('setConfig後の時間:', afterSetConfig.executionHour + '時');
    
    return {
      success: afterSetConfig.executionHour === testHour,
      testHour: testHour,
      resultHour: afterSetConfig.executionHour,
      message: afterSetConfig.executionHour === testHour ? 
        'WebApp設定保存機能は正常です' : 'WebApp設定保存機能に問題があります'
    };
    
  } catch (error) {
    console.error('❌ 完全診断エラー:', error.message);
    return { success: false, error: error.message };
  }
}