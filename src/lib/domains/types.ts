// Shared types for the Domains learning feature.

export interface DiagramSpec {
  title?: string;
  /** Nodes in flow order (the renderer draws them as a top-to-bottom pipeline). */
  nodes: { id: string; label: string }[];
  edges: { from: string; to: string; label?: string }[];
}

export interface ChartSpec {
  title?: string;
  unit?: string;
  data: { label: string; value: number }[];
}

export interface DomainQuizQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** The AI-generated, gamified lesson for one topic (mode-aware). */
export interface DomainLesson {
  analogy: string;
  concept: string;
  keyPoints: string[];
  steps: string[];
  diagram?: DiagramSpec | null;
  chart?: ChartSpec | null;
  realWorld: string;
  interviewTips?: string[];
  quiz: DomainQuizQ[];
}
