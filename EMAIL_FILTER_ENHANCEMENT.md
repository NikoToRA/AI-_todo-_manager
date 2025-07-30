# メールフィルタリング機能拡張

## 📧 現在の問題点

### 現在の設定
- **調査範囲**: `is:unread` のみ（未読メールのみ）
- **件数制限**: 50件固定
- **フィルタリング**: なし（すべてのメールを処理）
- **重複防止**: 基本的な仕組みのみ

### 必要な機能
1. **調査期間の設定**: 過去1週間、1ヶ月など
2. **処理済みメール管理**: 一度処理したメールは除外
3. **スパム・宣伝メール除外**: 自動フィルタリング
4. **送信者フィルタ**: 特定の送信者を除外/含める
5. **キーワードフィルタ**: 特定のキーワードで絞り込み

## 🔧 拡張設計

### 1. Config.gs の拡張

#### 新しい設定項目
```javascript
// メールフィルタ設定
GMAIL_SEARCH_QUERY: 'is:unread -category:promotions -category:social',
GMAIL_MAX_RESULTS: '50',
GMAIL_DATE_RANGE_DAYS: '7',
GMAIL_EXCLUDE_SENDERS: 'noreply@,newsletter@,marketing@',
GMAIL_INCLUDE_SENDERS: '',
GMAIL_EXCLUDE_KEYWORDS: '配信停止,unsubscribe,広告,セール',
GMAIL_INCLUDE_KEYWORDS: '会議,打ち合わせ,確認,依頼,締切',
GMAIL_ENABLE_SPAM_FILTER: 'true',
GMAIL_PROCESSED_TRACKING: 'true'
```

### 2. 処理済みメール管理

#### ProcessedEmailTracker クラス
```javascript
class ProcessedEmailTracker {
  static SHEET_NAME = 'ProcessedEmails';
  
  // 処理済みメールを記録
  static markAsProcessed(messageId, subject, date) {
    const sheet = this.getOrCreateSheet();
    sheet.appendRow([
      new Date(),
      messageId,
      subject,
      date,
      'processed'
    ]);
  }
  
  // 処理済みかチェック
  static isProcessed(messageId) {
    const sheet = this.getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    return data.some(row => row[1] === messageId);
  }
  
  // 古い記録を削除（30日以上前）
  static cleanupOldRecords() {
    const sheet = this.getOrCreateSheet();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    // 30日以上前の記録を削除
    // 実装詳細...
  }
}
```

### 3. 高度なメールフィルタリング

#### EmailFilter クラス
```javascript
class EmailFilter {
  constructor(config) {
    this.config = config;
  }
  
  // Gmail検索クエリを構築
  buildSearchQuery() {
    let query = this.config.gmailSearchQuery || 'is:unread';
    
    // 日付範囲を追加
    if (this.config.gmailDateRangeDays) {
      const days = parseInt(this.config.gmailDateRangeDays);
      query += ` newer_than:${days}d`;
    }
    
    // 除外送信者を追加
    if (this.config.gmailExcludeSenders) {
      const excludeSenders = this.config.gmailExcludeSenders.split(',');
      excludeSenders.forEach(sender => {
        query += ` -from:${sender.trim()}`;
      });
    }
    
    // 含める送信者を追加
    if (this.config.gmailIncludeSenders) {
      const includeSenders = this.config.gmailIncludeSenders.split(',');
      const includeQuery = includeSenders.map(sender => `from:${sender.trim()}`).join(' OR ');
      query += ` (${includeQuery})`;
    }
    
    return query;
  }
  
  // スパムフィルタ
  isSpamOrPromotion(message) {
    const subject = message.getSubject().toLowerCase();
    const body = message.getPlainBody().toLowerCase();
    
    // スパム・宣伝キーワード
    const spamKeywords = [
      '配信停止', 'unsubscribe', '広告', 'セール', 'キャンペーン',
      '無料', 'プレゼント', '当選', '限定', '今すぐ'
    ];
    
    return spamKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }
  
  // タスク関連メールかチェック
  isTaskRelated(message) {
    const subject = message.getSubject().toLowerCase();
    const body = message.getPlainBody().toLowerCase();
    
    // タスク関連キーワード
    const taskKeywords = [
      '会議', '打ち合わせ', 'ミーティング', '確認', '依頼', '締切',
      '提出', '作成', '準備', '対応', '検討', '相談'
    ];
    
    return taskKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }
  
  // メールをフィルタリング
  filterMessages(messages) {
    return messages.filter(message => {
      // 処理済みチェック
      if (ProcessedEmailTracker.isProcessed(message.getId())) {
        return false;
      }
      
      // スパムフィルタ
      if (this.config.gmailEnableSpamFilter === 'true' && this.isSpamOrPromotion(message)) {
        return false;
      }
      
      // タスク関連チェック
      return this.isTaskRelated(message);
    });
  }
}
```

### 4. 拡張されたTaskExtractor

