import '@/styles/globals.css'
import { useRouter } from 'next/router'
import { AuthProvider } from '@/contexts/AuthContext'
import { RestaurantProvider } from '@/contexts/RestaurantContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

/**
 * 🚀 APP WRAPPER
 * Configure les providers pour l'authentification et le contexte restaurant
 */
export default function App({ Component, pageProps }) {
  const router = useRouter()

  // Pages qui n'ont pas besoin d'auth (login, unauthorized)
  const publicPages = ['/login', '/unauthorized']
  const isPublicPage = publicPages.includes(router.pathname)

  // Pour les pages publiques, pas besoin de RestaurantProvider
  if (isPublicPage) {
    return (
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    )
  }

  // Pour les pages protégées/connectées
  return (
    <AuthProvider>
      <NotificationProvider>
        <RestaurantProvider>
          <Component {...pageProps} />
        </RestaurantProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}
