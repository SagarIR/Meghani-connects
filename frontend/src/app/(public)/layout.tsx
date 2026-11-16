import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import WhatsAppButton from '@/components/public/WhatsAppButton';
import { getStoreInfo, getPublicBrands, getPublicCategories } from '@/services/publicCatalogue';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [storeInfo, brands, categories] = await Promise.all([
    getStoreInfo(),
    getPublicBrands(),
    getPublicCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[#0B0B0A] text-[#F3EFE6] font-sans flex flex-col selection:bg-[#C9A45C]/30 selection:text-[#E8D5A7] antialiased">
      <PublicNavbar storeInfo={storeInfo} brands={brands} categories={categories} />
      <main className="flex-1">{children}</main>
      <PublicFooter storeInfo={storeInfo} />
      <WhatsAppButton phone={storeInfo.whatsapp} />
    </div>
  );
}

