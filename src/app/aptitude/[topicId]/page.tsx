import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AptitudeLessonClient } from "@/components/AptitudeLessonClient";
import { findTopic, DIFFICULTY_COLOR, DIFFICULTY_LABEL } from "@/lib/aptitude-topics";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Props {
  params: { topicId: string };
}

export async function generateMetadata({ params }: Props) {
  const topic = findTopic(params.topicId);
  return {
    title: topic ? `${topic.title} — Aptitude Prep` : "Aptitude Prep",
  };
}

export default function AptitudeTopicPage({ params }: Props) {
  const topic = findTopic(params.topicId);
  if (!topic) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-slate-400">
          <Link href="/aptitude" className="hover:text-brand-600 transition">Aptitude</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-500">{topic.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-700">{topic.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-3xl shadow-sm border border-amber-100">
            {topic.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400">{topic.categoryIcon} {topic.category}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${DIFFICULTY_COLOR[topic.difficulty]}`}>
                {DIFFICULTY_LABEL[topic.difficulty]}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{topic.title}</h1>
          </div>
        </div>

        <AptitudeLessonClient topicId={params.topicId} topicTitle={topic.title} />
      </main>
      <Footer />
    </>
  );
}
