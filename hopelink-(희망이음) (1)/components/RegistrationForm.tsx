import React, { useState, useEffect } from 'react';
import { PatientData, User } from '../types';
import { RELIEF_CENTERS, DEVICE_STATUS_OPTIONS, GUARDIAN_RELATIONSHIPS, NON_USAGE_REASONS } from '../constants';
import { Save, PlusCircle, ChevronDown, Upload, FileText, X } from 'lucide-react';

interface RegistrationFormProps {
  onSave: (data: PatientData) => void;
  nextSequence: number;
  user: User;
}

const AREA_CODES = [
  "010", "011", "016", "017", "018", "019", // Mobile
  "02", "031", "032", "033", "041", "042", "043", "044", // Area
  "051", "052", "053", "054", "055", "061", "062", "063", "064", // Area
  "070", "050" // Etc
];

// Helper component for split phone input
const PhoneInput = ({ 
  name, 
  value, 
  onChange 
}: { 
  name: string, 
  value: string, 
  onChange: (newValue: string) => void 
}) => {
  // Safely split the current value or default to empty strings
  const parts = value ? value.split('-') : ['010', '', ''];
  const [part1, part2, part3] = [parts[0] || '010', parts[1] || '', parts[2] || ''];

  const handlePartChange = (index: number, newVal: string) => {
    // Only allow numbers
    const numericVal = newVal.replace(/[^0-9]/g, '');
    
    const newParts = [part1, part2, part3];
    newParts[index] = numericVal;
    
    // Join with hyphens
    if (newParts.every(p => p === '')) {
      onChange('');
    } else {
      onChange(newParts.join('-'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={part1}
          onChange={(e) => handlePartChange(0, e.target.value)}
          className="appearance-none w-24 rounded-md border-gray-300 shadow-sm py-2 pl-3 pr-8 border text-center bg-white focus:ring-teal-500 focus:border-teal-500 outline-none"
        >
          {AREA_CODES.map(code => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <ChevronDown size={14} />
        </div>
      </div>
      <span className="text-gray-400 font-bold">-</span>
      <input
        type="text"
        value={part2}
        onChange={(e) => handlePartChange(1, e.target.value)}
        maxLength={4}
        className="w-24 rounded-md border-gray-300 shadow-sm p-2 border text-center focus:ring-teal-500 focus:border-teal-500 outline-none"
        placeholder="0000"
      />
      <span className="text-gray-400 font-bold">-</span>
      <input
        type="text"
        value={part3}
        onChange={(e) => handlePartChange(2, e.target.value)}
        maxLength={4}
        className="w-24 rounded-md border-gray-300 shadow-sm p-2 border text-center focus:ring-teal-500 focus:border-teal-500 outline-none"
        placeholder="0000"
      />
    </div>
  );
};

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSave, nextSequence, user }) => {
  const initialFormState: Partial<PatientData> = {
    // Basic defaults
    centerName: user.role === 'CENTER' && user.centerName ? user.centerName : RELIEF_CENTERS[0].name,
    sequenceNumber: nextSequence,
    
    // Device Info
    serialNumber: '',
    deviceStatus: '정상',
    applicationDate: new Date().toISOString().split('T')[0],
    openingDate: '',
    expirationDate: '',

    // User Info
    name: '',
    gender: '남',
    birthDate: '',
    age: 0,
    address: '',
    detailAddress: '',
    contact: '010--', // Default partial
    contact2: '',
    missingExperience: '무',
    missingCount: 0,
    diagnosis: '치매',

    // Guardian Info
    guardianName: '',
    guardianRelationship: '배우자',
    guardianGender: '남',
    guardianBirthDate: '',
    guardianContact1: '010--',
    guardianContact2: '',
    guardianNote: '',

    // Consent
    consentFile: undefined,

    // Monitoring
    usageStatus: '사용중',
    nonUsageReason: '',
    nonUsageAlternative: '',
    patientRequest: '',
    nonUsageEncouragement: 'X',
    nonUsagePlan: ''
  };

  const [formData, setFormData] = useState<Partial<PatientData>>(initialFormState);
  const [otherRelationship, setOtherRelationship] = useState('');
  const [otherNonUsageReason, setOtherNonUsageReason] = useState('');
  const [tempFile, setTempFile] = useState<{name: string, data: string} | null>(null);

  // If user is a center admin, force the center name
  useEffect(() => {
    if (user.role === 'CENTER' && user.centerName) {
      setFormData(prev => ({ ...prev, centerName: user.centerName }));
    }
  }, [user]);

  // Auto-calculate age from birthdate
  useEffect(() => {
    if (formData.birthDate) {
      const birthYear = new Date(formData.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      setFormData(prev => ({ ...prev, age: currentYear - birthYear + 1 })); // Korean Age approximation
    }
  }, [formData.birthDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.serialNumber) {
      alert("이름과 배회감지기 식별번호는 필수입니다.");
      return;
    }

    // Handle 'Other' relationship
    let finalRelationship = formData.guardianRelationship;
    if (formData.guardianRelationship === '기타' && otherRelationship) {
      finalRelationship = `기타(${otherRelationship})`;
    }

    // Handle 'Other' non-usage reason
    let finalNonUsageReason = formData.nonUsageReason;
    if (formData.usageStatus === '미사용중' && formData.nonUsageReason === '기타' && otherNonUsageReason) {
      finalNonUsageReason = `기타(${otherNonUsageReason})`;
    }

    const newData: PatientData = {
      id: Date.now().toString(),
      ...formData as PatientData,
      guardianRelationship: finalRelationship,
      nonUsageReason: finalNonUsageReason,
      consentFile: tempFile ? tempFile : undefined
    };

    onSave(newData);
    alert("등록되었습니다!");
    
    // Reset form partially
    setFormData({
      ...initialFormState,
      centerName: formData.centerName, // Keep current center
      applicationDate: formData.applicationDate // Keep date
    });
    setOtherRelationship('');
    setOtherNonUsageReason('');
    setTempFile(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let newValue: string | number = value;

    if (name === 'missingCount' || name === 'age') {
      newValue = Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handlePhoneUpdate = (fieldName: string, newValue: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Size check (e.g., limit to 2MB for local storage safety)
      if (file.size > 2 * 1024 * 1024) {
        alert("파일 크기는 2MB 이하여야 합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempFile({
            name: file.name,
            data: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-5xl mx-auto animate-fade-in-up">
      <div className="bg-teal-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PlusCircle /> 신규 등록 (상세 양식)
          </h2>
          <p className="text-teal-100 text-sm mt-1">
            호남권역 치매안심센터 표준 등록 서식
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">관리번호</p>
          <p className="text-2xl font-bold">No. {nextSequence}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">
        
        {/* 1. 디바이스 기본 정보 */}
        <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-teal-500 rounded-full"></span> 
            디바이스 기본 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
               <label className="block text-sm font-medium text-gray-700 mb-1">관리 기관</label>
               <select
                  name="centerName"
                  value={formData.centerName}
                  onChange={handleChange}
                  disabled={user.role === 'CENTER'}
                  className="w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white focus:ring-teal-500 focus:border-teal-500 outline-none"
                >
                  {RELIEF_CENTERS.map(center => (
                    <option key={center.name} value={center.name}>{center.name}</option>
                  ))}
                </select>
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">배회감지기 식별번호 (숫자 7자리)</label>
              <input 
                type="text" 
                name="serialNumber" 
                value={formData.serialNumber} 
                onChange={handleChange} 
                maxLength={7}
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono tracking-widest text-lg text-blue-800 font-bold focus:ring-teal-500 focus:border-teal-500 outline-none" 
                placeholder="0000000" 
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">기기상태</label>
              <select name="deviceStatus" value={formData.deviceStatus} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none">
                {DEVICE_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
             
             <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">신청일자</label>
              <input type="date" name="applicationDate" value={formData.applicationDate} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">개통일자</label>
              <input type="date" name="openingDate" value={formData.openingDate} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">만료일자</label>
              <input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
          </div>
        </section>

        {/* 2. 이용자 정보 */}
        <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span> 
            이용자 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">성명</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center"><input type="radio" name="gender" value="남" checked={formData.gender === '남'} onChange={handleChange} className="mr-2" /> 남</label>
                <label className="flex items-center"><input type="radio" name="gender" value="여" checked={formData.gender === '여'} onChange={handleChange} className="mr-2" /> 여</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-100" readOnly />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="기본 주소" className="w-full rounded-md border-gray-300 shadow-sm p-2 border mb-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
              <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleChange} placeholder="상세 주소 (동, 호수 등)" className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처 1</label>
              <PhoneInput 
                name="contact" 
                value={formData.contact || ''} 
                onChange={(val) => handlePhoneUpdate('contact', val)} 
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처 2</label>
              <PhoneInput 
                name="contact2" 
                value={formData.contact2 || ''} 
                onChange={(val) => handlePhoneUpdate('contact2', val)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">실종경험</label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center"><input type="radio" name="missingExperience" value="유" checked={formData.missingExperience === '유'} onChange={handleChange} className="mr-2" /> 유</label>
                <label className="flex items-center"><input type="radio" name="missingExperience" value="무" checked={formData.missingExperience === '무'} onChange={handleChange} className="mr-2" /> 무</label>
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">횟수</label>
              <input type="number" name="missingCount" value={formData.missingCount} onChange={handleChange} disabled={formData.missingExperience === '무'} className="w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100 focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
          </div>
        </section>

        {/* 3. 보호자 정보 */}
        <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full"></span> 
            보호자 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">성명</label>
              <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">사용자와의 관계</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-1">
                {GUARDIAN_RELATIONSHIPS.map(rel => (
                   <label key={rel} className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="guardianRelationship" 
                      value={rel} 
                      checked={formData.guardianRelationship === rel} 
                      onChange={handleChange} 
                      className="mr-1.5"
                    /> 
                    {rel}
                  </label>
                ))}
              </div>
               {formData.guardianRelationship === '기타' && (
                  <input type="text" value={otherRelationship} onChange={(e) => setOtherRelationship(e.target.value)} placeholder="기타 관계 입력" className="mt-2 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
                )}
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center"><input type="radio" name="guardianGender" value="남" checked={formData.guardianGender === '남'} onChange={handleChange} className="mr-2" /> 남</label>
                <label className="flex items-center"><input type="radio" name="guardianGender" value="여" checked={formData.guardianGender === '여'} onChange={handleChange} className="mr-2" /> 여</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              <input type="date" name="guardianBirthDate" value={formData.guardianBirthDate} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처 1</label>
              <PhoneInput 
                name="guardianContact1" 
                value={formData.guardianContact1 || ''} 
                onChange={(val) => handlePhoneUpdate('guardianContact1', val)} 
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처 2</label>
              <PhoneInput 
                name="guardianContact2" 
                value={formData.guardianContact2 || ''} 
                onChange={(val) => handlePhoneUpdate('guardianContact2', val)} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <textarea name="guardianNote" value={formData.guardianNote} onChange={handleChange} rows={2} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="자주 가는 장소 등 실종 시 수색에 도움이 될만한 내용 작성"></textarea>
            </div>
          </div>
        </section>

        {/* 4. 행정 서류 (동의서) */}
        <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-orange-500 rounded-full"></span> 
            행정 서류
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전자동의서 업로드</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-white border border-gray-300 rounded-md py-2 px-4 flex items-center gap-2 hover:bg-gray-50 transition shadow-sm">
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">파일 선택</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={handleFileChange}
                  />
                </label>
                {tempFile ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    <FileText size={14} />
                    <span className="truncate max-w-[200px]">{tempFile.name}</span>
                    <button type="button" onClick={() => setTempFile(null)} className="text-blue-400 hover:text-blue-800">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">선택된 파일 없음 (이미지 또는 PDF, 2MB 이하)</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 5. 모니터링 내용 (사용현황) */}
        <section className={`p-6 rounded-lg border-2 ${formData.usageStatus === '미사용중' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
           <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${formData.usageStatus === '미사용중' ? 'text-red-800' : 'text-green-800'}`}>
            <span className={`w-1 h-6 rounded-full ${formData.usageStatus === '미사용중' ? 'bg-red-500' : 'bg-green-500'}`}></span> 
            모니터링 내용 (사용 현황)
          </h3>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">현재 사용 여부</label>
            <div className="flex gap-4">
               <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, usageStatus: '사용중' }))}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold transition flex justify-center items-center gap-2 ${
                  formData.usageStatus === '사용중' 
                    ? 'border-green-500 bg-green-100 text-green-700' 
                    : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border ${formData.usageStatus === '사용중' ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}></div>
                사용중
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, usageStatus: '미사용중' }))}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold transition flex justify-center items-center gap-2 ${
                  formData.usageStatus === '미사용중' 
                    ? 'border-red-500 bg-red-100 text-red-700' 
                    : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border ${formData.usageStatus === '미사용중' ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}></div>
                미사용중
              </button>
            </div>
          </div>

          {formData.usageStatus === '미사용중' && (
            <div className="bg-white p-4 rounded-md border border-red-200 animate-fade-in">
              <h4 className="font-bold text-red-600 mb-4 pb-2 border-b border-red-100">※ 미사용 시 상세 기록 (필수)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">미사용 사유</label>
                   <select name="nonUsageReason" value={formData.nonUsageReason} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none">
                     <option value="">선택하세요</option>
                     {NON_USAGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                   {formData.nonUsageReason === '기타' && (
                      <input 
                        type="text" 
                        value={otherNonUsageReason} 
                        onChange={(e) => setOtherNonUsageReason(e.target.value)} 
                        placeholder="사유를 구체적으로 입력하세요" 
                        className="mt-2 w-full rounded-md border-gray-300 shadow-sm p-2 border bg-red-50 focus:ring-teal-500 focus:border-teal-500 outline-none" 
                      />
                    )}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">대체 수단 사용여부</label>
                   <input type="text" name="nonUsageAlternative" value={formData.nonUsageAlternative} onChange={handleChange} placeholder="없음 또는 사용중인 기기명" className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">대상자 요청사항</label>
                   <input type="text" name="patientRequest" value={formData.patientRequest} onChange={handleChange} placeholder="교육, 성능개선 등 내용 기재" className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">사용 독려 여부</label>
                    <select name="nonUsageEncouragement" value={formData.nonUsageEncouragement} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none">
                     <option value="X">X</option>
                     <option value="O">O</option>
                   </select>
                </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">추후 관리 계획</label>
                   <input type="text" name="nonUsagePlan" value={formData.nonUsagePlan} onChange={handleChange} placeholder="회수 계획, 재방문 교육 등 자유 기재" className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-teal-500 focus:border-teal-500 outline-none" />
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="pt-6 border-t flex justify-end">
          <button
            type="submit"
            className="bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 transition flex items-center gap-3 shadow-lg font-bold text-xl"
          >
            <Save size={24} />
            정보 등록 완료
          </button>
        </div>
      </form>
    </div>
  );
};