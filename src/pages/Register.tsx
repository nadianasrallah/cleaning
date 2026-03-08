import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
}

export default function Register() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{ type: string; message: string }>({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status.message) setStatus({ type: "", message: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    if (formData.password.length < 8) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        companyName: formData.companyName,
        role: 'owner',
      });
      
      toast.success("Account created successfully!");
      navigate("/admin");
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const features = [
    "Unlimited bookings",
    "Client portal",
    "SMS reminders",
    "Custom branding",
    "Marketing automation",
    "Analytics dashboard",
  ];

  return (
    <div
      className="min-h-screen flex font-sans text-slate-600 bg-white selection:bg-teal-100 selection:text-teal-900"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');
        `}
      </style>

      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-16 lg:py-12 bg-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-800 to-sky-900 opacity-90"></div>

        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-lg mx-auto relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-16 group w-fit">
            <div className="bg-white p-2.5 transition-transform group-hover:scale-105 shadow-xl">
              <Star className="h-6 w-6 text-teal-900 fill-teal-900" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight uppercase">
              CleanPro
            </span>
          </Link>

          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 leading-tight tracking-tight">
            Scale your business <br />
            <span className="text-teal-300">without the chaos.</span>
          </h2>
          <p className="text-xl text-teal-100 mb-12 font-light leading-relaxed max-w-md">
            Join thousands of cleaning companies using CleanPro to manage
            bookings, automate marketing, and delight clients.
          </p>
          <ul className="space-y-5">
            {features.map((feature) => (
              <li key={feature} className="flex items-center text-white group">
                <div className="h-6 w-6 bg-teal-700 flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-lg font-bold text-teal-50 tracking-wide">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-[440px]">
          <div className="lg:hidden flex items-center justify-center mb-8 gap-2">
            <div className="bg-teal-600 p-2">
              <Star className="h-6 w-6 text-white fill-white" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
              CleanPro
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Start your free trial
          </h2>
          <p className="text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-teal-600 hover:text-teal-700 transition-colors underline decoration-2 underline-offset-2"
            >
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {status.message && (
              <div
                className={`p-4 text-sm font-bold flex items-start gap-3 ${
                  status.type === "error"
                    ? "bg-red-50 text-red-700 border-l-4 border-red-500"
                    : "bg-teal-50 text-teal-800 border-l-4 border-teal-500"
                }`}
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                {status.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all rounded-none"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all rounded-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="companyName"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
              >
                Company name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all rounded-none"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all rounded-none"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
              >
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all rounded-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all rounded-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all rounded-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-none shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest transition-all mt-8"
            >
              {loading ? "Creating account..." : "Start Free Trial"}
            </button>

            <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed font-medium">
              By signing up, you agree to our{" "}
              <a href="#" className="underline hover:text-teal-600">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-teal-600">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
