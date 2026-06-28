// 错题本页面
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { errorApi, contentApi } from '../services/api';
import { localErrorService, localContentService } from '../utils/localStorage';
import { ErrorRecord, Content, ErrorCategory } from '../types';
import { formatDate } from '../utils/textUtils';
import { PageLoading } from '../components/Loading';

type ErrorFilterType = 'all' | ErrorCategory;

export default function ErrorBook() {
  const { isLoggedIn } = useAuth();
  const [records, setRecords] = useState<ErrorRecord[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterContentId, setFilterContentId] = useState<number | 'all'>('all');
  const [filterErrorType, setFilterErrorType] = useState<ErrorFilterType>('all');
  const [sortBy, setSortBy] = useState<'error_count' | 'last_error_at'>('error_count');
  const [stats, setStats] = useState<any>(null);
  const [typeStats, setTypeStats] = useState({ wrong: 0, missing: 0, extra: 0 });

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      let contentList: Content[];
      if (isLoggedIn) {
        const contentRes = await contentApi.getList();
        contentList = contentRes.contents;
      } else {
        contentList = localContentService.getList();
      }
      setContents(contentList);

      await loadRecords();
      
      if (isLoggedIn) {
        const statsRes = await errorApi.getStats();
        setStats(statsRes);
      } else {
        setStats(localErrorService.getStats());
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      let list: ErrorRecord[];
      if (isLoggedIn) {
        const params: any = { sortBy, order: 'desc' };
        if (filterContentId !== 'all') {
          params.contentId = filterContentId;
        }
        const res = await errorApi.getList(params);
        list = res.records;
      } else {
        list = localErrorService.getList();
        if (filterContentId !== 'all') {
          list = list.filter(r => r.content_id === filterContentId);
        }
        list.sort((a, b) => {
          if (sortBy === 'error_count') {
            return b.error_count - a.error_count;
          } else {
            return new Date(b.last_error_at).getTime() - new Date(a.last_error_at).getTime();
          }
        });
        const contentMap = new Map(contents.map(c => [c.id, c.title]));
        list = list.map(r => ({
          ...r,
          content_title: contentMap.get(r.content_id) || '未知内容',
        }));
      }
      
      // 计算错误类型统计（基于所有记录）
      const counts = { wrong: 0, missing: 0, extra: 0 };
      list.forEach(r => {
        const type = r.error_type || 'wrong';
        if (type === 'wrong') counts.wrong += r.error_count;
        else if (type === 'missing') counts.missing += r.error_count;
        else if (type === 'extra') counts.extra += r.error_count;
      });
      setTypeStats(counts);
      
      // 按错误类型筛选
      if (filterErrorType !== 'all') {
        list = list.filter(r => (r.error_type || 'wrong') === filterErrorType);
      }
      
      setRecords(list);
    } catch (err) {
      console.error('加载错误记录失败:', err);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadRecords();
    }
  }, [filterContentId, filterErrorType, sortBy, isLoggedIn]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条错误记录吗？')) {
      return;
    }
    
    try {
      if (isLoggedIn) {
        await errorApi.delete(id);
      } else {
        localErrorService.delete(id);
      }
      loadRecords();
      if (isLoggedIn) {
        const statsRes = await errorApi.getStats();
        setStats(statsRes);
      } else {
        setStats(localErrorService.getStats());
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const getErrorTypeLabel = (type?: ErrorCategory) => {
    switch (type) {
      case 'wrong': return { label: '拼写错误', color: 'yellow' };
      case 'missing': return { label: '遗漏错误', color: 'green' };
      case 'extra': return { label: '多余错误', color: 'red' };
      default: return { label: '拼写错误', color: 'yellow' };
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">我的错题本</h1>
        <p className="text-gray-500">记录每次默写的错误，优先攻克高频错误</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalErrors}</div>
            <div className="text-sm text-gray-500">总错误次数</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-red-600">{stats.frequentErrors}</div>
            <div className="text-sm text-gray-500">高频错误（≥3次）</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-yellow-600">{typeStats.wrong}</div>
            <div className="text-sm text-gray-500">拼写错误</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-green-600">{typeStats.missing}</div>
            <div className="text-sm text-gray-500">遗漏错误</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-red-500">{typeStats.extra}</div>
            <div className="text-sm text-gray-500">多余错误</div>
          </div>
        </div>
      )}

      {/* 筛选和排序 */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">内容：</label>
            <select
              value={filterContentId}
              onChange={(e) => setFilterContentId(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="input py-1.5 text-sm w-auto"
            >
              <option value="all">全部内容</option>
              {contents.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">类型：</label>
            <select
              value={filterErrorType}
              onChange={(e) => setFilterErrorType(e.target.value as ErrorFilterType)}
              className="input py-1.5 text-sm w-auto"
            >
              <option value="all">全部类型</option>
              <option value="wrong">拼写错误</option>
              <option value="missing">遗漏错误</option>
              <option value="extra">多余错误</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">排序：</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'error_count' | 'last_error_at')}
              className="input py-1.5 text-sm w-auto"
            >
              <option value="error_count">按错误次数</option>
              <option value="last_error_at">按最近错误时间</option>
            </select>
          </div>
        </div>
      </div>

      {/* 错误记录列表 */}
      {records.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-500 mb-2">
            {filterContentId !== 'all' || filterErrorType !== 'all' 
              ? '当前筛选条件下暂无错误记录' 
              : '暂无错误记录'}
          </p>
          <p className="text-gray-400 text-sm">坚持练习，错题本会帮你记录薄弱点</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => {
            const typeInfo = getErrorTypeLabel(record.error_type);
            return (
              <div
                key={record.id}
                className="card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        typeInfo.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' :
                        typeInfo.color === 'green' ? 'bg-green-50 text-green-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {typeInfo.label}
                      </span>
                      {record.error_count >= 3 && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                          高频错误
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        错误 {record.error_count} 次
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">你的答案</div>
                        <div className={`p-3 rounded-lg ${
                          record.error_type === 'extra' 
                            ? 'bg-red-50 text-red-700 line-through' 
                            : record.error_type === 'missing'
                            ? 'bg-gray-50 text-gray-400 italic'
                            : 'bg-red-50 text-red-700 line-through'
                        }`}>
                          {record.wrong_text || <span className="text-red-400">（空）</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">正确答案</div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-700">
                          {record.correct_text || <span className="text-green-400">（空）</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span>所属内容：{record.content_title || '未知'}</span>
                      <span>首次错误：{formatDate(record.first_error_at)}</span>
                      <span>最近错误：{formatDate(record.last_error_at)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
