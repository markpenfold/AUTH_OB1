import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const IS_DEV = process.env.DATA_SOURCE === 'local'

function isEntitled(userTier: string | undefined, requiredTier: string): boolean {
  const tiers = ['free', 'pro', 'enterprise']
  const userLevel = tiers.indexOf(userTier ?? 'free')
  const requiredLevel = tiers.indexOf(requiredTier)
  return userLevel >= requiredLevel
}

export async function GET(request: NextRequest) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
        cookies: {
        getAll() {
            return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
            )
        },
        },
    },
)


  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const sliceId = request.nextUrl.searchParams.get('sliceId')
  if (!sliceId) return NextResponse.json({ error: 'Missing sliceId' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: slice } = await supabase
    .from('data_slices')
    .select('s3_key, required_tier, schema')
    .eq('id', sliceId)
    .single()

  if (!slice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!isEntitled(profile?.subscription_tier, slice.required_tier)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Auth and entitlement checks are identical in both paths —
  // only the URL generation differs
  const url = IS_DEV
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/mock-data/${slice.s3_key}`
    : await generatePresignedUrl(slice.s3_key)

  return NextResponse.json({ url, schema: slice.schema })
}

async function generatePresignedUrl(s3Key: string): Promise<string> {
  const s3 = new S3Client({ region: process.env.AWS_REGION })
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: s3Key }),
    { expiresIn: 900 }
  )
}