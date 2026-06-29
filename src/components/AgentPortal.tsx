/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Wallet,
  TrendingUp,
  Clock,
  QrCode,
  Share2,
  ExternalLink,
  Smartphone,
  CheckCircle,
  Copy,
  Plus
} from "lucide-react";

interface AgentPortalProps {
  onSimulateLink: (code: string) => void;
}

export const AgentPortal: React.FC<AgentPortalProps> = ({ onSimulateLink }) => {
  const {
    activeAgent,
    campaigns,
    referralLinks,
    wallets,
    transactions,
    payoutRequests,
    requestPayout
  } = useApp();

  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  if (!activeAgent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Smartphone className="h-12 w-12 text-zinc-350 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-zinc-800">No Sales Agent Workspace Loaded</h3>
        <p className="text-zinc-500 max-w-sm mt-1">Please select a Sales Agent persona from the top bar utility.</p>
      </div>
    );
  }

  // Find agent wallet
  const wallet = wallets.find(w => w.holderId === activeAgent.id && w.holderType === "AGENT");
  // Find agent links
  const agentLinks = referralLinks.filter(l => l.agentId === activeAgent.id);
  // Filter payouts requested by this agent
  const agentPayouts = payoutRequests.filter(p => p.agentId === activeAgent.id);
  // Filter ledger transactions
  const agentTransactions = transactions.filter(t => t.walletId === wallet?.id);

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");

    if (!withdrawAmount || withdrawAmount <= 0) {
      setWithdrawError("Please enter an amount greater than zero.");
      return;
    }

    if (wallet && wallet.availableBalance < withdrawAmount) {
      setWithdrawError(`Insufficient balance. Maximum available for payout is KES ${wallet.availableBalance.toLocaleString()}`);
      return;
    }

    const res = requestPayout(activeAgent.id, withdrawAmount);
    if (res.success) {
      setWithdrawSuccess(`Request of KES ${withdrawAmount.toLocaleString()} has been queued for instant M-Pesa transfer validation.`);
      setWithdrawAmount(0);
    } else {
      setWithdrawError(res.message);
    }
  };

  const copyLinkToClipboard = (code: string) => {
    // We'll construct a mock public referral url
    const url = `${window.location.origin}/referral/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(() => {
      // Fallback if browser permission is blocked in iframe
      alert(`Referral Link copied: ${url}`);
    });
  };

  return (
    <div id="agent-portal-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: Agent Stats & Earnings and M-Pesa Cashout */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Personal Agent Card */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg font-mono">
              {activeAgent.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                Active partner
              </span>
              <h2 className="text-base font-bold text-zinc-900 mt-1">{activeAgent.name}</h2>
              <p className="text-zinc-500 text-xs">{activeAgent.email}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 font-sans grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">M-Pesa registered:</span>
              <span className="text-xs text-zinc-700 font-semibold font-mono">+{activeAgent.mpesaNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">Agent Rating:</span>
              <span className="text-xs text-amber-500 font-bold">★ {activeAgent.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Wallets & Available Balance */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-2xl p-6 text-white border border-emerald-600 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-widest">Available M-Pesa Balance</span>
            <Wallet className="h-5 w-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold font-mono text-white mt-2">
            KES {(wallet?.availableBalance || 0).toLocaleString()}
          </p>
          <div className="mt-4 pt-4 border-t border-emerald-600/60 grid grid-cols-2 gap-2 text-xs text-emerald-100 font-sans">
            <div>
              <span className="opacity-75 block">Pending Pipeline</span>
              <strong className="text-white font-mono text-sm">KES {(wallet?.pendingBalance || 0).toLocaleString()}</strong>
            </div>
            <div>
              <span className="opacity-75 block">Total Net Earned</span>
              <strong className="text-white font-mono text-sm">KES {(wallet?.lifetimeEarnings || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b pb-2">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">M-Pesa Till Withdrawal</h3>
          </div>

          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Enter Cashout Amount (KES)</label>
              <input
                type="number"
                required
                min={100}
                step={50}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                placeholder="Amount, e.g. KES 10,000"
                className="w-full text-sm border font-mono border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-zinc-400 block mt-1">
                Will be paid out to registered mobile: <strong className="font-mono text-zinc-650">+{activeAgent.mpesaNumber}</strong>
              </span>
            </div>

            {withdrawError && (
              <p className="text-red-600 text-[11px] font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                ⚠️ {withdrawError}
              </p>
            )}

            {withdrawSuccess && (
              <p className="text-emerald-700 text-[11px] font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                ✓ {withdrawSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={!wallet || wallet.availableBalance < 100}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Request SMS M-Pesa Cashout
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT TWIN COLUMNS: Campaign Promotion Center & QR code generators */}
      <div className="lg:col-span-2 space-y-6">

        <div className="bg-zinc-50 border border-zinc-200/50 p-4 rounded-2xl">
          <h2 className="font-bold text-zinc-800 text-sm">Campaign Hub & Passive Link Promotion</h2>
          <p className="text-xs text-zinc-500">Pick any ongoing product offer, generate personalized tracking code to start advertising.</p>
        </div>

        {/* Promo Items list */}
        <div className="space-y-4">
          {campaigns.filter(c => c.status === "ACTIVE").map((camp) => {
            // Find active tracking details
            const personalLink = agentLinks.find(link => link.campaignId === camp.id);
            const referralCode = personalLink ? personalLink.uniqueCode : `${activeAgent.name.toLowerCase().split(" ")[0]}-${camp.id}`;

            return (
              <div key={camp.id} className="bg-white rounded-2xl border border-zinc-150 p-6 shadow-sm flex flex-col md:flex-row md:items-start md:justify-between gap-6 transition-all hover:shadow-md">
                
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[9px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold px-1.5 py-0.5 rounded">
                      BY: {camp.businessName}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 mt-1">{camp.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{camp.description}</p>
                  </div>

                  {/* Conditions summary box */}
                  <div className="text-[11px] font-medium bg-zinc-50 p-2.5 rounded-xl border text-zinc-600 border-zinc-100">
                    🥇 Reward Rate: <strong className="text-emerald-600">{camp.rewardType === "FIXED" ? `KES ${camp.rewardValue.toLocaleString()} fixed reward` : `${camp.rewardValue}% of product sale value`}</strong>
                  </div>

                  {/* Tracking link simulator block */}
                  {personalLink && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">My Personalized Referral URL:</span>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/referral/${referralCode}`}
                          className="w-full text-xs font-mono font-medium text-emerald-800 bg-emerald-50/40 border border-emerald-100 rounded-lg py-1.5 px-3 select-all outline-none"
                        />
                        <button
                          onClick={() => copyLinkToClipboard(referralCode)}
                          className="bg-zinc-100 hover:bg-zinc-200 p-2 rounded-lg text-zinc-600 text-xs flex items-center shrink-0 border border-zinc-200 transition-all font-sans font-medium"
                          title="Copy Link String"
                        >
                          {copiedCode === referralCode ? (
                            <span className="text-emerald-600 text-[10px] font-bold px-1 animate-pulse">Copied!</span>
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracking stats + actions right card */}
                {personalLink && (
                  <div className="md:w-56 shrink-0 bg-zinc-50/70 py-4.5 px-4 rounded-xl border border-zinc-100 flex flex-col justify-between align-middle text-center space-y-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Performance logs</span>
                      
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div>
                          <span className="text-base font-bold font-mono text-zinc-800">{personalLink.clicksCount}</span>
                          <span className="text-[9px] text-zinc-400 uppercase tracking-tight block">Clicks</span>
                        </div>
                        <div>
                          <span className="text-base font-bold font-mono text-zinc-800">{personalLink.leadsCount}</span>
                          <span className="text-[9px] text-zinc-400 uppercase tracking-tight block">Leads</span>
                        </div>
                        <div>
                          <span className="text-base font-bold font-mono text-zinc-800">{personalLink.conversionsCount}</span>
                          <span className="text-[9px] text-zinc-400 uppercase tracking-tight block">Sales</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      {/* SIMULATED CLIENT LANDING PAGE TRIGGER BUTTON */}
                      <button
                        onClick={() => onSimulateLink(referralCode)}
                        className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow transition-all duration-150 active:scale-95"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Launch Customer Simulator
                      </button>

                      <button
                        onClick={() => setSelectedQR(referralCode)}
                        className="w-full bg-white hover:bg-zinc-100 border text-zinc-700 text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <QrCode className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> Print Ad Flyer QR Code
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* Payout Logs Panel */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Withdrawals Processing Ledger ({agentPayouts.length})</h3>
          
          {agentPayouts.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No requested payouts available. Request your balance above.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-100">
              <table className="min-w-full divide-y divide-zinc-100 text-left text-xs font-sans">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-zinc-500 uppercase">Requested On</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-zinc-500 uppercase">Amount</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-zinc-500 uppercase">State</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-zinc-500 uppercase text-right">M-Pesa Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {agentPayouts.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 text-zinc-400 text-[11px]">
                        {new Date(req.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        KES {req.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          req.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : req.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-500 border border-red-200"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[11px] text-zinc-500">
                        {req.mpesaReceiptNumber || <span className="italic text-zinc-400">Verifying Daraja webhook...</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* QR CODE SIMULATION MODAL */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border max-w-sm w-full p-6 shadow-2xl relative text-center flex flex-col items-center">
            
            <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl block mb-2">
              <QrCode className="h-6 w-6" />
            </div>
            
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-1">Simulated Ad QR Poster</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Code: <strong className="font-mono text-emerald-700">{selectedQR}</strong>
            </p>

            {/* Custom SVG stylized vector block that mimics a QR code pattern beautifully */}
            <div className="bg-zinc-50 border p-4 rounded-xl block shadow-inner mb-4">
              <svg width="180" height="180" viewBox="0 0 100 100" className="mx-auto text-zinc-900">
                {/* QR Finder patterns */}
                <rect x="5" y="5" width="25" height="25" fill="currentColor" stroke="white" strokeWidth="2" />
                <rect x="10" y="10" width="15" height="15" fill="white" />
                <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                <rect x="70" y="5" width="25" height="25" fill="currentColor" stroke="white" strokeWidth="2" />
                <rect x="75" y="10" width="15" height="15" fill="white" />
                <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                <rect x="5" y="70" width="25" height="25" fill="currentColor" stroke="white" strokeWidth="2" />
                <rect x="10" y="75" width="15" height="15" fill="white" />
                <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                {/* Simulated random bits */}
                <rect x="40" y="15" width="7" height="7" fill="currentColor" />
                <rect x="50" y="8" width="8" height="8" fill="currentColor" />
                <rect x="45" y="28" width="12" height="6" fill="currentColor" />
                
                <rect x="40" y="45" width="15" height="15" fill="currentColor" />
                <rect x="43" y="48" width="9" height="9" fill="white" />

                <rect x="15" y="45" width="15" height="8" fill="currentColor" />
                <rect x="80" y="45" width="15" height="8" fill="currentColor" />
                <rect x="45" y="80" width="15" height="8" fill="currentColor" />

                <line x1="15" y1="36" x2="35" y2="36" stroke="currentColor" strokeWidth="3" strokeDasharray="2" />
                <line x1="75" y1="36" x2="95" y2="36" stroke="currentColor" strokeWidth="3" strokeDasharray="2" />
                <line x1="36" y1="15" x2="36" y2="35" stroke="currentColor" strokeWidth="3" strokeDasharray="1 3" />
                
                <circle cx="85" cy="85" r="4" fill="currentColor" />
              </svg>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed mb-6">
              Print this code on ad flyers, stickers, or local banners. Leads scanned through the QR will automatically register to your user dashboard instantly.
            </p>

            <button
              onClick={() => setSelectedQR(null)}
              className="w-full p-2.5 text-xs text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all font-semibold font-sans shadow"
            >
              Close Poster Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
