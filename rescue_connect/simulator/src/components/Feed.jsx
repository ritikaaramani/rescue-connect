import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Feed({ refreshSignal = 0 }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  async function fetchPosts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data ?? [])
    } catch (err) {
      console.error('Error fetching posts', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal])

  return (
    <div className="mt-6 space-y-4">
      {loading && <div className="text-sm muted">Loading feed...</div>}

      {posts.length === 0 && !loading && (
        <div className="text-center muted">No posts yet</div>
      )}

      {posts.map((p) => (
        <div className="card" key={p.id}>
          {p.image_url && (
            // public URL from storage
            <img src={p.image_url} alt={p.caption ?? 'image'} className="w-full rounded mb-2 object-cover" />
          )}
          <div className="text-sm">{p.caption}</div>
          <div className="text-xs muted mt-2">User: {p.user_id ?? 'anonymous'}</div>
          <div className="text-xs muted">{p.status}</div>
          <div className="text-xs muted">{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
        </div>
      ))}
    </div>
  )
}
