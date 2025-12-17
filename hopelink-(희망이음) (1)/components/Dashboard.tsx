import React, { useState, useEffect } from 'react';
import { PatientData, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, AlertTriangle, Activity, MapPin, Sparkles, Info, Share2, Copy, Check, CloudLightning, FileDown, BookOpen, Globe, Terminal, ExternalLink, X, Keyboard } from 'lucide-react';
import { analyzePatientData } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { patientRepository } from '../services/patientRepository';
import { firebaseConfig } from '../services/firebaseConfig';

interface DashboardProps {
  data: PatientData[];
  user: User;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ data, user }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const isLive = patientRepository.isLiveMode();
  
  // 현재 접속한 주소가 '진짜'인지 '가짜(개발용)'인지 확인
  const currentUrl = window.location.href;
  const isDevUrl = currentUrl.includes('googleusercontent') || currentUrl.includes('localhost') || currentUrl.includes('aistudio');
  const publicUrl = `https://${firebaseConfig.projectId}.web.app`;

  // Stats Calculation
  const totalPatients = data.length;
  const missingExperienceCount = data.filter(p => p.missingExperience && p.missingExperience !== '0회').length;
  const missingRate = totalPatients > 0 ? ((missingExperienceCount / totalPatients) * 100).toFixed(1) : '0';
  const averageAge = totalPatients > 0 
    ? (data.reduce((acc, curr) => acc + curr.age, 0) / totalPatients).toFixed(1) 
    : '0';

  // Chart Data Preparation
  const centerCounts = data.reduce((acc, curr) => {
    acc[curr.centerName] = (acc[curr.centerName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(centerCounts).map(key => ({
    name: key.replace(' 치매안심센터', ''), // Shorten name for chart
    count: centerCounts[key]
  })).sort((a, b) => b.count - a.count).slice(0, 7); // Top 7 centers

  const diagnosisCounts = data.reduce((acc, curr) => {
    acc[curr.diagnosis] = (acc[curr.diagnosis] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(diagnosisCounts).map(key => ({
    name: key,
    value: diagnosisCounts[key]
  }));

  const handleAIAnalysis = async () => {
    setLoading(true);
    const result = await analyzePatientData(data);
    setAnalysis(result);
    setLoading(false);
  };

  const handleCopyLink = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert("주소가 복사되었습니다!");
    });
  };

  const copyCommand = () => {
    navigator.clipboard.writeText('npm run build && firebase deploy --only hosting');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 🚨 중요: 주소 안내 섹션 (관리자에게만 보임) */}
      {user.role === 'ADMIN' && isDevUrl && showGuide && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-2xl border-2 border-yellow-400 relative">
          <button 
            onClick={() => setShowGuide(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-slate-700 rounded-full transition"
            title="가이드 닫기"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="bg-yellow-400 text-slate-900 p-3 rounded-full animate-pulse hidden md:block">
              <Globe size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-yellow-300 mb-2">
                ✋ 잠깐만요! 지금 주소는 공유하면 안 됩니다!
              </h2>
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <h3 className="font-bold flex items-center gap-2 mb-2">
                    <Terminal size={18} className="text-green-400"/>
                    1. 터미널 열기
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">
                    키보드에서 <span className="bg-slate-900 px-1 rounded border border-slate-500">Ctrl</span> + <span className="bg-slate-900 px-1 rounded border border-slate-500">J</span> 를 누르세요.
                  </p>
                  <code className="block bg-black text-green-400 p-2 rounded font-mono text-xs select-all cursor-pointer border border-gray-600">
                    npm run build && firebase deploy --only hosting
                  </code>
                   <button 
                    onClick={copyCommand}
                    className="mt-2 w-full text-xs bg-green-700 hover:bg-green-600 py-1 rounded text-white font-bold transition"
                  >
                    명령어 복사하기
                  </button>
                </div>

                <div className="flex-1 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <h3 className="font-bold flex items-center gap-2 mb-2">
                    <ExternalLink size={18} className="text-blue-400"/>
                    2. 진짜 주소 확인
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">명령어가 완료되면 아래 주소가 생성됩니다.</p>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline font-mono text-sm block mb-2">
                    {publicUrl}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status Warning */}
      {!isLive ? (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm flex justify-between items-start">
          <div className="flex items-start">
            <Info className="text-amber-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-amber-800">⚠ 현재 로컬 저장소 모드 (Local Storage Mode)</h3>
              <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                현재 입력하는 데이터는 <b>이 컴퓨터에만 저장</b>되며, 서버로 전송되지 않습니다. <br/>
                다른 센터와 실시간으로 데이터를 공유하려면 <b>services/firebaseConfig.ts</b> 파일에 Firebase 키를 입력하세요.
              </p>
            </div>
          </div>
          {isDevUrl && !showGuide && (
             <button onClick={() => setShowGuide(true)} className="text-xs text-amber-700 underline shrink-0 ml-4">가이드 보기</button>
          )}
        </div>
      ) : (
        !isDevUrl && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <CloudLightning className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-blue-800">☁ 실시간 클라우드 연동 중 (정식 배포 버전)</h3>
                <p className="text-blue-700 text-sm mt-1 leading-relaxed">
                  정상적으로 배포된 시스템입니다. 이 주소를 공유하여 사용하시면 됩니다.
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Admin Guide Section (Simplified) */}
      {user.role === 'ADMIN' && !isDevUrl && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-teal-500">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-teal-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">관리자 업무 가이드</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">1. 주소 배포하기</h4>
              <p className="text-sm text-gray-600 mb-4">
                아래 버튼을 눌러 인터넷 주소를 복사한 뒤,<br/>22개 시군 담당자에게 보내주세요.
              </p>
              <button 
                onClick={() => handleCopyLink(window.location.href)}
                className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700 transition flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? "복사 완료!" : "접속 주소 복사"}
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">2. 엑셀 다운로드</h4>
              <p className="text-sm text-gray-600">
                <b>[보급 현황 조회]</b> 메뉴에서<br/>
                엑셀 파일로 내려받으세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">총 보급 건수</p>
            <p className="text-2xl font-bold text-gray-800">{totalPatients}건</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">실종 경험 비율</p>
            <p className="text-2xl font-bold text-gray-800">{missingRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600"><Activity size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">평균 연령</p>
            <p className="text-2xl font-bold text-gray-800">{averageAge}세</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600"><MapPin size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">참여 기관</p>
            <p className="text-2xl font-bold text-gray-800">{Object.keys(centerCounts).length}개소</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">센터별 보급 현황 (상위 7개소)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">진단명 분포</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600" />
            <h3 className="text-lg font-bold text-indigo-900">Gemini AI 데이터 안전 분석</h3>
          </div>
          <button 
            onClick={handleAIAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? '분석 중...' : '데이터 분석 실행'}
          </button>
        </div>
        
        {analysis && (
          <div className="bg-white p-5 rounded-lg border border-indigo-100 prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        )}
        {!analysis && !loading && (
          <p className="text-gray-500 text-sm">
            현재 등록된 데이터를 기반으로 위험군 분석 및 운영 제언을 받아보세요.
          </p>
        )}
      </div>
    </div>
  );
};