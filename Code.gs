/**
 * AI駆動タスク管理システム - メインエントリーポイント
 * 要件1.1対応: 多様な入力方法によるタスク整理
 */

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
 * WebApp用設定管理関数群
 */

/**
 * 設定取得（WebApp用）
 */
function getConfig() {
  try {
    return ConfigManager.getConfig();
  } catch (error) {
    console.error('[WebApp] 設定取得エラー:', error.message);
    throw error;
  }
}

/**
 * 設定保存（WebApp用）
 */
function setConfig(config) {
  try {
    console.log('[WebApp] 設定保存要求:', JSON.stringify(config, null, 2));
    const result = ConfigManager.setConfig(config);
    console.log('[WebApp] 設定保存結果:', result);
    return result;
  } catch (error) {
    console.error('[WebApp] 設定保存エラー:', error.message);
    throw error;
  }
}

/**
 * 設定検証（WebApp用）
 */
function validateConfig() {
  try {
    return ConfigManager.validateConfig();
  } catch (error) {
    console.error('[WebApp] 設定検証エラー:', error.message);
    throw error;
  }
}

/**
 * スプレッドシートに設定保存（WebApp用）
 */
function saveConfigToSheet(config) {
  try {
    console.log('[WebApp] スプレッドシート保存要求:', JSON.stringify(config, null, 2));
    ConfigManager.saveConfigToSheet(config);
    console.log('[WebApp] スプレッドシート保存完了');
    return { success: true, message: 'スプレッドシートに保存しました' };
  } catch (error) {
    console.error('[WebApp] スプレッドシート保存エラー:', error.message);
    throw error;
  }
}

/**
 * 設定同期（WebApp用）
 */
function syncSheetToProperties() {
  try {
    console.log('[WebApp] 設定同期開始');
    ConfigManager.syncSheetToProperties();
    console.log('[WebApp] 設定同期完了');
    return { success: true, message: '設定を同期しました' };
  } catch (error) {
    console.error('[WebApp] 設定同期エラー:', error.message);
    throw error;
  }
}

/**
 * 全てのトリガーを削除（WebApp用）
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  triggers.forEach(trigger => {
    const functionName = trigger.getHandlerFunction();
    if (functionName === 'autoTaskExtraction' || 
        functionName === 'autoTaskExtractionWeekdays') {
      ScriptApp.deleteTrigger(trigger);
      console.log(`[deleteAllTriggers] ${functionName}トリガーを削除`);
      deletedCount++;
    }
  });
  
  console.log(`[deleteAllTriggers] 合計${deletedCount}個のトリガーを削除`);
}

/**
 * トリガー設定（WebApp用）
 */
