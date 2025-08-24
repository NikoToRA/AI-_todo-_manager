/**
 * 抜け漏れなし実行システム
 * 深夜実行 + 補完チェック + 緊急対応で100%の信頼性を目指す
 */

/**
 * 統合実行システムのセットアップ（初回設定用）
 */
function setupComprehensiveExecution() {
  console.log('=== 🛡️ 抜け漏れなし実行システム セットアップ開始 ===');
  
  try {
    var setupResults = {
      deepNightTrigger: false,
      backupTrigger: false,
      healthCheck: false,
      configuration: false,
      overall: false
    };
    
    // 1. 深夜メイン実行（毎日3時）
    console.log('\n--- 1. 深夜メイン実行トリガー設定 ---');
    var deepNightResult = setupDeepNightTrigger();
    setupResults.deepNightTrigger = deepNightResult.success;
    console.log(deepNightResult.success ? '✅' : '❌', '深夜3時実行');
    
    // 2. 補完実行（毎日昼12時）- 抜け漏れチェック
    console.log('\n--- 2. 補完チェック実行トリガー設定 ---');
    var backupResult = setupBackupCheckTrigger();
    setupResults.backupTrigger = backupResult.success;
    console.log(backupResult.success ? '✅' : '❌', '昼12時補完チェック');
    
    // 3. システム健全性チェック（週1回）
    console.log('\n--- 3. 週次健全性チェック設定 ---');
    var healthResult = setupWeeklyHealthCheck();
    setupResults.healthCheck = healthResult.success;
    console.log(healthResult.success ? '✅' : '❌', '週次健全性チェック');
    
    // 4. 設定とモニタリング初期化
    console.log('\n--- 4. システム設定初期化 ---');
    var configResult = initializeSystemConfiguration();
    setupResults.configuration = configResult.success;
    console.log(configResult.success ? '✅' : '❌', 'システム設定');
    
    setupResults.overall = setupResults.deepNightTrigger && 
                          setupResults.backupTrigger && 
                          setupResults.healthCheck && 
                          setupResults.configuration;
    
    // 5. セットアップ完了報告
    console.log('\n=== 📊 セットアップ結果 ===');
    console.log('深夜メイン実行: ' + (setupResults.deepNightTrigger ? '✅' : '❌'));
    console.log('補完チェック: ' + (setupResults.backupTrigger ? '✅' : '❌'));
    console.log('健全性チェック: ' + (setupResults.healthCheck ? '✅' : '❌'));
    console.log('システム設定: ' + (setupResults.configuration ? '✅' : '❌'));
    console.log('\n総合結果: ' + (setupResults.overall ? '🎉 完全セットアップ成功' : '⚠️ 一部セットアップ失敗'));
    
    if (setupResults.overall) {
      console.log('\n🛡️ 抜け漏れなし実行システム稼働開始！');
      console.log('📅 次回深夜実行: 明日 3:00');
      console.log('🔍 次回補完チェック: 今日 12:00');
    }
    
    return setupResults;
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
    return {
      overall: false,
      error: error.message
    };
  }
}

/**
 * 補完チェック実行トリガー設定（昼12時）
 */
