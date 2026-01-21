import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PostsTable from './components/PostsTable'
import MapView from './components/MapView'
import DispatchView from './components/DispatchView'
import HeatmapView from './components/HeatmapView'
import './index.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedPost, setSelectedPost] = useState(null) // For viewing a specific post on map
  const [dispatchPost, setDispatchPost] = useState(null) // For dispatching a specific post

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

  // Login screen with landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute top-60 -left-20 w-60 h-60 bg-red-500 rounded-full opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-500 rounded-full opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <span className="text-2xl font-bold text-white">RescueConnect</span>
            </div>
            <button
              onClick={signIn}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              Login
            </button>
          </nav>

          {/* Hero Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-8 pt-20 pb-32 text-center">
            <div className="inline-block px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-8 border border-blue-500/30">
              🛡️ AI/ML-Powered Emergency Response Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Saving Lives with
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Real-Time Intelligence
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              RescueConnect is an AI/ML-powered disaster response platform that analyzes social media posts in real-time 
              to detect emergencies, extract locations, and coordinate rescue operations efficiently.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={signIn}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-105 shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <span>🔐</span> Access Authority Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-900/50 py-20 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-4">How RescueConnect Works</h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Our AI/ML-powered platform streamlines disaster response from detection to rescue.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all hover:scale-105 group">
                <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
                  <span className="text-3xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Social Media Integration</h3>
                <p className="text-gray-400">
                  Citizens post disaster reports with images and locations. Our system automatically collects and processes these in real-time.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all hover:scale-105 group">
                <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI/ML-Powered Analysis</h3>
                <p className="text-gray-400">
                  Custom trained ML models and Google Gemini AI analyze images to detect disaster type, severity, and extract GPS coordinates from visual landmarks.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 hover:border-green-500/50 transition-all hover:scale-105 group">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500/30 transition-colors">
                  <span className="text-3xl">🚁</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Rapid Dispatch</h3>
                <p className="text-gray-400">
                  Authorities verify reports, dispatch rescue teams, and notify citizens. Complete transparency from report to rescue.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-400">Monitoring</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">&lt;5min</div>
              <div className="text-gray-400">Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">AI/ML</div>
              <div className="text-gray-400">Powered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-400 mb-2">Real-time</div>
              <div className="text-gray-400">Tracking</div>
            </div>
          </div>
        </div>

        {/* Key Capabilities */}
        <div className="bg-gray-800/30 py-20 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Key Capabilities</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-2xl">🗺️</div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Interactive Map View</h4>
                  <p className="text-gray-400 text-sm">View all incidents on a map with severity indicators and one-click dispatch.</p>
                </div>
              </div>
              <div className="flex gap-4 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-2xl">🔥</div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Heatmap Analysis</h4>
                  <p className="text-gray-400 text-sm">Identify disaster hotspots and allocate resources strategically.</p>
                </div>
              </div>
              <div className="flex gap-4 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-2xl">🔔</div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Email Notifications</h4>
                  <p className="text-gray-400 text-sm">Citizens receive instant updates when rescue teams are dispatched.</p>
                </div>
              </div>
              <div className="flex gap-4 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-2xl">🔍</div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Duplicate Detection</h4>
                  <p className="text-gray-400 text-sm">AI/ML automatically detects duplicate reports to prevent redundant dispatches.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Save Lives?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Access the authority dashboard to monitor, verify, and respond to disaster reports in real-time.
          </p>
          <button
            onClick={signIn}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-105 shadow-xl shadow-blue-500/30"
          >
            🚀 Get Started Now
          </button>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-12 px-8 bg-gray-900/80">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <span className="text-xl font-bold text-white">RescueConnect</span>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">Built with ❤️ by</p>
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Students of RV College of Engineering, Bangalore
              </p>
            </div>
            <div className="text-gray-600 text-sm mt-4">
              © 2026 RescueConnect. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Navigate to map with a specific post
  function viewPostOnMap(post) {
    setSelectedPost(post)
    setCurrentPage('map')
  }

  // Navigate to dispatch with a specific post
  function dispatchTeam(post) {
    setDispatchPost(post)
    setCurrentPage('dispatch')
  }

  // Render current page
  function renderPage() {
    switch (currentPage) {
      case 'posts':
        return <PostsTable onViewOnMap={viewPostOnMap} />
      case 'map':
        return <MapView selectedPost={selectedPost} onClearSelection={() => setSelectedPost(null)} onDispatchTeam={dispatchTeam} />
      case 'dispatch':
        return <DispatchView selectedPost={dispatchPost} onClearSelection={() => setDispatchPost(null)} />
      case 'heatmap':
        return <HeatmapView />
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
