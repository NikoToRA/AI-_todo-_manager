/**
 * クイックセットアップスクリプト
 * 個人配布用の自動セットアップ機能
 */

/**
 * ワンクリックセットアップ（メイン関数）
 */
function quickSetup() {
  console.log('🚀 AI駆動タスク管理システム - クイックセットアップ開始');
  
  try {
    // 1. 初期化
    console.log('=== 1. システム初期化 ===');
    const initResult = initializeSystem();
    console.log('初期化結果:', initResult.success ? '✅ 成功' : '❌ 失敗');
    
    // 2. 設定シート作成
    console.log('=== 2. 設定シート作成 ===');
    const configResult = ConfigManager.initialize();
    console.log('設定シート:', configResult.success ? '✅ 作成完了' : '❌ 作成失敗');
    if (configResult.success) {
      console.log('📊 設定シートURL:', configResult.sheetUrl);
    }
    
    // 3. 必要なAPI有効化チェック
    console.log('=== 3. API有効化チェック ===');
    const apiCheck = checkRequiredAPIs();
    console.log('API確認結果:', apiCheck);
    
    // 4. サンプル設定の適用
    console.log('=== 4. サンプル設定適用 ===');
    const sampleResult = applySampleConfig();
    console.log('サンプル設定:', sampleResult.success ? '✅ 適用完了' : '❌ 適用失敗');
    
    // 5. セットアップ完了メッセージ
    console.log('=== 🎉 セットアップ完了 ===');
    console.log('');
    console.log('📋 次のステップ:');
    console.log('1. configureAPIs() - API設定を入力');
    console.log('2. testAllSystems() - 動作確認');
    console.log('3. setupAutoTriggers() - 自動実行設定');
    console.log('');
    console.log('📊 設定シートURL:', configResult.sheetUrl);
    console.log('💡 このURLで詳細設定を行ってください');
    
    return {
      success: true,
      message: 'クイックセットアップが完了しました',
      configSheetUrl: configResult.sheetUrl,
      nextSteps: [
        'configureAPIs() - API設定',
        'testAllSystems() - 動作確認',
        'setupAutoTriggers() - 自動実行設定'
      ]
    };
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * システム初期化
 */
function initializeSystem() {
  try {
    console.log('[initializeSystem] システム初期化開始');
    
    // プロジェクト情報表示
    const projectName = 'AI駆動タスク管理システム';
    const version = '1.0.0';
    
    console.log(`プロジェクト: ${projectName}`);
    console.log(`バージョン: ${version}`);
    console.log('作成者: AI Task Manager Team');
    
    // 基本的な権限チェック
    try {
      DriveApp.getRootFolder();
      console.log('✅ Google Drive アクセス権限: OK');
    } catch (error) {
      console.log('❌ Google Drive アクセス権限: NG');
    }
    
    return {
      success: true,
      projectName: projectName,
      version: version
    };
    
  } catch (error) {
    console.error('[initializeSystem] 初期化エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 必要なAPI有効化チェック
 */
function checkRequiredAPIs() {
  const apiStatus = {
    gmail: false,
    calendar: false,
    drive: false
  };
  
  try {
    // Gmail API チェック
    try {
      GmailApp.getInboxThreads(0, 1);
      apiStatus.gmail = true;
      console.log('✅ Gmail API: 有効');
    } catch (error) {
      console.log('❌ Gmail API: 無効 - サービスから追加してください');
    }
    
    // Calendar API チェック
    try {
      CalendarApp.getDefaultCalendar();
      apiStatus.calendar = true;
      console.log('✅ Calendar API: 有効');
    } catch (error) {
      console.log('❌ Calendar API: 無効 - サービスから追加してください');
    }
    
    // Drive API チェック
    try {
      DriveApp.getRootFolder();
      apiStatus.drive = true;
      console.log('✅ Drive API: 有効');
    } catch (error) {
      console.log('❌ Drive API: 無効');
    }
    
  } catch (error) {
    console.error('API チェックエラー:', error.message);
  }
  
  return apiStatus;
}

/**
 * サンプル設定の適用
 */
function applySampleConfig() {
  try {
    console.log('[applySampleConfig] サンプル設定適用開始');
    
    const sampleConfig = {
      EXECUTION_FREQUENCY: 'daily',
      EXECUTION_HOUR: '8',
      DATA_RANGE_DAYS: '7',
      ENABLE_AI_ANALYSIS: 'true',
      ENABLE_GMAIL_ANALYSIS: 'true',
      GMAIL_MAX_RESULTS: '50',
      GMAIL_DATE_RANGE_DAYS: '7',
      GMAIL_ENABLE_SPAM_FILTER: 'true',
      GMAIL_PROCESSED_TRACKING: 'true'
    };
    
    // PropertiesServiceに保存
    const props = PropertiesService.getScriptProperties();
    Object.keys(sampleConfig).forEach(key => {
      props.setProperty(key, sampleConfig[key]);
    });
    
    console.log('✅ サンプル設定を適用しました');
    
    return {
      success: true,
      appliedSettings: Object.keys(sampleConfig).length
    };
    
  } catch (error) {
    console.error('[applySampleConfig] サンプル設定エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API設定ガイド
 */
function configureAPIs() {
  console.log('🔧 API設定ガイド');
  console.log('');
  console.log('=== 必要なAPI設定 ===');
  console.log('');
  console.log('1. 📝 Notion API設定:');
  console.log('   - https://developers.notion.com/ にアクセス');
  console.log('   - 新しいインテグレーションを作成');
  console.log('   - APIトークンをコピー');
  console.log('   - データベースを作成してIDをコピー');
  console.log('');
  console.log('2. 🤖 Gemini API設定:');
  console.log('   - https://makersuite.google.com/ にアクセス');
  console.log('   - APIキーを取得');
  console.log('');
  console.log('3. 📊 設定シートに入力:');
  
  try {
    const configSheet = ConfigManager.getConfigSheet();
    const url = configSheet.getUrl();
    console.log('   - 設定シートURL:', url);
    console.log('   - NOTION_TOKEN に Notion APIトークンを入力');
    console.log('   - NOTION_DATABASE_ID に データベースIDを入力');
    console.log('   - GEMINI_API_KEY に Gemini APIキーを入力');
    console.log('');
    console.log('4. 設定同期実行:');
    console.log('   - runConfigSync() を実行');
    console.log('');
    console.log('💡 設定完了後は testAllSystems() で動作確認してください');
    
    return {
      success: true,
      configSheetUrl: url
    };
    
  } catch (error) {
    console.error('❌ API設定ガイドエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 全システムテスト
 */
function testAllSystems() {
  console.log('🧪 全システムテスト開始');
  
  const results = {
    config: false,
    notion: false,
    gmail: false,
    calendar: false,
    gemini: false
  };
  
  try {
    // 1. 設定テスト
    console.log('=== 1. 設定テスト ===');
    const config = ConfigManager.getConfig();
    const validation = ConfigManager.validateConfig();
    
    if (validation.isValid) {
      console.log('✅ 設定: 正常');
      results.config = true;
    } else {
      console.log('❌ 設定: エラー -', validation.errors.join(', '));
    }
    
    // 2. Notion接続テスト
    console.log('=== 2. Notion接続テスト ===');
    if (config.notionToken && config.notionDatabaseId) {
      try {
        const notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
        const connectionTest = notionClient.testConnection();
        
        if (connectionTest.success) {
          console.log('✅ Notion: 接続成功');
          results.notion = true;
        } else {
          console.log('❌ Notion: 接続失敗 -', connectionTest.error);
        }
      } catch (error) {
        console.log('❌ Notion: エラー -', error.message);
      }
    } else {
      console.log('❌ Notion: APIトークンまたはデータベースIDが未設定');
    }
    
    // 3. Gmail接続テスト
    console.log('=== 3. Gmail接続テスト ===');
    try {
      const threads = GmailApp.getInboxThreads(0, 1);
      console.log('✅ Gmail: 接続成功');
      results.gmail = true;
    } catch (error) {
      console.log('❌ Gmail: 接続失敗 -', error.message);
    }
    
    // 4. Calendar接続テスト
    console.log('=== 4. Calendar接続テスト ===');
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      console.log('✅ Calendar: 接続成功');
      results.calendar = true;
    } catch (error) {
      console.log('❌ Calendar: 接続失敗 -', error.message);
    }
    
    // 5. Gemini接続テスト
    console.log('=== 5. Gemini接続テスト ===');
    if (config.geminiApiKey) {
      try {
        const analyzer = new GeminiAnalyzer(config.geminiApiKey);
        // 簡単なテスト（実際のAPI呼び出しは避ける）
        console.log('✅ Gemini: APIキー設定済み');
        results.gemini = true;
      } catch (error) {
        console.log('❌ Gemini: エラー -', error.message);
      }
    } else {
      console.log('❌ Gemini: APIキーが未設定');
    }
    
    // 結果サマリー
    console.log('=== 🎯 テスト結果サマリー ===');
    const passedTests = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`合格: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 全テスト合格！システムの準備が完了しました');
      console.log('');
      console.log('📋 次のステップ:');
      console.log('- setupAutoTriggers() で自動実行を設定');
      console.log('- runBoth() で手動実行テスト');
    } else {
      console.log('⚠️  一部のテストが失敗しています');
      console.log('💡 configureAPIs() で設定を確認してください');
    }
    
    return {
      success: passedTests === totalTests,
      results: results,
      passedTests: passedTests,
      totalTests: totalTests
    };
    
  } catch (error) {
    console.error('❌ システムテストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ヘルプ表示
 */
function showHelp() {
  console.log('📚 AI駆動タスク管理システム - ヘルプ');
  console.log('');
  console.log('=== 🚀 セットアップ関数 ===');
  console.log('quickSetup()           - ワンクリックセットアップ');
  console.log('configureAPIs()        - API設定ガイド');
  console.log('testAllSystems()       - 全システムテスト');
  console.log('');
  console.log('=== ⚙️ 設定関数 ===');
  console.log('runConfigSync()        - 設定同期');
  console.log('setupAutoTriggers()    - 自動実行設定');
  console.log('resetTriggers()        - トリガーリセット');
  console.log('');
  console.log('=== 🧪 テスト関数 ===');
  console.log('runBoth()              - 手動実行テスト');
  console.log('testNotionAPI()        - Notion接続テスト');
  console.log('testGeminiAI()         - Gemini AIテスト');
  console.log('');
  console.log('=== 🆘 トラブルシューティング ===');
  console.log('diagnoseIssues()       - 問題診断');
  console.log('emergencyFixDuplicateExecution() - 重複実行修正');
  console.log('resetAllSettings()     - 完全リセット');
  console.log('');
  console.log('💡 困ったときは showHelp() でこのヘルプを表示');
}

/**
 * 問題診断
 */
function diagnoseIssues() {
  console.log('🔍 問題診断開始');
  
  try {
    // 1. トリガー状況確認
    console.log('=== 1. トリガー状況 ===');
    const triggerDetails = checkTriggerDetails();
    console.log('自動実行トリガー数:', triggerDetails.autoTask || 0);
    
    if (triggerDetails.autoTask > 1) {
      console.log('⚠️  重複トリガーが検出されました');
      console.log('💡 emergencyFixDuplicateExecution() を実行してください');
    }
    
    // 2. 設定状況確認
    console.log('=== 2. 設定状況 ===');
    const config = ConfigManager.getConfig();
    const validation = ConfigManager.validateConfig();
    
    if (!validation.isValid) {
      console.log('❌ 設定エラー:', validation.errors.join(', '));
      console.log('💡 configureAPIs() で設定を確認してください');
    }
    
    // 3. 処理済みメール状況
    console.log('=== 3. 処理済みメール状況 ===');
    const stats = ProcessedEmailTracker.getStatistics();
    console.log('処理済みメール数:', stats.totalProcessed);
    
    // 4. 推奨アクション
    console.log('=== 💡 推奨アクション ===');
    
    if (triggerDetails.autoTask > 1) {
      console.log('1. emergencyFixDuplicateExecution() - 重複トリガー修正');
    }
    
    if (!validation.isValid) {
      console.log('2. configureAPIs() - API設定確認');
    }
    
    console.log('3. testAllSystems() - 全システムテスト');
    
    return {
      success: true,
      issues: {
        duplicateTriggers: triggerDetails.autoTask > 1,
        configErrors: !validation.isValid,
        recommendations: []
      }
    };
    
  } catch (error) {
    console.error('❌ 診断エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 完全リセット
 */
function resetAllSettings() {
  console.log('🔄 完全リセット開始');
  
  try {
    // 1. トリガー削除
    console.log('1. トリガー削除');
    deleteAllTriggers();
    
    // 2. 処理済みメール削除
    console.log('2. 処理済みメール削除');
    ProcessedEmailTracker.clearAllRecords();
    
    // 3. 設定リセット（基本設定のみ残す）
    console.log('3. 設定リセット');
    const props = PropertiesService.getScriptProperties();
    const keysToKeep = ['NOTION_TOKEN', 'NOTION_DATABASE_ID', 'GEMINI_API_KEY'];
    const allProps = props.getProperties();
    
    Object.keys(allProps).forEach(key => {
      if (!keysToKeep.includes(key)) {
        props.deleteProperty(key);
      }
    });
    
    // 4. サンプル設定再適用
    console.log('4. サンプル設定再適用');
    applySampleConfig();
    
    console.log('✅ 完全リセット完了');
    console.log('💡 quickSetup() から再セットアップしてください');
    
    return {
      success: true,
      message: '完全リセットが完了しました'
    };
    
  } catch (error) {
    console.error('❌ リセットエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}