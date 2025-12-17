// services/firebaseConfig.ts

// [사용 가이드]
// 1. https://console.firebase.google.com/ 접속 -> 프로젝트 생성
// 2. 프로젝트 설정(톱니바퀴) -> 내 앱 -> 웹 앱(</>) 추가
// 3. SDK 설정 및 구성에 나오는 값들을 아래 따옴표("") 안에 복사해서 붙여넣으세요.
// 4. 왼쪽 메뉴 [빌드] -> [Firestore Database] -> [데이터베이스 만들기] -> [테스트 모드에서 시작] 선택 필수!

export const firebaseConfig = {
  apiKey: "AIzaSyDv1LmxGR28I6l_wNx7ANaKkUJpRCQH174",
  authDomain: "gps-registration.firebaseapp.com",
  projectId: "gps-registration",
  storageBucket: "gps-registration.firebasestorage.app",
  messagingSenderId: "762496528656",
  appId: "1:762496528656:web:c198462d2ca51c7fee7595"
};

// 키 값이 입력되었는지 확인하는 함수
export const isFirebaseConfigured = () => {
  // apiKey가 비어있지 않고, "AIza"로 시작하는 올바른 키인지 대략적으로 확인
  return firebaseConfig.apiKey !== "" && firebaseConfig.projectId !== "";
};