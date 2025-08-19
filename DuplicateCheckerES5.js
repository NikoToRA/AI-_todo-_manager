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
 * 日程重複チェック
 */
TaskDuplicateChecker.prototype.isDateConflict = function(newTask, existingTask) {
  if (!newTask.due_date || !existingTask.due_date) {
    return false;
  }
  
  // 同じ日付で類似タイトルの場合は重複とみなす
  if (this.isSameDate(newTask.due_date, existingTask.due_date)) {
    var titleSimilarity = Utils.calculateSimilarity(
      newTask.title.toLowerCase(),
      existingTask.title.toLowerCase()
    );
    return titleSimilarity > 0.6; // より緩い閾値
  }
  
  return false;
};

/**
 * ソース重複チェック（強化版）
 */
TaskDuplicateChecker.prototype.isSourceDuplicate = function(newTask, existingTask) {
  // 1. 同じソースから同じoriginal_eventで生成されたタスクの重複チェック（日付考慮版）
  if (newTask.source === existingTask.source && 
      newTask.original_event === existingTask.original_event &&
      newTask.original_event && newTask.original_event.trim().length > 0) {
    
    // 繰り返しイベント対応: 同じタイトルでも異なる日付なら重複ではない
    if (newTask.source === 'calendar' && existingTask.source === 'calendar') {
      if (!this.isSameDate(newTask.due_date, existingTask.due_date)) {
        console.log('[DuplicateChecker] 同一イベント・異なる日付 - スキップ: ' + newTask.original_event);
        console.log('  新タスク日付: ' + newTask.due_date + ', 既存タスク日付: ' + existingTask.due_date);
        return false; // 異なる日付なら重複ではない
      }
    }
    
    console.log('[DuplicateChecker] ソース重複検出 - original_event: ' + newTask.original_event);
    return true;
  }
  
  // 2. カレンダーの場合：同じ日付で正規化タイトルが類似
  if (newTask.source === 'calendar' && existingTask.source === 'calendar') {
    // 同じ日付かチェック
    if (this.isSameDate(newTask.due_date, existingTask.due_date)) {
      var normalizedNew = this.normalizeCalendarTitle(newTask.title);
      var normalizedExisting = this.normalizeCalendarTitle(existingTask.title);
      
      // 正規化後の類似度チェック
      var similarity = Utils.calculateSimilarity(normalizedNew, normalizedExisting);
      if (similarity > 0.85) {
        console.log('[DuplicateChecker] カレンダー正規化重複検出 - 類似度: ' + similarity.toFixed(2));
        console.log('  新: "' + normalizedNew + '" vs 既存: "' + normalizedExisting + '"');
        return true;
      }
    }
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
 * タイトルから日付部分を除去
 */
TaskDuplicateChecker.prototype.removeDateFromTitle = function(title) {
  // (YYYY-MM-DD) 形式の日付を除去
  return title.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
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