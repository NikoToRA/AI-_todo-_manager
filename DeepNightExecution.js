/**
 * 深夜実行システム（2-4時の確実実行）
 * ロボットマークなし発見 → Notionタスク登録 → ロボットマーク追加
 */

/**
 * 深夜実行のメイン関数（トリガー用）
 */
function deepNightExecution() {
  console.log('=== 🌙 深夜実行システム開始 (' + new Date().toLocaleString('ja-JP') + ') ===');
  
  var startTime = new Date().getTime();
  var executionId = 'NIGHT_' + new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
  
  try {
    // 深夜時間帯チェック（安全確認）
    var currentHour = new Date().getHours();
    if (currentHour < 2 || currentHour >= 4) {
      console.log('⚠️ 深夜時間帯外での実行 (現在' + currentHour + '時) - 続行');
    } else {
      console.log('✅ 深夜時間帯での実行 (' + currentHour + '時) - 最適');
    }
    
    // 1. システム準備
    var preparation = prepareDeepNightExecution(executionId);
    if (!preparation.success) {
      return finishDeepNightExecution(executionId, false, preparation.error);
    }
    
    // 2. ユーザー設定の日数取得
    var config = ConfigManager.getConfig();
    var dayRange = config.defaultDayRange || 7;
    console.log('📅 処理対象期間: ' + dayRange + '日間');
    
    // 3. 確実なカレンダースキャン → タスク作成 → ロボットマーク追加
    var result = performReliableCalendarProcessing(dayRange, executionId);
    
    // 4. 実行後検証
    var verification = verifyExecutionResults(result, dayRange);
    
    // 5. 結果まとめ
    var finalResult = {
      executionId: executionId,
      success: result.success && verification.passed,
      stats: result.stats,
      verification: verification,
      executionTime: new Date().getTime() - startTime,
      timestamp: new Date().toISOString()
    };
    
    finishDeepNightExecution(executionId, finalResult.success, finalResult);
    
    console.log('\n=== 🌙 深夜実行完了 ===');
    console.log('📊 結果: ' + (finalResult.success ? '✅ 成功' : '❌ 失敗'));
    console.log('⏱️ 実行時間: ' + Math.round(finalResult.executionTime / 1000) + '秒');
    
    return finalResult;
    
  } catch (error) {
    console.error('❌ 深夜実行エラー:', error.message);
    console.error(error.stack);
    
    finishDeepNightExecution(executionId, false, {
      error: error.message,
      executionTime: new Date().getTime() - startTime
    });
    
    return {
      executionId: executionId,
      success: false,
      error: error.message
    };
  }
}

/**
 * 深夜実行準備
 */
function prepareDeepNightExecution(executionId) {
  console.log('\n--- 🔧 深夜実行準備 ---');
  
  try {
    // 重複実行防止
    var runningFlag = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_RUNNING');
    if (runningFlag) {
      var startTime = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_START_TIME');
      var elapsed = new Date().getTime() - parseInt(startTime || 0);
      
      if (elapsed < 30 * 60 * 1000) { // 30分以内なら実行中
        return {
          success: false,
          error: '既に深夜実行が進行中です（' + Math.round(elapsed / 60000) + '分経過）'
        };
      } else {
        console.log('⚠️ 古い深夜実行フラグを検出 - リセットして続行');
      }
    }
    
    // 実行フラグ設定
    PropertiesService.getScriptProperties().setProperties({
      'DEEP_NIGHT_RUNNING': 'true',
      'DEEP_NIGHT_START_TIME': new Date().getTime().toString(),
      'DEEP_NIGHT_EXECUTION_ID': executionId
    });
    
    // 基本チェック
    try {
      CalendarApp.getAllCalendars();
      console.log('✅ カレンダー権限確認');
    } catch (error) {
      return {
        success: false,
        error: 'カレンダー権限エラー: ' + error.message
      };
    }
    
    try {
      var config = ConfigManager.getConfig();
      if (!config.notionToken || !config.notionDatabaseId) {
        return {
          success: false,
          error: 'Notion設定が不完全です'
        };
      }
      console.log('✅ Notion設定確認');
    } catch (error) {
      return {
        success: false,
        error: 'Notion設定エラー: ' + error.message
      };
    }
    
    console.log('✅ 深夜実行準備完了');
    return { success: true };
    
  } catch (error) {
    console.error('❌ 深夜実行準備エラー:', error.message);
    return {
      success: false,
      error: '準備エラー: ' + error.message
    };
  }
}

