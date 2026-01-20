import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PostsTable from './components/PostsTable'
import MapView from './components/MapView'
import './index.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(data?.session?.user ?? null)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      try {
        sub?.subscription?.unsubscribe?.()
      } catch (e) {
        // noop
      }
    }
  }, [])

  async function signIn() {
    // Use anonymous sign-in (no OAuth setup required)
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Sign in failed', error)
        alert('Sign in failed: ' + error.message)
      }
    } catch (e) {
      console.error('Sign in error', e)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🚨 RescueConnect</h1>
          <p className="text-gray-400 mb-6">Authority Dashboard</p>
          <button
            onClick={signIn}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Login as Authority
          </button>
        </div>
      </div>
    )
  }

  // Render current page
  function renderPage() {
    switch (currentPage) {
      case 'posts':
        return <PostsTable />
      case 'map':
        return <MapView />
      case 'settings':
        return (
          <div className="card">
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-gray-500 mt-2">Settings page coming soon.</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={signOut}
      />
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}
