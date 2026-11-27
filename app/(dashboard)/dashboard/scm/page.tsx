import { Truck } from "lucide-react";

import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = { title: "SCM" };

export default function ScmPage() {
  return (
    <ModulePlaceholder
      eyebrow="Supply Chain"
      title="SCM & Cold Chain"
      stage="Tahap 2"
      icon={Truck}
      description="Modul Supply Chain Management akan menangani supplier, purchase order, restock otomatis, stock opname, dan pemantauan suhu cold storage Toko Asri Frozen Food."
      features={[
        {
          title: "Master supplier",
          description: "Kontak, termin pembayaran, lead time, dan riwayat pembelian.",
        },
        {
          title: "Purchase order",
          description: "Draft, approval, penerimaan barang, dan status pembayaran.",
        },
        {
          title: "Restock & stok minimum",
          description: "Usulan restock otomatis dari ambang stok produk yang sudah tersedia.",
        },
        {
          title: "Cold-chain monitoring",
          description: "Log suhu freezer, alert penyimpangan, dan bukti pemeliharaan.",
        },
      ]}
      contracts={[
        "Product.stockQty dan Product.minStockQty sudah tersedia sebagai sumber perhitungan restock.",
        "FinancialTransaction.source = 'scm' dicadangkan untuk pembelian/restock otomatis.",
        "FinancialTransaction.externalRef dapat menyimpan nomor purchase order atau dokumen supplier.",
        "Status transaksi 'posted' | 'void' harus dipertahankan agar laporan Tahap 1 tetap valid.",
      ]}
      plannedPaths={[
        "app/(dashboard)/dashboard/scm/**",
        "app/api/scm/**",
        "lib/services/scm/**",
        "lib/validators/scm.ts",
        "components/scm/**",
      ]}
    />
  );
}