/**
 * 確実なカレンダー処理（スキャン→タスク作成→ロボットマーク）
 */
function performReliableCalendarProcessing(dayRange, executionId) {
  console.log('\n--- 📅 確実なカレンダー処理 ---');
  
  var result = {
    success: true,
    stats: {
      totalEvents: 0,
      unmarkedEvents: 0,
      processedEvents: 0,
      createdTasks: 0,
      markedEvents: 0,
      errors: 0,
      skippedEvents: 0
    },
    details: [],
    errors: []
  };
  
  try {
    var config = ConfigManager.getConfig();
    var taskExtractor = new TaskExtractor(config);
    var calendarUpdater = new CalendarEventUpdater();
    
    // 処理対象期間の計算
    var endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - dayRange + 1);
    startDate.setHours(0, 0, 0, 0);
    
    console.log('処理期間: ' + startDate.toLocaleDateString('ja-JP') + ' ～ ' + endDate.toLocaleDateString('ja-JP'));
    
    // 全カレンダーからイベント取得
    var calendars = CalendarApp.getAllCalendars();
    console.log('対象カレンダー: ' + calendars.length + '個');
    
    var allEvents = [];
    
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      try {
        var events = calendar.getEvents(startDate, endDate);
        if (events.length > 0) {
          console.log('📋 "' + calendar.getName() + '": ' + events.length + '件');
          allEvents = allEvents.concat(events);
        }
      } catch (error) {
        console.warn('⚠️ カレンダー"' + calendar.getName() + '"でエラー: ' + error.message);
        result.errors.push('カレンダー取得エラー: ' + calendar.getName());
        result.stats.errors++;
      }
    }
    
    result.stats.totalEvents = allEvents.length;
    console.log('📊 総イベント数: ' + allEvents.length + '件');
    
    if (allEvents.length === 0) {
      console.log('⚪ 処理対象イベントなし');
      return result;
    }
    
    // 各イベントを確実に処理: ロボットマークチェック → タスク作成 → ロボットマーク追加
    for (var j = 0; j < allEvents.length; j++) {
      var event = allEvents[j];
      var eventTitle = event.getTitle();
      
      console.log('\n[' + (j + 1) + '/' + allEvents.length + '] 処理中: "' + eventTitle + '"');
      
      try {
        // STEP 1: ロボットマークチェック
        if (calendarUpdater.isEventProcessed(event)) {
          console.log('✅ スキップ（🤖マーク済み）');
          result.stats.skippedEvents++;
          continue;
        }
        
        result.stats.unmarkedEvents++;
        console.log('🔍 未マークイベント発見 → 処理開始');
        
        // STEP 2: タスク抽出
        var extractedTasks = taskExtractor.analyzeCalendarEvent(event);
        if (extractedTasks.length === 0) {
          console.log('⚪ タスク抽出なし → スキップ');
          continue;
        }
        
        console.log('📝 ' + extractedTasks.length + '件のタスクを抽出');
        result.stats.processedEvents++;
        
        // STEP 3: Notionにタスク作成
        var taskCreationSuccess = 0;
        for (var k = 0; k < extractedTasks.length; k++) {
          var task = extractedTasks[k];
          try {
            var createResult = taskExtractor.notionClient.createTask(task);
            if (createResult && createResult.success) {
              taskCreationSuccess++;
              console.log('✅ Notionタスク作成: "' + task.title + '"');
            } else {
              console.log('❌ Notionタスク作成失敗: "' + task.title + '"');
              result.errors.push('タスク作成失敗: ' + task.title);
            }
          } catch (createError) {
            console.error('❌ タスク作成エラー: ' + createError.message);
            result.errors.push('タスク作成エラー: ' + createError.message);
          }
        }
        
        result.stats.createdTasks += taskCreationSuccess;
        
        // STEP 4: タスク作成成功時のロボットマーク追加（最重要）
        if (taskCreationSuccess > 0) {
          console.log('🤖 ロボットマーク追加開始（タスク作成成功: ' + taskCreationSuccess + '件）');
          
          var markingResult = performGuaranteedRobotMarking(event, calendarUpdater);
          if (markingResult.success) {
            result.stats.markedEvents++;
            console.log('✅ ロボットマーク追加成功');
          } else {
            console.log('❌ ロボットマーク追加失敗: ' + markingResult.error);
            result.errors.push('ロボットマーク失敗: ' + eventTitle + ' - ' + markingResult.error);
            result.stats.errors++;
          }
        } else {
          console.log('⚠️ タスク作成失敗のためロボットマーク追加をスキップ');
        }
        
        // イベント間の短い休憩（API制限対策）
        if (j < allEvents.length - 1) {
          Utilities.sleep(200); // 0.2秒
        }
        
      } catch (eventError) {
        console.error('❌ イベント処理エラー: ' + eventError.message);
        result.errors.push('イベント処理エラー: ' + eventTitle + ' - ' + eventError.message);
        result.stats.errors++;
      }
    }
    
    console.log('\n📊 カレンダー処理完了');
    console.log('  - 総イベント: ' + result.stats.totalEvents + '件');
    console.log('  - 未マーク: ' + result.stats.unmarkedEvents + '件');
    console.log('  - 処理済み: ' + result.stats.processedEvents + '件');
    console.log('  - 作成タスク: ' + result.stats.createdTasks + '件');
    console.log('  - マーク追加: ' + result.stats.markedEvents + '件');
    console.log('  - エラー: ' + result.stats.errors + '件');
    
    // 成功基準: エラー率が10%未満かつ、処理すべきイベントを処理できた
    var errorRate = result.stats.totalEvents > 0 ? result.stats.errors / result.stats.totalEvents : 0;
    result.success = errorRate < 0.1;
    
    return result;
    
  } catch (error) {
    console.error('❌ カレンダー処理エラー:', error.message);
    result.success = false;
    result.errors.push('全体処理エラー: ' + error.message);
    return result;
  }
}

