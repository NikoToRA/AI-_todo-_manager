/**
 * ユーティリティ関数集
 */
class Utils {
  
  /**
   * 日付フォーマット（JST）
   */
  static formatDateJST(date) {
    if (!date) return null;
    
    const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return jstDate.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  
  /**
   * 文字列の類似度計算（レーベンシュタイン距離）
   */
  static calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }
  
  /**
   * レート制限対応の待機
   */
  static async rateLimitWait(delayMs = 1000) {
    await Utilities.sleep(delayMs);
  }
  
  /**
   * 安全なJSON解析
   */
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn(`JSON解析エラー: ${error.message}`);
      return defaultValue;
    }
  }
  
  /**
   * 配列のチャンク分割
   */
  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}