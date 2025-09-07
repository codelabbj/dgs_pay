"use client"
import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { authenticatedFetch, getUserData } from '@/utils/auth';
import { useLanguage } from '@/contexts/language-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function ApiKeysComponent() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('API Keys');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [visibilityStates, setVisibilityStates] = useState({
    private: false,
    secret: false
  });

  const [apiKeys, setApiKeys] = useState({
    public: '',
    secret: ''
  });

  const [webhookUrls, setWebhookUrls] = useState({
    success_url: '',
    cancel_url: '',
    callback_url: ''
  });

  const [isLoadingWebhook, setIsLoadingWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [webhookSuccess, setWebhookSuccess] = useState<string | null>(null);

  // Load webhook URLs from user data
  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setWebhookUrls({
        success_url: userData.success_url || '',
        cancel_url: userData.cancel_url || '',
        callback_url: userData.callback_url || ''
      });
    }
  }, []);

  const handleWebhookUpdate = async () => {
    setIsLoadingWebhook(true);
    setWebhookError(null);
    setWebhookSuccess(null);

    try {
      const payload = {
        email: getUserData()?.email,
        phone: getUserData()?.phone,
        first_name: getUserData()?.first_name,
        last_name: getUserData()?.last_name,
        country: getUserData()?.country,
        entreprise_name: getUserData()?.entreprise_name,
        website: getUserData()?.website,
        logo: getUserData()?.logo,
        success_url: webhookUrls.success_url,
        cancel_url: webhookUrls.cancel_url,
        callback_url: webhookUrls.callback_url,
        ip_adress: getUserData()?.ip_adress,
        trade_commerce: getUserData()?.trade_commerce,
        gerant_doc: getUserData()?.gerant_doc,
        entreprise_number: getUserData()?.entreprise_number
      };

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api/update-profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setWebhookSuccess('Webhook URLs updated successfully!');
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data));
        toast({
          title: "Success",
          description: "Webhook URLs updated successfully!",
        });
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.detail || errorData.message || 'Failed to update webhook URLs';
        setWebhookError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Webhook update error:', error);
      const errorMessage = 'Failed to update webhook URLs';
      setWebhookError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingWebhook(false);
    }
  };

  const handleRenewKeys = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api/generate-api-key`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.public_key && data.secret_key) {
        setApiKeys({ public: data.public_key, secret: data.secret_key });
      } else {
        alert(data.message || data.detail || t("failedToRenewApiKeys"));
      }
    } catch (err) {
      alert(t("failedToRenewApiKeys"));
    }
  };

  const handleCopy = async (key: string, value: string) => {
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

  const toggleVisibility = (key: keyof typeof visibilityStates) => {
    setVisibilityStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '•'.repeat(key.length - 16) + key.substring(key.length - 8);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 ">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black-500 dark:text-white">
            {t("developers")}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[t("apiKeysTab"), t("webhookTab")].map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(idx === 0 ? 'API Keys' : 'Webhook')}
                className={`px-6 py-4 font-medium transition-colors ${
                  (activeTab === 'API Keys' && idx === 0) || (activeTab === 'Webhook' && idx === 1)
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
                  {t("publicApiKey")}
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
                    {copiedStates.public ? t("copied") : t("copy")}
                  </button>
                </div>
              </div>

              {/* Secret */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("secret")}
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
                    {copiedStates.secret ? t("copied") : t("copy")}
                  </button>
                </div>
              </div>

              {/* Renew Button */}
              <div className="pt-4">
                <button
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-grey-600 transition-colors flex items-center gap-2 font-medium"
                  onClick={handleRenewKeys}
                  type="button"
                >
                  <RefreshCw size={16} />
                  {t("renewApiKeys")}
                </button>
              </div>
            </div>
          )}

          {/* Webhook Content */}
          {activeTab === 'Webhook' && (
            <div className="p-6 space-y-6">
              {/* Success URL */}
              <div className="space-y-2">
                <Label htmlFor="success_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL de Succès
                </Label>
                <Input
                  id="success_url"
                  type="url"
                  value={webhookUrls.success_url}
                  onChange={(e) => setWebhookUrls(prev => ({ ...prev, success_url: e.target.value }))}
                  disabled={isLoadingWebhook}
                  placeholder="https://yoursite.com/success"
                  className="w-full px-4 py-3 rounded-lg border transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:border-black dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
                />
              </div>

              {/* Cancel URL */}
              <div className="space-y-2">
                <Label htmlFor="cancel_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL d'Annulation
                </Label>
                <Input
                  id="cancel_url"
                  type="url"
                  value={webhookUrls.cancel_url}
                  onChange={(e) => setWebhookUrls(prev => ({ ...prev, cancel_url: e.target.value }))}
                  disabled={isLoadingWebhook}
                  placeholder="https://yoursite.com/cancel"
                  className="w-full px-4 py-3 rounded-lg border transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:border-black dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
                />
              </div>

              {/* Callback URL */}
              <div className="space-y-2">
                <Label htmlFor="callback_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL de Rappel
                </Label>
                <Input
                  id="callback_url"
                  type="url"
                  value={webhookUrls.callback_url}
                  onChange={(e) => setWebhookUrls(prev => ({ ...prev, callback_url: e.target.value }))}
                  disabled={isLoadingWebhook}
                  placeholder="https://yoursite.com/callback"
                  className="w-full px-4 py-3 rounded-lg border transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:border-black dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
                />
              </div>

              {/* Error and Success Messages */}
              {webhookError && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{webhookError}</span>
                </div>
              )}

              {webhookSuccess && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">{webhookSuccess}</span>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleWebhookUpdate}
                  disabled={isLoadingWebhook}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium"
                >
                  {isLoadingWebhook ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Sauvegarder les URLs
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <p className="text-sm">
            <strong>{t("securityNoticeTitle")}</strong> {t("securityNotice")}
          </p>
        </div>
      </div>
    </div>
  );
}