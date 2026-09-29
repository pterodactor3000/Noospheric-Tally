import { PROJECT_VERSION } from './definitions'

const fetchHttp200 = async (url: string, signal: AbortSignal) => {
  const userAgent = {
    'User-Agent': `NoosphericTally/${PROJECT_VERSION} (pterodactor@pm.me)`,
  }
  console.log('fetch 200', userAgent, url)
  const response = await fetch(url, {
    headers: userAgent,
    signal,
  })

  if (response.status !== 200) {
    throw new Error(
      `Noospheric catalog GET ${url} responded with ${response.status}`,
    )
  }

  return response
}

export { fetchHttp200 }
