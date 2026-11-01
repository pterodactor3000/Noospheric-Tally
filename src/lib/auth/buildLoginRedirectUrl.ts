const buildLoginRedirectUrl = (requestUrl: URL): URL => {
  const loginUrl = new URL(requestUrl.href)
  loginUrl.pathname = '/login'
  loginUrl.searchParams.delete('code')
  return loginUrl
}

export { buildLoginRedirectUrl }
