import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const urlParam = req.nextUrl.searchParams.get('url')
    if (!urlParam) {
      return NextResponse.json({ error: 'url parameter is required' }, { status: 400 })
    }

    const videoUrl = decodeURIComponent(urlParam)

    if (!videoUrl.startsWith('https://wger.de/media/exercise-video/')) {
      return NextResponse.json({ error: 'Only wger.de videos are allowed' }, { status: 403 })
    }

    const isMP4 = videoUrl.toLowerCase().endsWith('.mp4')
    const isMOV = videoUrl.toLowerCase().endsWith('.mov')
    const contentType = isMP4 ? 'video/mp4' : isMOV ? 'video/quicktime' : 'video/mp4'

    const range = req.headers.get('range')

    const videoResponse = await fetch(videoUrl, {
      headers: range ? { Range: range } : {},
      signal: AbortSignal.timeout(30000),
    })

    if (!videoResponse.ok && videoResponse.status !== 206) {
      return NextResponse.json({ error: 'Video unavailable' }, { status: 500 })
    }

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    })

    const contentLength = videoResponse.headers.get('content-length')
    if (contentLength) {
      headers.set('Content-Length', contentLength)
    }

    const contentRange = videoResponse.headers.get('content-range')
    if (contentRange) {
      headers.set('Content-Range', contentRange)
    }

    return new Response(videoResponse.body, {
      status: videoResponse.status,
      headers,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Video proxy error:', err.message)
    return NextResponse.json({ error: 'Video unavailable' }, { status: 500 })
  }
}
