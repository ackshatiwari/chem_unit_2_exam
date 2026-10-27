import type { Metadata } from "next";
import { PolyatomicPractice } from "@/components/PolyatomicPractice";

export const metadata: Metadata = {
  title: "Polyatomic Practices · Chem Unit Practice",
};

export default function PolyatomicPage() {
  return <PolyatomicPractice />;
}
