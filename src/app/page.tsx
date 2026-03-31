import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50/30 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-8 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 bg-slate-700 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-800">
                Comprehensive School Management Platform
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-slate-800 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-slate-800 dark:via-teal-400 dark:to-blue-400">
                Welcome to
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent dark:from-white dark:via-slate-100 dark:to-white">
                LMS
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-800 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Streamline your school operations with our all-in-one management system.
              <br className="hidden md:block" />
              <span className="text-slate-700 dark:text-slate-800">
                Manage schools, students, teachers, and classes effortlessly.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href={ROUTES.LOGIN}>
                <Button
                  size="lg"
                  className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-slate-800 to-teal-600 hover:from-slate-700 hover:to-teal-700 text-white shadow-lg shadow-slate-700/25 hover:shadow-xl hover:shadow-slate-700/40 transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10">Get Started</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-slate-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></span>
                </Button>
              </Link>
              <Link href={ROUTES.LOGIN}>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-105"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
            {[
              {
                title: 'School Management',
                description: 'Complete control over school information, settings, and configurations.',
                icon: '🏫',
                gradient: 'from-slate-700 to-teal-500',
              },
              {
                title: 'User Management',
                description: 'Efficiently manage admins, teachers, students, and parents in one place.',
                icon: '👥',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                title: 'Role-Based Access',
                description: 'Granular permissions and role-based access control for security.',
                icon: '🔐',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                title: 'Student Tracking',
                description: 'Track student progress, attendance, and academic performance.',
                icon: '📊',
                gradient: 'from-orange-500 to-red-500',
              },
              {
                title: 'Parent Portal',
                description: 'Connect parents with their children\'s academic journey seamlessly.',
                icon: '👨‍👩‍👧‍👦',
                gradient: 'from-indigo-500 to-blue-500',
              },
              {
                title: 'Real-time Updates',
                description: 'Stay updated with instant notifications and real-time data sync.',
                icon: '⚡',
                gradient: 'from-yellow-500 to-orange-500',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-slate-700/10 hover:-translate-y-1"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white text-2xl mb-4 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-800 dark:text-slate-800 leading-relaxed">
                  {feature.description}
                </p>
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '100%', label: 'Secure' },
              { value: '24/7', label: 'Available' },
              { value: 'Easy', label: 'To Use' },
              { value: 'Fast', label: 'Performance' },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-teal-600 bg-clip-text text-transparent dark:from-slate-800 dark:to-teal-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-800">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
