/**
 * AI駆動タスク管理システム - デプロイ用メインファイル
 * Google Apps Script ES5互換版
 * 
 * 必要なファイル構成:
 * - CodeDeploy.gs (このファイル)
 * - config.gs
 * - NotionClient.gs 
 * - TaskExtractorES5.gs
 * - DuplicateCheckerES5.gs
 * - Utils.gs
 * - BasicTests.gs
 */

/**
 * メイン実行関数
 */
function main() {
  return runTaskExtraction();
}

/**
 * システムの主要実行関数
 */
function runTaskExtraction() {
  console.log('=== AI駆動タスク管理システム実行開始 ===');
  
  try {
    // 設定チェック
    var config = ConfigManager.getConfig();
    var validation = ConfigManager.validateConfig();
    
    if (!validation.isValid) {
      console.error('❌ 設定が無効です:', validation.errors.join(', '));
      return {
        success: false,
        error: '設定が無効: ' + validation.errors.join(', ')
      };
    }
    
    var results = {
      calendarTasks: [],
      gmailTasks: [],
      totalCreated: 0,
      totalSkipped: 0,
      errors: []
    };
    
    // 日付範囲を計算
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - config.dataRangeDays);
    
    // TaskExtractorを初期化
    var taskExtractor = new TaskExtractor(config);
    
    // カレンダーからタスク抽出
    console.log('📅 カレンダーからタスク抽出中...');
    try {
      results.calendarTasks = taskExtractor.extractFromCalendar(startDate, endDate);
      console.log('✅ カレンダータスク抽出完了: ' + results.calendarTasks.length + '件');
    } catch (error) {
      results.errors.push('カレンダー抽出エラー: ' + error.message);
      console.error('❌ カレンダー抽出エラー:', error.message);
    }
    
    // Gmailからタスク抽出（設定が有効な場合のみ）
    if (config.enableGmailAnalysis) {
      console.log('📧 Gmailからタスク抽出中...');
      try {
        results.gmailTasks = taskExtractor.extractFromGmail();
        console.log('✅ Gmailタスク抽出完了: ' + results.gmailTasks.length + '件');
      } catch (error) {
        results.errors.push('Gmail抽出エラー: ' + error.message);
        console.error('❌ Gmail抽出エラー:', error.message);
      }
    }
    
    // 結果集計
    results.totalCreated = countCreatedTasks(results.calendarTasks) + countCreatedTasks(results.gmailTasks);
    results.totalSkipped = countSkippedTasks(results.calendarTasks) + countSkippedTasks(results.gmailTasks);
    
    // 実行サマリーを作成
    createExecutionSummary(results, config);
    
    console.log('=== 実行完了 ===');
    console.log('作成タスク: ' + results.totalCreated + '件');
    console.log('スキップ: ' + results.totalSkipped + '件');
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 実行エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 作成されたタスクをカウント
 */
function countCreatedTasks(tasks) {
  var count = 0;
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].created) {
      count++;
    }
  }
  return count;
}

/**
 * スキップされたタスクをカウント
 */
function countSkippedTasks(tasks) {
  var count = 0;
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].skipped) {
      count++;
    }
  }
  return count;
}

/**
 * 実行サマリーを作成
 */
function createExecutionSummary(results, config) {
  try {
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    var summaryData = {
      processed_items: results.calendarTasks.length + results.gmailTasks.length,
      created_tasks: results.totalCreated,
      skipped_duplicates: results.totalSkipped,
      execution_mode: 'auto_integrated',
      errors: results.errors.join('; ')
    };
    
    var summaryResult = notionClient.createExecutionSummary(summaryData);
    if (summaryResult.success) {
      console.log('✅ 実行サマリー作成完了');
    } else {
      console.error('❌ 実行サマリー作成失敗:', summaryResult.error);
    }
    
  } catch (error) {
    console.error('❌ 実行サマリー作成エラー:', error.message);
  }
}

/**
 * カレンダーのみ実行（軽量版）
 */
function runCalendarOnly() {
  console.log('=== カレンダーのみ実行 ===');
  
  try {
    var config = ConfigManager.getConfig();
    var taskExtractor = new TaskExtractor(config);
    
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 1週間前から
    
    var tasks = taskExtractor.extractFromCalendar(startDate, endDate);
    
    console.log('✅ カレンダータスク抽出完了: ' + tasks.length + '件');
    return tasks;
    
  } catch (error) {
    console.error('❌ カレンダー実行エラー:', error.message);
    throw error;
  }
}

/**
 * Gmailのみ実行（軽量版）
 */
function runGmailOnly() {
  console.log('=== Gmailのみ実行 ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    if (!config.enableGmailAnalysis) {
      console.log('⚠️ Gmail分析が無効化されています');
      return [];
    }
    
    var taskExtractor = new TaskExtractor(config);
    var tasks = taskExtractor.extractFromGmail();
    
    console.log('✅ Gmailタスク抽出完了: ' + tasks.length + '件');
    return tasks;
    
  } catch (error) {
    console.error('❌ Gmail実行エラー:', error.message);
    throw error;
  }
}

/**
 * 手動テスト実行
 */
