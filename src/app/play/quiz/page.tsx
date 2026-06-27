import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { QuizGame } from "./QuizGame";

export const metadata = { title: "Quest" };

export default function QuizPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="grid min-h-[60vh] place-items-center text-lg font-bold text-ink/40">
            Loading your quest…
          </div>
        }
      >
        <QuizGame />
      </Suspense>
    </AppShell>
  );
}
