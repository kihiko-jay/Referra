/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Globe, ArrowRight, CheckCircle, HelpCircle, Smartphone, MapPin, Zap, Star } from "lucide-react";

interface PublicLandingPageProps {
  activeReferralCode: string;
  onClose: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ activeReferralCode, onClose }) => {
  const { referralLinks, campaigns, recordLead, trackClick } = useApp();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+254 7");
  const [customerNotes, setCustomerNotes] = useState("");
  
  const [submitted, setSubmitted] = useState(false);
  const [simulatedClicksCount, setSimulatedClicksCount] = useState(0);

  // Find associated link and campaign parameters
  const activeLink = referralLinks.find(link => link.uniqueCode === activeReferralCode);
  const campaign = activeLink ? campaigns.find(c => c.id === activeLink.campaignId) : null;

  const handleSimulateClick = () => {
    if (!activeLink) return;
    trackClick(activeLink.id, "197.248.11.19", "Nairobi CBD");
    setSimulatedClicksCount(prev => prev + 1);
  };

  const handleSubmitDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLink || !customerName || !customerEmail || !customerPhone) return;

    // First ensure click was tracked so click to conversion stats align
    trackClick(activeLink.id);

    // Record Lead
    recordLead(
      activeLink.id,
      customerName,
      customerEmail,
      customerPhone,
      customerNotes || `Simulated customer purchase on campaign: ${campaign?.title}`
    );

    setSubmitted(true);
  };

  if (!activeLink || !campaign) {
    return (
      <div className="bg-white p-8 rounded-2xl border text-center max-w-md mx-auto my-12">
        <h3 className="text-sm font-bold text-red-650 uppercase">Invalid Tracking Reference</h3>
        <p className="text-xs text-zinc-500 mt-2">Referral link parameters have expired or the business has archived this campaign offer.</p>
        <button onClick={onClose} className="mt-4 text-xs bg-zinc-900 px-4 py-2 text-white rounded-lg">Return to portal</button>
      </div>
    );
  }

  return (
    <div id="customer-landing-simulator" className="space-y-6">
      
      {/* Simulation Helper HUD */}
      <div className="bg-zinc-900 text-white rounded-2xl p-5 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
            Simulation Interactive Tool
          </span>
          <h2 className="text-base font-bold mt-2">Web Browser Customer Simulator</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            This window simulates what your customers see when they scan an Agent's ad code or click their referral link. Fill out this landing page to generate leads and commissions in seconds.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleSimulateClick}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-2 px-3.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
          >
            🖱️ Simulated Clicks (+1 Click)
          </button>
          
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold py-2 px-3 rounded-xl transition-all border border-zinc-750"
          >
            Exit Web Simulator
          </button>
        </div>
      </div>

      {/* Actual Simulated Public Landing Page website */}
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-12 max-w-5xl mx-auto">
        
        {/* Left Info Column mimicking business landing content */}
        <div className="md:col-span-7 bg-gradient-to-br from-zinc-50 to-zinc-100 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200">
          
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <span className="bg-zinc-900 text-white p-1.5 rounded-lg text-xs font-bold leading-none tracking-tight">
                {campaign.businessName.charAt(0)}
              </span>
              <span className="text-sm font-bold text-zinc-800">{campaign.businessName} Authorized Offer</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-none">
                {campaign.title}
              </h1>
              <p className="text-sm text-zinc-650 leading-relaxed font-sans">
                ReferraIOS has partnered with <strong>{campaign.businessName}</strong> to roll out localized on-demand infrastructure. Sign up using our verified broker codes today.
              </p>
            </div>

            {/* Core Features list highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3 text-xs">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-800 block">Verified Local SLA Guarantee</strong>
                  <span className="text-zinc-500">Fast tracking setups with 24/7 client relations.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <Zap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-800 block">Lowest Rates & Commissions</strong>
                  <span className="text-zinc-500">Transparent billing structures backed by modern software ledger hooks.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200/60 mt-8">
            <div className="flex items-center space-x-3 text-xs">
              <Globe className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-zinc-500">
                Tracking code: <strong className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{activeReferralCode}</strong>
              </span>
              {simulatedClicksCount > 0 && (
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded animate-pulse">
                  +{simulatedClicksCount} test click registered
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Right Form Column representing sign-up box */}
        <div className="md:col-span-5 p-8 flex flex-col justify-center">
          
          {!submitted ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Get Started Now</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Enter your parameters below. Our staff will reach out over phone to setup your license.</p>
              </div>

              <form onSubmit={handleSubmitDeal} className="space-y-4 font-sans">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Catherine Kendi"
                    className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-zinc-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="kendi@mwangistores.co.ke"
                    className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-zinc-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">M-Pesa Connected Phone</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+254 7"
                    className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-zinc-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1 flex justify-between">
                    <span>Notes or Special Requirements</span>
                    <span className="text-[9px] text-zinc-400 font-normal">Optional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Tell us about your business or specific setup dates."
                    className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-zinc-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all duration-150"
                >
                  Confirm Registration <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-full inline-flex self-center">
                <CheckCircle className="h-10 w-10" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Registration Success!</h3>
                <p className="text-xs text-zinc-500 mt-1">Ref tracking parameters mapped cleanly to broker account: <strong className="font-mono text-emerald-700 bg-emerald-50 py-0.5 px-1.5 border rounded">{activeReferralCode}</strong></p>
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 text-left space-y-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Simulation Details:</span>
                <p className="text-[10.5px] text-zinc-650 leading-relaxed font-sans">
                  A new <strong>PENDING Lead</strong> was successfully created for {customerName}. 
                  Go back to the <strong>Business Owner Portal</strong> (Kamau or Nekesa) to "Record Sale" ➔ "Approve Commission" and pay the agent!
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                Go Back to Dashboards
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
