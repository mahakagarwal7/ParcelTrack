import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-navy text-primary-200 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-white font-extrabold text-lg">
            <Package className="w-5 h-5 text-amber-400" aria-hidden="true" /> ParcelTrack
          </div>
          <p className="mt-3 max-w-xs">Hostel parcel reception and secure handover. Receive on your behalf, collect with your OTP.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <a href="#roles" className="hover:text-white">Roles</a>
          <a href="#security" className="hover:text-white">Security</a>
        </nav>
        <div className="flex flex-col gap-2">
          <Link to="/login" className="hover:text-white">Sign in</Link>
          <Link to="/register" className="hover:text-white">Create account</Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-primary-300">© ParcelTrack. Not a courier tracker.</div>
    </footer>
  );
}
