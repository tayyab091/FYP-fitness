"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WellnessChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
        { role: 'ai', text: 'Hi! I am your AI wellness coach. How can I help you thrive today?' }
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        
        // Add user message
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        setInput("");
        
        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: "That's a great goal! I'll update your daily fitness log and adjust your personalized meal plan to help you achieve it. Remember to prioritize recovery today." 
            }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-80 sm:w-96 bg-background border shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
                            <div className="flex items-center gap-2">
                                <Bot className="h-6 w-6" />
                                <div>
                                    <h3 className="font-semibold text-sm">TEST AI Assistant</h3>
                                    <p className="text-xs opacity-80">Wellness Coaching & Tracking</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/20 text-primary-foreground" onClick={() => setIsOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`p-2 rounded-full flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border text-foreground'}`}>
                                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`text-sm p-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-background border rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* Input Area */}
                        <div className="p-4 bg-background border-t">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2"
                            >
                                <Input 
                                    placeholder="Ask about workouts, diet, or progress..." 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="flex-1 rounded-full"
                                />
                                <Button type="submit" size="icon" className="rounded-full flex-shrink-0">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </motion.button>
        </div>
    );
}
