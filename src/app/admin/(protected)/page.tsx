import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, reviews, products } from '@/lib/db/schema';
import { formatPKR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getOverviewStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const allOrders = await db.select().from(orders);
  const ordersToday = allOrders.filter((o) => new Date(o.createdAt) >= startOfToday);

  const verifiedOrders = allOrders.filter(
    (o) => o.paymentStatus === 'verified' || (o.paymentMethod === 'cod' && o.status === 'delivered')
  );
  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  const pendingReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.status, 'pending'));

  const activeProducts = await db.select().from(products).where(eq(products.isActive, true));

  return {
    ordersToday: ordersToday.length,
    totalOrders: allOrders.length,
    totalRevenue,
    pendingReviewsCount: pendingReviews.length,
    activeProductsCount: activeProducts.length,
    recentOrders: allOrders.slice(0, 6),
  };
}

export default async function AdminOverviewPage() {
  const stats = await getOverviewStats();

  const cards = [
    { label: 'Orders Today', value: stats.ordersToday },
    { label: 'Total Orders', value: stats.totalOrders },
    { label: 'Total Verified Revenue', value: formatPKR(stats.totalRevenue) },
    { label: 'Pending Reviews', value: stats.pendingReviewsCount },
  ];

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Dashboard Overview</h1>
      <p className="mt-1 text-sm text-ink/50">Real-time storefront metrics and order statuses.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="admin-card p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-forest-700">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 admin-card p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Recent Orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
                <th className="py-2.5">Order #</th>
                <th className="py-2.5">Customer</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-ink/5">
                  <td className="py-3 font-mono text-forest-700">{o.orderNumber}</td>
                  <td className="py-3">{o.customerName}</td>
                  <td className="py-3 capitalize">{o.status}</td>
                  <td className="py-3">{formatPKR(o.total)}</td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-ink/40">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