/**
 * 確実なロボットマーク追加（タスク作成後専用）
 */
function performGuaranteedRobotMarking(event, calendarUpdater) {
  console.log('🤖 確実なロボットマーク追加開始');
  
  var maxAttempts = 5; // 5回まで試行
  var attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log('  試行 ' + attempt + '/' + maxAttempts + '...');
    
    try {
      // マーク追加実行
      var success = calendarUpdater.markEventAsProcessed(event);
      
      if (success) {
        // 追加確認（重要）
        Utilities.sleep(1000); // 1秒待機
        if (calendarUpdater.isEventProcessed(event)) {
          console.log('  ✅ マーク確認成功');
          return { success: true };
        } else {
          console.log('  ⚠️ マーク追加されたが確認できない - 再試行');
        }
      } else {
        console.log('  ❌ マーク追加失敗 - 再試行');
      }
      
      // 再試行前の待機時間を増加
      if (attempt < maxAttempts) {
        var waitTime = attempt * 1000; // 1秒, 2秒, 3秒...
        console.log('  ⏱️ ' + (waitTime / 1000) + '秒待機後再試行...');
        Utilities.sleep(waitTime);
      }
      
    } catch (error) {
      console.log('  ❌ マーク試行エラー: ' + error.message);
      if (attempt === maxAttempts) {
        return {
          success: false,
          error: 'マーク追加エラー（' + maxAttempts + '回失敗）: ' + error.message
        };
      }
    }
  }
  
  return {
    success: false,
    error: 'ロボットマーク追加が' + maxAttempts + '回とも失敗'
  };
}

