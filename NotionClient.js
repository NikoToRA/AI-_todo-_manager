/**
 * Notion API統合クラス
 * 要件4.3, 4.4対応: Notion APIとの連携
 */
class NotionClient {
  
  constructor(token, databaseId) {
    this.token = token;
    this.databaseId = databaseId;
    this.baseUrl = 'https://api.notion.com/v1';
    this.version = '2022-06-28';
  }
  
  /**
   * タスクを作成
   * @param {Object} taskData タスクデータ
   * @returns {Object} 作成結果
   */
  createTask(taskData) {
    try {
      console.log('[NotionClient] タスク作成開始:', taskData.title);
      
      // データベースIDのクリーンアップ（改行文字除去）
      var cleanDatabaseId = this.databaseId.replace(/\n/g, '').trim();
      
      var url = this.baseUrl + '/pages';
      
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
      
      // タイプ設定
      if (taskData.type) {
        properties['type'] = {
          'select': {
            'name': taskData.type
          }
        };
      } else {
        properties['type'] = {
          'select': {
            'name': 'task'
          }
        };
      }
      
      // 優先度設定
      if (taskData.priority) {
        properties['priority'] = {
          'select': {
            'name': taskData.priority
          }
        };
      }
      
      // 期日設定
      if (taskData.due_date) {
        properties['日付'] = {
          'date': {
            'start': taskData.due_date
          }
        };
      }
      
      // ソース設定
      if (taskData.source) {
        properties['source'] = {
          'select': {
            'name': taskData.source
          }
        };
      }
      
      // 作成者設定
      if (taskData.created_by) {
        properties['created_by'] = {
          'select': {
            'name': taskData.created_by
          }
        };
      } else {
        properties['created_by'] = {
          'select': {
            'name': 'auto'
          }
        };
      }
      
      // 元イベント設定（contextフィールドに統合）
      if (taskData.original_event && !taskData.context) {
        properties['context'] = {
          'rich_text': [
            {
              'text': {
                'content': `元イベント: ${taskData.original_event}`
              }
            }
          ]
        };
      } else if (taskData.original_event && taskData.context) {
        properties['context'] = {
          'rich_text': [
            {
              'text': {
                'content': `${taskData.context} | 元イベント: ${taskData.original_event}`
              }
            }
          ]
        };
      }
      
      // コンテキストはページ本文に設定するため、プロパティからは削除
      
      var payload = {
        'parent': {
          'database_id': cleanDatabaseId
        },
        'properties': properties
      };
      
      // contextがある場合はページ本文に追加（2000文字制限対応）
      if (taskData.context) {
        var contextText = taskData.context;
        var children = [];
        var maxLength = 1900; // 安全マージンを含めて1900文字
        
        // 長いテキストを複数のブロックに分割
        while (contextText.length > 0) {
          var chunk = contextText.substring(0, maxLength);
          contextText = contextText.substring(maxLength);
          
          children.push({
            'object': 'block',
            'type': 'paragraph',
            'paragraph': {
              'rich_text': [
                {
                  'type': 'text',
                  'text': {
                    'content': chunk
                  }
                }
              ]
            }
          });
        }
        
        payload['children'] = children;
      }
      
      var options = {
        'method': 'POST',
        'headers': {
          'Authorization': 'Bearer ' + this.token,
          'Content-Type': 'application/json',
          'Notion-Version': this.version
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
        console.log('[NotionClient] タスク作成成功:', taskData.title);
        return {
          success: true,
          id: data.id,
          url: data.url,
          title: taskData.title
        };
      } else {
        console.error('[NotionClient] タスク作成失敗:', responseCode, responseText);
        return {
          success: false,
          error: 'Notion API エラー: ' + responseCode + ' - ' + responseText
        };
      }
      
    } catch (error) {
      console.error('[NotionClient] タスク作成エラー:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 既存タスクを取得
   * @param {Object} filter フィルタ条件
   * @returns {Array} タスク一覧
   */
  getExistingTasks(filter) {
    try {
      console.log('[NotionClient] 既存タスク取得開始');
      
      // データベースIDのクリーンアップ
      var cleanDatabaseId = this.databaseId.replace(/\n/g, '').trim();
      
      var url = this.baseUrl + '/databases/' + cleanDatabaseId + '/query';
      
      var queryFilter = {
        'and': [
          {
            'property': 'type',
            'select': {
              'equals': 'task'
            }
          }
        ]
      };
      
      // 追加フィルタがある場合
      if (filter && filter.status) {
        queryFilter.and.push({
          'property': 'status',
          'select': {
            'equals': filter.status
          }
        });
      }
      
      var payload = {
        'filter': queryFilter,
        'page_size': 100
      };
      
      var options = {
        'method': 'POST',
        'headers': {
          'Authorization': 'Bearer ' + this.token,
          'Content-Type': 'application/json',
          'Notion-Version': this.version
        },
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true,
        'timeout': 30000
      };
      
      var response = UrlFetchApp.fetch(url, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();
      
      if (responseCode === 200) {
        var data = JSON.parse(responseText);
        var tasks = [];
        
        // デバッグ: 最初のページのプロパティ構造を確認
        if (data.results.length > 0) {
          console.log('最初のページのプロパティ構造:', JSON.stringify(data.results[0].properties, null, 2));
        }
        
        for (var i = 0; i < data.results.length; i++) {
          var page = data.results[i];
          var task = this._parseNotionPage(page);
          if (task) {
            tasks.push(task);
          }
        }
        
        console.log('[NotionClient] 既存タスク取得完了:', tasks.length + '件');
        return tasks;
        
      } else {
        console.error('[NotionClient] 既存タスク取得失敗:', responseCode, responseText);
        return [];
      }
      
    } catch (error) {
      console.error('[NotionClient] 既存タスク取得エラー:', error.message);
      return [];
    }
  }
  
  /**
   * タスクを更新
   * @param {string} pageId ページID
   * @param {Object} updateData 更新データ
   * @returns {Object} 更新結果
   */
  updateTask(pageId, updateData) {
    try {
      console.log('[NotionClient] タスク更新開始:', pageId);
      
      var url = this.baseUrl + '/pages/' + pageId;
      
      var properties = {};
      
      // 優先度更新
      if (updateData.priority) {
        properties['priority'] = {
          'select': {
            'name': updateData.priority
          }
        };
      }
      
      // 期日更新
      if (updateData.due_date) {
        properties['日付'] = {
          'date': {
            'start': updateData.due_date
          }
        };
      }
      
      // コンテキスト更新
      if (updateData.context) {
        properties['context'] = {
          'rich_text': [
            {
              'text': {
                'content': updateData.context
              }
            }
          ]
        };
      }
      
      var payload = {
        'properties': properties
      };
      
      var options = {
        'method': 'PATCH',
        'headers': {
          'Authorization': 'Bearer ' + this.token,
          'Content-Type': 'application/json',
          'Notion-Version': this.version
        },
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true,
        'timeout': 30000
      };
      
      var response = UrlFetchApp.fetch(url, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();
      
      if (responseCode === 200) {
        console.log('[NotionClient] タスク更新成功:', pageId);
        return {
          success: true,
          id: pageId
        };
      } else {
        console.error('[NotionClient] タスク更新失敗:', responseCode, responseText);
        return {
          success: false,
          error: 'Notion API エラー: ' + responseCode + ' - ' + responseText
        };
      }
      
    } catch (error) {
      console.error('[NotionClient] タスク更新エラー:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 実行サマリーを作成
   * @param {Object} summaryData サマリーデータ
   * @returns {Object} 作成結果
   */
  createExecutionSummary(summaryData) {
    try {
      console.log('[NotionClient] 実行サマリー作成開始');
      
      var today = new Date();
      var dateStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
      
      var timeStr = String(today.getHours()).padStart(2, '0') + ':' + 
                   String(today.getMinutes()).padStart(2, '0');
      
      // 実行モードに応じてタイトルを調整
      var titleSuffix = '';
      if (summaryData.execution_mode === 'auto_calendar') {
        titleSuffix = ' (カレンダー)';
      } else if (summaryData.execution_mode === 'auto_gmail') {
        titleSuffix = ' (Gmail)';
      } else if (summaryData.execution_mode === 'auto_integrated') {
        titleSuffix = ' (統合)';
      }
      
      var contextText = '処理件数: ' + (summaryData.processed_items || 0) + '件\n' +
                       '作成タスク数: ' + (summaryData.created_tasks || 0) + '件\n' +
                       'スキップ重複数: ' + (summaryData.skipped_duplicates || 0) + '件\n' +
                       '実行モード: ' + (summaryData.execution_mode || 'unknown') + '\n' +
                       '実行時刻: ' + timeStr + '\n' +
                       'エラー: ' + (summaryData.errors || 'なし');
      
      // 追加のコンテキストがある場合は追加
      if (summaryData.context) {
        contextText += '\n\n詳細情報:\n' + summaryData.context;
      }
      
      var taskData = {
        title: '実行サマリー ' + dateStr + titleSuffix,
        type: 'summary',
        created_by: 'auto',
        context: contextText
      };
      
      return this.createTask(taskData);
      
    } catch (error) {
      console.error('[NotionClient] 実行サマリー作成エラー:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Notionページをタスクオブジェクトにパース
   * @private
   */
  _parseNotionPage(page) {
    try {
      var properties = page.properties;
      
      var task = {
        id: page.id,
        url: page.url,
        title: null // 明示的にnullで初期化
      };
      
      // タイトル取得（複数のプロパティ名を試行）
      var titleFound = false;
      
      // 1. 'title'プロパティを確認
      if (properties.title && properties.title.title && properties.title.title.length > 0) {
        task.title = properties.title.title[0].text.content;
        titleFound = true;
      }
      // 2. 'Name'プロパティを確認
      else if (properties.Name && properties.Name.title && properties.Name.title.length > 0) {
        task.title = properties.Name.title[0].text.content;
        titleFound = true;
      }
      // 3. '名前'プロパティを確認
      else if (properties['名前'] && properties['名前'].title && properties['名前'].title.length > 0) {
        task.title = properties['名前'].title[0].text.content;
        titleFound = true;
      }
      // 4. 'タイトル'プロパティを確認
      else if (properties['タイトル'] && properties['タイトル'].title && properties['タイトル'].title.length > 0) {
        task.title = properties['タイトル'].title[0].text.content;
        titleFound = true;
      }
      
      // タイトルが見つからない場合の処理
      if (!titleFound) {
        // 利用可能なタイトル系プロパティを探す
        var titleProperties = Object.keys(properties).filter(function(key) {
          return properties[key].type === 'title' || 
                 (properties[key].title && Array.isArray(properties[key].title));
        });
        
        if (titleProperties.length > 0) {
          var firstTitleProp = properties[titleProperties[0]];
          if (firstTitleProp.title && firstTitleProp.title.length > 0) {
            task.title = firstTitleProp.title[0].text.content;
            titleFound = true;
          }
        }
      }
      
      // それでもタイトルが見つからない場合はnullのまま（重複チェックから除外される）
      if (!titleFound) {
        console.log('[NotionClient] タイトルが見つからないページをスキップ:', page.id);
        return null; // タイトルがないページは無効として扱う
      }
      
      // 優先度
      if (properties.priority && properties.priority.select) {
        task.priority = properties.priority.select.name;
      }
      
      // 期日
      if (properties.日付 && properties.日付.date) {
        task.due_date = properties.日付.date.start;
      }
      
      // ソース
      if (properties.source && properties.source.select) {
        task.source = properties.source.select.name;
      }
      
      // ステータス
      if (properties.status && properties.status.select) {
        task.status = properties.status.select.name;
      }
      
      // コンテキスト
      if (properties.context && properties.context.rich_text && properties.context.rich_text.length > 0) {
        task.context = properties.context.rich_text[0].text.content;
      }
      
      return task;
      
    } catch (error) {
      console.error('[NotionClient] ページパースエラー:', error.message);
      return null;
    }
  }
  
  /**
   * データベース接続テスト
   * @returns {Object} テスト結果
   */
  testConnection() {
    try {
      console.log('[NotionClient] 接続テスト開始');
      
      // データベースIDのクリーンアップ
      var cleanDatabaseId = this.databaseId.replace(/\n/g, '').trim();
      
      var url = this.baseUrl + '/databases/' + cleanDatabaseId;
      
      var options = {
        'method': 'GET',
        'headers': {
          'Authorization': 'Bearer ' + this.token,
          'Notion-Version': this.version
        },
        'muteHttpExceptions': true,
        'timeout': 30000
      };
      
      var response = UrlFetchApp.fetch(url, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();
      
      if (responseCode === 200) {
        var data = JSON.parse(responseText);
        console.log('[NotionClient] 接続テスト成功');
        return {
          success: true,
          database_title: data.title && data.title.length > 0 ? data.title[0].text.content : 'Unknown',
          database_id: cleanDatabaseId
        };
      } else {
        console.error('[NotionClient] 接続テスト失敗:', responseCode, responseText);
        return {
          success: false,
          error: 'Notion API エラー: ' + responseCode + ' - ' + responseText
        };
      }
      
    } catch (error) {
      console.error('[NotionClient] 接続テストエラー:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * データベースプロパティ情報を取得
 */
function getDatabaseProperties() {
  console.log('=== データベースプロパティ確認 ===');
  
  try {
    var config = ConfigManager.getConfig();
    var cleanDatabaseId = config.notionDatabaseId.replace(/\n/g, '').trim();
    
    var url = 'https://api.notion.com/v1/databases/' + cleanDatabaseId;
    
    var options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + config.notionToken,
        'Notion-Version': '2022-06-28'
      },
      'muteHttpExceptions': true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var data = JSON.parse(response.getContentText());
    
    if (data.properties) {
      console.log('利用可能なプロパティ:');
      Object.keys(data.properties).forEach(function(propName) {
        var prop = data.properties[propName];
        console.log('- ' + propName + ' (' + prop.type + ')');
        
        if (prop.type === 'select' && prop.select && prop.select.options) {
          console.log('  選択肢:');
          prop.select.options.forEach(function(option) {
            console.log('    - "' + option.name + '"');
          });
        }
      });
    }
    
  } catch (error) {
    console.error('プロパティ取得エラー:', error.message);
  }
  
  console.log('=== 確認完了 ===');
}

/**
 * テスト用関数 - Notion統合テスト
 */
function testNotionIntegration() {
  console.log('=== Notion統合テスト ===');
  
  try {
    // 1. 設定取得
    var config = ConfigManager.getConfig();
    
    if (!config.notionToken) {
      console.error('❌ Notion APIトークンが設定されていません');
      return;
    }
    
    if (!config.notionDatabaseId) {
      console.error('❌ NotionデータベースIDが設定されていません');
      return;
    }
    
    var notionClient = new NotionClient(config.notionToken, config.notionDatabaseId);
    
    // 2. 接続テスト
    console.log('1. 接続テスト');
    var connectionTest = notionClient.testConnection();
    console.log('接続テスト結果:', connectionTest);
    
    if (!connectionTest.success) {
      console.error('❌ Notion接続に失敗しました');
      return;
    }
    
    // 3. 既存タスク取得テスト
    console.log('2. 既存タスク取得テスト');
    var existingTasks = notionClient.getExistingTasks();
    console.log('既存タスク数:', existingTasks.length);
    
    // 4. テストタスク作成
    console.log('3. テストタスク作成');
    var testTask = {
      title: 'テストタスク - ' + new Date().toLocaleString('ja-JP'),
      priority: '中',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 明日
      source: 'test',
      context: 'Notion統合テストで作成されたタスクです',
      created_by: 'auto'
    };
    
    var createResult = notionClient.createTask(testTask);
    console.log('タスク作成結果:', createResult);
    
    // 5. 実行サマリー作成テスト
    console.log('4. 実行サマリー作成テスト');
    var summaryData = {
      processed_items: 5,
      created_tasks: 1,
      skipped_duplicates: 0,
      execution_mode: 'test',
      errors: ''
    };
    
    var summaryResult = notionClient.createExecutionSummary(summaryData);
    console.log('サマリー作成結果:', summaryResult);
    
    console.log('✅ Notion統合テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 簡単実行用関数
 */
function testNotion() {
  testNotionIntegration();
}

/**
 * Notionセットアップガイド表示
 */
function showNotionSetupGuide() {
  console.log('=== Notionセットアップガイド ===');
  console.log('');
  console.log('1. Notionで新しいページを作成');
  console.log('2. データベース（テーブル）を追加');
  console.log('3. 以下のプロパティを設定:');
  console.log('   - title (タイトル)');
  console.log('   - type (セレクト): task, summary');
  console.log('   - priority (セレクト): 高, 中, 低');
  console.log('   - due_date (日付)');
  console.log('   - source (セレクト): calendar, gmail, voice, auto');
  console.log('   - status (セレクト): 未着手, 進行中, 完了');
  console.log('   - created_by (セレクト): auto, manual');
  console.log('   - original_event (テキスト)');
  console.log('   - context (テキスト)');
  console.log('4. データベースページで「共有」→「インテグレーションを招待」');
  console.log('5. 「AI Task Manager」インテグレーションを選択して招待');
  console.log('6. データベースURLからIDをコピーしてスプレッドシートに設定');
  console.log('7. runConfigSync() で設定を同期');
  console.log('8. testNotionAPI() で接続テスト');
  console.log('');
  console.log('=== セットアップガイド完了 ===');
}

/**
 * 処理済みタグがついているかチェック
 * @param {string} originalEvent 元のイベント名
 * @param {string} eventDate イベント日付（YYYY-MM-DD形式）
 * @returns {boolean} 処理済みの場合true
 */
NotionClient.prototype.isAlreadyProcessed = function(originalEvent, eventDate) {
  try {
    console.log('[NotionClient] 処理済みチェック: "' + originalEvent + '" (' + eventDate + ')');
    
    if (!originalEvent || originalEvent.trim().length === 0) {
      return false;
    }
    
    // 1. 日付付きタイトルでの完全一致検索
    if (eventDate) {
      var dateString = ' (' + eventDate + ')';
      var exactTitleFilter = {
        'and': [
          {
            'property': 'type',
            'select': { 'equals': 'task' }
          },
          {
            'property': 'source',
            'select': { 'equals': 'calendar' }
          },
          {
            'property': 'Name',
            'title': { 'equals': originalEvent + dateString }
          }
        ]
      };
      
      console.log('[NotionClient] 完全一致検索: "' + originalEvent + dateString + '"');
      var exactResult = this._executeQuery(exactTitleFilter);
      if (exactResult && exactResult.length > 0) {
        console.log('[NotionClient] ✓ 完全一致タスク発見: ' + exactResult.length + '件');
        return true;
      }
    }
    
    // 2. 元イベント名での部分一致検索
    var partialTitleFilter = {
      'and': [
        {
          'property': 'type',
          'select': { 'equals': 'task' }
        },
        {
          'property': 'source', 
          'select': { 'equals': 'calendar' }
        },
        {
          'property': 'Name',
          'title': { 'contains': originalEvent }
        }
      ]
    };
    
    console.log('[NotionClient] 部分一致検索: "' + originalEvent + '"');
    var result = this._executeQuery(partialTitleFilter);
    
    if (result && result.length > 0) {
      console.log('[NotionClient] 部分一致タスク発見: ' + result.length + '件');
      
      // 日付一致確認
      if (eventDate) {
        for (var i = 0; i < result.length; i++) {
          var task = result[i];
          if (task.properties && task.properties['日付'] && task.properties['日付'].date) {
            var taskDate = task.properties['日付'].date.start;
            // 日付の形式を統一して比較
            var normalizedTaskDate = taskDate.split('T')[0]; // YYYY-MM-DD部分のみ
            if (normalizedTaskDate === eventDate) {
              console.log('[NotionClient] ✓ 同一日付タスク確認: ' + normalizedTaskDate);
              return true;
            }
          }
        }
        console.log('[NotionClient] 部分一致あるが日付不一致 - 未処理扱い');
      } else {
        return true; // 日付情報がない場合はタイトル一致で重複とみなす
      }
    }
    
    console.log('[NotionClient] ✗ 未処理 (Notion): "' + originalEvent + '"');
    return false;
    
  } catch (error) {
    console.error('[NotionClient] 処理済みチェックエラー:', error.message);
    // エラー時は安全側に倒して未処理とする（重複よりも取りこぼしを防ぐ）
    return false;
  }
};

/**
 * Notionクエリ実行ヘルパーメソッド
 * @private
 */
NotionClient.prototype._executeQuery = function(filter) {
  try {
    var cleanDatabaseId = this.databaseId.replace(/\n/g, '').trim();
    var url = this.baseUrl + '/databases/' + cleanDatabaseId + '/query';
    var payload = { 'filter': filter, 'page_size': 10 };
    
    var options = {
      'method': 'POST',
      'headers': {
        'Authorization': 'Bearer ' + this.token,
        'Content-Type': 'application/json',
        'Notion-Version': this.version
      },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true,
      'timeout': 10000
    };
    
    var response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      return data.results || [];
    } else {
      console.warn('[NotionClient] クエリ失敗 (Code: ' + response.getResponseCode() + ')');
      return null;
    }
  } catch (error) {
    console.error('[NotionClient] クエリ実行エラー:', error.message);
    return null;
  }
};

/**
 * カスタムフィルタでタスクを検索
 * @param {Object} filter 検索フィルタ
 * @returns {Array} マッチしたタスク配列
 */
NotionClient.prototype.queryTasks = function(filter) {
  try {
    console.log('[NotionClient] カスタムクエリ実行開始');
    
    // データベースIDのクリーンアップ
    var cleanDatabaseId = this.databaseId.replace(/\n/g, '').trim();
    var url = this.baseUrl + '/databases/' + cleanDatabaseId + '/query';
    
    var payload = {
      'filter': filter,
      'page_size': 100,
      'sorts': [
        {
          'property': 'created_time',
          'direction': 'descending'
        }
      ]
    };
    
    var options = {
      'method': 'POST',
      'headers': {
        'Authorization': 'Bearer ' + this.token,
        'Content-Type': 'application/json',
        'Notion-Version': this.version
      },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true,
      'timeout': 15000
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      var errorText = response.getContentText();
      console.error('[NotionClient] Notionクエリエラー (Code: ' + responseCode + '): ' + errorText);
      return [];
    }
    
    var data = JSON.parse(response.getContentText());
    
    if (!data.results || !Array.isArray(data.results)) {
      console.warn('[NotionClient] Notionクエリ: 無効なレスポンス形式');
      return [];
    }
    
    var tasks = [];
    for (var i = 0; i < data.results.length; i++) {
      var page = data.results[i];
      
      if (page.properties) {
        var task = this.parseTaskFromPage(page);
        if (task) {
          tasks.push(task);
        }
      }
    }
    
    console.log('[NotionClient] カスタムクエリ完了: ' + tasks.length + '件');
    return tasks;
    
  } catch (error) {
    console.error('[NotionClient] カスタムクエリエラー:', error.message);
    return [];
  }
};

/**
 * NotionページからタスクオブジェクトにParse
 * @param {Object} page Notionページオブジェクト
 * @returns {Object} タスクオブジェクト
 */
NotionClient.prototype.parseTaskFromPage = function(page) {
  try {
    var task = {
      id: page.id,
      url: page.url,
      created_time: page.created_time
    };
    
    var props = page.properties;
    
    // Title
    if (props.title && props.title.title && props.title.title.length > 0) {
      task.title = props.title.title[0].plain_text || '';
    }
    
    // Type
    if (props.type && props.type.select && props.type.select.name) {
      task.type = props.type.select.name;
    }
    
    // Priority
    if (props.priority && props.priority.select && props.priority.select.name) {
      task.priority = props.priority.select.name;
    }
    
    // Due Date
    if (props.due_date && props.due_date.date && props.due_date.date.start) {
      task.due_date = props.due_date.date.start;
    }
    
    // Source
    if (props.source && props.source.select && props.source.select.name) {
      task.source = props.source.select.name;
    }
    
    // Status
    if (props.status && props.status.select && props.status.select.name) {
      task.status = props.status.select.name;
    }
    
    // Original Event
    if (props.original_event && props.original_event.rich_text && props.original_event.rich_text.length > 0) {
      task.original_event = props.original_event.rich_text[0].plain_text || '';
    }
    
    // Context
    if (props.context && props.context.rich_text && props.context.rich_text.length > 0) {
      task.context = props.context.rich_text[0].plain_text || '';
    }
    
    return task;
    
  } catch (error) {
    console.error('[NotionClient] ページパースエラー:', error.message);
    return null;
  }
};