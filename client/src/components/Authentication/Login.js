const Login = () => {
  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          required
        />

        <button 
          type="submit" 
          className="login-button"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;