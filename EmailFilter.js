/**
 * メールフィルタリングクラス
 * 要件: 高度なメールフィルタリングとスパム除外
 */
class EmailFilter {
  
  constructor(config) {
    this.config = config;
  }
  
  /**
   * Gmail検索クエリを構築（受信箱のアーカイブされていないメール対象）
   * @param {string} baseQuery ベースとなる検索クエリ
   * @returns {string} 構築された検索クエリ
   */
  buildSearchQuery(baseQuery = null) {
    try {
      // 受信箱のアーカイブされていないメールを基本とする
      let query = baseQuery || 'in:inbox -is:archived';
      
      console.log(`[EmailFilter] ベースクエリ: ${query}`);
      
      // 日付範囲を追加
      if (this.config.gmailDateRangeDays && this.config.gmailDateRangeDays > 0) {
        const days = this.config.gmailDateRangeDays;
        query += ` newer_than:${days}d`;
        console.log(`[EmailFilter] 日付範囲追加: ${days}日以内`);
      }
      
      // 自動除外カテゴリ（プロモーション、ソーシャル、スパム）
      if (this.config.gmailAutoExcludeCategories !== false) {
        query += ' -category:promotions -category:social -category:spam';
        console.log(`[EmailFilter] 自動除外カテゴリ追加`);
      }
      
      // 除外送信者を追加
      if (this.config.gmailExcludeSenders) {
        const excludeSenders = this.config.gmailExcludeSenders.split(',');
        for (let i = 0; i < excludeSenders.length; i++) {
          const trimmedSender = excludeSenders[i].trim();
          if (trimmedSender) {
            query += ` -from:${trimmedSender}`;
          }
        }
        console.log(`[EmailFilter] 除外送信者追加: ${excludeSenders.length}件`);
      }
      
      // 除外ドメインを追加
      if (this.config.gmailExcludeDomains) {
        const excludeDomains = this.config.gmailExcludeDomains.split(',');
        for (let i = 0; i < excludeDomains.length; i++) {
          const trimmedDomain = excludeDomains[i].trim();
          if (trimmedDomain) {
            query += ` -from:*@${trimmedDomain}`;
          }
        }
        console.log(`[EmailFilter] 除外ドメイン追加: ${excludeDomains.length}件`);
      }
      
      // 含める送信者を追加（優先度高）
      if (this.config.gmailIncludeSenders) {
        const includeSenders = this.config.gmailIncludeSenders.split(',');
        const validSenders = includeSenders.filter(sender => sender.trim());
        
        if (validSenders.length > 0) {
          const includeQuery = validSenders.map(sender => `from:${sender.trim()}`).join(' OR ');
          query = `(${query}) OR (${includeQuery})`;
          console.log(`[EmailFilter] 含める送信者追加: ${validSenders.length}件`);
        }
      }
      
      console.log(`[EmailFilter] 最終クエリ: ${query}`);
      return query;
      
    } catch (error) {
      console.error(`[EmailFilter] クエリ構築エラー: ${error.message}`);
      return 'in:inbox -is:archived';
    }
  }
  
