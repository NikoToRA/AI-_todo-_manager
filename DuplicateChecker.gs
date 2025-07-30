/**
 * 重複チェッククラス
 * 要件5.1-5.2対応: 重複タスクの検出と除外
 */
class DuplicateChecker {
  
  constructor(notionClient) {
    this.notionClient = notionClient;
    this.similarityThreshold = 0.8; // 類似度閾値
  }
  
  /**
   * 基本的な重複チェック
   * @param {Object} newTask 新しいタスク
   * @param {Array} existingTasks 既存タスク一覧
   * @returns {boolean} 重複している場合はtrue
   */
  checkBasicDuplicate(newTask, existingTasks) {
    try {
      console.log(`[DuplicateChecker.checkBasicDuplicate] チェック開始: ${newTask.title}`);
      
      for (const existingTask of existingTasks) {
        // 1. 完全一致チェック
        if (this._isExactMatch(newTask, existingTask)) {
          console.log(`[DuplicateChecker] 完全一致検出: ${existingTask.title}`);
          return true;
        }
        
        // 2. タイトル類似度チェック
        if (this._isTitleSimilar(newTask.title, existingTask.title)) {
          console.log(`[DuplicateChecker] タイトル類似検出: ${existingTask.title}`);
          return true;
        }
        
        // 3. 日程重複チェック
        if (this._isDateConflict(newTask, existingTask)) {
          console.log(`[DuplicateChecker] 日程重複検出: ${existingTask.title}`);
          return true;
        }
        
        // 4. ソース重複チェック
        if (this._isSourceDuplicate(newTask, existingTask)) {
          console.log(`[DuplicateChecker] ソース重複検出: ${existingTask.title}`);
          return true;
        }
      }
      
      console.log(`[DuplicateChecker.checkBasicDuplicate] 重複なし: ${newTask.title}`);
      return false;
      
    } catch (error) {
      console.error(`[DuplicateChecker.checkBasicDuplicate] エラー: ${error.message}`);
      // エラー時は安全側に倒して重複なしとする
      return false;
    }
  }
  
  /**
   * AI駆動の意味的重複チェック
   * @param {Object} newTask 新しいタスク
   * @param {Array} existingTasks 既存タスク一覧
   * @returns {boolean} 重複している場合はtrue
   */
  checkAIDuplicate(newTask, existingTasks) {
    try {
      console.log(`[DuplicateChecker.checkAIDuplicate] AI重複チェック開始: ${newTask.title}`);
      
      // Gemini APIが有効な場合のみ実行
      const config = ConfigManager.getConfig();
      if (!config.enableAiAnalysis || !config.geminiApiKey) {
        console.log('[DuplicateChecker] AI分析が無効化されています');
        return false;
      }
      
      // 類似性が高い候補をフィルタリング
      const similarCandidates = existingTasks.filter(task => 
        Utils.calculateSimilarity(newTask.title, task.title) > 0.5
      );
      
      if (similarCandidates.length === 0) {
        return false;
      }
      
      // Gemini APIで意味的類似性を判断
      const aiResult = this._callGeminiForDuplicateCheck(newTask, similarCandidates);
      
      console.log(`[DuplicateChecker.checkAIDuplicate] AI判定結果: ${aiResult.isDuplicate}`);
      return aiResult.isDuplicate;
      
    } catch (error) {
      console.error(`[DuplicateChecker.checkAIDuplicate] エラー: ${error.message}`);
      // AI分析でエラーが発生した場合は基本チェックにフォールバック
      return false;
    }
  }
  
  /**
   * 重複タスクの統合提案
   * @param {Object} newTask 新しいタスク
   * @param {Object} duplicateTask 重複タスク
   * @returns {Object} 統合提案
   */
  suggestMerge(newTask, duplicateTask) {
    return {
      action: 'merge',
      primaryTask: this._selectPrimaryTask(newTask, duplicateTask),
      mergeData: {
        title: this._mergeTitles(newTask.title, duplicateTask.title),
        priority: this._mergePriorities(newTask.priority, duplicateTask.priority),
        due_date: this._mergeDueDates(newTask.due_date, duplicateTask.due_date),
        context: this._mergeContexts(newTask.context, duplicateTask.context)
      },
      reason: this._getMergeReason(newTask, duplicateTask)
    };
  }
  
  /**
   * 完全一致チェック
   */
  _isExactMatch(newTask, existingTask) {
    return newTask.title.trim().toLowerCase() === existingTask.title.trim().toLowerCase() &&
           newTask.source === existingTask.source &&
           this._isSameDate(newTask.due_date, existingTask.due_date);
  }
  
  /**
   * タイトル類似度チェック
   */
  _isTitleSimilar(title1, title2) {
    if (!title1 || !title2) return false;
    
    const similarity = Utils.calculateSimilarity(
      title1.trim().toLowerCase(),
      title2.trim().toLowerCase()
    );
    
    return similarity >= this.similarityThreshold;
  }
  
  /**
   * 日程重複チェック
   */
  _isDateConflict(newTask, existingTask) {
    if (!newTask.due_date || !existingTask.due_date) {
      return false;
    }
    
    // 同じ日付で類似タイトルの場合は重複とみなす
    if (this._isSameDate(newTask.due_date, existingTask.due_date)) {
      const titleSimilarity = Utils.calculateSimilarity(
        newTask.title.toLowerCase(),
        existingTask.title.toLowerCase()
      );
      return titleSimilarity > 0.6; // より緩い閾値
    }
    
    return false;
  }
  
