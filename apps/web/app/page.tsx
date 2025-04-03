import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  // useEffect(() => {
  //   // Redirect to dashboard if authenticated, otherwise to login
  //   if (isAuthenticated) {
  //     router.push("/dashboard");
  //   } else {
  //     router.push("/login");
  //   }
  // }, [isAuthenticated, router]);

  // Show loading indicator while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

