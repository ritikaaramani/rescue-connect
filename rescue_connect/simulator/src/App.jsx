import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import CreatePost from './components/CreatePost'
import Feed from './components/Feed'

export default function App() {
  const [user, setUser] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // FIXED: Only try Anonymous login (since that is what we enabled)
  async function signIn() {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error("Login failed:", error.message)
      alert("Login Error: " + error.message)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  function handlePosted() {
    setRefreshSignal((s) => s + 1)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>
  }

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-2 text-blue-600">RescueConnect</h1>
          <p className="text-gray-600 mb-6">Disaster Simulation Login</p>
          <button 
            onClick={signIn} 
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Enter Simulator (Anonymous)
          </button>
        </div>
      </div>
    )
  }

  // Dashboard Screen
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl text-blue-600">RescueConnect <span className="text-xs text-gray-400 font-normal">SIMULATOR</span></div>
          <button 
            onClick={signOut} 
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <CreatePost user={user} onPosted={handlePosted} />
        <Feed refreshSignal={refreshSignal} />
      </main>
    </div>
  )
}