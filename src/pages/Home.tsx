import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  Smartphone,
  Globe,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
  Shield,
  CreditCard,
  Play,
  Layout,
  ChevronRight,
} from "lucide-react";

// Main App Component
export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description:
        "Automated booking system with drag-and-drop calendar, recurring appointments, route optimization for staff, and intelligent conflict detection that prevents double-bookings.",
    },
    {
      icon: Users,
      title: "Client Management",
      description:
        "Complete CRM with detailed client profiles, service history, property notes, billing preferences, and automated follow-ups to build lasting customer relationships.",
    },
    {
      icon: MessageSquare,
      title: "In-App Messaging",
      description:
        "Secure, professional communication hub where clients can message your team, share photos of special requests, and receive updates without exchanging personal numbers.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Real-time insights into revenue trends, staff performance, client retention rates, and booking patterns to help you make data-driven business decisions.",
    },
    {
      icon: Smartphone,
      title: "SMS Reminders",
      description:
        "Reduce no-shows by up to 80% with automated text reminders sent 24 and 2 hours before appointments, plus instant booking confirmations and rescheduling options.",
    },
    {
      icon: Globe,
      title: "Custom Branding",
      description:
        "Full white-label solution featuring your logo, brand colors, custom domain, and personalized email templates so every touchpoint reflects your business identity.",
    },
  ];

  const pricing = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      description: "Ideal for independent cleaners and small home-based operations just getting started",
      features: [
        "Up to 50 bookings/month",
        "1 staff member account",
        "Visual calendar with drag-and-drop",
        "Automated email confirmations",
        "Branded client booking portal",
      ],
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "Built for growing teams ready to scale operations and streamline communication",
      features: [
        "Unlimited bookings",
        "Up to 10 staff members",
        "SMS appointment reminders",
        "Full brand customization",
        "Revenue and performance analytics",
        "Priority email and chat support",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "Complete solution for established cleaning companies managing multiple crews",
      features: [
        "Everything in Professional",
        "Unlimited staff accounts",
        "Custom domain (yourcompany.com)",
        "REST API for custom integrations",
        "Dedicated account manager",
        "Zapier, QuickBooks, and CRM integrations",
      ],
    },
  ];

  return (
    <div
      className="min-h-screen text-slate-600 bg-white"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {/* Injecting a premium font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');

          /* Custom Scrollbar for a polished feel */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9; 
          }
          ::-webkit-scrollbar-thumb {
            background: #94a3b8; 
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #64748b; 
          }
        `}
      </style>

      {/* Navigation */}
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3" : "bg-transparent py-6"}`}
      >
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <div className="bg-sky-500 p-2.5 transition-colors group-hover:bg-sky-600 shadow-sm">
                <Star className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                CleanPro
              </span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-10 font-bold text-slate-600 text-xs uppercase tracking-widest">
              <a
                href="#features"
                className="hover:text-sky-600 transition-colors"
              >
                Software
              </a>
              <a
                href="#pricing"
                className="hover:text-sky-600 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#benefits"
                className="hover:text-sky-600 transition-colors"
              >
                Why CleanPro
              </a>
              <a href="#" className="hover:text-sky-600 transition-colors">
                Resources
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="/login"
                className="text-slate-900 font-bold hover:text-sky-600 transition-colors text-xs uppercase tracking-widest"
              >
                Log In
              </a>
              <a
                href="/register"
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg rounded-none"
              >
                Get a Demo
              </a>
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 text-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-slate-100 p-8 shadow-2xl flex flex-col gap-8 h-screen z-50">
            <a
              href="#features"
              className="text-2xl font-extrabold text-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Software
            </a>
            <a
              href="#pricing"
              className="text-2xl font-extrabold text-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#benefits"
              className="text-2xl font-extrabold text-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Why CleanPro
            </a>
            <hr className="border-slate-100" />
            <a href="/login" className="text-xl font-bold text-slate-600">
              Log In
            </a>
            <a
              href="/register"
              className="bg-teal-600 text-white px-6 py-4 font-bold w-full text-center uppercase tracking-widest text-sm rounded-none"
            >
              Get a Demo
            </a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-32 bg-slate-50 relative overflow-hidden">
        {/* Richer geometric pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        ></div>

        {/* Soft radial gradient for depth */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-sky-100/40 blur-[100px] rounded-full pointer-events-none"></div>
        {/* Adding a subtle teal gradient accent */}
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-teal-100/30 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col items-center gap-20">
            <div className="w-full max-w-4xl space-y-10 text-center">
              <div className="inline-flex items-center gap-3 border-b-2 border-sky-500 pb-1 justify-center">
                <span className="text-sky-600 font-extrabold text-xs uppercase tracking-widest">
                  Business Software
                </span>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                  Rated #1 in 2024
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Simplicity for your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-500">
                  cleaning business.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-light max-w-2xl mx-auto">
                The all-in-one platform built specifically for residential and commercial cleaning companies. Manage appointments, payments, staff schedules, and client relationships from a single powerful dashboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-0 w-full sm:w-auto shadow-xl justify-center">
                <a
                  href="/register"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-6 font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-none flex-1 sm:flex-none min-w-[200px]"
                >
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </a>
                <button className="bg-white hover:bg-slate-50 text-slate-800 border-l border-slate-100 px-10 py-6 font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-none flex-1 sm:flex-none min-w-[200px]">
                  <Play className="h-4 w-4 fill-slate-800" /> Watch Video
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-500" /> No credit card
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-500" /> Cancel anytime
                </span>
              </div>
            </div>

            <div className="w-full max-w-5xl">
              {/* Sharp, Elevated Image Container */}
              <div className="relative p-3 bg-white shadow-2xl z-10">
                <div className="aspect-video bg-slate-900 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-700"></div>
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500"></div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-20 bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                      <Play className="h-8 w-8 text-teal-600 fill-teal-600 ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative graphic behind image */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-sky-500/10 -z-10"></div>
              {/* Adding a second decorative graphic in teal */}
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-teal-500/10 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Clean, Spacious Layout */}
      <section className="py-28 bg-white border-b border-slate-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center gap-24">
            <div className="md:w-1/2 relative group">
              {/* Sharp offset background */}
              <div className="absolute top-6 left-6 w-full h-full bg-teal-50 z-0 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2"></div>
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Staff Scheduling"
                className="w-full relative z-10 shadow-xl grayscale-[10%] hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="md:w-1/2">
              <span className="text-teal-600 font-extrabold text-xs uppercase tracking-widest mb-4 block">
                Organization
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
                Scheduling that <br />
                <span className="text-sky-600">flows naturally.</span>
              </h2>
              <p className="text-lg text-slate-500 mb-12 leading-relaxed font-light">
                Stop playing phone tag and juggling spreadsheets. Our intelligent scheduling system automatically handles recurring weekly, bi-weekly, and monthly appointments while detecting conflicts before they happen. Assign the right cleaner to the right job based on location, skills, and availability.
              </p>
              <div className="space-y-0 border-t border-slate-100">
                {[
                  "Drag & drop calendar with real-time updates",
                  "Automated conflict alerts and double-booking prevention",
                  "Recurring appointment logic with flexible frequencies",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-slate-100 group cursor-pointer hover:pl-4 transition-all duration-300"
                  >
                    <span className="text-lg text-slate-700 font-bold group-hover:text-sky-600 transition-colors">
                      {item}
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Reversed */}
      <section className="py-28 bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row-reverse items-center gap-24">
            <div className="md:w-1/2 relative group">
              <div className="absolute bottom-6 right-6 w-full h-full border-2 border-slate-200 z-0 transition-transform duration-500 group-hover:-translate-x-2 group-hover:-translate-y-2"></div>
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Client Analytics"
                className="w-full relative z-10 shadow-xl bg-white p-3"
              />
            </div>
            <div className="md:w-1/2">
              <span className="text-teal-600 font-extrabold text-xs uppercase tracking-widest mb-4 block">
                Growth
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
                Turn first-time clients <br />
                <span className="text-sky-600">into regulars.</span>
              </h2>
              <p className="text-lg text-slate-500 mb-12 leading-relaxed font-light">
                Acquiring a new customer costs 5x more than retaining an existing one. Our built-in marketing automation keeps your brand top-of-mind with personalized follow-ups, satisfaction surveys, and timely re-booking reminders that drive repeat business.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-white p-10 shadow-sm border-t-4 border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all group">
                  <MessageSquare className="h-10 w-10 text-slate-300 group-hover:text-teal-600 mb-6 transition-colors" />
                  <h4 className="text-xl font-bold text-slate-900 mb-3">
                    Email Campaigns
                  </h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Send automated post-cleaning satisfaction surveys, seasonal promotions, and personalized re-booking reminders that keep clients coming back.
                  </p>
                </div>
                <div className="bg-white p-10 shadow-sm border-t-4 border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all group">
                  <Users className="h-10 w-10 text-slate-300 group-hover:text-teal-600 mb-6 transition-colors" />
                  <h4 className="text-xl font-bold text-slate-900 mb-3">
                    Client Portal
                  </h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Give clients 24/7 access to view booking history, pay invoices, update payment methods, and schedule new appointments on their own time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - Minimalist & Spacious */}
      <section id="features" className="py-28 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mb-24">
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-8">
              The Essentials.
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl font-light leading-relaxed">
              Every tool you need to run a professional cleaning operation, from first contact to final invoice. Built by industry experts who understand the unique challenges of residential and commercial cleaning businesses.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-sky-50 flex items-center justify-center group-hover:bg-sky-600 transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-sky-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-slate-500 leading-relaxed pl-16 border-l border-slate-100 group-hover:border-teal-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - High Contrast */}
      <section
        id="pricing"
        className="py-28 bg-slate-900 text-white relative overflow-hidden"
      >
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
                Transparent Pricing
              </h2>
              <p className="text-xl text-slate-400 font-light">
                Choose the plan that fits your business stage.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-slate-400">
              <span>Monthly</span>
              <div className="w-12 h-6 bg-sky-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
              <span className="text-white">Yearly (Save 20%)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-0 max-w-7xl mx-auto border border-slate-700 divide-y md:divide-y-0 md:divide-x divide-slate-700 bg-slate-800/50 backdrop-blur-sm">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`relative p-12 flex flex-col hover:bg-slate-800 transition-colors ${
                  plan.popular ? "bg-slate-800 z-10" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-teal-500"></div>
                )}

                <div className="mb-8 flex-grow">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-bold uppercase tracking-widest">
                      {plan.name}
                    </h3>
                    {plan.popular && (
                      <Star className="h-5 w-5 text-teal-500 fill-teal-500" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-6xl font-extrabold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-400 mb-10 h-10 leading-relaxed">
                    {plan.description}
                  </p>

                  <ul className="space-y-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <Check
                          className={`h-5 w-5 shrink-0 ${plan.popular ? "text-teal-500" : "text-slate-600"}`}
                        />
                        <span className="text-sm font-bold text-slate-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="/register"
                  className={`block text-center w-full py-5 font-bold uppercase tracking-widest text-xs transition-all ${
                    plan.popular
                      ? "bg-teal-600 hover:bg-teal-700 text-white"
                      : "bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Start Free Trial
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-3 gap-16 text-center divide-x divide-slate-200">
            {[
              {
                icon: CreditCard,
                title: "Secure Payments",
                desc: "Accept credit cards, debit cards, and ACH payments securely through PCI-compliant Stripe integration with automatic invoicing and payment tracking.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                desc: "256-bit SSL encryption, SOC 2 compliant infrastructure, and automatic daily backups keep your client data and financial records protected.",
              },
              {
                icon: Globe,
                title: "Access Anywhere",
                desc: "Cloud-based platform works on any device with a browser. Update schedules from the field, check bookings from home, or run reports on the go.",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center px-8 group">
                <item.icon className="h-10 w-10 text-slate-400 mb-6 group-hover:text-teal-600 transition-colors" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-base leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer - Flat Color Block */}
      <section className="bg-teal-900 py-24 relative overflow-hidden">
        {/* Texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-transparent to-sky-900/50 opacity-50"></div>

        <div className="container mx-auto px-6 md:px-12 text-center text-white relative z-10">
          <h2 className="text-5xl md:text-7xl font-extrabold mb-10 tracking-tight">
            Ready to scale?
          </h2>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
            Join over 500 cleaning companies across North America who have streamlined their operations with CleanPro.
            <br />
            Start your 14-day free trial today with full access to all features.
          </p>
          <div className="flex flex-col sm:flex-row gap-0 justify-center shadow-2xl inline-flex">
            <a
              href="/register"
              className="bg-white text-teal-900 px-12 py-6 font-bold uppercase tracking-widest text-sm hover:bg-slate-100 transition-colors rounded-none min-w-[240px]"
            >
              Start Free Trial
            </a>
            <a
              href="#"
              className="bg-teal-800 text-white px-12 py-6 font-bold uppercase tracking-widest text-sm hover:bg-teal-700 transition-colors rounded-none min-w-[240px]"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-16 text-sm border-t border-slate-200">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-sky-500 p-2">
                  <Star className="h-5 w-5 text-white fill-white" />
                </div>
                <span className="text-2xl font-extrabold text-slate-900 uppercase tracking-tighter">
                  CleanPro
                </span>
              </div>
              <p className="leading-relaxed text-base font-light max-w-xs">
                The leading all-in-one business management platform designed exclusively for residential and commercial cleaning companies. Trusted by professionals since 2020.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="h-12 w-12 bg-slate-50 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-colors"
                >
                  <Globe className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-12 w-12 bg-slate-50 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-colors"
                >
                  <Layout className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-slate-900 font-extrabold mb-8 text-xs uppercase tracking-widest">
                Product
              </h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#features"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    API
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-extrabold mb-8 text-xs uppercase tracking-widest">
                Company
              </h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-extrabold mb-8 text-xs uppercase tracking-widest">
                Support
              </h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Status
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-sky-600 transition-colors font-medium"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-xs uppercase tracking-widest font-bold">
            <p>
              &copy; {new Date().getFullYear()} CleanPro Inc. All rights
              reserved.
            </p>
            <div className="flex gap-10">
              <a href="#" className="hover:text-sky-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-sky-600 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-sky-600 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
