import { useEffect } from "react";
import Navbar from "@/components/Navbar";

const WHATSAPP_NUMBER = "6285155145788";

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

const buildWaUrl = (title: string) => {
  const msg = `Halo TernoAE, saya tertarik dengan layanan *${title}*. Mohon informasi lebih lanjut mengenai prosedur dan biayanya. Terima kasih.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
};

const ServiceCard = ({ title, desc }: Service) => {
  return (
    <div className="brutal-lg bg-background p-4 flex flex-col">
      <div className="text-sm font-black uppercase mb-1">{title}</div>
      <div className="text-xs opacity-70 leading-relaxed mb-3 flex-1">{desc}</div>
      <a
        href={buildWaUrl(title)}
        target="_blank"
        rel="noopener noreferrer"
        className="brutal-btn bg-primary px-3 py-2 text-[11px] font-black uppercase text-center"
      >
        Pesan via WhatsApp
      </a>
    </div>
  );
};

export default function IntelPage() {
  useEffect(() => {
    document.title = "Jasa Intel — TernoAE Jepara";
    const desc =
      "Layanan OSINT, cek latar belakang, jejak digital, konsultasi keamanan, jasa suruh, dan verifikasi lapangan di Jepara & Jawa Tengah.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="p-4 md:p-6">
        {/* HERO */}
        <header className="brutal-lg bg-primary p-6 mb-6">
          <h1 className="text-xl md:text-2xl font-black uppercase">
            TernoAE Intelligence Service
          </h1>
          <p className="text-xs md:text-sm mt-2 max-w-xl leading-relaxed">
            Layanan riset informasi berbasis data publik dan kebutuhan
            operasional lapangan. Dirancang untuk penggunaan yang legal dan
            profesional.
          </p>
        </header>

        {/* SERVICES */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {services.map((s, i) => (
            <ServiceCard key={i} {...s} />
          ))}
        </section>

        {/* FOOTER */}
        <footer className="text-[10px] opacity-60 text-center">
          © 2026 TernoAE Service — Penggunaan sesuai hukum yang berlaku
        </footer>
      </main>
    </div>
  );
}
