import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {

  let supabaseResponse = NextResponse.next({
    request,
  })
  
  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()

  const user = data?.claims
  // we want the unauthenticated user to have access to ONLY these rountes 
  // ALL other routes are effectively private 
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/confirm')&& 
    request.nextUrl.pathname !== '/'
    
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Token hash structure validator for explicit confirmation parameters
  if (request.nextUrl.pathname.startsWith('/confirm')) {
    const token = request.nextUrl.searchParams.get('token_hash')
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 💳 INTERNAL BILLING DETECTION RADAR
  // If an active user hits the dashboard coming from a Stripe upgrade/downgrade event,
  // drop a short-lived flash cookie telling the client layer its local storage is stale.
  if (
    user && 
    (request.nextUrl.searchParams.has('session_id') || request.nextUrl.searchParams.has('billing_updated'))
  ) {
    supabaseResponse.cookies.set('x-sync-local-storage', 'true', {
      maxAge: 15,            // Expired automatically after 15 seconds
      path: '/',             // Available application-wide
      httpOnly: false,       // CRITICAL: Must be false so client-side JS can read it!
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}