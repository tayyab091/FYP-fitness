"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    { q: "How do I choose the right workout?", a: "Go to the Coaching page and browse trainers or specific workout categories. You can filter by goal (Strength, HIIT, Yoga, etc.)" },
    { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your Pro or Elite subscription anytime from the Settings page. You'll keep your features until the end of the billing period." },
    { q: "How do I track my nutrition?", a: "Visit the Nutrition page to see your daily meal plan. You can also customize your dietary preferences in the Nutrition Profile." },
    { q: "Are the trainers certified?", a: "Yes, all trainers on T.E.S.T. are vetted and certified professional coaches with years of experience in their specialties." },
];

export default function HelpPage() {
    return (
        <MainLayout title="Help & FAQ's" showBack>
            <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
                <div className="bg-card border rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`}>
                                <AccordionTrigger>{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                    <h3 className="font-semibold mb-2">Still need help?</h3>
                    <p className="text-sm text-muted-foreground mb-4">Our support team is available 24/7 to assist you.</p>
                    <button className="text-primary font-medium hover:underline">Contact Support</button>
                </div>
            </div>
        </MainLayout>
    );
}
