/**
 * Site-wide UI translations.
 *
 * Scope note: this covers the global chrome (navbar, footer) — visible on
 * every page — plus the Resume Builder / AI Studio, which is the area this
 * pass focused on. The other ~35 tool pages (DSA, interview, mentor, etc.)
 * still render English-only; they can be migrated onto this same
 * `useLanguage()` / `t()` pattern incrementally without touching this file's
 * shape.
 *
 * This is the UI-chrome language (formal English/Tamil labels for buttons and
 * menus). It's a separate concern from the AI chat/voice assistant's ability
 * to understand Tamil, English, or mixed Thanglish *input* — that's handled
 * in the AI system prompts (see src/app/api/resume-edit/route.ts), not here,
 * because nobody expects a "Dashboard" button to be labeled in Thanglish —
 * Thanglish is how people type or speak, not a formal menu-label standard.
 */

export type Locale = "en" | "ta";

export const LOCALES: Locale[] = ["en", "ta"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ta: "தமிழ்",
};

export const translations = {
  en: {
    // Navbar
    nav_dashboard: "Dashboard",
    nav_builder: "Builder",
    nav_tracker: "Tracker",
    nav_dsa: "Learn DSA",
    nav_domains: "Domains",
    nav_roadmaps: "Roadmaps",
    nav_jobs: "Jobs",
    nav_billing: "Billing",
    nav_pricing: "Pricing",
    nav_login: "Log in",
    nav_get_started: "Get started free",
    nav_sign_out: "Sign out",
    nav_language: "Language",

    // Footer
    footer_tagline:
      "AI-powered career platform to help you land your next job faster. Resume enhancement, mock interviews, job matching, and more — free to start.",
    footer_product_by: "A product by",
    footer_section_product: "Product",
    footer_section_resources: "Resources",
    footer_section_account: "Account",
    footer_section_company: "Company",
    footer_section_institutions: "For Institutions",
    footer_section_legal: "Legal",
    footer_link_ats: "Free ATS Checker",
    footer_link_builder: "Resume Builder",
    footer_link_pricing: "Pricing",
    footer_link_jobs: "Job Alerts (Pro)",
    footer_link_blog: "Career Blog",
    footer_link_resume_checker: "Resume Checker by Role",
    footer_link_interview_questions: "Interview Questions by Role",
    footer_link_create_account: "Create account",
    footer_link_login: "Log in",
    footer_link_billing: "Billing",
    footer_link_dashboard: "Dashboard",
    footer_link_about: "About",
    footer_link_contact: "Contact",
    footer_link_refund: "Refund Policy",
    footer_link_affiliate: "Affiliate Disclosure",
    footer_link_for_colleges: "For Colleges",
    footer_link_college_pricing: "College Pricing",
    footer_link_join_college: "Join with a college code",
    footer_link_privacy: "Privacy Policy",
    footer_link_terms: "Terms of Service",
    footer_rights: "All rights reserved.",

    // Resume Builder — mode + shared
    builder_mode_form: "Build from scratch",
    builder_mode_upload: "Upload & enhance",
    builder_free_used: "Free plan: {used} / {limit} resume enhancements used.",
    builder_free_exhausted: "You've used all {limit} free enhancements.",
    builder_upgrade: "Upgrade to Pro",
    builder_enhance_another: "Enhance another resume",
    builder_ats_score: "ATS Score",
    builder_top_improvements: "Top improvements",

    // AI Resume Studio
    studio_title: "AI Resume Studio",
    studio_subtitle:
      "Tell the AI what to change, or paste a job description to tailor this resume for ATS match — everything below reflects your latest edit.",
    studio_undo: "Undo",
    studio_reset: "Reset",
    studio_edits_applied: "{count} edit(s) applied",
    studio_chat_title: "Tell the AI what to change",
    studio_chat_placeholder: "e.g. Add a Certifications section for AWS and Google Cloud",
    studio_send: "Send",
    studio_applying: "Applying…",
    studio_locked_title: "Chat editing & JD tailoring are Pro features",
    studio_locked_body: "Rewrite by prompt and auto-tailor to any job description, unlimited templates, and more.",
    studio_upgrade_cta: "Upgrade to Pro",
    studio_tailor_title: "Tailor to a job description",
    studio_tailor_body:
      "Paste the full job posting — the AI rewrites your summary and bullets to match its language and keywords, without inventing anything you didn't already do.",
    studio_tailor_placeholder: "Paste the job description — responsibilities, requirements, tech stack…",
    studio_tailor_button: "Tailor my resume to this JD",
    studio_tailoring: "Tailoring…",
    studio_jd_locked: "JD tailoring is a Pro feature",
    studio_before: "Before",
    studio_after: "After tailoring",
    studio_matched_keywords: "Matched keywords",
    studio_added_keywords: "Add yourself, if true",
    studio_current_text: "Current resume text",
    studio_template_title: "Choose a template & download",
    studio_template_body: "Pick a template and accent color, then download instantly — this always uses your latest edited version.",
    studio_upgrade_needed_suffix: " to unlock chat editing and job-description tailoring.",
    studio_color_applied: "Done — switched the accent color to {color}. See it in Template & Download below.",

    // Voice assistant
    voice_start: "Speak your instruction",
    voice_listening: "Listening…",
    voice_stop: "Stop",
    voice_heard: "I heard:",
    voice_confirm_prompt: "Say \"yes\" to apply this, or keep talking to add more.",
    voice_confirm_yes: "Yes, apply it",
    voice_confirm_redo: "Try again",
    voice_unsupported: "Voice input isn't supported in this browser — try Chrome or Edge.",
    voice_lang_english: "English",
    voice_lang_tamil: "தமிழ் (Tamil)",
  },
  ta: {
    // Navbar
    nav_dashboard: "டாஷ்போர்டு",
    nav_builder: "ரெசுமே பில்டர்",
    nav_tracker: "ட்ராக்கர்",
    nav_dsa: "DSA கற்போம்",
    nav_domains: "டொமைன்கள்",
    nav_roadmaps: "ரோட்மேப்கள்",
    nav_jobs: "வேலைகள்",
    nav_billing: "பில்லிங்",
    nav_pricing: "விலை",
    nav_login: "உள்நுழைய",
    nav_get_started: "இலவசமாக தொடங்குங்கள்",
    nav_sign_out: "வெளியேறு",
    nav_language: "மொழி",

    // Footer
    footer_tagline:
      "வேலை வேகமாக பெற உதவும் AI அடிப்படையிலான கரியர் பிளாட்பாரம். ரெசுமே மேம்பாடு, மாக் இன்டர்வியூ, ஜாப் மேட்சிங் — இலவசமாக தொடங்கலாம்.",
    footer_product_by: "தயாரிப்பாளர்",
    footer_section_product: "தயாரிப்பு",
    footer_section_resources: "வளங்கள்",
    footer_section_account: "கணக்கு",
    footer_section_company: "நிறுவனம்",
    footer_section_institutions: "கல்வி நிறுவனங்களுக்கு",
    footer_section_legal: "சட்டப்பூர்வ",
    footer_link_ats: "இலவச ATS சரிபார்ப்பு",
    footer_link_builder: "ரெசுமே பில்டர்",
    footer_link_pricing: "விலை",
    footer_link_jobs: "வேலை அறிவிப்புகள் (Pro)",
    footer_link_blog: "கரியர் ப்ளாக்",
    footer_link_resume_checker: "பணி வாரியாக ரெசுமே சோதனை",
    footer_link_interview_questions: "பணி வாரியாக நேர்காணல் கேள்விகள்",
    footer_link_create_account: "கணக்கு உருவாக்கு",
    footer_link_login: "உள்நுழைய",
    footer_link_billing: "பில்லிங்",
    footer_link_dashboard: "டாஷ்போர்டு",
    footer_link_about: "எங்களை பற்றி",
    footer_link_contact: "தொடர்பு",
    footer_link_refund: "பணத்திரும்ப கொள்கை",
    footer_link_affiliate: "இணை வெளிப்படுத்தல்",
    footer_link_for_colleges: "கல்லூரிகளுக்கு",
    footer_link_college_pricing: "கல்லூரி விலை",
    footer_link_join_college: "கல்லூரி குறியீட்டுடன் இணையுங்கள்",
    footer_link_privacy: "தனியுரிமைக் கொள்கை",
    footer_link_terms: "சேவை விதிமுறைகள்",
    footer_rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",

    // Resume Builder — mode + shared
    builder_mode_form: "புதிதாக உருவாக்கு",
    builder_mode_upload: "பதிவேற்றி மேம்படுத்து",
    builder_free_used: "இலவச திட்டம்: {limit}-இல் {used} ரெசுமே மேம்பாடுகள் பயன்படுத்தப்பட்டன.",
    builder_free_exhausted: "உங்கள் {limit} இலவச மேம்பாடுகளை பயன்படுத்திவிட்டீர்கள்.",
    builder_upgrade: "Pro-க்கு மேம்படுத்து",
    builder_enhance_another: "மற்றொரு ரெசுமேவை மேம்படுத்து",
    builder_ats_score: "ATS மதிப்பெண்",
    builder_top_improvements: "முக்கிய மேம்பாடுகள்",

    // AI Resume Studio
    studio_title: "AI ரெசுமே ஸ்டுடியோ",
    studio_subtitle:
      "என்ன மாற்ற வேண்டும் என்று AI-இடம் சொல்லுங்கள், அல்லது ATS பொருத்தத்திற்காக ஒரு வேலை விளக்கத்தை ஒட்டுங்கள் — கீழே உள்ளவை உங்கள் சமீபத்திய திருத்தத்தை காட்டும்.",
    studio_undo: "செயல்தவிர்",
    studio_reset: "மீட்டமை",
    studio_edits_applied: "{count} திருத்தங்கள் செய்யப்பட்டன",
    studio_chat_title: "என்ன மாற்ற வேண்டும் என்று சொல்லுங்கள்",
    studio_chat_placeholder: "எ.கா. AWS மற்றும் Google Cloud-க்கான Certifications பிரிவை சேர்க்கவும்",
    studio_send: "அனுப்பு",
    studio_applying: "செயல்படுத்துகிறது…",
    studio_locked_title: "சாட் திருத்தமும் JD பொருத்தமும் Pro அம்சங்கள்",
    studio_locked_body: "பிராம்ப்ட் மூலம் மீண்டும் எழுதவும், எந்த வேலை விளக்கத்திற்கும் தானாக பொருத்தவும், வரம்பற்ற டெம்ப்ளேட்டுகள் மற்றும் மேலும்.",
    studio_upgrade_cta: "Pro-க்கு மேம்படுத்து",
    studio_tailor_title: "வேலை விளக்கத்திற்கு ஏற்ப மாற்று",
    studio_tailor_body:
      "முழு வேலை விளக்கத்தையும் ஒட்டவும் — AI உங்கள் சுருக்கத்தையும் புள்ளிகளையும் அதன் மொழி மற்றும் முக்கிய வார்த்தைகளுக்கு ஏற்ப மீண்டும் எழுதும், நீங்கள் செய்யாததை கண்டுபிடிக்காமல்.",
    studio_tailor_placeholder: "வேலை விளக்கத்தை ஒட்டவும் — பொறுப்புகள், தேவைகள், டெக் ஸ்டேக்…",
    studio_tailor_button: "இந்த JD-க்கு ஏற்ப என் ரெசுமேவை மாற்று",
    studio_tailoring: "மாற்றுகிறது…",
    studio_jd_locked: "JD பொருத்தம் ஒரு Pro அம்சம்",
    studio_before: "முன்பு",
    studio_after: "மாற்றியபின்",
    studio_matched_keywords: "பொருந்திய முக்கிய வார்த்தைகள்",
    studio_added_keywords: "உண்மையானால் நீங்களே சேர்க்கவும்",
    studio_current_text: "தற்போதைய ரெசுமே உரை",
    studio_template_title: "டெம்ப்ளேட் தேர்ந்தெடுத்து பதிவிறக்கு",
    studio_template_body: "ஒரு டெம்ப்ளேட்டும் நிற தேர்வையும் தேர்ந்தெடுத்து உடனே பதிவிறக்கவும் — இது எப்போதும் உங்கள் சமீபத்திய திருத்தப்பட்ட பதிப்பையே பயன்படுத்தும்.",
    studio_upgrade_needed_suffix: " — சாட் திருத்தமும் JD பொருத்தமும் பயன்படுத்த.",
    studio_color_applied: "முடிந்தது — accent நிறத்தை {color}-ஆக மாற்றியாயிற்று. கீழே டெம்ப்ளேட் & பதிவிறக்கத்தில் பாருங்கள்.",

    // Voice assistant
    voice_start: "உங்கள் அறிவுறுத்தலை பேசுங்கள்",
    voice_listening: "கேட்கிறேன்…",
    voice_stop: "நிறுத்து",
    voice_heard: "நான் கேட்டது:",
    voice_confirm_prompt: "இதை செயல்படுத்த \"யெஸ்\" என்று சொல்லுங்கள், அல்லது மேலும் சேர்க்க பேசுங்கள்.",
    voice_confirm_yes: "ஆம், செயல்படுத்து",
    voice_confirm_redo: "மீண்டும் முயற்சி",
    voice_unsupported: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை — Chrome அல்லது Edge முயற்சிக்கவும்.",
    voice_lang_english: "English",
    voice_lang_tamil: "தமிழ்",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

/** Simple {placeholder} interpolation — no i18n library needed for this scope. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}
