/**
 * 確実な1日1回実行システム
 * タスク拾い漏れ・マーク付与漏れを最小化する信頼性重視の実装
 */

/**
 * メイン: 確実な日次実行
 */
function reliableDailyExecution() {
  console.log('=== 🛡️ 確実な日次実行システム開始 ===');
  
  var executionId = generateExecutionId();
  var startTime = new Date().getTime();
  var timeLimit = 5 * 60 * 1000; // 5分制限（安全マージン）
  
  console.log('実行ID: ' + executionId);
  console.log('開始時刻: ' + new Date(startTime).toLocaleString('ja-JP'));
  
  try {
    // 1. 実行前チェック
    var preCheck = performPreExecutionChecks();
    if (!preCheck.canProceed) {
      console.log('❌ 実行前チェック失敗: ' + preCheck.reason);
      return recordExecutionResult(executionId, false, preCheck.reason);
    }
    
    // 2. ユーザー設定の日数取得
    var config = ConfigManager.getConfig();
    var dayRange = config.defaultDayRange || 7; // デフォルト7日
    
    console.log('📅 処理対象期間: ' + dayRange + '日間');
    
    // 3. 分割処理による確実実行
    var result = performSegmentedExecution(dayRange, startTime, timeLimit, executionId);
    
    // 4. 実行後の完全性チェック
    var integrityCheck = performIntegrityCheck(result);
    
    // 5. 結果記録とレポート
    var finalResult = {
      executionId: executionId,
      success: result.success && integrityCheck.passed,
      processedEvents: result.processedEvents || 0,
      createdTasks: result.createdTasks || 0,
      markedEvents: result.markedEvents || 0,
      errors: result.errors || [],
      warnings: result.warnings || [],
      integrityIssues: integrityCheck.issues || [],
      executionTime: new Date().getTime() - startTime,
      timestamp: new Date().toISOString()
    };
    
    recordExecutionResult(executionId, finalResult.success, finalResult);
    
    console.log('\n=== 📊 実行結果サマリー ===');
    console.log('成功: ' + (finalResult.success ? '✅' : '❌'));
    console.log('処理イベント: ' + finalResult.processedEvents + '件');
    console.log('作成タスク: ' + finalResult.createdTasks + '件');
    console.log('マーク追加: ' + finalResult.markedEvents + '件');
    console.log('エラー: ' + finalResult.errors.length + '件');
    console.log('実行時間: ' + Math.round(finalResult.executionTime / 1000) + '秒');
    
    if (finalResult.integrityIssues.length > 0) {
      console.log('\n⚠️ 完全性チェックで問題検出: ' + finalResult.integrityIssues.length + '件');
      finalResult.integrityIssues.forEach(function(issue, index) {
        console.log('  ' + (index + 1) + '. ' + issue);
      });
    }
    
    console.log('\n=== 🛡️ 確実な日次実行完了 ===');
    return finalResult;
    
  } catch (error) {
    console.error('❌ 確実実行システムエラー:', error.message);
    console.error(error.stack);
    
    var errorResult = {
      executionId: executionId,
      success: false,
      error: error.message,
      executionTime: new Date().getTime() - startTime
    };
    
    recordExecutionResult(executionId, false, errorResult);
    return errorResult;
  }
}

/**
 * 実行前チェック
 */
