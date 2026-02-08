import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, User, Mail, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";

const Register = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    gender: "male",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await register(formData);
      toast.success("Welcome to Circles!");
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.msg || err.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary text-text-primary overflow-hidden relative">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl w-full bg-bg-primary p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative border border-bg-surface"
      >
        <button
          onClick={() => navigate("/login")}
          className="absolute top-8 left-8 p-3 rounded-full bg-bg-surface hover:bg-primary/10 transition-colors group"
        >
          <ArrowLeft
            size={24}
            className="group-hover:-translate-x-1 transition-transform"
          />
        </button>

        <div className="text-center mb-10 mt-6">
          <h2 className="text-4xl font-black mb-3 tracking-tight">
            Create Account
          </h2>
          <p className="text-text-secondary font-medium">
            Join the community and start connecting!
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold px-1 ml-1">Full Name</label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
                  size={20}
                />
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full p-4 pl-12 rounded-2xl bg-bg-surface border border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold px-1 ml-1">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">
                  @
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="w-full p-4 pl-10 rounded-2xl bg-bg-surface border border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold px-1 ml-1">Email Address</label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
                size={20}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full p-4 pl-12 rounded-2xl bg-bg-surface border border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold px-1 ml-1">Password</label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className="w-full p-4 pl-12 pr-12 rounded-2xl bg-bg-surface border border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold px-1 ml-1">Identify as</label>
            <div className="flex gap-4">
              {["male", "female", "other"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, gender: g }))}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                    formData.gender === g
                      ? "bg-primary border-primary text-on-primary shadow-lg shadow-primary/20"
                      : "bg-bg-surface border-transparent text-text-secondary hover:border-primary/30"
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-error/10 text-error text-sm font-bold text-center border border-error/20"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 rounded-2xl bg-primary text-on-primary font-black text-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/25 mt-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Creating Account...
              </div>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-text-secondary font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-black hover:underline underline-offset-4"
          >
            Sign In.
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
