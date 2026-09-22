import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { fetchRecentDashboardProducts } from "@/lib/admin/queries";
import { getAdminSupabase } from "@/lib/auth/session-cache";
import Link from "next/link";

export async function AdminDashboardRecentProducts() {
  const { supabase } = await getAdminSupabase();
  const recentProducts = await fetchRecentDashboardProducts(supabase, 8);

  return (
    <section className="mjms-panel" aria-labelledby="admin-recent-products">
      <div className="mjms-panel-head">
        <h2 id="admin-recent-products" className="mjms-panel-title">
          Recent catalogue
        </h2>
        <Link href="/admin/catalogue" className="mjms-panel-link" prefetch>
          Full catalogue
        </Link>
      </div>
      {recentProducts.length === 0 ? (
        <div className="mjms-panel-empty" role="status">
          <p className="mjms-panel-empty-title">No products yet</p>
          <p className="mjms-panel-empty-text">
            Add a product or import catalogue data to see items here.
          </p>
        </div>
      ) : (
        <ProductGrid products={recentProducts} />
      )}
    </section>
  );
}
