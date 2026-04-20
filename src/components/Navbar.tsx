import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Antar Jemput" },
  { to: "/intel", label: "Jasa Intel" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="brutal-lg bg-background mx-4 mt-4 md:mx-6 md:mt-6 p-3 flex items-center gap-2 md:gap-3">
      <Link
        to="/"
        className="text-sm md:text-base font-black uppercase tracking-tight px-2"
      >
        TernoAE
      </Link>

      <div className="ml-auto flex gap-2">
        {links.map((l) => {
          const active = pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`brutal-btn px-3 py-2 text-[11px] md:text-xs font-black uppercase ${
                active ? "bg-primary" : "bg-background"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
