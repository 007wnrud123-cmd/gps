import React, { useState, useEffect } from 'react';
import { LayoutDashboard, UserPlus, List, Settings, Activity, LogOut, Wifi, WifiOff } from 'lucide-react';
import { TabView, PatientData, User } from './types';
import { Dashboard } from './components/Dashboard';
import { RegistrationForm } from './components/RegistrationForm';
import { DataList } from './components/DataList';
import { Login } from './components/Login';
import { patientRepository } from './services/patientRepository';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<TabView>(TabView.DASHBOARD);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Subscribe to data source (Local or Firebase)
  useEffect(() => {
    setIsLive(patientRepository.isLiveMode());
    
    const unsubscribe = patientRepository.subscribe((data) => {
      setPatients(data);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleAddPatient = async (newData: PatientData) => {
    await patientRepository.add(newData);
    setCurrentView(TabView.LIST);
  };

  const handleDeletePatient = async (id: string) => {
    await patientRepository.delete(id);
  };

  const getNextSequence = () => {
    return patientRepository.getNextSequence(patients);
  };

  // Login Logic
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView(TabView.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Filter Data based on User Role
  const filteredPatients = user.role === 'ADMIN' 
    ? patients 
    : patients.filter(p => p.centerName === user.centerName);

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col fixed h-full shadow-2xl z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 text-teal-400 mb-1">
            <Activity size={24} />
            <span className="font-bold text-lg tracking-wide">희망이음</span>
          </div>
          <p className="text-xs text-slate-400">치매안심센터 통합관리 시스템</p>
          <div className="mt-4 bg-slate-700 rounded p-2 text-xs text-center border border-slate-600">
            <span className="text-teal-400 font-bold">{user.name}</span>님<br/>
            접속 중입니다
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView(TabView.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === TabView.DASHBOARD ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard size={20} />
            통합 대시보드
          </button>
          
          <button
            onClick={() => setCurrentView(TabView.REGISTER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === TabView.REGISTER ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserPlus size={20} />
            신규 등록
          </button>
          
          <button
            onClick={() => setCurrentView(TabView.LIST)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === TabView.LIST ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <List size={20} />
            보급 현황 조회
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className={`flex items-center gap-2 text-xs p-2 rounded justify-center ${isLive ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-400'}`}>
            {isLive ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isLive ? '실시간 연동중 (Cloud)' : '로컬 모드 (Local)'}
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-lg transition text-sm"
          >
            <LogOut size={16} />
            로그아웃
          </button>
          <div className="flex items-center gap-3 px-4 py-2 text-slate-400 text-sm">
            <Settings size={16} />
            <span>시스템 설정</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <span className="font-bold text-lg text-slate-800">희망이음</span>
            <span className="text-xs text-gray-500 block">{user.name}</span>
          </div>
          <div className="flex gap-2">
             <button onClick={handleLogout} className="p-2 bg-red-50 text-red-600 rounded"><LogOut size={20}/></button>
          </div>
        </div>

        {/* Content Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {currentView === TabView.DASHBOARD && (user.role === 'ADMIN' ? "전체 통합 현황 대시보드" : `${user.centerName} 현황 대시보드`)}
                {currentView === TabView.REGISTER && "배회감지기 보급 등록"}
                {currentView === TabView.LIST && "통합 보급 데이터 관리"}
              </h1>
              <p className="text-gray-500 mt-1">
                {currentView === TabView.DASHBOARD && "실시간 보급 현황 및 통계를 확인하세요."}
                {currentView === TabView.REGISTER && "표준화된 양식으로 쉽고 빠르게 등록하세요."}
                {currentView === TabView.LIST && "등록된 데이터를 검색하고 엑셀(CSV) 파일로 내보낼 수 있습니다."}
              </p>
            </div>
            {!isLive && (
              <div className="hidden md:block text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                 ⚠ 로컬 저장소 모드 (다른 PC 공유 불가)
              </div>
            )}
          </div>
        </header>

        {/* Dynamic View */}
        <div className="max-w-7xl mx-auto">
          {currentView === TabView.DASHBOARD && <Dashboard data={filteredPatients} user={user} />}
          {currentView === TabView.REGISTER && (
            <RegistrationForm onSave={handleAddPatient} nextSequence={getNextSequence()} user={user} />
          )}
          {currentView === TabView.LIST && (
            <DataList data={filteredPatients} onDelete={handleDeletePatient} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;