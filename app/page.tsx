"use client";

import React, { useState, useEffect, useRef } from "react";

const clientNames = [
  "Acme Corp",
  "Globex LLC",
  "Stark Industries",
  "Wayne Enterprises",
  "Umbrella Group",
  "Wonka Industries",
  "Hooli",
  "Initech",
];

const statuses: Array<"pending" | "cleared" | "failed"> = ["pending", "cleared", "failed"];

function generateRandomTransaction(idNumber: number, useCurrentTimestamp = false) {
  const isLarge = Math.random() < 0.3;
  const amount = isLarge
    ? Math.floor(50000 + Math.random() * 50000)
    : Math.floor(50 + Math.random() * 150);

  const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: `TX-${100000 + idNumber}`,
    clientName,
    amount,
    status,
    timestamp: useCurrentTimestamp
      ? new Date().toISOString()
      : new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    isProcessing: false,
  };
}

function formatAmount(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function TransactionsTableApp() {
  const [transactions, setTransactions] = useState(() => {
    const initial = [];
    for (let i = 1; i <= 50; i++) {
      initial.push(generateRandomTransaction(i));
    }
    return initial;
  });

  const [incoming, setIncoming] = useState<typeof transactions>([]);
  const nextIdRef = useRef(transactions.length + 1);

  const [superAdmin, setSuperAdmin] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const newTx = generateRandomTransaction(nextIdRef.current, true);
      nextIdRef.current += 1;
      setIncoming((prev) => [newTx, ...prev]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearTransactions = (ids: string[]) => {
  // Mark all selected transactions as processing
  setTransactions((prev) =>
    prev.map((tx) => (ids.includes(tx.id) ? { ...tx, isProcessing: true } : tx))
  );

  setTimeout(() => {
    setTransactions((prev) => {
      const updated = prev.map((tx) => {
        if (!ids.includes(tx.id)) return tx;

        // Compliance check
        if (tx.amount > 10000 && !superAdmin) {
          return { ...tx, isProcessing: false }; // locked, cannot clear
        }

        // 10% failure chance
        const failed = Math.random() < 0.1;
        if (failed) return { ...tx, isProcessing: false };

        // Successfully cleared
        return { ...tx, status: "cleared", isProcessing: false };
      });

      // Now remove only transactions that were successfully cleared
      setSelectedTxIds((prevSet) => {
        const newSet = new Set(prevSet);
        updated.forEach((tx) => {
          if (tx.status === "cleared") {
            newSet.delete(tx.id);
          }
        });
        return newSet;
      });

      return updated;
    });
  }, 1500);
};

  const handleClear = (id: string) => clearTransactions([id]);

  const handleClearSelected = () => {
    clearTransactions(Array.from(selectedTxIds));
    setSelectedTxIds(new Set());
  };

  const showIncomingTransactions = () => {
    setTransactions((prev) => [...incoming, ...prev]);
    setIncoming([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Transactions</h1>

        {/* Super Admin Toggle */}
        <div className="mb-6 flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={superAdmin}
              onChange={() => setSuperAdmin((prev) => !prev)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">Super Admin Mode</span>
          </label>
        </div>

        {/* Incoming transactions banner */}
        {incoming.length > 0 && (
          <div
            onClick={showIncomingTransactions}
            className="cursor-pointer mb-4 p-2 bg-blue-100 text-blue-800 text-sm rounded text-center hover:bg-blue-200 transition"
          >
            {incoming.length} new transaction{incoming.length > 1 ? "s" : ""} – click to show
          </div>
        )}

        {/* Clear Selected Button */}
        <button
          onClick={handleClearSelected}
          disabled={selectedTxIds.size === 0}
          className={`mb-4 px-3 py-1 rounded-lg text-white font-medium text-sm transition ${
            selectedTxIds.size === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Clear Selected
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left border-b">
                  <th className="py-3 px-4"></th> {/* Checkbox column */}
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isHighValue = tx.amount > 10000;

                  return (
                    <tr
                      key={tx.id}
                      className={`border-b last:border-none hover:bg-gray-50 ${
                        isHighValue ? "bg-red-50 border-red-200" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        {tx.status === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedTxIds.has(tx.id)}
                            disabled={isHighValue && !superAdmin} // disable if high-value and superAdmin is off
                            onChange={() => {
                              setSelectedTxIds((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(tx.id)) {
                                  newSet.delete(tx.id);
                                } else {
                                  newSet.add(tx.id);
                                }
                                return newSet;
                              });
                            }}
                            className="mr-2"
                          />
                        )}
                      </td>
                      <td className={`py-3 px-4 font-mono ${isHighValue ? "text-red-700 font-semibold" : ""}`}>{tx.id}</td>
                      <td className={`py-3 px-4 ${isHighValue ? "text-red-700 font-semibold" : ""}`}>{tx.clientName}</td>
                      <td className={`py-3 px-4 font-medium ${isHighValue ? "text-red-700 font-bold" : ""}`}>{formatAmount(tx.amount)}</td>
                      <td className={`py-3 px-4 capitalize ${isHighValue ? "text-red-700 font-semibold" : ""}`}>{tx.status}</td>
                      <td className={`py-3 px-4 font-mono text-xs ${isHighValue ? "text-red-700" : ""}`}>{tx.timestamp}</td>
                      <td className="py-3 px-4">
                        {tx.status !== "cleared" && (!isHighValue || superAdmin) && (
                          <button
                            onClick={() => handleClear(tx.id)}
                            disabled={tx.isProcessing}
                            className={`px-3 py-1 rounded-lg text-white text-xs font-medium transition ${
                              tx.isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {tx.isProcessing ? "Processing" : "Clear"}
                          </button>
                        )}

                        {isHighValue && !superAdmin && (
                          <span className="text-red-700 text-xs font-semibold">
                            Compliance Lock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}