  /**
   * ソース重複チェック
   */
  _isSourceDuplicate(newTask, existingTask) {
    // 同じソースから同じoriginal_eventで生成されたタスクは重複
    if (newTask.source === existingTask.source && 
        newTask.original_event === existingTask.original_event &&
        newTask.original_event.trim().length > 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 日付が同じかチェック
   */
  _isSameDate(date1, date2) {
    if (!date1 || !date2) return false;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
  
  /**
   * Gemini APIで重複チェック
   */
  _callGeminiForDuplicateCheck(newTask, candidates) {
    const config = ConfigManager.getConfig();
    
    const prompt = this._buildDuplicateCheckPrompt(newTask, candidates);
    
    try {
      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.1
        }
      };
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      if (responseCode === 200) {
        const data = JSON.parse(responseText);
        const content = data.candidates[0].content.parts[0].text;
        
        // レスポンスを解析
        return this._parseDuplicateCheckResponse(content);
      } else {
        throw new Error(`Gemini API エラー: ${responseCode} - ${responseText}`);
      }
      
    } catch (error) {
      console.error(`[DuplicateChecker._callGeminiForDuplicateCheck] エラー: ${error.message}`);
      return { isDuplicate: false, confidence: 0 };
    }
  }
  
  /**
   * 重複チェック用プロンプト構築
   */
  _buildDuplicateCheckPrompt(newTask, candidates) {
    let prompt = `以下の新しいタスクが、既存のタスクと重複しているかを判断してください。\n\n`;
    
    prompt += `【新しいタスク】\n`;
    prompt += `タイトル: ${newTask.title}\n`;
    prompt += `ソース: ${newTask.source}\n`;
    prompt += `期日: ${newTask.due_date || 'なし'}\n`;
    prompt += `元イベント: ${newTask.original_event || 'なし'}\n`;
    prompt += `コンテキスト: ${newTask.context || 'なし'}\n\n`;
    
    prompt += `【既存タスク候補】\n`;
    candidates.forEach((task, index) => {
      prompt += `${index + 1}. タイトル: ${task.title}\n`;
      prompt += `   ソース: ${task.source}\n`;
      prompt += `   期日: ${task.due_date || 'なし'}\n`;
      prompt += `   元イベント: ${task.original_event || 'なし'}\n\n`;
    });
    
    prompt += `判断基準:\n`;
    prompt += `- 同じ作業内容を指している\n`;
    prompt += `- 同じイベントから生成されている\n`;
    prompt += `- 目的や成果物が同じ\n\n`;
    
    prompt += `以下の形式で回答してください:\n`;
    prompt += `重複判定: [YES/NO]\n`;
    prompt += `該当タスク番号: [番号または"なし"]\n`;
    prompt += `信頼度: [0-100]\n`;
    prompt += `理由: [判断理由]`;
    
    return prompt;
  }
  
  /**
   * Gemini APIレスポンス解析
   */
  _parseDuplicateCheckResponse(content) {
    try {
      const isDuplicateMatch = content.match(/重複判定:\s*(YES|NO)/i);
      const confidenceMatch = content.match(/信頼度:\s*(\d+)/);
      const reasonMatch = content.match(/理由:\s*(.+)/);
      
      const isDuplicate = isDuplicateMatch && isDuplicateMatch[1].toUpperCase() === 'YES';
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
      const reason = reasonMatch ? reasonMatch[1].trim() : '';
      
      return {
        isDuplicate: isDuplicate,
        confidence: confidence,
        reason: reason
      };
      
    } catch (error) {
      console.error(`[DuplicateChecker._parseDuplicateCheckResponse] 解析エラー: ${error.message}`);
      return { isDuplicate: false, confidence: 0 };
    }
  }
  
  /**
   * プライマリタスクを選択
   */
  _selectPrimaryTask(newTask, duplicateTask) {
    // より詳細な情報を持つタスクを選択
    if (newTask.context && newTask.context.length > duplicateTask.context?.length) {
      return newTask;
    }
    
    // より新しいタスクを選択
    return duplicateTask;
  }
  
  /**
   * タイトルをマージ
   */
  _mergeTitles(title1, title2) {
    if (title1.length > title2.length) {
      return title1;
    }
    return title2;
  }
  
  /**
   * 優先度をマージ
   */
  _mergePriorities(priority1, priority2) {
    const priorityOrder = { '高': 3, '中': 2, '低': 1 };
    
    const p1 = priorityOrder[priority1] || 2;
    const p2 = priorityOrder[priority2] || 2;
    
    if (p1 >= p2) {
      return priority1;
    }
    return priority2;
  }
  
  /**
   * 期日をマージ
   */
  _mergeDueDates(date1, date2) {
    if (!date1) return date2;
    if (!date2) return date1;
    
    // より早い期日を選択
    return new Date(date1) < new Date(date2) ? date1 : date2;
  }
  
  /**
   * コンテキストをマージ
   */
  _mergeContexts(context1, context2) {
    const contexts = [context1, context2].filter(c => c && c.trim().length > 0);
    return contexts.join(' | ');
  }
  
  /**
   * マージ理由を取得
   */
  _getMergeReason(newTask, duplicateTask) {
    return `同様のタスクが検出されたため統合を提案: ${duplicateTask.title}`;
  }
}