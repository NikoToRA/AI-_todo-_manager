/**
 * AI プロバイダー定数
 * ES5互換版
 */
var AI_PROVIDER = {
  DISABLED: 'disabled',
  GEMINI: 'gemini',
  CLAUDE: 'claude'
};

/**
 * 設定管理クラス
 * 要件4.1, 9.1対応: セキュアな認証情報管理
 */
class ConfigManager {
  
  static getConfig() {
    var props = PropertiesService.getScriptProperties();
    
    return {
      notionToken: props.getProperty('NOTION_TOKEN'),
      notionDatabaseId: props.getProperty('NOTION_DATABASE_ID'),
      aiProvider: props.getProperty('AI_PROVIDER') || AI_PROVIDER.GEMINI,
      claudeApiKey: props.getProperty('CLAUDE_API_KEY'),
      geminiApiKey: props.getProperty('GEMINI_API_KEY'),
      executionFrequency: props.getProperty('EXECUTION_FREQUENCY') || 'daily',
      executionHour: parseInt(props.getProperty('EXECUTION_HOUR') || '8'),
      dataRangeDays: parseInt(props.getProperty('DATA_RANGE_DAYS') || '7'),
      enableAiAnalysis: props.getProperty('ENABLE_AI_ANALYSIS') === 'true',
      enableVoiceInput: props.getProperty('ENABLE_VOICE_INPUT') === 'true',
      enableGmailAnalysis: props.getProperty('ENABLE_GMAIL_ANALYSIS') === 'true',
      
      // Gmail フィルタ設定
      gmailSearchQuery: props.getProperty('GMAIL_SEARCH_QUERY') || 'in:inbox -is:archived',
      gmailMaxResults: parseInt(props.getProperty('GMAIL_MAX_RESULTS') || '50'),
      gmailDateRangeDays: parseInt(props.getProperty('GMAIL_DATE_RANGE_DAYS') || '7'),
      gmailAutoExcludeCategories: props.getProperty('GMAIL_AUTO_EXCLUDE_CATEGORIES') !== 'false',
      gmailExcludeSenders: props.getProperty('GMAIL_EXCLUDE_SENDERS') || 'noreply@,newsletter@,marketing@',
      gmailExcludeDomains: props.getProperty('GMAIL_EXCLUDE_DOMAINS') || 'mailchimp.com,constantcontact.com',
      gmailExcludeLabels: props.getProperty('GMAIL_EXCLUDE_LABELS') || 'ニュースレター,宣伝',
      gmailIncludeSenders: props.getProperty('GMAIL_INCLUDE_SENDERS') || '',
      gmailExcludeKeywords: props.getProperty('GMAIL_EXCLUDE_KEYWORDS') || '配信停止,unsubscribe,広告,セール,キャンペーン',
      gmailIncludeKeywords: props.getProperty('GMAIL_INCLUDE_KEYWORDS') || '会議,打ち合わせ,確認,依頼,締切,提出,作成',
      gmailHighPriorityKeywords: props.getProperty('GMAIL_HIGH_PRIORITY_KEYWORDS') || '緊急,至急,重要,ASAP,締切',
      gmailMinSubjectLength: parseInt(props.getProperty('GMAIL_MIN_SUBJECT_LENGTH') || '3'),
      gmailEnableSpamFilter: props.getProperty('GMAIL_ENABLE_SPAM_FILTER') === 'true',
      gmailProcessedTracking: props.getProperty('GMAIL_PROCESSED_TRACKING') === 'true',
      gmailEnableGeminiAnalysis: props.getProperty('GMAIL_ENABLE_GEMINI_ANALYSIS') !== 'false'
    };
  }
  
