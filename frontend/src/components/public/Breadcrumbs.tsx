import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbListSchema } from '@/utils/seo';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const schema = getBreadcrumbListSchema(items);

  return (
    <>
      {/* Search Engine Structured Data (JSON-LD BreadcrumbList) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex items-center flex-wrap gap-2 text-xs text-[#8D8980]">
          <li>
            <Link
              href="/"
              className="flex items-center gap-1.5 hover:text-[#C9A45C] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="tracking-wide">Home</span>
            </Link>
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-[#2A261F]" />
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-[#C9A45C] transition-colors tracking-wide"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[#C9A45C] font-medium tracking-wide truncate max-w-[200px] sm:max-w-xs">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
