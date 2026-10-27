import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/PracticeSession";
import { getSection, SECTION_IDS, type SectionId } from "@/lib/sections";

export function generateStaticParams() {
  return [...SECTION_IDS, "mixed"].map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps<"/practice/[section]">): Promise<Metadata> {
  const { section } = await params;
  const s = getSection(section);
  return { title: `${s ? `${s.id} · ${s.title}` : "Mixed test"} · Chem Unit Practice` };
}

export default async function PracticePage({ params }: PageProps<"/practice/[section]">) {
  const { section } = await params;
  if (section !== "mixed" && !getSection(section)) notFound();
  return <PracticeSession sectionId={section as SectionId | "mixed"} />;
}
