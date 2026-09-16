import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { MjmsLogo } from "@/components/brand/MjmsLogo";

/** Brand zone — hero logo + heading as one centered unit, full-zone geometry behind. */
export function LoginBrandPanel() {
  return (
    <aside className="login-brand">
      <BrandGeometry variant="login" />
      <div className="login-brand-content">
        <div className="login-brand-hero">
          <MjmsLogo priority className="login-brand-logo" data-login-safe="logo" />
          <h1 className="login-brand-title" data-login-safe="heading">
            MJMS Product Development
          </h1>
          <p className="login-brand-tagline">
            Footwear product development — collections, styles, and catalogue records.
          </p>
        </div>
      </div>
    </aside>
  );
}
