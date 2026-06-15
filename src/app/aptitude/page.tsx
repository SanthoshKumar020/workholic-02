import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AptitudeHubClient } from "@/components/AptitudeHubClient";
import { APTITUDE_CATEGORIES } from "@/lib/aptitude-topics";

export const metadata = {
  title: "Aptitude Prep — HYRISE",
  description: "Master aptitude, speed maths tricks, and logical reasoning with AI-powered lessons and quizzes.",
};

export default function AptitudePage() {
  const totalTopics = APTITUDE_CATEGORIES.reduce((s, c) => s + c.topics.length, 0);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            ⚡ Free · {totalTopics} topics · AI-powered lessons & quizzes
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">Aptitude Mastery</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            From speed maths tricks to probability — every topic explained so simply even a 5-year-old gets it,
            then built up to exam level. Click any topic to start learning.
          </p>
        </div>

        <AptitudeHubClient categories={APTITUDE_CATEGORIES} />
      </main>
      <Footer />
    </>
  );
}
