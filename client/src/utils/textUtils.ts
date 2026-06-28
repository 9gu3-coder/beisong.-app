// 文本工具函数

// 按句子分割文本（按句号或逗号分割）
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  
  // 按句号或逗号分割，同时保留分隔符
  // 匹配：句号(。.) 或 逗号(，,)
  const parts = text.split(/(?<=[，。,.])/);
  
  const sentences = parts
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // 如果分割后只有一段，则按换行符分割
  if (sentences.length <= 1) {
    return text.split(/\n+/).filter(s => s.trim().length > 0);
  }
  
  return sentences;
}

// 按段落分割文本
export function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  return text.split(/\n\s*\n+/).filter(p => p.trim().length > 0);
}

// 生成挖空句子的索引（随机挖空，确保至少有一个）
// 挖空比例：默认挖空30%-50%的句子
export function generateBlankIndices(sentenceCount: number, blankRatio: number = 0.4): number[] {
  if (sentenceCount <= 0) return [];
  
  // 确保至少挖空一个句子
  const minBlanks = 1;
  const maxBlanks = Math.max(minBlanks, Math.ceil(sentenceCount * blankRatio));
  
  // 随机决定挖空数量
  const blankCount = minBlanks + Math.floor(Math.random() * (maxBlanks - minBlanks + 1));
  
  // 随机选择要挖空的句子索引
  const indices = Array.from({ length: sentenceCount }, (_, i) => i);
  
  // Fisher-Yates 洗牌算法打乱顺序
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // 返回前 blankCount 个索引，并排序
  return indices.slice(0, blankCount).sort((a, b) => a - b);
}

// 计算字符串相似度
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
export type DiffType = 'correct' | 'wrong' | 'missing' | 'extra';

export interface DiffResult {
  type: DiffType;
  text: string;
}

