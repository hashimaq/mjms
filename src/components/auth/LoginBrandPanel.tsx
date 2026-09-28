import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { LoginFashionDecor } from "@/components/brand/fashion-silhouettes";
import { MjmsLogo } from "@/components/brand/MjmsLogo";

/** Brand zone — hero logo + heading as one centered unit, full-zone geometry behind. */
export function LoginBrandPanel() {
  return (
    <aside className="login-brand">
      <LoginFashionDecor />
      <BrandGeometry variant="login" />
      <div className="login-brand-content">
        <div className="login-brand-hero">
          <MjmsLogo priority className="login-brand-logo" data-login-safe="logo" />
          <h1 className="login-brand-title" data-login-safe="heading">
            MJMS Product Development
          </h1>
          <p className="login-brand-tagline">
            Ladies footwear &amp; fashion product development — secure access to MJMS
            collections, catalogue, and team workspace.
          </p>
        </div>
      </div>
    </aside>
  );
}
