import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { AssessmentData, CareerResult } from "../types";

// In this environment, GEMINI_API_KEY is automatically injected into process.env
const apiKey = process.env.GEMINI_API_KEY || "";

function getDeterministicSeed(data: AssessmentData): number {
  const normalized = JSON.stringify({
    origin: data.origin,
    gpa: data.gpa,
    subjects: data.subjects,
    mbti: data.mbti,
    holland: [...(data.holland || [])].sort(),
    interests: [...(data.interests || [])].sort(),
    passions: [...(data.passions || [])].sort(),
    strengths: [...(data.strengths || [])].sort(),
    weaknesses: [...(data.weaknesses || [])].sort(),
    softSkills: [...(data.softSkills || [])].sort(),
    preferredRegion: [...(data.preferredRegion || [])].sort(),
    preferredFinancial: [...(data.preferredFinancial || [])].sort(),
    coreMotivations: [...(data.coreMotivations || [])].sort(),
    internationalCertificates: data.internationalCertificates?.trim() || ""
  });
  
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}

export async function analyzeCareer(data: AssessmentData): Promise<CareerResult> {
  const seed = getDeterministicSeed(data);
  const cacheKey = `career_cache_${seed}`;

  // Kiểm tra bộ nhớ cache phiên để nếu nhập dữ liệu y chang nhau thì lập tức trả về kết quả đồng nhất 100%
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Bỏ qua lỗi truy cập sessionStorage nếu có
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
Bạn là Chuyên gia Tư vấn Hướng nghiệp. Hãy phân tích hồ sơ học sinh (GPA, MBTI, Holland, sở thích, đam mê, kỹ năng, tài chính) để đưa ra lộ trình nghề nghiệp.

[TRỌNG SỐ]
- Học thuật: 20% | MBTI: 25% | Holland: 25% | Đam mê: 30%

[QUY ĐỊNH]
1. Gợi ý trường: Chia 3 nhóm (Top, Vừa sức, Dự phòng) theo vùng miền và tài chính. Ghi rõ tên trường, ngành và học phí.
2. Lộ trình 10 năm: Viết cho từng ngành trong Top 3. Giai đoạn: 1-2 năm (Mục tiêu cụ thể, kỹ năng cứng, lương), 3-5 năm (Junior/Middle, chứng chỉ, lương), 5-10 năm (2 hướng: Chuyên gia hoặc Quản lý, lương).
3. Ngành (name): Tên nhóm ngành chung.
4. Môi trường: Thực tế, ngắn gọn, súc tích (mô tả dưới 25 từ).
5. Schema: Trả về JSON chuẩn theo schema yêu cầu.
`;

  const prompt = `
Dưới đây là hồ sơ học sinh:
- Đối tượng: ${data.origin === 'international' ? 'Người nước ngoài (quan tâm đến học tập/làm việc tại Việt Nam hoặc quốc tế)' : 'Người Việt Nam'}
${data.origin === 'international' ? `- Chứng chỉ quốc tế & Thành tích: ${data.internationalCertificates}` : `- GPA năm học gần nhất: ${data.gpa}\n- Điểm các môn (Thang điểm 10, -1 là không học): ${JSON.stringify(data.subjects)}`}
- MBTI: ${data.mbti}
- Mã Holland (3 nhóm cao nhất): ${[...(data.holland || [])].sort().join(", ")}
- Sở thích: ${[...(data.interests || [])].sort().join(", ")}
- Đam mê: ${[...(data.passions || [])].sort().join(", ")}
- Ưu điểm: ${[...(data.strengths || [])].sort().join(", ")}
- Nhược điểm: ${[...(data.weaknesses || [])].sort().join(", ")}
- Kỹ năng mềm & Hoạt động ngoại khóa: ${[...(data.softSkills || [])].sort().join(", ")}
- Khu vực mong muốn: ${data.preferredRegion.join(", ") || "Không ưu tiên"}
- Loại hình trường/Tài chính: ${data.preferredFinancial.join(", ") || "Không ưu tiên"}
- Động lực làm việc: ${data.coreMotivations.join(", ")}

Hãy phân tích và trả về kết quả định dạng JSON theo đúng schema yêu cầu.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Nhiệt độ cố định 0.2 theo yêu cầu
        seed: seed, // Seed nhất quán với dữ liệu đầu vào
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topCareers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  specificRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
                  matchPercentage: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  admissionSubjects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  startingSalary: { type: Type.STRING },
                  salaryRange: { type: Type.STRING },
                  demandForecast: { type: Type.STRING },
                  marketInsight: { type: Type.STRING },
                  jobWiki: {
                    type: Type.OBJECT,
                    properties: {
                      dailyTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                      terms: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  },
                  universities: {
                    type: Type.OBJECT,
                    properties: {
                      top: { type: Type.ARRAY, items: { type: Type.STRING } },
                      medium: { type: Type.ARRAY, items: { type: Type.STRING } },
                      safe: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["top", "medium", "safe"]
                  },
                  roadmap: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        period: { type: Type.STRING },
                        title: { type: Type.STRING },
                        goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        salary: { type: Type.STRING },
                        milestone: { type: Type.STRING },
                        certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
                        branchingPaths: {
                          type: Type.OBJECT,
                          properties: {
                            technical: {
                              type: Type.OBJECT,
                              properties: {
                                title: { type: Type.STRING },
                                goals: { type: Type.STRING },
                                salary: { type: Type.STRING }
                              }
                            },
                            management: {
                              type: Type.OBJECT,
                              properties: {
                                title: { type: Type.STRING },
                                goals: { type: Type.STRING },
                                salary: { type: Type.STRING }
                              }
                            }
                          }
                        }
                      },
                      required: ["period", "title", "goals", "hardSkills", "salary", "milestone"]
                    }
                  }
                },
                required: ["name", "matchPercentage", "description", "reason", "admissionSubjects", "startingSalary", "demandForecast", "marketInsight", "jobWiki", "universities", "roadmap"]
              }
            },
            contingencyPlans: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["niche", "vocational"] },
                  description: { type: Type.STRING }
                },
                required: ["name", "type", "description"]
              }
            },
            skillsToDevelop: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallSummary: { type: Type.STRING }
          },
          required: ["topCareers", "contingencyPlans", "skillsToDevelop", "overallSummary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    const parsedResult = JSON.parse(text);

    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(parsedResult));
      } catch {
        // Bỏ qua lỗi lưu cache nếu storage đầy
      }
    }

    return parsedResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export function createCounselorChat(data: AssessmentData, result: CareerResult) {
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `Bạn là chuyên gia tư vấn hướng nghiệp chuyên nghiệp và tận tâm. Hãy trả lời các câu hỏi của học sinh một cách đầy đủ và chi tiết (nhưng vẫn đi thẳng vào vấn đề). Tập trung làm rõ lộ trình nghề nghiệp, ngành học, và các trường đại học phù hợp dựa trên hồ sơ.

Hồ sơ học sinh: ${JSON.stringify(data)}
Kết quả tư vấn: ${JSON.stringify(result)}`;

  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
      temperature: 0.2
    }
  });
}
