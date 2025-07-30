/**
 * 処理済みメール管理クラス
 * 要件: 一度処理したメールの重複処理を防止
 */
class ProcessedEmailTracker {
  
  static get SHEET_NAME() {
    return 'ProcessedEmails';
  }
  
  /**
   * 処理済みメール管理シートを取得または作成
   * @returns {Sheet} 処理済みメール管理シート
   */
  static getOrCreateSheet() {
    try {
      const configSheet = ConfigManager.getConfigSheet();
      
      // 既存のシートを検索
      const sheets = configSheet.getSheets();
      let processedSheet = null;
      for (const sheet of sheets) {
        if (sheet.getName() === this.SHEET_NAME) {
          processedSheet = sheet;
          break;
        }
      }
      
      if (!processedSheet) {
        // シートが存在しない場合は新規作成
        processedSheet = configSheet.insertSheet(ProcessedEmailTracker.SHEET_NAME);
        
        // ヘッダーを設定
        const headers = ['処理日時', 'メッセージID', '件名', '送信日時', 'ステータス', '抽出タスク数'];
        processedSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        
        // フォーマット設定
        processedSheet.getRange(1, 1, 1, headers.length)
          .setBackground('#34a853')
          .setFontColor('white')
          .setFontWeight('bold');
        
        // 列幅設定
        processedSheet.setColumnWidth(1, 150); // 処理日時
        processedSheet.setColumnWidth(2, 200); // メッセージID
        processedSheet.setColumnWidth(3, 300); // 件名
        processedSheet.setColumnWidth(4, 150); // 送信日時
        processedSheet.setColumnWidth(5, 100); // ステータス
        processedSheet.setColumnWidth(6, 120); // 抽出タスク数
        
        console.log('[ProcessedEmailTracker] 処理済みメール管理シートを作成しました');
      }
      
      return processedSheet;
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] シート取得エラー:', error.message);
      throw new Error(`処理済みメール管理シートの取得に失敗しました: ${error.message}`);
    }
  }
  
  /**
   * 処理済みメールを記録
   * @param {string} messageId メッセージID
   * @param {string} subject 件名
   * @param {Date} date 送信日時
   * @param {number} taskCount 抽出されたタスク数
   */
  static markAsProcessed(messageId, subject, date, taskCount = 0) {
    try {
      const sheet = this.getOrCreateSheet();
      
      // 既に記録されているかチェック
      if (this.isProcessed(messageId)) {
        console.log(`[ProcessedEmailTracker] 既に処理済み: ${subject}`);
        return;
      }
      
      // 新しい行を追加
      sheet.appendRow([
        new Date(),                    // 処理日時
        messageId,                     // メッセージID
        subject,                       // 件名
        date,                         // 送信日時
        'processed',                  // ステータス
        taskCount                     // 抽出タスク数
      ]);
      
      console.log(`[ProcessedEmailTracker] 処理済みとして記録: ${subject}`);
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] 記録エラー:', error.message);
      // エラーが発生しても処理を継続
    }
  }
  
  /**
   * 処理済みかチェック
   * @param {string} messageId メッセージID
   * @returns {boolean} 処理済みの場合true
   */
  static isProcessed(messageId) {
    try {
      const sheet = this.getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      // ヘッダー行をスキップして検索
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === messageId) {
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] チェックエラー:', error.message);
      // エラーが発生した場合は未処理として扱う
      return false;
    }
  }
  
  /**
   * 古い記録を削除（指定日数以上前）
   * @param {number} daysToKeep 保持する日数（デフォルト: 30日）
   * @returns {Object} 削除結果
   */
  static cleanupOldRecords(daysToKeep = 30) {
    try {
      console.log(`[ProcessedEmailTracker] ${daysToKeep}日以上前の記録を削除開始`);
      
      const sheet = this.getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) {
        console.log('[ProcessedEmailTracker] 削除対象の記録がありません');
        return {
          success: true,
          deletedCount: 0,
          totalRecords: 0,
          message: '削除対象の記録がありません'
        };
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      console.log(`[ProcessedEmailTracker] 削除基準日: ${cutoffDate.toLocaleString('ja-JP')}`);
      
      let deletedCount = 0;
      const totalRecords = data.length - 1; // ヘッダー除く
      
      // 削除対象の行を特定
      const rowsToDelete = [];
      for (let i = 1; i < data.length; i++) {
        const processedDate = new Date(data[i][0]);
        if (processedDate < cutoffDate) {
          rowsToDelete.push(i + 1); // シートの行番号（1ベース）
        }
      }
      
      console.log(`[ProcessedEmailTracker] 削除対象行数: ${rowsToDelete.length}`);
      
      // 下から上に向かって削除（行番号がずれないように）
      for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        const rowNumber = rowsToDelete[i];
        sheet.deleteRow(rowNumber);
        deletedCount++;
        
        // 進捗表示（100件ごと）
        if (deletedCount % 100 === 0) {
          console.log(`[ProcessedEmailTracker] 削除進捗: ${deletedCount}/${rowsToDelete.length}`);
        }
      }
      
      console.log(`[ProcessedEmailTracker] ${deletedCount}件の古い記録を削除完了`);
      
      return {
        success: true,
        deletedCount: deletedCount,
        totalRecords: totalRecords,
        remainingRecords: totalRecords - deletedCount,
        cutoffDate: cutoffDate.toLocaleString('ja-JP'),
        message: `${deletedCount}件の古い記録を削除しました`
      };
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] クリーンアップエラー:', error.message);
      return {
        success: false,
        error: error.message,
        deletedCount: 0
      };
    }
  }
  
  /**
   * 全ての処理済み記録を削除（完全リセット）
   * @returns {Object} 削除結果
   */
  static clearAllRecords() {
    try {
      console.log('[ProcessedEmailTracker] 全記録削除開始');
      
      const sheet = this.getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) {
        console.log('[ProcessedEmailTracker] 削除対象の記録がありません');
        return {
          success: true,
          deletedCount: 0,
          message: '削除対象の記録がありません'
        };
      }
      
      const totalRecords = data.length - 1; // ヘッダー除く
      
      // ヘッダー以外の全行を削除
      if (data.length > 1) {
        sheet.deleteRows(2, data.length - 1);
      }
      
      console.log(`[ProcessedEmailTracker] ${totalRecords}件の全記録を削除完了`);
      
      return {
        success: true,
        deletedCount: totalRecords,
        message: `${totalRecords}件の全記録を削除しました`
      };
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] 全削除エラー:', error.message);
      return {
        success: false,
        error: error.message,
        deletedCount: 0
      };
    }
  }
  
  /**
   * 重複記録を削除
   * @returns {Object} 削除結果
   */
  static removeDuplicateRecords() {
    try {
      console.log('[ProcessedEmailTracker] 重複記録削除開始');
      
      const sheet = this.getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) {
        console.log('[ProcessedEmailTracker] 削除対象の記録がありません');
        return {
          success: true,
          deletedCount: 0,
          message: '削除対象の記録がありません'
        };
      }
      
      const seenMessageIds = new Set();
      const rowsToDelete = [];
      
      // 重複チェック（メッセージIDベース）
      for (let i = 1; i < data.length; i++) {
        const messageId = data[i][1]; // メッセージID列
        
        if (seenMessageIds.has(messageId)) {
          // 重複発見
          rowsToDelete.push(i + 1); // シートの行番号（1ベース）
        } else {
          seenMessageIds.add(messageId);
        }
      }
      
      console.log(`[ProcessedEmailTracker] 重複記録数: ${rowsToDelete.length}`);
      
      // 下から上に向かって削除
      let deletedCount = 0;
      for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        const rowNumber = rowsToDelete[i];
        sheet.deleteRow(rowNumber);
        deletedCount++;
      }
      
      console.log(`[ProcessedEmailTracker] ${deletedCount}件の重複記録を削除完了`);
      
      return {
        success: true,
        deletedCount: deletedCount,
        uniqueRecords: seenMessageIds.size,
        message: `${deletedCount}件の重複記録を削除しました`
      };
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] 重複削除エラー:', error.message);
      return {
        success: false,
        error: error.message,
        deletedCount: 0
      };
    }
  }
  
  /**
   * 処理済みメール統計を取得
   * @returns {Object} 統計情報
   */
  static getStatistics() {
    try {
      const sheet = this.getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) {
        return {
          totalProcessed: 0,
          totalTasks: 0,
          averageTasksPerEmail: 0,
          lastProcessedDate: null
        };
      }
      
      let totalTasks = 0;
      let lastProcessedDate = null;
      
      // ヘッダー行をスキップして集計
      for (let i = 1; i < data.length; i++) {
        const taskCount = parseInt(data[i][5]) || 0;
        totalTasks += taskCount;
        
        const processedDate = new Date(data[i][0]);
        if (!lastProcessedDate || processedDate > lastProcessedDate) {
          lastProcessedDate = processedDate;
        }
      }
      
      const totalProcessed = data.length - 1;
      const averageTasksPerEmail = totalProcessed > 0 ? (totalTasks / totalProcessed).toFixed(2) : 0;
      
      return {
        totalProcessed: totalProcessed,
        totalTasks: totalTasks,
        averageTasksPerEmail: parseFloat(averageTasksPerEmail),
        lastProcessedDate: lastProcessedDate
      };
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] 統計取得エラー:', error.message);
      return {
        totalProcessed: 0,
        totalTasks: 0,
        averageTasksPerEmail: 0,
        lastProcessedDate: null
      };
    }
  }
  
  /**
   * 処理済みメール一覧を取得
   * @param {number} limit 取得件数制限（デフォルト: 100）
   * @returns {Array} 処理済みメール一覧
   */
  static getProcessedEmails(limit = 100) {
    try {
      const sheet = this.getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) {
        return [];
      }
      
      // ヘッダーを除いて最新のものから取得
      const emails = [];
      const startIndex = Math.max(1, data.length - limit);
      
      for (let i = data.length - 1; i >= startIndex; i--) {
        emails.push({
          processedDate: data[i][0],
          messageId: data[i][1],
          subject: data[i][2],
          sentDate: data[i][3],
          status: data[i][4],
          taskCount: parseInt(data[i][5]) || 0
        });
      }
      
      return emails;
      
    } catch (error) {
      console.error('[ProcessedEmailTracker] 一覧取得エラー:', error.message);
      return [];
    }
  }
}

