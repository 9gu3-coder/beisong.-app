// 个人中心页面
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studyApi, errorApi } from '../services/api';
import { StudyStats, ErrorStats } from '../types';
import { PageLoading } from '../components/Loading';
import Modal from '../components/Modal';

export default function Profile() {
  const { user, isLoggedIn, isLoading, logout, updateUser } = useAuth();
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadStats();
    }
  }, [isLoggedIn]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const [studyRes, errorRes] = await Promise.all([
        studyApi.getStats(),
        errorApi.getStats(),
      ]);
      setStudyStats(studyRes);
      setErrorStats(errorRes);
    } catch (err) {
      console.error('加载统计数据失败:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditName(user.name);
      setEditPassword('');
      setEditConfirmPassword('');
      setError('');
      setShowEditModal(true);
    }
  };

  const handleSave = async () => {
    setError('');
    
    if (!editName.trim()) {
      setError('昵称不能为空');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    if (editPassword && editPassword !== editConfirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setSaving(true);
    try {
      const data: { name?: string; password?: string } = {
        name: editName.trim(),
      };
      if (editPassword) {
        data.password = editPassword;
      }
      await updateUser(data);
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">个人中心</h1>

      {/* 未登录状态 */}
      {!isLoggedIn && (
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">未登录</h2>
          <p className="text-gray-500 mb-6">
            登录后可同步学习数据到云端，换设备也能继续学习
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/login" className="btn btn-primary">
              登录
            </a>
            <a href="/register" className="btn btn-secondary">
              注册
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              当前使用本地存储模式，数据仅保存在本设备
            </p>
          </div>
        </div>
      )}

      {/* 已登录状态 */}
      {isLoggedIn && user && (
        <div className="space-y-6">
          {/* 账号信息 */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">账号信息</h2>
              <button
                onClick={openEditModal}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                编辑
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-medium text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 学习统计 */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">学习统计</h2>
            {statsLoading ? (
              <div className="py-8 text-center text-gray-400">加载中...</div>
            ) : studyStats && errorStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{studyStats.totalStudies}</div>
                  <div className="text-sm text-gray-500">总练习次数</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(studyStats.averageCorrectRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">平均正确率</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{studyStats.weeklyStudies}</div>
                  <div className="text-sm text-gray-500">本周练习次数</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{errorStats.frequentErrors}</div>
                  <div className="text-sm text-gray-500">高频错误</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 退出登录 */}
          <div className="card p-6">
            <button
              onClick={logout}
              className="btn btn-danger w-full"
            >
              退出登录
            </button>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑个人信息"
        footer={
          <>
            <button
              onClick={() => setShowEditModal(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? '保存中...' : '保存'}
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
              昵称
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              新密码（不修改请留空）
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="至少6位字符"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              确认新密码
            </label>
            <input
              type="password"
              value={editConfirmPassword}
              onChange={(e) => setEditConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              className="input"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
