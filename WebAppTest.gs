/**
 * WebApp デプロイメント確認用テスト関数
 */

function testWebAppFunctions() {
  console.log('=== WebApp関数テスト開始 ===');
  
  try {
    // 1. transferCalendarEventsのテスト
    console.log('1. transferCalendarEvents テスト中...');
    if (typeof transferCalendarEvents === 'function') {
      console.log('✅ transferCalendarEvents は定義されています');
      
      try {
        var result = transferCalendarEvents();
        console.log('✅ transferCalendarEvents 実行成功:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log('⚠️ transferCalendarEvents 実行エラー:', error.message);
      }
    } else {
      console.log('❌ transferCalendarEvents が未定義です');
    }
    
    // 2. transferGmailMessagesのテスト
    console.log('\n2. transferGmailMessages テスト中...');
    if (typeof transferGmailMessages === 'function') {
      console.log('✅ transferGmailMessages は定義されています');
      
      try {
        var result = transferGmailMessages();
        console.log('✅ transferGmailMessages 実行成功:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log('⚠️ transferGmailMessages 実行エラー:', error.message);
      }
    } else {
      console.log('❌ transferGmailMessages が未定義です');
    }
    
    // 3. processVoiceInputのテスト
    console.log('\n3. processVoiceInput テスト中...');
    if (typeof processVoiceInput === 'function') {
      console.log('✅ processVoiceInput は定義されています');
      
      try {
        var result = processVoiceInput('テスト音声入力');
        console.log('✅ processVoiceInput 実行成功:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log('⚠️ processVoiceInput 実行エラー:', error.message);
      }
    } else {
      console.log('❌ processVoiceInput が未定義です');
    }
    
    // 4. runFullTaskExtractionのテスト
    console.log('\n4. runFullTaskExtraction テスト中...');
    if (typeof runFullTaskExtraction === 'function') {
      console.log('✅ runFullTaskExtraction は定義されています');
      
      try {
        var result = runFullTaskExtraction();
        console.log('✅ runFullTaskExtraction 実行成功:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log('⚠️ runFullTaskExtraction 実行エラー:', error.message);
      }
    } else {
      console.log('❌ runFullTaskExtraction が未定義です');
    }
    
    console.log('\n=== WebApp関数テスト完了 ===');
    return {
      success: true,
      message: 'WebApp関数テストが完了しました。詳細はログを確認してください。'
    };
    
  } catch (error) {
    console.error('❌ WebApp関数テストエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WebApp設定確認関数
 */
function checkWebAppDeployment() {
  console.log('=== WebAppデプロイメント確認 ===');
  
  try {
    // doGet関数が定義されているか確認
    if (typeof doGet === 'function') {
      console.log('✅ doGet関数は定義されています');
    } else {
      console.log('❌ doGet関数が未定義です');
    }
    
    // include関数が定義されているか確認  
    if (typeof include === 'function') {
      console.log('✅ include関数は定義されています');
    } else {
      console.log('❌ include関数が未定義です');
    }
    
    // 設定管理関数群の確認
    var webAppFunctions = [
      'getConfig', 'setConfig', 'validateConfig', 
      'saveConfigToSheet', 'syncSheetToProperties',
      'setupAutoTriggers', 'getTriggerInfo'
    ];
    
    webAppFunctions.forEach(function(funcName) {
      if (typeof eval(funcName) === 'function') {
        console.log('✅ ' + funcName + ' は定義されています');
      } else {
        console.log('❌ ' + funcName + ' が未定義です');
      }
    });
    
    console.log('=== デプロイメント確認完了 ===');
    
  } catch (error) {
    console.error('❌ デプロイメント確認エラー:', error.message);
  }
}

/**
 * WebApp URLテスト（手動実行用）
 */
function getWebAppUrls() {
  console.log('=== WebApp URL情報 ===');
  console.log('最新デプロイメントID: AKfycbzlljqpIl8H_xVfZ76t__I1uwC5x6_fIx-6eZrEWtsUkzIOxhk2H2U-7WeUwb42YX22zQ');
  console.log('WebApp URL: https://script.google.com/macros/s/AKfycbzlljqpIl8H_xVfZ76t__I1uwC5x6_fIx-6eZrEWtsUkzIOxhk2H2U-7WeUwb42YX22zQ/exec');
  console.log('');
  console.log('このURLでWebAppにアクセスして、transferGmailMessagesエラーが解消されているか確認してください。');
}