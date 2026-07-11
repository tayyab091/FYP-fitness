"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Users, MessageCircle, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mockPosts = [
    { id: "1", author: "Jackson P.", avatar: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=60", time: "2h ago", content: "Just crushed a 5K PR! 🏃‍♂️ The new HIIT program is working wonders. Who else has been following the weekly plan?", likes: 24, comments: 8, tags: ["Running", "HIIT"] },
    { id: "2", author: "Sarah M.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60", time: "4h ago", content: "Today's meal prep done! 🥗 Spinach omelette for breakfast all week. Feeling energised and ready to train!", likes: 42, comments: 12, tags: ["Nutrition", "MealPrep"] },
    { id: "3", author: "Mike T.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60", time: "6h ago", content: "Week 3 of the strength programme complete. Seeing real gains now 💪 Don't give up at week 2!", likes: 67, comments: 21, tags: ["Strength", "Progress"] },
];

export default function CommunityPage() {
    return (
        <MainLayout title="Community">
            <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Community Feed</span>
                    </div>
                    <Button size="sm">Share Update</Button>
                </div>

                {mockPosts.map((post) => (
                    <div key={post.id} className="bg-card border rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={post.avatar} />
                                <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">{post.author}</p>
                                <p className="text-xs text-muted-foreground">{post.time}</p>
                            </div>
                        </div>
                        <p className="text-sm">{post.content}</p>
                        <div className="flex gap-2 flex-wrap">
                            {post.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 pt-2 border-t">
                            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <Heart className="h-4 w-4" /> {post.likes}
                            </button>
                            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <MessageCircle className="h-4 w-4" /> {post.comments}
                            </button>
                            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
                                <Share2 className="h-4 w-4" /> Share
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </MainLayout>
    );
}
