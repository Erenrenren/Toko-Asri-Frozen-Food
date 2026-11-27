import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CheckCircle2, Construction, Database, Network } from "lucide-react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

interface ModulePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  stage: string;
  icon: LucideIcon;
  features: Array<{ title: string; description: string }>;
  contracts: string[];
  plannedPaths: string[];
}

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  stage,
  icon: Icon,
  features,
  contracts,
  plannedPaths,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <Link href="/dashboard" className={buttonClasses({ variant: "outline" })}>
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        }
      />

      <Alert tone="warning" title={`Modul ini baru tersedia sebagai placeholder aman (${stage}).`}>
        Navigasi, kontrak data, dan rencana integrasi sudah disiapkan. Implementasi
        detail akan dikerjakan pada tahap berikutnya tanpa mengubah fondasi Tahap 1.
      </Alert>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-lg shadow-brand-900/20">
                <Icon className="h-8 w-8" />
              </span>
              <div>
                <Badge tone="amber">{stage}</Badge>
                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  Rencana modul {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-600" />
                    <p className="text-sm font-semibold text-slate-800">
                      {feature.title}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-500">
              <Construction className="h-4 w-4 text-amber-500" />
              Antarmuka ini sengaja tidak memiliki aksi tulis agar tidak bentrok
              dengan pekerjaan tahap berikutnya.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-brand-600" />
                <CardTitle>Kontrak data yang disiapkan</CardTitle>
              </div>
              <CardDescription>
                Bagian ini tidak boleh diubah tanpa koordinasi lintas tahap.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {contracts.map((contract) => (
                <div
                  key={contract}
                  className="flex items-start gap-2 text-xs leading-relaxed text-slate-600"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{contract}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-brand-600" />
                <CardTitle>Rencana struktur folder</CardTitle>
              </div>
              <CardDescription>
                Folder dibuat pada tahap masing-masing, bukan sekarang.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {plannedPaths.map((path) => (
                <code
                  key={path}
                  className="block rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-brand-200"
                >
                  {path}
                </code>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
