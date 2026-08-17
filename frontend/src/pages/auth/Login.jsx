import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    try {
      await login(form.email, form.password)
      toast.success('Bienvenue !')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Identifiants incorrects')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#1A4A1A] border-2 border-green-dahira flex items-center justify-center">
          <span className="text-yellow-accent font-bold text-xl">DI</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-txt-primary">Hidaya</h1>
          <p className="text-txt-muted text-sm">Dahiratoul Imane</p>
        </div>
      </div>
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <label className="text-xs text-txt-muted mb-1.5 block">Adresse email</label>
          <input name="email" type="email" value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))}
            placeholder="disciple@exemple.com" className="input-field" required />
        </div>
        <div>
          <label className="text-xs text-txt-muted mb-1.5 block">Mot de passe</label>
          <div className="relative">
            <input name="password" type={show ? 'text' : 'password'} value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
              placeholder="••••••••" className="input-field pr-11" required />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-disabled hover:text-txt-muted">
              {show ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? <span className="spinner" /> : <><LogIn size={16}/> Se connecter</>}
        </button>
      </form>
      <p className="mt-6 text-txt-muted text-sm">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-green-300 hover:text-yellow-accent transition-colors">S'inscrire</Link>
      </p>
    </div>
  )
}
