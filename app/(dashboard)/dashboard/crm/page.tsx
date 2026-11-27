import { Users } from "lucide-react";

import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = { title: "CRM" };

export default function CrmPage() {
  return (
    <ModulePlaceholder
      eyebrow="Customer Relation"
      title="CRM & Loyalty"
      stage="Tahap 3"
      icon={Users}
      description="Modul CRM akan memperluas akun pelanggan menjadi profil 360°, program loyalty, riwayat pembelian, segmentasi, dan kanal komunikasi Toko Asri Frozen Food."
      features={[
        {
          title: "Profil pelanggan",
          description: "Alamat, preferensi produk, dan catatan interaksi pelanggan.",
        },
        {
          title: "Riwayat pembelian",
          description: "Agregasi transaksi pelanggan dan produk favorit.",
        },
        {
          title: "Poin loyalty",
          description: "Aturan perolehan poin, tier, dan penukaran reward.",
        },
        {
          title: "Segmentasi & kampanye",
          description: "Segmentasi pelanggan dan promosi yang dapat diukur.",
        },
      ]}
      contracts={[
        "User dengan role 'customer' menjadi entitas dasar pelanggan; jangan mengganti nama field inti.",
        "FinancialTransaction.createdById tetap menunjuk user pembuat transaksi, bukan pelanggan.",
        "Untuk transaksi pelanggan pada Tahap 3, tambahkan relasi baru (mis. customerId) tanpa menghapus field lama.",
        "Format response API dan tipe domain di types/domain.ts wajib dipertahankan.",
      ]}
      plannedPaths={[
        "app/(dashboard)/dashboard/crm/**",
        "app/portal/** (perluasan)",
        "app/api/crm/**",
        "lib/services/crm/**",
        "lib/validators/crm.ts",
        "components/crm/**",
      ]}
    />
  );
}
