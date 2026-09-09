import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { hashPassword } from '../auth/password';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set.');

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  // --- Settings row (only one row ever exists) ---
  const existingSettings = await db.select().from(schema.settings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(schema.settings).values({
      businessName: 'Veloura Naturals',
      contactPhone: '0344 1889944',
      contactEmail: 'hello@velouranaturals.co.uk',
      whatsappNumber: '923441889944',
      address: 'Pakistan',
      announcementText: 'Free delivery on orders above Rs. 3000',
      deliveryFee: '200',
      freeDeliveryThreshold: '3000',
      meezanAccountTitle: 'Muhammad Nisar',
      meezanAccountNumber: '03070116078049',
      meezanIban: 'PK50MEZN0003070116078049',
      meezanBankName: 'Meezan Bank',
      easypaisaAccountTitle: 'Veloura Naturals',
      easypaisaNumber: '0344 1889944',
    });
    console.log('Created default settings row.');
  }

  // --- Default category ---
  let category: typeof schema.categories.$inferSelect;
  const cats = await db.select().from(schema.categories);
  if (cats.length === 0) {
    const [inserted] = await db
      .insert(schema.categories)
      .values({ name: 'Hair Oil', slug: 'hair-oil' })
      .returning();
    category = inserted;
    console.log('Created default category.');
  } else {
    category = cats[0];
  }

  // --- The single hero product ---
  const existingProducts = await db.select().from(schema.products);
  if (existingProducts.length === 0) {
    await db.insert(schema.products).values({
      name: 'Veloura Naturals Hair Oil',
      slug: 'veloura-naturals-hair-oil',
      categoryId: category.id,
      price: '1999',
      compareAtPrice: '2999',
      shortDescription:
        'Anti-hair fall. Strengthens roots. Intense hair nourishment — with olive, almond, mustard, rosemary, amla, black seed, four seed, coconut and pumpkin oils plus Vitamin E.',
      description:
        'Veloura Naturals Hair Oil is a 100% organic, 9-oil blend crafted to stop hair fall, strengthen roots from within, and restore natural shine and volume. Massage into the scalp, leave active for 2–3 hours, then wash — with consistent use, most customers notice visibly stronger, thicker hair within a few weeks.',
      details:
        'Ingredients: Olive Oil, Almond Oil, Mustard Oil, Rosemary Oil, Amla Oil, Black Seed Oil, Four Seed Oil, Coconut Oil, Pumpkin Oil, Vitamin E.\n\nDirections: Take a few drops in hands and massage deeply into roots and scalp. Distribute evenly to hair ends. Leave active for 2–3 hours prior to washing.\n\nNet volume: 125ml.',
      images: ['/images/product-placeholder-1.png', '/images/product-placeholder-2.png'],
      stock: 250,
      isActive: true,
      isFeatured: true,
      isBestseller: true,
    });
    console.log('Created default product.');
  }

  // --- Default admin account ---
  const existingAdmins = await db.select().from(schema.admins);
  if (existingAdmins.length === 0) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@velouranaturals.co.uk';
    const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeThisPassword123!';
    const passwordHash = await hashPassword(password);
    await db.insert(schema.admins).values({
      email,
      passwordHash,
      name: 'Store Owner',
      role: 'owner',
    });
    console.log(`Created default admin: ${email} / ${password}`);
    console.log('⚠️  Log in and change this password immediately.');
  }

  // --- A couple of starter reviews so the storefront isn't empty ---
  const existingReviews = await db.select().from(schema.reviews);
  if (existingReviews.length === 0) {
    await db.insert(schema.reviews).values([
      {
        customerName: 'Ayesha K.',
        rating: 5,
        title: 'Noticed less hair fall in 3 weeks',
        body: 'My hair fall reduced noticeably and my scalp feels healthier. Smells great too.',
        status: 'approved',
      },
      {
        customerName: 'Bilal R.',
        rating: 5,
        title: 'Great texture, not greasy',
        body: 'Absorbs well and does not leave hair feeling heavy. Will reorder.',
        status: 'approved',
      },
      {
        customerName: 'Sana M.',
        rating: 4,
        title: 'Good product',
        body: 'Delivery was quick and packaging was solid.',
        status: 'approved',
      },
    ]);
    console.log('Created starter reviews.');
  }

  console.log('Seeding complete.');
  await client.end();
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