/**
 * 簡単実行用関数
 */
function runTest() {
  testProcessedEmailTracker();
}

/**
 * テスト用関数 - 処理済みメール管理テスト
 */
function testProcessedEmailTracker() {
  console.log('=== 処理済みメール管理テスト ===');
  
  try {
    // 1. テストデータの記録
    console.log('1. テストデータ記録');
    ProcessedEmailTracker.markAsProcessed(
      'test_message_001',
      'テスト会議の件',
      new Date(),
      2
    );
    
    ProcessedEmailTracker.markAsProcessed(
      'test_message_002',
      'プロジェクト進捗確認',
      new Date(),
      1
    );
    
    // 2. 処理済みチェック
    console.log('2. 処理済みチェック');
    const isProcessed1 = ProcessedEmailTracker.isProcessed('test_message_001');
    const isProcessed2 = ProcessedEmailTracker.isProcessed('test_message_999');
    
    console.log(`test_message_001 処理済み: ${isProcessed1}`);
    console.log(`test_message_999 処理済み: ${isProcessed2}`);
    
    // 3. 統計情報取得
    console.log('3. 統計情報取得');
    const stats = ProcessedEmailTracker.getStatistics();
    console.log('統計情報:', stats);
    
    // 4. 処理済みメール一覧取得
    console.log('4. 処理済みメール一覧取得');
    const emails = ProcessedEmailTracker.getProcessedEmails(5);
    console.log(`取得件数: ${emails.length}`);
    
    console.log('✅ 処理済みメール管理テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('=== テスト完了 ===');
}