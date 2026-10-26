import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Campus3DHero from '../../components/landing/Campus3DHero';
import ParcelUnboxIntro from '../../components/landing/ParcelUnboxIntro';
import {
  Package,
  Shield,
  KeyRound,
  Building,
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  Zap,
  Layers,
  Database,
  Cloud,
  Eye,
  Check,
  Camera,
  Play,
} from 'lucide-react';

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showUnboxIntro, setShowUnboxIntro] = useState(true);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [sandboxLoadingRole, setSandboxLoadingRole] = useState(null);

  // 1-Click Launch from Sandbox
  const handleQuickLaunch = async (email, password, redirectPath) => {
    try {
      setSandboxLoadingRole(email);
      await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      alert('Login failed. Redirecting to manual login page.');
      navigate('/login');
    } finally {
      setSandboxLoadingRole(null);
    }
  };

  const workflowSteps = [
    {
      id: 0,
      title: '1. Courier Arrival at Campus Gate',
      subtitle: 'Delivery executive from Amazon, Flipkart, or BlueDart arrives at Hostel Gate 1.',
      icon: Truck,
      color: 'from-blue-600 to-indigo-600',
      guardAction: 'Guard enters tracking number or searches student by room number.',
      studentAction: 'Pre-registered parcels are automatically cleared for gate reception.',
      badge: 'Arrival Detection',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      imageAlt: 'Courier arrival and package scan at campus gate',
      locationTag: 'Hostel Gate 1 Checkpoint',
    },
    {
      id: 1,
      title: '2. Real-Time Student Consent Sync',
      subtitle: 'For unexpected parcels, an instant consent prompt is pushed to the student.',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      guardAction: 'System awaits student decision or applies hostel standing policy.',
      studentAction: 'Student taps "Grant Permission" in real-time via Socket.IO.',
      badge: 'Consent Authorization',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      imageAlt: 'Hostel resident student receiving mobile push consent',
      locationTag: 'Dorm Room 101 Alert',
    },
    {
      id: 2,
      title: '3. Physical Custody & Shelf Tagging',
      subtitle: 'Guard accepts box, inspects condition, and assigns a designated storage rack.',
      icon: MapPin,
      color: 'from-emerald-600 to-teal-600',
      guardAction: 'Logs condition (Intact/Damaged) and assigns "Shelf B-2".',
      studentAction: 'Student receives instant notification with exact shelf coordinates.',
      badge: 'Intake Custody',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      imageAlt: 'Organized hostel parcel rack shelves',
      locationTag: 'Hostel H-1 Storeroom (Shelf B-2)',
    },
    {
      id: 3,
      title: '4. Cryptographic Single-Use OTP Handover',
      subtitle: 'Student collects package using a salted 6-digit code verified in constant-time.',
      icon: KeyRound,
      color: 'from-purple-600 to-indigo-700',
      guardAction: 'Guard inputs code on terminal; atomic DB update locks against reuse.',
      studentAction: 'Presents 6-digit code on phone; status updates to COLLECTED.',
      badge: 'Zero-Dispute Handover',
      image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
      imageAlt: 'Guard handing over parcel with verified OTP',
      locationTag: 'Intake Desk Handover',
    },
  ];

  const campusGalleries = [
    {
      title: 'University Residence Halls',
      subtitle: 'Hostel H-1 & H-2 Campus Hub',
      desc: 'Central residence housing 450+ students with high daily courier volume from Amazon, Flipkart, and Zepto.',
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      badge: 'Residence Complex',
    },
    {
      title: 'Gate 1 Security Intake',
      subtitle: 'Guard Inspection & Barcode Scan',
      desc: 'Uniformed guards verify delivery identity, scan tracking numbers, and log box condition with Cloudinary photos.',
      image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
      badge: 'Gate 1 Terminal',
    },
    {
      title: 'Organized Storage Racks',
      subtitle: 'Rack-Indexed Parcel Shelves',
      desc: 'Dedicated parcel shelves (A-1 through D-8) ensure zero misplaced boxes and instant 10-second retrievals.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      badge: 'Shelf Custody',
    },
    {
      title: 'Zero-Dispute Collection',
      subtitle: 'Cryptographic OTP Handover',
      desc: 'Students pick up deliveries between classes using dynamic single-use OTPs verified in constant-time.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      badge: 'Student Handover',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
      {/* 0. INTERACTIVE 3D PARCEL UNBOXING CINEMA */}
      {showUnboxIntro && (
        <ParcelUnboxIntro
          onComplete={() => setShowUnboxIntro(false)}
          onSkip={() => setShowUnboxIntro(false)}
        />
      )}

      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Parcel<span className="text-indigo-400">Track</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Hostel OS
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                Campus Parcel Reception & Handover
              </span>
            </div>
          </Link>

          {/* Quick Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#gallery" className="hover:text-white transition">Campus Life</a>
            <a href="#workflow" className="hover:text-white transition">How It Works</a>
            <a href="#personas" className="hover:text-white transition">Stakeholders</a>
            <a href="#comparison" className="hover:text-white transition">Why ParcelTrack</a>
            <a href="#sandbox" className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Test Sandbox</span>
            </a>
          </nav>

          {/* User Auth Action & 3D Unboxing Replay Trigger */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowUnboxIntro(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95 shadow-xs"
              title="Re-open the 3D unboxing animation"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">3D Unboxing</span>
            </button>

            {user ? (
              <button
                onClick={() => {
                  const routes = { STUDENT: '/student', GUARD: '/guard', WARDEN: '/warden', ADMIN: '/admin' };
                  navigate(routes[user.role] || '/student');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95"
              >
                <span>Dashboard ({user.name.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <a
                  href="#sandbox"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md shadow-indigo-600/25 transition active:scale-95"
                >
                  <span>Sandbox Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH HOSTEL BACKDROP & 3D VISUALIZER */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Real Campus Hostel Photography Background with Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity filter blur-xs pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />

        {/* Glow Gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 uppercase tracking-wider">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Hostel H-1 Residence Logistics</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Smart Parcel Reception &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                Cryptographic Handover
              </span>{' '}
              for Hostels.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Eliminating lost packages, delivery gate chaos, and disputes across university dormitories. Combines pre-arrival authorizations, physical shelf tracking, and salted 6-digit OTP verification.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => setShowUnboxIntro(true)}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-amber-950" />
                <span>Watch 3D Parcel Unboxing</span>
              </button>

              <a
                href="#sandbox"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-indigo-500/30 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>1-Click Test Sandbox</span>
              </a>

              <a
                href="#gallery"
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-bold text-xs sm:text-sm transition flex items-center gap-2"
              >
                <span>View Campus Gallery</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Floating Live Photo Badges */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=200&q=80"
                  alt="Gate 1 Intake"
                  className="w-10 h-10 rounded-xl object-cover border border-white/15 flex-shrink-0"
                />
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                    Gate 1 Desk
                  </span>
                  <span className="text-xs font-bold text-white">Active Intake</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80"
                  alt="Parcel Shelves"
                  className="w-10 h-10 rounded-xl object-cover border border-white/15 flex-shrink-0"
                />
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">
                    Storeroom
                  </span>
                  <span className="text-xs font-bold text-white">Shelf B-2 Tagged</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Disputes
                  </span>
                  <span className="text-xs font-bold text-emerald-300">Zero Lost Boxes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3D Animated Hero Visualizer */}
          <div className="lg:col-span-5 relative">
            <Campus3DHero />
          </div>
        </div>
      </section>

      {/* 2.5. CAMPUS HOSTEL LIFE & PARCEL OPERATIONS (REAL PHOTOGRAPHY GALLERY) */}
      <section id="gallery" className="py-20 bg-slate-900/50 border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" />
              <span>Campus Hostel Operations</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Life at Hostel Gate 1
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              See the real-world physical touchpoints connecting Amazon couriers, guard intake terminals, storeroom shelving, and student rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {campusGalleries.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 rounded-3xl border border-white/10 overflow-hidden shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="relative h-48 sm:h-52 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-indigo-300 border border-indigo-500/40 backdrop-blur-md">
                    {item.badge}
                  </span>
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono block">
                      {item.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 4-STAGE CAMPUS WORKFLOW SIMULATOR */}
      <section id="workflow" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Complete Chain of Custody
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              How a Parcel Travels from Gate to Room
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Click through the 4 stages to simulate how the security guard, student, and warden coordinate in real time.
            </p>
          </div>

          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeWorkflowStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveWorkflowStep(step.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-400 shadow-lg shadow-indigo-600/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase font-mono text-indigo-300">
                      {step.badge}
                    </span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  </div>
                  <h4 className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {step.title}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Active Step Showcase Card with Real Photo */}
          <div className="bg-slate-950/80 rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                    Step {workflowSteps[activeWorkflowStep].id + 1} of 4
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs font-bold text-amber-400">
                    {workflowSteps[activeWorkflowStep].locationTag}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {workflowSteps[activeWorkflowStep].subtitle}
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Guard Terminal Action</span>
                      <p className="text-xs text-slate-200 mt-0.5">{workflowSteps[activeWorkflowStep].guardAction}</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block">Resident Student Action</span>
                      <p className="text-xs text-slate-200 mt-0.5">{workflowSteps[activeWorkflowStep].studentAction}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Photo & Live Metadata Visual */}
              <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900 group">
                <img
                  src={workflowSteps[activeWorkflowStep].image}
                  alt={workflowSteps[activeWorkflowStep].imageAlt}
                  className="w-full h-56 sm:h-64 object-cover"
                />
                <div className="p-4 bg-slate-950/95 space-y-3 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-indigo-300 font-bold">STATE: IN_PROGRESS</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live WebSocket Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 block">Carrier:</span>
                      <span className="font-bold text-white">Blue Dart / Amazon</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Recipient:</span>
                      <span className="font-bold text-white">Kabir (Room 101, H-1)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Location:</span>
                      <span className="font-bold text-emerald-400">Shelf B-2 (Rack 4)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Security:</span>
                      <span className="font-bold text-indigo-300">Salted OTP Handover</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE 4 CAMPUS PERSONAS (STUDENT, GUARD, WARDEN, ADMIN) */}
      <section id="personas" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Role-Based Access Control
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Designed for Every Campus Stakeholder
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Four specialized portals customized to the exact duties of dorm students, gate security, wardens, and campus administration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Persona 1: Student */}
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Hostel Resident</h3>
                <span className="text-xs text-indigo-400 font-semibold font-mono">Dorm Student Portal</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Pre-register Amazon & Flipkart orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Receive push alerts for courier gate arrivals</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Generate 10-minute salted collection OTP</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>View physical shelf rack coordinates</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleQuickLaunch('student@hostel.edu', 'password123', '/student')}
              className="mt-6 w-full py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition flex items-center justify-center gap-1.5"
            >
              <span>Test Student View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 2: Security Guard */}
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Security Guard</h3>
                <span className="text-xs text-emerald-400 font-semibold font-mono">Gate 1 Intake Terminal</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Quick barcode & tracking lookup at gate</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Inspect package & tag shelf storage racks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Upload damage photo via Cloudinary CDN</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Constant-time OTP handover verification</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleQuickLaunch('guard@hostel.edu', 'password123', '/guard')}
              className="mt-6 w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
            >
              <span>Test Guard Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 3: Hostel Warden */}
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Hostel Warden</h3>
                <span className="text-xs text-amber-400 font-semibold font-mono">Hostel Supervisor Console</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Switch intake policies (Individual / Standing / Hybrid)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Set parcel hoarding limits per student</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Suspend standing privileges for disciplinary reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Hostel-wide immutable audit trail inspection</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleQuickLaunch('warden@hostel.edu', 'password123', '/warden')}
              className="mt-6 w-full py-2.5 px-4 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl text-xs font-bold border border-amber-500/30 transition flex items-center justify-center gap-1.5"
            >
              <span>Test Warden View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 4: Campus Admin */}
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Campus Admin</h3>
                <span className="text-xs text-purple-400 font-semibold font-mono">Global Oversight Suite</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Cross-hostel throughput analytics & metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Campus user directory management (Staff & Students)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>System-wide immutable activity audit stream</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Multi-tenancy isolation enforcement</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleQuickLaunch('admin@hostel.edu', 'password123', '/admin')}
              className="mt-6 w-full py-2.5 px-4 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-bold border border-purple-500/30 transition flex items-center justify-center gap-1.5"
            >
              <span>Test Admin View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. CAMPUS COMPARISON: PEN & PAPER VS PARCELTRACK */}
      <section id="comparison" className="py-20 bg-slate-900/60 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              The Campus Transformation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why Hostels Need ParcelTrack
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              How our state-machine architecture fixes the common vulnerabilities of physical paper logbooks in college hostels.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="py-4 px-6">Evaluation Feature</th>
                  <th className="py-4 px-6 text-rose-400">Traditional Hostel Register</th>
                  <th className="py-4 px-6 text-emerald-400">ParcelTrack System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Identity Verification</td>
                  <td className="py-4 px-6 text-slate-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Anyone can scribble a signature and claim a box</span>
                  </td>
                  <td className="py-4 px-6 text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Cryptographic single-use 6-digit OTP (10m TTL)</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Double-Handover Guard</td>
                  <td className="py-4 px-6 text-slate-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Vulnerable to duplicate handovers during rush hours</span>
                  </td>
                  <td className="py-4 px-6 text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Atomic MongoDB condition: 409 Conflict rejection</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Gate Courier Consent</td>
                  <td className="py-4 px-6 text-slate-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Guards accept packages without student knowledge</span>
                  </td>
                  <td className="py-4 px-6 text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Real-time push alerts: student grants/denies consent</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Package Misplacement</td>
                  <td className="py-4 px-6 text-slate-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Boxes pile up in heaps at the security gate</span>
                  </td>
                  <td className="py-4 px-6 text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Mandatory shelf rack tagging (e.g. "Shelf B-2")</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Dispute & Audit Trail</td>
                  <td className="py-4 px-6 text-slate-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Paper registers get torn, lost, or forged</span>
                  </td>
                  <td className="py-4 px-6 text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Immutable timestamped ledger with actor IDs</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. 1-CLICK LIVE TEST SANDBOX (Instant Viva / Evaluator Launcher) */}
      <section id="sandbox" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 rounded-3xl p-8 sm:p-12 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              Live Evaluation Sandbox
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Test Any Role with 1-Click
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Click any of the pre-seeded demo accounts below to instantly log in and experience the verified hostel parcel lifecycle live.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {/* Student Launcher */}
            <button
              onClick={() => handleQuickLaunch('student@hostel.edu', 'password123', '/student')}
              disabled={Boolean(sandboxLoadingRole)}
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-indigo-400/30 text-left transition-all transform hover:-translate-y-1 active:scale-95 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-indigo-600/30">
                  <User className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Hostel Resident</h4>
                <p className="text-xs text-indigo-200 mt-0.5">student@hostel.edu</p>
                <span className="text-[10px] text-slate-400 block mt-1">Room 101 • Hostel H-1</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-indigo-300 group-hover:text-white">
                <span>{sandboxLoadingRole === 'student@hostel.edu' ? 'Signing in...' : 'Launch Portal'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Guard Launcher */}
            <button
              onClick={() => handleQuickLaunch('guard@hostel.edu', 'password123', '/guard')}
              disabled={Boolean(sandboxLoadingRole)}
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-emerald-400/30 text-left transition-all transform hover:-translate-y-1 active:scale-95 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-emerald-600/30">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Security Guard</h4>
                <p className="text-xs text-emerald-200 mt-0.5">guard@hostel.edu</p>
                <span className="text-[10px] text-slate-400 block mt-1">Gate 1 Intake Terminal</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-emerald-300 group-hover:text-white">
                <span>{sandboxLoadingRole === 'guard@hostel.edu' ? 'Signing in...' : 'Open Terminal'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Warden Launcher */}
            <button
              onClick={() => handleQuickLaunch('warden@hostel.edu', 'password123', '/warden')}
              disabled={Boolean(sandboxLoadingRole)}
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-amber-400/30 text-left transition-all transform hover:-translate-y-1 active:scale-95 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-amber-600/30">
                  <Building className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Hostel Warden</h4>
                <p className="text-xs text-amber-200 mt-0.5">warden@hostel.edu</p>
                <span className="text-[10px] text-slate-400 block mt-1">Hostel H-1 Supervisor</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-white">
                <span>{sandboxLoadingRole === 'warden@hostel.edu' ? 'Signing in...' : 'Open Console'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Admin Launcher */}
            <button
              onClick={() => handleQuickLaunch('admin@hostel.edu', 'password123', '/admin')}
              disabled={Boolean(sandboxLoadingRole)}
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-purple-400/30 text-left transition-all transform hover:-translate-y-1 active:scale-95 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-purple-600/30">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Campus Admin</h4>
                <p className="text-xs text-purple-200 mt-0.5">admin@hostel.edu</p>
                <span className="text-[10px] text-slate-400 block mt-1">Global System Oversight</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-purple-300 group-hover:text-white">
                <span>{sandboxLoadingRole === 'admin@hostel.edu' ? 'Signing in...' : 'Open Suite'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 border-t border-white/10 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            <span className="font-black text-white">ParcelTrack</span>
            <span>• University Hostel Parcel Reception & Secure Handover System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>MERN Stack</span>
            <span>•</span>
            <span>Socket.IO</span>
            <span>•</span>
            <span>Cloudinary CDN</span>
            <span>•</span>
            <span>MongoDB Atlas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}