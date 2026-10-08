import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
])

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authSupabase = await createServerClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be signed in to upload screenshots.' }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No screenshot file provided.' }, { status: 400 })
    }

    // 3. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({
        error: `Unsupported file type (${file.type}). Please upload a PNG, JPEG, or WebP screenshot.`,
      }, { status: 400 })
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({
        error: 'File size exceeds the 10MB limit. Please upload a smaller image.',
      }, { status: 400 })
    }

    // 5. Decode image buffer
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'png'

    // 6. Use service role client to upload directly to project-images bucket (bypasses RLS)
    const storageClient = await createServiceRoleClient()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filePath = `${user.id}/screenshot-${Date.now()}-${randomSuffix}.${ext}`

    const { error: uploadError } = await storageClient.storage
      .from('project-images')
      .upload(filePath, inputBuffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('[API /api/upload/screenshot] Storage upload error:', uploadError)
      return NextResponse.json({
        error: `Failed to save screenshot to storage: ${uploadError.message}`,
      }, { status: 500 })
    }

    const { data: urlData } = storageClient.storage
      .from('project-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      success: true,
    })
  } catch (error: any) {
    console.error('[API /api/upload/screenshot] Unexpected error:', error)
    return NextResponse.json({
      error: error?.message || 'An unexpected error occurred while processing the screenshot.',
    }, { status: 500 })
  }
}
