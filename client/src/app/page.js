"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';

export default function Home() {
  const [docId, setDocId] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Keep user logged in even if they visit the home page
  }, []);

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
        <h2 className="text-6xl font-bold mb-7 leading-tight font-header">
          <span className="text-primary">Secure Document</span> <br />
          <span className="text-gray-900">Issuance & Verification</span>
        </h2>
        <p className="text-gray-500 mb-10 max-w-lg text-lg font-subtitle">
          Generate tamper-proof certificates and documents with ease.
          Verify authenticity instantly with our public ledger.
        </p>

        <Card className="w-full max-w-md p-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800 font-header">Verify Document</h3>
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Paste Document ID here"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="mb-0"
            />
            <Button type="submit" className="text-white">Verify</Button>
          </form>

        </Card>
      </main>

      <Footer />
    </div>
  );
}
