/**
 * 重複チェッククラス（ES5互換版）
 */
function TaskDuplicateChecker(notionClient) {
  this.notionClient = notionClient;
  this.similarityThreshold = 0.8; // 類似度閾値
}

/**
 * 基本的な重複チェック（ES5互換版）
 */
TaskDuplicateChecker.prototype.checkBasicDuplicate = function(newTask, existingTasks) {
  try {
    console.log('[DuplicateChecker.checkBasicDuplicate] チェック開始');
    console.log('  新タスク: "' + newTask.title + '" (ソース: ' + newTask.source + ', 元イベント: "' + (newTask.original_event || '') + '")');
    console.log('  既存タスク数: ' + existingTasks.length);
    
    for (var i = 0; i < existingTasks.length; i++) {
      var existingTask = existingTasks[i];
      console.log('  [' + (i + 1) + '/' + existingTasks.length + '] 既存: "' + existingTask.title + '" (ソース: ' + (existingTask.source || '') + ')');
      
      // 1. 完全一致チェック
      if (this.isExactMatch(newTask, existingTask)) {
        console.log('[DuplicateChecker] ✓ 完全一致検出: ' + existingTask.title);
        return true;
      }
      
      // 2. ソース重複チェック（優先度高）
      if (this.isSourceDuplicate(newTask, existingTask)) {
        console.log('[DuplicateChecker] ✓ ソース重複検出: ' + existingTask.title);
        return true;
      }
      
      // 3. タイトル類似度チェック
      if (this.isTitleSimilar(newTask.title, existingTask.title)) {
        console.log('[DuplicateChecker] ✓ タイトル類似検出: ' + existingTask.title);
        return true;
      }
      
      // 4. 日程重複チェック
      if (this.isDateConflict(newTask, existingTask)) {
        console.log('[DuplicateChecker] ✓ 日程重複検出: ' + existingTask.title);
        return true;
      }
    }
    
    console.log('[DuplicateChecker.checkBasicDuplicate] ✗ 重複なし: ' + newTask.title);
    return false;
    
  } catch (error) {
    console.error('[DuplicateChecker.checkBasicDuplicate] エラー: ' + error.message);
    // エラー時は安全側に倒して重複なしとする
    return false;
  }
};

/**
 * 完全一致チェック
 */
TaskDuplicateChecker.prototype.isExactMatch = function(newTask, existingTask) {
  return newTask.title.trim().toLowerCase() === existingTask.title.trim().toLowerCase() &&
         newTask.source === existingTask.source &&
         this.isSameDate(newTask.due_date, existingTask.due_date);
};

/**
 * タイトル類似度チェック（日付考慮版）
 */
TaskDuplicateChecker.prototype.isTitleSimilar = function(title1, title2) {
  if (!title1 || !title2) return false;
  
  // 日付付きタイトルから日付部分を除去して比較
  var cleanTitle1 = this.removeDateFromTitle(title1.trim().toLowerCase());
  var cleanTitle2 = this.removeDateFromTitle(title2.trim().toLowerCase());
  
  var similarity = Utils.calculateSimilarity(cleanTitle1, cleanTitle2);
  
  // 日付なしで類似度が高い場合は、元のタイトルから日付を抽出して比較
  if (similarity >= this.similarityThreshold) {
    var date1 = this.extractDateFromTitle(title1);
    var date2 = this.extractDateFromTitle(title2);
    
    console.log('[DuplicateChecker] 日付付きタイトル比較: "' + cleanTitle1 + '" vs "' + cleanTitle2 + '"');
    console.log('  日付1: ' + date1 + ', 日付2: ' + date2);
    
    // 片方に日付があり、もう片方にない場合は重複ではない
    if (date1 && !date2) {
      console.log('  → 新タスクに日付あり、既存タスクに日付なし: 重複ではない');
      return false;
    }
    
    // 両方に日付がある場合は日付を比較
    if (date1 && date2) {
      var isSameDate = date1 === date2;
      console.log('  → 同一日付: ' + isSameDate);
      return isSameDate;
    }
    
    // 両方とも日付がない場合は従来通り類似度で判定
    console.log('  → 両方とも日付なし: 類似度で判定');
    return true;
  }
  
  return false;
};

/**
 * 日程重複チェック（修正版）
 */