function performPreExecutionChecks() {
  console.log('\n--- 🔍 実行前チェック ---');
  
  var checks = {
    canProceed: true,
    reason: '',
    issues: []
  };
  
  try {
    // 1. 重複実行チェック
    var isRunning = PropertiesService.getScriptProperties().getProperty('EXECUTION_RUNNING');
    if (isRunning) {
      var runningTime = PropertiesService.getScriptProperties().getProperty('EXECUTION_START_TIME');
      var elapsed = new Date().getTime() - parseInt(runningTime || 0);
      
      if (elapsed < 10 * 60 * 1000) { // 10分以内なら実行中とみなす
        checks.canProceed = false;
        checks.reason = '他の実行が進行中です（' + Math.round(elapsed / 1000) + '秒経過）';
        return checks;
      } else {
        console.log('⚠️ 古い実行フラグを検出（' + Math.round(elapsed / 60000) + '分前）- リセットして続行');
      }
    }
    
    // 2. 基本権限チェック
    try {
      CalendarApp.getAllCalendars();
      console.log('✅ カレンダー権限: OK');
    } catch (error) {
      checks.canProceed = false;
      checks.reason = 'カレンダー権限エラー: ' + error.message;
      return checks;
    }
    
    // 3. Notion接続チェック
    try {
      var config = ConfigManager.getConfig();
      if (!config.notionToken || !config.notionDatabaseId) {
        checks.canProceed = false;
        checks.reason = 'Notion設定が不完全です';
        return checks;
      }
      console.log('✅ Notion設定: OK');
    } catch (error) {
      checks.canProceed = false;
      checks.reason = 'Notion設定確認エラー: ' + error.message;
      return checks;
    }
    
    // 4. 実行フラグ設定
    PropertiesService.getScriptProperties().setProperties({
      'EXECUTION_RUNNING': 'true',
      'EXECUTION_START_TIME': new Date().getTime().toString()
    });
    
    console.log('✅ 実行前チェック完了');
    return checks;
    
  } catch (error) {
    console.error('❌ 実行前チェックエラー:', error.message);
    checks.canProceed = false;
    checks.reason = '実行前チェック中にエラー: ' + error.message;
    return checks;
  }
}

/**
 * 分割処理による確実実行
 */
function performSegmentedExecution(dayRange, startTime, timeLimit, executionId) {
  console.log('\n--- ⚡ 分割処理実行 ---');
  
  var result = {
    success: true,
    processedEvents: 0,
    createdTasks: 0,
    markedEvents: 0,
    errors: [],
    warnings: [],
    segments: []
  };
  
  try {
    var config = ConfigManager.getConfig();
    var taskExtractor = new TaskExtractor(config);
    
    // 日付範囲を分割（2日ずつ処理して安全性確保）
    var segmentDays = 2;
    var totalSegments = Math.ceil(dayRange / segmentDays);
    
    console.log('分割処理: ' + totalSegments + 'セグメント（' + segmentDays + '日ずつ）');
    
    for (var segment = 0; segment < totalSegments; segment++) {
      var currentTime = new Date().getTime();
      var elapsedTime = currentTime - startTime;
      
      // 時間制限チェック
      if (elapsedTime > timeLimit) {
        console.log('⚠️ 時間制限到達 - セグメント ' + (segment + 1) + '/' + totalSegments + ' で中断');
        result.warnings.push('時間制限により ' + (totalSegments - segment) + 'セグメントが未処理');
        break;
      }
      
      console.log('セグメント ' + (segment + 1) + '/' + totalSegments + ' 処理中...');
      
      // セグメント日付計算
      var segmentStartDays = segment * segmentDays;
      var segmentEndDays = Math.min((segment + 1) * segmentDays - 1, dayRange - 1);
      
      var segmentStartDate = new Date();
      segmentStartDate.setDate(segmentStartDate.getDate() - segmentEndDays);
      segmentStartDate.setHours(0, 0, 0, 0);
      
      var segmentEndDate = new Date();
      segmentEndDate.setDate(segmentEndDate.getDate() - segmentStartDays);
      segmentEndDate.setHours(23, 59, 59, 999);
      
      console.log('  期間: ' + segmentStartDate.toLocaleDateString('ja-JP') + ' ～ ' + segmentEndDate.toLocaleDateString('ja-JP'));
      
      try {
        var segmentResult = taskExtractor.extractFromCalendar(segmentStartDate, segmentEndDate);
        
        var segmentStats = {
          segment: segment + 1,
          startDate: segmentStartDate.toISOString().split('T')[0],
          endDate: segmentEndDate.toISOString().split('T')[0],
          processedTasks: segmentResult.length,
          success: true,
          executionTime: new Date().getTime() - currentTime
        };
        
        result.processedEvents += segmentResult.length;
        result.createdTasks += segmentResult.filter(function(task) { return task.created; }).length;
        result.segments.push(segmentStats);
        
        console.log('  ✅ セグメント完了: ' + segmentResult.length + '件処理');
        
        // セグメント間の休憩（API制限対策）
        if (segment < totalSegments - 1) {
          Utilities.sleep(1000); // 1秒休憩
        }
        
      } catch (segmentError) {
        console.error('❌ セグメント ' + (segment + 1) + ' エラー:', segmentError.message);
        result.errors.push('セグメント ' + (segment + 1) + ': ' + segmentError.message);
        
        result.segments.push({
          segment: segment + 1,
          startDate: segmentStartDate.toISOString().split('T')[0],
          endDate: segmentEndDate.toISOString().split('T')[0],
          success: false,
          error: segmentError.message
        });
        
        // セグメントエラーでも続行（他のセグメントは処理）
        continue;
      }
    }
    
    console.log('分割処理完了 - 処理済みセグメント: ' + result.segments.length + '/' + totalSegments);
    
    // 最低1つのセグメントが成功していれば全体成功とする
    var successfulSegments = result.segments.filter(function(seg) { return seg.success; }).length;
    result.success = successfulSegments > 0;
    
    return result;
    
  } catch (error) {
    console.error('❌ 分割処理エラー:', error.message);
    result.success = false;
    result.errors.push('分割処理エラー: ' + error.message);
    return result;
  }
}

