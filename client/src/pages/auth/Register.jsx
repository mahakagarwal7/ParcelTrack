import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    hostelId: '',
    studentId: '',
    roomNumber: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.hostelId) {
      setError('Please provide Name, Email, Password, and Hostel ID');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await register(formData);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register as a hostel resident to receive instant gate alerts and collect parcels."
    >
      {/* 1. SEGMENTED TAB SWITCHER: SIGN IN vs SIGN UP */}
      <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80">
        <Link
          to="/login"
          className="flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5 text-slate-400" />
          <span>Sign In</span>
        </Link>
        <Link
          to="/register"
          className="flex-1 py-2.5 text-center text-xs font-black rounded-xl transition bg-white text-indigo-600 shadow-sm flex items-center justify-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sign Up / Register</span>
        </Link>
      </div>

      {/* 2. REGISTRATION FORM */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="reg-name"
          name="name"
          label="Full Name"
          autoComplete="name"
          placeholder="e.g. Kabir Mehta"
          value={formData.name}
          onChange={handleChange}
        />

        <TextField
          id="reg-email"
          name="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="kabir@hostel.edu"
          value={formData.email}
          onChange={handleChange}
        />

        <TextField
          id="reg-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a secure password"
          value={formData.password}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="reg-hostel"
            name="hostelId"
            label="Hostel ID"
            placeholder="e.g. H-1"
            required
            value={formData.hostelId}
            onChange={handleChange}
          />
          <TextField
            id="reg-room"
            name="roomNumber"
            label="Room No."
            placeholder="e.g. 101"
            value={formData.roomNumber}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="reg-sid"
            name="studentId"
            label="Student ID"
            placeholder="CS-2024-101"
            value={formData.studentId}
            onChange={handleChange}
          />
          <TextField
            id="reg-phone"
            name="phone"
            label="Mobile Phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          <span>Create Student Account</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      {/* 3. FOOTER SIGN IN PROMPT */}
      <div className="mt-6 text-center text-xs text-slate-600">
        <span>Already have an account? </span>
        <Link
          to="/login"
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Sign in here
        </Link>
      </div>
    </AuthLayout>
  );
}