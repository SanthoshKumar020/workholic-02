/**
 * Role catalog powering programmatic SEO pages:
 *   /resume-checker/[role]      → "ATS Resume Checker for {Role}"
 *   /interview-questions/[role] → "Mock Interview Questions for {Role}"
 *
 * One template × every role here = hundreds of indexed, role-specific pages.
 * Keep `skills`/`tools` accurate — they drive the (non-thin) page content,
 * the ATS keyword lists, and the generated interview questions.
 */

export interface SeoRole {
  slug: string;
  name: string;
  category: string;
  /** Hard skills / ATS keywords a recruiter scans for. */
  skills: string[];
  /** Tools & technologies commonly required. */
  tools: string[];
  /** One-sentence description of what the role does. */
  blurb: string;
}

export const SEO_ROLES: SeoRole[] = [
  // ── Software Engineering ──────────────────────────────────────────────────
  { slug: "software-engineer", name: "Software Engineer", category: "Engineering",
    skills: ["Data structures", "Algorithms", "System design", "OOP", "REST APIs", "Unit testing", "Git"],
    tools: ["Java", "Python", "JavaScript", "Docker", "AWS", "PostgreSQL"],
    blurb: "Designs, builds, and maintains software systems across the stack." },
  { slug: "frontend-developer", name: "Frontend Developer", category: "Engineering",
    skills: ["HTML", "CSS", "JavaScript", "Responsive design", "Accessibility", "State management", "Web performance"],
    tools: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vite", "Figma"],
    blurb: "Builds the user-facing parts of web applications." },
  { slug: "backend-developer", name: "Backend Developer", category: "Engineering",
    skills: ["API design", "Databases", "Authentication", "Caching", "Microservices", "Message queues"],
    tools: ["Node.js", "Python", "Go", "PostgreSQL", "Redis", "Docker"],
    blurb: "Builds server-side logic, APIs, and data layers." },
  { slug: "full-stack-developer", name: "Full Stack Developer", category: "Engineering",
    skills: ["Frontend", "Backend", "Databases", "REST APIs", "CI/CD", "System design"],
    tools: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"],
    blurb: "Works across both frontend and backend of an application." },
  { slug: "react-developer", name: "React Developer", category: "Engineering",
    skills: ["React", "Hooks", "State management", "Component design", "Web performance", "Testing"],
    tools: ["React", "Redux", "Next.js", "TypeScript", "Jest", "Tailwind CSS"],
    blurb: "Specialises in building UIs with React and its ecosystem." },
  { slug: "python-developer", name: "Python Developer", category: "Engineering",
    skills: ["Python", "OOP", "REST APIs", "Testing", "Async programming", "Data structures"],
    tools: ["Django", "FastAPI", "Flask", "PostgreSQL", "Celery", "Docker"],
    blurb: "Builds applications and services primarily in Python." },
  { slug: "java-developer", name: "Java Developer", category: "Engineering",
    skills: ["Java", "Spring", "OOP", "Multithreading", "JVM internals", "REST APIs", "Microservices"],
    tools: ["Spring Boot", "Hibernate", "Maven", "Kafka", "PostgreSQL", "Docker"],
    blurb: "Builds enterprise-grade backend systems in Java." },
  { slug: "mobile-developer", name: "Mobile Developer", category: "Engineering",
    skills: ["Mobile UI", "State management", "Offline storage", "Push notifications", "App lifecycle"],
    tools: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase"],
    blurb: "Builds native or cross-platform mobile applications." },
  { slug: "devops-engineer", name: "DevOps Engineer", category: "Engineering",
    skills: ["CI/CD", "Infrastructure as Code", "Monitoring", "Containerisation", "Cloud architecture", "Scripting"],
    tools: ["Docker", "Kubernetes", "Terraform", "AWS", "Jenkins", "Prometheus"],
    blurb: "Automates build, deployment, and infrastructure operations." },
  { slug: "cloud-engineer", name: "Cloud Engineer", category: "Engineering",
    skills: ["Cloud architecture", "Networking", "Security", "Cost optimisation", "Infrastructure as Code"],
    tools: ["AWS", "Azure", "GCP", "Terraform", "Kubernetes", "CloudFormation"],
    blurb: "Designs and manages cloud infrastructure and services." },
  { slug: "qa-engineer", name: "QA Engineer", category: "Engineering",
    skills: ["Test planning", "Automation testing", "Regression testing", "Bug tracking", "API testing"],
    tools: ["Selenium", "Cypress", "Postman", "JIRA", "TestNG"],
    blurb: "Ensures software quality through manual and automated testing." },
  { slug: "cybersecurity-analyst", name: "Cybersecurity Analyst", category: "Engineering",
    skills: ["Threat detection", "Incident response", "Vulnerability assessment", "SIEM", "Network security"],
    tools: ["Wireshark", "Splunk", "Nmap", "Burp Suite", "Metasploit"],
    blurb: "Protects systems and networks from security threats." },

  // ── Data & AI ─────────────────────────────────────────────────────────────
  { slug: "data-analyst", name: "Data Analyst", category: "Data & Analytics",
    skills: ["SQL", "Data visualisation", "Statistics", "Excel", "Dashboarding", "A/B testing", "Storytelling with data"],
    tools: ["SQL", "Power BI", "Tableau", "Excel", "Python", "Looker"],
    blurb: "Turns raw data into insights that drive business decisions." },
  { slug: "data-scientist", name: "Data Scientist", category: "Data & Analytics",
    skills: ["Machine learning", "Statistics", "Feature engineering", "Model evaluation", "Experiment design", "SQL"],
    tools: ["Python", "pandas", "scikit-learn", "TensorFlow", "SQL", "Jupyter"],
    blurb: "Builds predictive models and extracts insight from data." },
  { slug: "data-engineer", name: "Data Engineer", category: "Data & Analytics",
    skills: ["ETL", "Data pipelines", "Data modelling", "SQL", "Distributed systems", "Streaming"],
    tools: ["Spark", "Airflow", "Kafka", "Snowflake", "dbt", "AWS"],
    blurb: "Builds and maintains pipelines that move and shape data." },
  { slug: "machine-learning-engineer", name: "Machine Learning Engineer", category: "Data & Analytics",
    skills: ["ML algorithms", "Model deployment", "MLOps", "Feature engineering", "Deep learning", "Python"],
    tools: ["PyTorch", "TensorFlow", "scikit-learn", "MLflow", "Docker", "Kubernetes"],
    blurb: "Productionises machine learning models at scale." },
  { slug: "business-analyst", name: "Business Analyst", category: "Data & Analytics",
    skills: ["Requirements gathering", "Process mapping", "Stakeholder management", "SQL", "Data analysis", "Documentation"],
    tools: ["Excel", "SQL", "Power BI", "JIRA", "Visio"],
    blurb: "Bridges business needs and technical solutions." },

  // ── Product & Design ────────────────────────────────────────────────────
  { slug: "product-manager", name: "Product Manager", category: "Product & Design",
    skills: ["Product strategy", "Roadmapping", "User research", "Prioritisation", "Stakeholder management", "Metrics & KPIs"],
    tools: ["JIRA", "Figma", "Amplitude", "Notion", "SQL"],
    blurb: "Owns the strategy, roadmap, and delivery of a product." },
  { slug: "project-manager", name: "Project Manager", category: "Product & Design",
    skills: ["Project planning", "Risk management", "Stakeholder communication", "Budgeting", "Agile", "Scheduling"],
    tools: ["JIRA", "MS Project", "Asana", "Confluence", "Excel"],
    blurb: "Plans, executes, and delivers projects on time and budget." },
  { slug: "ui-ux-designer", name: "UI/UX Designer", category: "Product & Design",
    skills: ["User research", "Wireframing", "Prototyping", "Interaction design", "Usability testing", "Design systems"],
    tools: ["Figma", "Sketch", "Adobe XD", "Framer", "Miro"],
    blurb: "Designs intuitive, user-centred product experiences." },
  { slug: "product-designer", name: "Product Designer", category: "Product & Design",
    skills: ["Visual design", "Interaction design", "Prototyping", "Design systems", "User research"],
    tools: ["Figma", "Sketch", "Framer", "Adobe Creative Suite"],
    blurb: "Owns the end-to-end design of product features." },
  { slug: "graphic-designer", name: "Graphic Designer", category: "Product & Design",
    skills: ["Typography", "Branding", "Layout", "Colour theory", "Visual hierarchy"],
    tools: ["Photoshop", "Illustrator", "InDesign", "Figma", "Canva"],
    blurb: "Creates visual content for brands and campaigns." },

  // ── Marketing & Content ───────────────────────────────────────────────────
  { slug: "digital-marketing-manager", name: "Digital Marketing Manager", category: "Marketing",
    skills: ["Campaign strategy", "SEO", "Paid ads", "Analytics", "Content marketing", "Conversion optimisation"],
    tools: ["Google Analytics", "Google Ads", "Meta Ads", "HubSpot", "SEMrush"],
    blurb: "Leads digital campaigns across channels to drive growth." },
  { slug: "seo-specialist", name: "SEO Specialist", category: "Marketing",
    skills: ["Keyword research", "On-page SEO", "Link building", "Technical SEO", "Content strategy", "Analytics"],
    tools: ["Google Search Console", "Ahrefs", "SEMrush", "Screaming Frog", "GA4"],
    blurb: "Improves organic search rankings and traffic." },
  { slug: "content-writer", name: "Content Writer", category: "Marketing",
    skills: ["Writing", "Editing", "SEO writing", "Research", "Storytelling", "Content strategy"],
    tools: ["Google Docs", "Grammarly", "WordPress", "Surfer SEO", "Notion"],
    blurb: "Creates written content that informs and converts." },

  // ── Sales & Customer ─────────────────────────────────────────────────────
  { slug: "sales-executive", name: "Sales Executive", category: "Sales & Customer",
    skills: ["Lead generation", "Negotiation", "CRM management", "Cold outreach", "Closing", "Pipeline management"],
    tools: ["Salesforce", "HubSpot", "LinkedIn Sales Navigator", "Outreach"],
    blurb: "Generates revenue by closing new business." },
  { slug: "account-manager", name: "Account Manager", category: "Sales & Customer",
    skills: ["Relationship management", "Upselling", "Negotiation", "Account planning", "Renewals"],
    tools: ["Salesforce", "HubSpot", "Gainsight", "Excel"],
    blurb: "Owns and grows relationships with existing clients." },
  { slug: "customer-success-manager", name: "Customer Success Manager", category: "Sales & Customer",
    skills: ["Onboarding", "Retention", "Relationship management", "Product adoption", "Churn reduction"],
    tools: ["Gainsight", "Intercom", "Salesforce", "Zendesk"],
    blurb: "Ensures customers achieve value and renew." },

  // ── Business & Operations ─────────────────────────────────────────────────
  { slug: "hr-manager", name: "HR Manager", category: "Business & Operations",
    skills: ["Talent management", "Employee relations", "Performance management", "HR policy", "Compensation"],
    tools: ["Workday", "BambooHR", "Excel", "Greenhouse"],
    blurb: "Leads people operations and HR strategy." },
  { slug: "recruiter", name: "Recruiter", category: "Business & Operations",
    skills: ["Sourcing", "Screening", "Interviewing", "Stakeholder management", "Employer branding", "ATS management"],
    tools: ["LinkedIn Recruiter", "Greenhouse", "Lever", "Naukri"],
    blurb: "Finds, screens, and hires talent for the organisation." },
  { slug: "finance-analyst", name: "Finance Analyst", category: "Business & Operations",
    skills: ["Financial modelling", "Forecasting", "Budgeting", "Variance analysis", "Excel", "Valuation"],
    tools: ["Excel", "SQL", "Power BI", "SAP", "Tableau"],
    blurb: "Analyses financial data to guide business decisions." },
  { slug: "accountant", name: "Accountant", category: "Business & Operations",
    skills: ["Bookkeeping", "Financial reporting", "Taxation", "Reconciliation", "GAAP", "Auditing"],
    tools: ["Tally", "QuickBooks", "SAP", "Excel", "Zoho Books"],
    blurb: "Maintains and reports on financial records." },
  { slug: "operations-manager", name: "Operations Manager", category: "Business & Operations",
    skills: ["Process optimisation", "Team leadership", "Supply chain", "KPI tracking", "Vendor management"],
    tools: ["Excel", "SAP", "Power BI", "JIRA"],
    blurb: "Oversees day-to-day operations and efficiency." },
];

export function getSeoRole(slug: string): SeoRole | undefined {
  return SEO_ROLES.find((r) => r.slug === slug);
}

export function roleCategories(): string[] {
  return Array.from(new Set(SEO_ROLES.map((r) => r.category)));
}
