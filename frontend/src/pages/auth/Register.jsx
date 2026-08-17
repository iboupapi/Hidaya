import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const h = e => setForm(f => ({...f, [e.target.name]: e.target.value}))

  const submit = async (e) => {
    e.preventDefault()
    try {
      await register(form.username, form.email, form.password)
      toast.success('Compte créé !')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur d'inscription")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#1A4A1A] border-2 border-green-dahira flex items-center justify-center">
          <span className="text-yellow-accent font-bold text-xl">DI</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-txt-primary">Créer un compte</h1>
          <p className="text-txt-muted text-sm">Rejoindre la Dahiratoul Imane</p>
        </div>
      </div>
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-4">
        {[
          { name:'username', label:"Nom d'utilisateur", placeholder:'ibrahima', type:'text' },
          { name:'email',    label:'Adresse email',      placeholder:'disciple@exemple.com', type:'email' },
          { name:'password', label:'Mot de passe',       placeholder:'••••••••', type:'password' },
        ].map(f => (
          <div key={f.name}>
            <label className="text-xs text-txt-muted mb-1.5 block">{f.label}</label>
            <input name={f.name} type={f.type} value={form[f.name]} onChange={h}
              placeholder={f.placeholder} className="input-field" required />
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? <span className="spinner" /> : <><UserPlus size={16}/> Créer mon compte</>}
        </button>
      </form>
      <p className="mt-6 text-txt-muted text-sm">
        Déjà membre ?{' '}
        <Link to="/login" className="text-green-300 hover:text-yellow-accent transition-colors">Se connecter</Link>
      </p>
    </div>
  )
}
