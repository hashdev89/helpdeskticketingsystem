"use client";
import React, { useState } from "react";
import { promotionsService } from "../../lib/supabase";
// import { whatsappAPI } from "../../lib/whatsapp-api";

export default function PromotionPage() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    preferred_vehicle: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      await promotionsService.create(form);
      // Send SMS via SQL Server
      try {
      await fetch('/api/send-sql-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      recipient_number: form.customer_phone,
      sms_text: `Hi ${form.customer_name}, thank you for visiting Indra Traders at the Auto Vision Motor Show BMICH! We’ve received your inquiry and will get in touch soon. Feel free to call us at 0777874422 for more info.`,
      })
      });
      } catch (e) {
      // Optionally handle SMS send error, but don't block success
      console.error("Failed to send SMS via SQL Server", e);
      }
      setSuccess("Promotion details submitted successfully!");
      setForm({ customer_name: "", customer_phone: "", preferred_vehicle: "" , remarks: "",});
    } catch (err: any) {
      setError(err.message || "Failed to submit promotion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold mb-4 text-black">Promotions Info Form</h1>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Customer Name
          </label>
          <input
            type="text"
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Customer Phone Number
          </label>
          <input
            type="text"
            name="customer_phone"
            value={form.customer_phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Preferred Vehicle
          </label>
          <input
            type="text"
            name="preferred_vehicle"
            value={form.preferred_vehicle}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            required
          />
        </div>
          <div>
          <label className="block text-sm font-medium text-black mb-1">
           Remarks
          </label>
          <input
            type="text"
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        {success && <div className="text-green-600 mt-2">{success}</div>}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
    </div>
  );
}
