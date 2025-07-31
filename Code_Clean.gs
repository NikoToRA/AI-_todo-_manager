/**
 * AI駆動タスク管理システム - メインエントリーポイント（整理版）
 * 要件1.1対応: 多様な入力方法によるタスク整理
 */

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
    const triggers = ScriptApp.getProjectTriggers();
    let autoTaskTriggers = 0;
    
    triggers.forEach(trigger => {
      const functionName = trigger.getHandlerFunction();
      if (functionName === 'autoTaskExtraction' || functionName === 'autoTaskExtractionWeekdays') {
        autoTaskTriggers++;
      }
    });
    
    return {
      success: true,
      count: autoTaskTriggers,
      message: `${autoTaskTriggers}個のトリガーが設定されています`
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
 * 手動実行エントリーポイント
 */
function manualTaskExtraction(source = 'calendar', options = {}) {
  try {
    console.log('[manualTaskExtraction] 開始: source=' + source);
    
    var config = ConfigManager.getConfig();
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    var result;
    
    if (source === 'calendar') {
      result = transferCalendarEvents();
    } else if (source === 'gmail') {
      result = transferGmailMessages();
    } else if (source === 'both') {
      var calendarResult = transferCalendarEvents();
      var gmailResult = transferGmailMessages();
      
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
        } else {
          results.errors.push('Gmail: ' + results.gmail.error);
        }
      } catch (error) {
        console.error('[autoTaskExtraction] Gmail処理エラー:', error.message);
        results.errors.push('Gmail: ' + error.message);
      }
    }
    
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
 * 簡単な設定確認関数
 */
function checkSettings() {
  console.log('=== 設定確認 ===');
  
  try {
    const config = ConfigManager.getConfig();
    console.log('現在の設定:');
    console.log('- 実行時間:', config.executionHour + '時');
    console.log('- 実行頻度:', config.executionFrequency);
    console.log('- Gmail分析:', config.enableGmailAnalysis ? '有効' : '無効');
    console.log('- AI分析:', config.enableAiAnalysis ? '有効' : '無効');
    
    const validation = ConfigManager.validateConfig();
    if (validation.isValid) {
      console.log('✅ 設定は正常です');
    } else {
      console.log('❌ 設定エラー:', validation.errors.join(', '));
    }
    
    return {
      success: true,
      settings: {
        executionHour: config.executionHour,
        executionFrequency: config.executionFrequency,
        enableGmailAnalysis: config.enableGmailAnalysis,
        enableAiAnalysis: config.enableAiAnalysis
      },
      isValid: validation.isValid
    };
    
  } catch (error) {
    console.error('❌ 設定確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}