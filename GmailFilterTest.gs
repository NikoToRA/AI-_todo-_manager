/**
 * Gmail フィルター設定テスト関数群
 */

/**
 * 新しいGmailフィルター設定をテスト
 */
function testGmailFilterSettings() {
  console.log('=== Gmail フィルター設定テスト開始 ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    // 設定値を表示
    console.log('現在の設定:');
    console.log('- Gmail検索クエリ:', config.gmailSearchQuery);
    console.log('- 最大取得件数:', config.gmailMaxResults);
    console.log('- 日付範囲（日数）:', config.gmailDateRangeDays);
    
    // 実際にGmailからメール取得テスト
    var taskExtractor = new TaskExtractor(config);
    
    console.log('\n📧 実際のメール取得テスト:');
    var tasks = taskExtractor.extractFromGmail();
    
    console.log('✅ メール取得完了');
    console.log('抽出されたタスク数:', tasks.length);
    
    // タスク詳細を表示
    for (var i = 0; i < Math.min(tasks.length, 5); i++) {
      var task = tasks[i];
      console.log(`${i+1}. ${task.title} [${task.priority}] - ${task.context}`);
    }
    
    return {
      success: true,
      extractedTasks: tasks.length,
      maxResults: config.gmailMaxResults,
      dateRange: config.gmailDateRangeDays,
      searchQuery: config.gmailSearchQuery,
      tasks: tasks.slice(0, 5) // 最初の5件のみ返す
    };
    
  } catch (error) {
    console.error('❌ Gmail フィルター設定テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 既読・未読メール両方の取得テスト
 */
function testReadUnreadEmails() {
  console.log('=== 既読・未読メール取得テスト ===');
  
  try {
    var config = ConfigManager.getConfig();
    var dateRange = config.gmailDateRangeDays || 3;
    
    // 既読・未読両方を含むクエリ
    var testQueries = [
      `in:inbox -is:archived newer_than:${dateRange}d`,                    // 基本（既読・未読含む）
      `in:inbox -is:archived newer_than:${dateRange}d is:unread`,          // 未読のみ  
      `in:inbox -is:archived newer_than:${dateRange}d is:read`,            // 既読のみ
    ];
    
    var results = {};
    
    for (var i = 0; i < testQueries.length; i++) {
      var query = testQueries[i];
      var label = ['全て', '未読のみ', '既読のみ'][i];
      
      console.log(`\n${label} テスト中... (${query})`);
      
      try {
        var threads = GmailApp.search(query, 0, 10);
        var messageCount = 0;
        var unreadCount = 0;
        var readCount = 0;
        
        for (var j = 0; j < threads.length; j++) {
          var messages = threads[j].getMessages();
          for (var k = 0; k < messages.length; k++) {
            var message = messages[k];
            messageCount++;
            if (message.isUnread()) {
              unreadCount++;
            } else {
              readCount++;
            }
          }
        }
        
        results[label] = {
          スレッド数: threads.length,
          メッセージ数: messageCount,
          未読: unreadCount,
          既読: readCount
        };
        
        console.log(`✅ ${label}: スレッド${threads.length}件, メッセージ${messageCount}件 (未読:${unreadCount}, 既読:${readCount})`);
        
      } catch (error) {
        console.error(`❌ ${label} テストエラー:`, error.message);
        results[label] = { エラー: error.message };
      }
    }
    
    console.log('\n=== 結果サマリー ===');
    console.log(JSON.stringify(results, null, 2));
    
    return {
      success: true,
      dateRange: dateRange,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 既読・未読メール取得テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 異なる日付範囲でのメール取得テスト
 */
function testDifferentDateRanges() {
  console.log('=== 異なる日付範囲テスト ===');
  
  try {
    var dateRanges = [1, 3, 7, 14]; // 1日、3日、1週間、2週間
    var results = {};
    
    for (var i = 0; i < dateRanges.length; i++) {
      var days = dateRanges[i];
      var query = `in:inbox -is:archived newer_than:${days}d`;
      
      console.log(`\n${days}日間 テスト中... (${query})`);
      
      try {
        var threads = GmailApp.search(query, 0, 20);
        var messageCount = 0;
        var unreadCount = 0;
        
        for (var j = 0; j < threads.length; j++) {
          var messages = threads[j].getMessages();
          messageCount += messages.length;
          for (var k = 0; k < messages.length; k++) {
            if (messages[k].isUnread()) {
              unreadCount++;
            }
          }
        }
        
        results[`${days}日間`] = {
          スレッド数: threads.length,
          メッセージ数: messageCount,
          未読数: unreadCount
        };
        
        console.log(`✅ ${days}日間: スレッド${threads.length}件, メッセージ${messageCount}件, 未読${unreadCount}件`);
        
      } catch (error) {
        console.error(`❌ ${days}日間 テストエラー:`, error.message);
        results[`${days}日間`] = { エラー: error.message };
      }
    }
    
    console.log('\n=== 推奨設定 ===');
    
    // 結果に基づいて推奨設定を提案
    var recommendation = '3日間'; // デフォルト
    var maxMessages = 0;
    
    Object.keys(results).forEach(function(period) {
      var result = results[period];
      if (result.メッセージ数 && result.メッセージ数 > maxMessages && result.メッセージ数 <= 50) {
        maxMessages = result.メッセージ数;
        recommendation = period;
      }
    });
    
    console.log(`推奨日付範囲: ${recommendation} (適切なメッセージ量: ${maxMessages}件)`);
    
    return {
      success: true,
      results: results,
      recommendation: recommendation
    };
    
  } catch (error) {
    console.error('❌ 日付範囲テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 設定を最適化してGmail取得をテスト
 */
function optimizeAndTestGmailSettings() {
  console.log('=== Gmail設定最適化テスト ===');
  
  try {
    // 1. 現在の設定をテスト
    console.log('1. 現在の設定をテスト中...');
    var currentResult = testGmailFilterSettings();
    
    // 2. 異なる日付範囲をテスト
    console.log('\n2. 異なる日付範囲をテスト中...');
    var dateRangeResult = testDifferentDateRanges();
    
    // 3. 既読・未読両方のテスト
    console.log('\n3. 既読・未読両方をテスト中...');
    var readUnreadResult = testReadUnreadEmails();
    
    // 4. 最適化された設定を提案
    console.log('\n4. 最適化された設定を提案中...');
    
    var optimizedConfig = {
      gmailSearchQuery: 'in:inbox -is:archived newer_than:3d',
      gmailMaxResults: 30,
      gmailDateRangeDays: 3,
      enableGmailAnalysis: true
    };
    
    console.log('✅ 最適化された設定:');
    console.log('- 検索クエリ:', optimizedConfig.gmailSearchQuery);
    console.log('- 最大取得件数:', optimizedConfig.gmailMaxResults);
    console.log('- 日付範囲:', optimizedConfig.gmailDateRangeDays + '日間');
    
    return {
      success: true,
      currentResult: currentResult,
      dateRangeResult: dateRangeResult,
      readUnreadResult: readUnreadResult,
      optimizedConfig: optimizedConfig,
      message: '既読・未読両方を含む3日間のメールを最大30件取得する設定を推奨します'
    };
    
  } catch (error) {
    console.error('❌ Gmail設定最適化エラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}