// Shared domain types used across client and server.

export type Plan = "free" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  plan: Plan;
  preferred_language: string;
  target_role: string | null;
  stripe_customer_id: string | null;
  xp: number;
  streak: number;
  last_active: string | null;
  created_at: string;
  dsa_mode: "kid" | "beginner" | "interview" | null;
  // Public profile fields
  full_name: string | null;
  username: string | null;
  public_bio: string | null;
  is_public: boolean | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  completed_certs: unknown[] | null;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  target_role: string | null;
  original_text: string | null;
  enhanced_text: string | null;
  ats_score: number | null;
  template_id: string;
  created_at: string;
}

export interface JobAlert {
  id: string;
  user_id: string;
  email: string | null;
  keywords: string | null;
  role: string | null;
  frequency: "daily" | "weekly";
  enabled: boolean;
  created_at: string;
}

// --- Learning Roadmap ---

export interface RoadmapStep {
  title: string;
  description: string;
  skills: string[];
  youtubeQuery: string;
  freeCourseQuery: string;
  paidCourseQuery: string;
  done: boolean;
}

export interface RoadmapContent {
  topic: string;
  summary: string;
  estimatedWeeks: number;
  steps: RoadmapStep[];
  lang?: string;
  langLabel?: string;
}

export interface RoadmapRow {
  id: string;
  user_id: string;
  topic: string;
  content: RoadmapContent;
  created_at: string;
  updated_at: string;
}

// --- AI result shapes ---

export interface EnhanceResult {
  atsScore?: number;
  enhancedResume?: string;
  improvements?: string[];
  tips?: string[];
}

export interface JobResult {
  title: string;
  company?: string;
  location?: string;
  type?: string;
  url?: string;
  postedAt?: string;
  description?: string;
}

export interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tips: string[];
}

// --- Interview ---

export interface InterviewQuestion {
  id: string;
  text: string;
  type: "behavioral" | "technical";
}

export interface InterviewFeedback {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  modelAnswerHint: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  role: string;
  questions: InterviewQuestion[];
  answers: Array<{ questionId: string; answer: string; feedback: InterviewFeedback }>;
  overall_score: number | null;
  created_at: string;
}

// --- English Learning ---

export interface EnglishLesson {
  title: string;
  content: string;
  examples: string[];
  keyPoints: string[];
}

export interface EnglishQuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface EnglishProgress {
  id: string;
  user_id: string;
  level: string;
  completed: { lessons: string[]; quizzes: string[]; totalXp: number };
  created_at: string;
  updated_at: string;
}

// --- Career Chat ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// --- Videos ---

export interface VideoResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  url: string;
}

// --- Communication ---

export interface CommunicationResult {
  score: number;
  clarity: number;
  conciseness: number;
  tone: string;
  fillerWords: string[];
  grammarIssues: string[];
  improvedVersion: string;
}
