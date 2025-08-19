/**
 * 基本的なシステム動作確認テスト
 * GAS互換性テスト用（ES5準拠）
 */

/**
 * システム全体の動作確認
 */
function runBasicSystemCheck() {
  console.log('=== 基本システム動作確認 ===');
  
  var results = {
    configTest: false,
    notionTest: false,
    calendarTest: false,
    gmailTest: false,
    errors: []
  };
  
  try {
    // 1. 設定確認
    console.log('1. 設定確認中...');
    try {
      var config = getBasicConfig();
      if (config && config.notionToken) {
        results.configTest = true;
        console.log('✅ 設定読み込み成功');
      } else {
        results.errors.push('設定が不完全です');
        console.log('❌ 設定が不完全');
      }
    } catch (error) {
      results.errors.push('設定読み込みエラー: ' + error.message);
      console.log('❌ 設定読み込みエラー:', error.message);
    }
    
    // 2. Notion接続テスト
    if (results.configTest) {
      console.log('2. Notion接続テスト中...');
      try {
        var notionResult = testNotionConnection();
        if (notionResult && notionResult.success) {
          results.notionTest = true;
          console.log('✅ Notion接続成功');
        } else {
          results.errors.push('Notion接続失敗');
          console.log('❌ Notion接続失敗');
        }
      } catch (error) {
        results.errors.push('Notion接続エラー: ' + error.message);
        console.log('❌ Notion接続エラー:', error.message);
      }
    }
    
    // 3. カレンダー接続テスト
    console.log('3. カレンダー接続テスト中...');
    try {
      var calendars = CalendarApp.getAllCalendars();
      if (calendars && calendars.length > 0) {
        results.calendarTest = true;
        console.log('✅ カレンダー接続成功 (' + calendars.length + '個のカレンダー)');
      } else {
        results.errors.push('カレンダーが見つかりません');
        console.log('❌ カレンダーが見つかりません');
      }
    } catch (error) {
      results.errors.push('カレンダー接続エラー: ' + error.message);
      console.log('❌ カレンダー接続エラー:', error.message);
    }
    
    // 4. Gmail接続テスト
    console.log('4. Gmail接続テスト中...');
    try {
      var threads = GmailApp.search('in:inbox', 0, 1);
      results.gmailTest = true;
      console.log('✅ Gmail接続成功');
    } catch (error) {
      results.errors.push('Gmail接続エラー: ' + error.message);
      console.log('❌ Gmail接続エラー:', error.message);
    }
    
    // 結果サマリー
    console.log('\n=== テスト結果サマリー ===');
    console.log('設定: ' + (results.configTest ? '✅' : '❌'));
    console.log('Notion: ' + (results.notionTest ? '✅' : '❌'));
    console.log('カレンダー: ' + (results.calendarTest ? '✅' : '❌'));
    console.log('Gmail: ' + (results.gmailTest ? '✅' : '❌'));
    
    if (results.errors.length > 0) {
      console.log('\n⚠️ 検出されたエラー:');
      for (var i = 0; i < results.errors.length; i++) {
        console.log('- ' + results.errors[i]);
      }
    }
    
    var overallSuccess = results.configTest && results.notionTest && results.calendarTest && results.gmailTest;
    console.log('\n総合結果: ' + (overallSuccess ? '✅ 全テスト合格' : '❌ 一部テスト失敗'));
    
    return results;
    
  } catch (error) {
    console.error('❌ システムチェックで重大エラー:', error.message);
    results.errors.push('システムチェックエラー: ' + error.message);
    return results;
  }
}

/**
 * 基本設定を取得（ES5互換）
 */
function getBasicConfig() {
  try {
    var props = PropertiesService.getScriptProperties();
    return {
      notionToken: props.getProperty('NOTION_TOKEN'),
      notionDatabaseId: props.getProperty('NOTION_DATABASE_ID'),
      geminiApiKey: props.getProperty('GEMINI_API_KEY')
    };
  } catch (error) {
    console.error('設定取得エラー:', error.message);
    throw error;
  }
}

/**
 * 簡単なNotion接続テスト
 */
