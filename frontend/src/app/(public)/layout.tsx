import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import WhatsAppButton from '@/components/public/WhatsAppButton';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0B0A] text-[#F3EFE6] font-sans flex flex-col selection:bg-[#C9A45C]/30 selection:text-[#E8D5A7] antialiased">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}