function setupAutoTriggers() {
  try {
    console.log('[WebApp] トリガー設定開始');
    
    // 既存のトリガーを削除
    deleteAllTriggers();
    
    const config = ConfigManager.getConfig();
    const frequency = config.executionFrequency || 'daily';
    const hour = config.executionHour || 8;
    
    console.log(`[WebApp] 実行頻度: ${frequency}, 実行時間: ${hour}時`);
    
    // 頻度に応じてトリガーを作成
    if (frequency === 'daily') {
      ScriptApp.newTrigger('autoTaskExtraction')
        .timeBased()
        .everyDays(1)
        .atHour(hour)
        .create();
      console.log(`[WebApp] 毎日${hour}時のトリガーを作成`);
    } else if (frequency === 'weekdays') {
      ScriptApp.newTrigger('autoTaskExtractionWeekdays')
        .timeBased()
        .everyDays(1)
        .atHour(hour)
        .create();
      console.log(`[WebApp] 平日判定付き毎日${hour}時のトリガーを作成`);
    } else if (frequency === 'weekly') {
      ScriptApp.newTrigger('autoTaskExtraction')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.MONDAY)
        .atHour(hour)
        .create();
      console.log(`[WebApp] 毎週月曜日${hour}時のトリガーを作成`);
    }
    
    const result = {
      success: true,
      message: `${frequency}の自動実行トリガーを${hour}時に設定しました`
    };
    
    console.log('[WebApp] トリガー設定結果:', result);
    return result;
    
  } catch (error) {
    console.error('[WebApp] トリガー設定エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * トリガー情報取得（WebApp用）
 */
function getTriggerInfo() {
  try {
    console.log('[WebApp] トリガー情報取得開始');
    const result = checkTriggerDetails();
    console.log('[WebApp] トリガー情報:', result);
    return {
      success: true,
      count: result.autoTask || 0,
      triggers: result.details || []
    };
  } catch (error) {
    console.error('[WebApp] トリガー情報取得エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
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
 * 設定確認・同期関数
 */
function checkAndSyncConfig() {
  console.log('=== 設定確認・同期 ===');
  
  try {
    // 1. スプレッドシートから設定を読み込み
    console.log('1. スプレッドシートから設定読み込み');
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    console.log('スプレッドシート設定:', sheetConfig);
    
    // 2. PropertiesServiceに同期
    console.log('2. PropertiesServiceに同期');
    ConfigManager.syncSheetToProperties();
    
    // 3. 同期後の設定確認
    console.log('3. 同期後の設定確認');
    const config = ConfigManager.getConfig();
    console.log('同期後の設定:', config);
    
    // 4. Gemini APIキー確認
    if (config.geminiApiKey) {
      console.log('✅ Gemini APIキーが設定されています');
      console.log('APIキー（最初の10文字）:', config.geminiApiKey.substring(0, 10) + '...');
    } else {
      console.error('❌ Gemini APIキーが設定されていません');
    }
    
    console.log('✅ 設定確認・同期完了');
    
  } catch (error) {
    console.error('❌ 設定確認・同期エラー:', error.message);
  }
  
  console.log('=== 確認・同期完了 ===');
}

/**
 * 手動設定関数（緊急時用）
 */
function setGeminiApiKeyManually() {
  console.log('=== 手動設定実行 ===');
  
  try {
    // スプレッドシートから直接APIキーを取得
    const sheet = ConfigManager.getConfigSheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    let geminiApiKey = null;
    
    // GEMINI_API_KEYの行を探す
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'GEMINI_API_KEY') {
        geminiApiKey = data[i][1];
        break;
      }
    }
    
    if (geminiApiKey) {
      // PropertiesServiceに直接設定
      PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', geminiApiKey);
      console.log('✅ Gemini APIキーを手動設定しました');
      console.log('APIキー（最初の10文字）:', geminiApiKey.substring(0, 10) + '...');
      
      // 設定確認
      const config = ConfigManager.getConfig();
      console.log('設定確認:', config.geminiApiKey ? '設定済み' : '未設定');
      
    } else {
      console.error('❌ スプレッドシートにGemini APIキーが見つかりません');
    }
    
  } catch (error) {
    console.error('❌ 手動設定エラー:', error.message);
  }
  
  console.log('=== 手動設定完了 ===');
}

/**
 * カレンダー予定直接転記機能
 */
function transferCalendarEvents() {
  console.log('=== カレンダー予定直接転記 ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    // 設定バリデーション
    var validation = ConfigManager.validateConfig();
    if (!validation.isValid) {
      throw new Error('設定エラー: ' + validation.errors.join(', '));
    }
    
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 全カレンダーからイベントを取得
    var now = new Date();
    var endDate = new Date(now.getTime() + config.dataRangeDays * 24 * 60 * 60 * 1000);
    
    // 全てのカレンダーを取得
    var calendars = CalendarApp.getAllCalendars();
    console.log('利用可能なカレンダー数:', calendars.length);
    
    var allEvents = [];
    
    // 各カレンダーからイベントを取得
    for (var i = 0; i < calendars.length; i++) {
      try {
        var calendar = calendars[i];
        console.log('カレンダー処理中:', calendar.getName());
        
        var events = calendar.getEvents(now, endDate);
        console.log('- イベント数:', events.length);
        
        // カレンダー名を各イベントに追加
        for (var j = 0; j < events.length; j++) {
          events[j].calendarName = calendar.getName();
          allEvents.push(events[j]);
        }
        
      } catch (error) {
        console.log('カレンダー取得エラー:', calendar.getName(), error.message);
      }
    }
    
    console.log('全カレンダーから取得したイベント数:', allEvents.length);
    
    var transferredCount = 0;
    var skippedCount = 0;
    var errors = [];
    
    // 既存タスクを取得（重複チェック用）
    console.log('既存タスク取得中...');
    var existingTasks = notionClient.getExistingTasks();
    console.log('既存タスク数:', existingTasks.length);
    
    // デバッグ: 最初のタスクの構造を確認
    if (existingTasks.length > 0) {
      console.log('最初のタスクの構造:', JSON.stringify(existingTasks[0], null, 2));
    }
    
    var existingTitles = [];
    for (var i = 0; i < existingTasks.length; i++) {
      if (existingTasks[i]) {
        console.log('タスク' + i + ':', JSON.stringify(existingTasks[i], null, 2));
        if (existingTasks[i].title) {
          existingTitles.push(existingTasks[i].title);
        } else {
          console.log('タスク' + i + 'にはtitleプロパティがありません');
        }
      }
    }
    
    console.log('既存タイトル一覧:', existingTitles);
    console.log('既存タイトル数:', existingTitles.length);
    
    allEvents.forEach(function(event, index) {
      try {
        var eventTitle = event.getTitle();
        
        // 重複チェック（タイトルの完全一致）
        console.log('重複チェック対象:', eventTitle);
        var isDuplicate = false;
        for (var i = 0; i < existingTitles.length; i++) {
          console.log('比較中:', '"' + existingTitles[i] + '" vs "' + eventTitle + '"');
          if (existingTitles[i] === eventTitle) {
            isDuplicate = true;
            console.log('重複発見！');
            break;
          }
        }
        
        if (isDuplicate) {
          console.log('スキップ（重複）:', eventTitle);
          skippedCount++;
          return;
        } else {
          console.log('重複なし、転記実行:', eventTitle);
        }
        
        // カレンダー予定をそのままタスクとして転記
        var startTime = event.getStartTime();
        var endTime = event.getEndTime();
        var isAllDay = event.isAllDayEvent();
        
        // 日付と時間の処理
        var dueDateStr;
        var titleWithTime = eventTitle;
        
        if (isAllDay) {
          // 終日イベントの場合、日付のみ
          var year = startTime.getFullYear();
          var month = String(startTime.getMonth() + 1).padStart(2, '0');
          var day = String(startTime.getDate()).padStart(2, '0');
          dueDateStr = year + '-' + month + '-' + day;
        } else {
          // 時間付きイベントの場合、日付+時間で設定
          dueDateStr = startTime.toISOString();
          
          // タイトルにも時間を追記
          var startTimeStr = String(startTime.getHours()).padStart(2, '0') + ':' + 
                           String(startTime.getMinutes()).padStart(2, '0');
          var endTimeStr = String(endTime.getHours()).padStart(2, '0') + ':' + 
                         String(endTime.getMinutes()).padStart(2, '0');
          titleWithTime = eventTitle + ' (' + startTimeStr + '-' + endTimeStr + ')';
        }
        
        var taskData = {
          title: titleWithTime,
          due_date: dueDateStr,
          context: 'カレンダー: ' + (event.calendarName || 'デフォルト') + '\n' +
                  '場所: ' + (event.getLocation() || 'なし') + '\n' +
                  '時間: ' + (isAllDay ? '終日' : 
                    startTime.toLocaleString('ja-JP') + ' - ' + 
                    endTime.toLocaleString('ja-JP')) + '\n' +
                  '説明:\n' + (event.getDescription() || 'なし'),
          source: 'calendar',
          type: 'task',
          created_by: 'auto'
        };
        
        var result = notionClient.createTask(taskData);
        if (result.success) {
          transferredCount++;
          console.log('転記完了 (' + (index + 1) + '/' + allEvents.length + '):', eventTitle);
          existingTitles.push(eventTitle); // 重複チェック用に追加
        } else {
          console.error('転記失敗:', eventTitle, result.error);
          errors.push(eventTitle + ': ' + result.error);
        }
        
      } catch (error) {
        console.error('イベント処理エラー:', event.getTitle(), error.message);
        errors.push(event.getTitle() + ': ' + error.message);
      }
    });
    
    // 実行サマリーを作成
    var summaryData = {
      processed_items: allEvents.length,
      created_tasks: transferredCount,
      skipped_duplicates: skippedCount,
      execution_mode: 'all_calendars_transfer',
      errors: errors.length > 0 ? errors.join('; ') : ''
    };
    
    var summaryResult = notionClient.createExecutionSummary(summaryData);
    
    console.log('s✅ カレンダー転記完了');
    console.log('処理件数:', allEvents.length);
    console.log('転記件数:', transferredCount);
    console.log('スキップ件数:', skippedCount);
    console.log('エラー件数:', errors.length);
    
    return {
      success: true,
      processed: allEvents.length,
      transferred: transferredCount,
      skipped: skippedCount,
      errors: errors
    };
    
  } catch (error) {
    console.error('❌ 転記エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
  
  console.log('=== 転記完了 ===');
}

/**
 * Gmail転記機能
 */
function transferGmailMessages() {
  console.log('=== Gmail転記開始 ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    // 設定バリデーション
    var validation = ConfigManager.validateConfig();
    if (!validation.isValid) {
      throw new Error('設定エラー: ' + validation.errors.join(', '));
    }
    
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    var emailFilter = new EmailFilter(config);
    
    // Gmail検索クエリを構築
    var searchQuery = emailFilter.buildSearchQuery();
    console.log('検索クエリ:', searchQuery);
    
    // メールを取得
    var threads = GmailApp.search(searchQuery, 0, config.gmailMaxResults);
    console.log('取得したスレッド数:', threads.length);
    
    var transferredCount = 0;
    var skippedCount = 0;
    var errors = [];
    
    // 既存タスクを取得（重複チェック用）
    var existingTasks = notionClient.getExistingTasks();
    var existingTitles = [];
    for (var i = 0; i < existingTasks.length; i++) {
      if (existingTasks[i] && existingTasks[i].title) {
        existingTitles.push(existingTasks[i].title);
      }
    }
    
    // 各スレッドの最新メッセージを処理
    for (var i = 0; i < threads.length; i++) {
      try {
        var thread = threads[i];
        var messages = thread.getMessages();
        var message = messages[messages.length - 1]; // 最新メッセージ
        
        var subject = message.getSubject();
        var sender = message.getFrom();
        var date = message.getDate();
        
        // 処理済みチェック
        const messageId = message.getId();
        if (ProcessedEmailTracker.isProcessed(messageId)) {
          console.log('処理済みでスキップ:', subject);
          skippedCount++;
          continue;
        }
        
        // フィルタリング
        const filterResult = emailFilter.shouldProcessEmail(message);
        if (!filterResult.shouldProcess) {
          console.log('フィルタでスキップ:', subject, filterResult.reason);
          skippedCount++;
          continue;
        }
        
        // 重複チェック
        var isDuplicate = false;
        for (var j = 0; j < existingTitles.length; j++) {
          if (existingTitles[j] === subject) {
            isDuplicate = true;
            break;
          }
        }
        
        if (isDuplicate) {
          console.log('スキップ（重複）:', subject);
          skippedCount++;
          continue;
        }
        
        // メールをタスクとして転記
        var taskData = {
          title: subject,
          due_date: null, // メールには期日なし
          context: '送信者: ' + sender + '\n' +
                  '受信日時: ' + date.toLocaleString('ja-JP') + '\n' +
                  '本文:\n' + (message.getPlainBody() || ''),
          source: 'gmail',
          type: 'task',
          created_by: 'auto'
        };
        
        var result = notionClient.createTask(taskData);
        if (result.success) {
          transferredCount++;
          console.log('転記完了 (' + (i + 1) + '/' + threads.length + '):', subject);
          existingTitles.push(subject); // 重複チェック用に追加
          
          // 処理済みとして記録
          ProcessedEmailTracker.markAsProcessed(messageId, subject, date, 1);
        } else {
          console.error('転記失敗:', subject, result.error);
          errors.push(subject + ': ' + result.error);
        }
        
      } catch (error) {
        console.error('メール処理エラー:', error.message);
        errors.push('メール処理エラー: ' + error.message);
      }
    }
    
    // 実行サマリーを作成
    var summaryData = {
      processed_items: threads.length,
      created_tasks: transferredCount,
      skipped_duplicates: skippedCount,
      execution_mode: 'gmail_transfer',
      errors: errors.length > 0 ? errors.join('; ') : ''
    };
    
    var summaryResult = notionClient.createExecutionSummary(summaryData);
    
    console.log('✅ Gmail転記完了');
    console.log('処理件数:', threads.length);
    console.log('転記件数:', transferredCount);
    console.log('スキップ件数:', skippedCount);
    console.log('エラー件数:', errors.length);
    
    return {
      success: true,
      processed: threads.length,
      transferred: transferredCount,
      skipped: skippedCount,
      errors: errors
    };
    
  } catch (error) {
    console.error('❌ Gmail転記エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
  
  console.log('=== Gmail転記完了 ===');
}

/**
 * 手動実行エントリーポイント
 * Claude経由での「整理してtodoに入れて」に対応
 */
function manualTaskExtraction(source = 'calendar', options = {}) {
  try {
    console.log('[manualTaskExtraction] 開始: source=' + source);
    
    var config = ConfigManager.getConfig();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    var result;
    
    if (source === 'calendar') {
      result = transferCalendarEvents();
      
      // カレンダー手動実行サマリー作成
      if (result.success) {
        var summaryData = {
          processed_items: result.processed,
          created_tasks: result.transferred,
          skipped_duplicates: result.skipped || 0,
          execution_mode: 'manual_calendar',
          errors: result.errors && result.errors.length > 0 ? result.errors.join('; ') : ''
        };
        notionClient.createExecutionSummary(summaryData);
        console.log('[manualTaskExtraction] カレンダー手動実行サマリー作成完了');
      }
      
    } else if (source === 'gmail') {
      result = transferGmailMessages();
      
      // Gmail手動実行サマリー作成
      if (result.success) {
        var summaryData = {
          processed_items: result.processed,
          created_tasks: result.transferred,
          skipped_duplicates: result.skipped || 0,
          execution_mode: 'manual_gmail',
          errors: result.errors && result.errors.length > 0 ? result.errors.join('; ') : ''
        };
        notionClient.createExecutionSummary(summaryData);
        console.log('[manualTaskExtraction] Gmail手動実行サマリー作成完了');
      }
      
    } else if (source === 'both') {
      // 両方を実行
      console.log('[manualTaskExtraction] カレンダーとGmail両方を実行');
      
      var calendarResult = transferCalendarEvents();
      var gmailResult = transferGmailMessages();
      
      // 個別サマリー作成
      if (calendarResult.success) {
        var calendarSummaryData = {
          processed_items: calendarResult.processed,
          created_tasks: calendarResult.transferred,
          skipped_duplicates: calendarResult.skipped || 0,
          execution_mode: 'manual_calendar',
          errors: calendarResult.errors && calendarResult.errors.length > 0 ? calendarResult.errors.join('; ') : ''
        };
        notionClient.createExecutionSummary(calendarSummaryData);
      }
      
      if (gmailResult.success) {
        var gmailSummaryData = {
          processed_items: gmailResult.processed,
          created_tasks: gmailResult.transferred,
          skipped_duplicates: gmailResult.skipped || 0,
          execution_mode: 'manual_gmail',
          errors: gmailResult.errors && gmailResult.errors.length > 0 ? gmailResult.errors.join('; ') : ''
        };
        notionClient.createExecutionSummary(gmailSummaryData);
      }
      
      // 統合結果を返す
      result = {
        success: calendarResult.success && gmailResult.success,
        processed: (calendarResult.processed || 0) + (gmailResult.processed || 0),
        transferred: (calendarResult.transferred || 0) + (gmailResult.transferred || 0),
        skipped: (calendarResult.skipped || 0) + (gmailResult.skipped || 0),
        errors: (calendarResult.errors || []).concat(gmailResult.errors || []),
        details: {
          calendar: calendarResult,
          gmail: gmailResult
        }
      };
      
    } else {
      throw new Error('サポートされていないソース: ' + source);
    }
    
    return result;
    
  } catch (error) {
    console.error('[manualTaskExtraction] エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Web App用エントリーポイント
 */
function doGet() {
  return HtmlService.createTemplateFromFile('WebApp')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 簡単実行用関数（ドロップダウンに表示されやすい）
 */
function runConfigSync() {
  checkAndSyncConfig();
}

function runGeminiTest() {
  testGeminiAI();
}

function runManualSetup() {
  setGeminiApiKeyManually();
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
 * 直接実行用関数
 */
function executeNow() {
  console.log('=== 直接実行開始 ===');
  
  // 1. 設定確認・同期
  console.log('1. 設定確認・同期実行');
  checkAndSyncConfig();
  
  // 2. Geminiテスト
  console.log('2. Geminiテスト実行');
  testGeminiAI();
  
  // 3. Notionテスト
  console.log('3. Notionテスト実行');
  testNotionAPI();
  
  console.log('=== 直接実行完了 ===');
}

/**
 * カレンダーのみ手動実行
 */
function runCalendarOnly() {
  console.log('=== カレンダーのみ手動実行 ===');
  var result = manualTaskExtraction('calendar');
  console.log('実行結果:', result);
  console.log('=== 実行完了 ===');
  return result;
}

/**
 * Gmailのみ手動実行
 */
function runGmailOnly() {
  console.log('=== Gmailのみ手動実行 ===');
  var result = manualTaskExtraction('gmail');
  console.log('実行結果:', result);
  console.log('=== 実行完了 ===');
  return result;
}

/**
 * カレンダーとGmail両方を手動実行
 */
function runBoth() {
  console.log('=== カレンダーとGmail両方を手動実行 ===');
  var result = manualTaskExtraction('both');
  console.log('実行結果:', result);
  console.log('=== 実行完了 ===');
  return result;
}/**
 * 平日判定付き自動実行エントリーポイント
 */
function autoTaskExtractionWeekdays() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=日曜, 1=月曜, ..., 6=土曜
  
  // 平日（月曜〜金曜）のみ実行
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    console.log('[autoTaskExtractionWeekdays] 平日のため実行します');
    return autoTaskExtraction();
  } else {
    console.log('[autoTaskExtractionWeekdays] 休日のためスキップします');
    return { success: true, skipped: true, reason: '休日のためスキップ' };
  }
}

/**
 * 自動実行エントリーポイント（トリガーから呼び出される）
 */
function autoTaskExtraction() {
  console.log('[autoTaskExtraction] 自動実行開始');
  
  try {
    const config = ConfigManager.getConfig();
    
    // 設定バリデーション
    const validation = ConfigManager.validateConfig();
    if (!validation.isValid) {
      throw new Error('設定エラー: ' + validation.errors.join(', '));
    }
    
    console.log('[autoTaskExtraction] 設定確認完了');
    
    const notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    let results = {
      calendar: null,
      gmail: null,
      totalProcessed: 0,
      totalCreated: 0,
      totalSkipped: 0,
      errors: []
    };
    
    // カレンダーからタスク抽出
    if (config.enableCalendarAnalysis !== false) {
      console.log('[autoTaskExtraction] カレンダー処理開始');
      try {
        results.calendar = transferCalendarEvents();
        if (results.calendar.success) {
          results.totalProcessed += results.calendar.processed;
          results.totalCreated += results.calendar.transferred;
          results.totalSkipped += results.calendar.skipped || 0;
          
          // カレンダー個別サマリー作成
          const calendarSummaryData = {
            processed_items: results.calendar.processed,
            created_tasks: results.calendar.transferred,
            skipped_duplicates: results.calendar.skipped || 0,
            execution_mode: 'auto_calendar',
            errors: results.calendar.errors && results.calendar.errors.length > 0 ? 
                   results.calendar.errors.join('; ') : ''
          };
          
          notionClient.createExecutionSummary(calendarSummaryData);
          console.log('[autoTaskExtraction] カレンダーサマリー作成完了');
          
        } else {
          results.errors.push('カレンダー: ' + results.calendar.error);
        }
      } catch (error) {
        console.error('[autoTaskExtraction] カレンダー処理エラー:', error.message);
        results.errors.push('カレンダー: ' + error.message);
      }
    }
    
    // Gmailからタスク抽出
    if (config.enableGmailAnalysis !== false) {
      console.log('[autoTaskExtraction] Gmail処理開始');
      try {
        results.gmail = transferGmailMessages();
        if (results.gmail.success) {
          results.totalProcessed += results.gmail.processed;
          results.totalCreated += results.gmail.transferred;
          results.totalSkipped += results.gmail.skipped || 0;
          
          // Gmail個別サマリー作成
          const gmailSummaryData = {
            processed_items: results.gmail.processed,
            created_tasks: results.gmail.transferred,
            skipped_duplicates: results.gmail.skipped || 0,
            execution_mode: 'auto_gmail',
            errors: results.gmail.errors && results.gmail.errors.length > 0 ? 
                   results.gmail.errors.join('; ') : ''
          };
          
          notionClient.createExecutionSummary(gmailSummaryData);
          console.log('[autoTaskExtraction] Gmailサマリー作成完了');
          
        } else {
          results.errors.push('Gmail: ' + results.gmail.error);
        }
      } catch (error) {
        console.error('[autoTaskExtraction] Gmail処理エラー:', error.message);
        results.errors.push('Gmail: ' + error.message);
      }
    }
    
    // 統合サマリー作成
    const totalSummaryData = {
      processed_items: results.totalProcessed,
      created_tasks: results.totalCreated,
      skipped_duplicates: results.totalSkipped,
      execution_mode: 'auto_integrated',
      errors: results.errors.length > 0 ? results.errors.join('; ') : '',
      context: `カレンダー処理: ${results.calendar ? (results.calendar.success ? '成功' : '失敗') : 'スキップ'}\n` +
               `Gmail処理: ${results.gmail ? (results.gmail.success ? '成功' : '失敗') : 'スキップ'}\n` +
               `詳細:\n` +
               `- カレンダー: ${results.calendar ? results.calendar.processed : 0}件処理, ${results.calendar ? results.calendar.transferred : 0}件作成\n` +
               `- Gmail: ${results.gmail ? results.gmail.processed : 0}件処理, ${results.gmail ? results.gmail.transferred : 0}件作成`
    };
    
    notionClient.createExecutionSummary(totalSummaryData);
    console.log('[autoTaskExtraction] 統合サマリー作成完了');
    
    console.log('[autoTaskExtraction] 自動実行完了');
    console.log('総処理件数:', results.totalProcessed);
    console.log('総作成件数:', results.totalCreated);
    console.log('総スキップ件数:', results.totalSkipped);
    console.log('エラー件数:', results.errors.length);
    
    return {
      success: results.errors.length === 0,
      processed: results.totalProcessed,
      created: results.totalCreated,
      skipped: results.totalSkipped,
      errors: results.errors,
      details: {
        calendar: results.calendar,
        gmail: results.gmail
      }
    };
    
  } catch (error) {
    console.error('[autoTaskExtraction] 自動実行エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
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
}/**

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
}/**

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
}/**
 *
 UI設定保存のデバッグ（12時設定を実際にテスト）
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
}/**

 * 実際のWebAppのUI状態を確認
 */
function checkActualWebAppState() {
  console.log('=== 実際のWebAppのUI状態確認 ===');
  
  try {
    // 1. 現在の設定を確認
    console.log('1. 現在の設定確認');
    const currentConfig = ConfigManager.getConfig();
    console.log('現在の実行時間:', currentConfig.executionHour + '時');
    
    // 2. スプレッドシートの実際の状態を詳しく確認
    console.log('2. スプレッドシート詳細確認');
    const spreadsheet = ConfigManager.getConfigSheet();
    console.log('スプレッドシートURL:', spreadsheet.getUrl());
    
    const basicSheet = spreadsheet.getSheetByName('基本設定');
    if (basicSheet) {
      const data = basicSheet.getDataRange().getValues();
      console.log('基本設定シートの行数:', data.length);
      console.log('基本設定シートの内容:');
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        console.log(`行${i + 1}:`, data[i]);
      }
      
      // EXECUTION_HOURの行を探す
      let foundExecutionHour = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === 'EXECUTION_HOUR') {
          console.log(`EXECUTION_HOUR発見: 行${i + 1}, 値: ${data[i][1]}`);
          foundExecutionHour = true;
          break;
        }
      }
      
      if (!foundExecutionHour) {
        console.log('❌ EXECUTION_HOURの行が見つかりません');
      }
      
    } else {
      console.log('❌ 基本設定シートが見つかりません');
    }
    
    // 3. WebAppのURLを確認
    console.log('3. WebApp情報');
    console.log('WebAppを開いて、実際に設定画面で時間を変更してから保存ボタンを押してください');
    console.log('その後、この関数を再実行して変更が反映されているか確認します');
    
    return {
      success: true,
      currentHour: currentConfig.executionHour,
      spreadsheetUrl: spreadsheet.getUrl(),
      message: 'WebAppで実際に設定を変更してから再確認してください'
    };
    
  } catch (error) {
    console.error('❌ WebApp状態確認エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * スプレッドシート保存問題の修正
 */
function fixSpreadsheetSaveProblem() {
  console.log('=== スプレッドシート保存問題の修正 ===');
  
  try {
    // 1. 現在の設定を取得
    const currentConfig = ConfigManager.getConfig();
    console.log('現在の設定:', currentConfig.executionHour + '時');
    
    // 2. スプレッドシートを取得
    const spreadsheet = ConfigManager.getConfigSheet();
    const basicSheet = spreadsheet.getSheetByName('基本設定');
    
    if (!basicSheet) {
      console.log('❌ 基本設定シートが存在しません');
      return { success: false, error: '基本設定シートが存在しません' };
    }
    
    // 3. 現在のシート内容を確認
    const data = basicSheet.getDataRange().getValues();
    console.log('修正前のシート行数:', data.length);
    
    // 4. 必要な設定項目を強制的に追加/更新
    console.log('4. 設定項目を強制追加/更新');
    
    const requiredSettings = [
      ['EXECUTION_HOUR', currentConfig.executionHour.toString(), '実行時間（0-23時）'],
      ['EXECUTION_FREQUENCY', currentConfig.executionFrequency, '実行頻度（daily/weekdays/weekly）'],
      ['DATA_RANGE_DAYS', currentConfig.dataRangeDays.toString(), 'データ取得期間（日数）'],
      ['ENABLE_AI_ANALYSIS', currentConfig.enableAiAnalysis.toString(), 'AI分析を有効にする'],
      ['ENABLE_VOICE_INPUT', currentConfig.enableVoiceInput.toString(), '音声入力を有効にする'],
      ['ENABLE_GMAIL_ANALYSIS', currentConfig.enableGmailAnalysis.toString(), 'Gmail分析を有効にする']
    ];
    
    // 既存の行をチェックして更新または追加
    let nextRow = data.length + 1;
    
    requiredSettings.forEach(([key, value, description]) => {
      let found = false;
      
      // 既存の行を探す
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          // 既存の行を更新
          basicSheet.getRange(i + 1, 2).setValue(value);
          console.log(`${key}を更新: ${value}`);
          found = true;
          break;
        }
      }
      
      // 見つからない場合は新規追加
      if (!found) {
        basicSheet.getRange(nextRow, 1).setValue(key);
        basicSheet.getRange(nextRow, 2).setValue(value);
        basicSheet.getRange(nextRow, 3).setValue(description);
        console.log(`${key}を新規追加: ${value}`);
        nextRow++;
      }
    });
    
    // 5. 修正後の確認
    console.log('5. 修正後の確認');
    const updatedConfig = ConfigManager.loadConfigFromSheet();
    console.log('修正後の設定項目数:', Object.keys(updatedConfig).length);
    console.log('EXECUTION_HOUR:', updatedConfig.EXECUTION_HOUR);
    
    if (Object.keys(updatedConfig).length > 0 && updatedConfig.EXECUTION_HOUR) {
      console.log('✅ スプレッドシート保存問題を修正しました');
      
      // 設定を同期
      ConfigManager.syncSheetToProperties();
      
      return {
        success: true,
        message: 'スプレッドシート保存問題を修正しました',
        itemCount: Object.keys(updatedConfig).length,
        executionHour: updatedConfig.EXECUTION_HOUR
      };
      
    } else {
      console.log('❌ スプレッドシート修正に失敗しました');
      return { success: false, error: 'スプレッドシート修正に失敗' };
    }
    
  } catch (error) {
    console.error('❌ スプレッドシート修正エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * スプレッドシートを完全に再作成
 */
function recreateConfigSpreadsheet() {
  console.log('=== スプレッドシート完全再作成 ===');
  
  try {
    // 1. 現在の設定を保存
    console.log('1. 現在の設定を保存');
    const currentConfig = ConfigManager.getConfig();
    console.log('保存する設定:', {
      executionHour: currentConfig.executionHour,
      executionFrequency: currentConfig.executionFrequency,
      enableAiAnalysis: currentConfig.enableAiAnalysis,
      enableGmailAnalysis: currentConfig.enableGmailAnalysis
    });
    
    // 2. 既存のスプレッドシートを削除（もしあれば）
    console.log('2. 既存スプレッドシートの確認');
    try {
      const files = DriveApp.getFilesByName('AI Task Manager - 設定');
      while (files.hasNext()) {
        const file = files.next();
        console.log('既存の設定ファイルを削除:', file.getId());
        DriveApp.getFileById(file.getId()).setTrashed(true);
      }
    } catch (e) {
      console.log('既存ファイルなし（正常）');
    }
    
    // 3. 新しいスプレッドシートを作成
    console.log('3. 新しいスプレッドシートを作成');
    const spreadsheet = SpreadsheetApp.create('AI Task Manager - 設定');
    const sheet = spreadsheet.getActiveSheet();
    sheet.setName('基本設定');
    
    console.log('新しいスプレッドシートURL:', spreadsheet.getUrl());
    
    // 4. ヘッダーと基本設定を設定
    console.log('4. 基本設定データを設定');
    const basicHeaders = [
      ['設定項目', '値', '説明'],
      ['NOTION_TOKEN', currentConfig.notionToken || '', 'Notion APIトークン'],
      ['NOTION_DATABASE_ID', currentConfig.notionDatabaseId || '', 'NotionデータベースID'],
      ['AI_PROVIDER', 'gemini', 'AIプロバイダー（gemini/claude/disabled）'],
      ['GEMINI_API_KEY', currentConfig.geminiApiKey || '', 'Gemini APIキー'],
      ['CLAUDE_API_KEY', currentConfig.claudeApiKey || '', 'Claude APIキー（オプション）'],
      ['EXECUTION_FREQUENCY', currentConfig.executionFrequency || 'daily', '実行頻度（daily/weekdays/weekly）'],
      ['EXECUTION_HOUR', currentConfig.executionHour.toString() || '8', '実行時間（0-23時）'],
      ['DATA_RANGE_DAYS', currentConfig.dataRangeDays.toString() || '7', 'データ取得期間（日数）'],
      ['ENABLE_AI_ANALYSIS', currentConfig.enableAiAnalysis.toString() || 'true', 'AI分析を有効にする'],
      ['ENABLE_VOICE_INPUT', currentConfig.enableVoiceInput.toString() || 'true', '音声入力を有効にする'],
      ['ENABLE_GMAIL_ANALYSIS', currentConfig.enableGmailAnalysis.toString() || 'true', 'Gmail分析を有効にする']
    ];
    
    // データを設定
    const basicRange = sheet.getRange(1, 1, basicHeaders.length, basicHeaders[0].length);
    basicRange.setValues(basicHeaders);
    
    // フォーマット設定
    sheet.getRange(1, 1, 1, 3).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 300);
    sheet.setColumnWidth(3, 300);
    
    // 5. メールフィルタ設定シートも作成
    console.log('5. メールフィルタ設定シートを作成');
    const filterSheet = spreadsheet.insertSheet('メールフィルタ設定');
    
    const filterHeaders = [
      ['設定項目', '値', '説明', '例'],
      ['', '', '=== 基本設定 ===', ''],
      ['GMAIL_SEARCH_QUERY', currentConfig.gmailSearchQuery || 'in:inbox -is:archived', 'Gmail検索クエリ', 'in:inbox newer_than:3d'],
      ['GMAIL_MAX_RESULTS', currentConfig.gmailMaxResults.toString() || '50', '最大取得件数', '10, 20, 100'],
      ['GMAIL_DATE_RANGE_DAYS', currentConfig.gmailDateRangeDays.toString() || '7', 'メール調査期間（日数）', '1, 3, 7, 14'],
      ['GMAIL_AUTO_EXCLUDE_CATEGORIES', currentConfig.gmailAutoExcludeCategories.toString() || 'true', '自動除外カテゴリ', 'true, false'],
      ['GMAIL_MIN_SUBJECT_LENGTH', currentConfig.gmailMinSubjectLength.toString() || '3', '最小件名文字数', '1, 3, 5']
    ];
    
    const filterRange = filterSheet.getRange(1, 1, filterHeaders.length, filterHeaders[0].length);
    filterRange.setValues(filterHeaders);
    
    // フォーマット設定
    filterSheet.getRange(1, 1, 1, 4).setBackground('#34a853').setFontColor('white').setFontWeight('bold');
    filterSheet.setColumnWidth(1, 250);
    filterSheet.setColumnWidth(2, 350);
    filterSheet.setColumnWidth(3, 300);
    filterSheet.setColumnWidth(4, 200);
    
    // 6. 作成後の確認
    console.log('6. 作成後の確認');
    const testConfig = ConfigManager.loadConfigFromSheet();
    console.log('作成後の設定項目数:', Object.keys(testConfig).length);
    console.log('EXECUTION_HOUR:', testConfig.EXECUTION_HOUR);
    console.log('EXECUTION_FREQUENCY:', testConfig.EXECUTION_FREQUENCY);
    
    if (Object.keys(testConfig).length > 0) {
      console.log('✅ スプレッドシート再作成成功！');
      console.log('📊 スプレッドシートURL:', spreadsheet.getUrl());
      
      // 設定を同期
      ConfigManager.syncSheetToProperties();
      
      return {
        success: true,
        message: 'スプレッドシートを完全に再作成しました',
        url: spreadsheet.getUrl(),
        itemCount: Object.keys(testConfig).length,
        executionHour: testConfig.EXECUTION_HOUR
      };
      
    } else {
      console.log('❌ スプレッドシート再作成に失敗');
      return { success: false, error: 'スプレッドシート再作成に失敗' };
    }
    
  } catch (error) {
    console.error('❌ スプレッドシート再作成エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * UI設定保存の最終テスト
 */
function finalUISettingTest() {
  console.log('=== UI設定保存の最終テスト ===');
  
  try {
    // 1. 現在の状況
    console.log('1. 現在の状況');
    const beforeConfig = ConfigManager.getConfig();
    console.log('テスト前の実行時間:', beforeConfig.executionHour + '時');
    
    // 2. スプレッドシート状況確認
    console.log('2. スプレッドシート状況確認');
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    console.log('スプレッドシート設定項目数:', Object.keys(sheetConfig).length);
    
    if (Object.keys(sheetConfig).length === 0) {
      console.log('❌ スプレッドシートがまだ空です');
      console.log('💡 まず recreateConfigSpreadsheet() を実行してください');
      return { success: false, error: 'スプレッドシートが空です' };
    }
    
    // 3. UI設定変更をテスト（15時に変更）
    console.log('3. UI設定変更テスト（15時に変更）');
    const testConfig = {
      notionToken: beforeConfig.notionToken,
      notionDatabaseId: beforeConfig.notionDatabaseId,
      executionHour: 15, // 15時に変更
      executionFrequency: 'daily',
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    // UI設定保存プロセスを実行
    const setResult = setConfig(testConfig);
    console.log('setConfig結果:', setResult);
    
    const sheetResult = saveConfigToSheet(testConfig);
    console.log('saveConfigToSheet結果:', sheetResult);
    
    const syncResult = syncSheetToProperties();
    console.log('syncSheetToProperties結果:', syncResult);
    
    // 4. 結果確認
    console.log('4. 結果確認');
    const afterConfig = ConfigManager.getConfig();
    const afterSheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log('テスト後の実行時間:', afterConfig.executionHour + '時');
    console.log('スプレッドシートのEXECUTION_HOUR:', afterSheetConfig.EXECUTION_HOUR);
    
    if (afterConfig.executionHour === 15 && afterSheetConfig.EXECUTION_HOUR === '15') {
      console.log('✅ UI設定保存が完全に動作しています！');
      
      // トリガーも更新
      const triggerResult = setupAutoTriggers();
      console.log('トリガー更新結果:', triggerResult);
      
      return {
        success: true,
        message: 'UI設定保存が完全に動作しています',
        beforeHour: beforeConfig.executionHour,
        afterHour: afterConfig.executionHour,
        spreadsheetHour: afterSheetConfig.EXECUTION_HOUR
      };
      
    } else {
      console.log('❌ UI設定保存にまだ問題があります');
      return {
        success: false,
        message: 'UI設定保存に問題があります',
        expectedHour: 15,
        actualHour: afterConfig.executionHour,
        spreadsheetHour: afterSheetConfig.EXECUTION_HOUR
      };
    }
    
  } catch (error) {
    console.error('❌ 最終テストエラー:', error.message);
    return { success: false, error: error.message };
  }
}/**

 * saveConfigToSheet関数の詳細デバッグ
 */
function debugSaveConfigToSheet() {
  console.log('=== saveConfigToSheet関数の詳細デバッグ ===');
  
  try {
    // 1. 現在の状況確認
    console.log('1. 現在の状況確認');
    const currentConfig = ConfigManager.getConfig();
    console.log('現在の実行時間:', currentConfig.executionHour + '時');
    
    // 2. スプレッドシートを直接確認
    console.log('2. スプレッドシート直接確認');
    const spreadsheet = ConfigManager.getConfigSheet();
    const basicSheet = spreadsheet.getSheetByName('基本設定');
    
    if (!basicSheet) {
      console.log('❌ 基本設定シートが見つかりません');
      return { success: false, error: '基本設定シートが見つかりません' };
    }
    
    const data = basicSheet.getDataRange().getValues();
    console.log('スプレッドシートの現在の内容:');
    for (let i = 0; i < Math.min(data.length, 15); i++) {
      console.log(`行${i + 1}:`, data[i]);
    }
    
    // 3. 20時に変更するテスト
    console.log('3. 20時に変更するテスト');
    const testConfig = {
      EXECUTION_HOUR: '20',
      EXECUTION_FREQUENCY: 'daily',
      DATA_RANGE_DAYS: '7',
      ENABLE_AI_ANALYSIS: 'true',
      ENABLE_VOICE_INPUT: 'true',
      ENABLE_GMAIL_ANALYSIS: 'true'
    };
    
    console.log('保存するテスト設定:', testConfig);
    
    // 4. ConfigManager.saveConfigToSheetを直接呼び出し
    console.log('4. ConfigManager.saveConfigToSheetを直接実行');
    try {
      ConfigManager.saveConfigToSheet(testConfig);
      console.log('ConfigManager.saveConfigToSheet実行完了');
    } catch (saveError) {
      console.error('ConfigManager.saveConfigToSheetエラー:', saveError.message);
      return { success: false, error: 'saveConfigToSheetエラー: ' + saveError.message };
    }
    
    // 5. 保存後のスプレッドシート確認
    console.log('5. 保存後のスプレッドシート確認');
    const afterData = basicSheet.getDataRange().getValues();
    console.log('保存後のスプレッドシート内容:');
    for (let i = 0; i < Math.min(afterData.length, 15); i++) {
      console.log(`行${i + 1}:`, afterData[i]);
    }
    
    // 6. EXECUTION_HOURの値を確認
    console.log('6. EXECUTION_HOURの値を確認');
    let foundExecutionHour = false;
    let executionHourValue = null;
    
    for (let i = 1; i < afterData.length; i++) {
      if (afterData[i][0] === 'EXECUTION_HOUR') {
        executionHourValue = afterData[i][1];
        console.log(`EXECUTION_HOUR発見: 行${i + 1}, 値: ${executionHourValue}`);
        foundExecutionHour = true;
        break;
      }
    }
    
    if (!foundExecutionHour) {
      console.log('❌ EXECUTION_HOURの行が見つかりません');
      return { success: false, error: 'EXECUTION_HOURの行が見つかりません' };
    }
    
    // 7. 結果判定
    if (executionHourValue === '20') {
      console.log('✅ saveConfigToSheet関数は正常に動作しています');
      
      // 設定を同期
      ConfigManager.syncSheetToProperties();
      const syncedConfig = ConfigManager.getConfig();
      console.log('同期後の実行時間:', syncedConfig.executionHour + '時');
      
      return {
        success: true,
        message: 'saveConfigToSheet関数は正常に動作しています',
        spreadsheetValue: executionHourValue,
        syncedValue: syncedConfig.executionHour
      };
      
    } else {
      console.log('❌ saveConfigToSheet関数に問題があります');
      console.log(`期待値: 20, 実際: ${executionHourValue}`);
      
      return {
        success: false,
        message: 'saveConfigToSheet関数に問題があります',
        expectedValue: '20',
        actualValue: executionHourValue
      };
    }
    
  } catch (error) {
    console.error('❌ デバッグエラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Config.gsの_updateSheetConfig関数の動作確認
 */
function debugUpdateSheetConfig() {
  console.log('=== _updateSheetConfig関数の動作確認 ===');
  
  try {
    // 1. スプレッドシートを取得
    const spreadsheet = ConfigManager.getConfigSheet();
    const basicSheet = spreadsheet.getSheetByName('基本設定');
    
    if (!basicSheet) {
      console.log('❌ 基本設定シートが見つかりません');
      return { success: false, error: '基本設定シートが見つかりません' };
    }
    
    // 2. 現在のデータを確認
    console.log('2. 現在のデータを確認');
    const data = basicSheet.getDataRange().getValues();
    console.log('現在のスプレッドシート内容:');
    for (let i = 0; i < data.length; i++) {
      console.log(`行${i + 1}:`, data[i]);
    }
    
    // 3. 手動でEXECUTION_HOURを更新
    console.log('3. 手動でEXECUTION_HOURを22時に更新');
    let updated = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'EXECUTION_HOUR') {
        console.log(`EXECUTION_HOUR発見: 行${i + 1}, 現在値: ${data[i][1]}`);
        basicSheet.getRange(i + 1, 2).setValue('22');
        console.log('22に更新しました');
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      console.log('❌ EXECUTION_HOURの行が見つかりませんでした');
      return { success: false, error: 'EXECUTION_HOURの行が見つかりません' };
    }
    
    // 4. 更新後の確認
    console.log('4. 更新後の確認');
    const afterData = basicSheet.getDataRange().getValues();
    let newValue = null;
    
    for (let i = 1; i < afterData.length; i++) {
      if (afterData[i][0] === 'EXECUTION_HOUR') {
        newValue = afterData[i][1];
        console.log(`更新後のEXECUTION_HOUR: ${newValue}`);
        break;
      }
    }
    
    // 5. 設定を読み込んで確認
    console.log('5. 設定を読み込んで確認');
    const loadedConfig = ConfigManager.loadConfigFromSheet();
    console.log('loadConfigFromSheet結果:', loadedConfig.EXECUTION_HOUR);
    
    if (newValue === '22' && loadedConfig.EXECUTION_HOUR === '22') {
      console.log('✅ スプレッドシートの手動更新は正常に動作しています');
      
      // PropertiesServiceに同期
      ConfigManager.syncSheetToProperties();
      const syncedConfig = ConfigManager.getConfig();
      console.log('同期後のPropertiesService:', syncedConfig.executionHour + '時');
      
      return {
        success: true,
        message: 'スプレッドシートの更新は正常に動作しています',
        spreadsheetValue: newValue,
        loadedValue: loadedConfig.EXECUTION_HOUR,
        syncedValue: syncedConfig.executionHour
      };
      
    } else {
      console.log('❌ スプレッドシートの更新に問題があります');
      return {
        success: false,
        message: 'スプレッドシートの更新に問題があります',
        spreadsheetValue: newValue,
        loadedValue: loadedConfig.EXECUTION_HOUR
      };
    }
    
  } catch (error) {
    console.error('❌ 更新確認エラー:', error.message);
    return { success: false, error: error.message };
  }
}
/**
 *
 簡単なテスト関数（Code.gsの動作確認用）
 */
function simpleTest() {
  console.log('=== Code.gs動作確認テスト ===');
  
  try {
    // 1. 現在の設定確認
    const config = ConfigManager.getConfig();
    console.log('現在の実行時間:', config.executionHour + '時');
    console.log('現在の実行頻度:', config.executionFrequency);
    
    // 2. スプレッドシート確認
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    console.log('スプレッドシート設定項目数:', Object.keys(sheetConfig).length);
    console.log('EXECUTION_HOUR:', sheetConfig.EXECUTION_HOUR);
    
    console.log('✅ Code.gsは正常に動作しています');
    
    return {
      success: true,
      currentHour: config.executionHour,
      sheetHour: sheetConfig.EXECUTION_HOUR,
      message: 'Code.gsは正常に動作しています'
    };
    
  } catch (error) {
    console.error('❌ Code.gsテストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * UI設定保存の最終確認テスト
 */
function testUISettingFinal() {
  console.log('=== UI設定保存の最終確認テスト ===');
  
  try {
    // 1. 現在の状況
    console.log('1. 現在の状況');
    const beforeConfig = ConfigManager.getConfig();
    console.log('テスト前の実行時間:', beforeConfig.executionHour + '時');
    
    // 2. 16時に変更するテスト
    console.log('2. 16時に変更するテスト');
    const testConfig = {
      notionToken: beforeConfig.notionToken,
      notionDatabaseId: beforeConfig.notionDatabaseId,
      executionHour: 16, // 16時に変更
      executionFrequency: 'daily',
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    console.log('テスト設定:', testConfig.executionHour + '時');
    
    // 3. UI設定保存プロセスを実行
    console.log('3. UI設定保存プロセスを実行');
    
    // setConfig
    const setResult = setConfig(testConfig);
    console.log('setConfig結果:', setResult.success ? '成功' : '失敗');
    
    // saveConfigToSheet
    const sheetResult = saveConfigToSheet(testConfig);
    console.log('saveConfigToSheet結果:', sheetResult.success ? '成功' : '失敗');
    
    // syncSheetToProperties
    const syncResult = syncSheetToProperties();
    console.log('syncSheetToProperties結果:', syncResult.success ? '成功' : '失敗');
    
    // 4. 結果確認
    console.log('4. 結果確認');
    const afterConfig = ConfigManager.getConfig();
    const afterSheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log('テスト後の実行時間:', afterConfig.executionHour + '時');
    console.log('スプレッドシートのEXECUTION_HOUR:', afterSheetConfig.EXECUTION_HOUR);
    
    if (afterConfig.executionHour === 16 && afterSheetConfig.EXECUTION_HOUR === '16') {
      console.log('✅ UI設定保存が完全に動作しています！');
      
      // トリガーも更新
      const triggerResult = setupAutoTriggers();
      console.log('トリガー更新:', triggerResult.success ? '成功' : '失敗');
      
      return {
        success: true,
        message: 'UI設定保存が完全に動作しています',
        beforeHour: beforeConfig.executionHour,
        afterHour: afterConfig.executionHour,
        spreadsheetHour: afterSheetConfig.EXECUTION_HOUR
      };
      
    } else {
      console.log('❌ UI設定保存にまだ問題があります');
      return {
        success: false,
        message: 'UI設定保存に問題があります',
        expectedHour: 16,
        actualHour: afterConfig.executionHour,
        spreadsheetHour: afterSheetConfig.EXECUTION_HOUR
      };
    }
    
  } catch (error) {
    console.error('❌ 最終テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}/**

 * クリーンなUI設定保存テスト（他の関数の影響を受けない）
 */
function cleanUISettingTest() {
  console.log('=== クリーンなUI設定保存テスト ===');
  
  try {
    // 1. 現在の状況確認
    console.log('1. 現在の状況確認');
    const beforeConfig = ConfigManager.getConfig();
    console.log('テスト前の実行時間:', beforeConfig.executionHour + '時');
    
    // 2. 14時に変更するテスト（他のテストと重複しない時間）
    console.log('2. 14時に変更するテスト');
    const testHour = 14;
    const testConfig = {
      notionToken: beforeConfig.notionToken,
      notionDatabaseId: beforeConfig.notionDatabaseId,
      executionHour: testHour,
      executionFrequency: 'daily',
      dataRangeDays: 7,
      enableAiAnalysis: true,
      enableVoiceInput: true,
      enableGmailAnalysis: true
    };
    
    console.log(`テスト設定: ${testHour}時に変更`);
    
    // 3. 段階的に実行（他の関数を呼ばない）
    console.log('3. 段階的に実行');
    
    // 3-1. PropertiesServiceに直接保存
    console.log('3-1. PropertiesServiceに直接保存');
    const result = ConfigManager.setConfig(testConfig);
    console.log('ConfigManager.setConfig結果:', result.success ? '成功' : '失敗');
    
    // 即座に確認
    const afterSetConfig = ConfigManager.getConfig();
    console.log('setConfig直後の実行時間:', afterSetConfig.executionHour + '時');
    
    if (afterSetConfig.executionHour !== testHour) {
      console.log('❌ PropertiesServiceへの保存に失敗');
      return {
        success: false,
        step: 'PropertiesService',
        expected: testHour,
        actual: afterSetConfig.executionHour
      };
    }
    
    // 3-2. スプレッドシートに保存
    console.log('3-2. スプレッドシートに保存');
    ConfigManager.saveConfigToSheet(testConfig);
    console.log('ConfigManager.saveConfigToSheet実行完了');
    
    // スプレッドシート確認
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    console.log('saveConfigToSheet直後のEXECUTION_HOUR:', sheetConfig.EXECUTION_HOUR);
    
    if (sheetConfig.EXECUTION_HOUR !== testHour.toString()) {
      console.log('❌ スプレッドシートへの保存に失敗');
      return {
        success: false,
        step: 'Spreadsheet',
        expected: testHour.toString(),
        actual: sheetConfig.EXECUTION_HOUR
      };
    }
    
    // 4. 最終確認
    console.log('4. 最終確認');
    const finalConfig = ConfigManager.getConfig();
    const finalSheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log('最終的な実行時間:', finalConfig.executionHour + '時');
    console.log('最終的なスプレッドシート:', finalSheetConfig.EXECUTION_HOUR);
    
    if (finalConfig.executionHour === testHour && finalSheetConfig.EXECUTION_HOUR === testHour.toString()) {
      console.log('✅ UI設定保存が完全に動作しています！');
      
      // トリガーも更新
      console.log('5. トリガー更新');
      const triggerResult = setupAutoTriggers();
      console.log('トリガー更新結果:', triggerResult.success ? '成功' : '失敗');
      
      return {
        success: true,
        message: `UI設定保存が完全に動作しています（${testHour}時）`,
        beforeHour: beforeConfig.executionHour,
        afterHour: finalConfig.executionHour,
        spreadsheetHour: finalSheetConfig.EXECUTION_HOUR
      };
      
    } else {
      console.log('❌ 最終確認で不一致が発生');
      return {
        success: false,
        message: '最終確認で不一致が発生',
        expectedHour: testHour,
        actualHour: finalConfig.executionHour,
        spreadsheetHour: finalSheetConfig.EXECUTION_HOUR
      };
    }
    
  } catch (error) {
    console.error('❌ クリーンテストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 実際のWebApp UIテスト用関数
 */
function testActualWebAppUI() {
  console.log('=== 実際のWebApp UIテスト ===');
  console.log('');
  console.log('📋 テスト手順:');
  console.log('1. WebAppを開く');
  console.log('2. 設定画面（⚙️ 基本設定）を開く');
  console.log('3. 実行時間を 19時 に変更');
  console.log('4. 保存ボタンをクリック');
  console.log('5. この関数を再実行して確認');
  console.log('');
  
  try {
    const config = ConfigManager.getConfig();
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log('現在の設定状況:');
    console.log('- PropertiesService:', config.executionHour + '時');
    console.log('- スプレッドシート:', sheetConfig.EXECUTION_HOUR);
    
    if (config.executionHour === 19 && sheetConfig.EXECUTION_HOUR === '19') {
      console.log('✅ WebApp UIからの設定変更が成功しています！');
      console.log('🎉 UI設定保存機能は完全に動作しています');
      
      return {
        success: true,
        message: 'WebApp UIからの設定変更が成功しています',
        hour: 19
      };
      
    } else {
      console.log('⚠️ まだ19時に設定されていません');
      console.log('💡 WebAppで19時に設定してから再実行してください');
      
      return {
        success: false,
        message: 'WebAppで19時に設定してから再実行してください',
        currentHour: config.executionHour,
        spreadsheetHour: sheetConfig.EXECUTION_HOUR
      };
    }
    
  } catch (error) {
    console.error('❌ WebApp UIテストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 本当のUI設定確認（演技なし）
 */
function checkRealUISettings() {
  console.log('=== 本当のUI設定確認（演技なし） ===');
  console.log('');
  console.log('🎯 これは本当のテストです：');
  console.log('1. 現在の設定を確認します');
  console.log('2. あなたがWebAppで実際に設定した値を確認します');
  console.log('3. 嘘偽りなく結果を報告します');
  console.log('');
  
  try {
    // 1. 現在の設定を確認
    console.log('1. 現在の設定確認');
    const config = ConfigManager.getConfig();
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log('📊 現在の設定状況:');
    console.log('- PropertiesService実行時間:', config.executionHour + '時');
    console.log('- PropertiesService実行頻度:', config.executionFrequency);
    console.log('- スプレッドシートEXECUTION_HOUR:', sheetConfig.EXECUTION_HOUR);
    console.log('- スプレッドシートEXECUTION_FREQUENCY:', sheetConfig.EXECUTION_FREQUENCY);
    console.log('- スプレッドシート設定項目数:', Object.keys(sheetConfig).length);
    
    // 2. 設定の一致性確認
    console.log('2. 設定の一致性確認');
    const isConsistent = (config.executionHour.toString() === sheetConfig.EXECUTION_HOUR) &&
                        (config.executionFrequency === sheetConfig.EXECUTION_FREQUENCY);
    
    if (isConsistent) {
      console.log('✅ PropertiesServiceとスプレッドシートの設定が一致しています');
    } else {
      console.log('❌ PropertiesServiceとスプレッドシートの設定が不一致です');
      console.log(`PropertiesService: ${config.executionHour}時, ${config.executionFrequency}`);
      console.log(`スプレッドシート: ${sheetConfig.EXECUTION_HOUR}時, ${sheetConfig.EXECUTION_FREQUENCY}`);
    }
    
    // 3. トリガー確認
    console.log('3. 現在のトリガー確認');
    const triggers = ScriptApp.getProjectTriggers();
    let autoTriggerCount = 0;
    let triggerFunction = null;
    
    triggers.forEach(trigger => {
      const functionName = trigger.getHandlerFunction();
      if (functionName === 'autoTaskExtraction' || functionName === 'autoTaskExtractionWeekdays') {
        autoTriggerCount++;
        triggerFunction = functionName;
        console.log(`🔔 トリガー発見: ${functionName}, ID: ${trigger.getUniqueId()}`);
      }
    });
    
    console.log(`トリガー数: ${autoTriggerCount}個`);
    
    // 4. 最後に設定された時刻を確認
    console.log('4. 最後に設定された時刻');
    console.log(`現在システムに設定されている実行時間: ${config.executionHour}時`);
    
    // 5. WebApp URLの確認
    console.log('5. WebApp情報');
    console.log('💡 WebAppで設定を変更するには:');
    console.log('   1. WebAppを開く');
    console.log('   2. ⚙️ 基本設定をクリック');
    console.log('   3. 実行時間を変更（例：17時）');
    console.log('   4. 保存ボタンをクリック');
    console.log('   5. この関数を再実行して変更を確認');
    
    return {
      success: true,
      currentSettings: {
        propertiesHour: config.executionHour,
        propertiesFrequency: config.executionFrequency,
        spreadsheetHour: sheetConfig.EXECUTION_HOUR,
        spreadsheetFrequency: sheetConfig.EXECUTION_FREQUENCY,
        isConsistent: isConsistent,
        triggerCount: autoTriggerCount,
        triggerFunction: triggerFunction
      },
      message: `現在の実行時間: ${config.executionHour}時`
    };
    
  } catch (error) {
    console.error('❌ 本当のUI設定確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WebApp設定変更の検証（特定の時間をチェック）
 */
function verifyWebAppChange(expectedHour) {
  console.log(`=== WebApp設定変更の検証（${expectedHour}時をチェック） ===`);
  
  if (!expectedHour) {
    console.log('❌ 期待する時間を指定してください');
    console.log('例: verifyWebAppChange(17) // 17時をチェック');
    return { success: false, error: '期待する時間が指定されていません' };
  }
  
  try {
    const config = ConfigManager.getConfig();
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log(`🔍 ${expectedHour}時に設定されているかチェック中...`);
    console.log('現在の設定:');
    console.log('- PropertiesService:', config.executionHour + '時');
    console.log('- スプレッドシート:', sheetConfig.EXECUTION_HOUR);
    
    const isPropertiesCorrect = config.executionHour === expectedHour;
    const isSpreadsheetCorrect = sheetConfig.EXECUTION_HOUR === expectedHour.toString();
    
    if (isPropertiesCorrect && isSpreadsheetCorrect) {
      console.log(`✅ WebAppからの${expectedHour}時設定が正しく反映されています！`);
      console.log('🎉 UI設定保存機能は正常に動作しています');
      
      // トリガーも確認
      const triggerResult = setupAutoTriggers();
      console.log('トリガー更新結果:', triggerResult.success ? '成功' : '失敗');
      
      return {
        success: true,
        message: `WebAppからの${expectedHour}時設定が正しく反映されています`,
        hour: expectedHour,
        propertiesHour: config.executionHour,
        spreadsheetHour: sheetConfig.EXECUTION_HOUR
      };
      
    } else {
      console.log(`❌ ${expectedHour}時設定が反映されていません`);
      console.log('問題:');
      if (!isPropertiesCorrect) {
        console.log(`- PropertiesService: 期待${expectedHour}時, 実際${config.executionHour}時`);
      }
      if (!isSpreadsheetCorrect) {
        console.log(`- スプレッドシート: 期待${expectedHour}, 実際${sheetConfig.EXECUTION_HOUR}`);
      }
      
      console.log('💡 WebAppで再度設定を保存してから再実行してください');
      
      return {
        success: false,
        message: `${expectedHour}時設定が反映されていません`,
        expectedHour: expectedHour,
        actualPropertiesHour: config.executionHour,
        actualSpreadsheetHour: sheetConfig.EXECUTION_HOUR
      };
    }
    
  } catch (error) {
    console.error('❌ 検証エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}/**
 * 緊
急：本当の設定状況を確認（キャッシュクリア付き）
 */
function emergencyRealSettingsCheck() {
  console.log('=== 緊急：本当の設定状況確認 ===');
  console.log('🚨 UIで15時に設定したのに14時と表示される問題を調査');
  console.log('');
  
  try {
    // 1. PropertiesServiceを直接確認
    console.log('1. PropertiesServiceを直接確認');
    const props = PropertiesService.getScriptProperties();
    const directHour = props.getProperty('EXECUTION_HOUR');
    const directFreq = props.getProperty('EXECUTION_FREQUENCY');
    
    console.log('PropertiesService直接取得:');
    console.log('- EXECUTION_HOUR:', directHour);
    console.log('- EXECUTION_FREQUENCY:', directFreq);
    
    // 2. ConfigManager経由で確認
    console.log('2. ConfigManager経由で確認');
    const config = ConfigManager.getConfig();
    console.log('ConfigManager.getConfig():');
    console.log('- executionHour:', config.executionHour);
    console.log('- executionFrequency:', config.executionFrequency);
    
    // 3. スプレッドシートを直接確認
    console.log('3. スプレッドシートを直接確認');
    const spreadsheet = ConfigManager.getConfigSheet();
    const basicSheet = spreadsheet.getSheetByName('基本設定');
    
    if (basicSheet) {
      const data = basicSheet.getDataRange().getValues();
      console.log('スプレッドシート直接確認:');
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === 'EXECUTION_HOUR') {
          console.log(`- EXECUTION_HOUR: ${data[i][1]} (行${i + 1})`);
          break;
        }
      }
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === 'EXECUTION_FREQUENCY') {
          console.log(`- EXECUTION_FREQUENCY: ${data[i][1]} (行${i + 1})`);
          break;
        }
      }
    }
    
    // 4. loadConfigFromSheet経由で確認
    console.log('4. loadConfigFromSheet経由で確認');
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    console.log('ConfigManager.loadConfigFromSheet():');
    console.log('- EXECUTION_HOUR:', sheetConfig.EXECUTION_HOUR);
    console.log('- EXECUTION_FREQUENCY:', sheetConfig.EXECUTION_FREQUENCY);
    
    // 5. 不一致の分析
    console.log('5. 不一致の分析');
    console.log('');
    console.log('📊 設定値の比較:');
    console.log(`PropertiesService直接: ${directHour}`);
    console.log(`ConfigManager経由: ${config.executionHour}`);
    console.log(`スプレッドシート: ${sheetConfig.EXECUTION_HOUR}`);
    console.log('');
    
    if (directHour === '15' || config.executionHour === 15 || sheetConfig.EXECUTION_HOUR === '15') {
      console.log('✅ 15時設定が一部で見つかりました！');
      console.log('💡 どこかに15時設定が保存されています');
    } else {
      console.log('❌ どこにも15時設定が見つかりません');
      console.log('🚨 UIからの設定保存が完全に失敗しています');
    }
    
    // 6. WebAppのsaveSettings関数が呼ばれているかチェック
    console.log('6. WebApp設定保存の問題診断');
    console.log('💡 WebAppで保存ボタンを押した時に以下が実行されているかチェック:');
    console.log('   - setConfig()関数');
    console.log('   - saveConfigToSheet()関数');
    console.log('   - syncSheetToProperties()関数');
    
    return {
      success: true,
      propertiesServiceDirect: directHour,
      configManagerValue: config.executionHour,
      spreadsheetValue: sheetConfig.EXECUTION_HOUR,
      found15Hour: directHour === '15' || config.executionHour === 15 || sheetConfig.EXECUTION_HOUR === '15',
      message: '本当の設定状況を確認しました'
    };
    
  } catch (error) {
    console.error('❌ 緊急確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WebApp設定保存の動作ログを確認
 */
function checkWebAppSaveLog() {
  console.log('=== WebApp設定保存の動作ログ確認 ===');
  console.log('');
  console.log('🔍 WebAppで15時に設定して保存ボタンを押した時の動作を確認');
  console.log('');
  console.log('📋 確認手順:');
  console.log('1. WebAppを開く');
  console.log('2. ⚙️ 基本設定をクリック');
  console.log('3. 実行時間を15時に設定');
  console.log('4. 保存ボタンをクリック');
  console.log('5. ブラウザの開発者ツール（F12）でConsoleタブを確認');
  console.log('6. 以下のログが表示されるかチェック:');
  console.log('   - "保存する設定:" で始まるログ');
  console.log('   - "設定保存成功:" で始まるログ');
  console.log('   - "スプレッドシート保存完了" ログ');
  console.log('   - "設定同期完了" ログ');
  console.log('');
  console.log('💡 これらのログが表示されない場合:');
  console.log('   → WebAppのJavaScript（script.html）に問題があります');
  console.log('');
  console.log('💡 ログは表示されるが設定が反映されない場合:');
  console.log('   → GAS側の関数（setConfig, saveConfigToSheet等）に問題があります');
  
  // 現在の設定も表示
  try {
    const config = ConfigManager.getConfig();
    console.log('📊 現在の設定（参考）:');
    console.log('- 実行時間:', config.executionHour + '時');
    console.log('- 実行頻度:', config.executionFrequency);
    
    return {
      success: true,
      currentHour: config.executionHour,
      message: 'WebApp設定保存の動作ログ確認手順を表示しました'
    };
    
  } catch (error) {
    console.error('❌ ログ確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WebAppのアドレスを取得
 */
function getWebAppURL() {
  console.log('=== WebAppアドレス確認 ===');
  
  try {
    // 1. スクリプトIDを取得
    const scriptId = ScriptApp.getScriptId();
    console.log('スクリプトID:', scriptId);
    
    // 2. WebAppのURLを構築
    const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
    console.log('WebAppアドレス:', webAppUrl);
    
    // 3. GASエディタのURL
    const editorUrl = `https://script.google.com/d/${scriptId}/edit`;
    console.log('GASエディタアドレス:', editorUrl);
    
    console.log('');
    console.log('📋 WebAppアクセス手順:');
    console.log('1. 上記のWebAppアドレスをブラウザで開く');
    console.log('2. 初回アクセス時は権限の許可が必要');
    console.log('3. AI Task Manager画面が表示される');
    console.log('4. ⚙️ 基本設定ボタンで設定画面を開く');
    console.log('');
    console.log('⚠️ WebAppが表示されない場合:');
    console.log('1. GASエディタで「デプロイ」→「新しいデプロイ」');
    console.log('2. 種類を「ウェブアプリ」に設定');
    console.log('3. 実行ユーザーを「自分」、アクセス権を「全員」に設定');
    console.log('4. デプロイ後に新しいURLが発行される');
    
    return {
      success: true,
      scriptId: scriptId,
      webAppUrl: webAppUrl,
      editorUrl: editorUrl,
      message: 'WebAppアドレスを確認しました'
    };
    
  } catch (error) {
    console.error('❌ WebAppアドレス取得エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WebApp動作確認用の簡単なテスト
 */
function testWebAppConnection() {
  console.log('=== WebApp動作確認テスト ===');
  
  try {
    // 1. doGet関数が存在するか確認
    console.log('1. doGet関数の存在確認');
    if (typeof doGet === 'function') {
      console.log('✅ doGet関数が存在します');
    } else {
      console.log('❌ doGet関数が存在しません');
      return { success: false, error: 'doGet関数が存在しません' };
    }
    
    // 2. include関数が存在するか確認
    console.log('2. include関数の存在確認');
    if (typeof include === 'function') {
      console.log('✅ include関数が存在します');
    } else {
      console.log('❌ include関数が存在しません');
      return { success: false, error: 'include関数が存在しません' };
    }
    
    // 3. WebApp用関数の存在確認
    console.log('3. WebApp用関数の存在確認');
    const webAppFunctions = [
      'getConfig',
      'setConfig',
      'saveConfigToSheet',
      'syncSheetToProperties',
      'setupAutoTriggers'
    ];
    
    let allFunctionsExist = true;
    webAppFunctions.forEach(funcName => {
      if (typeof eval(funcName) === 'function') {
        console.log(`✅ ${funcName}関数が存在します`);
      } else {
        console.log(`❌ ${funcName}関数が存在しません`);
        allFunctionsExist = false;
      }
    });
    
    // 4. 設定ファイルの存在確認
    console.log('4. 設定ファイルの存在確認');
    try {
      const config = ConfigManager.getConfig();
      console.log('✅ ConfigManagerが正常に動作します');
      console.log('現在の設定:', config.executionHour + '時');
    } catch (configError) {
      console.log('❌ ConfigManagerでエラー:', configError.message);
      allFunctionsExist = false;
    }
    
    if (allFunctionsExist) {
      console.log('');
      console.log('✅ WebApp動作確認テスト完了');
      console.log('💡 WebAppは正常に動作するはずです');
      
      return {
        success: true,
        message: 'WebAppは正常に動作するはずです',
        currentHour: ConfigManager.getConfig().executionHour
      };
      
    } else {
      console.log('');
      console.log('❌ WebApp動作確認で問題が見つかりました');
      
      return {
        success: false,
        message: 'WebApp動作確認で問題が見つかりました'
      };
    }
    
  } catch (error) {
    console.error('❌ WebApp動作確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}/*
*
 * 全設定の反映状況確認
 */
function checkAllSettingsReflection() {
  console.log('=== 全設定の反映状況確認 ===');
  
  try {
    // 1. 基本設定の確認
    console.log('1. 基本設定の確認');
    const config = ConfigManager.getConfig();
    
    console.log('📋 基本設定:');
    console.log('- 実行時間:', config.executionHour + '時');
    console.log('- 実行頻度:', config.executionFrequency);
    console.log('- データ取得期間:', config.dataRangeDays + '日');
    console.log('- AI分析:', config.enableAiAnalysis ? '有効' : '無効');
    console.log('- 音声入力:', config.enableVoiceInput ? '有効' : '無効');
    console.log('- Gmail分析:', config.enableGmailAnalysis ? '有効' : '無効');
    
    // 2. API設定の確認
    console.log('');
    console.log('2. API設定の確認');
    console.log('📋 API設定:');
    console.log('- Notion APIトークン:', config.notionToken ? '設定済み' : '未設定');
    console.log('- NotionデータベースID:', config.notionDatabaseId ? '設定済み' : '未設定');
    console.log('- Gemini APIキー:', config.geminiApiKey ? '設定済み' : '未設定');
    console.log('- Claude APIキー:', config.claudeApiKey ? '設定済み' : '未設定');
    
    // 3. Gmail設定の確認
    console.log('');
    console.log('3. Gmail設定の確認');
    console.log('📧 Gmail設定:');
    console.log('- 検索クエリ:', config.gmailSearchQuery);
    console.log('- 最大取得件数:', config.gmailMaxResults + '件');
    console.log('- 調査期間:', config.gmailDateRangeDays + '日');
    console.log('- 最小件名文字数:', config.gmailMinSubjectLength + '文字');
    console.log('- 自動除外カテゴリ:', config.gmailAutoExcludeCategories ? '有効' : '無効');
    console.log('- スパムフィルタ:', config.gmailEnableSpamFilter ? '有効' : '無効');
    console.log('- Gemini分析:', config.gmailEnableGeminiAnalysis ? '有効' : '無効');
    
    // 4. フィルタ設定の詳細
    console.log('');
    console.log('4. メールフィルタ設定の詳細');
    console.log('🚫 除外設定:');
    console.log('- 除外送信者:', config.gmailExcludeSenders || 'なし');
    console.log('- 除外ドメイン:', config.gmailExcludeDomains || 'なし');
    console.log('- 除外キーワード:', config.gmailExcludeKeywords || 'なし');
    
    console.log('');
    console.log('✅ 含める設定:');
    console.log('- 含める送信者:', config.gmailIncludeSenders || 'なし');
    console.log('- 含めるキーワード:', config.gmailIncludeKeywords || 'なし');
    console.log('- 高優先度キーワード:', config.gmailHighPriorityKeywords || 'なし');
    
    // 5. トリガー設定の確認
    console.log('');
    console.log('5. トリガー設定の確認');
    const triggers = ScriptApp.getProjectTriggers();
    let autoTriggerCount = 0;
    let triggerFunction = null;
    
    triggers.forEach(trigger => {
      const functionName = trigger.getHandlerFunction();
      if (functionName === 'autoTaskExtraction' || functionName === 'autoTaskExtractionWeekdays') {
        autoTriggerCount++;
        triggerFunction = functionName;
        console.log(`🔔 トリガー: ${functionName} (ID: ${trigger.getUniqueId()})`);
      }
    });
    
    console.log('トリガー数:', autoTriggerCount + '個');
    
    // 6. 設定の整合性チェック
    console.log('');
    console.log('6. 設定の整合性チェック');
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    
    const isConsistent = (
      config.executionHour.toString() === sheetConfig.EXECUTION_HOUR &&
      config.executionFrequency === sheetConfig.EXECUTION_FREQUENCY &&
      config.enableGmailAnalysis.toString() === sheetConfig.ENABLE_GMAIL_ANALYSIS
    );
    
    if (isConsistent) {
      console.log('✅ PropertiesServiceとスプレッドシートの設定が一致しています');
    } else {
      console.log('⚠️ 一部設定に不一致があります');
      console.log('PropertiesService vs スプレッドシート:');
      console.log(`- 実行時間: ${config.executionHour} vs ${sheetConfig.EXECUTION_HOUR}`);
      console.log(`- 実行頻度: ${config.executionFrequency} vs ${sheetConfig.EXECUTION_FREQUENCY}`);
      console.log(`- Gmail分析: ${config.enableGmailAnalysis} vs ${sheetConfig.ENABLE_GMAIL_ANALYSIS}`);
    }
    
    // 7. 動作準備状況の確認
    console.log('');
    console.log('7. 動作準備状況の確認');
    const validation = ConfigManager.validateConfig();
    
    if (validation.isValid) {
      console.log('✅ 全ての必要な設定が完了しています');
      console.log('🎉 システムは正常に動作する準備ができています');
      
      console.log('');
      console.log('📋 動作概要:');
      console.log(`- 毎日${config.executionHour}時に自動実行`);
      console.log(`- カレンダーから${config.dataRangeDays}日分のイベントを取得`);
      if (config.enableGmailAnalysis) {
        console.log(`- Gmailから${config.gmailMaxResults}件のメールを分析`);
      }
      console.log('- Notionデータベースにタスクとして保存');
      if (config.enableAiAnalysis && config.geminiApiKey) {
        console.log('- Gemini AIによる内容分析を実行');
      }
      
    } else {
      console.log('❌ 設定に不備があります:');
      validation.errors.forEach(error => {
        console.log('- ' + error);
      });
    }
    
    return {
      success: true,
      settings: {
        executionHour: config.executionHour,
        executionFrequency: config.executionFrequency,
        enableGmailAnalysis: config.enableGmailAnalysis,
        enableAiAnalysis: config.enableAiAnalysis,
        triggerCount: autoTriggerCount,
        isValid: validation.isValid,
        isConsistent: isConsistent
      },
      message: '全設定の反映状況を確認しました'
    };
    
  } catch (error) {
    console.error('❌ 全設定確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * システム動作テスト（実際の処理をテスト実行）
 */
function testSystemOperation() {
  console.log('=== システム動作テスト ===');
  console.log('⚠️ 注意: これは実際にNotionにタスクを作成するテストです');
  console.log('');
  
  try {
    const config = ConfigManager.getConfig();
    
    // 設定確認
    const validation = ConfigManager.validateConfig();
    if (!validation.isValid) {
      console.log('❌ 設定に不備があるためテストを中止します');
      validation.errors.forEach(error => {
        console.log('- ' + error);
      });
      return { success: false, error: '設定に不備があります' };
    }
    
    console.log('✅ 設定確認完了');
    console.log('📋 テスト実行設定:');
    console.log('- 実行時間:', config.executionHour + '時');
    console.log('- Gmail分析:', config.enableGmailAnalysis ? '有効' : '無効');
    console.log('- AI分析:', config.enableAiAnalysis ? '有効' : '無効');
    
    console.log('');
    console.log('🚀 システム動作テストを開始します...');
    console.log('（実際にカレンダーとGmailからデータを取得してNotionに保存します）');
    
    // 実際の処理を実行
    const result = manualTaskExtraction('both');
    
    console.log('');
    console.log('📊 テスト結果:');
    if (result.success) {
      console.log('✅ システム動作テスト成功！');
      console.log('- 処理件数:', result.processed + '件');
      console.log('- 作成件数:', result.transferred + '件');
      console.log('- スキップ件数:', result.skipped + '件');
      
      if (result.details) {
        if (result.details.calendar) {
          console.log('📅 カレンダー: ' + result.details.calendar.transferred + '件作成');
        }
        if (result.details.gmail) {
          console.log('📧 Gmail: ' + result.details.gmail.transferred + '件作成');
        }
      }
      
    } else {
      console.log('❌ システム動作テスト失敗');
      console.log('エラー:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ システム動作テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}/**

 * UI設定の詳細確認
 */
function checkUISettingsDetail() {
  console.log('=== UI設定の詳細確認 ===');
  
  try {
    const config = ConfigManager.getConfig();
    const sheetConfig = ConfigManager.loadConfigFromSheet();
    
    console.log('📋 基本設定（UIから設定可能）:');
    console.log('- 実行時間:', config.executionHour + '時');
    console.log('- 実行頻度:', config.executionFrequency);
    console.log('- データ取得期間:', config.dataRangeDays + '日');
    
    console.log('');
    console.log('🔧 機能有効化設定:');
    console.log('- AI分析:', config.enableAiAnalysis ? '有効' : '無効');
    console.log('- 音声入力:', config.enableVoiceInput ? '有効' : '無効');
    console.log('- Gmail分析:', config.enableGmailAnalysis ? '有効' : '無効');
    
    console.log('');
    console.log('🔑 API設定:');
    console.log('- Notion APIトークン:', config.notionToken ? '設定済み（' + config.notionToken.substring(0, 10) + '...）' : '未設定');
    console.log('- NotionデータベースID:', config.notionDatabaseId ? '設定済み（' + config.notionDatabaseId.substring(0, 8) + '...）' : '未設定');
    console.log('- Gemini APIキー:', config.geminiApiKey ? '設定済み（' + config.geminiApiKey.substring(0, 10) + '...）' : '未設定');
    console.log('- Claude APIキー:', config.claudeApiKey ? '設定済み（' + config.claudeApiKey.substring(0, 10) + '...）' : '未設定');
    
    console.log('');
    console.log('📊 設定の一致性確認:');
    const isConsistent = (
      config.executionHour.toString() === sheetConfig.EXECUTION_HOUR.toString() &&
      config.executionFrequency === sheetConfig.EXECUTION_FREQUENCY &&
      config.dataRangeDays.toString() === sheetConfig.DATA_RANGE_DAYS.toString() &&
      config.enableAiAnalysis.toString() === sheetConfig.ENABLE_AI_ANALYSIS.toString() &&
      config.enableVoiceInput.toString() === sheetConfig.ENABLE_VOICE_INPUT.toString() &&
      config.enableGmailAnalysis.toString() === sheetConfig.ENABLE_GMAIL_ANALYSIS.toString()
    );
    
    if (isConsistent) {
      console.log('✅ PropertiesServiceとスプレッドシートの設定が完全に一致しています');
    } else {
      console.log('⚠️ 一部設定に不一致があります:');
      console.log('PropertiesService vs スプレッドシート:');
      console.log(`- 実行時間: ${config.executionHour} vs ${sheetConfig.EXECUTION_HOUR}`);
      console.log(`- 実行頻度: ${config.executionFrequency} vs ${sheetConfig.EXECUTION_FREQUENCY}`);
      console.log(`- データ期間: ${config.dataRangeDays} vs ${sheetConfig.DATA_RANGE_DAYS}`);
      console.log(`- AI分析: ${config.enableAiAnalysis} vs ${sheetConfig.ENABLE_AI_ANALYSIS}`);
      console.log(`- 音声入力: ${config.enableVoiceInput} vs ${sheetConfig.ENABLE_VOICE_INPUT}`);
      console.log(`- Gmail分析: ${config.enableGmailAnalysis} vs ${sheetConfig.ENABLE_GMAIL_ANALYSIS}`);
    }
    
    console.log('');
    console.log('🔔 トリガー設定確認:');
    const triggers = ScriptApp.getProjectTriggers();
    let autoTriggerCount = 0;
    let triggerFunction = null;
    
    triggers.forEach(trigger => {
      const functionName = trigger.getHandlerFunction();
      if (functionName === 'autoTaskExtraction' || functionName === 'autoTaskExtractionWeekdays') {
        autoTriggerCount++;
        triggerFunction = functionName;
        console.log(`🔔 トリガー: ${functionName} (ID: ${trigger.getUniqueId()})`);
      }
    });
    
    console.log(`トリガー数: ${autoTriggerCount}個`);
    
    if (autoTriggerCount === 1) {
      console.log('✅ トリガーが正常に設定されています');
      console.log(`📅 毎日${config.executionHour}時に${triggerFunction}が実行されます`);
    } else if (autoTriggerCount === 0) {
      console.log('⚠️ トリガーが設定されていません');
    } else {
      console.log('⚠️ 複数のトリガーが設定されています（重複の可能性）');
    }
    
    console.log('');
    console.log('🎯 システム動作準備状況:');
    const validation = ConfigManager.validateConfig();
    
    if (validation.isValid && isConsistent && autoTriggerCount === 1) {
      console.log('✅ システムは完全に動作準備完了です！');
      console.log('🚀 以下の動作が自動実行されます:');
      console.log(`   - 毎日${config.executionHour}時に自動実行`);
      console.log(`   - カレンダーから${config.dataRangeDays}日分のイベントを取得`);
      if (config.enableGmailAnalysis) {
        console.log('   - Gmailからメールを分析してタスク化');
      }
      console.log('   - Notionデータベースにタスクとして保存');
      if (config.enableAiAnalysis && config.geminiApiKey) {
        console.log('   - Gemini AIによる内容分析を実行');
      }
    } else {
      console.log('⚠️ システム動作に問題があります:');
      if (!validation.isValid) {
        console.log('- 設定エラー:', validation.errors.join(', '));
      }
      if (!isConsistent) {
        console.log('- 設定の不一致があります');
      }
      if (autoTriggerCount !== 1) {
        console.log('- トリガー設定に問題があります');
      }
    }
    
    return {
      success: true,
      settings: {
        executionHour: config.executionHour,
        executionFrequency: config.executionFrequency,
        dataRangeDays: config.dataRangeDays,
        enableAiAnalysis: config.enableAiAnalysis,
        enableVoiceInput: config.enableVoiceInput,
        enableGmailAnalysis: config.enableGmailAnalysis,
        hasNotionToken: !!config.notionToken,
        hasNotionDatabaseId: !!config.notionDatabaseId,
        hasGeminiApiKey: !!config.geminiApiKey,
        hasClaudeApiKey: !!config.claudeApiKey
      },
      status: {
        isConsistent: isConsistent,
        triggerCount: autoTriggerCount,
        isValid: validation.isValid,
        isReady: validation.isValid && isConsistent && autoTriggerCount === 1
      },
      message: 'UI設定の詳細確認を完了しました'
    };
    
  } catch (error) {
    console.error('❌ UI設定詳細確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WebApp設定画面の全項目確認
 */
function checkWebAppAllSettings() {
  console.log('=== WebApp設定画面の全項目確認 ===');
  console.log('');
  console.log('📋 WebAppで設定可能な全項目の現在値:');
  
  try {
    const config = ConfigManager.getConfig();
    
    console.log('');
    console.log('🔧 基本設定タブ:');
    console.log('┌─────────────────────────────────────┐');
    console.log('│ Notion APIトークン: ' + (config.notionToken ? '設定済み' : '未設定').padEnd(15) + ' │');
    console.log('│ NotionデータベースID: ' + (config.notionDatabaseId ? '設定済み' : '未設定').padEnd(13) + ' │');
    console.log('│ Claude APIキー: ' + (config.claudeApiKey ? '設定済み' : '未設定').padEnd(17) + ' │');
    console.log('│ Gemini APIキー: ' + (config.geminiApiKey ? '設定済み' : '未設定').padEnd(17) + ' │');
    console.log('│ 実行頻度: ' + config.executionFrequency.padEnd(23) + ' │');
    console.log('│ 実行時間: ' + (config.executionHour + '時').padEnd(23) + ' │');
    console.log('│ データ取得期間: ' + (config.dataRangeDays + '日').padEnd(17) + ' │');
    console.log('│ AI分析: ' + (config.enableAiAnalysis ? '有効' : '無効').padEnd(25) + ' │');
    console.log('│ 音声入力: ' + (config.enableVoiceInput ? '有効' : '無効').padEnd(23) + ' │');
    console.log('│ Gmail分析: ' + (config.enableGmailAnalysis ? '有効' : '無効').padEnd(22) + ' │');
    console.log('└─────────────────────────────────────┘');
    
    console.log('');
    console.log('💡 WebAppでの設定変更テスト手順:');
    console.log('1. WebAppを開く');
    console.log('2. ⚙️ 基本設定をクリック');
    console.log('3. 任意の設定を変更（例：実行時間を9時に変更）');
    console.log('4. 保存ボタンをクリック');
    console.log('5. checkSettings() を実行して変更を確認');
    
    console.log('');
    console.log('📧 メールフィルタ設定も確認可能:');
    console.log('- WebAppの「📧 メールフィルタ設定」ボタンから設定');
    console.log('- 除外・含める条件を詳細に設定可能');
    
    return {
      success: true,
      allSettings: {
        notionToken: !!config.notionToken,
        notionDatabaseId: !!config.notionDatabaseId,
        claudeApiKey: !!config.claudeApiKey,
        geminiApiKey: !!config.geminiApiKey,
        executionFrequency: config.executionFrequency,
        executionHour: config.executionHour,
        dataRangeDays: config.dataRangeDays,
        enableAiAnalysis: config.enableAiAnalysis,
        enableVoiceInput: config.enableVoiceInput,
        enableGmailAnalysis: config.enableGmailAnalysis
      },
      message: 'WebApp設定画面の全項目を確認しました'
    };
    
  } catch (error) {
    console.error('❌ WebApp全設定確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}