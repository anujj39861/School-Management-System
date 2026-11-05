"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentAuthWrapper({ children }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            if (typeof window === 'undefined') return;

            const studentToken = localStorage.getItem('student_token');
            const studentUser = localStorage.getItem('student_user');
            
            if (!studentToken || !studentUser) {
                setIsAuthenticated(false);
                setIsLoading(false);
                // Redirect immediately without showing content
                router.replace('/student/login');
                return;
            }
            
            setIsAuthenticated(true);
            setIsLoading(false);
        };

        // Check immediately
        checkAuth();
    }, [router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render anything if not authenticated (redirecting)
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
