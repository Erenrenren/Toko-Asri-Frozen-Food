import { CreditCard } from "lucide-react";

import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = { title: "Pembayaran" };

export default function PaymentsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Payment"
      title="Pembayaran & Rekonsiliasi"
      stage="Tahap 4"
      icon={CreditCard}
      description="Modul pembayaran akan mengintegrasikan payment gateway, invoice, status pembayaran pesanan, rekonsiliasi, dan refund untuk kanal penjualan Toko Asri Frozen Food."
      features={[
        {
          title: "Payment gateway",
          description: "Virtual account, QRIS, dan kartu dengan webhook status pembayaran.",
        },
        {
          title: "Invoice & pesanan",
          description: "Nomor invoice, detail pesanan, dan tautan pembayaran pelanggan.",
        },
        {
          title: "Rekonsiliasi",
          description: "Pencocokan pembayaran gateway dengan jurnal kas internal.",
        },
        {
          title: "Refund & void",
          description: "Alur pembatalan pembayaran dan penyesuaian jurnal terkait.",
        },
      ]}
      contracts={[
        "FinancialTransaction.source = 'payment' dan externalRef dicadangkan untuk ID transaksi gateway.",
        "FinancialTransaction.status 'posted' | 'void' tetap menjadi status jurnal internal.",
        "Jangan mengubah arti amount: selalu nominal bruto dalam Rupiah integer.",
        "Webhook gateway harus menulis melalui service layer dan mencatat jejak audit pada tahap implementasi.",
      ]}
      plannedPaths={[
        "app/(dashboard)/dashboard/payments/**",
        "app/api/payments/**",
        "app/api/webhooks/payment/**",
        "lib/services/payment/**",
        "lib/validators/payment.ts",
        "components/payments/**",
      ]}
    />
  );
}