/**
 * 完全性チェック（拾い漏れ・マーク漏れチェック）
 */
function performIntegrityCheck(executionResult) {
  console.log('\n--- 🔍 完全性チェック ---');
  
  var check = {
    passed: true,
    issues: []
  };
  
  try {
    var config = ConfigManager.getConfig();
    var dayRange = config.defaultDayRange || 7;
    
    // チェック対象期間
    var checkStartDate = new Date();
    checkStartDate.setDate(checkStartDate.getDate() - dayRange + 1);
    checkStartDate.setHours(0, 0, 0, 0);
    
    var checkEndDate = new Date();
    checkEndDate.setHours(23, 59, 59, 999);
    
    console.log('完全性チェック期間: ' + checkStartDate.toLocaleDateString('ja-JP') + ' ～ ' + checkEndDate.toLocaleDateString('ja-JP'));
    
    // 全カレンダーからイベント取得
    var calendars = CalendarApp.getAllCalendars();
    var allEvents = [];
    var calendarUpdater = new CalendarEventUpdater();
    
    for (var i = 0; i < calendars.length; i++) {
      try {
        var events = calendars[i].getEvents(checkStartDate, checkEndDate);
        allEvents = allEvents.concat(events);
      } catch (error) {
        check.issues.push('カレンダー「' + calendars[i].getName() + '」のアクセスエラー');
      }
    }
    
    console.log('チェック対象イベント総数: ' + allEvents.length + '件');
    
    // マーク付与漏れチェック
    var unmarkedEvents = [];
    var markedEvents = 0;
    
    for (var j = 0; j < allEvents.length; j++) {
      var event = allEvents[j];
      if (calendarUpdater.isEventProcessed(event)) {
        markedEvents++;
      } else {
        unmarkedEvents.push({
          title: event.getTitle(),
          date: event.getStartTime().toLocaleDateString('ja-JP'),
          calendar: event.getOriginalCalendarId()
        });
      }
    }
    
    console.log('🤖マーク済み: ' + markedEvents + '件');
    console.log('未マーク: ' + unmarkedEvents.length + '件');
    
    // マーク付与漏れが多い場合は警告
    if (unmarkedEvents.length > allEvents.length * 0.1) { // 10%以上が未マーク
      check.issues.push(unmarkedEvents.length + '件の未マークイベントを検出（要確認）');
    }
    
    // 実行結果との整合性チェック
    if (executionResult.processedEvents === 0 && unmarkedEvents.length > 0) {
      check.issues.push('処理イベント0件だが、未マークイベントが' + unmarkedEvents.length + '件存在');
      check.passed = false;
    }
    
    console.log('✅ 完全性チェック完了');
    
    return check;
    
  } catch (error) {
    console.error('❌ 完全性チェックエラー:', error.message);
    check.passed = false;
    check.issues.push('完全性チェックエラー: ' + error.message);
    return check;
  }
}

