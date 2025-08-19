/**
 * WebアプリUI用の統合関数群
 */

/**
 * カレンダーイベントをタスク転送（WebApp用）
 */
function transferCalendarEvents() {
  console.log('[WebApp] transferCalendarEvents 開始');
  
  try {
    var tasks = runCalendarOnly();
    var createdCount = countCreatedTasks(tasks);
    var skippedCount = countSkippedTasks(tasks);
    
    var result = {
      success: true,
      processed: tasks.length,
      transferred: createdCount,
      skipped: skippedCount,
      errors: [],
      tasks: tasks
    };
    
    console.log('[WebApp] transferCalendarEvents 完了:', result);
    return result;
    
  } catch (error) {
    console.error('[WebApp] transferCalendarEvents エラー:', error.message);
    return {
      success: false,
      processed: 0,
      transferred: 0,
      skipped: 0,
      errors: [error.message]
    };
  }
}

/**
 * Gmailメッセージをタスク転送（WebApp用）
 */
function transferGmailMessages() {
  console.log('[WebApp] transferGmailMessages 開始');
  
  try {
    var tasks = runGmailOnly();
    var createdCount = countCreatedTasks(tasks);
    var skippedCount = countSkippedTasks(tasks);
    
    var result = {
      success: true,
      processed: tasks.length,
      transferred: createdCount,
      skipped: skippedCount,
      errors: [],
      tasks: tasks
    };
    
    console.log('[WebApp] transferGmailMessages 完了:', result);
    return result;
    
  } catch (error) {
    console.error('[WebApp] transferGmailMessages エラー:', error.message);
    return {
      success: false,
      processed: 0,
      transferred: 0,
      skipped: 0,
      errors: [error.message]
    };
  }
}

/**
 * 音声入力からタスク作成（WebApp用）
 */
function processVoiceInput(voiceText) {
  console.log('[WebApp] processVoiceInput 開始:', voiceText);
  
  try {
    if (!voiceText || voiceText.trim().length === 0) {
      throw new Error('音声入力が空です');
    }
    
    // 音声テキストから簡単なタスクを生成
    var taskData = {
      title: voiceText.trim(),
      type: 'task',
      priority: '中',
      source: 'voice',
      status: '未着手',
      created_by: 'voice_input',
      context: '音声入力で作成されたタスク'
    };
    
    var config = ConfigManager.getConfig();
    var result = createNotionTask(config, taskData);
    
    if (result && result.success) {
      console.log('[WebApp] 音声タスク作成成功:', taskData.title);
      return {
        success: true,
        task: taskData,
        notionUrl: result.url
      };
    } else {
      throw new Error(result ? result.error : '不明なエラー');
    }
    
  } catch (error) {
    console.error('[WebApp] processVoiceInput エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 手動でフル実行（WebApp用）
 */
function runFullTaskExtraction() {
  console.log('[WebApp] runFullTaskExtraction 開始');
  
  try {
    var result = runTaskExtraction();
    
    // 戻り値の形式を統一
    return {
      success: result.success,
      processed: result.results ? 
        (result.results.calendarTasks.length + result.results.gmailTasks.length) : 0,
      transferred: result.results ? result.results.totalCreated : 0,
      skipped: result.results ? result.results.totalSkipped : 0,
      errors: result.results ? result.results.errors : [],
      details: result.results
    };
    
  } catch (error) {
    console.error('[WebApp] runFullTaskExtraction エラー:', error.message);
    return {
      success: false,
      processed: 0,
      transferred: 0,
      skipped: 0,
      errors: [error.message]
    };
  }
}

/**
 * 自動実行トリガーのセットアップ（WebApp用）
 */
function setupTriggers() {
  console.log('[WebApp] setupTriggers 開始');
  
  try {
    var result = setupAutoTriggers();
    console.log('[WebApp] setupTriggers 完了:', result);
    return result;
    
  } catch (error) {
    console.error('[WebApp] setupTriggers エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * トリガー状況確認（WebApp用）
 */
function checkTriggers() {
  console.log('[WebApp] checkTriggers 開始');
  
  try {
    var result = getTriggerInfo();
    console.log('[WebApp] checkTriggers 完了:', result);
    return result;
    
  } catch (error) {
    console.error('[WebApp] checkTriggers エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 設定テスト実行（WebApp用）
 */
function testSettings() {
  console.log('[WebApp] testSettings 開始');
  
  try {
    var systemStatus = checkSystemStatus();
    var config = ConfigManager.getConfig();
    
    var result = {
      success: systemStatus,
      config: {
        notionToken: config.notionToken ? '設定済み' : '未設定',
        notionDatabaseId: config.notionDatabaseId ? '設定済み' : '未設定',
        geminiApiKey: config.geminiApiKey ? '設定済み' : '未設定'
      },
      systemStatus: systemStatus
    };
    
    console.log('[WebApp] testSettings 完了:', result);
    return result;
    
  } catch (error) {
    console.error('[WebApp] testSettings エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 緊急タスク作成（WebApp用）
 */
function createEmergencyTaskForWebApp(title, priority) {
  console.log('[WebApp] createEmergencyTaskForWebApp 開始');
  
  try {
    var result = createEmergencyTask(title, priority);
    
    return {
      success: result,
      message: result ? '緊急タスクを作成しました' : 'タスク作成に失敗しました'
    };
    
  } catch (error) {
    console.error('[WebApp] createEmergencyTaskForWebApp エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}