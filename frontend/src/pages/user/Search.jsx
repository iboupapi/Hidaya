import { useState, useRef, useEffect, useCallback } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { audioAPI } from '../../services/api'
import { AudioCard } from '../../components/audio/AudioCard'
import { UnlockModal } from '../../components/audio/UnlockModal'

export default function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [locked, setLocked] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const timerRef = useRef(null)

  // Nettoyage du timer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const doSearch = useCallback(async (val) => {
    const query = val.trim()
    if (!query) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data } = await audioAPI.search(query, 1, 20)
      setResults(data.audios || [])
      setPage(data.pagination?.page || 1)
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || (data.audios || []).length)
      setSearched(true)
    } catch {
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    const query = q.trim()
    if (!query || page >= totalPages) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const { data } = await audioAPI.search(query, nextPage, 20)
      setResults((prev) => [...prev, ...(data.audios || [])])
      setPage(data.pagination?.page || nextPage)
      setTotalPages(data.pagination?.totalPages || totalPages)
    } catch {
      // silencieux : l'utilisateur peut réessayer via le bouton
    } finally {
      setLoadingMore(false)
    }
  }, [q, page, totalPages])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQ(val)

    if (timerRef.current) clearTimeout(timerRef.current)

    if (!val.trim()) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }

    timerRef.current = setTimeout(() => {
      doSearch(val)
    }, 400)
  }

  const clearQuery = () => {
    setQ('')
    setResults([])
    setSearched(false)
    setLoading(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return (
    <div className="min-h-screen">
      {/* En-tête fixe avec barre de recherche */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur-md border-b border-border-subtle px-4 py-3">
        <div className="max-w-lg mx-auto relative flex items-center">
          <SearchIcon
            size={18}
            className="absolute left-3.5 text-txt-disabled pointer-events-none"
          />
          <input
            value={q}
            onChange={handleInputChange}
            placeholder="Rechercher par titre, catégorie..."
            className="input-field pl-10 pr-10 py-2.5 w-full rounded-2xl bg-bg-card border border-border-subtle text-sm text-txt-primary placeholder:text-txt-disabled focus:border-green-dahira outline-none transition-colors"
            autoFocus
          />
          {q && (
            <button
              onClick={clearQuery}
              className="absolute right-3 text-txt-disabled hover:text-txt-primary p-1 rounded-full hover:bg-white/5 transition-colors"
              title="Effacer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Zone de résultats */}
      <div className="max-w-lg mx-auto px-4 mt-3">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-bg-card rounded-2xl border border-border-subtle animate-pulse"
              />
            ))}
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-20 bg-bg-card/40 border border-border-subtle rounded-2xl mt-2 px-4">
            <p className="text-txt-muted text-sm font-medium">
              Aucun résultat trouvé pour <span className="text-txt-primary font-semibold">"{q}"</span>
            </p>
            <p className="text-txt-disabled text-xs mt-1">
              Vérifiez l'orthographe ou essayez d'autres mots-clés.
            </p>
          </div>
        ) : !searched ? (
          <div className="text-center py-24 text-txt-muted">
            <div className="w-16 h-16 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center mx-auto mb-3 text-txt-disabled">
              <SearchIcon size={28} />
            </div>
            <p className="text-sm font-medium">Rechercher un audio</p>
            <p className="text-xs text-txt-disabled mt-1">
              Tapez un titre, une catégorie ou un mot-clé...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-1">
              Résultats ({total})
            </p>
            {results.map((a) => (
              <AudioCard 
                key={a.id} 
                audio={a} 
                variant="compact" // <-- Ajout de variant="compact"
                onLocked={setLocked} 
              />
            ))}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-2 py-2.5 rounded-2xl border border-border-subtle text-sm font-medium text-txt-muted hover:text-txt-primary hover:bg-bg-card/60 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Chargement...' : 'Charger plus de résultats'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de déverrouillage */}
      {locked && (
        <UnlockModal
          audio={locked}
          onClose={() => setLocked(null)}
          onUnlocked={() => {
            setLocked(null)
            doSearch(q)
          }}
        />
      )}
    </div>
  )
}