"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, Lock, Zap, User, Calendar, Shield } from "lucide-react";
import { usePaymentInputs } from 'react-payment-inputs';

const PLANS = {
    basic: { name: "Basic", price: "$0/mo", description: "Perfect for getting started" },
    pro: { name: "Pro", price: "$19/mo", description: "Most popular choice" },
    elite: { name: "Elite", price: "$39/mo", description: "Premium experience" },
};

function PaymentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = (searchParams.get("plan") as keyof typeof PLANS) || "pro";
    const plan = PLANS[planId] || PLANS.pro;

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps } = usePaymentInputs();

    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");

    const validateName = (val: string) => {
        if (!val) return "Name is required";
        if (!/^[a-zA-Z\s]+$/.test(val)) return "Name must contain only letters";
        return "";
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        setNameError(validateName(e.target.value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const nErr = validateName(name);
        if (nErr) {
            setNameError(nErr);
            return;
        }

        if (meta.error) {
            return; // react-payment-inputs meta handles card errors
        }

        setIsProcessing(true);
        try {
            // Get card data from react-payment-inputs
            const cardData = {
                cardholderName: name,
                // In a real app, you'd get actual card details here
                // but react-payment-inputs doesn't expose raw card data for security reasons
            };

            const response = await fetch(`/api/payments/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Include cookies for authentication
                body: JSON.stringify({
                    plan: planId,
                    cardData,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Payment failed");
            }

            const result = await response.json();
            console.log("Payment successful:", result);
            
            setIsProcessing(false);
            setIsSuccess(true);
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (err: any) {
            console.error("Payment error:", err);
            setIsProcessing(false);
            // You could add error toast notification here
            alert(`Payment failed: ${err.message}`);
        }
    };

    if (isSuccess) {
        return (
            <Card className="border-0 shadow-xl bg-linear-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
                <CardContent className="flex flex-col items-center justify-center py-12 px-6 sm:py-16 sm:px-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Payment Successful!</h2>
                    <p className="text-center text-muted-foreground text-sm sm:text-base">You are now subscribed to the <span className="font-semibold text-foreground">{plan.name}</span> plan. Redirecting...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 sm:space-y-2 pb-6 sm:pb-8">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl">Payment Details</CardTitle>
                </div>
                <CardDescription className="text-sm sm:text-base">Complete your subscription securely</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 sm:space-y-8 px-4 sm:px-6">
                    {/* Plan Summary */}
                    <div className="bg-linear-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-4 sm:p-6 rounded-xl border border-primary/20 space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">Selected Plan</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-foreground">{plan.name}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">{plan.description}</p>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-primary">{plan.price}</div>
                        </div>
                    </div>

                    {/* Cardholder Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Cardholder Name
                        </Label>
                        <div className="relative">
                            <Input 
                                id="name"
                                placeholder="John Doe" 
                                value={name} 
                                onChange={handleNameChange}
                                className="h-10 sm:h-11 text-sm sm:text-base placeholder:text-muted-foreground/50 pl-4"
                            />
                        </div>
                        {nameError && <p className="text-xs sm:text-sm text-red-500 font-medium flex items-center gap-1"><span>✕</span> {nameError}</p>}
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            Card Number
                        </Label>
                        <div className="relative">
                            <Input 
                                id="cardNumber"
                                {...getCardNumberProps()} 
                                className={`h-10 sm:h-11 text-sm sm:text-base placeholder:text-muted-foreground/50 pl-4 transition-colors duration-200 ${meta.isTouched && meta.erroredInputs.cardNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border hover:border-primary/30 focus:border-primary"}`}
                                placeholder="4242 4242 4242 4242"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none">
                                <Shield className="h-4 w-4" />
                            </div>
                        </div>
                        {meta.isTouched && meta.erroredInputs.cardNumber && <p className="text-xs sm:text-sm text-red-500 font-medium flex items-center gap-1"><span>✕</span> {meta.erroredInputs.cardNumber}</p>}
                    </div>

                    {/* Expiry Date & CVC */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Expiry
                            </Label>
                            <div className="relative">
                                <Input 
                                    id="expiry"
                                    {...getExpiryDateProps()} 
                                    className={`h-10 sm:h-11 text-sm sm:text-base placeholder:text-muted-foreground/50 pl-4 transition-colors duration-200 ${meta.isTouched && meta.erroredInputs.expiryDate ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border hover:border-primary/30 focus:border-primary"}`}
                                    placeholder="MM/YY"
                                />
                            </div>
                            {meta.isTouched && meta.erroredInputs.expiryDate && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><span>✕</span> Invalid</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cvc" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                <Lock className="h-4 w-4 text-primary" />
                                CVC
                            </Label>
                            <div className="relative">
                                <Input 
                                    id="cvc"
                                    {...getCVCProps()} 
                                    className={`h-10 sm:h-11 text-sm sm:text-base placeholder:text-muted-foreground/50 pl-4 transition-colors duration-200 ${meta.isTouched && meta.erroredInputs.cvc ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border hover:border-primary/30 focus:border-primary"}`}
                                    placeholder="123"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none">
                                    <Shield className="h-4 w-4" />
                                </div>
                            </div>
                            {meta.isTouched && meta.erroredInputs.cvc && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><span>✕</span> Invalid</p>}
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 sm:p-4 flex items-start gap-3">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200">Secure Payment</p>
                            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">Your payment information is encrypted with SSL. We never store your card details.</p>
                        </div>
                    </div>

                    {/* Payment Info Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Payment Information
                        </h3>
                        <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-slate-300 dark:border-slate-700">
                                <span className="text-muted-foreground">Plan</span>
                                <span className="font-medium text-foreground">{plan.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-semibold text-primary">{plan.price}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-6 sm:pt-8 px-4 sm:px-6 pb-4 sm:pb-6">
                    <Button 
                        type="submit" 
                        className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold transition-all duration-200 hover:shadow-lg" 
                        disabled={isProcessing}
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isProcessing ? "Processing..." : `Pay ${plan.price}`}
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full h-10 sm:h-11 text-sm sm:text-base hover:bg-slate-100 dark:hover:bg-slate-900"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function PaymentPage() {
    const router = useRouter();
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-background p-4">
            <div className="w-full max-w-md">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-sm text-muted-foreground mb-6 sm:mb-8 hover:text-foreground transition-colors duration-200 font-medium"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Plans
                </button>
                <Suspense fallback={
                    <Card className="border-0 shadow-xl p-8">
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
                            <p className="text-sm text-muted-foreground">Loading payment form...</p>
                        </div>
                    </Card>
                }>
                    <PaymentForm />
                </Suspense>
            </div>
        </div>
    );
}