  /**
   * メールを処理すべきかどうかを判定（詳細フィルタリング）
   * @param {GmailMessage} message Gmailメッセージオブジェクト
   * @returns {Object} 判定結果 {shouldProcess: boolean, reason: string, priority: string}
   */
  shouldProcessEmail(message) {
    try {
      var subject = message.getSubject() || '';
      var from = message.getFrom() || '';
      var body = message.getPlainBody() || '';
      var labels = message.getThread().getLabels().map(label => label.getName());
      
      console.log('[EmailFilter] メール判定開始:', subject);
      
      // 1. 高優先度キーワードチェック（最優先）
      if (this.config.gmailHighPriorityKeywords) {
        var highPriorityKeywords = this.config.gmailHighPriorityKeywords.split(',');
        for (var i = 0; i < highPriorityKeywords.length; i++) {
          var keyword = highPriorityKeywords[i].trim();
          if (keyword && (subject.includes(keyword) || body.includes(keyword))) {
            console.log('[EmailFilter] 高優先度キーワード検出:', keyword);
            return {
              shouldProcess: true,
              reason: `高優先度キーワード: ${keyword}`,
              priority: '高'
            };
          }
        }
      }
      
      // 2. 除外ラベルチェック
      if (this.config.gmailExcludeLabels) {
        var excludeLabels = this.config.gmailExcludeLabels.split(',');
        for (var i = 0; i < excludeLabels.length; i++) {
          var excludeLabel = excludeLabels[i].trim();
          if (excludeLabel && labels.some(label => label.includes(excludeLabel))) {
            console.log('[EmailFilter] 除外ラベル検出:', excludeLabel);
            return {
              shouldProcess: false,
              reason: `除外ラベル: ${excludeLabel}`,
              priority: null
            };
          }
        }
      }
      
      // 3. スパムフィルタが有効な場合
      if (this.config.gmailEnableSpamFilter) {
        var spamResult = this.isSpamEmail(subject, from, body);
        if (spamResult.isSpam) {
          console.log('[EmailFilter] スパム判定でスキップ:', spamResult.reason);
          return {
            shouldProcess: false,
            reason: `スパム判定: ${spamResult.reason}`,
            priority: null
          };
        }
      }
      
      // 4. 含めるキーワードがある場合、それを優先
      if (this.config.gmailIncludeKeywords) {
        var includeKeywords = this.config.gmailIncludeKeywords.split(',');
        for (var i = 0; i < includeKeywords.length; i++) {
          var keyword = includeKeywords[i].trim();
          if (keyword && (subject.includes(keyword) || body.includes(keyword))) {
            console.log('[EmailFilter] 含めるキーワード検出:', keyword);
            return {
              shouldProcess: true,
              reason: `含めるキーワード: ${keyword}`,
              priority: '中'
            };
          }
        }
      }
      
      // 5. 除外キーワードチェック
      if (this.config.gmailExcludeKeywords) {
        var excludeKeywords = this.config.gmailExcludeKeywords.split(',');
        for (var i = 0; i < excludeKeywords.length; i++) {
          var keyword = excludeKeywords[i].trim();
          if (keyword && (subject.includes(keyword) || body.includes(keyword))) {
            console.log('[EmailFilter] 除外キーワード検出:', keyword);
            return {
              shouldProcess: false,
              reason: `除外キーワード: ${keyword}`,
              priority: null
            };
          }
        }
      }
      
      // 6. 件名の長さチェック（短すぎる件名は除外）
      if (this.config.gmailMinSubjectLength && subject.length < this.config.gmailMinSubjectLength) {
        console.log('[EmailFilter] 件名が短すぎるため除外:', subject);
        return {
          shouldProcess: false,
          reason: `件名が短すぎる（${subject.length}文字）`,
          priority: null
        };
      }
      
      // 7. デフォルト処理対象
      console.log('[EmailFilter] 処理対象メール:', subject);
      return {
        shouldProcess: true,
        reason: 'デフォルト処理対象',
        priority: '低'
      };
      
    } catch (error) {
      console.error('[EmailFilter] shouldProcessEmail エラー:', error.message);
      return {
        shouldProcess: false,
        reason: `エラー: ${error.message}`,
        priority: null
      };
    }
  }
  
