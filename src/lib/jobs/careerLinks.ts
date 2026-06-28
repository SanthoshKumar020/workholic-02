/**
 * Resolve a job to the company's OFFICIAL careers/jobs page — never an
 * aggregator (LinkedIn / Naukri / Indeed / Glassdoor etc.).
 *
 * Job listings are AI-generated for real, well-known companies, so for those
 * we map straight to their careers domain. For anything not in the map we fall
 * back to a careers-scoped web search so the user still lands on the company's
 * own hiring site rather than a job board.
 */

// company-name substring (lowercase) → official careers URL
const CAREER_SITES: [string, string][] = [
  ["google", "https://careers.google.com/jobs/results/"],
  ["amazon", "https://www.amazon.jobs/en/search"],
  ["microsoft", "https://careers.microsoft.com/v2/global/en/search"],
  ["meta", "https://www.metacareers.com/jobs"],
  ["facebook", "https://www.metacareers.com/jobs"],
  ["apple", "https://jobs.apple.com/en-us/search"],
  ["netflix", "https://jobs.netflix.com/search"],
  ["nvidia", "https://www.nvidia.com/en-us/about-nvidia/careers/"],
  ["intel", "https://jobs.intel.com/en/search-jobs"],
  ["ibm", "https://www.ibm.com/careers/search"],
  ["oracle", "https://careers.oracle.com/jobs/"],
  ["sap", "https://jobs.sap.com/search/"],
  ["adobe", "https://careers.adobe.com/us/en/search-results"],
  ["salesforce", "https://careers.salesforce.com/en/jobs/"],
  ["samsung", "https://www.samsung.com/in/about-us/careers/"],
  ["goldman", "https://www.goldmansachs.com/careers/"],
  ["jpmorgan", "https://careers.jpmorgan.com/global/en/students/programs"],
  ["morgan stanley", "https://www.morganstanley.com/careers"],
  ["walmart", "https://careers.walmart.com/"],
  ["uber", "https://www.uber.com/us/en/careers/list/"],
  // India-focused
  ["flipkart", "https://www.flipkartcareers.com/"],
  ["infosys", "https://career.infosys.com/joblist"],
  ["tata consultancy", "https://www.tcs.com/careers"],
  ["tcs", "https://www.tcs.com/careers"],
  ["wipro", "https://careers.wipro.com/careers-home/jobs"],
  ["accenture", "https://www.accenture.com/in-en/careers/jobsearch"],
  ["deloitte", "https://apply.deloitte.com/careers"],
  ["cognizant", "https://careers.cognizant.com/global-en/jobs/"],
  ["capgemini", "https://www.capgemini.com/jobs/"],
  ["hcltech", "https://www.hcltech.com/careers"],
  ["hcl", "https://www.hcltech.com/careers"],
  ["tech mahindra", "https://careers.techmahindra.com/"],
  ["ltimindtree", "https://www.ltimindtree.com/careers/"],
  ["mphasis", "https://careers.mphasis.com/"],
  ["swiggy", "https://careers.swiggy.com/"],
  ["zomato", "https://www.zomato.com/careers"],
  ["razorpay", "https://razorpay.com/jobs/"],
  ["cred", "https://careers.cred.club/"],
  ["meesho", "https://www.meesho.io/jobs"],
  ["phonepe", "https://www.phonepe.com/careers/"],
  ["paytm", "https://paytm.com/careers"],
  ["ola", "https://www.olacabs.com/careers"],
  ["myntra", "https://careers.myntra.com/"],
  ["freshworks", "https://www.freshworks.com/company/careers/"],
  ["zoho", "https://www.zoho.com/careers/"],
  ["byju", "https://byjus.com/careers/"],
  ["nykaa", "https://www.nykaa.com/careers"],
  ["zerodha", "https://zerodha.com/careers/"],
  ["groww", "https://groww.in/careers"],
  ["dream11", "https://www.dreamsports.group/careers/"],
];

/** Aggregators we must never link to. */
const BANNED = /linkedin|naukri|indeed|glassdoor|monster|shine\.com|foundit|simplyhired|ziprecruiter|timesjobs/i;

export interface CareerLink {
  url: string;
  /** Human label for the button, e.g. "Amazon Careers" or "Company careers". */
  label: string;
}

/** Careers-scoped web search fallback (lands on the company's own hiring site). */
function careerSearchFallback(company: string, title: string): string {
  const q = `${company} careers ${title} apply`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

/**
 * Resolve the best official careers link for a job.
 * @param llmUrl optional URL suggested by the model — used only if it's a real
 *   https career page and not a banned aggregator.
 */
export function careerLink(company: string, title: string, llmUrl?: string): CareerLink {
  const key = (company || "").toLowerCase().trim();

  // 1. Curated official careers site for well-known companies.
  for (const [name, url] of CAREER_SITES) {
    if (key.includes(name)) {
      return { url, label: `${company.trim()} Careers` };
    }
  }

  // 2. A model-provided URL, only if it's a valid https page and not an aggregator.
  if (llmUrl && /^https?:\/\//i.test(llmUrl) && !BANNED.test(llmUrl)) {
    return { url: llmUrl, label: `${company.trim()} Careers` };
  }

  // 3. Fallback: careers-scoped search on the company's own site.
  return { url: careerSearchFallback(company, title), label: "Company careers" };
}