/**
 * 実行結果検証
 */
function verifyExecutionResults(result, dayRange) {
  console.log('\n--- 🔍 実行結果検証 ---');
  
  var verification = {
    passed: true,
    issues: [],
    recommendations: []
  };
  
  try {
    // 1. 基本統計の妥当性チェック
    if (result.stats.totalEvents === 0) {
      verification.issues.push('処理対象イベントが0件（期間設定を確認してください）');
    }
    
    // 2. エラー率チェック
    if (result.stats.errors > 0) {
      var errorRate = (result.stats.errors / Math.max(result.stats.totalEvents, 1)) * 100;
      if (errorRate > 5) {
        verification.passed = false;
        verification.issues.push('エラー率が高すぎます: ' + errorRate.toFixed(1) + '%');
      } else {
        verification.recommendations.push('エラー率: ' + errorRate.toFixed(1) + '% (許容範囲)');
      }
    }
    
    // 3. マーク追加成功率チェック
    if (result.stats.processedEvents > 0) {
      var markingRate = (result.stats.markedEvents / result.stats.processedEvents) * 100;
      if (markingRate < 90) {
        verification.passed = false;
        verification.issues.push('ロボットマーク追加成功率が低い: ' + markingRate.toFixed(1) + '%');
      } else {
        verification.recommendations.push('ロボットマーク成功率: ' + markingRate.toFixed(1) + '% (良好)');
      }
    }
    
    // 4. タスク作成成功率チェック
    if (result.stats.processedEvents > 0) {
      var taskRate = (result.stats.createdTasks / result.stats.processedEvents) * 100;
      if (taskRate < 80) {
        verification.issues.push('タスク作成成功率が低い: ' + taskRate.toFixed(1) + '%');
      } else {
        verification.recommendations.push('タスク作成率: ' + taskRate.toFixed(1) + '% (良好)');
      }
    }
    
    console.log('検証結果: ' + (verification.passed ? '✅ 合格' : '❌ 問題あり'));
    
    if (verification.issues.length > 0) {
      console.log('⚠️ 検出された問題:');
      verification.issues.forEach(function(issue, index) {
        console.log('  ' + (index + 1) + '. ' + issue);
      });
    }
    
    if (verification.recommendations.length > 0) {
      console.log('📝 補足情報:');
      verification.recommendations.forEach(function(rec, index) {
        console.log('  ' + (index + 1) + '. ' + rec);
      });
    }
    
    return verification;
    
  } catch (error) {
    console.error('❌ 検証エラー:', error.message);
    verification.passed = false;
    verification.issues.push('検証処理エラー: ' + error.message);
    return verification;
  }
}

/**
 * 深夜実行終了処理
 */
function finishDeepNightExecution(executionId, success, details) {
  try {
    // 実行フラグクリア
    PropertiesService.getScriptProperties().deleteProperty('DEEP_NIGHT_RUNNING');
    PropertiesService.getScriptProperties().deleteProperty('DEEP_NIGHT_START_TIME');
    PropertiesService.getScriptProperties().deleteProperty('DEEP_NIGHT_EXECUTION_ID');
    
    // 結果保存
    var resultData = {
      id: executionId,
      timestamp: new Date().toISOString(),
      success: success,
      details: details
    };
    
    PropertiesService.getScriptProperties().setProperty(
      'DEEP_NIGHT_LAST_RESULT', 
      JSON.stringify(resultData)
    );
    
    console.log('📝 深夜実行結果保存完了');
    
  } catch (error) {
    console.error('❌ 終了処理エラー:', error.message);
  }
}

/**
 * 深夜実行トリガーの設定
 */
