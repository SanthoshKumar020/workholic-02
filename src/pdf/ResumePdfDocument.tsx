import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { getTemplate } from "./templateMeta";

export interface ResumePdfData {
  name: string;
  targetRole?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  enhancedText: string;
  atsScore?: number | null;
  templateId: string;
  withPhoto?: boolean;
  photoDataUrl?: string;
}

// ─── Smart parser ────────────────────────────────────────────────────────────

interface Entry {
  primary: string;   // company / degree / project name
  secondary: string; // job title / field of study
  period: string;    // date range
  location: string;
  bullets: string[];
  grade?: string;
}

interface Section {
  heading: string;
  rawLines: string[];
  entries: Entry[];
  isSkills: boolean;
}

const HEADING_MAP: Record<string, string> = {
  "professional summary": "PROFESSIONAL SUMMARY",
  summary: "PROFESSIONAL SUMMARY",
  objective: "OBJECTIVE",
  profile: "PROFILE",
  "work experience": "WORK EXPERIENCE",
  experience: "WORK EXPERIENCE",
  employment: "WORK EXPERIENCE",
  "professional experience": "WORK EXPERIENCE",
  education: "EDUCATION",
  qualifications: "EDUCATION",
  skills: "SKILLS",
  "technical skills": "SKILLS",
  "key skills": "SKILLS",
  "core competencies": "CORE COMPETENCIES",
  projects: "PROJECTS",
  "personal projects": "PROJECTS",
  certifications: "CERTIFICATIONS",
  certificates: "CERTIFICATIONS",
  achievements: "ACHIEVEMENTS",
  awards: "ACHIEVEMENTS",
  languages: "LANGUAGES",
  "volunteer": "VOLUNTEER",
  "interests": "INTERESTS",
  "hobbies": "INTERESTS",
  "publications": "PUBLICATIONS",
  "references": "REFERENCES",
};

const DATE_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\b\d{4}\s*[-–]\s*(\d{4}|present|current|now)|\bpresent\b/i;

function isBullet(line: string) {
  return /^[•\-\*‣⁃◦•>→]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim());
}

function cleanBullet(line: string) {
  return line.trim().replace(/^[•\-\*‣⁃◦•>→\d]+\.?\s+/, "").trim();
}

function extractPeriod(line: string): string {
  const m = line.match(/\b((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–]\s*((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)\b/i);
  if (m) return m[0];
  const y = line.match(/\b\d{4}\s*[-–]\s*\d{4}\b/);
  if (y) return y[0];
  const s = line.match(/\b\d{4}\b/);
  if (s) return s[0];
  return "";
}

function parseResume(text: string): { contact: string[]; sections: Section[] } {
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  const contact: string[] = [];
  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (inHeader) continue;
      current?.rawLines.push("");
      continue;
    }

    // Detect section headings
    const lower = trimmed.toLowerCase().replace(/:$/, "").trim();
    const mapped = HEADING_MAP[lower];
    if (mapped || (trimmed.length < 45 && trimmed === trimmed.toUpperCase() && /[A-Z]{3}/.test(trimmed) && !/[@.]/.test(trimmed))) {
      inHeader = false;
      if (current) sections.push(current);
      current = { heading: mapped || trimmed.replace(/:$/, ""), rawLines: [], entries: [], isSkills: (mapped || trimmed).toLowerCase().includes("skill") || (mapped || trimmed).toLowerCase().includes("competen") };
      continue;
    }

    // Header area: contact details before first section
    if (inHeader) {
      contact.push(trimmed);
      continue;
    }

    current?.rawLines.push(trimmed);
  }
  if (current) sections.push(current);

  // Parse entries from rawLines for experience/education/projects sections
  for (const sec of sections) {
    const isExp = /experience|employment|work/i.test(sec.heading);
    const isEdu = /education|qualification/i.test(sec.heading);
    const isProj = /project/i.test(sec.heading);
    const isCert = /certif|award|achievement/i.test(sec.heading);
    if (!isExp && !isEdu && !isProj && !isCert) continue;

    let entry: Entry | null = null;
    for (const raw of sec.rawLines) {
      if (!raw) {
        if (entry) { sec.entries.push(entry); entry = null; }
        continue;
      }
      const hasDates = DATE_RE.test(raw);
      const isLikelyTitle = !isBullet(raw) && raw.length < 90;

      if (!entry) {
        entry = { primary: raw, secondary: "", period: extractPeriod(raw), location: "", bullets: [] };
        if (hasDates) entry.primary = raw.replace(DATE_RE, "").replace(/[|\-–,]+\s*$/, "").trim();
      } else if (!entry.secondary && isLikelyTitle && !isBullet(raw) && !hasDates) {
        entry.secondary = raw;
      } else if (hasDates && !entry.period) {
        entry.period = extractPeriod(raw);
        const rest = raw.replace(DATE_RE, "").replace(/[|\-–,]+\s*$/, "").trim();
        if (rest && !entry.secondary) entry.secondary = rest;
        else if (rest) entry.location = rest;
      } else if (isBullet(raw)) {
        entry.bullets.push(cleanBullet(raw));
      } else if (!isBullet(raw) && isLikelyTitle) {
        if (entry.bullets.length === 0 && !entry.secondary) {
          entry.secondary = raw;
        } else {
          entry.bullets.push(raw);
        }
      } else {
        entry.bullets.push(raw);
      }
    }
    if (entry) sec.entries.push(entry);
  }

  return { contact, sections };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const YT = 12; // Y bullet offset
const BULLET_CHAR = "•";

function ContactLine({ items, color, size = 9.5 }: { items: string[]; color: string; size?: number }) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return null;
  return (
    <Text style={{ fontSize: size, color, marginTop: 3, lineHeight: 1.5 }}>
      {filtered.join("   •   ")}
    </Text>
  );
}