  /**
   * スパムメール判定（詳細分析）
   * @param {string} subject 件名
   * @param {string} from 送信者
   * @param {string} body 本文
   * @returns {Object} 判定結果 {isSpam: boolean, reason: string, score: number}
   */
  isSpamEmail(subject, from, body) {
    try {
      var spamIndicators = [];
      var reasons = [];
      
      // 件名のスパム指標
      if (subject.includes('re:') && subject.includes('fwd:')) {
        spamIndicators.push(1);
        reasons.push('偽装転送');
      }
      if (subject.match(/[!]{3,}/) !== null) {
        spamIndicators.push(1);
        reasons.push('過度の感嘆符');
      }
      if (subject.match(/[0-9]{4,}/) !== null) {
        spamIndicators.push(0.5);
        reasons.push('長い数字列');
      }
      if (subject.includes('無料') || subject.includes('限定') || subject.includes('今すぐ')) {
        spamIndicators.push(1);
        reasons.push('宣伝文句');
      }
      
      // 送信者のスパム指標
      var spamSenderPatterns = [
        'noreply', 'no-reply', 'donotreply', 'newsletter', 
        'marketing', 'promotion', 'info@', 'support@'
      ];
      
      for (var i = 0; i < spamSenderPatterns.length; i++) {
        if (from.toLowerCase().includes(spamSenderPatterns[i])) {
          spamIndicators.push(0.8);
          reasons.push(`スパム送信者パターン: ${spamSenderPatterns[i]}`);
          break;
        }
      }
      
      // 本文のスパム指標
      var spamBodyPatterns = [
        '配信停止', 'unsubscribe', 'click here', 'クリック',
        '今すぐ', '限定', '無料', 'キャンペーン', 'セール',
        '割引', 'プレゼント', '当選'
      ];
      
      var bodySpamCount = 0;
      for (var i = 0; i < spamBodyPatterns.length; i++) {
        if (body.includes(spamBodyPatterns[i])) {
          bodySpamCount++;
        }
      }
      
      if (bodySpamCount >= 3) {
        spamIndicators.push(1.5);
        reasons.push(`宣伝文句多数（${bodySpamCount}個）`);
      } else if (bodySpamCount >= 1) {
        spamIndicators.push(0.5);
        reasons.push(`宣伝文句（${bodySpamCount}個）`);
      }
      
      // HTMLメールの過度な装飾
      if (body.includes('<') && body.includes('>')) {
        var htmlTagCount = (body.match(/<[^>]*>/g) || []).length;
        if (htmlTagCount > 20) {
          spamIndicators.push(0.7);
          reasons.push('過度なHTML装飾');
        }
      }
      
      // 総合スコア計算
      var totalScore = spamIndicators.reduce(function(sum, score) { return sum + score; }, 0);
      var isSpam = totalScore >= 2.0;
      
      if (isSpam) {
        console.log(`[EmailFilter] スパム判定: スコア${totalScore.toFixed(1)} - "${subject}"`);
        console.log(`[EmailFilter] スパム理由: ${reasons.join(', ')}`);
      }
      
      return {
        isSpam: isSpam,
        reason: reasons.join(', '),
        score: totalScore
      };
      
    } catch (error) {
      console.error(`[EmailFilter] スパム判定エラー: ${error.message}`);
      return {
        isSpam: false,
        reason: `判定エラー: ${error.message}`,
        score: 0
      };
    }
  }
  
