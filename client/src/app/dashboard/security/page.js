"use client";
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function SecurityPage() {
    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">
            {/* <h1 className="text-3xl font-bold mb-8">Security & 2FA</h1> */}

            <div className="grid grid-cols-1 gap-8 items-start">
                <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
                    <div className="space-y-6">
                        <div className="p-6 bg-gray-50 border border-border rounded-2xl border-dashed flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg shadow-primary/5">
                                📱
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground">Authenticator App</h3>
                            <p className="text-sm text-muted mb-6 max-w-sm">
                                Use an app like Google Authenticator or Authy to generate secure 2FA codes.
                            </p>
                            <Button variant="outline" className="w-full md:w-auto">
                                Enable 2FA
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
