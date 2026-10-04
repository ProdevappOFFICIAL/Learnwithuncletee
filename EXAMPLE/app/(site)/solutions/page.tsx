
export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Solutions for
            <span className="text-[#FF623D]"> Every Institution</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Tailored exam management solutions designed specifically for schools, universities,
            corporations, and certification bodies.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Industry Solutions</h2>
            <p className="text-lg text-gray-600">Specialized tools for different organizational needs</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* K-12 Education */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#FF623D]/10 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🏫</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">K-12 Education</h3>
                  <p className="text-gray-600">Complete exam management for schools</p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Grade-appropriate question types and difficulty levels</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Parent-teacher communication tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Curriculum-aligned assessment templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Progress tracking and reporting</span>
                </li>
              </ul>
              <a
                href="/solutions/k12"
                className="text-[#FF623D] font-semibold hover:underline inline-flex items-center gap-2"
              >
                Learn More →
              </a>
            </div>

            {/* Higher Education */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#FF623D]/10 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🎓</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Higher Education</h3>
                  <p className="text-gray-600">Advanced assessment tools for universities</p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Large-scale exam administration</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Academic integrity monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Automated grading and feedback</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Integration with LMS platforms</span>
                </li>
              </ul>
              <a
                href="/solutions/higher-education"
                className="text-[#FF623D] font-semibold hover:underline inline-flex items-center gap-2"
              >
                Learn More →
              </a>
            </div>

            {/* Corporate Training */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#FF623D]/10 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Corporate Training</h3>
                  <p className="text-gray-600">Professional certification and compliance</p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Industry certification exams</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Compliance training assessments</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Skills gap analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Custom reporting dashboards</span>
                </li>
              </ul>
              <a
                href="/solutions/corporate"
                className="text-[#FF623D] font-semibold hover:underline inline-flex items-center gap-2"
              >
                Learn More →
              </a>
            </div>

            {/* Certification Bodies */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#FF623D]/10 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🏆</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Certification Bodies</h3>
                  <p className="text-gray-600">Secure, standardized testing platforms</p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">High-stakes exam security</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Global test center management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Regulatory compliance tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF623D] mt-1">✓</span>
                  <span className="text-gray-600">Advanced analytics and insights</span>
                </li>
              </ul>
              <a
                href="/solutions/certification"
                className="text-[#FF623D] font-semibold hover:underline inline-flex items-center gap-2"
              >
                Learn More →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose LearningDeck?</h2>
            <p className="text-lg text-gray-600">Trusted by institutions worldwide</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#FF623D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-level security with SOC 2 compliance and end-to-end encryption.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#FF623D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">99.9% Uptime</h3>
              <p className="text-gray-600">
                Reliable platform with 24/7 monitoring and instant support.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#FF623D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Global Scale</h3>
              <p className="text-gray-600">
                Supporting millions of users across 190+ countries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Assessment Process?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Get started with a personalized demo and see how LearningDeck can work for your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-[#FF623D] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E55837] transition-colors"
            >
              Schedule Demo
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