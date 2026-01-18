"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [docId, setDocId] = useState('');
  const router = useRouter();

  const handleVerify = (e) => {
    e.preventDefault();
    if (docId) {
      router.push(`/verify/${docId}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="p-6 flex flex-col items-center container mx-auto ">
        <h1 className="text-5x1  font-bold gradient-text">VerifyCert</h1><br />
        <div className="space-x-4">
          <Link href="/login" className="btn text-sm">Generate Certificate</Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
        <h2 className=" gradient-text text-5xl font-bold mb-7">
          Secure Document <br />
          <span className="gradient-text">Issuance & Verification</span>
        </h2>
        <p className="text-gray-400 mb-10 max-w-lg">
          Generate tamper-proof certificates and documents with ease.
          Verify authenticity instantly with our public ledger.
        </p>

        <div className="card w-full max-w-md p-6">
          <h3 className="text-xl font-semibold mb-4">Verify Document</h3>
          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Document ID"
              className="input mb-0 flex-1"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
            />
            <button type="submit" className="btn">Verify</button>
          </form>
          <div className="mt-4 text-xs text-gray-500">
            For Demo, try generating a document first in the dashboard.
          </div>
        </div>
      </div>
    </main>
  );
}
