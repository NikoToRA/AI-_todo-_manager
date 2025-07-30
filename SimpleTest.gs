/**
 * 簡単なテスト関数（クラス重複エラー回避）
 */
function simpleConfigTest() {
  console.log('=== 簡単設定テスト ===');
  
  try {
    // 1. 基本設定取得
    console.log('1. 基本設定取得テスト');
    const config = ConfigManager.getConfig();
    console.log('設定取得成功:', Object.keys(config).length + '項目');
    
    // 2. Gmail設定表示
    console.log('2. Gmail設定表示');
    console.log('- 検索クエリ:', config.gmailSearchQuery);
    console.log('- 最大取得件数:', config.gmailMaxResults);
    console.log('- 除外送信者:', config.gmailExcludeSenders);
    
    // 3. 設定シート作成テスト
    console.log('3. 設定シート作成テスト');
    const result = ConfigManager.initialize();
    if (result.success) {
      console.log('✅ 設定シート作成成功');
      console.log('📊 URL:', result.sheetUrl);
    } else {
      console.log('❌ 設定シート作成失敗:', result.error);
    }
    
    console.log('✅ 簡単設定テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  }
}

/**
 * スプレッドシート設定管理（エラー回避版）
 */
function openConfigSheet() {
  try {
    const spreadsheet = ConfigManager.getConfigSheet();
    const url = spreadsheet.getUrl();
    
    console.log('📊 設定シートURL:', url);
    console.log('💡 このURLをブラウザで開いて設定を編集してください');
    
    return url;
    
  } catch (error) {
    console.error('❌ 設定シートオープンエラー:', error.message);
    return null;
  }
}