  /**
   * Geminiを使用してメール内容を分析し、タスクを抽出
   * @param {GmailMessage} message Gmailメッセージオブジェクト
   * @param {Array} existingTasks 既存タスク一覧
   * @returns {Array} 抽出されたタスク配列
   */
  analyzeEmailWithGemini(message, existingTasks = []) {
    try {
      var config = ConfigManager.getConfig();
      
      if (!config.enableAiAnalysis || !config.geminiApiKey) {
        console.log('[EmailFilter] Gemini分析が無効またはAPIキーなし');
        return [];
      }
      
      var analyzer = new GeminiAnalyzer(config.geminiApiKey);
      
      var emailData = {
        subject: message.getSubject() || '',
        from: message.getFrom() || '',
        date: message.getDate(),
        body: message.getPlainBody() || '',
        attachments: message.getAttachments().map(function(att) { 
          return att.getName(); 
        })
      };
      
      console.log('[EmailFilter] Gemini分析開始:', emailData.subject);
      
      var tasks = analyzer.analyzeEmailForTasks(emailData, existingTasks);
      
      // タスクタイトルに「メール」プレフィックスが付いていない場合は追加
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].title && !tasks[i].title.startsWith('メール：')) {
          tasks[i].title = 'メール：' + tasks[i].title;
        }
      }
      
      console.log(`[EmailFilter] Gemini分析完了: ${tasks.length}個のタスクを抽出`);
      
      return tasks;
      
    } catch (error) {
      console.error('[EmailFilter] Gemini分析エラー:', error.message);
      return [];
    }
  }
  
  /**
   * フィルタリング統計を取得
   * @param {Array} messages 処理対象メッセージ配列
   * @returns {Object} 統計情報
   */
  getFilteringStats(messages) {
    try {
      var stats = {
        total: messages.length,
        processed: 0,
        skipped: 0,
        spam: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        reasons: {}
      };
      
      for (var i = 0; i < messages.length; i++) {
        var result = this.shouldProcessEmail(messages[i]);
        
        if (result.shouldProcess) {
          stats.processed++;
          
          switch (result.priority) {
            case '高':
              stats.highPriority++;
              break;
            case '中':
              stats.mediumPriority++;
              break;
            case '低':
              stats.lowPriority++;
              break;
          }
        } else {
          stats.skipped++;
          
          if (result.reason.includes('スパム')) {
            stats.spam++;
          }
        }
        
        // 理由別統計
        if (stats.reasons[result.reason]) {
          stats.reasons[result.reason]++;
        } else {
          stats.reasons[result.reason] = 1;
        }
      }
      
      return stats;
      
    } catch (error) {
      console.error('[EmailFilter] 統計取得エラー:', error.message);
      return {
        total: 0,
        processed: 0,
        skipped: 0,
        error: error.message
      };
    }
  }
}
/*
*
 * テスト用関数 - 改善されたメールフィルタリングのテスト
 */
