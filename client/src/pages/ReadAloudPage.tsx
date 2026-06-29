// 朗读页面
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentApi } from '../services/api';
import { localContentService } from '../utils/localStorage';
import { Content } from '../types';
import { presetContents } from '../data/presetContents';
import { PageLoading } from '../components/Loading';

// 语速选项 - 降低速度范围
const SPEED_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1];

export default function ReadAloudPage() {
  const { id } = useParams<{ id?: string }>();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(0.7);  // 默认语速降低
  const [voiceType, setVoiceType] = useState<'male' | 'female'>('female');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showRecorderOpen, setShowRecorderOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const sentences = content?.content.split(/[。！？\n]/).filter(s => s.trim()) || [];

  useEffect(() => {
    loadContent();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [id]);

  const loadVoices = () => {
    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);
  };

  const loadContent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const contentId = parseInt(id);
      if (isNaN(contentId)) {
        const preset = presetContents.find(p => p.id === id);
        if (preset) {
          setContent({
            id: 0,
            title: preset.title,
            content: preset.content,
            created_at: '',
            updated_at: '',
          });
        }
      } else if (isLoggedIn) {
        const response = await contentApi.getDetail(contentId);
        setContent(response.content);
      } else {
        const localContent = localContentService.getDetail(contentId);
        setContent(localContent);
      }
    } catch (err) {
      console.error('加载内容失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChineseVoice = useCallback((type: 'male' | 'female') => {
    const chineseVoices = voices.filter(v => v.lang.startsWith('zh'));
    if (chineseVoices.length === 0) return null;
    
    if (type === 'female') {
      // 女声匹配：优先选择明确的女性声音
      const femalePatterns = [
        'female', '女', 'female', 'F', 'Ting', 'Ting-Ting', 'Huihui',
        'Xiao', 'Xiaoxiao', 'Xiao-Xiao', 'Yuyi', 'Yaoyao', 'Kaikai',
        'Lulu', 'Mei', 'Shanshan', 'Yaoyao', 'Wendy', 'v3'
      ];
      const femaleVoice = chineseVoices.find(v => 
        femalePatterns.some(p => v.name.toLowerCase().includes(p.toLowerCase()))
      );
      return femaleVoice || chineseVoices.find(v => !isMaleVoice(v.name)) || chineseVoices[0];
    } else {
      // 男声匹配：优先选择明确的男性声音
      const malePatterns = [
        'male', '男', 'M', 'Yunyang', 'YunYang', 'Yunxi', 'YunXi',
        'Kangkang', 'Yaoyao', 'Wang', 'Huayu', 'Jiahao', 'Jie', 'Yun',
        'George', 'David', 'James', 'John'
      ];
      const maleVoice = chineseVoices.find(v => 
        malePatterns.some(p => v.name.toLowerCase().includes(p.toLowerCase()))
      );
      return maleVoice || chineseVoices.find(v => isMaleVoice(v.name)) || chineseVoices[chineseVoices.length - 1];
    }
  }, [voices]);

  // 判断是否为男声
  const isMaleVoice = (voiceName: string): boolean => {
    const malePatterns = ['male', '男', 'Yunyang', 'Yunxi', 'Kangkang', 'Yaoyao', 'Wang', 'Huayu'];
    const femalePatterns = ['female', '女', 'Ting', 'Xiaoxiao', 'Yuyi', 'Huihui', 'Yaoyao', 'Kaikai', 'Lulu'];
    
    const lowerName = voiceName.toLowerCase();
    
    // 如果明确包含女声特征，返回 false
    for (const p of femalePatterns) {
      if (lowerName.includes(p.toLowerCase())) return false;
    }
    
    // 如果明确包含男声特征，返回 true
    for (const p of malePatterns) {
      if (lowerName.includes(p.toLowerCase())) return true;
    }
    
    return false;
  };

  const speakSentence = useCallback((index: number) => {
    if (index >= sentences.length) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    utterance.rate = speed;
    utterance.lang = 'zh-CN';
    utterance.volume = 1;  // 最大音量
    utterance.pitch = voiceType === 'female' ? 1.1 : 0.95;  // 女声稍高，男声稍低
    
    const voice = getChineseVoice(voiceType);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setCurrentIndex(index + 1);
      speakSentence(index + 1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [sentences, speed, voiceType, getChineseVoice]);

  const handlePlay = () => {
    if (recordedAudio) {
      if (audioRef.current) {
        audioRef.current.play();
      }
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentIndex(0);
    speakSentence(0);
  };

  const handlePause = () => {
    if (recordedAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (recordedAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        setRecordedDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('录音失败:', err);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setRecordedAudio(null);
    setRecordedDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">请选择一篇朗读材料</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
      onClick={() => navigate('/')}
      className="mb-6 text-gray-600 hover:text-gray-900 text-sm"
    >
      ← 返回列表
    </button>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 标题区 */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900">{content.title}</h1>
      </div>

      {/* 内容区*/}
      <div className="p-6 max-h-96 overflow-y-auto">
        <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
          {sentences.map((sentence, index) => (
            <span
              key={index}
              className={`${
                isPlaying && !recordedAudio === null && index === currentIndex
                  ? 'bg-yellow-100 text-gray-900'
                  : ''
              }`}
            >
              {sentence}
              {sentences[index + 1] !== undefined ? '。' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* 控制面板 */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        {/* 声音选择 */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-600">声音选择</span>
          <div className="flex gap-2">
            <button
              onClick={() => setVoiceType('female')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                voiceType === 'female'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              女声
            </button>
            <button
              onClick={() => setVoiceType('male')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                voiceType === 'male'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              男声
            </button>
          </div>
        </div>

        {/* 语速调节 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">语速</span>
            <span className="text-sm font-medium text-gray-900">{speed}x</span>
          </div>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                  speed === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleStop}
            className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center"
            title="停止"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="5" width="10" height="10" rx="1" />
            </svg>
          </button>
          
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="w-16 h-16 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
              title="暂停"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="4" width="3" height="12" rx="1" />
                <rect x="12" y="4" width="3" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="w-16 h-16 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
              title="播放"
            >
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4l10 6-10 6V4z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => setShowRecorderOpen(!showRecorderOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              showRecorderOpen || recordedAudio
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="我的录音"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a3 3 0 00-3 3v5a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path fillRule="evenodd" d="M5 9a1 1 0 011 1 4 4 0 008 0 1 1 0 112 0 6 6 0 01-5 5.917V17a1 1 0 11-2 0v-1.083A6 6 0 014 10a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 录音面板 */}
        {showRecorderOpen && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">我的录音</h3>
            
            {recordedAudio ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    已录音 {formatDuration(recordedDuration)}
                  </span>
                  <button
                    onClick={deleteRecording}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
                <audio ref={audioRef} src={recordedAudio} controls className="w-full" />
                <p className="text-xs text-gray-500">
                  提示：您可以播放自己录制的朗读音频来跟读练习
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <rect x="5" y="5" width="10" height="10" rx="1" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">正在录音...</p>
                    <button
                      onClick={stopRecording}
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      停止录音
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a3 3 0 00-3 3v5a3 3 0 006 0V5a3 3 0 00-3-3z" />
                        <path fillRule="evenodd" d="M5 9a1 1 0 011 1 4 4 0 008 0 1 1 0 112 0 6 6 0 01-5 5.917V17a1 1 0 11-2 0v-1.083A6 6 0 014 10a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">录制您自己的朗读声音</p>
                    <button
                      onClick={startRecording}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      开始录音
                    </button>
                    <p className="text-xs text-gray-400">
                      提示：您可以朗读任意内容，系统会录制您的声音
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
