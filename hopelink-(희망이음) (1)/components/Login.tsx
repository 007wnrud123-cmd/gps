import React, { useState, useEffect } from 'react';
import { RELIEF_CENTERS } from '../constants';
import { User } from '../types';
import { Lock, LogIn, Activity, Terminal, ExternalLink, AlertCircle, Copy, Check, X, Keyboard } from 'lucide-react';
import { firebaseConfig } from '../services/firebaseConfig';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userType, setUserType] = useState<'ADMIN' | 'CENTER'>('ADMIN');
  const [selectedCenter, setSelectedCenter] = useState(RELIEF_CENTERS[0].name);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // 현재 주소가 개발용(가짜)인지 확인
  const currentUrl = window.location.href;
  const isDevUrl = currentUrl.includes('googleusercontent') || currentUrl.includes('localhost') || currentUrl.includes('aistudio');
  const publicUrl = `https://${firebaseConfig.projectId}.web.app`;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userType === 'ADMIN') {
      if (password === '1234') { 
        onLogin({ role: 'ADMIN', name: '통합 관리자' });
      } else {
        setError('관리자 비밀번호가 일치하지 않습니다.');
      }
    } else {
      const centerConfig = RELIEF_CENTERS.find(c => c.name === selectedCenter);
      if (centerConfig && password === centerConfig.password) {
        onLogin({ role: 'CENTER', centerName: centerConfig.name, name: centerConfig.name });
      } else {
        setError('센터 비밀번호가 일치하지 않습니다. 관리자에게 문의하세요.');
      }
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText('npm run build && firebase deploy --only hosting');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 gap-6">
      
      {/* 🚨 관리자 필독 가이드 (닫기 가능) */}
      {isDevUrl && showGuide && (
        <div className="w-full max-w-2xl bg-slate-900 text-white p-6 rounded-xl shadow-2xl border-2 border-yellow-400 relative animate-fade-in-down">
          <button 
            onClick={() => setShowGuide(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition"
            title="설명서 닫기"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-400 shrink-0 mt-1" size={28} />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-yellow-300 mb-2">
                선생님! 터미널(까만창)을 못 찾으셨나요?
              </h2>
              
              <div className="bg-indigo-900/50 p-3 rounded-lg border border-indigo-500/50 mb-4 flex items-center gap-3">
                <Keyboard className="text-indigo-300" size={24} />
                <div className="text-sm">
                  <p className="text-indigo-200 font-bold">터미널 여는 단축키</p>
                  <p className="text-white">
                    키보드에서 <span className="bg-slate-700 px-1.5 py-0.5 rounded border border-slate-500 font-mono">Ctrl</span> + <span className="bg-slate-700 px-1.5 py-0.5 rounded border border-slate-500 font-mono">J</span> 를 눌러보세요!
                  </p>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-3">
                아래 <b>[명령어 복사]</b> 버튼을 누른 뒤, 열린 터미널에 붙여넣고 <b>엔터</b>만 치시면 됩니다.
              </p>
              
              <div className="bg-black rounded-lg p-3 border border-gray-700 mb-3 flex justify-between items-center">
                <code className="text-green-300 text-sm font-mono truncate mr-4">
                  npm run build && firebase deploy --only hosting
                </code>
                <button 
                  onClick={copyCommand}
                  className="shrink-0 text-xs bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded text-white flex items-center gap-1 transition font-bold"
                >
                  {copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? "복사됨!" : "명령어 복사"}
                </button>
              </div>

              <div className="text-xs text-gray-400">
                * 성공하면 <span className="text-blue-300">https://gps-registration.web.app</span> 같은 주소가 나옵니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 폼 */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-800 p-8 text-center">
          <div className="flex justify-center mb-4 text-teal-400">
            <Activity size={48} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">희망이음</h1>
          <p className="text-slate-400 text-sm">치매안심센터 배회감지기 통합관리</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${userType === 'ADMIN' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}
              onClick={() => { setUserType('ADMIN'); setError(''); }}
            >
              전체 관리자
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${userType === 'CENTER' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}
              onClick={() => { setUserType('CENTER'); setError(''); }}
            >
              센터 담당자
            </button>
          </div>

          {userType === 'CENTER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소속 센터 선택</label>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                {RELIEF_CENTERS.map(center => (
                  <option key={center.name} value={center.name}>{center.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-gray-300 border focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="비밀번호 4자리를 입력하세요"
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-teal-700 transition flex justify-center items-center gap-2 shadow-lg"
          >
            <LogIn size={20} />
            로그인
          </button>
          
          <div className="text-center text-xs text-gray-400 mt-4">
            * 초기 비밀번호는 각 센터 관리자에게 별도 안내되었습니다.
          </div>
        </form>
      </div>

      {isDevUrl && !showGuide && (
        <button 
          onClick={() => setShowGuide(true)}
          className="text-gray-500 text-sm hover:text-gray-800 underline"
        >
          배포 가이드 다시 보기
        </button>
      )}
    </div>
  );
};