function testEnhancedEmailFiltering() {
  console.log('=== 改善されたメールフィルタリングテスト ===');
  
  try {
    // 1. 設定取得
    var config = ConfigManager.getConfig();
    var filter = new EmailFilter(config);
    
    console.log('1. 設定確認');
    console.log('検索クエリ:', config.gmailSearchQuery);
    console.log('Gemini分析:', config.gmailEnableGeminiAnalysis);
    
    // 2. 検索クエリ構築テスト
    console.log('2. 検索クエリ構築テスト');
    var query = filter.buildSearchQuery();
    console.log('構築されたクエリ:', query);
    
    // 3. 実際のメール取得とフィルタリング
    console.log('3. メール取得とフィルタリング');
    var threads = GmailApp.search(query, 0, 10);
    console.log(`取得したスレッド数: ${threads.length}`);
    
    if (threads.length > 0) {
      var allMessages = [];
      
      // 各スレッドからメッセージを取得
      for (var i = 0; i < Math.min(threads.length, 3); i++) {
        var messages = threads[i].getMessages();
        allMessages = allMessages.concat(messages);
      }
      
      console.log(`処理対象メッセージ数: ${allMessages.length}`);
      
      // 4. フィルタリング統計
      console.log('4. フィルタリング統計');
      var stats = filter.getFilteringStats(allMessages);
      console.log('統計情報:', stats);
      
      // 5. 個別メール分析テスト
      if (allMessages.length > 0) {
        console.log('5. 個別メール分析テスト');
        var testMessage = allMessages[0];
        
        console.log('分析対象メール:', testMessage.getSubject());
        
        // フィルタリング判定
        var filterResult = filter.shouldProcessEmail(testMessage);
        console.log('フィルタリング結果:', filterResult);
        
        // Gemini分析（有効な場合）
        if (config.gmailEnableGeminiAnalysis && filterResult.shouldProcess) {
          console.log('6. Gemini分析テスト');
          var tasks = filter.analyzeEmailWithGemini(testMessage, []);
          console.log(`抽出されたタスク数: ${tasks.length}`);
          
          if (tasks.length > 0) {
            console.log('抽出されたタスク:');
            for (var j = 0; j < tasks.length; j++) {
              console.log(`- ${tasks[j].title} (優先度: ${tasks[j].priority})`);
            }
          }
        }
      }
    } else {
      console.log('ℹ️ 処理対象のメールがありません');
    }
    
    console.log('✅ 改善されたメールフィルタリングテスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 設定確認用関数
 */
function checkEmailFilterSettings() {
  console.log('=== メールフィルタ設定確認 ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    console.log('📧 Gmail設定:');
    console.log('- 検索クエリ:', config.gmailSearchQuery);
    console.log('- 最大取得件数:', config.gmailMaxResults);
    console.log('- 調査期間:', config.gmailDateRangeDays + '日');
    console.log('- 自動除外カテゴリ:', config.gmailAutoExcludeCategories);
    
    console.log('🚫 除外設定:');
    console.log('- 除外送信者:', config.gmailExcludeSenders);
    console.log('- 除外ドメイン:', config.gmailExcludeDomains);
    console.log('- 除外ラベル:', config.gmailExcludeLabels);
    console.log('- 除外キーワード:', config.gmailExcludeKeywords);
    console.log('- 最小件名文字数:', config.gmailMinSubjectLength);
    
    console.log('✅ 含める設定:');
    console.log('- 含める送信者:', config.gmailIncludeSenders);
    console.log('- 含めるキーワード:', config.gmailIncludeKeywords);
    console.log('- 高優先度キーワード:', config.gmailHighPriorityKeywords);
    
    console.log('🤖 AI分析設定:');
    console.log('- スパムフィルタ:', config.gmailEnableSpamFilter);
    console.log('- Gemini分析:', config.gmailEnableGeminiAnalysis);
    console.log('- 処理済み管理:', config.gmailProcessedTracking);
    
    // 実際のクエリ構築テスト
    var filter = new EmailFilter(config);
    var query = filter.buildSearchQuery();
    console.log('🔍 構築されるクエリ:', query);
    
  } catch (error) {
    console.error('❌ 設定確認エラー:', error.message);
  }
  
  console.log('=== 確認完了 ===');
}

/**
 * 簡単実行用関数
 */
function testEmailFilter() {
  testEnhancedEmailFiltering();
}/**
 * メール
タスクプレフィックステスト用関数
 */
function testEmailTaskPrefix() {
  console.log('=== メールタスクプレフィックステスト ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    if (!config.geminiApiKey) {
      console.error('❌ Gemini APIキーが設定されていません');
      return;
    }
    
    var analyzer = new GeminiAnalyzer(config.geminiApiKey);
    
    // テスト用メールデータ
    var testEmail = {
      subject: "プロジェクト資料の確認依頼",
      from: "client@example.com",
      date: new Date(),
      body: "添付の資料を確認して、来週の会議までにフィードバックをお願いします。修正点があれば教えてください。"
    };
    
    console.log('テスト対象メール:', testEmail.subject);
    
    // Gemini分析実行
    var tasks = analyzer.analyzeEmailForTasks(testEmail, []);
    
    console.log(`抽出されたタスク数: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('抽出されたタスク:');
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var hasPrefix = task.title.startsWith('メール：');
        console.log(`${i + 1}. ${task.title} (プレフィックス: ${hasPrefix ? '✅' : '❌'})`);
        console.log(`   優先度: ${task.priority}, 期日: ${task.due_date || 'なし'}`);
      }
    } else {
      console.log('ℹ️ タスクが抽出されませんでした');
    }
    
    // フォールバック分析もテスト
    console.log('\n--- フォールバック分析テスト ---');
    var fallbackTasks = analyzer._fallbackEmailAnalysis(testEmail);
    
    if (fallbackTasks.length > 0) {
      console.log('フォールバック抽出タスク:');
      for (var i = 0; i < fallbackTasks.length; i++) {
        var task = fallbackTasks[i];
        var hasPrefix = task.title.startsWith('メール：');
        console.log(`${i + 1}. ${task.title} (プレフィックス: ${hasPrefix ? '✅' : '❌'})`);
      }
    }
    
    console.log('✅ メールタスクプレフィックステスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}/*
*
 * 実際のGmailデータを使ったメールフィルタリングテスト
 */
function testRealEmailFiltering() {
  console.log('=== 実際のGmailデータでのメールフィルタリングテスト ===');
  
  try {
    // 1. 設定取得
    var config = ConfigManager.getConfig();
    var filter = new EmailFilter(config);
    
    console.log('1. 設定確認');
    console.log('検索クエリ:', config.gmailSearchQuery);
    console.log('Gemini分析:', config.gmailEnableGeminiAnalysis);
    console.log('最大取得件数:', config.gmailMaxResults);
    
    // 2. 実際のメール検索クエリ構築
    console.log('2. 実際のメール検索');
    var query = filter.buildSearchQuery();
    console.log('構築されたクエリ:', query);
    
    // 3. 実際のGmailからメール取得
    var threads = GmailApp.search(query, 0, Math.min(config.gmailMaxResults || 10, 10));
    console.log(`取得したスレッド数: ${threads.length}`);
    
    if (threads.length === 0) {
      console.log('ℹ️ 検索条件に一致するメールがありません');
      console.log('💡 検索条件を緩めてテストしてみます...');
      
      // フォールバック: より緩い条件で検索
      var fallbackQuery = 'in:inbox newer_than:3d';
      console.log('フォールバック検索クエリ:', fallbackQuery);
      threads = GmailApp.search(fallbackQuery, 0, 5);
      console.log(`フォールバック検索結果: ${threads.length}件`);
    }
    
    if (threads.length > 0) {
      var allMessages = [];
      var processedCount = 0;
      var tasksExtracted = [];
      
      // 各スレッドからメッセージを取得
      for (var i = 0; i < Math.min(threads.length, 3); i++) {
        var messages = threads[i].getMessages();
        var latestMessage = messages[messages.length - 1]; // 最新のメッセージのみ
        allMessages.push(latestMessage);
      }
      
      console.log(`処理対象メッセージ数: ${allMessages.length}`);
      
      // 4. 各メールの詳細分析
      for (var i = 0; i < allMessages.length; i++) {
        var message = allMessages[i];
        
        console.log(`\n--- メール ${i + 1} の分析 ---`);
        console.log('件名:', message.getSubject());
        console.log('送信者:', message.getFrom());
        console.log('受信日時:', message.getDate().toLocaleString('ja-JP'));
        
        // フィルタリング判定
        var filterResult = filter.shouldProcessEmail(message);
        console.log('フィルタリング結果:', filterResult);
        
        if (filterResult.shouldProcess) {
          processedCount++;
          
          // Gemini分析（有効な場合）
          if (config.gmailEnableGeminiAnalysis) {
            console.log('Gemini分析実行中...');
            var tasks = filter.analyzeEmailWithGemini(message, tasksExtracted);
            
            if (tasks.length > 0) {
              console.log(`抽出されたタスク数: ${tasks.length}`);
              for (var j = 0; j < tasks.length; j++) {
                var task = tasks[j];
                console.log(`- ${task.title} (優先度: ${task.priority}, 期日: ${task.due_date || 'なし'})`);
                tasksExtracted.push(task);
              }
            } else {
              console.log('タスクは抽出されませんでした');
            }
          }
        } else {
          console.log('スキップ理由:', filterResult.reason);
        }
      }
      
      // 5. 統計情報
      console.log('\n--- 処理統計 ---');
      var stats = filter.getFilteringStats(allMessages);
      console.log('総メール数:', stats.total);
      console.log('処理対象:', stats.processed);
      console.log('スキップ:', stats.skipped);
      console.log('高優先度:', stats.highPriority);
      console.log('中優先度:', stats.mediumPriority);
      console.log('低優先度:', stats.lowPriority);
      console.log('抽出タスク総数:', tasksExtracted.length);
      
      // 6. 理由別統計
      console.log('\n--- 理由別統計 ---');
      Object.keys(stats.reasons).forEach(function(reason) {
        console.log(`${reason}: ${stats.reasons[reason]}件`);
      });
      
    } else {
      console.log('❌ 処理対象のメールが見つかりませんでした');
      console.log('💡 以下を確認してください:');
      console.log('- Gmail検索クエリの設定');
      console.log('- 日付範囲の設定');
      console.log('- 除外条件の設定');
    }
    
    console.log('\n✅ 実際のGmailデータでのテスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 実際のカレンダーデータを使ったテスト
 */
function testRealCalendarData() {
  console.log('=== 実際のカレンダーデータでのテスト ===');
  
  try {
    var config = ConfigManager.getConfig();
    
    if (!config.geminiApiKey) {
      console.error('❌ Gemini APIキーが設定されていません');
      return;
    }
    
    var analyzer = new GeminiAnalyzer(config.geminiApiKey);
    
    // 1. 実際のカレンダーイベントを取得
    console.log('1. 実際のカレンダーデータ取得');
    var calendar = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    var events = calendar.getEvents(now, nextWeek);
    
    console.log(`取得したイベント数: ${events.length}`);
    
    if (events.length > 0) {
      var tasksExtracted = [];
      
      // 最大3つのイベントを分析
      for (var i = 0; i < Math.min(events.length, 3); i++) {
        var event = events[i];
        
        console.log(`\n--- イベント ${i + 1} の分析 ---`);
        console.log('タイトル:', event.getTitle());
        console.log('開始時刻:', event.getStartTime().toLocaleString('ja-JP'));
        console.log('終了時刻:', event.getEndTime().toLocaleString('ja-JP'));
        console.log('場所:', event.getLocation() || 'なし');
        
        var eventData = {
          summary: event.getTitle(),
          start: event.getStartTime(),
          end: event.getEndTime(),
          location: event.getLocation() || '',
          description: event.getDescription() || '',
          attendees: event.getGuestList().map(function(guest) { 
            return guest.getEmail(); 
          })
        };
        
        console.log('参加者数:', eventData.attendees.length);
        
        // Gemini分析実行
        console.log('Gemini分析実行中...');
        var tasks = analyzer.analyzeCalendarForTasks(eventData, tasksExtracted);
        
        if (tasks.length > 0) {
          console.log(`抽出されたタスク数: ${tasks.length}`);
          for (var j = 0; j < tasks.length; j++) {
            var task = tasks[j];
            console.log(`- ${task.title} (優先度: ${task.priority}, 期日: ${task.due_date || 'なし'})`);
            tasksExtracted.push(task);
          }
        } else {
          console.log('関連タスクは抽出されませんでした');
        }
      }
      
      console.log(`\n--- 総合結果 ---`);
      console.log(`分析したイベント数: ${Math.min(events.length, 3)}`);
      console.log(`抽出されたタスク総数: ${tasksExtracted.length}`);
      
    } else {
      console.log('ℹ️ 今後1週間のカレンダーイベントがありません');
    }
    
    console.log('\n✅ 実際のカレンダーデータでのテスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  }
  
  console.log('=== テスト完了 ===');
}

/**
 * 統合テスト（実際のデータ使用）
 */
function testRealDataIntegration() {
  console.log('=== 実際のデータを使った統合テスト ===');
  
  // 1. 実際のメールデータテスト
  testRealEmailFiltering();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 2. 実際のカレンダーデータテスト
  testRealCalendarData();
  
  console.log('\n=== 統合テスト完了 ===');
}