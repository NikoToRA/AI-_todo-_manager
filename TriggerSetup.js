/**
 * 定期実行トリガー設定
 * 要件8.1対応: 自動実行スケジュール管理
 */

/**
 * 自動実行トリガーをセットアップ
 */
function setupAutoTriggers() {
  try {
    console.log('[setupAutoTriggers] トリガーセットアップ開始');
    
    // 既存のトリガーを削除
    deleteAllTriggers();
    
    const config = ConfigManager.getConfig();
    const frequency = config.executionFrequency || 'daily';
    
    console.log(`[setupAutoTriggers] 実行頻度: ${frequency}`);
    
    switch (frequency) {
      case 'daily':
        createDailyTrigger();
        break;
      case 'weekdays':
        createWeekdaysTrigger();
        break;
      case 'weekly':
        createWeeklyTrigger();
        break;
      default:
        throw new Error(`不明な実行頻度: ${frequency}`);
    }
    
    console.log('[setupAutoTriggers] トリガーセットアップ完了');
    return {
      success: true,
      message: `${frequency}の自動実行トリガーを設定しました`
    };
    
  } catch (error) {
    console.error(`[setupAutoTriggers] エラー: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 毎日実行トリガーを作成
 */
function createDailyTrigger() {
  const config = ConfigManager.getConfig();
  const hour = config.executionHour || 8;
  
  ScriptApp.newTrigger('autoTaskExtraction')
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .create();
    
  console.log(`[createDailyTrigger] 毎日${hour}時の自動実行トリガーを作成`);
}

/**
 * 平日のみ実行トリガーを作成（設定画面対応：1日1回実行）
 */
function createWeekdaysTrigger() {
  const config = ConfigManager.getConfig();
  const hour = config.executionHour || 8;
  
  console.log(`[createWeekdaysTrigger] 設定時間: ${hour}時`);
  
  // 平日判定付きの1日1回実行トリガーを作成
  ScriptApp.newTrigger('autoTaskExtractionWeekdays')
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .create();
  
  console.log(`[createWeekdaysTrigger] 平日判定付き1日1回${hour}時の自動実行トリガーを作成`);
}

/**
 * 平日のみ実行する自動タスク抽出（平日判定付き）
 */
function autoTaskExtractionWeekdays() {
  console.log('[autoTaskExtractionWeekdays] 平日判定付き自動実行開始');
  
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    console.log(`[autoTaskExtractionWeekdays] 現在の曜日: ${dayOfWeek} (0=日, 1=月, ..., 6=土)`);
    
    // 平日判定（月曜日=1 から 金曜日=5）
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      console.log('[autoTaskExtractionWeekdays] 平日のため実行します');
      return autoTaskExtraction();
    } else {
      console.log('[autoTaskExtractionWeekdays] 休日のためスキップします');
      return {
        success: true,
        message: '休日のため実行をスキップしました',
        skipped: true,
        dayOfWeek: dayOfWeek
      };
    }
    
  } catch (error) {
    console.error('[autoTaskExtractionWeekdays] エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 週1回実行トリガーを作成
 */
function createWeeklyTrigger() {
  const config = ConfigManager.getConfig();
  const hour = config.executionHour || 8;
  
  ScriptApp.newTrigger('autoTaskExtraction')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(hour)
    .create();
    
  console.log(`[createWeeklyTrigger] 毎週月曜日${hour}時の自動実行トリガーを作成`);
}

/**
 * 全てのトリガーを削除（修正版：関連する全トリガーを削除）
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
 * 現在のトリガー情報を取得
 */
function getTriggerInfo() {
  try {
    const triggers = ScriptApp.getProjectTriggers()
      .filter(trigger => trigger.getHandlerFunction() === 'autoTaskExtraction');
    
    const triggerInfo = triggers.map(trigger => {
      const eventType = trigger.getEventType();
      let schedule = '';
      
      if (eventType === ScriptApp.EventType.CLOCK) {
        if (trigger.getTriggerSource() === ScriptApp.TriggerSource.CLOCK) {
          // 時間ベーストリガー
          schedule = '時間ベース';
        }
      }
      
      return {
        id: trigger.getUniqueId(),
        function: trigger.getHandlerFunction(),
        type: eventType.toString(),
        schedule: schedule,
        enabled: trigger.isEnabled ? trigger.isEnabled() : true
      };
    });
    
    console.log('[getTriggerInfo] 現在のトリガー情報:', triggerInfo);
    
    return {
      success: true,
      triggers: triggerInfo,
      count: triggerInfo.length
    };
    
  } catch (error) {
    console.error(`[getTriggerInfo] エラー: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * トリガーの動作テスト
 */
function testTriggerExecution() {
  try {
    console.log('[testTriggerExecution] トリガー動作テスト開始');
    
    // 実際にautoTaskExtraction関数を呼び出してテスト
    autoTaskExtraction();
    
    console.log('[testTriggerExecution] トリガー動作テスト完了');
    return {
      success: true,
      message: 'トリガー関数が正常に動作しました'
    };
    
  } catch (error) {
    console.error(`[testTriggerExecution] エラー: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 手動でトリガーを実行（テスト用）
 */
function manualTriggerTest() {
  console.log('[manualTriggerTest] 手動トリガーテスト開始');
  
  try {
    // 自動実行をシミュレート
    const result = autoTaskExtraction();
    
    console.log('[manualTriggerTest] 手動トリガーテスト完了');
    return {
      success: true,
      message: '手動トリガーテストが完了しました',
      result: result
    };
    
  } catch (error) {
    console.error(`[manualTriggerTest] エラー: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * トリガー設定の完全リセット
 */
function resetTriggers() {
  try {
    console.log('[resetTriggers] トリガーリセット開始');
    
    // 全削除
    deleteAllTriggers();
    
    // 新規セットアップ
    const result = setupAutoTriggers();
    
    console.log('[resetTriggers] トリガーリセット完了');
    return result;
    
  } catch (error) {
    console.error(`[resetTriggers] エラー: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 緊急対応：重複実行問題の解決
 */
function emergencyFixDuplicateExecution() {
  console.log('=== 緊急対応：重複実行問題の解決 ===');
  
  try {
    // 1. 現在のトリガー状況確認
    console.log('1. 現在のトリガー状況確認');
    const triggers = ScriptApp.getProjectTriggers();
    console.log(`現在のトリガー数: ${triggers.length}`);
    
    let autoTaskTriggers = 0;
    triggers.forEach((trigger, index) => {
      const functionName = trigger.getHandlerFunction();
      console.log(`${index + 1}. 関数: ${functionName}, ID: ${trigger.getUniqueId()}`);
      
      if (functionName === 'autoTaskExtraction' || functionName === 'autoTaskExtractionWeekdays') {
        autoTaskTriggers++;
      }
    });
    
    console.log(`自動実行関連トリガー数: ${autoTaskTriggers}`);
    
    // 2. 全削除
    console.log('2. 関連トリガーを全削除');
    deleteAllTriggers();
    
    // 3. 1つだけ再設定
    console.log('3. 新しいトリガーを1つだけ設定');
    const config = ConfigManager.getConfig();
    const frequency = config.executionFrequency || 'daily';
    const hour = config.executionHour || 8;
    
    if (frequency === 'weekdays') {
      ScriptApp.newTrigger('autoTaskExtractionWeekdays')
        .timeBased()
        .everyDays(1)
        .atHour(hour)
        .create();
      console.log(`平日判定付き毎日${hour}時のトリガーを設定`);
    } else {
      ScriptApp.newTrigger('autoTaskExtraction')
        .timeBased()
        .everyDays(1)
        .atHour(hour)
        .create();
      console.log(`毎日${hour}時のトリガーを設定`);
    }
    
    // 4. 処理済みメール管理の古いデータをクリーンアップ
    console.log('4. 処理済みメール管理のクリーンアップ');
    ProcessedEmailTracker.cleanupOldRecords(7); // 7日以上前のデータを削除
    
    console.log('✅ 緊急対応完了');
    return {
      success: true,
      message: '重複実行問題を解決しました',
      previousTriggers: autoTaskTriggers,
      newTriggers: 1
    };
    
  } catch (error) {
    console.error('❌ 緊急対応エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * トリガー状況の詳細確認
 */
function checkTriggerDetails() {
  console.log('=== トリガー詳細確認 ===');
  
  try {
    const triggers = ScriptApp.getProjectTriggers();
    console.log(`総トリガー数: ${triggers.length}`);
    
    const autoTaskTriggers = [];
    const otherTriggers = [];
    
    triggers.forEach(trigger => {
      const functionName = trigger.getHandlerFunction();
      const triggerInfo = {
        id: trigger.getUniqueId(),
        function: functionName,
        source: trigger.getTriggerSource().toString(),
        eventType: trigger.getEventType().toString()
      };
      
      if (functionName === 'autoTaskExtraction' || functionName === 'autoTaskExtractionWeekdays') {
        autoTaskTriggers.push(triggerInfo);
      } else {
        otherTriggers.push(triggerInfo);
      }
    });
    
    console.log(`自動実行関連トリガー: ${autoTaskTriggers.length}個`);
    autoTaskTriggers.forEach((trigger, index) => {
      console.log(`  ${index + 1}. ${trigger.function} (${trigger.id})`);
    });
    
    console.log(`その他のトリガー: ${otherTriggers.length}個`);
    otherTriggers.forEach((trigger, index) => {
      console.log(`  ${index + 1}. ${trigger.function} (${trigger.id})`);
    });
    
    return {
      total: triggers.length,
      autoTask: autoTaskTriggers.length,
      other: otherTriggers.length,
      details: {
        autoTask: autoTaskTriggers,
        other: otherTriggers
      }
    };
    
  } catch (error) {
    console.error('❌ トリガー確認エラー:', error.message);
    return { error: error.message };
  }
}

/**
 * トリガー管理の統合関数
 */
function manageTriggers(action) {
  switch (action) {
    case 'setup':
      return setupAutoTriggers();
    case 'delete':
      deleteAllTriggers();
      return { success: true, message: 'トリガーを削除しました' };
    case 'info':
      return getTriggerInfo();
    case 'test':
      return testTriggerExecution();
    case 'reset':
      return resetTriggers();
    case 'emergency':
      return emergencyFixDuplicateExecution();
    case 'details':
      return checkTriggerDetails();
    default:
      return {
        success: false,
        error: '不明なアクション: ' + action + '。利用可能: setup, delete, info, test, reset, emergency, details'
      };
  }
}