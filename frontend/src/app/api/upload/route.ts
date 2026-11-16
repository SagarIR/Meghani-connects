import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || process.env.CLOUDINARY_FOLDER || 'meghani-watches';

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided in upload' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image size exceeds maximum 5MB limit' },
        { status: 400 }
      );
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image format ${file.type}. Allowed formats: JPEG, PNG, WebP, AVIF.` },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // If Cloudinary credentials are configured in server environment, perform signed upload
    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.round(Date.now() / 1000);
      const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('api_key', apiKey);
      cloudinaryFormData.append('timestamp', timestamp.toString());
      cloudinaryFormData.append('folder', folder);
      cloudinaryFormData.append('signature', signature);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData,
        }
      );

      if (cloudinaryRes.ok) {
        const data = await cloudinaryRes.json();
        return NextResponse.json({
          success: true,
          url: data.secure_url || data.url,
          public_id: data.public_id,
          provider: 'cloudinary',
          format: data.format,
          width: data.width,
          height: data.height,
        });
      }
    }

    // Fallback: Proxy to Django backend media upload endpoint
    const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('folder', folder);

    const backendRes = await fetch(`${backendApiUrl}/upload/image/`, {
      method: 'POST',
      body: backendFormData,
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }

    // Fallback data-URL representation if backend is offline in standalone preview
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      public_id: `local_${Date.now()}`,
      provider: 'local_preview',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media file' },
      { status: 500 }
    );
  }
}

