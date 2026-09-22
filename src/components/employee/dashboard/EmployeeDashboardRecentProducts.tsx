import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { fetchRecentDashboardProducts } from "@/lib/admin/queries";
import { getStaffSupabase } from "@/lib/auth/session-cache";
import Link from "next/link";

export async function EmployeeDashboardRecentProducts() {
  const { supabase } = await getStaffSupabase();
  const products = await fetchRecentDashboardProducts(supabase, 6);

  return (
    <section className="mjms-panel" aria-labelledby="employee-recent-products">
      <div className="mjms-panel-head">
        <h2 id="employee-recent-products" className="mjms-panel-title">
          Recent catalogue entries
        </h2>
        <Link href="/employee/catalogue" className="mjms-panel-link" prefetch>
          Open catalogue
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="mjms-panel-empty-text" role="status">
          No catalogue records yet.
        </p>
      ) : (
        <ProductGrid products={products} className="catalogue-product-grid--workspace" />
      )}
    </section>
  );
}