function setupBackupCheckTrigger() {
  console.log('補完チェックトリガー設定中...');
  
  try {
    // 既存トリガー削除
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'backupCompletionCheck') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // 昼12時のトリガー設定
    var trigger = ScriptApp.newTrigger('backupCompletionCheck')
      .timeBased()
      .everyDays(1)
      .atHour(12) // 昼12時
      .create();
    
    PropertiesService.getScriptProperties().setProperty(
      'BACKUP_CHECK_TRIGGER_ID', 
      trigger.getUniqueId()
    );
    
    console.log('✅ 昼12時補完チェック設定完了');
    return { success: true, triggerId: trigger.getUniqueId() };
    
  } catch (error) {
    console.error('❌ 補完チェックトリガー設定エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 週次健全性チェックトリガー設定（日曜日朝9時）
 */
function setupWeeklyHealthCheck() {
  console.log('週次健全性チェックトリガー設定中...');
  
  try {
    // 既存トリガー削除
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'weeklySystemHealthCheck') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // 日曜日朝9時のトリガー設定
    var trigger = ScriptApp.newTrigger('weeklySystemHealthCheck')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(9)
      .create();
    
    PropertiesService.getScriptProperties().setProperty(
      'WEEKLY_HEALTH_TRIGGER_ID', 
      trigger.getUniqueId()
    );
    
    console.log('✅ 日曜日朝9時健全性チェック設定完了');
    return { success: true, triggerId: trigger.getUniqueId() };
    
  } catch (error) {
    console.error('❌ 健全性チェックトリガー設定エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * システム設定初期化
 */
function initializeSystemConfiguration() {
  console.log('システム設定初期化中...');
  
  try {
    var config = ConfigManager.getConfig();
    
    // 抜け漏れ防止システム設定
    var systemConfig = {
      // 実行設定
      maxRetryAttempts: 5,
      retryDelayMs: 2000,
      timeoutLimitMs: 25 * 60 * 1000, // 25分制限
      
      // 監視設定
      enableHealthMonitoring: true,
      alertThresholdErrorRate: 0.05, // 5%エラー率で警告
      requireCompletionConfirmation: true,
      
      // 補完設定
      enableBackupCheck: true,
      backupCheckDelayHours: 9, // 深夜3時実行の9時間後（昼12時）
      maxUnprocessedEvents: 10, // 10件以上未処理で警告
      
      // 設定日時
      configuredAt: new Date().toISOString(),
      version: '1.0'
    };
    
    PropertiesService.getScriptProperties().setProperty(
      'COMPREHENSIVE_EXECUTION_CONFIG',
      JSON.stringify(systemConfig)
    );
    
    // 統計カウンターの初期化
    var statsCounters = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalProcessedEvents: 0,
      totalCreatedTasks: 0,
      totalMarkedEvents: 0,
      lastResetDate: new Date().toISOString()
    };
    
    PropertiesService.getScriptProperties().setProperty(
      'EXECUTION_STATISTICS',
      JSON.stringify(statsCounters)
    );
    
    console.log('✅ システム設定初期化完了');
    return { success: true };
    
  } catch (error) {
    console.error('❌ システム設定初期化エラー:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 補完チェック実行（昼12時実行）
 */
function backupCompletionCheck() {
  console.log('=== 🔍 補完チェック実行開始 (' + new Date().toLocaleString('ja-JP') + ') ===');
  
  try {
    var checkId = 'BACKUP_' + new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    
    // 深夜実行の結果確認
    var deepNightResult = getLastDeepNightResult();
    
    if (!deepNightResult) {
      console.log('⚠️ 深夜実行の結果が見つかりません');
      return performEmergencyFullScan(checkId);
    }
    
    var hoursElapsed = (new Date().getTime() - new Date(deepNightResult.timestamp).getTime()) / (60 * 60 * 1000);
    console.log('深夜実行からの経過時間: ' + hoursElapsed.toFixed(1) + '時間');
    
    if (hoursElapsed > 15) {
      console.log('⚠️ 深夜実行が15時間以上前 - 緊急フルスキャン実行');
      return performEmergencyFullScan(checkId);
    }
    
    if (!deepNightResult.success) {
      console.log('⚠️ 深夜実行が失敗 - 補完処理実行');
      return performCompletionProcessing(checkId);
    }
    
    // 抜け漏れチェック
    var leakageCheck = checkForLeakages();
    
    if (leakageCheck.hasIssues) {
      console.log('⚠️ 抜け漏れ検出 - 補完処理実行');
      console.log('検出された問題: ' + leakageCheck.issues.length + '件');
      return performCompletionProcessing(checkId);
    }
    
    console.log('✅ 補完チェック完了 - 問題なし');
    recordBackupCheckResult(checkId, true, {
      message: '問題なし',
      deepNightSuccess: true,
      leakageCheck: leakageCheck
    });
    
    return { success: true, message: '補完チェック完了 - 問題なし' };
    
  } catch (error) {
    console.error('❌ 補完チェックエラー:', error.message);
    recordBackupCheckResult(checkId, false, { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * 抜け漏れチェック
 */
function checkForLeakages() {
  console.log('--- 🔍 抜け漏れチェック ---');
  
  var check = {
    hasIssues: false,
    issues: [],
    stats: {
      totalEvents: 0,
      unmarkedEvents: 0,
      suspiciousEvents: 0
    }
  };
  
  try {
    var config = ConfigManager.getConfig();
    var dayRange = config.defaultDayRange || 7;
    var calendarUpdater = new CalendarEventUpdater();
    
    // チェック期間
    var endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - dayRange + 1);
    startDate.setHours(0, 0, 0, 0);
    
    console.log('チェック期間: ' + startDate.toLocaleDateString('ja-JP') + ' ～ ' + endDate.toLocaleDateString('ja-JP'));
    
    // 全カレンダーから未マークイベントを検索
    var calendars = CalendarApp.getAllCalendars();
    var unmarkedEvents = [];
    
    for (var i = 0; i < calendars.length; i++) {
      try {
        var events = calendars[i].getEvents(startDate, endDate);
        check.stats.totalEvents += events.length;
        
        for (var j = 0; j < events.length; j++) {
          var event = events[j];
          if (!calendarUpdater.isEventProcessed(event)) {
            unmarkedEvents.push({
              title: event.getTitle(),
              calendar: calendars[i].getName(),
              date: event.getStartTime().toLocaleDateString('ja-JP'),
              event: event
            });
          }
        }
      } catch (error) {
        check.issues.push('カレンダー「' + calendars[i].getName() + '」のアクセスエラー');
      }
    }
    
    check.stats.unmarkedEvents = unmarkedEvents.length;
    
    console.log('総イベント: ' + check.stats.totalEvents + '件');
    console.log('未マークイベント: ' + check.stats.unmarkedEvents + '件');
    
    // 抜け漏れ判定
    if (check.stats.unmarkedEvents > 0) {
      console.log('⚠️ ' + check.stats.unmarkedEvents + '件の未マークイベントを発見');
      
      // 適切な抜け漏れかどうかを簡易判定
      var significantUnmarked = unmarkedEvents.filter(function(evt) {
        // 短時間のイベントや特定パターンは除外
        var title = evt.title.toLowerCase();
        return !title.includes('ランチ') && 
               !title.includes('休憩') && 
               !title.includes('移動時間') &&
               evt.title.length > 3;
      });
      
      if (significantUnmarked.length > 0) {
        check.hasIssues = true;
        check.issues.push(significantUnmarked.length + '件の重要な未処理イベントを検出');
        
        console.log('重要な未処理イベント:');
        significantUnmarked.forEach(function(evt, index) {
          console.log('  ' + (index + 1) + '. "' + evt.title + '" (' + evt.date + ')');
        });
      }
    }
    
    return check;
    
  } catch (error) {
    console.error('❌ 抜け漏れチェックエラー:', error.message);
    check.hasIssues = true;
    check.issues.push('抜け漏れチェック処理エラー: ' + error.message);
    return check;
  }
}

/**
 * 補完処理実行
 */
function performCompletionProcessing(checkId) {
  console.log('--- 🔧 補完処理実行 ---');
  
  try {
    // 深夜実行と同じロジックを使用（ただし範囲を限定）
    var config = ConfigManager.getConfig();
    var dayRange = Math.min(config.defaultDayRange || 7, 3); // 最大3日間に限定
    
    console.log('補完処理期間: ' + dayRange + '日間');
    
    var result = performReliableCalendarProcessing(dayRange, checkId);
    
    console.log('📊 補完処理結果:');
    console.log('  - 処理イベント: ' + (result.stats.processedEvents || 0) + '件');
    console.log('  - 作成タスク: ' + (result.stats.createdTasks || 0) + '件');
    console.log('  - マーク追加: ' + (result.stats.markedEvents || 0) + '件');
    
    recordBackupCheckResult(checkId, result.success, {
      type: '補完処理',
      result: result
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ 補完処理エラー:', error.message);
    recordBackupCheckResult(checkId, false, { 
      type: '補完処理', 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
}

/**
 * 緊急フルスキャン実行
 */
function performEmergencyFullScan(checkId) {
  console.log('--- 🚨 緊急フルスキャン実行 ---');
  
  try {
    console.log('⚠️ 深夜実行に重大な問題 - 緊急フルスキャンを実行します');
    
    // 深夜実行システムを直接呼び出し
    var result = deepNightExecution();
    
    recordBackupCheckResult(checkId, result.success, {
      type: '緊急フルスキャン',
      result: result
    });
    
    console.log('🚨 緊急フルスキャン完了: ' + (result.success ? '成功' : '失敗'));
    return result;
    
  } catch (error) {
    console.error('❌ 緊急フルスキャンエラー:', error.message);
    recordBackupCheckResult(checkId, false, {
      type: '緊急フルスキャン',
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

/**
 * 週次システム健全性チェック
 */
function weeklySystemHealthCheck() {
  console.log('=== 📊 週次システム健全性チェック開始 ===');
  
  try {
    var healthReport = {
      timestamp: new Date().toISOString(),
      overallHealth: 'good',
      issues: [],
      recommendations: [],
      statistics: {}
    };
    
    // 1. 実行統計の分析
    var stats = getExecutionStatistics();
    healthReport.statistics = stats;
    
    console.log('📊 週次実行統計:');
    console.log('  - 総実行回数: ' + stats.totalExecutions + '回');
    console.log('  - 成功率: ' + (stats.totalExecutions > 0 ? (stats.successfulExecutions / stats.totalExecutions * 100).toFixed(1) : 0) + '%');
    console.log('  - 処理イベント: ' + stats.totalProcessedEvents + '件');
    console.log('  - 作成タスク: ' + stats.totalCreatedTasks + '件');
    
    // 2. トリガー状態チェック
    var triggerHealth = checkTriggersHealth();
    if (!triggerHealth.allActive) {
      healthReport.overallHealth = 'warning';
      healthReport.issues.push('一部のトリガーが無効になっています');
    }
    
    // 3. 成功率チェック
    if (stats.totalExecutions > 0) {
      var successRate = stats.successfulExecutions / stats.totalExecutions;
      if (successRate < 0.9) {
        healthReport.overallHealth = 'warning';
        healthReport.issues.push('実行成功率が90%を下回っています: ' + (successRate * 100).toFixed(1) + '%');
      }
    }
    
    // 4. 推奨事項
    if (stats.totalProcessedEvents === 0) {
      healthReport.recommendations.push('処理対象イベントが0件です。カレンダー設定を確認してください');
    }
    
    // 5. レポート出力
    console.log('\n=== 📋 健全性レポート ===');
    console.log('総合状態: ' + getHealthStatusIcon(healthReport.overallHealth) + ' ' + healthReport.overallHealth.toUpperCase());
    
    if (healthReport.issues.length > 0) {
      console.log('\n⚠️ 検出された問題:');
      healthReport.issues.forEach(function(issue, index) {
        console.log('  ' + (index + 1) + '. ' + issue);
      });
    }
    
    if (healthReport.recommendations.length > 0) {
      console.log('\n💡 推奨事項:');
      healthReport.recommendations.forEach(function(rec, index) {
        console.log('  ' + (index + 1) + '. ' + rec);
      });
    }
    
    // 6. レポート保存
    PropertiesService.getScriptProperties().setProperty(
      'WEEKLY_HEALTH_REPORT',
      JSON.stringify(healthReport)
    );
    
    console.log('\n=== 📊 週次健全性チェック完了 ===');
    return healthReport;
    
  } catch (error) {
    console.error('❌ 週次健全性チェックエラー:', error.message);
    return {
      overallHealth: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * ヘルパー関数群
 */

function getLastDeepNightResult() {
  try {
    var resultData = PropertiesService.getScriptProperties().getProperty('DEEP_NIGHT_LAST_RESULT');
    return resultData ? JSON.parse(resultData) : null;
  } catch (error) {
    return null;
  }
}

function recordBackupCheckResult(checkId, success, details) {
  try {
    var result = {
      id: checkId,
      timestamp: new Date().toISOString(),
      success: success,
      details: details
    };
    
    PropertiesService.getScriptProperties().setProperty(
      'BACKUP_CHECK_LAST_RESULT',
      JSON.stringify(result)
    );
  } catch (error) {
    console.error('❌ 補完チェック結果記録エラー:', error.message);
  }
}

function getExecutionStatistics() {
  try {
    var statsData = PropertiesService.getScriptProperties().getProperty('EXECUTION_STATISTICS');
    return statsData ? JSON.parse(statsData) : {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalProcessedEvents: 0,
      totalCreatedTasks: 0,
      totalMarkedEvents: 0
    };
  } catch (error) {
    return {};
  }
}

function checkTriggersHealth() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var expectedTriggers = [
      'deepNightExecution',
      'backupCompletionCheck',
      'weeklySystemHealthCheck'
    ];
    
    var activeTriggers = triggers.map(function(t) { return t.getHandlerFunction(); });
    var allActive = expectedTriggers.every(function(expected) {
      return activeTriggers.indexOf(expected) !== -1;
    });
    
    return {
      allActive: allActive,
      activeTriggers: activeTriggers,
      expectedTriggers: expectedTriggers
    };
  } catch (error) {
    return { allActive: false, error: error.message };
  }
}

function getHealthStatusIcon(status) {
  switch (status) {
    case 'good': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '❓';
  }
}

/**
 * システム状態確認（ユーザー向け）
 */
function checkComprehensiveSystemStatus() {
  console.log('=== 🛡️ 抜け漏れなしシステム状態確認 ===');
  
  try {
    console.log('\n--- 🌙 深夜実行状態 ---');
    checkDeepNightStatus();
    
    console.log('\n--- 🔍 補完チェック状態 ---');
    var backupResult = PropertiesService.getScriptProperties().getProperty('BACKUP_CHECK_LAST_RESULT');
    if (backupResult) {
      var backup = JSON.parse(backupResult);
      console.log('最終実行: ' + new Date(backup.timestamp).toLocaleString('ja-JP'));
      console.log('結果: ' + (backup.success ? '✅ 成功' : '❌ 失敗'));
    } else {
      console.log('補完チェック履歴なし');
    }
    
    console.log('\n--- 📊 週次健全性状態 ---');
    var healthResult = PropertiesService.getScriptProperties().getProperty('WEEKLY_HEALTH_REPORT');
    if (healthResult) {
      var health = JSON.parse(healthResult);
      console.log('最終チェック: ' + new Date(health.timestamp).toLocaleString('ja-JP'));
      console.log('システム状態: ' + getHealthStatusIcon(health.overallHealth) + ' ' + health.overallHealth.toUpperCase());
    } else {
      console.log('健全性チェック履歴なし');
    }
    
    console.log('\n--- ⚙️ トリガー状態 ---');
    var triggerHealth = checkTriggersHealth();
    console.log('全トリガー状態: ' + (triggerHealth.allActive ? '✅ 正常' : '❌ 一部無効'));
    
  } catch (error) {
    console.error('❌ システム状態確認エラー:', error.message);
  }
  
  console.log('\n=== 🛡️ 状態確認完了 ===');
}

/**
 * 手動テスト用関数
 */
function runComprehensiveTest() {
  console.log('🧪 抜け漏れなしシステムのテスト実行');
  return deepNightExecution();
}

function runBackupCheckTest() {
  console.log('🧪 補完チェックのテスト実行');
  return backupCompletionCheck();
}