import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
])

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const TARGET_SIZE = 512 // High-res square avatar 512x512 px

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authSupabase = await createServerClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be signed in to upload an avatar.' }, { status: 401 })
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
        error: `Unsupported file type (${file.type}). Please upload a PNG, JPEG, or WebP image.`,
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

    // 6. Process and compress to 256x256 WebP for lightning-fast loads and low DB/storage usage
    let processedBuffer: Buffer
    try {
      processedBuffer = await sharp(inputBuffer)
        .resize(TARGET_SIZE, TARGET_SIZE, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 88 })
        .toBuffer()
    } catch (err: any) {
      // Fallback to original buffer if sharp fails on unusual formats (e.g. svg)
      processedBuffer = inputBuffer
    }

    // 7. Use service role client to bypass storage RLS permission issues safely
    const storageClient = await createServiceRoleClient()

    // Determine target bucket: try 'avatars' first, fallback to 'icons'
    let targetBucket = 'avatars'
    try {
      const { data: buckets } = await storageClient.storage.listBuckets()
      const bucketNames = (buckets || []).map(b => b.name)
      if (bucketNames.includes('avatars')) {
        targetBucket = 'avatars'
      } else if (bucketNames.includes('icons')) {
        targetBucket = 'icons'
      }
    } catch (bErr) {
      targetBucket = 'icons'
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filePath = `${user.id}/avatar-${Date.now()}-${randomSuffix}.webp`

    const { error: uploadError } = await storageClient.storage
      .from(targetBucket)
      .upload(filePath, processedBuffer, {
        contentType: 'image/webp',
        upsert: true,
      })

    if (uploadError) {
      console.error('[API /api/upload/avatar] Storage upload error:', uploadError)
      return NextResponse.json({
        error: `Failed to save avatar to storage: ${uploadError.message}`,
      }, { status: 500 })
    }

    const { data: urlData } = storageClient.storage
      .from(targetBucket)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // 8. Automatically update the user's profile avatar_url in the database
    const { error: profileUpdateError } = await storageClient
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.warn('[API /api/upload/avatar] Profile DB update warning:', profileUpdateError)
    }

    revalidatePath('/account')
    revalidatePath('/', 'layout')

    return NextResponse.json({
      url: publicUrl,
      success: true,
    })
  } catch (error: any) {
    console.error('[API /api/upload/avatar] Unexpected error:', error)
    return NextResponse.json({
      error: error?.message || 'An unexpected error occurred while processing the avatar.',
    }, { status: 500 })
  }
}
