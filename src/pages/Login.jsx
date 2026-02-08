import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [isLoginView, setIsLoginView] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const heroVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
  };

  const formVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary text-text-primary overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!isLoginView ? (
          <motion.div
            key="hero"
            variants={heroVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-md w-full flex flex-col items-center text-center space-y-8"
          >
            {/* Animated Avatars Section */}
            <div className="relative w-48 h-48 mb-8 sm:w-64 sm:h-64">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 left-1/4 -translate-x-1/2 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-bg-surface overflow-hidden shadow-xl"
              >
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute bottom-2 right-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/20 overflow-hidden shadow-lg"
              >
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Anita"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute bottom-6 left-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-500/10 overflow-hidden shadow-md"
              >
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Best Social App to Make New Friends
            </h1>
            <p className="text-text-secondary text-lg">
              With Circles you will find new friends from various countries and
              regions of the world
            </p>

            <div className="w-full flex flex-col gap-4">
              <button
                onClick={() => navigate("/register")}
                className="w-full py-4 rounded-full bg-primary text-on-primary font-bold text-lg hover:opacity-90 transition-opacity"
              >
                Get Started
              </button>
              <button
                onClick={() => setIsLoginView(true)}
                className="w-full py-4 rounded-full border border-bg-surface hover:bg-bg-surface font-bold text-lg transition-colors"
              >
                Login
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-md w-full bg-bg-primary p-8 rounded-3xl shadow-2xl relative"
          >
            <button
              onClick={() => setIsLoginView(false)}
              className="absolute top-8 left-8 p-2 rounded-full hover:bg-bg-surface transition-colors"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="mt-12 text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
              <p className="text-text-secondary">
                Please enter your details to sign in.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold px-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-4 rounded-2xl bg-bg-surface border border-transparent focus:border-primary outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold px-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full p-4 pr-12 rounded-2xl bg-bg-surface border border-transparent focus:border-primary outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-error/10 text-error text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-primary text-on-primary font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
              >
                {isLoading ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="text-center mt-8 text-text-secondary">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-bold hover:underline"
              >
                Register Now.
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
