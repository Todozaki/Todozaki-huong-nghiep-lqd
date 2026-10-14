export interface AssessmentData {
  gpa: number;
  subjects: {
    math: number | null;
    literature: number | null;
    english: number | null;
    physics?: number | null;
    chemistry?: number | null;
    biology?: number | null;
    history?: number | null;
    geography?: number | null;
    civics?: number | null;
    informatics?: number | null;
  };
  mbti: string; // MBTI type (e.g., 'INTJ', 'ENFP')
  holland: string[]; // Top 3 Holland types (e.g., ['R', 'I', 'A'])
  interests: string[];
  passions: string[];
  strengths: string[];
  weaknesses: string[];
  coreMotivations: string[];
  softSkills: string[];
  preferredRegion: string[];
  preferredFinancial: string[];
  origin?: 'vietnam' | 'international';
  internationalCertificates?: string;
}

export interface CareerResult {
  topCareers: {
    name: string;
    specificRoles?: string[];
    matchPercentage: number;
    description: string;
    reason: string;
    admissionSubjects: string[];
    startingSalary: string;
    salaryRange?: string;
    demandForecast: string;
    marketInsight: string;
    jobWiki: {
      dailyTasks: string[];
      terms: string[];
    };
    universities: {
      top: string[];
      medium: string[];
      safe: string[];
    };
    roadmap: {
      period: string;
      title: string;
      goals: string[];
      hardSkills: string[];
      salary: string;
      milestone: string;
      certifications?: string[];
      branchingPaths?: {
        technical: { title: string; goals: string; salary: string };
        management: { title: string; goals: string; salary: string };
      };
    }[];
  }[];
  contingencyPlans: {
    name: string;
    type: 'niche' | 'vocational';
    description: string;
  }[];
  skillsToDevelop: string[];
  overallSummary: string;
}
