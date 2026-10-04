import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
])

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MIN_DIMENSION = 64
const TARGET_SIZE = 512

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authSupabase = await createServerClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be signed in to upload icons.' }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 })
    }

    // 3. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({
        error: `Unsupported file type (${file.type}). Please upload a PNG, JPEG, WebP, or SVG file.`,
      }, { status: 400 })
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({
        error: 'File size exceeds the 5MB limit. Please upload a smaller image.',
      }, { status: 400 })
    }

    // 5. Decode image buffer and inspect dimensions
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    let metadata: sharp.Metadata
    try {
      metadata = await sharp(inputBuffer).metadata()
    } catch (err: any) {
      return NextResponse.json({
        error: 'Failed to decode image. The file may be corrupted or invalid.',
      }, { status: 400 })
    }

    if (!metadata.width || !metadata.height) {
      return NextResponse.json({
        error: 'Unable to determine image dimensions.',
      }, { status: 400 })
    }

    if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
      return NextResponse.json({
        error: `Image dimensions (${metadata.width}×${metadata.height}) are too small. Minimum size is ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
      }, { status: 400 })
    }

    // 6. Process and standardize to 512 × 512 px PNG with transparent background
    // Preserves transparency for transparent PNGs and SVGs
    const processedBuffer = await sharp(inputBuffer)
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        quality: 92,
        compressionLevel: 8,
      })
      .toBuffer()

    // 7. Upload to Supabase Storage 'icons' bucket
    const storageClient = createServiceRoleClient ? await createServiceRoleClient() : authSupabase
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filePath = `${user.id}/${Date.now()}-${randomSuffix}.png`

    const { error: uploadError } = await storageClient.storage
      .from('icons')
      .upload(filePath, processedBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('[API /api/upload/icon] Storage upload error:', uploadError)
      return NextResponse.json({
        error: `Failed to save icon to storage: ${uploadError.message}`,
      }, { status: 500 })
    }

    const { data: urlData } = storageClient.storage
      .from('icons')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      width: TARGET_SIZE,
      height: TARGET_SIZE,
      success: true,
    })
  } catch (error: any) {
    console.error('[API /api/upload/icon] Unexpected error:', error)
    return NextResponse.json({
      error: error?.message || 'An unexpected error occurred while processing the icon.',
    }, { status: 500 })
  }
}