function BulletRow({ text, color, size = 9.5 }: { text: string; color: string; size?: number }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 2, paddingLeft: 8 }}>
      <Text style={{ fontSize: size, color, marginRight: 5, marginTop: 0.5 }}>{BULLET_CHAR}</Text>
      <Text style={{ flex: 1, fontSize: size, color, lineHeight: 1.5 }}>{text}</Text>
    </View>
  );
}

// ─── Template: Executive ─────────────────────────────────────────────────────

function ExecutiveTemplate({ data }: { data: ResumePdfData }) {
  const ACCENT = "#1e3a5f";
  const TEXT = "#1f2937";
  const MUTED = "#4b5563";
  const { contact, sections } = parseResume(data.enhancedText);
  const nameLines = contact.slice(0, 1);
  const contactLines = contact.slice(1);

  const s = StyleSheet.create({
    page: { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 50, fontSize: 10, fontFamily: "Helvetica", color: TEXT, lineHeight: 1.45, backgroundColor: "#ffffff" },
    name: { fontSize: 26, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 0.5 },
    role: { fontSize: 12, color: MUTED, marginTop: 2 },
    divider: { borderBottom: `2 solid ${ACCENT}`, marginTop: 6, marginBottom: 14 },
    sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 },
    sectionUnderline: { borderBottom: `1 solid ${ACCENT}`, marginBottom: 7 },
    entryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    entryPrimary: { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT, flex: 1 },
    entrySecondary: { fontSize: 10, color: ACCENT, marginTop: 1, fontFamily: "Helvetica-Bold" },
    entryDate: { fontSize: 9.5, color: MUTED, textAlign: "right" },
    section: { marginBottom: 12 },
    rawLine: { fontSize: 10, color: TEXT, lineHeight: 1.5, marginTop: 2 },
    skillLine: { fontSize: 10, color: TEXT, lineHeight: 1.6 },
  });

  const displayName = data.name || nameLines[0] || "Your Name";
  const contactDisplay = [data.email, data.phone, data.location, data.linkedin].filter(Boolean) as string[];
  if (!contactDisplay.length) contactDisplay.push(...contactLines.slice(0, 4));

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {data.withPhoto && data.photoDataUrl && (
            <Image src={data.photoDataUrl} style={{ width: 80, height: 80, borderRadius: 4, marginRight: 18, objectFit: "cover" }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{displayName}</Text>
            {data.targetRole && <Text style={s.role}>{data.targetRole}</Text>}
            <ContactLine items={contactDisplay} color={MUTED} size={9.5} />
          </View>
        </View>
        <View style={s.divider} />

        {sections.map((sec, si) => (
          <View key={si} style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>{sec.heading}</Text>
            <View style={s.sectionUnderline} />

            {sec.isSkills ? (
              sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.skillLine}>{l}</Text>)
            ) : sec.entries.length > 0 ? (
              sec.entries.map((e, ei) => (
                <View key={ei} style={{ marginBottom: ei < sec.entries.length - 1 ? 8 : 0 }}>
                  <View style={s.entryRow}>
                    <Text style={s.entryPrimary}>{e.primary}</Text>
                    {e.period ? <Text style={s.entryDate}>{e.period}</Text> : null}
                  </View>
                  {e.secondary ? <Text style={s.entrySecondary}>{e.secondary}</Text> : null}
                  {e.location ? <Text style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{e.location}</Text> : null}
                  {e.bullets.map((b, bi) => <BulletRow key={bi} text={b} color={MUTED} size={9.5} />)}
                </View>
              ))
            ) : (
              sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ─── Template: Minimal ───────────────────────────────────────────────────────

function MinimalTemplate({ data }: { data: ResumePdfData }) {
  const DARK = "#111827";
  const MUTED = "#6b7280";
  const LINE = "#e5e7eb";
  const { contact, sections } = parseResume(data.enhancedText);
  const displayName = data.name || contact[0] || "Your Name";
  const contactDisplay = [data.email, data.phone, data.location, data.linkedin].filter(Boolean) as string[];
  if (!contactDisplay.length) contactDisplay.push(...contact.slice(1, 5));

  const s = StyleSheet.create({
    page: { paddingTop: 48, paddingBottom: 40, paddingHorizontal: 52, fontSize: 10, fontFamily: "Helvetica", color: DARK, lineHeight: 1.5, backgroundColor: "#fafafa" },
    name: { fontSize: 28, fontFamily: "Helvetica-Bold", color: DARK, letterSpacing: -0.5 },
    role: { fontSize: 12, color: MUTED, marginTop: 3 },
    divider: { borderBottom: `1 solid ${LINE}`, marginTop: 10, marginBottom: 16 },
    sectionRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
    sectionLabel: { width: 120, fontSize: 9, fontFamily: "Helvetica-Bold", color: MUTED, textTransform: "uppercase", letterSpacing: 1, paddingTop: 2 },
    sectionContent: { flex: 1 },
    entryTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },
    entryMeta: { fontSize: 9.5, color: MUTED, marginTop: 1 },
    rawLine: { fontSize: 10, color: DARK, lineHeight: 1.6, marginTop: 1 },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {data.withPhoto && data.photoDataUrl && (
            <Image src={data.photoDataUrl} style={{ width: 76, height: 76, borderRadius: 38, marginRight: 20, objectFit: "cover" }} />
          )}
          <View>
            <Text style={s.name}>{displayName}</Text>
            {data.targetRole && <Text style={s.role}>{data.targetRole}</Text>}
            <ContactLine items={contactDisplay} color={MUTED} size={9} />
          </View>
        </View>
        <View style={s.divider} />

        {sections.map((sec, si) => (
          <View key={si} style={s.sectionRow} wrap={false}>
            <Text style={s.sectionLabel}>{sec.heading}</Text>
            <View style={s.sectionContent}>
              {sec.isSkills ? (
                sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
              ) : sec.entries.length > 0 ? (
                sec.entries.map((e, ei) => (
                  <View key={ei} style={{ marginBottom: ei < sec.entries.length - 1 ? 10 : 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={s.entryTitle}>{e.primary}</Text>
                      <Text style={s.entryMeta}>{e.period}</Text>
                    </View>
                    {e.secondary ? <Text style={{ fontSize: 10, color: "#374151", marginTop: 1 }}>{e.secondary}</Text> : null}
                    {e.location ? <Text style={s.entryMeta}>{e.location}</Text> : null}
                    {e.bullets.map((b, bi) => <BulletRow key={bi} text={b} color="#4b5563" size={9.5} />)}
                  </View>
                ))
              ) : (
                sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
              )}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ─── Template: Sidebar (shared by Modern + Teal) ─────────────────────────────

function SidebarTemplate({ data, accent }: { data: ResumePdfData; accent: string }) {
  const TEXT = "#1f2937";
  const MUTED = "#374151";
  const SIDEBAR_TEXT = "#e2e8f0";
  const { contact, sections } = parseResume(data.enhancedText);
  const displayName = data.name || contact[0] || "Your Name";
  const contactDisplay = [data.email, data.phone, data.location, data.linkedin, data.portfolio].filter(Boolean) as string[];
  if (!contactDisplay.length) contactDisplay.push(...contact.slice(1, 6));

  // Split sections: short/skill sections go in sidebar, long ones in main
  const sidebarSections = sections.filter((s) => s.isSkills || /language|certif|interest|hobby|award/i.test(s.heading));
  const mainSections = sections.filter((s) => !s.isSkills && !/language|certif|interest|hobby|award/i.test(s.heading));

  const s = StyleSheet.create({
    page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: TEXT, lineHeight: 1.45, flexDirection: "row", backgroundColor: "#ffffff" },
    sidebar: { width: "33%", backgroundColor: accent, padding: 24, minHeight: 842 },
    main: { width: "67%", padding: 32 },
    sidebarName: { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#ffffff", lineHeight: 1.3 },
    sidebarRole: { fontSize: 9.5, color: SIDEBAR_TEXT, marginTop: 3 },
    sidebarContact: { fontSize: 8.5, color: SIDEBAR_TEXT, marginTop: 10, lineHeight: 1.7 },
    sidebarHeading: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 16, marginBottom: 4 },
    sidebarUnderline: { borderBottom: "1 solid rgba(255,255,255,0.3)", marginBottom: 6 },
    sidebarLine: { fontSize: 9, color: SIDEBAR_TEXT, lineHeight: 1.6 },
    mainHeading: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
    mainUnderline: { borderBottom: `1.5 solid ${accent}`, marginBottom: 8 },
    section: { marginBottom: 14 },
    entryPrimary: { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT },
    entrySecondary: { fontSize: 10, color: accent, marginTop: 1 },
    entryDate: { fontSize: 9, color: "#6b7280" },
    rawLine: { fontSize: 10, color: TEXT, lineHeight: 1.5, marginTop: 2 },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Sidebar */}
        <View style={s.sidebar}>
          {data.withPhoto && data.photoDataUrl && (
            <Image src={data.photoDataUrl} style={{ width: 88, height: 88, borderRadius: 44, marginBottom: 14, objectFit: "cover", alignSelf: "center" }} />
          )}
          <Text style={s.sidebarName}>{displayName}</Text>
          {data.targetRole && <Text style={s.sidebarRole}>{data.targetRole}</Text>}

          <Text style={s.sidebarHeading}>Contact</Text>
          <View style={s.sidebarUnderline} />
          {contactDisplay.map((c, ci) => <Text key={ci} style={s.sidebarContact}>{c}</Text>)}

          {sidebarSections.map((sec, si) => (
            <View key={si}>
              <Text style={s.sidebarHeading}>{sec.heading}</Text>
              <View style={s.sidebarUnderline} />
              {sec.rawLines.filter(Boolean).map((l, li) => (
                <Text key={li} style={s.sidebarLine}>{l}</Text>
              ))}
              {sec.entries.map((e, ei) => (
                <View key={ei} style={{ marginBottom: 4 }}>
                  <Text style={[s.sidebarLine, { fontFamily: "Helvetica-Bold", color: "#ffffff" }]}>{e.primary}</Text>
                  {e.secondary ? <Text style={s.sidebarLine}>{e.secondary}</Text> : null}
                  {e.period ? <Text style={[s.sidebarLine, { fontSize: 8 }]}>{e.period}</Text> : null}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Main */}
        <View style={s.main}>
          {mainSections.map((sec, si) => (
            <View key={si} style={s.section} wrap={false}>
              <Text style={s.mainHeading}>{sec.heading}</Text>
              <View style={s.mainUnderline} />
              {sec.entries.length > 0 ? (
                sec.entries.map((e, ei) => (
                  <View key={ei} style={{ marginBottom: ei < sec.entries.length - 1 ? 9 : 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={s.entryPrimary}>{e.primary}</Text>
                      <Text style={s.entryDate}>{e.period}</Text>
                    </View>
                    {e.secondary ? <Text style={s.entrySecondary}>{e.secondary}</Text> : null}
                    {e.location ? <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 1 }}>{e.location}</Text> : null}
                    {e.bullets.map((b, bi) => <BulletRow key={bi} text={b} color="#374151" size={9.5} />)}
                  </View>
                ))
              ) : (
                sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
              )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ─── Template: Corporate ─────────────────────────────────────────────────────

function CorporateTemplate({ data }: { data: ResumePdfData }) {
  const ACCENT = "#9b1c1c";
  const DARK = "#1f2937";
  const MUTED = "#6b7280";
  const { contact, sections } = parseResume(data.enhancedText);
  const displayName = data.name || contact[0] || "Your Name";
  const contactDisplay = [data.email, data.phone, data.location, data.linkedin].filter(Boolean) as string[];
  if (!contactDisplay.length) contactDisplay.push(...contact.slice(1, 5));

  const s = StyleSheet.create({
    page: { paddingTop: 44, paddingBottom: 40, paddingHorizontal: 50, fontSize: 10, fontFamily: "Helvetica", color: DARK, lineHeight: 1.45, backgroundColor: "#fffbfb" },
    name: { fontSize: 26, fontFamily: "Times-Bold", color: DARK, textAlign: "center", letterSpacing: 0.5 },
    role: { fontSize: 12, fontFamily: "Times-Roman", color: ACCENT, textAlign: "center", marginTop: 2 },
    contactRow: { textAlign: "center", marginTop: 4 },
    topLine: { borderBottom: `3 solid ${ACCENT}`, marginTop: 8 },
    bottomLine: { borderBottom: `1 solid ${ACCENT}`, marginTop: 2, marginBottom: 14 },
    sectionTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center", marginBottom: 2 },
    sectionBar: { borderBottom: `1 solid ${ACCENT}`, marginBottom: 8 },
    section: { marginBottom: 14 },
    entryPrimary: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },
    entrySecondary: { fontSize: 10, color: ACCENT },
    entryDate: { fontSize: 9, color: MUTED },
    rawLine: { fontSize: 10, color: DARK, lineHeight: 1.5, marginTop: 2 },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {data.withPhoto && data.photoDataUrl && (
          <Image src={data.photoDataUrl} style={{ width: 80, height: 80, borderRadius: 40, alignSelf: "center", marginBottom: 8, objectFit: "cover" }} />
        )}
        <Text style={s.name}>{displayName}</Text>
        {data.targetRole && <Text style={s.role}>{data.targetRole}</Text>}
        <View style={s.contactRow}>
          <ContactLine items={contactDisplay} color={MUTED} size={9} />
        </View>
        <View style={s.topLine} />
        <View style={s.bottomLine} />

        {sections.map((sec, si) => (
          <View key={si} style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>{sec.heading}</Text>
            <View style={s.sectionBar} />
            {sec.isSkills ? (
              sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
            ) : sec.entries.length > 0 ? (
              sec.entries.map((e, ei) => (
                <View key={ei} style={{ marginBottom: ei < sec.entries.length - 1 ? 9 : 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={s.entryPrimary}>{e.primary}</Text>
                    <Text style={s.entryDate}>{e.period}</Text>
                  </View>
                  {e.secondary ? <Text style={s.entrySecondary}>{e.secondary}</Text> : null}
                  {e.location ? <Text style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{e.location}</Text> : null}
                  {e.bullets.map((b, bi) => <BulletRow key={bi} text={b} color={MUTED} size={9.5} />)}
                </View>
              ))
            ) : (
              sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ─── Template: Impact ────────────────────────────────────────────────────────

function ImpactTemplate({ data }: { data: ResumePdfData }) {
  const ACCENT = "#1d4ed8";
  const TEXT = "#1f2937";
  const MUTED = "#4b5563";
  const { contact, sections } = parseResume(data.enhancedText);
  const displayName = data.name || contact[0] || "Your Name";
  const contactDisplay = [data.email, data.phone, data.location, data.linkedin].filter(Boolean) as string[];
  if (!contactDisplay.length) contactDisplay.push(...contact.slice(1, 5));

  const s = StyleSheet.create({
    page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: TEXT, lineHeight: 1.45, backgroundColor: "#ffffff" },
    banner: { backgroundColor: ACCENT, paddingTop: 28, paddingBottom: 22, paddingHorizontal: 44, flexDirection: "row", alignItems: "center" },
    name: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.3 },
    role: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 3 },
    contactBanner: { fontSize: 9, color: "rgba(255,255,255,0.8)", marginTop: 5 },
    body: { paddingHorizontal: 44, paddingTop: 24, paddingBottom: 36 },
    sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 },
    sectionLine: { borderBottom: `2 solid ${ACCENT}`, marginBottom: 8 },
    section: { marginBottom: 14 },
    entryPrimary: { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT },
    entrySecondary: { fontSize: 10, color: ACCENT },
    entryDate: { fontSize: 9, color: MUTED },
    rawLine: { fontSize: 10, color: TEXT, lineHeight: 1.5, marginTop: 2 },
  });

  const contactStr = contactDisplay.join("   •   ");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Banner header */}
        <View style={s.banner}>
          {data.withPhoto && data.photoDataUrl && (
            <Image src={data.photoDataUrl} style={{ width: 76, height: 76, borderRadius: 4, marginRight: 18, objectFit: "cover" }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{displayName}</Text>
            {data.targetRole && <Text style={s.role}>{data.targetRole}</Text>}
            {contactStr ? <Text style={s.contactBanner}>{contactStr}</Text> : null}
          </View>
        </View>

        <View style={s.body}>
          {sections.map((sec, si) => (
            <View key={si} style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>{sec.heading}</Text>
              <View style={s.sectionLine} />
              {sec.isSkills ? (
                sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
              ) : sec.entries.length > 0 ? (
                sec.entries.map((e, ei) => (
                  <View key={ei} style={{ marginBottom: ei < sec.entries.length - 1 ? 9 : 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={s.entryPrimary}>{e.primary}</Text>
                      <Text style={s.entryDate}>{e.period}</Text>
                    </View>
                    {e.secondary ? <Text style={s.entrySecondary}>{e.secondary}</Text> : null}
                    {e.location ? <Text style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{e.location}</Text> : null}
                    {e.bullets.map((b, bi) => <BulletRow key={bi} text={b} color={MUTED} size={9.5} />)}
                  </View>
                ))
              ) : (
                sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)
              )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ─── Template: Classic ──────────────────────────────────────────────────────

function ClassicTemplate({ data }: { data: ResumePdfData }) {
  const BLACK = "#1a1a1a";
  const { contact, sections } = parseResume(data.enhancedText);
  const displayName = (data.name || contact[0] || "YOUR NAME").toUpperCase();
  const contactDisplay = [data.location, data.email, data.phone, data.linkedin].filter(Boolean) as string[];
  if (!contactDisplay.length) contactDisplay.push(...contact.slice(1, 5));

  const s = StyleSheet.create({
    page: { paddingTop: 24, paddingBottom: 40, paddingHorizontal: 52, fontSize: 10, fontFamily: "Helvetica", color: BLACK, lineHeight: 1.45, backgroundColor: "#ffffff" },
    // Top contact strip between two thin rules
    rule: { borderBottom: "1 solid #1a1a1a" },
    topContact: { fontSize: 9, color: BLACK, textAlign: "center", paddingVertical: 4 },
    // Name block
    name: { fontSize: 30, fontFamily: "Helvetica-Bold", color: BLACK, textAlign: "center", marginTop: 8 },
    role: { fontSize: 11, fontFamily: "Helvetica-Oblique", color: BLACK, textAlign: "center", marginTop: 3 },
    // Double rule separator after name
    dblRule1: { borderBottom: "1 solid #1a1a1a", marginTop: 8 },
    dblRule2: { borderBottom: "1 solid #1a1a1a", marginTop: 2.5, marginBottom: 12 },
    // Section layout
    section: { marginBottom: 12 },
    secHeading: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: BLACK, textAlign: "center", textTransform: "uppercase", letterSpacing: 1.5, paddingBottom: 3 },
    secUnderline: { borderBottom: "1 solid #1a1a1a", marginBottom: 7 },
    // Entry rows
    entryTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 },
    entryTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BLACK, textTransform: "uppercase", flex: 1 },
    entryDate: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BLACK, textAlign: "right" },
    entryCompanyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    entryCompany: { fontSize: 10, fontFamily: "Helvetica-Oblique", color: BLACK, flex: 1 },
    entryLocation: { fontSize: 10, fontFamily: "Helvetica-Oblique", color: BLACK, textAlign: "right" },
    rawLine: { fontSize: 10, color: BLACK, lineHeight: 1.5, marginTop: 2 },
    skillLine: { fontSize: 10, color: BLACK, lineHeight: 1.6 },
  });

  const contactStr = contactDisplay.join("   •   ");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Contact info with single rule below */}
        {contactStr ? <Text style={s.topContact}>{contactStr}</Text> : null}
        <View style={s.rule} />

        {/* Centered name and role */}
        <Text style={s.name}>{displayName}</Text>
        {data.targetRole && <Text style={s.role}>{data.targetRole}</Text>}

        {/* Double rule separator */}
        <View style={s.dblRule1} />
        <View style={s.dblRule2} />

        {sections.map((sec, si) => (
          <View key={si} style={s.section} wrap={false}>
            {/* Section heading: bold centered text with underline only */}
            <Text style={s.secHeading}>{sec.heading}</Text>
            <View style={s.secUnderline} />

            {sec.isSkills ? (
              <View style={{ marginTop: 6 }}>
                {sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.skillLine}>{l}</Text>)}
              </View>
            ) : sec.entries.length > 0 ? (
              sec.entries.map((e, ei) => (
                <View key={ei} style={{ marginBottom: ei < sec.entries.length - 1 ? 10 : 0 }}>
                  {/* Row 1: BOLD UPPERCASE TITLE  |  Date bold right */}
                  <View style={s.entryTitleRow}>
                    <Text style={s.entryTitle}>{e.primary}</Text>
                    {e.period ? <Text style={s.entryDate}>{e.period}</Text> : null}
                  </View>
                  {/* Row 2: Italic company  |  Location italic right */}
                  {(e.secondary || e.location) ? (
                    <View style={s.entryCompanyRow}>
                      <Text style={s.entryCompany}>{e.secondary}</Text>
                      {e.location ? <Text style={s.entryLocation}>{e.location}</Text> : null}
                    </View>
                  ) : null}
                  {e.bullets.map((b, bi) => <BulletRow key={bi} text={b} color={BLACK} size={9.5} />)}
                </View>
              ))
            ) : (
              <View style={{ marginTop: 6 }}>
                {sec.rawLines.filter(Boolean).map((l, li) => <Text key={li} style={s.rawLine}>{l}</Text>)}
              </View>
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ResumePdfDocument(data: ResumePdfData) {
  const { id: tplId } = getTemplate(data.templateId);

  switch (tplId) {
    case "classic":     return <ClassicTemplate data={data} />;
    case "executive":   return <ExecutiveTemplate data={data} />;
    case "minimal":     return <MinimalTemplate data={data} />;
    case "modern":      return <SidebarTemplate data={data} accent="#4338ca" />;
    case "teal":        return <SidebarTemplate data={data} accent="#0d9488" />;
    case "corporate":   return <CorporateTemplate data={data} />;
    case "impact":      return <ImpactTemplate data={data} />;
    default:            return <ClassicTemplate data={data} />;
  }
}
