import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-gray-700">
            This Privacy Policy describes how we collect, use, and handle your personal information when you use our LinkedIn Post Generator application.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
          <p className="text-gray-700">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Content you input for post generation</li>
            <li>Usage data and preferences</li>
            <li>Technical information about your device and browser</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p className="text-gray-700">
            We use the collected information to:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Generate and improve post suggestions</li>
            <li>Enhance user experience</li>
            <li>Maintain and improve our services</li>
            <li>Communicate with you about our services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
          <p className="text-gray-700">
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Your Rights</h2>
          <p className="text-gray-700">
            You have the right to:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Changes to This Policy</h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>
      </div>
    </div>
  );
}; 