import React, { useState } from 'react';
import { PatientData } from '../types';
import { Search, Trash2, FileDown, FileText } from 'lucide-react';

interface DataListProps {
  data: PatientData[];
  onDelete: (id: string) => void;
}

export const DataList: React.FC<DataListProps> = ({ data, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCenter, setFilterCenter] = useState('');

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.name.includes(searchTerm) || 
      item.serialNumber.includes(searchTerm) || 
      (item.guardianName && item.guardianName.includes(searchTerm));
    const matchesCenter = filterCenter ? item.centerName === filterCenter : true;
    return matchesSearch && matchesCenter;
  });

  const uniqueCenters = Array.from(new Set(data.map(item => item.centerName)));

  const handleExport = () => {
    // Extended CSV Headers
    const headers = [
      '보급기관', '식별번호', '기기상태', '신청일자', '개통일자', '만료일자', // Device
      '이름', '성별', '생년월일', '주소', '상세주소', '연락처1', '연락처2', '실종경험', '횟수', // User
      '보호자명', '관계', '보호자성별', '보호자연락처1', '보호자연락처2', '비고', // Guardian
      '전자동의서', // Consent
      '사용상태', '미사용사유', '대체수단', '대상자요청사항', '추후관리계획' // Monitoring
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.centerName,
        `"${row.serialNumber}"`,
        row.deviceStatus,
        row.applicationDate,
        row.openingDate,
        row.expirationDate,
        
        row.name,
        row.gender,
        row.birthDate,
        `"${row.address}"`,
        `"${row.detailAddress}"`,
        row.contact,
        row.contact2,
        row.missingExperience,
        row.missingCount,
        
        row.guardianName,
        row.guardianRelationship,
        row.guardianGender,
        row.guardianContact1,
        row.guardianContact2,
        `"${row.guardianNote || ''}"`,

        row.consentFile ? '제출(O)' : '미제출(X)',
        
        row.usageStatus,
        row.usageStatus === '미사용중' ? row.nonUsageReason : '',
        row.usageStatus === '미사용중' ? row.nonUsageAlternative : '',
        row.usageStatus === '미사용중' ? row.patientRequest : '',
        row.usageStatus === '미사용중' ? row.nonUsagePlan : ''
      ].map(field => field === undefined ? '' : field).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `치매안심센터_통합보급명부_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="이름, 식별번호, 보호자명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <select 
            className="border rounded-md px-3 py-2 text-sm min-w-[150px]"
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
          >
            <option value="">전체 기관</option>
            {uniqueCenters.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition font-bold shadow-md"
        >
          <FileDown size={20} /> 전체 명단 엑셀 다운로드
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">보급기관</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">식별번호</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">성명</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">생년월일</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">보호자</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">동의서</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredData.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-3 whitespace-nowrap text-gray-900">{patient.centerName.replace(' 치매안심센터', '')}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-mono font-bold text-blue-600">{patient.serialNumber}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium">{patient.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{patient.birthDate}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-500">{patient.contact || '-'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {patient.guardianName} <span className="text-xs text-gray-400">({patient.guardianRelationship})</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      {patient.consentFile ? (
                        <a 
                          href={patient.consentFile.data} 
                          download={patient.consentFile.name}
                          className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                          title="동의서 다운로드"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {patient.usageStatus === '사용중' ? (
                        <span className="text-green-600 font-bold">사용중</span>
                      ) : (
                        <span className="text-red-500 font-bold">미사용</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <button 
                        onClick={() => {
                          if(window.confirm('정말 삭제하시겠습니까?')) onDelete(patient.id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};