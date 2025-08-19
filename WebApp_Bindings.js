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