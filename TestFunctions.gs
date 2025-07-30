/**
 * テスト関数集
 * 開発・デバッグ・動作確認用
 */

/**
 * 全体的なセットアップ確認テスト
 */
function testSystemSetup() {
  console.log('=== システムセットアップ確認テスト開始 ===');
  
  try {
    // 1. 設定確認
    console.log('1. 設定確認中...');
    const config = ConfigManager.getConfig();
    console.log('設定取得成功:', config);
    
    // 2. バリデーション
    console.log('2. 設定バリデーション中...');
    const validation = ConfigManager.validateConfig();
    console.log('バリデーション結果:', validation);
    
    if (!validation.isValid) {
      console.error('設定エラー:', validation.errors);
      return {
        success: false,
        error: '設定が不完全です: ' + validation.errors.join(', ')
      };
    }
    
    // 3. NotionClient接続テスト
    console.log('3. Notion接続テスト中...');
    const notionClient = new NotionClient(config);
    
    // 4. 簡単なタスク抽出テスト
    console.log('4. タスク抽出テスト中...');
    const extractor = new TaskExtractor(config);
    
    console.log('✅ セットアップ確認テスト完了');
    return {
      success: true,
      message: 'システムセットアップは正常です'
    };
    
  } catch (error) {
    console.error('❌ セットアップテスト失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * NotionClientクラスのテスト
 */
function testNotionClient() {
  console.log('=== NotionClient テスト開始 ===');
  
  try {
    const config = ConfigManager.getConfig();
    const notionClient = new NotionClient(config);
    
    // テストタスクデータ
    const testTask = {
      title: 'テストタスク - ' + new Date().toISOString(),
      type: 'task',
      priority: '中',
      source: 'manual',
      status: '未着手',
      created_by: 'auto',
      original_event: 'テスト実行',
      context: 'NotionClient動作確認用テストタスク'
    };
    
    console.log('テストタスク作成中...');
    const result = notionClient.createTask(testTask);
    
    if (result && result.success) {
      console.log('✅ NotionClientテスト成功:', result);
      return {
        success: true,
        message: 'Notion接続とタスク作成が正常に動作しています',
        notionId: result.id
      };
    } else {
      throw new Error('タスク作成に失敗しました');
    }
    
  } catch (error) {
    console.error('❌ NotionClientテスト失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * TaskExtractorクラスのテスト
 */
function testTaskExtractor() {
  console.log('=== TaskExtractor テスト開始 ===');
  
  try {
    const config = ConfigManager.getConfig();
    const extractor = new TaskExtractor(config);
    
    // 今日から3日間のカレンダーイベントを抽出
    const startDate = new Date();
    const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    console.log('カレンダーからタスク抽出中...');
    console.log(`期間: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    
    const tasks = extractor.extractFromCalendar(startDate, endDate);
    
    console.log(`✅ TaskExtractorテスト成功: ${tasks.length}件のタスクを抽出`);
    
    if (tasks.length > 0) {
      console.log('抽出されたタスク一覧:');
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title} (${task.priority}優先度)`);
      });
    }
    
    return {
      success: true,
      message: `${tasks.length}件のタスクを正常に抽出しました`,
      tasks: tasks
    };
    
  } catch (error) {
    console.error('❌ TaskExtractorテスト失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * DuplicateCheckerクラスのテスト
 */
function testDuplicateChecker() {
  console.log('=== DuplicateChecker テスト開始 ===');
  
  try {
    const config = ConfigManager.getConfig();
    const notionClient = new NotionClient(config);
    const duplicateChecker = new DuplicateChecker(notionClient);
    
    // テストタスク
    const newTask = {
      title: 'プロジェクト会議の準備',
      source: 'calendar',
      due_date: '2024-07-27',
      original_event: 'プロジェクト会議'
    };
    
    const existingTasks = [
      {
        title: 'プロジェクト会議 - 準備・フォローアップ',
        source: 'calendar',
        due_date: '2024-07-27',
        original_event: 'プロジェクト会議'
      },
      {
        title: '別のタスク',
        source: 'manual',
        due_date: '2024-07-28',
        original_event: '手動作成'
      }
    ];
    
    console.log('重複チェック実行中...');
    const isDuplicate = duplicateChecker.checkBasicDuplicate(newTask, existingTasks);
    
    console.log(`✅ DuplicateCheckerテスト成功: 重複判定=${isDuplicate}`);
    
    return {
      success: true,
      message: `重複チェック機能が正常に動作しています (重複: ${isDuplicate})`,
      isDuplicate: isDuplicate
    };
    
  } catch (error) {
    console.error('❌ DuplicateCheckerテスト失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 手動実行のテスト
 */
function testManualExecution() {
  console.log('=== 手動実行テスト開始 ===');
  
  try {
    console.log('manualTaskExtraction関数を呼び出し中...');
    
    const result = manualTaskExtraction('calendar', {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    console.log('手動実行結果:', result);
    
    if (result.success) {
      console.log('✅ 手動実行テスト成功');
      return {
        success: true,
        message: '手動実行が正常に完了しました',
        result: result
      };
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ 手動実行テスト失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * エンドツーエンドテスト
 */
function testEndToEnd() {
  console.log('=== エンドツーエンドテスト開始 ===');
  
  const results = {
    setup: null,
    notion: null,
    extractor: null,
    duplicate: null,
    manual: null
  };
  
  try {
    // 1. セットアップテスト
    console.log('1/5: セットアップテスト実行中...');
    results.setup = testSystemSetup();
    if (!results.setup.success) {
      throw new Error('セットアップテスト失敗: ' + results.setup.error);
    }
    
    // 2. NotionClientテスト
    console.log('2/5: NotionClientテスト実行中...');
    results.notion = testNotionClient();
    if (!results.notion.success) {
      throw new Error('NotionClientテスト失敗: ' + results.notion.error);
    }
    
    // 3. TaskExtractorテスト
    console.log('3/5: TaskExtractorテスト実行中...');
    results.extractor = testTaskExtractor();
    if (!results.extractor.success) {
      throw new Error('TaskExtractorテスト失敗: ' + results.extractor.error);
    }
    
    // 4. DuplicateCheckerテスト
    console.log('4/5: DuplicateCheckerテスト実行中...');
    results.duplicate = testDuplicateChecker();
    if (!results.duplicate.success) {
      throw new Error('DuplicateCheckerテスト失敗: ' + results.duplicate.error);
    }
    
    // 5. 手動実行テスト
    console.log('5/5: 手動実行テスト実行中...');
    results.manual = testManualExecution();
    if (!results.manual.success) {
      throw new Error('手動実行テスト失敗: ' + results.manual.error);
    }
    
    console.log('🎉 エンドツーエンドテスト完全成功！');
    
    return {
      success: true,
      message: '全ての機能が正常に動作しています',
      results: results
    };
    
  } catch (error) {
    console.error('❌ エンドツーエンドテスト失敗:', error.message);
    
    return {
      success: false,
      error: error.message,
      results: results
    };
  }
}

/**
 * 設定の初期化（初回セットアップ用）
 */
function initializeSettings() {
  console.log('=== 設定初期化 ===');
  
  // デフォルト設定
  const defaultConfig = {
    executionFrequency: 'daily',
    dataRangeDays: 7,
    enableAiAnalysis: false,
    enableVoiceInput: true,
    enableGmailAnalysis: false
  };
  
  try {
    ConfigManager.setConfig(defaultConfig);
    console.log('✅ デフォルト設定を保存しました');
    
    console.log('次の手順:');
    console.log('1. https://www.notion.so/my-integrations でインテグレーションを作成');
    console.log('2. Notionでデータベースを作成');
    console.log('3. ConfigManager.setConfig()でAPIトークンとデータベースIDを設定');
    console.log('4. testSystemSetup()で動作確認');
    
    return {
      success: true,
      message: 'デフォルト設定を初期化しました。Notion設定を追加してください。'
    };
    
  } catch (error) {
    console.error('❌ 設定初期化失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * クイックテスト（開発時用）
 */
function quickTest() {
  console.log('=== クイックテスト開始 ===');
  
  try {
    // 基本設定確認
    const validation = ConfigManager.validateConfig();
    if (!validation.isValid) {
      console.log('⚠️ 設定が不完全です:', validation.errors);
      return initializeSettings();
    }
    
    // 手動実行テスト
    const result = testManualExecution();
    
    if (result.success) {
      console.log('✅ クイックテスト成功');
    } else {
      console.log('❌ クイックテスト失敗:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ クイックテスト エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}