TaskDuplicateChecker.prototype.isDateConflict = function(newTask, existingTask) {
  if (!newTask.due_date || !existingTask.due_date) {
    return false;
  }
  
  // 同じ日付でなければ重複ではない
  if (!this.isSameDate(newTask.due_date, existingTask.due_date)) {
    return false;
  }
  
  // 同じ日付の場合、タイトルの類似度をチェック
  var newCleanTitle = this.removeDateFromTitle(newTask.title).toLowerCase();
  var existingCleanTitle = this.removeDateFromTitle(existingTask.title).toLowerCase();
  
  // 日付除去後のタイトルが完全に同じ場合のみ重複とする
  if (newCleanTitle === existingCleanTitle && newCleanTitle.length > 0) {
    console.log('[DuplicateChecker] 完全一致タイトル・同一日付 - 重複確定');
    return true;
  }
  
  // 高い類似度でも異なるタイトルなら重複ではない
  var titleSimilarity = Utils.calculateSimilarity(newCleanTitle, existingCleanTitle);
  if (titleSimilarity > 0.9) { // 非常に高い閾値
    console.log('[DuplicateChecker] 高類似度・同一日付 - 重複 (類似度: ' + titleSimilarity.toFixed(2) + ')');
    console.log('  新: "' + newCleanTitle + '" vs 既存: "' + existingCleanTitle + '"');
    return true;
  }
  
  return false;
};

/**
 * ソース重複チェック（強化版）
 */
TaskDuplicateChecker.prototype.isSourceDuplicate = function(newTask, existingTask) {
  // 1. カレンダーイベントの日付考慮重複チェック（強化版）
  if (newTask.source === 'calendar' && existingTask.source === 'calendar') {
    // 日付が異なる場合は繰り返しイベントとして重複扱いしない（タイトル類似チェックにも進まない）
    if (!this.isSameDate(newTask.due_date, existingTask.due_date)) {
      return false;
    }
    
    // 元イベント名を取得
    var newOriginal = newTask.original_event || '';
    var existingOriginal = existingTask.original_event || '';
    
    // コンテキストから元イベント名を抽出（フォールバック）
    if (!newOriginal && newTask.context && newTask.context.indexOf('元イベント:') !== -1) {
      var match = newTask.context.match(/元イベント:\s*([^|]+)/);
      if (match) newOriginal = match[1].trim();
    }
    
    if (!existingOriginal && existingTask.context && existingTask.context.indexOf('元イベント:') !== -1) {
      var match = existingTask.context.match(/元イベント:\s*([^|]+)/);
      if (match) existingOriginal = match[1].trim();
    }
    
    // 元イベント名が同じ場合の詳細チェック
    if (newOriginal && existingOriginal && newOriginal === existingOriginal) {
      console.log('[DuplicateChecker] 同一元イベント検出: "' + newOriginal + '"');
      
      // 日付を詳細比較
      var newDate = newTask.due_date;
      var existingDate = existingTask.due_date;
      
      if (this.isSameDate(newDate, existingDate)) {
        console.log('[DuplicateChecker] ✓ 同一イベント・同一日付 - 重複確定');
        console.log('  新: ' + newDate + ' vs 既存: ' + existingDate);
        return true;
      } else {
        console.log('[DuplicateChecker] ✗ 同一イベント・異なる日付 - 繰り返しイベント許可');
        console.log('  新: ' + newDate + ' vs 既存: ' + existingDate);
        return false; // 繰り返しイベントなので重複ではない
      }
    }
    
    // タイトルレベルでの類似度チェック（厳格化）
    var newCleanTitle = this.removeDateFromTitle(newTask.title);
    var existingCleanTitle = this.removeDateFromTitle(existingTask.title);
    
    // 日付を除去したタイトルが同じ場合の特別処理
    if (newCleanTitle === existingCleanTitle && newCleanTitle.length > 0) {
      console.log('[DuplicateChecker] 同一クリーンタイトル検出: "' + newCleanTitle + '"');
      
      if (this.isSameDate(newTask.due_date, existingTask.due_date)) {
        console.log('[DuplicateChecker] ✓ 同一タイトル・同一日付 - 重複確定');
        return true;
      } else {
        console.log('[DuplicateChecker] ✗ 同一タイトル・異なる日付 - 繰り返しイベント許可');
        return false;
      }
    }
    
    // 高い類似度での重複チェック（同一日付時のみ適用）
    var similarity = Utils.calculateSimilarity(newCleanTitle, existingCleanTitle);
    if (similarity > 0.95) {
      console.log('[DuplicateChecker] ✓ 高類似度・同一日付 - 重複 (類似度: ' + similarity.toFixed(2) + ')');
      return true;
    }
  }
  
  // 2. 他のソース（Gmail等）の従来処理
  if (newTask.source === existingTask.source && 
      newTask.original_event === existingTask.original_event &&
      newTask.original_event && newTask.original_event.trim().length > 0) {
    
    console.log('[DuplicateChecker] ソース重複検出 - original_event: ' + newTask.original_event);
    return true;
  }
  
  return false;
};

