import { NextRequest, NextResponse } from 'next/server';
import { getPublicProductById } from '@/services/publicCatalogue';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getPublicProductById(params.id);

    if (!product) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
    }

    // STRICT PRICE VISIBILITY ENFORCEMENT:
    // If price visibility is disabled, DO NOT expose price through API response
    if (!product.price_visible || product.availability === 'on_request') {
      const sanitized = {
        ...product,
        price: null,
        price_visible: false,
      };
      return NextResponse.json(sanitized);
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve watch details' },
      { status: 500 }
    );
  }
}