  static setConfig(config) {
    var props = PropertiesService.getScriptProperties();
    
    console.log('[ConfigManager] 設定保存開始:', JSON.stringify(config, null, 2));
    
    try {
      // 基本設定の保存
      if (config.notionToken) props.setProperty('NOTION_TOKEN', config.notionToken);
      if (config.notionDatabaseId) props.setProperty('NOTION_DATABASE_ID', config.notionDatabaseId);
      if (config.aiProvider) props.setProperty('AI_PROVIDER', config.aiProvider);
      if (config.claudeApiKey) props.setProperty('CLAUDE_API_KEY', config.claudeApiKey);
      if (config.geminiApiKey) props.setProperty('GEMINI_API_KEY', config.geminiApiKey);
      
      // 実行設定の保存（重要：必ず保存する）
      if (config.executionFrequency) {
        props.setProperty('EXECUTION_FREQUENCY', config.executionFrequency);
        console.log('[ConfigManager] 実行頻度保存:', config.executionFrequency);
      }
      
      if (config.executionHour !== undefined && config.executionHour !== null) {
        var hourStr = config.executionHour.toString();
        props.setProperty('EXECUTION_HOUR', hourStr);
        console.log('[ConfigManager] 実行時間保存:', hourStr);
      }
      
      if (config.dataRangeDays !== undefined && config.dataRangeDays !== null) {
        props.setProperty('DATA_RANGE_DAYS', config.dataRangeDays.toString());
      }
      
      // 機能有効化設定の保存
      if (config.enableAiAnalysis !== undefined) {
        props.setProperty('ENABLE_AI_ANALYSIS', config.enableAiAnalysis.toString());
      }
      if (config.enableVoiceInput !== undefined) {
        props.setProperty('ENABLE_VOICE_INPUT', config.enableVoiceInput.toString());
      }
      if (config.enableGmailAnalysis !== undefined) {
        props.setProperty('ENABLE_GMAIL_ANALYSIS', config.enableGmailAnalysis.toString());
      }
      
      console.log('[ConfigManager] 設定保存完了');
      
      // 保存後の確認
      var savedConfig = this.getConfig();
      console.log('[ConfigManager] 保存後の設定確認:');
      console.log('- 実行頻度:', savedConfig.executionFrequency);
      console.log('- 実行時間:', savedConfig.executionHour);
      
      return {
        success: true,
        message: '設定を正常に保存しました',
        savedConfig: {
          executionFrequency: savedConfig.executionFrequency,
          executionHour: savedConfig.executionHour
        }
      };
      
    } catch (error) {
      console.error('[ConfigManager] 設定保存エラー:', error.message);
      throw new Error(`設定の保存に失敗しました: ${error.message}`);
    }
  }
  
