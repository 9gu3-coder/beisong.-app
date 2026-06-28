// 文本工具函数

// 按句子分割文本
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  
  // 匹配中英文句子结束符
  const sentenceRegex = /[^。！？.!?]+[。！？.!?]+/g;
  const sentences = text.match(sentenceRegex) || [];
  
  // 如果没有匹配到句子（可能没有标点），则按段落分割
  if (sentences.length === 0) {
    return text.split(/\n+/).filter(s => s.trim().length > 0);
  }
  
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

// 按段落分割文本
export function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  return text.split(/\n\s*\n+/).filter(p => p.trim().length > 0);
}

// 生成挖空句子的索引
export function generateBlankIndices(sentenceCount: number, interval: number = 2): number[] {
  if (sentenceCount <= 0) return [];
  
  const blankIndices: number[] = [];
  
  // 每隔 interval 句挖空一句
  // 例如 interval=2 就是：保留2句，挖空1句，循环
  for (let i = interval; i < sentenceCount; i += interval + 1) {
    blankIndices.push(i);
  }
  
  // 处理剩余句子（不能被 interval+1 整除的部分）
  const remainder = sentenceCount % (interval + 1);
  if (remainder > 0) {
    // 随机决定剩余的1-2句是否挖空
    const lastIndex = sentenceCount - 1;
    if (Math.random() < 0.5) {
      if (!blankIndices.includes(lastIndex)) {
        blankIndices.push(lastIndex);
      }
    }
  }
  
  return blankIndices.sort((a, b) => a - b);
}

// 计算字符串相似度（用于中文逐字比对）
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;
  
  const longer = str1.length >= str2.length ? str1 : str2;
  const shorter = str1.length < str2.length ? str1 : str2;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// 编辑距离（Levenshtein Distance）
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // 删除
          dp[i][j - 1] + 1,      // 插入
          dp[i - 1][j - 1] + 1   // 替换
        );
      }
    }
  }
  
  return dp[m][n];
}

// 逐字比对并返回差异
export interface DiffResult {
  type: 'correct' | 'wrong' | 'missing' | 'extra';
  text: string;
}

export function diffText(expected: string, actual: string): DiffResult[] {
  if (!expected && !actual) return [];
  if (!expected) return [{ type: 'extra', text: actual }];
  if (!actual) return [{ type: 'missing', text: expected }];
  
  // 使用动态规划的最长公共子序列来找出差异
  const m = expected.length;
  const n = actual.length;
  
  // 构建LCS矩阵
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (expected[i - 1] === actual[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // 回溯找出差异
  const result: DiffResult[] = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expected[i - 1] === actual[j - 1]) {
      result.unshift({ type: 'correct', text: expected[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'extra', text: actual[j - 1] });
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'missing', text: expected[i - 1] });
      i--;
    }
  }
  
  // 合并相同类型的连续字符
  return mergeConsecutiveDiffs(result);
}

// 合并连续相同类型的差异
function mergeConsecutiveDiffs(diffs: DiffResult[]): DiffResult[] {
  if (diffs.length === 0) return [];
  
  const merged: DiffResult[] = [];
  let current = { ...diffs[0] };
  
  for (let i = 1; i < diffs.length; i++) {
    if (diffs[i].type === current.type) {
      current.text += diffs[i].text;
    } else {
      merged.push(current);
      current = { ...diffs[i] };
    }
  }
  
  merged.push(current);
  return merged;
}

// 提取错误对（错误文本和正确文本）
export interface ErrorPair {
  wrongText: string;
  correctText: string;
}

export function extractErrorPairs(diffs: DiffResult[]): ErrorPair[] {
  const pairs: ErrorPair[] = [];
  let i = 0;
  
  while (i < diffs.length) {
    if (diffs[i].type === 'wrong' || diffs[i].type === 'missing' || diffs[i].type === 'extra') {
      let wrongText = '';
      let correctText = '';
      
      // 收集连续的错误（wrong/missing/extra组合）
      while (i < diffs.length && diffs[i].type !== 'correct') {
        if (diffs[i].type === 'wrong' || diffs[i].type === 'missing') {
          correctText += diffs[i].text;
        }
        if (diffs[i].type === 'wrong' || diffs[i].type === 'extra') {
          wrongText += diffs[i].text;
        }
        i++;
      }
      
      if (wrongText || correctText) {
        pairs.push({ wrongText, correctText });
      }
    } else {
      i++;
    }
  }
  
  return pairs;
}
