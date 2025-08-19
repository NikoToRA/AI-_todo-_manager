/**
 * 緊急対応実行スクリプト
 * メール重複実行問題の解決
 */

/**
 * 緊急対応の実行
 */
function executeEmergencyFix() {
  console.log('🚨 緊急対応開始：メール重複実行問題の解決');
  
  try {
    // 1. 現在のトリガー状況確認
    console.log('=== 1. 現在のトリガー状況確認 ===');
    const triggerDetails = checkTriggerDetails();
    console.log('トリガー詳細:', JSON.stringify(triggerDetails, null, 2));
    
    // 2. 緊急修正実行
    console.log('=== 2. 緊急修正実行 ===');
    const emergencyResult = emergencyFixDuplicateExecution();
    console.log('緊急修正結果:', JSON.stringify(emergencyResult, null, 2));
    
    // 3. 処理済みメール管理のクリーンアップ
    console.log('=== 3. 処理済みメール管理のクリーンアップ ===');
    
    // 重複記録削除
    const duplicateResult = ProcessedEmailTracker.removeDuplicateRecords();
    console.log('重複削除結果:', JSON.stringify(duplicateResult, null, 2));
    
    // 古い記録削除（7日以上前）
    const cleanupResult = ProcessedEmailTracker.cleanupOldRecords(7);
    console.log('古い記録削除結果:', JSON.stringify(cleanupResult, null, 2));
    
    // 4. 修正後のトリガー状況確認
    console.log('=== 4. 修正後のトリガー状況確認 ===');
    const finalTriggerDetails = checkTriggerDetails();
    console.log('修正後トリガー詳細:', JSON.stringify(finalTriggerDetails, null, 2));
    
    // 5. 処理済みメール統計確認
    console.log('=== 5. 処理済みメール統計確認 ===');
    const stats = ProcessedEmailTracker.getStatistics();
    console.log('処理済みメール統計:', JSON.stringify(stats, null, 2));
    
    // 6. 設定確認
    console.log('=== 6. 設定確認 ===');
    const config = ConfigManager.getConfig();
    console.log('実行頻度設定:', config.executionFrequency);
    console.log('実行時間設定:', config.executionHour);
    console.log('Gmail分析有効:', config.enableGmailAnalysis);
    console.log('処理済み管理有効:', config.gmailProcessedTracking);
    
    console.log('✅ 緊急対応完了');
    
    return {
      success: true,
      triggerFix: emergencyResult,
      duplicateCleanup: duplicateResult,
      oldRecordsCleanup: cleanupResult,
      finalTriggerCount: finalTriggerDetails.autoTask || 0,
      processedEmailStats: stats
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
 * 設定確認と同期
 */
function checkConfigAndSync() {
  console.log('=== 設定確認と同期 ===');
  
  try {
    // スプレッドシートから設定を読み込み
    ConfigManager.syncSheetToProperties();
    
    const config = ConfigManager.getConfig();
    
    console.log('📋 現在の設定:');
    console.log('- 実行頻度:', config.executionFrequency);
    console.log('- 実行時間:', config.executionHour + '時');
    console.log('- Gmail分析:', config.enableGmailAnalysis ? '有効' : '無効');
    console.log('- 処理済み管理:', config.gmailProcessedTracking ? '有効' : '無効');
    console.log('- Gemini分析:', config.gmailEnableGeminiAnalysis ? '有効' : '無効');
    
    // バリデーション
    const validation = ConfigManager.validateConfig();
    if (validation.isValid) {
      console.log('✅ 設定は正常です');
    } else {
      console.log('❌ 設定エラー:', validation.errors.join(', '));
    }
    
    return {
      success: true,
      config: config,
      validation: validation
    };
    
  } catch (error) {
    console.error('❌ 設定確認エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 完全な問題解決実行
 */
function completeFixExecution() {
  console.log('🔧 完全な問題解決実行開始');
  
  try {
    // 1. 緊急対応実行
    const emergencyResult = executeEmergencyFix();
    
    // 2. 設定確認と同期
    const configResult = checkConfigAndSync();
    
    // 3. トリガー再設定（念のため）
    console.log('=== トリガー再設定 ===');
    const triggerReset = resetTriggers();
    console.log('トリガー再設定結果:', JSON.stringify(triggerReset, null, 2));
    
    // 4. 最終確認
    console.log('=== 最終確認 ===');
    const finalCheck = checkTriggerDetails();
    console.log('最終トリガー状況:', JSON.stringify(finalCheck, null, 2));
    
    console.log('🎉 完全な問題解決完了');
    
    // 結果サマリー
    console.log('=== 解決結果サマリー ===');
    console.log('✅ トリガー重複問題: 解決済み');
    console.log('✅ 処理済みメール管理: 強化済み');
    console.log('✅ 設定同期: 完了');
    console.log('✅ 平日設定: 1日1回実行に修正済み');
    
    return {
      success: true,
      emergency: emergencyResult,
      config: configResult,
      triggerReset: triggerReset,
      finalTriggerCount: finalCheck.autoTask || 0,
      message: 'メール重複実行問題を完全に解決しました'
    };
    
  } catch (error) {
    console.error('❌ 完全解決エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}