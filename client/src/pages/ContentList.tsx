// 内容列表页
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentApi } from '../services/api';
import { localContentService } from '../utils/localStorage';
import { Content } from '../types';
import { formatDate } from '../utils/textUtils';
import { presetContents, PresetContent, getPresetsByCategory } from '../data/presetContents';
import Modal from '../components/Modal';
import Loading, { PageLoading } from '../components/Loading';

type TabType = 'my' | 'preset';

export default function ContentList() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [addingPreset, setAddingPreset] = useState<string | null>(null);

  const categories = ['全部', '诗', '词', '文言文', '现代文'];

  useEffect(() => {
    loadContents();
  }, [isLoggedIn]);

  const loadContents = async () => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        const response = await contentApi.getList();
        setContents(response.contents);
      } else {
        setContents(localContentService.getList());
      }
    } catch (err) {
      console.error('加载内容失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setError('请输入标题');
      return;
    }
    if (!newContent.trim()) {
      setError('请输入内容');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isLoggedIn) {
        await contentApi.create(newTitle.trim(), newContent.trim());
      } else {
        localContentService.create(newTitle.trim(), newContent.trim());
      }
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      loadContents();
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPreset = async (preset: PresetContent) => {
    setAddingPreset(preset.id);
    try {
      const title = `${preset.title}（${preset.dynasty}·${preset.author}）`;
      let newContent: Content;
      
      if (isLoggedIn) {
        const response = await contentApi.create(title, preset.content);
        newContent = response.content;
      } else {
        newContent = localContentService.create(title, preset.content);
      }
      
      loadContents();
      // 添加成功后跳转到内容详情
      navigate(`/content/${newContent.id}`);
    } catch (err) {
      console.error('添加失败:', err);
      alert('添加失败，请重试');
    } finally {
      setAddingPreset(null);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这份内容吗？相关的错误记录也会被删除。')) {
      return;
    }

    try {
      if (isLoggedIn) {
        await contentApi.delete(id);
      } else {
        localContentService.delete(id);
      }
      loadContents();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  // 过滤预置内容
  const filteredPresets = presetContents.filter(item => {
    const matchCategory = selectedCategory === '全部' || item.category === selectedCategory;
    const matchSearch = !searchKeyword || 
      item.title.includes(searchKeyword) ||
      item.author.includes(searchKeyword) ||
      item.content.includes(searchKeyword);
    return matchCategory && matchSearch;
  });

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">默写内容</h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'my' ? `共 ${contents.length} 份内容` : `共 ${presetContents.length} 篇精选`}
          </p>
        </div>
        {activeTab === 'my' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + 新建内容
          </button>
        )}
      </div>

      {/* 标签页切换 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('my')}
          className={`tab ${activeTab === 'my' ? 'tab-active' : 'tab-inactive'}`}
        >
          我的内容
        </button>
        <button
          onClick={() => setActiveTab('preset')}
          className={`tab ${activeTab === 'preset' ? 'tab-active' : 'tab-inactive'}`}
        >
          精选内容
        </button>
      </div>

      {/* 我的内容 */}
      {activeTab === 'my' && (
        <>
          {contents.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 mb-2">还没有任何内容</p>
              <p className="text-gray-400 text-sm mb-6">
                可以去「精选内容」添加，或自己创建
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setActiveTab('preset')}
                  className="btn btn-secondary"
                >
                  浏览精选
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  创建内容
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contents.map(item => (
                <div
                  key={item.id}
                  className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/content/${item.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 truncate flex-1 pr-2">
                      {item.title}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                    {item.content}
                  </p>
                  <div className="text-xs text-gray-400">
                    {formatDate(item.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 精选内容 */}
      {activeTab === 'preset' && (
        <div className="space-y-6">
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索标题、作者..."
                className="input"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 精选内容列表 */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredPresets.map(item => (
              <div
                key={item.id}
                className="card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.dynasty}·{item.author}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      item.difficulty === '初级' ? 'bg-green-50 text-green-600' :
                      item.difficulty === '中级' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {item.difficulty}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                  {item.content}
                </p>
                <button
                  onClick={() => handleAddPreset(item)}
                  disabled={addingPreset === item.id}
                  className="w-full btn btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                >
                  {addingPreset === item.id && <Loading size="sm" />}
                  {addingPreset === item.id ? '添加中...' : '+ 添加到我的内容'}
                </button>
              </div>
            ))}
          </div>

          {filteredPresets.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">没有找到匹配的内容</p>
            </div>
          )}
        </div>
      )}

      {/* 新建内容弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建默写内容"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="btn btn-primary flex items-center gap-2"
            >
              {submitting && <Loading size="sm" />}
              创建
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              标题
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="例如：《静夜思》默写"
              className="input"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              内容
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="粘贴或输入需要默写的内容..."
              className="input min-h-[200px] resize-y"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
