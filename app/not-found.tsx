import Link from "next/link";
import { btnPrimary, PageTitle } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="max-w-2xl space-y-5">
      <PageTitle>Not found</PageTitle>
      <p className="text-lg text-muted">There&rsquo;s no practice page here. Topic tiles run from A to H.</p>
      <Link href="/" className={btnPrimary}>
        Back to dashboard
      </Link>
    </div>
  );
}
