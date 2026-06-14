export type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard";
export type Category = "FAANG" | "Indian Product" | "IT Services";

export interface ProcessStep {
  step: number;
  name: string;
  type: "screening" | "dsa" | "system_design" | "behavioral" | "hr" | "mixed";
  duration: string;
  focus: string;
  what: string;
}

export interface CompanyData {
  id: string;
  name: string;
  emoji: string;
  category: Category;
  difficulty: Difficulty;
  avgRounds: number;
  avgSalary: string;
  tagline: string;
  hiringFor: string[];
  prepWeeks: string;
  interviewProcess: ProcessStep[];
  values: string[];
  culture: string;
  tips: string[];
}

export const COMPANIES: CompanyData[] = [
  {
    id: "google",
    name: "Google",
    emoji: "🔍",
    category: "FAANG",
    difficulty: "Very Hard",
    avgRounds: 6,
    avgSalary: "₹40–80L (India) · $200–400k (US, total comp)",
    tagline: "Emphasises algorithms, scale, and 'Googleyness' culture fit",
    hiringFor: ["SDE I/II/III", "L4/L5/L6", "Data Engineer", "ML Engineer", "SRE"],
    prepWeeks: "12–16 weeks",
    interviewProcess: [
      { step: 1, name: "Resume Screening", type: "screening", duration: "1–2 weeks", focus: "ATS + HR review", what: "Resume checked for top-tier schools, companies, projects. Strong LeetCode activity helps." },
      { step: 2, name: "Online Assessment", type: "dsa", duration: "90 min", focus: "2–3 LeetCode problems", what: "Medium–Hard problems. Auto-graded. Needs full passing test cases, not just partial." },
      { step: 3, name: "Phone Screen", type: "dsa", duration: "45 min", focus: "1–2 coding problems", what: "With a Googler. Medium difficulty. Explain thought process as you code." },
      { step: 4, name: "Onsite — Coding ×2", type: "dsa", duration: "45 min each", focus: "Data Structures & Algorithms", what: "Hard LeetCode problems. Interviewers care about approach, communication, and edge cases." },
      { step: 5, name: "Onsite — System Design", type: "system_design", duration: "45 min", focus: "Distributed systems", what: "Design at Google scale. Discuss trade-offs, capacity estimation, storage, APIs." },
      { step: 6, name: "Onsite — Googleyness + Leadership", type: "behavioral", duration: "45 min", focus: "Culture & leadership", what: "Behavioral stories assessing collaboration, ambiguity, bias to action, user focus." },
    ],
    values: ["Googleyness (comfort with ambiguity)", "Data-driven decisions", "Scale thinking", "Psychological safety", "User obsession"],
    culture: "Flat hierarchy, high autonomy, 20% time culture, data-driven. 'Fail fast' is accepted but learning from failure is critical.",
    tips: [
      "Practice 200+ LeetCode problems — 60% medium, 30% hard",
      "Prepare 5+ STAR stories mapped to Googleyness behaviours",
      "For system design, always start with requirements — 'clarify, then design'",
      "The interviewer is a collaborator, not an adversary — talk through your thinking",
      "Code quality matters: clean variable names, test your code mentally",
    ],
  },

  {
    id: "amazon",
    name: "Amazon",
    emoji: "📦",
    category: "FAANG",
    difficulty: "Hard",
    avgRounds: 6,
    avgSalary: "₹35–70L (India) · $160–350k (US, total comp)",
    tagline: "Every question maps to a Leadership Principle — prepare LP stories first",
    hiringFor: ["SDE I/II/III", "Data Engineer", "Product Manager", "Applied Scientist"],
    prepWeeks: "8–12 weeks",
    interviewProcess: [
      { step: 1, name: "Online Assessment", type: "dsa", duration: "105 min", focus: "2 coding + work simulation", what: "2 LeetCode-style problems (Medium) + situational judgment questions. No partial credit." },
      { step: 2, name: "Phone Screen", type: "mixed", duration: "60 min", focus: "Coding + 1–2 LP questions", what: "Medium DSA problem + behavioral questions aligned to Leadership Principles." },
      { step: 3, name: "Loop — Coding ×2", type: "dsa", duration: "55 min each", focus: "DSA problems", what: "Each interviewer asks 1 coding problem + 1–2 LP stories. Medium-Hard difficulty." },
      { step: 4, name: "Loop — System Design", type: "system_design", duration: "55 min", focus: "Distributed system design", what: "Design Amazon-scale systems. Emphasise operational excellence and customer obsession." },
      { step: 5, name: "Loop — Bar Raiser", type: "behavioral", duration: "55 min", focus: "Leadership Principles deep-dive", what: "Independent interviewer. Heavy LP questioning. Ensures hire raises the bar." },
      { step: 6, name: "Loop — Hiring Manager", type: "hr", duration: "55 min", focus: "Role fit + LP", what: "Team-specific technical + LP questions. Final validation." },
    ],
    values: ["Customer Obsession", "Ownership", "Invent & Simplify", "Are Right A Lot", "Earn Trust", "Dive Deep", "Deliver Results", "Bias for Action"],
    culture: "High ownership, fast-paced, data-driven. PIP culture is real — high performers thrive, low performance managed out quickly.",
    tips: [
      "Prepare 2–3 STAR stories for each of the 16 Leadership Principles before interviews",
      "Every answer should open with 'At [Company], I faced...' — specifics matter",
      "Bar Raiser interviews are intentionally harder — expect curveballs",
      "Amazon coding uses CoderPad — practice coding without auto-complete",
      "For system design, always discuss monitoring/operational excellence at the end",
    ],
  },

  {
    id: "microsoft",
    name: "Microsoft",
    emoji: "🪟",
    category: "FAANG",
    difficulty: "Hard",
    avgRounds: 5,
    avgSalary: "₹30–65L (India) · $150–320k (US, total comp)",
    tagline: "Growth mindset + solid fundamentals — more collaborative tone than Google/Amazon",
    hiringFor: ["SDE I/II/Senior", "PM", "Data Scientist", "DevOps Engineer", "Cloud Architect"],
    prepWeeks: "8–10 weeks",
    interviewProcess: [
      { step: 1, name: "Recruiter Screen", type: "hr", duration: "30 min", focus: "Background + motivation", what: "Conversational — recruiter checks role fit, visa, salary expectations, and timeline." },
      { step: 2, name: "Phone Screen", type: "dsa", duration: "60 min", focus: "1–2 coding problems", what: "LeetCode Medium level. Engineers prefer candidates who think aloud." },
      { step: 3, name: "Onsite — Coding ×2", type: "dsa", duration: "60 min each", focus: "Algorithms + OOP", what: "2–3 problems per round. OOP design questions are common alongside DSA." },
      { step: 4, name: "Onsite — System Design", type: "system_design", duration: "60 min", focus: "Design + architecture", what: "Less strict than Google — they value trade-off discussion over perfect answers." },
      { step: 5, name: "As Appropriate (AA)", type: "behavioral", duration: "60 min", focus: "Culture + leadership", what: "Final round with a senior leader. Focused on growth mindset and leadership stories." },
    ],
    values: ["Growth Mindset", "Customer focus", "Diversity & inclusion", "One Microsoft (collaboration)", "Accountability"],
    culture: "Satya Nadella reformed the culture from 'know-it-all' to 'learn-it-all'. Collaborative, less cutthroat than Amazon. Work-life balance better than most FAANG.",
    tips: [
      "Microsoft loves candidates who say 'I don't know, but here's how I'd figure it out'",
      "Prepare OOP design questions (design a parking lot, library, etc.)",
      "For 'As Appropriate' round, prepare growth mindset stories with concrete learning",
      "Show genuine enthusiasm for Microsoft products/Azure/M365 ecosystem",
      "Coding is done on whiteboard or virtual — practice explaining without running code",
    ],
  },

  {
    id: "meta",
    name: "Meta",
    emoji: "🔵",
    category: "FAANG",
    difficulty: "Very Hard",
    avgRounds: 6,
    avgSalary: "₹45–90L (India) · $200–450k (US, total comp)",
    tagline: "Move fast, think product + data, harder DSA than Google",
    hiringFor: ["SWE E3/E4/E5/E6", "ML Engineer", "Research Engineer", "Data Engineer", "PM"],
    prepWeeks: "12–16 weeks",
    interviewProcess: [
      { step: 1, name: "Recruiter Screen", type: "hr", duration: "30 min", focus: "Background + timeline", what: "Role fit discussion, TC expectations, timeline alignment." },
      { step: 2, name: "Technical Phone Screen", type: "dsa", duration: "45 min", focus: "1–2 coding problems", what: "Hard difficulty. Often graph/tree problems. Meta is known for hardest phone screens." },
      { step: 3, name: "Onsite — Coding ×2", type: "dsa", duration: "45 min each", focus: "Hard algorithms", what: "Facebook-style hard problems. Dynamic programming, graphs, backtracking common." },
      { step: 4, name: "Onsite — System Design", type: "system_design", duration: "45 min", focus: "Product system design", what: "Design social graph features, news feed, messaging at billion-user scale." },
      { step: 5, name: "Onsite — Behavioral", type: "behavioral", duration: "45 min", focus: "Leadership + impact", what: "Meta's values: Move Fast, Be Direct, Focus on Long-term Impact." },
      { step: 6, name: "Onsite — Product Sense", type: "mixed", duration: "45 min", focus: "Product thinking (PM-level)", what: "For SWE: tradeoff discussions, product metrics, A/B testing mindset." },
    ],
    values: ["Move Fast", "Be Direct", "Impact at Scale", "Build Social Value", "Focus on Long-term"],
    culture: "High performance, direct feedback culture. Generous RSU vesting. Performance-reviewed bi-annually — low performers managed out.",
    tips: [
      "Meta asks the hardest coding questions — aim for LeetCode Hard fluency",
      "System design must account for billions of users — think about sharding, CDN, caching",
      "Use the STAR format but be direct — Meta culture is low-fluff, high-signal",
      "Study FB-specific system design: News Feed, Instagram Stories, WhatsApp",
      "Meta values impact metrics — quantify everything in behavioral stories",
    ],
  },

  {
    id: "flipkart",
    name: "Flipkart",
    emoji: "🛒",
    category: "Indian Product",
    difficulty: "Hard",
    avgRounds: 5,
    avgSalary: "₹25–60L",
    tagline: "India's top product company — strong DSA bar, ownership culture",
    hiringFor: ["SDE I/II/III", "Product Manager", "Data Scientist", "DevOps", "ML Engineer"],
    prepWeeks: "8–10 weeks",
    interviewProcess: [
      { step: 1, name: "Online Assessment", type: "dsa", duration: "90 min", focus: "2–3 DSA problems", what: "Hosted on HackerRank. Medium difficulty. Basic SQL sometimes included." },
      { step: 2, name: "Tech Round 1 — DSA", type: "dsa", duration: "60 min", focus: "Algorithms + DS", what: "2 coding problems. Trees, graphs, DP are common. Clean code expected." },
      { step: 3, name: "Tech Round 2 — DSA + Design", type: "mixed", duration: "60 min", focus: "Advanced DSA + LLD", what: "1 hard DSA + Low Level Design (class design, design patterns)." },
      { step: 4, name: "System Design", type: "system_design", duration: "60 min", focus: "HLD + architecture", what: "Design Flipkart-scale systems: search, order management, real-time tracking." },
      { step: 5, name: "Hiring Manager + Culture Fit", type: "hr", duration: "45 min", focus: "Ownership, team fit", what: "Behavioral assessment + role clarity. Emphasise ownership and impact." },
    ],
    values: ["Customer obsession", "Ownership", "Speed", "Data-driven", "Bias for Action"],
    culture: "Startup energy within a large company. High ownership expected. Bengaluru-centric. Competitive salaries with ESOPs.",
    tips: [
      "LLD (Low Level Design) is a Flipkart speciality — practice design patterns",
      "Solve 100+ LeetCode problems, focus on Trees, Graphs, DP",
      "System design should reflect e-commerce at scale — think Flipkart's own products",
      "Emphasis on writing production-quality code, not just working code",
      "Research Flipkart's tech blog and the problems they've publicly solved",
    ],
  },

  {
    id: "swiggy",
    name: "Swiggy",
    emoji: "🍕",
    category: "Indian Product",
    difficulty: "Medium",
    avgRounds: 4,
    avgSalary: "₹20–50L",
    tagline: "Practical problems, logistics tech, real-world system design",
    hiringFor: ["SDE I/II", "Backend Engineer", "Data Engineer", "ML Engineer", "Product Manager"],
    prepWeeks: "6–8 weeks",
    interviewProcess: [
      { step: 1, name: "Online Test", type: "dsa", duration: "60 min", focus: "2 coding problems", what: "Easy–Medium LeetCode problems + MCQs on CS fundamentals." },
      { step: 2, name: "Tech Round 1 — Fundamentals", type: "dsa", duration: "60 min", focus: "DSA + language fundamentals", what: "Core DSA + Java/Python/Go fundamentals. Practical problem solving." },
      { step: 3, name: "Tech Round 2 — Design", type: "system_design", duration: "60 min", focus: "System design", what: "Design delivery, restaurant, or logistics-related systems. Practical focus." },
      { step: 4, name: "HR + Culture Fit", type: "hr", duration: "45 min", focus: "Values, motivation", what: "Why Swiggy, career goals, salary negotiation, team fit." },
    ],
    values: ["Customer-first", "Move fast", "Ownership", "Collaboration", "Hunger (growth mindset)"],
    culture: "Startup energy with scale. Growing engineering org. Focus on real-world logistics and food-tech problems. ESOP culture.",
    tips: [
      "Prepare logistics and delivery system design (order routing, location tracking, ETA prediction)",
      "Swiggy uses a practical lens — connect your solutions to real food-delivery problems",
      "Focus on Medium LeetCode problems — Hard rarely appear",
      "Show interest in Swiggy Instamart, Genie, and their newer product lines",
      "Behavioral round: emphasise ownership and bias for action stories",
    ],
  },

  {
    id: "razorpay",
    name: "Razorpay",
    emoji: "💳",
    category: "Indian Product",
    difficulty: "Hard",
    avgRounds: 4,
    avgSalary: "₹22–55L",
    tagline: "Fintech precision — strong backend focus, reliability engineering",
    hiringFor: ["SDE I/II", "Backend Engineer", "Platform Engineer", "Data Engineer", "Security Engineer"],
    prepWeeks: "8–10 weeks",
    interviewProcess: [
      { step: 1, name: "Resume + Online Test", type: "dsa", duration: "60 min", focus: "Coding + aptitude", what: "DSA problems + financial/logical aptitude. Basic understanding of payments helps." },
      { step: 2, name: "Tech Round 1 — Backend", type: "dsa", duration: "60 min", focus: "Backend + DSA", what: "Backend fundamentals (REST APIs, databases, concurrency) + 1–2 DSA problems." },
      { step: 3, name: "Tech Round 2 — System Design", type: "system_design", duration: "60 min", focus: "Payment system design", what: "Design payment gateway, settlement systems, idempotency. Reliability is paramount." },
      { step: 4, name: "Culture + HR", type: "hr", duration: "45 min", focus: "Mission alignment", what: "Why fintech, values alignment, compensation discussion." },
    ],
    values: ["Reliability", "Customer trust", "Innovation in payments", "Ownership", "Data integrity"],
    culture: "Mission-driven fintech culture. Engineers deeply understand the financial domain. High reliability bar — '5 nines' uptime mindset.",
    tips: [
      "Learn payment concepts: PG, PA, settlement, idempotency, webhooks",
      "System design must handle money — talk about ACID properties and consistency",
      "Razorpay uses Go and Python heavily — brush up on your preferred backend language",
      "Idempotency is a Razorpay favourite topic in system design",
      "Show understanding of PCI-DSS, security, and fraud prevention",
    ],
  },

  {
    id: "cred",
    name: "CRED",
    emoji: "🏆",
    category: "Indian Product",
    difficulty: "Hard",
    avgRounds: 4,
    avgSalary: "₹25–60L",
    tagline: "Premium fintech, high engineering bar, small and selective team",
    hiringFor: ["SDE I/II/III", "Backend Engineer", "iOS/Android", "Data Engineer"],
    prepWeeks: "8–10 weeks",
    interviewProcess: [
      { step: 1, name: "Technical Screen", type: "dsa", duration: "60 min", focus: "DSA + problem solving", what: "High-quality DSA. CRED is selective — expect Medium-Hard problems in round 1." },
      { step: 2, name: "Deep Technical Round", type: "mixed", duration: "90 min", focus: "DSA + System Design", what: "Thorough technical assessment. Both algorithms and system design in one session." },
      { step: 3, name: "Engineering Leadership", type: "behavioral", duration: "60 min", focus: "Ownership + decision making", what: "Past experience deep-dive, engineering decisions, trade-offs." },
      { step: 4, name: "Founders/Hiring Manager", type: "hr", duration: "45 min", focus: "Vision alignment", what: "Senior leadership round — culture fit and long-term thinking." },
    ],
    values: ["Excellence", "Ownership", "First-principles thinking", "Trust", "Premium experience"],
    culture: "Very selective (Netflix-like culture). Top 1% engineers. Premium benefits. Flat structure, high autonomy. Focuses on quality over speed.",
    tips: [
      "CRED is extremely selective — prepare at FAANG level",
      "First-principles thinking is valued — don't just give textbook answers",
      "Prepare to deep-dive into ANY technology decision you've made in the past",
      "Research CRED's products: credit card management, rewards, rent payment",
      "Show leadership in every story — CRED wants engineers who own outcomes",
    ],
  },

  {
    id: "tcs",
    name: "TCS",
    emoji: "🏢",
    category: "IT Services",
    difficulty: "Easy",
    avgRounds: 3,
    avgSalary: "₹3.5–7L (fresher) · ₹8–18L (experienced)",
    tagline: "Fresher-friendly: aptitude, basic coding, communication, and HR",
    hiringFor: ["Associate System Engineer", "System Engineer", "Developer", "Analyst"],
    prepWeeks: "4–6 weeks",
    interviewProcess: [
      { step: 1, name: "TCS NQT (National Qualifier Test)", type: "dsa", duration: "3 hours", focus: "Aptitude + coding + verbal", what: "Quantitative, logical, verbal reasoning + 2 basic coding problems. NQT score determines further rounds." },
      { step: 2, name: "Technical Interview", type: "mixed", duration: "30–45 min", focus: "CS fundamentals", what: "OOPS concepts, DBMS, OS basics, any 1 programming language, your projects." },
      { step: 3, name: "HR Interview", type: "hr", duration: "30 min", focus: "Communication + culture", what: "Tell me about yourself, strengths/weaknesses, salary expectations, relocation willingness." },
    ],
    values: ["Integrity", "Respect", "Excellence", "Customer centricity", "Sustainability"],
    culture: "Large, process-oriented, stable. Training programs for freshers (ILP). Growth is gradual but steady. Work-life balance generally good.",
    tips: [
      "NQT is the gate — practice quantitative aptitude and verbal reasoning extensively",
      "Know OOPS thoroughly: polymorphism, inheritance, encapsulation, abstraction",
      "Prepare a 3-minute 'tell me about yourself' that flows naturally",
      "Know your college project inside-out — they will ask deep questions",
      "Be clear about relocation and flexibility — TCS deploys across India",
    ],
  },

  {
    id: "infosys",
    name: "Infosys",
    emoji: "🔷",
    category: "IT Services",
    difficulty: "Easy",
    avgRounds: 3,
    avgSalary: "₹3.6–7L (fresher) · ₹8–20L (experienced)",
    tagline: "INFS test for freshers; experienced lateral focuses on domain expertise",
    hiringFor: ["Systems Engineer", "Digital Specialist Engineer", "Power Programmer", "Technology Analyst"],
    prepWeeks: "4–6 weeks",
    interviewProcess: [
      { step: 1, name: "Infosys InfyTQ / Online Test", type: "dsa", duration: "3 hours", focus: "Aptitude + coding + verbal + pseudo-code", what: "Quantitative, logical, verbal + coding in preferred language. Pseudo-code proficiency tested." },
      { step: 2, name: "Technical Interview", type: "dsa", duration: "30–45 min", focus: "Programming + basics", what: "C, Java, or Python basics, DBMS SQL queries, OOPS, your projects. 1–2 simple coding problems." },
      { step: 3, name: "HR Interview", type: "hr", duration: "20–30 min", focus: "Communication + attitude", what: "Personality, communication skills, service orientation, salary, location." },
    ],
    values: ["Client value", "Leadership by example", "Integrity", "Fairness", "Excellence"],
    culture: "Strong training culture (Mysore campus training). Pyramid structure. Varied project opportunities. Growing digital transformation practice.",
    tips: [
      "Infosys has 3 tracks: Systems Engineer (₹3.6L), Digital Specialist (₹4.5L), Power Programmer (₹8L)",
      "Prepare SQL queries thoroughly — they are almost always asked",
      "Power Programmer track needs strong DSA — prepare at a higher level",
      "InfyTQ platform practice is the best prep — use it extensively",
      "Be enthusiastic about learning new technologies — Infosys values adaptability",
    ],
  },

  {
    id: "wipro",
    name: "Wipro",
    emoji: "🟡",
    category: "IT Services",
    difficulty: "Easy",
    avgRounds: 3,
    avgSalary: "₹3.5–6.5L (fresher) · ₹8–18L (experienced)",
    tagline: "National Written Test + technical basics + HR — fresher-focused",
    hiringFor: ["Project Engineer", "Senior Project Engineer", "Technical Lead", "Analyst"],
    prepWeeks: "3–5 weeks",
    interviewProcess: [
      { step: 1, name: "Wipro NLTH / Talent Next", type: "dsa", duration: "2 hours", focus: "Aptitude + coding + essay", what: "Verbal, analytical, quantitative + 2 basic coding problems + written communication test." },
      { step: 2, name: "Technical Interview", type: "mixed", duration: "30–45 min", focus: "CS basics + project", what: "Programming language basics, OOPS, DBMS, your final year project. Basic pseudocode." },
      { step: 3, name: "HR Interview", type: "hr", duration: "20 min", focus: "Communication", what: "Introduction, strengths, weaknesses, team work examples, location preference." },
    ],
    values: ["Spirit of Wipro", "Client-centricity", "Leadership", "Integrity", "Being Respectful"],
    culture: "Services-first culture. Large training batches for freshers. Good learning opportunities in emerging tech (AI/ML, cloud). Global project exposure.",
    tips: [
      "Written communication (essay) is a differentiator — practice business writing",
      "Know the basics of cloud (AWS/Azure/GCP) — Wipro is big on cloud",
      "Research Wipro's industry verticals: BFSI, healthcare, manufacturing",
      "Dress formally for HR round — Wipro values professional presentation",
      "Ask about their WILP (Work Integrated Learning Program) if you want to upskill",
    ],
  },

  {
    id: "accenture",
    name: "Accenture",
    emoji: "🔺",
    category: "IT Services",
    difficulty: "Medium",
    avgRounds: 4,
    avgSalary: "₹4.5–8L (fresher) · ₹10–25L (experienced)",
    tagline: "Consulting + tech blend — communication and analytical thinking matter as much as coding",
    hiringFor: ["Associate", "Analyst", "Consultant", "Senior Consultant", "Technology Analyst"],
    prepWeeks: "5–7 weeks",
    interviewProcess: [
      { step: 1, name: "Cognitive + Technical Assessment", type: "dsa", duration: "2.5 hours", focus: "Aptitude + coding + attention to detail", what: "Cognitive ability test, coding assessment (Easy-Medium), attention to detail, abstract reasoning." },
      { step: 2, name: "Communication Assessment", type: "hr", duration: "30 min", focus: "English + articulation", what: "AMCAT-style spoken English test. Reading comprehension and verbal communication scored." },
      { step: 3, name: "Technical Interview", type: "mixed", duration: "45 min", focus: "CS fundamentals + cloud", what: "OOPS, DBMS, networking basics, any cloud knowledge. Project deep-dive." },
      { step: 4, name: "HR Interview", type: "hr", duration: "30 min", focus: "Consulting mindset", what: "Analytical thinking, client-facing situations, team scenarios, career goals." },
    ],
    values: ["Innovation", "Ethics", "Diversity", "Stewardship", "Client value creation"],
    culture: "Consulting-first mindset. Global exposure. 'Build your career' approach — varied rotation. Business casual. Strong L&D programs.",
    tips: [
      "Communication is as important as technical — prepare to speak clearly and confidently",
      "Learn one cloud platform basics (AWS/Azure) — Accenture is Microsoft Azure partner",
      "Research Accenture's service lines: Strategy, Consulting, Technology, Operations, Song",
      "Prepare for client scenario questions: 'A client wants X, how would you approach it?'",
      "Industry knowledge helps — pick 2-3 verticals (retail, BFSI, healthcare) and understand them",
    ],
  },

  {
    id: "cognizant",
    name: "Cognizant",
    emoji: "🔷",
    category: "IT Services",
    difficulty: "Easy",
    avgRounds: 3,
    avgSalary: "₹3.5–6L (fresher) · ₹8–20L (experienced)",
    tagline: "AMCAT-based fresher hiring; strong in BFSI and healthcare IT services",
    hiringFor: ["Programmer Analyst Trainee", "Programmer Analyst", "Associate", "Technology Lead", "Digital Associate"],
    prepWeeks: "3–5 weeks",
    interviewProcess: [
      { step: 1, name: "AMCAT / Cognizant Elevate Test", type: "dsa", duration: "2.5 hours", focus: "Aptitude + coding + verbal", what: "Quantitative aptitude, logical reasoning, verbal English + 2 basic coding problems in C/Java/Python. Score determines shortlisting." },
      { step: 2, name: "Technical Interview", type: "mixed", duration: "30–45 min", focus: "CS fundamentals + project", what: "OOPS, DBMS basics, basic SQL queries, networking fundamentals, 1 simple coding problem, your final year project." },
      { step: 3, name: "HR Interview", type: "hr", duration: "20–30 min", focus: "Communication + attitude", what: "Tell me about yourself, strengths/weaknesses, handling pressure, team experience, location preference, salary expectations." },
    ],
    values: ["Integrity", "Respect", "Excellence", "Community", "Inclusion"],
    culture: "Large, structured, process-oriented. Strong BFSI (banking/finance) and healthcare client base. Fresher-friendly with training programs. Global delivery model.",
    tips: [
      "AMCAT is the real gate — use AMCAT prep platforms (Aspiring Minds) for practice",
      "Know SQL queries thoroughly: SELECT, JOIN, GROUP BY, subqueries",
      "Prepare OOPS concepts deeply: polymorphism, abstraction, encapsulation, inheritance",
      "Cognizant's GenC and GenC Next tracks — GenC Next offers ₹5L, research eligibility",
      "During HR, emphasise flexibility, team orientation, and willingness to learn new technologies",
    ],
  },

  {
    id: "capgemini",
    name: "Capgemini",
    emoji: "🌊",
    category: "IT Services",
    difficulty: "Easy",
    avgRounds: 4,
    avgSalary: "₹3.8–7L (fresher) · ₹9–22L (experienced)",
    tagline: "Game-based assessment + Pseudocode test — unique format requires specific preparation",
    hiringFor: ["Analyst", "Senior Analyst", "Consultant", "Technology Analyst", "Cloud Engineer"],
    prepWeeks: "4–6 weeks",
    interviewProcess: [
      { step: 1, name: "Pseudo Code Test (PPT)", type: "dsa", duration: "75 min", focus: "Pseudocode + aptitude + English", what: "Unique to Capgemini: trace output of pseudocode programs + quantitative aptitude + English verbal section. No actual coding needed." },
      { step: 2, name: "Game-Based Assessment", type: "screening", duration: "45 min", focus: "Cognitive + personality", what: "Behavioural + cognitive games measuring problem solving, attention, adaptability. No prep possible — just be yourself." },
      { step: 3, name: "Technical Interview", type: "mixed", duration: "45 min", focus: "CS fundamentals + project", what: "OOPS, DBMS, OS basics, cloud basics (AWS/Azure fundamentals), your academic project in detail." },
      { step: 4, name: "HR Interview", type: "hr", duration: "20–30 min", focus: "Values + communication", what: "Communication skills, motivation for Capgemini, willingness to relocate, 7 core values alignment." },
    ],
    values: ["Honesty", "Boldness", "Trust", "Freedom", "Team Spirit", "Modesty", "Fun"],
    culture: "French MNC with a collaborative, fun culture. 7 core values taken seriously. Strong learning culture (Capgemini University). Growing cloud and digital transformation practice.",
    tips: [
      "The Pseudocode test is unique — practice tracing C-like pseudocode output online (mock PPTs available)",
      "Do NOT cram for game-based assessment — it tests personality; just stay calm and focused",
      "Capgemini loves AWS and Azure basics — get a free AWS Cloud Practitioner overview",
      "Know Capgemini's 7 core values — interviewers ask which values you relate to most",
      "For experienced hires, specialize in cloud migration, SAP, or Salesforce — Capgemini's key practices",
    ],
  },
];

export function getCompany(id: string): CompanyData | undefined {
  return COMPANIES.find((c) => c.id === id);
}

export function getByCategory(cat: Category): CompanyData[] {
  return COMPANIES.filter((c) => c.category === cat);
}

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  "Easy":      "bg-green-100 text-green-700 border-green-200",
  "Medium":    "bg-blue-100 text-blue-700 border-blue-200",
  "Hard":      "bg-amber-100 text-amber-700 border-amber-200",
  "Very Hard": "bg-red-100 text-red-700 border-red-200",
};

export const STEP_TYPE_COLOR: Record<ProcessStep["type"], string> = {
  screening:     "bg-slate-100 text-slate-600",
  dsa:           "bg-blue-100 text-blue-700",
  system_design: "bg-purple-100 text-purple-700",
  behavioral:    "bg-amber-100 text-amber-700",
  hr:            "bg-green-100 text-green-700",
  mixed:         "bg-rose-100 text-rose-700",
};
