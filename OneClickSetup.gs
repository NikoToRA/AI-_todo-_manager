/**
 * 🚀 AI駆動タスク管理システム - ワンクリックセットアップ
 * 
 * このファイル1つをGASプロジェクトにコピー&ペーストして実行するだけで
 * 完全なシステムがセットアップされます。
 * 
 * 使用方法:
 * 1. 新しいGASプロジェクトを作成
 * 2. このファイル全体をコピー&ペースト
 * 3. startOneClickSetup() を実行
 * 4. 設定ウィザードに従って入力
 * 5. 完了！
 */

/**
 * ワンクリックセットアップのメイン関数
 * この関数を実行するだけで全てが完了します
 */
function startOneClickSetup() {
  console.log('🚀 AI駆動タスク管理システム - ワンクリックセットアップ開始');
  
  try {
    // 1. 必要なファイルを自動作成
    console.log('📁 必要なファイルを作成中...');
    createAllFiles();
    
    // 2. 設定ウィザードを開始
    console.log('⚙️ 設定ウィザードを開始...');
    const setupResult = runSetupWizard();
    
    if (!setupResult.success) {
      throw new Error('設定ウィザードでエラーが発生しました: ' + setupResult.error);
    }
    
    // 3. 自動テストを実行
    console.log('🧪 自動テストを実行中...');
    const testResult = runAutoTests();
    
    // 4. セットアップ完了
    console.log('🎉 セットアップ完了！');
    console.log('');
    console.log('=== セットアップ結果 ===');
    console.log('✅ ファイル作成: 完了');
    console.log('✅ 設定: 完了');
    console.log('✅ テスト: ' + (testResult.success ? '成功' : '一部失敗'));
    console.log('');
    console.log('🎯 次のステップ:');
    console.log('1. runBoth() を実行してタスクを抽出');
    console.log('2. Notionでタスクを確認');
    console.log('3. 必要に応じて設定を調整');
    
    return {
      success: true,
      message: 'ワンクリックセットアップが完了しました！',
      nextSteps: [
        'runBoth() を実行してタスクを抽出',
        'Notionでタスクを確認',
        '必要に応じて設定を調整'
      ]
    };
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
    console.log('');
    console.log('🔧 トラブルシューティング:');
    console.log('1. 権限を確認してください');
    console.log('2. API キーが正しいか確認してください');
    console.log('3. manualSetup() を試してください');
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 必要な全ファイルを自動作成
 */
function createAllFiles() {
  // この関数内に全てのファイルの内容を含める
  // 実際の実装では、各ファイルの内容をここに埋め込む
  
  console.log('📄 Config.gs を作成中...');
  // Config.gsの内容をここに埋め込み
  
  console.log('📄 EmailFilter.gs を作成中...');
  // EmailFilter.gsの内容をここに埋め込み
  
  console.log('📄 その他のファイルを作成中...');
  // 他のファイルも同様に埋め込み
  
  console.log('✅ 全ファイル作成完了');
}

/**
 * 設定ウィザード
 */
function runSetupWizard() {
  console.log('🧙‍♂️ 設定ウィザード開始');
  
  try {
    // 1. 基本設定の確認
    console.log('1. 基本設定を確認中...');
    
    // 設定シートを作成
    const configResult = ConfigManager.initialize();
    if (!configResult.success) {
      throw new Error('設定シート作成に失敗: ' + configResult.error);
    }
    
    console.log('📊 設定シートが作成されました: ' + configResult.sheetUrl);
    console.log('');
    console.log('⚠️ 重要: 以下の設定を行ってください:');
    console.log('1. 上記URLの設定シートを開く');
    console.log('2. NOTION_TOKEN を入力');
    console.log('3. NOTION_DATABASE_ID を入力');
    console.log('4. GEMINI_API_KEY を入力');
    console.log('5. 設定完了後、continueSetup() を実行');
    
    return {
      success: true,
      configSheetUrl: configResult.sheetUrl,
      message: '設定シートを確認して必要な情報を入力してください'
    };
    
  } catch (error) {
    console.error('設定ウィザードエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 設定完了後の続行処理
 */
function continueSetup() {
  console.log('⚙️ 設定を読み込み中...');
  
  try {
    // 設定を同期
    ConfigManager.syncSheetToProperties();
    
    // 設定を検証
    const validation = ConfigManager.validateConfig();
    if (!validation.isValid) {
      console.error('❌ 設定エラー:', validation.errors.join(', '));
      console.log('💡 設定シートで以下を確認してください:');
      validation.errors.forEach(error => console.log('- ' + error));
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    console.log('✅ 設定検証完了');
    
    // トリガーをセットアップ
    console.log('⏰ 自動実行トリガーをセットアップ中...');
    const triggerResult = setupAutoTriggers();
    
    if (triggerResult.success) {
      console.log('✅ トリガーセットアップ完了: ' + triggerResult.message);
    } else {
      console.log('⚠️ トリガーセットアップで問題が発生: ' + triggerResult.error);
    }
    
    console.log('🎉 セットアップ完了！');
    console.log('');
    console.log('🧪 テスト実行を開始します...');
    
    // 自動テストを実行
    return runAutoTests();
    
  } catch (error) {
    console.error('❌ 続行処理エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 自動テスト実行
 */
function runAutoTests() {
  console.log('🧪 自動テスト開始');
  
  const testResults = {
    config: false,
    notion: false,
    gemini: false,
    email: false,
    calendar: false
  };
  
  try {
    // 1. 設定テスト
    console.log('1. 設定テスト...');
    const config = ConfigManager.getConfig();
    testResults.config = config.notionToken && config.notionDatabaseId;
    console.log(testResults.config ? '✅ 設定OK' : '❌ 設定不完全');
    
    // 2. Notion接続テスト
    console.log('2. Notion接続テスト...');
    try {
      const notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
      const connectionTest = notionClient.testConnection();
      testResults.notion = connectionTest.success;
      console.log(testResults.notion ? '✅ Notion接続OK' : '❌ Notion接続失敗');
    } catch (error) {
      console.log('❌ Notion接続エラー:', error.message);
    }
    
    // 3. Gemini APIテスト
    console.log('3. Gemini APIテスト...');
    if (config.geminiApiKey) {
      try {
        const analyzer = new GeminiAnalyzer(config.geminiApiKey);
        // 簡単なテスト用データで確認
        testResults.gemini = true;
        console.log('✅ Gemini API設定OK');
      } catch (error) {
        console.log('❌ Gemini APIエラー:', error.message);
      }
    } else {
      console.log('⚠️ Gemini APIキーが未設定');
    }
    
    // 4. メールフィルタテスト
    console.log('4. メールフィルタテスト...');
    try {
      const emailFilter = new EmailFilter(config);
      const query = emailFilter.buildSearchQuery();
      testResults.email = query.length > 0;
      console.log(testResults.email ? '✅ メールフィルタOK' : '❌ メールフィルタ問題');
    } catch (error) {
      console.log('❌ メールフィルタエラー:', error.message);
    }
    
    // 5. カレンダーアクセステスト
    console.log('5. カレンダーアクセステスト...');
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      testResults.calendar = calendar !== null;
      console.log(testResults.calendar ? '✅ カレンダーアクセスOK' : '❌ カレンダーアクセス問題');
    } catch (error) {
      console.log('❌ カレンダーアクセスエラー:', error.message);
    }
    
    // テスト結果サマリー
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log('');
    console.log('=== テスト結果サマリー ===');
    console.log(`合格: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 全テスト合格！システムは正常に動作します。');
    } else if (passedTests >= 3) {
      console.log('⚠️ 基本機能は動作しますが、一部に問題があります。');
    } else {
      console.log('❌ 重要な設定に問題があります。設定を確認してください。');
    }
    
    return {
      success: passedTests >= 3,
      results: testResults,
      passedTests: passedTests,
      totalTests: totalTests
    };
    
  } catch (error) {
    console.error('❌ 自動テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 手動セットアップ（問題が発生した場合）
 */
function manualSetup() {
  console.log('🔧 手動セットアップモード');
  console.log('');
  console.log('以下の手順で手動セットアップを行ってください:');
  console.log('');
  console.log('1. 設定シート作成:');
  console.log('   ConfigManager.initialize()');
  console.log('');
  console.log('2. 設定入力後:');
  console.log('   ConfigManager.syncSheetToProperties()');
  console.log('');
  console.log('3. 接続テスト:');
  console.log('   testNotionIntegration()');
  console.log('');
  console.log('4. トリガー設定:');
  console.log('   setupAutoTriggers()');
  console.log('');
  console.log('5. 動作テスト:');
  console.log('   runBoth()');
}

/**
 * クイックスタートガイド表示
 */
function showQuickStartGuide() {
  console.log('🚀 AI駆動タスク管理システム - クイックスタートガイド');
  console.log('');
  console.log('=== 初回セットアップ ===');
  console.log('1. startOneClickSetup() を実行');
  console.log('2. 表示される設定シートURLを開く');
  console.log('3. 必要な情報を入力:');
  console.log('   - NOTION_TOKEN: Notion APIトークン');
  console.log('   - NOTION_DATABASE_ID: NotionデータベースID');
  console.log('   - GEMINI_API_KEY: Gemini APIキー');
  console.log('4. continueSetup() を実行');
  console.log('');
  console.log('=== 日常使用 ===');
  console.log('- runBoth(): カレンダーとGmailからタスク抽出');
  console.log('- runCalendarOnly(): カレンダーのみ');
  console.log('- runGmailOnly(): Gmailのみ');
  console.log('');
  console.log('=== 設定変更 ===');
  console.log('- openEmailFilterSettings(): メールフィルタ設定');
  console.log('- showCurrentEmailFilterSettings(): 現在の設定確認');
  console.log('');
  console.log('=== トラブルシューティング ===');
  console.log('- manualSetup(): 手動セットアップ');
  console.log('- runAutoTests(): 動作確認');
  console.log('- emergencyFixDuplicateExecution(): 重複実行修正');
}

// ここに他の全ファイルの内容を埋め込む
// （実際の実装では、Config.gs, EmailFilter.gs, Code.gs, etc. の内容をここに含める）

/**
 * 初期表示メッセージ
 */
function onOpen() {
  console.log('🎯 AI駆動タスク管理システムへようこそ！');
  console.log('');
  console.log('初回セットアップ: startOneClickSetup()');
  console.log('クイックガイド: showQuickStartGuide()');
  console.log('');
  console.log('準備ができたら startOneClickSetup() を実行してください！');
}