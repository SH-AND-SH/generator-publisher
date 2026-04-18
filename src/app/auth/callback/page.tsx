import { AuthCallbackClient } from './callback-client'

function getSafeNext(nextParam?: string) {
  if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    return nextParam
  }

  return '/dashboard'
}

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return <AuthCallbackClient next={getSafeNext(params.next)} />
}
