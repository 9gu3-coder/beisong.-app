// 内容详情页
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentApi } from '../services/api';
import { localContentService } from '../utils/localStorage';
import { Content, RecitationMode } from '../types';
import { PageLoading } from '../components/Loading';

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<RecitationMode>('free');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContentText, setEditContentText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, [id, isLoggedIn]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const contentId = parseInt(id || '0', 10);
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

  const startEditing = () => {
    if (content) {
      setEditTitle(content.title);
      setEditContentText(content.content);
      setIsEditing(true);
    }
  };

  const saveEdit = async () => {
    if (!content || !id) return;
    
    setSaving(true);
    try {
      const contentId = parseInt(id, 10);
      if (isLoggedIn) {
        await contentApi.update(contentId, {
          title: editTitle.trim(),
          content: editContentText.trim(),
        });
      } else {
        localContentService.update(contentId, {
          title: editTitle.trim(),
          content: editContentText.trim(),
        });
      }
      setIsEditing(false);
      loadContent();
    } catch (err) {
      console.error('保存失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const startRecitation = () => {
    navigate(`/practice/${id}?mode=${selectedMode}`);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回列表
        </Link>
        
        {!isEditing && (
          <button
            onClick={startEditing}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            编辑内容
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="card p-8 mb-8">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                标题
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input text-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                内容
              </label>
              <textarea
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                className="input min-h-[300px] resize-y text-base leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {content.title}
            </h1>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-loose whitespace-pre-wrap text-lg">
                {content.content}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 模式选择与开始 */}
      {!isEditing && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">选择默写模式</h2>
          
          {/* 模式切换标签 */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setSelectedMode('free')}
              className={`tab ${selectedMode === 'free' ? 'tab-active' : 'tab-inactive'}`}
            >
              自由输入模式
            </button>
            <button
              onClick={() => setSelectedMode('blank')}
              className={`tab ${selectedMode === 'blank' ? 'tab-active' : 'tab-inactive'}`}
            >
              智能挖空模式
            </button>
          </div>

          {/* 模式说明 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            {selectedMode === 'free' ? (
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">自由输入模式：</span>
                原文消失后，在输入框中凭记忆完整输入内容，系统逐字检查并标记错误。
                适合对内容有一定熟悉程度后的完整默写练习。
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">智能挖空模式：</span>
                系统按句子为单位，每隔两句挖空一句，在挖空处填写答案。
                适合初期记忆练习，降低难度，逐步加深印象。
              </p>
            )}
          </div>

          <button
            onClick={startRecitation}
            className="btn btn-primary w-full py-3 text-base"
          >
            开始默写
          </button>
        </div>
      )}
    </div>
  );
}
