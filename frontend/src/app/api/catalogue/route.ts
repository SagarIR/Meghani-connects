import { NextRequest, NextResponse } from 'next/server';
import { getPublicProducts, ProductFilterParams } from '@/services/publicCatalogue';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: ProductFilterParams = {
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      availability: (searchParams.get('availability') as any) || undefined,
      search: searchParams.get('search') || undefined,
      sort: (searchParams.get('sort') as any) || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 12,
    };

    if (searchParams.get('minPrice')) {
      params.minPrice = parseFloat(searchParams.get('minPrice')!);
    }
    if (searchParams.get('maxPrice')) {
      params.maxPrice = parseFloat(searchParams.get('maxPrice')!);
    }

    const data = await getPublicProducts(params);

    // Strictly ensure no hidden price is leaked if price_visible is false
    const sanitizedResults = data.results.map((product) => {
      if (!product.price_visible || product.availability === 'on_request') {
        return {
          ...product,
          price: null,
          price_visible: false,
        };
      }
      return product;
    });

    return NextResponse.json({
      ...data,
      results: sanitizedResults,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve watch catalogue' },
      { status: 500 }
    );
  }
}

