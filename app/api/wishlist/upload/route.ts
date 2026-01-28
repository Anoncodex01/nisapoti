import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    const uploadedImages: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size must be less than 5MB' },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const filename = `wishlist_${timestamp}_${randomString}.${fileExtension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'wishlist');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const filePath = join(uploadDir, filename);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Store the relative path for database
      const imageUrl = `/uploads/wishlist/${filename}`;
      uploadedImages.push(imageUrl);
    }

    return NextResponse.json({
      success: true,
      data: {
        images: uploadedImages
      }
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
