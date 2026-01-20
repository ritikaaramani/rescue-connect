import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CreatePost({ user, onPosted }) {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleUpload(e) {
    e.preventDefault()
    setError(null)
    if (!file) {
      setError('Please select an image to upload')
      return
    }
    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id ?? 'anon'}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('disaster_images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('disaster_images')
        .getPublicUrl(filePath)

      const imageUrl = publicData?.publicUrl ?? ''

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user?.id ?? null,
        image_url: imageUrl,
        caption,
        status: 'pending',
      })

      if (insertError) throw insertError

      setCaption('')
      setFile(null)
      onPosted?.()
    } catch (err) {
      setError(err.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold">Create Report</h3>
      <form onSubmit={handleUpload} className="mt-3 space-y-3">
        <textarea
          className="w-full rounded border-gray-200 dark:border-gray-700 p-2 bg-white/60 dark:bg-gray-900 text-sm"
          placeholder="Describe the situation, location, needs..."
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
          <div className="text-sm muted">Status: pending</div>
        </div>
      </form>
    </div>
  )
}
