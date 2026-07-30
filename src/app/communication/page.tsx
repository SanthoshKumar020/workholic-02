import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { CommunicationClient } from "@/components/CommunicationClient";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { ProGate } from "@/components/ui/ProGate";

export const metadata = { title: "Communication Coach — HYRISE" };

export default async function CommunicationPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/communication");

  if (profile.plan !== "pro") {
    return (
      <>
        <Navbar />
        <PageShell width="form">
          <ProGate
            headingLevel="h1"
            title="Communication Coach"
            iconTone="amber"
            blurb="Get AI feedback on your workplace communication — emails, messages, presentations. Pro feature."
          />
        </PageShell>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageShell
        width="narrow"
        title="Communication Coach"
        description="Analyze and improve your professional communication — emails, slack messages, presentations."
      >
        <CommunicationClient />
      </PageShell>
      <Footer />
    </>
  );
}
