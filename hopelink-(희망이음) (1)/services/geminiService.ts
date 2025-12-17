import { GoogleGenAI } from "@google/genai";
import { PatientData } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzePatientData = async (data: PatientData[]): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key가 설정되지 않았습니다. 환경 변수를 확인해주세요.";
  }

  // Sanitize data for prompt to reduce token count and focus on analysis
  const simplifiedData = data.map(p => ({
    center: p.centerName,
    age: p.age,
    gender: p.gender,
    diagnosis: p.diagnosis,
    missing: p.missingExperience // Now a string like "0회", "2회"
  }));

  const prompt = `
    다음은 치매안심센터에서 배급된 배회감지기(GPS) 대상자 데이터입니다.
    데이터 JSON: ${JSON.stringify(simplifiedData)}

    이 데이터를 바탕으로 다음 3가지를 분석해서 한국어로 요약해 주세요:
    1. 전체적인 연령대 및 성별 분포 경향
    2. 실종 경험("0회"가 아닌 경우)이 있는 고위험군의 특징
    3. 치매안심센터 운영 관점에서의 제언 (예: 특정 진단명 환자에 대한 관리 강화 등)
    
    답변은 전문적이고 정중한 어조로, 마크다운 형식으로 작성해주세요.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "분석 결과를 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};