import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Star, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CompanyBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  metaTitle: string | null;
}

interface CompanyInfo {
  id: string;
  name: string;
  slug: string | null;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [status, setStatus] = useState<{ type: string; message: string }>({ type: "", message: "" });

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultPrimary = "#0d9488";
  const defaultSecondary = "#0284c7";

  useEffect(() => {
    const slug = searchParams.get("company");
    const host = window.location.hostname || "";

    const isDefaultDomain =
      !host ||
      host.includes("replit.dev") ||
      host.includes("googleusercontent") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1");

    if (slug) {
      loadBrandingBySlug(slug);
    } else if (!isDefaultDomain && host) {
      loadBrandingByDomain(host);
    }
  }, [searchParams]);

  async function loadBrandingBySlug(slug: string) {
    if (!slug) return;
    try {
      const response = await fetch(`/api/companies/by-slug/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        if (data.branding) {
          setBranding(data.branding);
        }
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    }
  }

  async function loadBrandingByDomain(domain: string) {
    if (!domain) return;
    try {
      const response = await fetch(`/api/companies/by-domain/${domain}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        if (data.branding) {
          setBranding(data.branding);
        }
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const user = await login(email, password);
      toast.success("Welcome back!");
      
      if (user?.role === "client") {
        navigate("/client");
      } else {
        navigate("/admin");
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Login failed" });
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const primaryColor = branding?.primaryColor || defaultPrimary;
  const secondaryColor = branding?.secondaryColor || defaultSecondary;
  const companyName = company?.name || "CleanPro";
  const logoUrl = branding?.logoUrl;

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-600 selection:bg-teal-100 selection:text-teal-900"
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}15 100%)`,
        backgroundColor: "#f8fafc",
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');
        `}
      </style>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-16 w-auto" />
          ) : (
            <div
              className="p-3 transition-transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Star className="h-8 w-8 text-white fill-white" />
            </div>
          )}
        </div>
        <h2 className="mt-8 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to {companyName}
        </h2>
        {!company && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold hover:opacity-80 transition-opacity"
              style={{ color: primaryColor }}
            >
              Start your free trial
            </Link>
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[440px]">
        <div
          className="bg-white py-10 px-6 shadow-2xl sm:px-10 border-t-4"
          style={{ borderColor: primaryColor }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {status.message && (
              <div
                className={`p-4 text-sm font-bold flex items-start gap-3 border-l-4 ${
                  status.type === "error"
                    ? "bg-red-50 text-red-700 border-red-500"
                    : "bg-teal-50 text-teal-800 border-teal-500"
                }`}
              >
                {status.type === "error" ? (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <Check className="h-5 w-5 shrink-0" />
                )}
                {status.message}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:bg-white transition-all rounded-none appearance-none"
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                  e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgb(226, 232, 240)";
                  e.target.style.boxShadow = "none";
                }}
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:bg-white transition-all rounded-none appearance-none"
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                    e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgb(226, 232, 240)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 border-slate-300 rounded-none focus:ring-offset-0"
                  style={{ accentColor: primaryColor }}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm font-medium text-slate-600"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-bold hover:opacity-80 transition-opacity"
                  style={{ color: primaryColor }}
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent shadow-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest transition-all rounded-none mt-8"
              style={{ backgroundColor: primaryColor }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = secondaryColor;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="px-4 bg-white text-slate-400 font-bold">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/"
                className="w-full flex justify-center py-3 px-4 border border-slate-300 shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all rounded-none uppercase tracking-widest"
              >
                Return to homepage
              </Link>
            </div>
          </div>
        </div>

        {company && (
          <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            Powered by CleanPro
          </p>
        )}
      </div>
    </div>
  );
}