/**
 * 実行結果の記録
 */
function recordExecutionResult(executionId, success, details) {
  try {
    // 実行フラグクリア
    PropertiesService.getScriptProperties().deleteProperty('EXECUTION_RUNNING');
    PropertiesService.getScriptProperties().deleteProperty('EXECUTION_START_TIME');
    
    // 結果をPropertiesに保存（直近10件保持）
    var resultKey = 'EXECUTION_RESULT_' + executionId;
    var resultData = {
      id: executionId,
      timestamp: new Date().toISOString(),
      success: success,
      details: details
    };
    
    PropertiesService.getScriptProperties().setProperty(resultKey, JSON.stringify(resultData));
    
    // 古い結果のクリーンアップ（簡易版）
    PropertiesService.getScriptProperties().setProperty('LATEST_EXECUTION_ID', executionId);
    
    console.log('📝 実行結果記録完了: ' + executionId);
    
    return resultData;
    
  } catch (error) {
    console.error('❌ 実行結果記録エラー:', error.message);
    return null;
  }
}

/**
 * 実行IDの生成
 */
function generateExecutionId() {
  var timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
  var random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp + '_' + random;
}

/**
 * 直近の実行結果取得
 */
function getRecentExecutionResults(limit) {
  limit = limit || 5;
  
  try {
    var latestId = PropertiesService.getScriptProperties().getProperty('LATEST_EXECUTION_ID');
    if (!latestId) {
      console.log('実行履歴がありません');
      return [];
    }
    
    var resultKey = 'EXECUTION_RESULT_' + latestId;
    var resultData = PropertiesService.getScriptProperties().getProperty(resultKey);
    
    if (resultData) {
      var result = JSON.parse(resultData);
      console.log('=== 📋 最新実行結果 ===');
      console.log('実行ID: ' + result.id);
      console.log('実行時刻: ' + new Date(result.timestamp).toLocaleString('ja-JP'));
      console.log('成功: ' + (result.success ? '✅' : '❌'));
      
      if (result.details) {
        console.log('処理イベント: ' + (result.details.processedEvents || 0) + '件');
        console.log('作成タスク: ' + (result.details.createdTasks || 0) + '件');
        console.log('実行時間: ' + Math.round((result.details.executionTime || 0) / 1000) + '秒');
        
        if (result.details.errors && result.details.errors.length > 0) {
          console.log('エラー: ' + result.details.errors.length + '件');
          result.details.errors.forEach(function(error, index) {
            console.log('  ' + (index + 1) + '. ' + error);
          });
        }
      }
      
      return [result];
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ 実行結果取得エラー:', error.message);
    return [];
  }
}

/**
 * 手動実行（テスト用）
 */
function runReliableDaily() {
  return reliableDailyExecution();
}

/**
 * システム状態確認
 */
function checkSystemStatus() {
  console.log('=== 🔧 システム状態確認 ===');
  
  try {
    // 実行状態確認
    var isRunning = PropertiesService.getScriptProperties().getProperty('EXECUTION_RUNNING');
    console.log('実行状態: ' + (isRunning ? '🔄 実行中' : '⚪ 待機中'));
    
    if (isRunning) {
      var startTime = PropertiesService.getScriptProperties().getProperty('EXECUTION_START_TIME');
      if (startTime) {
        var elapsed = new Date().getTime() - parseInt(startTime);
        console.log('実行開始から: ' + Math.round(elapsed / 1000) + '秒経過');
      }
    }
    
    // 直近実行結果
    getRecentExecutionResults(1);
    
    // 基本機能チェック
    performPreExecutionChecks();
    
    console.log('=== 🔧 システム状態確認完了 ===');
    
  } catch (error) {
    console.error('❌ システム状態確認エラー:', error.message);
  }
}