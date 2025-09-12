"use client"

import React, { useState, useEffect } from "react"
import { 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  UserCheck,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch, getUserData } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  account_status: string
  is_active: boolean
  is_partner: boolean
  customer_pay_fee: boolean
}

export function SettingContent() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })
  
  
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  useEffect(() => {
    // Load user profile from localStorage
    const userData = getUserData()
    if (userData) {
      setUserProfile(userData)
    }
  }, [])

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validation
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      setError('New passwords do not match')
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (passwordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long')
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const res = await smartFetch(`${baseUrl}/prod/v1/api/change-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData),
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess('Password changed successfully!')
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_new_password: ''
        })
        toast({
          title: "Success",
          description: "Password changed successfully!",
        })
      } else {
        const errorData = await res.json()
        const errorMessage = errorData.detail || errorData.message || 'Failed to change password'
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Password change error:', error)
      const errorMessage = 'Failed to change password'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-50/30 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">{t("profileNotFound")}</h2>
          <p className="text-neutral-600 dark:text-neutral-400">{t("unableToLoadProfile")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">Settings</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">Manage your account settings and security</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Password Change */}
          <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-6 pt-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400">
                    Update your password for better security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="old_password" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="old_password"
                        name="old_password"
                        type={showPasswords.old ? "text" : "password"}
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                        disabled={isLoading}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent pr-12"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('old')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        name="new_password"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        disabled={isLoading}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent pr-12"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_new_password" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      {t("confirmNewPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_new_password"
                        name="confirm_new_password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirm_new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                        disabled={isLoading}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent pr-12"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Changing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4" />
                        <span>Change Password</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* Current Account Status */}
        <Card className="mt-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-6 pt-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Current Account Status
                </CardTitle>
                <CardDescription className="text-neutral-600 dark:text-neutral-400">
                  View your current account information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {t("accountStatus")}
                </Label>
                <div className={`h-12 rounded-2xl flex items-center px-4 font-medium ${
                  userProfile.account_status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : userProfile.account_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {userProfile.account_status === 'active' ? t("active") : 
                   userProfile.account_status === 'pending' ? t("pending") : 
                   userProfile.account_status}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Account Type
                </Label>
                <div className={`h-12 rounded-2xl flex items-center px-4 font-medium ${
                  userProfile.is_partner 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {userProfile.is_partner ? "Partner" : "Customer"}
                </div>
              </div>
              
              
            </div>
          </CardContent>
        </Card>

        {/* Error and Success Messages */}
        {(error || success) && (
          <Card className="mt-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="px-6 py-4">
              {error && (
                <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center space-x-3 text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{success}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