  static validateConfig() {
    var config = this.getConfig();
    var errors = [];
    
    if (!config.notionToken) errors.push('Notion APIトークンが設定されていません');
    if (!config.notionDatabaseId) errors.push('NotionデータベースIDが設定されていません');
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * 設定用スプレッドシートを取得（設定管理UI用）
   * @returns {Spreadsheet} 設定用スプレッドシート
   */
  static getConfigSheet() {
    try {
      // 既存の設定シートを検索
      const files = DriveApp.getFilesByName('AI Task Manager - 設定');
      
      if (files.hasNext()) {
        const file = files.next();
        return SpreadsheetApp.openById(file.getId());
      } else {
        // 設定シートが存在しない場合は新規作成
        return this.createConfigSheet();
      }
    } catch (error) {
      console.error('[ConfigManager] 設定シート取得エラー:', error.message);
      throw new Error(`設定シートの取得に失敗しました: ${error.message}`);
    }
  }
  
  /**
   * 設定用スプレッドシートを新規作成
   * @private
   * @returns {Spreadsheet} 新規作成された設定用スプレッドシート
   */
  static createConfigSheet() {
    try {
      console.log('[ConfigManager] 新しい設定シートを作成中...');
      
      // 新しいスプレッドシートを作成
      const spreadsheet = SpreadsheetApp.create('AI Task Manager - 設定');
      const sheet = spreadsheet.getActiveSheet();
      sheet.setName('基本設定');
      
      // 基本設定のヘッダーを設定
      const basicHeaders = [
        ['設定項目', '値', '説明'],
        ['NOTION_TOKEN', '', 'Notion APIトークン'],
        ['NOTION_DATABASE_ID', '', 'NotionデータベースID'],
        ['AI_PROVIDER', 'gemini', 'AIプロバイダー（gemini/claude/disabled）'],
        ['GEMINI_API_KEY', '', 'Gemini APIキー'],
        ['CLAUDE_API_KEY', '', 'Claude APIキー（オプション）'],
        ['EXECUTION_FREQUENCY', 'daily', '実行頻度（daily/weekdays/weekly）'],
        ['EXECUTION_HOUR', '8', '実行時間（0-23時）'],
        ['DATA_RANGE_DAYS', '7', 'データ取得期間（日数）'],
        ['ENABLE_AI_ANALYSIS', 'true', 'AI分析を有効にする'],
        ['ENABLE_VOICE_INPUT', 'true', '音声入力を有効にする'],
        ['ENABLE_GMAIL_ANALYSIS', 'true', 'Gmail分析を有効にする']
      ];
      
      // 基本設定データを設定
      const basicRange = sheet.getRange(1, 1, basicHeaders.length, basicHeaders[0].length);
      basicRange.setValues(basicHeaders);
      
      // 基本設定のフォーマット
      sheet.getRange(1, 1, 1, 3).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
      sheet.setColumnWidth(1, 200);
      sheet.setColumnWidth(2, 300);
      sheet.setColumnWidth(3, 300);
      
      // メールフィルタ設定シートを作成
      this._createEmailFilterSheet(spreadsheet);
      
      console.log('[ConfigManager] 設定シート作成完了');
      return spreadsheet;
      
    } catch (error) {
      console.error('[ConfigManager] 設定シート作成エラー:', error.message);
      throw new Error(`設定シートの作成に失敗しました: ${error.message}`);
    }
  }
  
  /**
   * メールフィルタ設定専用シートを作成
   * @private
   * @param {Spreadsheet} spreadsheet 対象のスプレッドシート
   */
  static _createEmailFilterSheet(spreadsheet) {
    try {
      const filterSheet = spreadsheet.insertSheet('メールフィルタ設定');
      
      const filterHeaders = [
        ['設定項目', '値', '説明', '例'],
        ['', '', '=== 基本設定 ===', ''],
        ['GMAIL_SEARCH_QUERY', 'in:inbox -is:archived', 'Gmail検索クエリ', 'in:inbox newer_than:3d'],
        ['GMAIL_MAX_RESULTS', '50', '最大取得件数', '10, 20, 100'],
        ['GMAIL_DATE_RANGE_DAYS', '7', 'メール調査期間（日数）', '1, 3, 7, 14'],
        ['GMAIL_AUTO_EXCLUDE_CATEGORIES', 'true', '自動除外カテゴリ', 'true, false'],
        ['GMAIL_MIN_SUBJECT_LENGTH', '3', '最小件名文字数', '1, 3, 5'],
        ['', '', '=== 除外設定（不要なメールを除外） ===', ''],
        ['GMAIL_EXCLUDE_SENDERS', 'noreply@,newsletter@,marketing@,info@,support@', '除外送信者（カンマ区切り）', 'noreply@example.com'],
        ['GMAIL_EXCLUDE_DOMAINS', 'mailchimp.com,constantcontact.com,sendgrid.net', '除外ドメイン（カンマ区切り）', 'spam-domain.com'],
        ['GMAIL_EXCLUDE_LABELS', 'ニュースレター,宣伝,プロモーション', '除外ラベル（カンマ区切り）', 'スパム,広告'],
        ['GMAIL_EXCLUDE_KEYWORDS', '配信停止,unsubscribe,広告,セール,キャンペーン,割引,プレゼント', '除外キーワード（カンマ区切り）', '宣伝,営業'],
        ['', '', '=== 含める設定（重要なメールを優先） ===', ''],
        ['GMAIL_INCLUDE_SENDERS', '', '含める送信者（カンマ区切り）', 'boss@company.com'],
        ['GMAIL_INCLUDE_KEYWORDS', '会議,打ち合わせ,確認,依頼,締切,提出,作成,レビュー', '含めるキーワード（カンマ区切り）', '承認,決裁'],
        ['GMAIL_HIGH_PRIORITY_KEYWORDS', '緊急,至急,重要,ASAP,締切,urgent', '高優先度キーワード（カンマ区切り）', '即対応,最優先'],
        ['', '', '=== AI分析設定 ===', ''],
        ['GMAIL_ENABLE_SPAM_FILTER', 'true', 'スパム・宣伝メール自動除外', 'true, false'],
        ['GMAIL_ENABLE_GEMINI_ANALYSIS', 'true', 'Geminiによるメール内容分析', 'true, false'],
        ['GMAIL_PROCESSED_TRACKING', 'true', '処理済みメール管理', 'true, false']
      ];
      
      // メールフィルタ設定データを設定
      const filterRange = filterSheet.getRange(1, 1, filterHeaders.length, filterHeaders[0].length);
      filterRange.setValues(filterHeaders);
      
      // フォーマット設定
      filterSheet.getRange(1, 1, 1, 4).setBackground('#34a853').setFontColor('white').setFontWeight('bold');
      
      // セクションヘッダーのフォーマット
      const sectionRows = [2, 8, 13, 17];
      sectionRows.forEach(row => {
        filterSheet.getRange(row, 1, 1, 4).setBackground('#f1f3f4').setFontWeight('bold');
      });
      
      // 列幅設定
      filterSheet.setColumnWidth(1, 250);
      filterSheet.setColumnWidth(2, 350);
      filterSheet.setColumnWidth(3, 300);
      filterSheet.setColumnWidth(4, 200);
      
      // データ検証（ドロップダウン）を追加
      this._addDataValidation(filterSheet);
      
    } catch (error) {
      console.error('[ConfigManager] メールフィルタシート作成エラー:', error.message);
      throw error;
    }
  }
  
  /**
   * データ検証（ドロップダウン）を追加
   * @private
   * @param {Sheet} sheet 対象シート
   */
  static _addDataValidation(sheet) {
    try {
      // true/false のドロップダウン
      const booleanValidation = SpreadsheetApp.newDataValidation()
        .requireValueInList(['true', 'false'])
        .setAllowInvalid(false)
        .build();
      
      // true/false設定項目にドロップダウンを適用
      const booleanRows = [6, 18, 19, 20]; // GMAIL_AUTO_EXCLUDE_CATEGORIES, GMAIL_ENABLE_SPAM_FILTER, etc.
      booleanRows.forEach(row => {
        sheet.getRange(row, 2).setDataValidation(booleanValidation);
      });
      
      // 数値範囲の検証
      const numberValidation = SpreadsheetApp.newDataValidation()
        .requireNumberBetween(1, 100)
        .setAllowInvalid(false)
        .setHelpText('1から100の間の数値を入力してください')
        .build();
      
      sheet.getRange(4, 2).setDataValidation(numberValidation); // GMAIL_MAX_RESULTS
      sheet.getRange(5, 2).setDataValidation(numberValidation); // GMAIL_DATE_RANGE_DAYS
      
    } catch (error) {
      console.error('[ConfigManager] データ検証設定エラー:', error.message);
    }
  }
  
  /**
   * スプレッドシートから設定を読み込み（全シート対応）
   * @returns {Object} 設定オブジェクト
   */
  static loadConfigFromSheet() {
    try {
      const spreadsheet = this.getConfigSheet();
      const config = {};
      
      // 基本設定シートから読み込み
      const basicSheet = spreadsheet.getSheetByName('基本設定');
      if (basicSheet) {
        const basicData = basicSheet.getDataRange().getValues();
        for (let i = 1; i < basicData.length; i++) {
          const [key, value] = basicData[i];
          if (key && value !== '') {
            // 数値型の値を文字列に変換
            config[key] = typeof value === 'number' ? value.toString() : value;
          }
        }
      }
      
      // メールフィルタ設定シートから読み込み
      const filterSheet = spreadsheet.getSheetByName('メールフィルタ設定');
      if (filterSheet) {
        const filterData = filterSheet.getDataRange().getValues();
        for (let i = 1; i < filterData.length; i++) {
          const [key, value] = filterData[i];
          if (key && value !== '' && !key.startsWith('===')) {
            // 数値型の値を文字列に変換
            config[key] = typeof value === 'number' ? value.toString() : value;
          }
        }
      }
      
      console.log('[ConfigManager] スプレッドシートから設定を読み込み完了');
      console.log('[ConfigManager] 読み込まれた設定項目数:', Object.keys(config).length);
      
      return config;
      
    } catch (error) {
      console.error('[ConfigManager] 設定読み込みエラー:', error.message);
      throw new Error(`設定の読み込みに失敗しました: ${error.message}`);
    }
  }
  
  /**
   * スプレッドシートに設定を保存（全シート対応）
   * @param {Object} config 設定オブジェクト
   */
  static saveConfigToSheet(config) {
    try {
      const spreadsheet = this.getConfigSheet();
      
      // 基本設定シートに保存
      const basicSheet = spreadsheet.getSheetByName('基本設定');
      if (basicSheet) {
        this._updateSheetConfig(basicSheet, config);
      }
      
      // メールフィルタ設定シートに保存
      const filterSheet = spreadsheet.getSheetByName('メールフィルタ設定');
      if (filterSheet) {
        this._updateSheetConfig(filterSheet, config);
      }
      
      console.log('[ConfigManager] スプレッドシートに設定を保存完了');
      
    } catch (error) {
      console.error('[ConfigManager] 設定保存エラー:', error.message);
      throw new Error(`設定の保存に失敗しました: ${error.message}`);
    }
  }
  
  /**
   * 指定シートの設定を更新
   * @private
   * @param {Sheet} sheet 対象シート
   * @param {Object} config 設定オブジェクト
   */
  static _updateSheetConfig(sheet, config) {
    const data = sheet.getDataRange().getValues();
    
    // キーマッピング（設定オブジェクトのキー → スプレッドシートのキー）
    const keyMapping = {
      'executionHour': 'EXECUTION_HOUR',
      'executionFrequency': 'EXECUTION_FREQUENCY',
      'dataRangeDays': 'DATA_RANGE_DAYS',
      'enableAiAnalysis': 'ENABLE_AI_ANALYSIS',
      'enableVoiceInput': 'ENABLE_VOICE_INPUT',
      'enableGmailAnalysis': 'ENABLE_GMAIL_ANALYSIS',
      'notionToken': 'NOTION_TOKEN',
      'notionDatabaseId': 'NOTION_DATABASE_ID',
      'geminiApiKey': 'GEMINI_API_KEY',
      'claudeApiKey': 'CLAUDE_API_KEY'
    };
    
    for (let i = 1; i < data.length; i++) {
      const sheetKey = data[i][0]; // スプレッドシートのキー（例: EXECUTION_HOUR）
      
      // 設定オブジェクトから対応する値を探す
      let configValue = null;
      
      // 1. 直接キーマッチング
      if (config.hasOwnProperty(sheetKey)) {
        configValue = config[sheetKey];
      } else {
        // 2. キーマッピングを使用
        for (const [configKey, mappedKey] of Object.entries(keyMapping)) {
          if (mappedKey === sheetKey && config.hasOwnProperty(configKey)) {
            configValue = config[configKey];
            break;
          }
        }
      }
      
      // 値が見つかった場合は更新
      if (configValue !== null && configValue !== undefined) {
        // 値を文字列に変換（boolean や number も文字列として保存）
        const stringValue = typeof configValue === 'boolean' ? configValue.toString() : 
                           typeof configValue === 'number' ? configValue.toString() : 
                           configValue;
        
        sheet.getRange(i + 1, 2).setValue(stringValue);
        console.log(`[ConfigManager] ${sheetKey}を${stringValue}に更新`);
      }
    }
  }
  
  /**
   * スプレッドシートの設定をPropertiesServiceに同期
   */
  static syncSheetToProperties() {
    try {
      const sheetConfig = this.loadConfigFromSheet();
      
      // PropertiesServiceに保存
      const props = PropertiesService.getScriptProperties();
      Object.keys(sheetConfig).forEach(key => {
        if (sheetConfig[key]) {
          props.setProperty(key, sheetConfig[key]);
        }
      });
      
      console.log('[ConfigManager] スプレッドシート設定をPropertiesServiceに同期完了');
      
    } catch (error) {
      console.error('[ConfigManager] 設定同期エラー:', error.message);
      throw new Error(`設定の同期に失敗しました: ${error.message}`);
    }
  }
  
  /**
   * 初期化処理（設定シート作成と初期設定）
   */
  static initialize() {
    try {
      console.log('[ConfigManager] 初期化開始');
      
      // 設定シートを取得または作成
      const sheet = this.getConfigSheet();
      
      // 既存の設定があればPropertiesServiceに同期
      this.syncSheetToProperties();
      
      console.log('[ConfigManager] 初期化完了');
      return {
        success: true,
        message: '設定の初期化が完了しました',
        sheetUrl: sheet.getUrl()
      };
      
    } catch (error) {
      console.error('[ConfigManager] 初期化エラー:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * テスト用関数 - 設定初期化
 */
function testConfigInitialization() {
  console.log('=== スプレッドシート設定初期化 ===');
  
  try {
    const result = ConfigManager.initialize();
    
    if (result.success) {
      console.log('✅ 初期化成功:', result.message);
      console.log('📊 設定シートURL:', result.sheetUrl);
      
      // 設定確認
      const config = ConfigManager.getConfig();
      console.log('📋 現在の設定:', config);
      
    } else {
      console.error('❌ 初期化エラー:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 初期化エラー:', error.message);
  }
  
  console.log('=== 初期化完了 ===');
}

/**
 * テスト用関数 - 設定テスト
 */
function testConfigOperations() {
  console.log('=== 設定操作テスト ===');
  
  try {
    // 1. 設定の保存テスト
    console.log('1. 設定保存テスト');
    ConfigManager.setConfig({
      notionToken: 'test_notion_token',
      notionDatabaseId: 'test_database_id',
      aiProvider: AI_PROVIDER.GEMINI,
      geminiApiKey: 'test_gemini_key',
      enableAiAnalysis: true
    });
    console.log('✅ 設定保存完了');
    
    // 2. 設定の読み込みテスト
    console.log('2. 設定読み込みテスト');
    const config = ConfigManager.getConfig();
    console.log('📋 読み込まれた設定:', config);
    
    // 3. バリデーションテスト
    console.log('3. バリデーションテスト');
    const validation = ConfigManager.validateConfig();
    console.log('🔍 バリデーション結果:', validation);
    
    console.log('✅ 全テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}/**
 * 
メールフィルタ設定管理用関数群
 */

/**
 * メールフィルタ設定シートを開く
 */
function openEmailFilterSettings() {
  try {
    const spreadsheet = ConfigManager.getConfigSheet();
    const url = spreadsheet.getUrl() + '#gid=' + spreadsheet.getSheetByName('メールフィルタ設定').getSheetId();
    
    console.log('📊 メールフィルタ設定シートURL:', url);
    console.log('💡 このURLをブラウザで開いて設定を編集してください');
    
    return {
      success: true,
      url: url,
      message: 'メールフィルタ設定シートを開きました'
    };
    
  } catch (error) {
    console.error('❌ 設定シートオープンエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 現在のメールフィルタ設定を表示
 */
function showCurrentEmailFilterSettings() {
  console.log('=== 現在のメールフィルタ設定 ===');
  
  try {
    // スプレッドシートから最新設定を読み込み
    ConfigManager.syncSheetToProperties();
    const config = ConfigManager.getConfig();
    
    console.log('📧 基本設定:');
    console.log(`- 検索クエリ: ${config.gmailSearchQuery}`);
    console.log(`- 最大取得件数: ${config.gmailMaxResults}`);
    console.log(`- 調査期間: ${config.gmailDateRangeDays}日`);
    console.log(`- 自動除外カテゴリ: ${config.gmailAutoExcludeCategories}`);
    console.log(`- 最小件名文字数: ${config.gmailMinSubjectLength}`);
    
    console.log('\n🚫 除外設定:');
    console.log(`- 除外送信者: ${config.gmailExcludeSenders}`);
    console.log(`- 除外ドメイン: ${config.gmailExcludeDomains}`);
    console.log(`- 除外ラベル: ${config.gmailExcludeLabels}`);
    console.log(`- 除外キーワード: ${config.gmailExcludeKeywords}`);
    
    console.log('\n✅ 含める設定:');
    console.log(`- 含める送信者: ${config.gmailIncludeSenders || 'なし'}`);
    console.log(`- 含めるキーワード: ${config.gmailIncludeKeywords}`);
    console.log(`- 高優先度キーワード: ${config.gmailHighPriorityKeywords}`);
    
    console.log('\n🤖 AI分析設定:');
    console.log(`- スパムフィルタ: ${config.gmailEnableSpamFilter}`);
    console.log(`- Gemini分析: ${config.gmailEnableGeminiAnalysis}`);
    console.log(`- 処理済み管理: ${config.gmailProcessedTracking}`);
    
    // 実際のクエリ構築テスト
    console.log('\n🔍 構築されるGmailクエリ:');
    try {
      const filter = new EmailFilter(config);
      const query = filter.buildSearchQuery();
      console.log(query);
    } catch (error) {
      console.log('クエリ構築でエラーが発生しました:', error.message);
      console.log('基本クエリ:', config.gmailSearchQuery || 'in:inbox -is:archived');
    }
    
  } catch (error) {
    console.error('❌ 設定表示エラー:', error.message);
  }
  
  console.log('\n=== 設定表示完了 ===');
}

/**
 * メールフィルタ設定のテンプレートを適用
 * @param {string} templateType テンプレートタイプ（business/personal/strict）
 */
function applyEmailFilterTemplate(templateType = 'business') {
  console.log(`=== ${templateType}テンプレート適用 ===`);
  
  try {
    const templates = {
      business: {
        GMAIL_EXCLUDE_SENDERS: 'noreply@,newsletter@,marketing@,info@,support@,no-reply@',
        GMAIL_EXCLUDE_DOMAINS: 'mailchimp.com,constantcontact.com,sendgrid.net,mailgun.org',
        GMAIL_EXCLUDE_KEYWORDS: '配信停止,unsubscribe,広告,セール,キャンペーン,割引,プレゼント,無料,限定',
        GMAIL_INCLUDE_KEYWORDS: '会議,打ち合わせ,確認,依頼,締切,提出,作成,レビュー,承認,決裁',
        GMAIL_HIGH_PRIORITY_KEYWORDS: '緊急,至急,重要,ASAP,締切,urgent,即対応',
        GMAIL_MIN_SUBJECT_LENGTH: '3',
        GMAIL_ENABLE_SPAM_FILTER: 'true'
      },
      personal: {
        GMAIL_EXCLUDE_SENDERS: 'noreply@,newsletter@,marketing@,promotion@',
        GMAIL_EXCLUDE_DOMAINS: 'mailchimp.com,constantcontact.com',
        GMAIL_EXCLUDE_KEYWORDS: '配信停止,unsubscribe,広告,セール,キャンペーン',
        GMAIL_INCLUDE_KEYWORDS: '会議,打ち合わせ,確認,依頼,重要',
        GMAIL_HIGH_PRIORITY_KEYWORDS: '緊急,至急,重要,ASAP',
        GMAIL_MIN_SUBJECT_LENGTH: '2',
        GMAIL_ENABLE_SPAM_FILTER: 'true'
      },
      strict: {
        GMAIL_EXCLUDE_SENDERS: 'noreply@,newsletter@,marketing@,info@,support@,no-reply@,donotreply@',
        GMAIL_EXCLUDE_DOMAINS: 'mailchimp.com,constantcontact.com,sendgrid.net,mailgun.org,amazonses.com',
        GMAIL_EXCLUDE_KEYWORDS: '配信停止,unsubscribe,広告,セール,キャンペーン,割引,プレゼント,無料,限定,宣伝,営業,お得',
        GMAIL_INCLUDE_KEYWORDS: '会議,打ち合わせ,確認,依頼,締切,提出,作成,レビュー,承認,決裁,契約',
        GMAIL_HIGH_PRIORITY_KEYWORDS: '緊急,至急,重要,ASAP,締切,urgent,即対応,最優先',
        GMAIL_MIN_SUBJECT_LENGTH: '5',
        GMAIL_ENABLE_SPAM_FILTER: 'true'
      }
    };
    
    const template = templates[templateType];
    if (!template) {
      console.error('❌ 無効なテンプレートタイプ:', templateType);
      console.log('💡 利用可能なテンプレート: business, personal, strict');
      return;
    }
    
    // スプレッドシートに設定を保存
    ConfigManager.saveConfigToSheet(template);
    
    // PropertiesServiceにも同期
    ConfigManager.syncSheetToProperties();
    
    console.log(`✅ ${templateType}テンプレートを適用しました`);
    console.log('📊 設定内容:');
    Object.keys(template).forEach(key => {
      console.log(`- ${key}: ${template[key]}`);
    });
    
  } catch (error) {
    console.error('❌ テンプレート適用エラー:', error.message);
  }
  
  console.log('=== テンプレート適用完了 ===');
}

/**
 * メールフィルタ設定のバックアップを作成
 */
function backupEmailFilterSettings() {
  console.log('=== メールフィルタ設定バックアップ ===');
  
  try {
    const config = ConfigManager.loadConfigFromSheet();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `AI Task Manager - 設定バックアップ_${timestamp}`;
    
    // 新しいスプレッドシートを作成
    const backupSpreadsheet = SpreadsheetApp.create(backupName);
    const backupSheet = backupSpreadsheet.getActiveSheet();
    backupSheet.setName('バックアップ設定');
    
    // 設定をバックアップシートに書き込み
    const backupData = [['設定項目', '値', 'バックアップ日時']];
    Object.keys(config).forEach(key => {
      backupData.push([key, config[key], new Date().toLocaleString('ja-JP')]);
    });
    
    const range = backupSheet.getRange(1, 1, backupData.length, 3);
    range.setValues(backupData);
    
    // フォーマット
    backupSheet.getRange(1, 1, 1, 3).setBackground('#ea4335').setFontColor('white').setFontWeight('bold');
    backupSheet.setColumnWidth(1, 250);
    backupSheet.setColumnWidth(2, 350);
    backupSheet.setColumnWidth(3, 200);
    
    console.log('✅ バックアップ作成完了');
    console.log('📊 バックアップURL:', backupSpreadsheet.getUrl());
    console.log('📋 バックアップ項目数:', Object.keys(config).length);
    
    return {
      success: true,
      url: backupSpreadsheet.getUrl(),
      itemCount: Object.keys(config).length
    };
    
  } catch (error) {
    console.error('❌ バックアップエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 簡単設定管理用関数
 */
function manageEmailFilterSettings() {
  console.log('=== メールフィルタ設定管理 ===');
  console.log('');
  console.log('📊 利用可能な操作:');
  console.log('1. openEmailFilterSettings() - 設定シートを開く');
  console.log('2. showCurrentEmailFilterSettings() - 現在の設定を表示');
  console.log('3. applyEmailFilterTemplate("business") - ビジネステンプレート適用');
  console.log('4. applyEmailFilterTemplate("personal") - 個人用テンプレート適用');
  console.log('5. applyEmailFilterTemplate("strict") - 厳格テンプレート適用');
  console.log('6. backupEmailFilterSettings() - 設定をバックアップ');
  console.log('7. testRealEmailFiltering() - 実際のメールでテスト');
  console.log('');
  console.log('💡 まずは openEmailFilterSettings() を実行してスプレッドシートを開いてください');
}