/**
 * カレンダータイトルの正規化（重複チェック用）
 */
TaskDuplicateChecker.prototype.normalizeCalendarTitle = function(title) {
  if (!title) return '';
  
  return title
    .replace(/\s*-\s*準備・フォローアップ$/, '') // 自動追加された接尾辞を除去
    .replace(/\s*-\s*会議準備$/, '')           // 会議準備接尾辞を除去
    .replace(/\s*-\s*準備$/, '')              // 準備接尾辞を除去
    .replace(/【.*?】/g, '')                   // 括弧付きの注釈を除去
    .replace(/\s+/g, ' ')                     // 複数の空白を1つに統一
    .trim()
    .toLowerCase();
};

/**
 * 日付が同じかチェック
 */
TaskDuplicateChecker.prototype.isSameDate = function(date1, date2) {
  if (!date1 || !date2) return false;
  
  var d1 = new Date(date1);
  var d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * タイトルから日付・時間部分を除去（強化版）
 */
TaskDuplicateChecker.prototype.removeDateFromTitle = function(title) {
  if (!title) return '';
  
  return title
    .replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '') // (YYYY-MM-DD) 形式
    .replace(/\s*\(\d{2}:\d{2}-\d{2}:\d{2}\)\s*$/, '') // (HH:MM-HH:MM) 形式
    .replace(/\s*\d{4}年\d{1,2}月\d{1,2}日\s*/, '') // YYYY年MM月DD日 形式
    .replace(/\s*\d{1,2}\/\d{1,2}\s*/, '') // MM/DD 形式
    .replace(/\s*\d{1,2}-\d{1,2}\s*/, '') // MM-DD 形式
    .replace(/\s*\(\d{2}:\d{2}-\d{2}:\d{2}\)$/, '') // 末尾の時間形式
    .trim();
};

/**
 * タイトルから日付を抽出
 */
TaskDuplicateChecker.prototype.extractDateFromTitle = function(title) {
  var match = title.match(/\((\d{4}-\d{2}-\d{2})\)$/);
  return match ? match[1] : null;
};

/**
 * 重複タスクの統合提案
 */
TaskDuplicateChecker.prototype.suggestMerge = function(newTask, duplicateTask) {
  return {
    action: 'merge',
    primaryTask: this.selectPrimaryTask(newTask, duplicateTask),
    mergeData: {
      title: this.mergeTitles(newTask.title, duplicateTask.title),
      priority: this.mergePriorities(newTask.priority, duplicateTask.priority),
      due_date: this.mergeDueDates(newTask.due_date, duplicateTask.due_date),
      context: this.mergeContexts(newTask.context, duplicateTask.context)
    },
    reason: this.getMergeReason(newTask, duplicateTask)
  };
};

/**
 * プライマリタスクを選択
 */
TaskDuplicateChecker.prototype.selectPrimaryTask = function(newTask, duplicateTask) {
  // より詳細な情報を持つタスクを選択
  if (newTask.context && newTask.context.length > (duplicateTask.context ? duplicateTask.context.length : 0)) {
    return newTask;
  }
  
  // より新しいタスクを選択
  return duplicateTask;
};

/**
 * タイトルをマージ
 */
TaskDuplicateChecker.prototype.mergeTitles = function(title1, title2) {
  if (title1.length > title2.length) {
    return title1;
  }
  return title2;
};

/**
 * 優先度をマージ
 */
TaskDuplicateChecker.prototype.mergePriorities = function(priority1, priority2) {
  var priorityOrder = { '高': 3, '中': 2, '低': 1 };
  
  var p1 = priorityOrder[priority1] || 2;
  var p2 = priorityOrder[priority2] || 2;
  
  if (p1 >= p2) {
    return priority1;
  }
  return priority2;
};

/**
 * 期日をマージ
 */
TaskDuplicateChecker.prototype.mergeDueDates = function(date1, date2) {
  if (!date1) return date2;
  if (!date2) return date1;
  
  // より早い期日を選択
  return new Date(date1) < new Date(date2) ? date1 : date2;
};

/**
 * コンテキストをマージ
 */
TaskDuplicateChecker.prototype.mergeContexts = function(context1, context2) {
  var contexts = [];
  if (context1 && context1.trim().length > 0) contexts.push(context1);
  if (context2 && context2.trim().length > 0) contexts.push(context2);
  return contexts.join(' | ');
};

/**
 * マージ理由を取得
 */
TaskDuplicateChecker.prototype.getMergeReason = function(newTask, duplicateTask) {
  return '同様のタスクが検出されたため統合を提案: ' + duplicateTask.title;
};