"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const API = "";

export type AppRole = "admin" | "trainer" | "user" | "gym_owner" | "super_admin";

export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: AppRole;
    avatarUrl?: string | null;
    verificationStatus?: "pending" | "verified" | "rejected" | "suspended";
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signOut: () => Promise<void>;
    redirectByRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function apiFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const res = await fetch(`${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(body.message || "Request failed");
    }
    return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // Phase 4: Always start with null — no fake logged-in state
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Phase 4: Restore session on mount — properly sets isLoading true/false
    useEffect(() => {
        setLoading(true);
        apiFetch<{ user: AuthUser }>("/api/auth/me")
            .then(({ user }) => setUser(user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { user } = await apiFetch<{ user: AuthUser }>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password, fullName }),
            });
            setUser(user);
            toast.success("Account created!", {
                description: "Welcome to T.E.S.T.!",
            });
            router.push("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Sign up failed";
            toast.error("Sign up failed", { description: message });
            throw err;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { user } = await apiFetch<{ user: AuthUser }>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            setUser(user);

            // Redirect by role
            if (user.role === "admin" || user.role === "super_admin") {
                router.push("/admin/verification");
            } else if (user.role === "gym_owner") {
                router.push("/gym-owner");
            } else if (user.role === "trainer") {
                router.push("/trainer");
            } else {
                router.push("/coaching");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Sign in failed";
            toast.error("Sign in failed", { description: message });
            throw err;
        }
    };

    // Phase 6: Fixed logout — router.replace prevents back-button returning to protected pages
    const logout = async () => {
        try {
            await fetch(`/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (e) { /* continue anyway */ }

        setUser(null);

        if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
        }

        toast.success("Signed out successfully");
        // replace removes the protected page from history — back button won't go there
        router.replace("/");
        router.refresh(); // clears Next.js client cache
    };

    const signOut = logout; // Alias for backward compatibility

    const redirectByRole = () => {
        if (!user) {
            router.push("/login");
            return;
        }

        switch (user.role) {
            case "admin":
            case "super_admin":
                router.push("/admin/verification");
                break;
            case "gym_owner":
                router.push("/gym-owner");
                break;
            case "trainer":
                router.push("/trainer");
                break;
            case "user":
            default:
                router.push("/coaching");
                break;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isLoading: loading, signUp, signIn, logout, signOut, redirectByRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        // Safe fallback for static export / out of context use
        return {
            user: null,
            loading: true,
            isLoading: true,
            signUp: async () => { },
            signIn: async () => { },
            logout: async () => { },
            signOut: async () => { },
            redirectByRole: () => { }
        };
    }
    return ctx;
}
