import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';

export default function Register() {
  // Public sign-up is for students. Staff accounts are assigned by an admin.
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT', hostelId: 'H-1', studentId: '', roomNumber: '', phone: '' });
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
    <AuthLayout title="Create your account" subtitle="Register as a hostel student to manage parcels.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField id="reg-name" name="name" label="Full name" autoComplete="name" value={formData.name} onChange={handleChange} />
        <TextField id="reg-email" name="email" label="Email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} />
        <TextField id="reg-password" name="password" label="Password" type="password" autoComplete="new-password" value={formData.password} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <TextField id="reg-hostel" name="hostelId" label="Hostel ID" value={formData.hostelId} onChange={handleChange} />
          <TextField id="reg-room" name="roomNumber" label="Room" value={formData.roomNumber} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField id="reg-sid" name="studentId" label="Student ID" value={formData.studentId} onChange={handleChange} />
          <TextField id="reg-phone" name="phone" label="Phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-sm text-slate-600">Already registered? <Link to="/login" className="font-semibold text-primary-700 hover:underline">Sign in</Link></p>
    </AuthLayout>
  );
}