function setupDeepNightTrigger() {
  console.log('=== ⏰ 深夜実行トリガー設定 ===');
  
  try {
    // 既存トリガーを削除
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'deepNightExecution') {
        ScriptApp.deleteTrigger(trigger);
        console.log('🗑️ 既存トリガーを削除');
      }
    });
    
    // 深夜3時のトリガーを設定
    var trigger = ScriptApp.newTrigger('deepNightExecution')
      .timeBased()
      .everyDays(1)
      .atHour(3) // 深夜3時
      .create();
    
    console.log('✅ 深夜3時実行トリガー設定完了');
    console.log('トリガーID: ' + trigger.getUniqueId());
    
    // 設定をプロパティに保存
    PropertiesService.getScriptProperties().setProperties({
      'DEEP_NIGHT_TRIGGER_ID': trigger.getUniqueId(),
      'DEEP_NIGHT_TRIGGER_SETUP_TIME': new Date().toISOString()
    });
    
    console.log('次回実行予定時刻: 明日の深夜3:00');
    
    return {
      success: true,
      triggerId: trigger.getUniqueId(),
      nextExecution: '毎日深夜3:00'
    };
    
  } catch (error) {
    console.error('❌ トリガー設定エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 深夜実行状況確認
 */
function checkDeepNightStatus() {
  console.log('=== 🌙 深夜実行状況確認 ===');
  
  try {
    // 実行状態確認
    var isRunning = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_RUNNING');
    console.log('実行状態: ' + (isRunning ? '🔄 実行中' : '⚪ 待機中'));
    
    if (isRunning) {
      var executionId = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_EXECUTION_ID');
      var startTime = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_START_TIME');
      console.log('実行ID: ' + (executionId || 'unknown'));
      
      if (startTime) {
        var elapsed = new Date().getTime() - parseInt(startTime);
        console.log('実行時間: ' + Math.round(elapsed / 1000) + '秒');
      }
    }
    
    // トリガー状態確認
    var triggerId = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_TRIGGER_ID');
    if (triggerId) {
      var triggers = ScriptApp.getProjectTriggers();
      var activeTrigger = triggers.find(function(t) { 
        return t.getUniqueId() === triggerId && t.getHandlerFunction() === 'deepNightExecution'; 
      });
      
      console.log('トリガー状態: ' + (activeTrigger ? '✅ 有効' : '❌ 無効'));
      if (activeTrigger) {
        console.log('実行時刻: 毎日深夜3:00');
      }
    } else {
      console.log('トリガー状態: ❌ 未設定');
    }
    
    // 最新実行結果
    var lastResult = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_LAST_RESULT');
    if (lastResult) {
      var result = JSON.parse(lastResult);
      console.log('\n--- 📊 前回実行結果 ---');
      console.log('実行時刻: ' + new Date(result.timestamp).toLocaleString('ja-JP'));
      console.log('結果: ' + (result.success ? '✅ 成功' : '❌ 失敗'));
      
      if (result.details && result.details.stats) {
        var stats = result.details.stats;
        console.log('処理イベント: ' + (stats.processedEvents || 0) + '件');
        console.log('作成タスク: ' + (stats.createdTasks || 0) + '件');
        console.log('ロボットマーク: ' + (stats.markedEvents || 0) + '件');
      }
    } else {
      console.log('\n--- 📊 前回実行結果 ---');
      console.log('実行履歴なし');
    }
    
  } catch (error) {
    console.error('❌ 状況確認エラー:', error.message);
  }
  
  console.log('\n=== 🌙 確認完了 ===');
}

/**
 * 手動テスト実行（深夜以外でのテスト用）
 */
function runDeepNightTest() {
  console.log('🧪 深夜実行のテスト実行');
  return deepNightExecution();
}

/**
 * 緊急停止（実行中の深夜処理を停止）
 */
function emergencyStopDeepNight() {
  console.log('🚨 深夜実行の緊急停止');
  
  try {
    PropertiesService.getScriptProperties().deleteProperty('DEEP_NIGHT_RUNNING');
    PropertiesService.getScriptProperties().deleteProperty('DEEP_NIGHT_START_TIME');
    PropertiesService.getScriptProperties().deleteProperty('DEEP_NIGHT_EXECUTION_ID');
    
    console.log('✅ 深夜実行フラグをクリアしました');
    
  } catch (error) {
    console.error('❌ 緊急停止エラー:', error.message);
  }
}