"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");

  const email = "hashanthawic@gmail.com";
  const password = "Hashdev@2025";
  const name = "Hashantha";
  const role = "admin";

  const setupUser = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setStatus("");

    try {
      setStatus("Checking if user exists...");
      
      // Check if user already exists in agents table
      const { data: existingAgent } = await supabase
        .from("agents")
        .select("*")
        .eq("email", email)
        .single();

      if (existingAgent) {
        setStatus("User exists. Attempting to update password via API...");
        
        // Try to update via API
        const response = await fetch("/api/setup-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name,
            role,
          }),
        });

        const result = await response.json();
        
        if (response.ok) {
          setSuccess(`✅ ${result.message}`);
          setStatus("");
        } else {
          setError(`⚠️ ${result.error}. You may need to update the password manually in Supabase dashboard.`);
          setStatus("");
        }
      } else {
        setStatus("Creating new user...");
        
        // Try to create via API first
        const response = await fetch("/api/setup-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name,
            role,
          }),
        });

        const result = await response.json();
        
        if (response.ok) {
          setSuccess(`✅ ${result.message}`);
          setStatus("");
        } else {
          // Fallback: try registration
          setStatus("API failed, trying registration...");
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
          });

          if (signUpError) {
            if (signUpError.message.includes("already registered")) {
              setError("User already exists. Please use the Supabase dashboard to reset the password, or contact an admin.");
            } else {
              setError(`Registration failed: ${signUpError.message}`);
            }
            setStatus("");
            return;
          }

          // Add to agents table
          if (data.user) {
            const { error: dbError } = await supabase.from("agents").insert([
              {
                id: data.user.id,
                name: name,
                email: email,
                role: role,
                expertise: [],
                whatsapp_numbers: [],
                max_tickets: 10,
                is_active: true,
                current_load: 0,
              },
            ]);

            if (dbError) {
              setError(`Failed to create agent record: ${dbError.message}`);
              setStatus("");
              return;
            }
          }

          setSuccess("✅ User created! Note: You may need to confirm your email or use Supabase dashboard to activate the account.");
          setStatus("");
        }
      }
    } catch (err: any) {
      setError(err.message || "Setup failed");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold mb-2 text-center text-red-600">User Setup</h1>
        <h2 className="text-lg font-semibold mb-4 text-center text-gray-900">Setup Login Account</h2>
        
        <div className="bg-gray-100 p-4 rounded space-y-2 text-sm">
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Password:</strong> {password}</p>
          <p><strong>Name:</strong> {name}</p>
          <p><strong>Role:</strong> {role}</p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
            {success}
          </div>
        )}

        {status && (
          <div className="text-blue-600 text-sm bg-blue-50 p-3 rounded">
            {status}
          </div>
        )}

        <button
          onClick={setupUser}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Setting up..." : "Setup User Account"}
        </button>

        <div className="text-xs text-gray-500 mt-4 space-y-1">
          <p><strong>Note:</strong> This will create or update the user account.</p>
          <p>If setup fails, you may need to:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Set SUPABASE_SERVICE_ROLE_KEY in .env.local</li>
            <li>Or manually create the user in Supabase dashboard</li>
            <li>Or use the register page at /register</li>
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t">
          <a
            href="/login"
            className="text-blue-600 hover:underline text-sm"
          >
            Go to Login Page →
          </a>
        </div>
      </div>
    </div>
  );
}