function testNotionConnection() {
  try {
    var config = getBasicConfig();
    
    if (!config.notionToken || !config.notionDatabaseId) {
      return {
        success: false,
        error: 'Notion認証情報が不完全です'
      };
    }
    
    // データベースIDのクリーンアップ
    var cleanDatabaseId = config.notionDatabaseId.replace(/\n/g, '').trim();
    var url = 'https://api.notion.com/v1/databases/' + cleanDatabaseId;
    
    var options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + config.notionToken,
        'Notion-Version': '2022-06-28'
      },
      muteHttpExceptions: true,
      timeout: 15000
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      var data = JSON.parse(response.getContentText());
      return {
        success: true,
        databaseTitle: data.title && data.title.length > 0 ? data.title[0].text.content : 'Unknown'
      };
    } else {
      return {
        success: false,
        error: 'Notion API エラー: ' + responseCode + ' - ' + response.getContentText()
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 簡単なタスク作成テスト
 */
function testCreateSimpleTask() {
  console.log('=== 簡単タスク作成テスト ===');
  
  try {
    var config = getBasicConfig();
    
    if (!config.notionToken || !config.notionDatabaseId) {
      console.error('❌ Notion認証情報が設定されていません');
      return false;
    }
    
    var taskData = {
      title: 'テストタスク - ' + new Date().toLocaleString('ja-JP'),
      type: 'task',
      priority: '中',
      source: 'test',
      created_by: 'auto',
      context: '基本テストで作成されたテストタスクです'
    };
    
    var result = createNotionTask(config, taskData);
    
    if (result && result.success) {
      console.log('✅ テストタスク作成成功:', taskData.title);
      console.log('📝 Notion URL:', result.url);
      return true;
    } else {
      console.error('❌ テストタスク作成失敗:', result ? result.error : 'unknown error');
      return false;
    }
    
  } catch (error) {
    console.error('❌ テストタスク作成エラー:', error.message);
    return false;
  }
}

/**
 * Notionタスク作成関数（ES5互換）
 */
function createNotionTask(config, taskData) {
  try {
    var cleanDatabaseId = config.notionDatabaseId.replace(/\n/g, '').trim();
    var url = 'https://api.notion.com/v1/pages';
    
    var properties = {
      'title': {
        'title': [
          {
            'text': {
              'content': taskData.title || 'Untitled'
            }
          }
        ]
      }
    };
    
    // 追加プロパティ
    if (taskData.type) {
      properties['type'] = { 'select': { 'name': taskData.type } };
    }
    
    if (taskData.priority) {
      properties['priority'] = { 'select': { 'name': taskData.priority } };
    }
    
    if (taskData.source) {
      properties['source'] = { 'select': { 'name': taskData.source } };
    }
    
    if (taskData.created_by) {
      properties['created_by'] = { 'select': { 'name': taskData.created_by } };
    }
    
    var payload = {
      'parent': { 'database_id': cleanDatabaseId },
      'properties': properties
    };
    
    // コンテキストがある場合はページ本文に追加
    if (taskData.context) {
      payload['children'] = [{
        'object': 'block',
        'type': 'paragraph',
        'paragraph': {
          'rich_text': [{
            'type': 'text',
            'text': { 'content': taskData.context }
          }]
        }
      }];
    }
    
    var options = {
      'method': 'POST',
      'headers': {
        'Authorization': 'Bearer ' + config.notionToken,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true,
      'timeout': 30000
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (responseCode === 200 || responseCode === 201) {
      var data = JSON.parse(responseText);
      return {
        success: true,
        id: data.id,
        url: data.url,
        title: taskData.title
      };
    } else {
      return {
        success: false,
        error: 'Notion API エラー: ' + responseCode + ' - ' + responseText
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 設定初期化と確認
 */
function initializeAndTestConfig() {
  console.log('=== 設定初期化と確認 ===');
  
  try {
    // 現在の設定を確認
    var config = getBasicConfig();
    
    console.log('現在の設定状況:');
    console.log('- Notion Token:', config.notionToken ? '設定済み' : '未設定');
    console.log('- Database ID:', config.notionDatabaseId ? '設定済み' : '未設定');
    console.log('- Gemini API Key:', config.geminiApiKey ? '設定済み' : '未設定');
    
    if (!config.notionToken || !config.notionDatabaseId) {
      console.log('\n⚠️ 設定が不完全です。以下を実行して設定してください:');
      console.log('1. PropertiesService.getScriptProperties().setProperty("NOTION_TOKEN", "your_token_here")');
      console.log('2. PropertiesService.getScriptProperties().setProperty("NOTION_DATABASE_ID", "your_database_id_here")');
      return false;
    }
    
    console.log('\n✅ 基本設定は完了しています');
    return true;
    
  } catch (error) {
    console.error('❌ 設定確認エラー:', error.message);
    return false;
  }
}

/**
 * 権限チェック
 */
function checkPermissions() {
  console.log('=== 権限チェック ===');
  
  var permissions = {
    calendar: false,
    gmail: false,
    drive: false,
    urlFetch: false
  };
  
  try {
    // カレンダー権限
    try {
      CalendarApp.getAllCalendars();
      permissions.calendar = true;
      console.log('✅ カレンダー権限: OK');
    } catch (error) {
      console.log('❌ カレンダー権限: NG -', error.message);
    }
    
    // Gmail権限
    try {
      GmailApp.search('in:inbox', 0, 1);
      permissions.gmail = true;
      console.log('✅ Gmail権限: OK');
    } catch (error) {
      console.log('❌ Gmail権限: NG -', error.message);
    }
    
    // Drive権限
    try {
      DriveApp.getRootFolder();
      permissions.drive = true;
      console.log('✅ Drive権限: OK');
    } catch (error) {
      console.log('❌ Drive権限: NG -', error.message);
    }
    
    // URL Fetch権限
    try {
      UrlFetchApp.fetch('https://www.google.com', { method: 'HEAD', muteHttpExceptions: true });
      permissions.urlFetch = true;
      console.log('✅ URL Fetch権限: OK');
    } catch (error) {
      console.log('❌ URL Fetch権限: NG -', error.message);
    }
    
    var allPermissions = permissions.calendar && permissions.gmail && permissions.drive && permissions.urlFetch;
    console.log('\n総合権限チェック: ' + (allPermissions ? '✅ 全て OK' : '❌ 一部制限あり'));
    
    return permissions;
    
  } catch (error) {
    console.error('❌ 権限チェックエラー:', error.message);
    return permissions;
  }
}

/**
 * 全体統合テスト
 */
function runFullIntegrationTest() {
  console.log('=== 全体統合テスト開始 ===');
  
  var testResults = {
    permissions: false,
    config: false,
    basicSystem: false,
    taskCreation: false,
    overallSuccess: false
  };
  
  try {
    // 1. 権限チェック
    console.log('\n### 1. 権限チェック ###');
    var permissions = checkPermissions();
    testResults.permissions = permissions.calendar && permissions.gmail && permissions.drive && permissions.urlFetch;
    
    // 2. 設定チェック
    console.log('\n### 2. 設定チェック ###');
    testResults.config = initializeAndTestConfig();
    
    // 3. 基本システムチェック
    console.log('\n### 3. 基本システムチェック ###');
    var systemResults = runBasicSystemCheck();
    testResults.basicSystem = systemResults.configTest && systemResults.notionTest;
    
    // 4. タスク作成テスト
    if (testResults.config && testResults.basicSystem) {
      console.log('\n### 4. タスク作成テスト ###');
      testResults.taskCreation = testCreateSimpleTask();
    } else {
      console.log('\n### 4. タスク作成テスト ### (スキップ: 前提条件未満足)');
    }
    
    // 総合評価
    testResults.overallSuccess = testResults.permissions && testResults.config && testResults.basicSystem && testResults.taskCreation;
    
    console.log('\n=== 統合テスト結果 ===');
    console.log('権限: ' + (testResults.permissions ? '✅' : '❌'));
    console.log('設定: ' + (testResults.config ? '✅' : '❌'));
    console.log('基本システム: ' + (testResults.basicSystem ? '✅' : '❌'));
    console.log('タスク作成: ' + (testResults.taskCreation ? '✅' : '❌'));
    console.log('総合判定: ' + (testResults.overallSuccess ? '✅ 合格' : '❌ 要修正'));
    
    if (testResults.overallSuccess) {
      console.log('\n🎉 システムは正常に動作しています！');
      console.log('💡 次のステップ: 実際のカレンダーやメールでタスク抽出を試してください');
    } else {
      console.log('\n⚠️ システムに問題があります。上記の❌項目を修正してください');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ 統合テストで重大エラー:', error.message);
    testResults.overallSuccess = false;
    return testResults;
  }
}