function runManualTest() {
  console.log('=== 手動テスト実行 ===');
  
  try {
    // 基本システムチェック
    var systemCheck = runBasicSystemCheck();
    
    if (!systemCheck.configTest || !systemCheck.notionTest) {
      console.error('❌ 基本システムチェックに失敗しました');
      return false;
    }
    
    // カレンダーテスト
    console.log('カレンダーテスト実行中...');
    var calendarTasks = runCalendarOnly();
    
    // 結果表示
    console.log('=== テスト結果 ===');
    console.log('カレンダータスク: ' + calendarTasks.length + '件');
    
    var createdCount = countCreatedTasks(calendarTasks);
    var skippedCount = countSkippedTasks(calendarTasks);
    
    console.log('- 作成: ' + createdCount + '件');
    console.log('- スキップ: ' + skippedCount + '件');
    
    console.log('✅ 手動テスト完了');
    return true;
    
  } catch (error) {
    console.error('❌ 手動テストエラー:', error.message);
    return false;
  }
}

/**
 * 緊急修正用: 最小限のタスク作成
 */
function createEmergencyTask(title, priority) {
  console.log('=== 緊急タスク作成 ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    if (!config.notionToken || !config.notionDatabaseId) {
      console.error('❌ Notion設定が不完全です');
      return false;
    }
    
    var taskData = {
      title: title || ('緊急タスク - ' + new Date().toLocaleString('ja-JP')),
      type: 'task',
      priority: priority || '高',
      source: 'manual',
      created_by: 'manual',
      context: '緊急作成されたタスクです'
    };
    
    var result = createNotionTask(config, taskData);
    
    if (result && result.success) {
      console.log('✅ 緊急タスク作成成功:', taskData.title);
      console.log('📝 URL:', result.url);
      return true;
    } else {
      console.error('❌ 緊急タスク作成失敗:', result ? result.error : 'unknown error');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 緊急タスク作成エラー:', error.message);
    return false;
  }
}

/**
 * 設定初期化ヘルパー
 */
function quickSetup(notionToken, notionDatabaseId, geminiApiKey) {
  console.log('=== クイックセットアップ ===');
  
  try {
    var props = PropertiesService.getScriptProperties();
    
    if (notionToken) {
      props.setProperty('NOTION_TOKEN', notionToken);
      console.log('✅ Notion Token設定完了');
    }
    
    if (notionDatabaseId) {
      props.setProperty('NOTION_DATABASE_ID', notionDatabaseId);
      console.log('✅ Database ID設定完了');
    }
    
    if (geminiApiKey) {
      props.setProperty('GEMINI_API_KEY', geminiApiKey);
      console.log('✅ Gemini API Key設定完了');
    }
    
    // デフォルト設定
    props.setProperty('ENABLE_AI_ANALYSIS', 'true');
    props.setProperty('ENABLE_GMAIL_ANALYSIS', 'true');
    props.setProperty('DATA_RANGE_DAYS', '7');
    props.setProperty('EXECUTION_HOUR', '8');
    
    console.log('✅ クイックセットアップ完了');
    
    // 設定テスト
    var config = ConfigManager.getConfig();
    var validation = ConfigManager.validateConfig();
    
    if (validation.isValid) {
      console.log('✅ 設定検証成功 - システム利用可能');
      return true;
    } else {
      console.error('❌ 設定検証失敗:', validation.errors.join(', '));
      return false;
    }
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
    return false;
  }
}

/**
 * システム状態確認
 */
function checkSystemStatus() {
  console.log('=== システム状態確認 ===');
  
  try {
    var config = ConfigManager.getConfig();
    console.log('設定確認:');
    console.log('- Notion Token:', config.notionToken ? '設定済み' : '未設定');
    console.log('- Database ID:', config.notionDatabaseId ? '設定済み' : '未設定');
    console.log('- Gemini API Key:', config.geminiApiKey ? '設定済み' : '未設定');
    console.log('- AI分析:', config.enableAiAnalysis ? '有効' : '無効');
    console.log('- Gmail分析:', config.enableGmailAnalysis ? '有効' : '無効');
    
    // 接続テスト
    var notionTest = testNotionConnection();
    console.log('Notion接続:', notionTest.success ? '✅ 成功' : '❌ 失敗 - ' + notionTest.error);
    
    // 権限確認
    var permissions = checkPermissions();
    console.log('権限状況:');
    console.log('- カレンダー:', permissions.calendar ? '✅' : '❌');
    console.log('- Gmail:', permissions.gmail ? '✅' : '❌');
    console.log('- Drive:', permissions.drive ? '✅' : '❌');
    console.log('- URL Fetch:', permissions.urlFetch ? '✅' : '❌');
    
    var overallStatus = notionTest.success && permissions.calendar && permissions.gmail;
    console.log('\nシステム総合状況:', overallStatus ? '✅ 良好' : '❌ 要修正');
    
    return overallStatus;
    
  } catch (error) {
    console.error('❌ システム状態確認エラー:', error.message);
    return false;
  }
}

/**
 * 簡単実行（エントリーポイント）
 */
function run() {
  return runTaskExtraction();
}

/**
 * 定期実行用（トリガー設定時に使用）
 */
function scheduledExecution() {
  console.log('=== 定期実行開始 ===');
  
  try {
    var result = runTaskExtraction();
    
    if (result.success) {
      console.log('✅ 定期実行完了');
      console.log('- 作成タスク:', result.results.totalCreated);
      console.log('- スキップタスク:', result.results.totalSkipped);
    } else {
      console.error('❌ 定期実行失敗:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 定期実行エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}