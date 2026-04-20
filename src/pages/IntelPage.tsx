import { useState } from "react";

type Service = {
  title: string;
  desc: string;
};

const services: Service[] = [
  {
    title: "OSINT Data",
    desc: "Pencarian informasi dari sumber publik seperti media sosial dan website.",
  },
  {
    title: "Cek Latar Belakang",
    desc: "Verifikasi identitas dan reputasi secara legal.",
  },
  {
    title: "Jejak Digital",
    desc: "Audit keberadaan online individu atau brand.",
  },
  {
    title: "Konsultasi Keamanan",
    desc: "Saran perlindungan data dan privasi.",
  },
  {
    title: "Jasa Suruh",
    desc: "Pengambilan barang atau tugas ringan di wilayah Jepara.",
  },
  {
    title: "Verifikasi Lapangan",
    desc: "Pengecekan alamat atau lokasi usaha secara langsung.",
  },
];

const ServiceCard = ({ title, desc }: Service) => {
  return (
    <div className="brutal-lg bg-background p-4 transition hover:-translate-x-[2px] hover:-translate-y-[2px]">
      <div className="text-sm font-black uppercase mb-1">{title}</div>
      <div className="text-xs opacity-70 leading-relaxed">{desc}</div>
    </div>
  );
};

export default function IntelPage() {
  const [form, setForm] = useState("");
  const [payment, setPayment] = useState<"qris" | "tunai">("qris");

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      
      {/* HERO */}
      <div className="brutal-lg bg-primary p-6 mb-6">
        <div className="text-xl md:text-2xl font-black uppercase">
          TernoAE Intelligence Service
        </div>
        <div className="text-xs md:text-sm mt-2 max-w-xl leading-relaxed">
          Layanan riset informasi berbasis data publik dan kebutuhan operasional lapangan.
          Dirancang untuk penggunaan yang legal dan profesional.
        </div>
      </div>

      {/* SERVICES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {services.map((s, i) => (
          <ServiceCard key={i} {...s} />
        ))}
      </div>

      {/* FORM */}
      <div className="brutal-lg bg-background p-4 mb-6">
        <div className="text-sm font-black uppercase mb-2">
          Ajukan Permintaan
        </div>

        <textarea
          value={form}
          onChange={(e) => setForm(e.target.value)}
          placeholder="Jelaskan kebutuhan Anda secara singkat dan jelas"
          className="brutal w-full p-3 text-xs outline-none mb-3 resize-none"
          rows={4}
        />

        <button className="brutal-btn bg-primary px-4 py-2 text-xs font-black uppercase">
          Kirim Permintaan
        </button>
      </div>

      {/* PAYMENT */}
      <div className="brutal-lg bg-background p-4 mb-6">
        <div className="text-sm font-black uppercase mb-2">
          Metode Pembayaran
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPayment("qris")}
            className={`brutal-btn px-3 py-3 text-left ${
              payment === "qris" ? "bg-primary" : "bg-background"
            }`}
          >
            <div className="text-xs font-black uppercase">QRIS</div>
            <div className="text-[10px] opacity-70">Pembayaran digital</div>
          </button>

          <button
            onClick={() => setPayment("tunai")}
            className={`brutal-btn px-3 py-3 text-left ${
              payment === "tunai" ? "bg-primary" : "bg-background"
            }`}
          >
            <div className="text-xs font-black uppercase">Tunai</div>
            <div className="text-[10px] opacity-70">Bayar langsung</div>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-[10px] opacity-60 text-center">
        © 2026 TernoAE Service — Penggunaan sesuai hukum yang berlaku
      </div>
    </div>
  );
}