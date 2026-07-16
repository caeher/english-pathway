import { NextResponse } from 'next/server'

const TEMPORARY_REDIRECT_STATUS = 307

export function redirectWithSession(
  url: URL | string,
  sessionResponse: NextResponse
): NextResponse {
  const response = NextResponse.redirect(url, { status: TEMPORARY_REDIRECT_STATUS })

  sessionResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set({ name, value, ...options })
  })

  return response
}

export function temporaryRedirect(url: URL | string): NextResponse {
  return NextResponse.redirect(url, { status: TEMPORARY_REDIRECT_STATUS })
}