#### Gmail処理の改良版
```javascript
class TaskExtractor {
  async extractFromGmail(customQuery = null, customMaxResults = null) {
    try {
      console.log('[TaskExtractor] Gmail分析開始');
      
      const config = this.config;
      const emailFilter = new EmailFilter(config);
      
      // 検索クエリを構築
      const query = customQuery || emailFilter.buildSearchQuery();
      const maxResults = customMaxResults || parseInt(config.gmailMaxResults || '50');
      
      console.log(`[TaskExtractor] Gmail検索クエリ: ${query}`);
      
      // Gmail APIでメール取得
      const threads = GmailApp.search(query, 0, maxResults);
      const allMessages = [];
      
      // スレッドからメッセージを取得
      threads.forEach(thread => {
        const messages = thread.getMessages();
        allMessages.push(...messages);
      });
      
      console.log(`[TaskExtractor] 取得メッセージ数: ${allMessages.length}`);
      
      // メールをフィルタリング
      const filteredMessages = emailFilter.filterMessages(allMessages);
      console.log(`[TaskExtractor] フィルタ後メッセージ数: ${filteredMessages.length}`);
      
      // 既存タスクを取得（重複チェック用）
      const existingTasks = await this.notionClient.getExistingTasks();
      const allTasks = [];
      
      for (const message of filteredMessages) {
        const emailData = {
          id: message.getId(),
          subject: message.getSubject(),
          from: message.getFrom(),
          date: message.getDate(),
          body: message.getPlainBody().substring(0, 1000) // 最初の1000文字
        };
        
        let tasks = [];
        
        // AI分析が有効な場合
        if (this.aiAnalyzer) {
          console.log(`[TaskExtractor] AI分析実行: ${emailData.subject}`);
          tasks = await this.aiAnalyzer.analyzeEmailForTasks(emailData, existingTasks);
        } else {
          // フォールバック: ルールベース分析
          tasks = this._extractTasksFromEmailBasic(emailData);
        }
        
        // 重複チェックとタスク追加
        for (const task of tasks) {
          const duplicateCheck = await this._checkDuplicate(task, existingTasks);
          
          if (duplicateCheck.action === 'create') {
            allTasks.push(task);
          } else if (duplicateCheck.action === 'update') {
            await this._updateExistingTask(duplicateCheck.duplicate_task_index, task, existingTasks);
          }
        }
        
        // 処理済みとしてマーク
        ProcessedEmailTracker.markAsProcessed(
          emailData.id,
          emailData.subject,
          emailData.date
        );
      }
      
      console.log(`[TaskExtractor] Gmail分析完了: ${allTasks.length}件のタスクを抽出`);
      return allTasks;
      
    } catch (error) {
      console.error('[TaskExtractor] Gmail分析エラー:', error.message);
      throw error;
    }
  }
}
```

## 📊 スプレッドシート設定項目

### 新しい設定シート構造
```
設定項目                    | 値                                           | 説明
---------------------------|----------------------------------------------|------------------
GMAIL_SEARCH_QUERY         | is:unread -category:promotions              | Gmail検索クエリ
GMAIL_MAX_RESULTS          | 50                                          | 最大取得件数
GMAIL_DATE_RANGE_DAYS      | 7                                           | 調査期間（日数）
GMAIL_EXCLUDE_SENDERS      | noreply@,newsletter@,marketing@             | 除外送信者
GMAIL_INCLUDE_SENDERS      |                                             | 含める送信者
GMAIL_EXCLUDE_KEYWORDS     | 配信停止,unsubscribe,広告,セール              | 除外キーワード
GMAIL_INCLUDE_KEYWORDS     | 会議,打ち合わせ,確認,依頼,締切                | 含めるキーワード
GMAIL_ENABLE_SPAM_FILTER   | true                                        | スパムフィルタ有効
GMAIL_PROCESSED_TRACKING   | true                                        | 処理済み管理有効
```

## 🎯 実装効果

### ✅ 期待される改善
1. **精度向上**: 不要なメールを自動除外
2. **効率化**: 処理済みメールの重複処理を防止
3. **カスタマイズ**: ユーザーの用途に応じた柔軟な設定
4. **管理性**: スプレッドシートでの直感的な設定変更

### 📋 使用例

#### 一般的な設定
```
GMAIL_SEARCH_QUERY: is:unread -category:promotions -category:social
GMAIL_DATE_RANGE_DAYS: 7
GMAIL_EXCLUDE_SENDERS: noreply@,newsletter@
GMAIL_INCLUDE_KEYWORDS: 会議,確認,依頼,締切
```

#### 厳格な設定
```
GMAIL_SEARCH_QUERY: is:unread has:attachment
GMAIL_DATE_RANGE_DAYS: 3
GMAIL_INCLUDE_SENDERS: boss@company.com,client@partner.com
GMAIL_INCLUDE_KEYWORDS: 緊急,重要,締切
```

この拡張により、メール処理がより実用的で効率的になります！