// 判断是否是忽略字符（标点符号、空格、换行）
function isIgnoredChar(char: string): boolean {
  // 标点符号：中文标点、英文标点
  // 空格：普通空格、全角空格
  // 换行：换行符、回车符
  const punctRegex = /[。？！，、；：""''（）【】《》〈〉〔〕「」『』〖〗…—·,.;:?!"'()[\]{}<>\-—~@#$%^&*+=_/|\\]/;
  return /\s/.test(char) || punctRegex.test(char);
}

// 统计有效字符数（忽略标点、空格、换行）
export function countValidChars(text: string): number {
  let count = 0;
  for (const char of text) {
    if (!isIgnoredChar(char)) {
      count++;
    }
  }
  return count;
}

// 移除忽略字符后的有效字符序列
export function getValidChars(text: string): string {
  let result = '';
  for (const char of text) {
    if (!isIgnoredChar(char)) {
      result += char;
    }
  }
  return result;
}

export function diffText(expected: string, actual: string): DiffResult[] {
  if (!expected && !actual) return [];
  if (!expected) return [{ type: 'extra', text: actual }];
  if (!actual) return [{ type: 'missing', text: expected }];

  const m = expected.length;
  const n = actual.length;

  // 构建有效字符的索引映射（跳过忽略字符：标点、空格、换行）
  const validExpectedIndices: number[] = [];
  for (let i = 0; i < m; i++) {
    if (!isIgnoredChar(expected[i])) validExpectedIndices.push(i);
  }

  const validActualIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!isIgnoredChar(actual[i])) validActualIndices.push(i);
  }

  const vm = validExpectedIndices.length;
  const vn = validActualIndices.length;

  if (vm === 0 && vn === 0) return [];
  if (vm === 0) return [{ type: 'extra', text: actual }];
  if (vn === 0) return [{ type: 'missing', text: expected }];

  // 使用编辑距离（Levenshtein）矩阵
  const dp: number[][] = Array(vm + 1).fill(null).map(() => Array(vn + 1).fill(0));

  for (let ii = 0; ii <= vm; ii++) {
    dp[ii][0] = ii;
  }
  for (let jj = 0; jj <= vn; jj++) {
    dp[0][jj] = jj;
  }

  for (let ii = 1; ii <= vm; ii++) {
    for (let jj = 1; jj <= vn; jj++) {
      const expectedChar = expected[validExpectedIndices[ii - 1]];
      const actualChar = actual[validActualIndices[jj - 1]];

      if (expectedChar === actualChar) {
        dp[ii][jj] = dp[ii - 1][jj - 1];
      } else {
        dp[ii][jj] = Math.min(
          dp[ii - 1][jj] + 1,      // 删除
          dp[ii][jj - 1] + 1,      // 插入
          dp[ii - 1][jj - 1] + 1   // 替换
        );
      }
    }
  }

  // 回溯找出差异
  const result: DiffResult[] = [];
  let ii = vm, jj = vn;

  while (ii > 0 || jj > 0) {
    if (ii > 0 && jj > 0) {
      const expectedIdx = validExpectedIndices[ii - 1];
      const actualIdx = validActualIndices[jj - 1];

      if (expected[expectedIdx] === actual[actualIdx]) {
        result.unshift({ type: 'correct', text: expected[expectedIdx] });
        ii--;
        jj--;
      } else if (dp[ii][jj] === dp[ii - 1][jj - 1] + 1) {
        result.unshift({ type: 'wrong', text: actual[actualIdx] });
        ii--;
        jj--;
      } else if (ii > 0 && dp[ii][jj] === dp[ii - 1][jj] + 1) {
        result.unshift({ type: 'missing', text: expected[validExpectedIndices[ii - 1]] });
        ii--;
      } else if (jj > 0 && dp[ii][jj] === dp[ii][jj - 1] + 1) {
        result.unshift({ type: 'extra', text: actual[validActualIndices[jj - 1]] });
        jj--;
      } else if (ii > 0) {
        result.unshift({ type: 'missing', text: expected[validExpectedIndices[ii - 1]] });
        ii--;
      } else {
        result.unshift({ type: 'extra', text: actual[validActualIndices[jj - 1]] });
        jj--;
      }
    } else if (ii > 0) {
      result.unshift({ type: 'missing', text: expected[validExpectedIndices[ii - 1]] });
      ii--;
    } else if (jj > 0) {
      result.unshift({ type: 'extra', text: actual[validActualIndices[jj - 1]] });
      jj--;
    }
  }

  // 合并相同类型的连续字符
  const merged = mergeConsecutiveDiffs(result);

  // 进一步优化：将相邻的 missing-extra 或 extra-missing 对合并为 wrong
  return optimizeWrongPairs(merged);
}

