"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Link from 'next/link';

export default function Home() {
  const [docId, setDocId] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Keep user logged in logic if needed
  }, []);

  const handleVerify = (e) => {
    e.preventDefault();
    if (docId) {
      router.push(`/verify/${docId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative bg-[#1a1a1a] text-white py-32 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-0"></div>
          {/* Subtle pattern overlay could go here */}

          <div className="container mx-auto px-6 relative z-10 text-center md:text-left">
            <div className="max-w-3xl">
              <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block animate-fade-in">
                Secure & Reliable
              </span>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-header animate-fade-in" style={{ animationDelay: '0.1s' }}>
                CERTIFICATE <br />
                <span className="text-primary">ISSUANCE SYSTEM</span>
              </h1>
              <p className="text-gray-400 text-lg mb-10 max-w-xl font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Generate, manage, and verify tamper-proof documents with our industrial-grade platform. Built for speed, security, and scale.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Link href="/login">
                  <Button className="border-2 border-primary bg-primary text-black hover:bg-transparent hover:text-primary w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="#verify">
                  <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black hover:border-white w-full sm:w-auto">
                    Verify Document
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES // SERVICES SECTION */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-gray-400 font-bold tracking-[0.2em] uppercase text-xs">What We Offer</span>
              <h2 className="text-4xl font-bold text-[#1a1a1a] mt-2 font-header">Our Key <span className="text-primary">Features</span></h2>
              <div className="w-16 h-1 bg-primary mx-auto mt-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div className="group p-8 border border-gray-100 hover:border-primary/20 bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-300 rounded-[2px]">
                <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300 rounded-[2px]">
                  <svg className="w-8 h-8 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-4 font-header uppercase group-hover:text-primary transition-colors">Bulk Generation</h3>
                <p className="text-gray-500 leading-relaxed text-sm">Upload CSV data and generate thousands of certificates in seconds with our high-performance engine.</p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 border border-gray-100 hover:border-primary/20 bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-300 rounded-[2px]">
                <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300 rounded-[2px]">
                  <svg className="w-8 h-8 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-4 font-header uppercase group-hover:text-primary transition-colors">Secure Verification</h3>
                <p className="text-gray-500 leading-relaxed text-sm">Every document gets a unique, tamper-proof QR code backed by our secure public ledger.</p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 border border-gray-100 hover:border-primary/20 bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-300 rounded-[2px]">
                <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300 rounded-[2px]">
                  <svg className="w-8 h-8 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-4 font-header uppercase group-hover:text-primary transition-colors">Custom Templates</h3>
                <p className="text-gray-500 leading-relaxed text-sm">Design in Word, upload to VerifyCert. We preserve your exact formatting, fonts, and branding.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="py-20 bg-[#1a1a1a] text-white relative">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-800">
              <div>
                <span className="text-4xl md:text-5xl font-bold text-primary block mb-2 font-header">10k+</span>
                <span className="text-xs uppercase tracking-widest text-gray-400">Documents Issued</span>
              </div>
              <div>
                <span className="text-4xl md:text-5xl font-bold text-primary block mb-2 font-header">500+</span>
                <span className="text-xs uppercase tracking-widest text-gray-400">Organizations</span>
              </div>
              <div>
                <span className="text-4xl md:text-5xl font-bold text-primary block mb-2 font-header">99.9%</span>
                <span className="text-xs uppercase tracking-widest text-gray-400">Uptime</span>
              </div>
              <div>
                <span className="text-4xl md:text-5xl font-bold text-primary block mb-2 font-header">24/7</span>
                <span className="text-xs uppercase tracking-widest text-gray-400">Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* VERIFICATION SECTION */}
        <section id="verify" className="py-24 bg-[#f8f9fa]">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-1/2">
                <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
                  Instant Validation
                </span>
                <h2 className="text-4xl font-bold text-[#1a1a1a] mb-6 font-header">
                  Verify a Document <br />
                  <span className="text-gray-400">In Real-Time</span>
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Ensure the authenticity of any certificate issued through our platform. Simply enter the unique Document ID found on the bottom of the certificate.
                </p>

                <div className="bg-white p-8 shadow-xl border-l-4 border-primary rounded-[2px]">
                  <form onSubmit={handleVerify} className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Document ID</label>
                    <div className="flex gap-4">
                      <Input
                        placeholder="e.g. 550e8400-e29b..."
                        value={docId}
                        onChange={(e) => setDocId(e.target.value)}
                        className="mb-0 bg-gray-50"
                      />
                      <Button type="submit" className="bg-[#1a1a1a] text-white hover:bg-primary border-none text-xs">
                        Verify
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="w-full md:w-1/2 relative">
                <div className="relative z-10 bg-white p-4 shadow-2xl rotate-3 transform transition-transform duration-500 hover:rotate-0 border border-gray-200">
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full mb-3 flex items-center justify-center text-3xl">📄</div>
                      <span className="text-gray-400 text-sm font-bold uppercase">Certificate Preview</span>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 border-4 border-primary transform -translate-x-4 translate-y-4 -z-0"></div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
