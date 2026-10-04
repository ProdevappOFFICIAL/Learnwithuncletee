
export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="text-[#FF623D]"> Modern Learning</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover the comprehensive suite of tools designed to streamline exam management,
            enhance collaboration, and deliver exceptional learning experiences.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-gray-600">Comprehensive tools for every aspect of exam management</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#FF623D]/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Exam Builder</h3>
              <p className="text-gray-600">
                Create comprehensive exams with multiple question types, randomization, and advanced settings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#FF623D]/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Collaboration Tools</h3>
              <p className="text-gray-600">
                Work seamlessly with your team using shared workspaces, real-time editing, and version control.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#FF623D]/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-600">
                Get detailed analytics on student performance, question difficulty, and exam effectiveness.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#FF623D]/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Security & Integrity</h3>
              <p className="text-gray-600">
                Advanced security measures ensure exam integrity with anti-cheating tools and secure delivery.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#FF623D]/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Support</h3>
              <p className="text-gray-600">
                Take exams anywhere with full mobile support and responsive design for all devices.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#FF623D]/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Monitoring</h3>
              <p className="text-gray-600">
                Monitor exams in real-time with live dashboards and instant notifications for any issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of educators and institutions using LearningDeck to create better exams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-[#FF623D] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E55837] transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="/pricing"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      
    </div>
  );
}