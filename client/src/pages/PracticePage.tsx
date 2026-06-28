// 默写练习页面（包含两种模式）
import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentApi, errorApi, studyApi } from '../services/api';
import { localContentService, localErrorService } from '../utils/localStorage';
import { Content, RecitationMode, DiffResult } from '../types';
import {
  splitIntoSentences,
  splitIntoParagraphs,
  generateBlankIndices,
  diffText,
  extractErrorPairsWithContext,
  calculateSimilarity,
  getValidChars,
  ErrorPair,
} from '../utils/textUtils';
import DiffHighlight from '../components/DiffHighlight';
import { PageLoading } from '../components/Loading';

export default function PracticePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  const mode = (searchParams.get('mode') as RecitationMode) || 'free';
  
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'preview' | 'writing' | 'checking'>('preview');
  const [userInput, setUserInput] = useState('');
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>({});
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [diffs, setDiffs] = useState<DiffResult[]>([]);
  const [correctRate, setCorrectRate] = useState(0);
  const [errorStats, setErrorStats] = useState({ wrong: 0, missing: 0, extra: 0 });
  const [submitting, setSubmitting] = useState(false);

  const contentId = parseInt(id || '0', 10);
  
  // 分割句子
  const sentences = useMemo(() => {
    if (!content) return [];
    return splitIntoSentences(content.content);
  }, [content]);
  
  // 段落结构
  const paragraphs = useMemo(() => {
    if (!content) return [];
    return splitIntoParagraphs(content.content);
  }, [content]);

  useEffect(() => {
    loadContent();
  }, [id, isLoggedIn]);

  useEffect(() => {
    // 初始化挖空索引
    if (mode === 'blank' && sentences.length > 0) {
      setBlankIndices(generateBlankIndices(sentences.length));
    }
  }, [mode, sentences.length]);

  const loadContent = async () => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        const response = await contentApi.getDetail(contentId);
        setContent(response.content);
      } else {
        const data = localContentService.getDetail(contentId);
        setContent(data);
      }
    } catch (err) {
      console.error('加载内容失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const startWriting = () => {
    setPhase('writing');
    setUserInput('');
    setBlankAnswers({});
  };

  const reshuffleBlanks = () => {
    setBlankIndices(generateBlankIndices(sentences.length));
    setBlankAnswers({});
  };

  const checkAnswer = async () => {
    if (mode === 'free' && !userInput.trim()) {
      alert('请输入默写内容');
      return;
    }
    
    if (mode === 'blank') {
      const answeredCount = Object.values(blankAnswers).filter(v => v.trim()).length;
      if (answeredCount === 0) {
        alert('请至少填写一个空');
        return;
      }
    }

    setPhase('checking');
    setSubmitting(true);

    try {
      let resultDiffs: DiffResult[] = [];
      let rate = 0;
      let errorPairs: ErrorPair[] = [];

      if (mode === 'free') {
        // 自由输入模式：整体比对（使用有效字符计算正确率）
        resultDiffs = diffText(content!.content, userInput);
        const validExpected = getValidChars(content!.content);
        const validActual = getValidChars(userInput);
        rate = calculateSimilarity(validExpected, validActual);
        // 使用更精确的错误对提取方法
        errorPairs = extractErrorPairsWithContext(resultDiffs, content!.content, userInput);
      } else {
        // 挖空模式：正确率 = 填对的字数 / 挖空句子的总字数（有效字符）
        const allDiffs: DiffResult[] = [];
        let totalBlankChars = 0;
        let correctBlankChars = 0;

        sentences.forEach((sentence, index) => {
          if (blankIndices.includes(index)) {
            const answer = blankAnswers[index] || '';
            const sentenceDiffs = diffText(sentence, answer);
            allDiffs.push(...sentenceDiffs);
            
            // 计算这个挖空句子的有效字符数
            const validSentenceChars = getValidChars(sentence);
            totalBlankChars += validSentenceChars.length;
            
            // 统计正确的字符数
            const correctChars = sentenceDiffs
              .filter(d => d.type === 'correct')
              .reduce((sum, d) => sum + d.text.length, 0);
            correctBlankChars += correctChars;
          } else {
            allDiffs.push({ type: 'correct', text: sentence });
          }
          
          // 句子间添加空格
          if (index < sentences.length - 1) {
            allDiffs.push({ type: 'correct', text: ' ' });
          }
        });

        resultDiffs = allDiffs;
        rate = totalBlankChars > 0 ? correctBlankChars / totalBlankChars : 0;
        
        // 提取错误对（使用更精确的方法）
        blankIndices.forEach(index => {
          const sentence = sentences[index];
          const answer = blankAnswers[index] || '';
          const sentenceDiffs = diffText(sentence, answer);
          const pairs = extractErrorPairsWithContext(sentenceDiffs, sentence, answer);
          errorPairs.push(...pairs);
        });
      }

      setDiffs(resultDiffs);
      setCorrectRate(rate);

      // 保存错误记录 - 过滤掉无效的错误对
      const validErrorPairs = errorPairs.filter(
        p => (p.wrongText || p.correctText) && (p.wrongText !== p.correctText)
      );
      
      // 统计错误类型
      const stats = { wrong: 0, missing: 0, extra: 0 };
      validErrorPairs.forEach(p => {
        if (p.category === 'wrong') stats.wrong++;
        else if (p.category === 'missing') stats.missing++;
        else if (p.category === 'extra') stats.extra++;
      });
      setErrorStats(stats);
      
      if (validErrorPairs.length > 0) {
        if (isLoggedIn) {
          await errorApi.batchCreate(contentId, validErrorPairs);
        } else {
          localErrorService.batchAdd(contentId, validErrorPairs);
        }
      }

      // 保存学习记录
      if (isLoggedIn) {
        await studyApi.record(contentId, mode, rate);
      }
    } catch (err) {
      console.error('检查失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setPhase('preview');
    setUserInput('');
    setBlankAnswers({});
    setDiffs([]);
    setCorrectRate(0);
    if (mode === 'blank') {
      setBlankIndices(generateBlankIndices(sentences.length));
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">内容不存在或已被删除</p>
        <Link to="/" className="text-blue-600 hover:underline">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to={`/content/${contentId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <div className="text-sm text-gray-600 truncate max-w-xs">
            {content.title}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {mode === 'free' ? '自由输入' : '智能挖空'}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 预览阶段 */}
        {phase === 'preview' && (
          <div className="space-y-6">
            <div className="card p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {mode === 'free' ? '自由输入模式' : '智能挖空模式'}
              </h2>
              
              {mode === 'free' ? (
                <>
                  <p className="text-gray-600 mb-6">
                    点击"开始默写"后，原文将消失，请在输入框中凭记忆完整输入内容。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-loose whitespace-pre-wrap">
                      {content.content}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                      系统已自动挖空部分句子，请准备填写缺失内容。
                    </p>
                    <button
                      onClick={reshuffleBlanks}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重新挖空
                    </button>
                  </div>
                  
                  {/* 预览挖空效果 */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    {sentences.map((sentence, index) => (
                      <span key={index} className="inline">
                        {blankIndices.includes(index) ? (
                          <span className="inline-block min-w-[100px] h-6 border-b-2 border-dashed border-gray-400 mx-1 align-baseline">
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          </span>
                        ) : (
                          sentence
                        )}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={startWriting}
              className="btn btn-primary w-full py-3 text-base"
            >
              开始默写
            </button>
          </div>
        )}

        {/* 书写阶段 */}
        {phase === 'writing' && (
          <div className="space-y-6">
            {mode === 'free' ? (
              // 自由输入模式
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    请输入你记住的内容：
                  </label>
                  <span className="text-xs text-gray-400">
                    {userInput.length} 字
                  </span>
                </div>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="在这里输入你记住的内容..."
                  className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg resize-y text-lg leading-loose focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  autoFocus
                />
              </div>
            ) : (
              // 智能挖空模式
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    填写挖空的句子：
                  </label>
                  <button
                    onClick={reshuffleBlanks}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重新挖空
                  </button>
                </div>
                
                <div className="space-y-4 text-lg leading-loose">
                  {sentences.map((sentence, index) => (
                    <div key={index} className="inline-flex items-start">
                      {blankIndices.includes(index) ? (
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={blankAnswers[index] || ''}
                            onChange={(e) => setBlankAnswers({
                              ...blankAnswers,
                              [index]: e.target.value
                            })}
                            placeholder={`第 ${index + 1} 句（填空）`}
                            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-900">{sentence}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setPhase('preview')}
                className="btn btn-secondary flex-1"
              >
                查看原文
              </button>
              <button
                onClick={checkAnswer}
                disabled={submitting}
                className="btn btn-primary flex-1 py-3"
              >
                {submitting ? '检查中...' : '提交检查'}
              </button>
            </div>
          </div>
        )}

        {/* 检查结果阶段 */}
        {phase === 'checking' && (
          <div className="space-y-6">
            {/* 正确率 */}
            <div className="card p-6 text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {(correctRate * 100).toFixed(1)}%
              </div>
              <p className="text-gray-500 mb-4">正确率</p>
              {/* 错误类型统计 */}
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-yellow-400"></span>
                  <span className="text-gray-600">拼写错误：</span>
                  <span className="font-semibold text-yellow-700">{errorStats.wrong}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-green-400"></span>
                  <span className="text-gray-600">遗漏错误：</span>
                  <span className="font-semibold text-green-700">{errorStats.missing}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-red-400"></span>
                  <span className="text-gray-600">多余错误：</span>
                  <span className="font-semibold text-red-700">{errorStats.extra}</span>
                </div>
              </div>
            </div>

            {/* 对比结果 */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">检查结果</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">错误类型说明：</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-yellow-100 border-b-2 border-yellow-400"></span>
                    <span className="text-gray-600">拼写错误</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-green-100 border-b-2 border-green-400"></span>
                    <span className="text-gray-600">遗漏内容</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-red-100 line-through"></span>
                    <span className="text-gray-600">多余内容</span>
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <DiffHighlight diffs={diffs} />
              </div>
            </div>

            {/* 原文对比 */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">正确答案</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 leading-loose whitespace-pre-wrap">
                  {content.content}
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={retry}
                className="btn btn-secondary flex-1"
              >
                再练一次
              </button>
              <button
                onClick={() => navigate(`/content/${contentId}`)}
                className="btn btn-primary flex-1"
              >
                返回详情
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
