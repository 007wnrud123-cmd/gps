import React from 'react';

export interface PatientData {
  id: string;
  sequenceNumber: number; // 연번
  centerName: string; // 보급기관
  
  // 1. 디바이스 기본 정보
  // generation: string; // 세대구분 삭제
  serialNumber: string; // 배회감지기 식별번호 (숫자 7자리)
  deviceStatus: string; // 기기상태
  // applicationType: string; // 신청구분 삭제
  applicationDate: string; // 신청일자
  openingDate: string; // 개통일자
  expirationDate: string; // 만료일자

  // 2. 이용자 정보
  name: string; // 성명
  gender: '남' | '여'; // 성별
  birthDate: string; // 생년월일
  age: number; // 나이 (자동계산 권장되나 입력 가능)
  address: string; // 주소
  detailAddress: string; // 상세주소
  contact: string; // 연락처1
  contact2?: string; // 연락처2
  diagnosis: string; // 진단명 (치매 등) -> 기존 필드 유지 (UI에서 활용)
  missingExperience: string; // 실종경험 유무 (유/무로 변경됨에 따라 UI 로직 변경)
  missingCount: number; // 실종 횟수

  // 3. 보호자 정보
  guardianName: string;
  guardianRelationship: string; // 관계 (배우자, 딸, 아들 등)
  guardianGender: '남' | '여';
  guardianBirthDate: string;
  guardianContact1: string;
  guardianContact2?: string;
  guardianNote?: string; // 비고

  // 4. 행정 서류
  consentFile?: {
    name: string;
    data: string; // Base64 Data URL
  };

  // 5. 모니터링 (사용 현황)
  usageStatus: '사용중' | '미사용중';
  
  // 미사용 시 상세 정보
  nonUsageReason?: string; // 미사용 사유
  nonUsageAlternative?: string; // 대체 수단 사용여부
  patientRequest?: string; // 대상자 요청사항 (기존 지원필요여부)
  nonUsageEncouragement?: string; // 사용 독려 여부 (O/X)
  nonUsagePlan?: string; // 추후 관리 계획
}

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  REGISTER = 'REGISTER',
  LIST = 'LIST'
}

export interface User {
  role: 'ADMIN' | 'CENTER';
  centerName?: string; // Only for CENTER role
  name: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}