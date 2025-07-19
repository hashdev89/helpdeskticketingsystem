"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

const roles = [
  { value: "agent", label: "Agent" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Admin" },
];

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
    expertise: "",
    whatsappNumbers: "",
    maxTickets: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Register with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (signUpError) throw signUpError;
      // Add to agents table
      const { error: dbError } = await supabase.from("agents").insert([
        {
          id: data.user?.id,
          name: form.name,
          email: form.email,
          role: form.role,
          expertise: form.expertise.split(",").map((e) => e.trim()).filter(Boolean),
          whatsapp_numbers: form.whatsappNumbers.split(",").map((n) => n.trim()).filter(Boolean),
          max_tickets: Number(form.maxTickets) || 10,
          is_active: true,
          current_load: 0,
        },
      ]);
      if (dbError) throw dbError;
      setSuccess("Registration successful! Please check your email to confirm your account.");
      setForm({
        name: "",
        email: "",
        password: "",
        role: "agent",
        expertise: "",
        whatsappNumbers: "",
        maxTickets: 10,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="expertise"
          placeholder="Expertise (comma separated)"
          value={form.expertise}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          name="whatsappNumbers"
          placeholder="WhatsApp Numbers (comma separated)"
          value={form.whatsappNumbers}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="number"
          name="maxTickets"
          placeholder="Max Tickets"
          value={form.maxTickets}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
