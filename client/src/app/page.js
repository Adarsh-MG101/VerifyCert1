"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';

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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-fade-in py-20">
        <h2 className="text-6xl font-bold mb-7 leading-tight">
          <span className="gradient-text">Secure Document</span> <br />
          <span className="text-white">Issuance & Verification</span>
        </h2>
        <p className="text-gray-400 mb-10 max-w-lg text-lg">
          Generate tamper-proof certificates and documents with ease.
          Verify authenticity instantly with our public ledger.
        </p>

        <Card className="w-full max-w-md p-8" title="Verify Document">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter Document ID"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="mb-0"
            />
            <Button type="submit">Verify</Button>
          </form>
          <div className="mt-6 text-xs text-gray-500">
            For Demo, try generating a document first in the dashboard.
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
