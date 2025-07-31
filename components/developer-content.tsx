"use client"
import { useState } from 'react';
import { Copy, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function ApiKeysComponent() {
  const [activeTab, setActiveTab] = useState('API Keys');
  const [copiedStates, setCopiedStates] = useState({});
  const [visibilityStates, setVisibilityStates] = useState({
    private: false,
    secret: false
  });

  const apiKeys = {
    public: '889448451105706e066e878fa329b91780e69d9d',
    private: 'pk_e58123027622a846d1b11dddec376de89b6791b568a2',
    secret: 'sk_16194bbba98e03da0db116501f6ae3637909af7598878'
  };

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const toggleVisibility = (key) => {
    setVisibilityStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const maskKey = (key) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '•'.repeat(key.length - 16) + key.substring(key.length - 8);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 ">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black-500 dark:text-white">
            Developers
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['API Keys', 'Webhook'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-black text-black bg-gray-50 dark:text-white dark:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* API Keys Content */}
          {activeTab === 'API Keys' && (
            <div className="p-6 space-y-6">
              {/* Public API Key */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Public Api Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiKeys.public}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg border transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:border-black dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
                  />
                  <button
                    onClick={() => handleCopy('public', apiKeys.public)}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-grey-600 transition-colors flex items-center gap-2 font-medium"
                  >
                    {copiedStates.public ? <Check size={16} /> : <Copy size={16} />}
                    {copiedStates.public ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Private API Key */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Private Api Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={visibilityStates.private ? apiKeys.private : maskKey(apiKeys.private)}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg border transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:border-gery-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-grey-500 focus:outline-none focus:ring-2 focus:ring-grey-500 focus:ring-opacity-20"
                  />
                  <button
                    onClick={() => toggleVisibility('private')}
                    className="px-3 py-3 rounded-lg border transition-colors bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {visibilityStates.private ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleCopy('private', apiKeys.private)}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-black-600 transition-colors flex items-center gap-2 font-medium"
                  >
                    {copiedStates.private ? <Check size={16} /> : <Copy size={16} />}
                    {copiedStates.private ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Secret */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secret
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={visibilityStates.secret ? apiKeys.secret : maskKey(apiKeys.secret)}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg border transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:border-black-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-black-500 focus:outline-none focus:ring-2 focus:ring-black-500 focus:ring-opacity-20"
                  />
                  <button
                    onClick={() => toggleVisibility('secret')}
                    className="px-3 py-3 rounded-lg border transition-colors bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {visibilityStates.secret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleCopy('secret', apiKeys.secret)}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-black-600 transition-colors flex items-center gap-2 font-medium"
                  >
                    {copiedStates.secret ? <Check size={16} /> : <Copy size={16} />}
                    {copiedStates.secret ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Renew Button */}
              <div className="pt-4">
                <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-grey-600 transition-colors flex items-center gap-2 font-medium">
                  <RefreshCw size={16} />
                  Renew API keys
                </button>
              </div>
            </div>
          )}

          {/* Webhook Content */}
          {activeTab === 'Webhook' && (
            <div className="p-6">
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Webhook configuration will be displayed here.</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <p className="text-sm">
            <strong>Security Notice:</strong> Keep your private API keys and secrets secure. Never expose them in client-side code or public repositories.
          </p>
        </div>
      </div>
    </div>
  );
}