// 优化：将相邻的 missing+extra 或 extra+missing 合并为 wrong（拼写错误）
// 当连续出现 missing 和 extra 时，如果两者长度接近，判定为拼写错误
function optimizeWrongPairs(diffs: DiffResult[]): DiffResult[] {
  if (diffs.length < 2) return diffs;
  
  const result: DiffResult[] = [];
  let i = 0;
  
  while (i < diffs.length) {
    const current = diffs[i];
    const next = diffs[i + 1];
    
    // 检查是否是相邻的缺失和多余对
    if (
      next &&
      ((current.type === 'missing' && next.type === 'extra') ||
       (current.type === 'extra' && next.type === 'missing'))
    ) {
      // 判断是否应该合并为 wrong
      // 如果两者长度相近（较短的长度 >= 较长的长度的 30%），则判定为拼写错误
      const longerLen = Math.max(current.text.length, next.text.length);
      const shorterLen = Math.min(current.text.length, next.text.length);
      
      if (longerLen > 0 && shorterLen / longerLen >= 0.3) {
        // 合并为 wrong 类型
        const wrongText = current.type === 'extra' ? current.text : next.text;
        result.push({ type: 'wrong', text: wrongText });
        i += 2;
        continue;
      }
    }
    
    result.push(current);
    i++;
  }
  
  // 再次合并连续相同类型
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

// 错误类型
export type ErrorCategory = 'wrong' | 'missing' | 'extra';

// 提取错误对（错误文本和正确文本）
export interface ErrorPair {
  wrongText: string;
  correctText: string;
  category: ErrorCategory;
}

export function extractErrorPairs(diffs: DiffResult[]): ErrorPair[] {
  const pairs: ErrorPair[] = [];
  let i = 0;
  
  while (i < diffs.length) {
    if (diffs[i].type !== 'correct') {
      let wrongText = '';
      let correctText = '';
      let category: ErrorCategory = 'wrong';
      let hasMissing = false;
      let hasExtra = false;
      let hasWrong = false;
      
      // 收集连续的错误段
      while (i < diffs.length && diffs[i].type !== 'correct') {
        const diff = diffs[i];
        
        if (diff.type === 'missing') {
          correctText += diff.text;
          hasMissing = true;
        } else if (diff.type === 'extra') {
          wrongText += diff.text;
          hasExtra = true;
        } else if (diff.type === 'wrong') {
          // 对于拼写错误，需要同时记录错误和正确内容
          // 但这里 wrong 只有错误文本，需要从对应位置推断正确文本
          // 我们在 diffText 阶段已经用编辑距离识别了替换操作
          // 但 wrong 的 text 只有用户输入的错误内容
          // 这里需要特殊处理：遇到 wrong 时，单独生成一个错误对
          hasWrong = true;
          
          // 如果当前 wrong 是独立的（前后都是 correct），直接生成
          if (!wrongText && !correctText) {
            // 这是一个纯 wrong 类型，需要找到对应的正确文本
            // 由于编辑距离回溯中 wrong 对应的正确字符就是 expected 中对应位置的字符
            // 但我们在 diff 结果中没有保存正确文本，所以需要特殊处理
            // 这里我们把它当作一个独立的错误对
            // 但需要在外部补充正确文本
            wrongText += diff.text;
            i++;
            continue;
          } else {
            wrongText += diff.text;
            i++;
            continue;
          }
        }
        i++;
      }
      
      // 判断错误类型
      if (hasWrong || (hasMissing && hasExtra)) {
        category = 'wrong';
      } else if (hasMissing && !hasExtra) {
        category = 'missing';
      } else if (hasExtra && !hasMissing) {
        category = 'extra';
      }
      
      if (wrongText || correctText) {
        pairs.push({ wrongText, correctText, category });
      }
    } else {
      i++;
    }
  }
  
  return pairs;
}

// 从完整文本和差异中提取带正确文本的错误对（更精确的版本）
export function extractErrorPairsWithContext(
  diffs: DiffResult[],
  expected: string,
  actual: string
): ErrorPair[] {
  const pairs: ErrorPair[] = [];
  let expectedIdx = 0;
  let actualIdx = 0;
  let i = 0;
  
  while (i < diffs.length) {
    const diff = diffs[i];
    
    if (diff.type === 'correct') {
      expectedIdx += diff.text.length;
      actualIdx += diff.text.length;
      i++;
      continue;
    }
    
    // 收集连续错误段
    let wrongText = '';
    let correctText = '';
    let category: ErrorCategory = 'wrong';
    let hasMissing = false;
    let hasExtra = false;
    let hasWrong = false;
    
    while (i < diffs.length && diffs[i].type !== 'correct') {
      const d = diffs[i];
      
      if (d.type === 'missing') {
        correctText += d.text;
        expectedIdx += d.text.length;
        hasMissing = true;
      } else if (d.type === 'extra') {
        wrongText += d.text;
        actualIdx += d.text.length;
        hasExtra = true;
      } else if (d.type === 'wrong') {
        // 拼写错误：错误文本来自用户输入，正确文本来自原文对应位置
        wrongText += d.text;
        // 从原文中提取对应长度的正确文本
        const correctPart = expected.substr(expectedIdx, d.text.length);
        correctText += correctPart;
        expectedIdx += d.text.length;
        actualIdx += d.text.length;
        hasWrong = true;
      }
      i++;
    }
    
    // 判断错误类型
    if (hasWrong || (hasMissing && hasExtra)) {
      category = 'wrong';
    } else if (hasMissing && !hasExtra) {
      category = 'missing';
    } else if (hasExtra && !hasMissing) {
      category = 'extra';
    }
    
    if (wrongText || correctText) {
      pairs.push({ wrongText, correctText, category });
    }
  }
  
  return pairs;
}

// 格式化日期
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
}
