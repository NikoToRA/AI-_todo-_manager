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