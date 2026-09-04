import navFull from "@/assets/logos/nav-full.png";
import navJdGold from "@/assets/logos/nav-jd-gold.png";

/** Exact jdproductions.io nav lockup + scroll morph (site.css). */
export default function NavLogo() {
  return (
    <a
      className="nav-logo"
      href="https://jdproductions.io"
      aria-label="JD Productions — home"
    >
      <div className="nav-logo-animated">
        <img className="logo-full-img" src={navFull} alt="JD Productions" />
        <img className="logo-jd-img" src={navJdGold} alt="JD" />
      </div>
    </a>
  );
}
