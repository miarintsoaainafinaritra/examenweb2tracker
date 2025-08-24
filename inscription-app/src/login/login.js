/* eslint-disable jsx-a11y/anchor-is-valid */
import { useState } from 'react';
import { FaPiggyBank, FaEye, FaEyeSlash } from 'react-icons/fa';

function Login({ onToggleForm }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="app-container">
      <div className="login-card">
        <div className="logo-container">
          <FaPiggyBank className="app-logo" />
          <h1 className="app-title">MoneyTracker</h1>
        </div>
        
        <h2 className="login-title">Connexion</h2>
        
        <form className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              className="form-input"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                name="password"
                className="form-input"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="button-group">
            <button type="submit" className="login-button">
                  <a  href='/dashboard' className=''>
                    Se connecter
                  </a>
            </button>
          </div>
        </form>
        
        <p className="signup-redirect">
          Pas encore de compte ?{' '}
          <a href="#" className="signup-link" onClick={onToggleForm}>
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}


function Register({ onToggleForm }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="app-container">
      <div className="login-card">
        <div className="logo-container">
          <FaPiggyBank className="app-logo" />
          <h1 className="app-title">MoneyTracker</h1>
        </div>
        
        <h2 className="login-title">Inscription</h2>
        
        <form className="login-form">
          <div className="form-group">
            <label htmlFor="name">Nom complet</label>
            <input 
              type="text" 
              id="name" 
              name="name"
              className="form-input"
              placeholder="Votre nom complet"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              className="form-input"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                name="password"
                className="form-input"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div className="password-input-container">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                id="confirmPassword" 
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="button-group">
            <button type="submit" className="login-button">
             
              <a href='/dashboard' className=''>
                     S'inscrire
              </a>
            </button>
          </div>
        </form>
        
        <p className="signup-redirect">
          Déjà un compte ?{' '}
          <a href="#" className="signup-link" onClick={onToggleForm}>
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}

function AuthApp() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <>
      {isLogin ? (
        <Login onToggleForm={toggleForm} />
      ) : (
        <Register onToggleForm={toggleForm} />
      )}
    </>
  );
}

export default AuthApp;