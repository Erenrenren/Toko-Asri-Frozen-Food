import type { ReactNode } from "react";

import { ScmNav } from "@/components/scm/scm-nav";

export default function ScmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5">
      <ScmNav />
      {children}
    </div>
  );
}
