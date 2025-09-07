"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Building, 
  MapPin, 
  Camera, 
  Save, 
  Edit, 
  X,
  Upload,
  Check,
  AlertCircle,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch, getUserData } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  country: string | null
  entreprise_name: string | null
  website: string | null
  logo: string | null
  otp: string | null
  otp_created_at: string | null
  ip_adress: string | null
  success_url: string | null
  cancel_url: string | null
  callback_url: string | null
  reason_for_rejection: string | null
  account_status: string
  customer_pay_fee: boolean
  created_at: string
  updated_at: string
  fullname: string
  is_active: boolean
  is_partner: boolean
  trade_commerce: string | null
  gerant_doc: string | null
  entreprise_number: string | null
}

export function ProfileContent() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verificationSubmitted, setVerificationSubmitted] = useState(false)
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const loadUserProfile = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await smartFetch(`${baseUrl}/v1/api/user-details`, {
        method: 'GET',
      })

      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data))
      } else {
        const errorData = await res.json()
        const errorMessage = errorData.detail || errorData.message || 'Failed to load profile'
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Profile load error:', error)
      const errorMessage = 'Failed to load profile'
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

  useEffect(() => {
    // Load user profile from localStorage first, then from API
    const userData = getUserData()
    if (userData) {
      setUserProfile(userData)
    }
    // Always fetch fresh data from API
    loadUserProfile()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'trade_commerce' | 'gerant_doc') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await smartFetch(`${baseUrl}/prod/v1/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
        }
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(`${field === 'logo' ? 'Logo' : field === 'trade_commerce' ? 'Trade Commerce Document' : 'Manager Document'} uploaded successfully!`)
        
        // Update user profile with new file URL
        if (data.url || data.logo) {
          const fileUrl = data.url || data.logo
          setUserProfile((prev: any) => ({ ...prev, [field]: fileUrl }))
        }
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData(e.currentTarget)
      const payload = {
        email: formData.get('email'),
        phone: formData.get('phone'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        country: formData.get('country'),
        entreprise_name: formData.get('entreprise_name'),
        website: formData.get('website'),
        logo: userProfile.logo,
        ip_adress: formData.get('ip_adress'),
        trade_commerce: userProfile.trade_commerce,
        gerant_doc: userProfile.gerant_doc,
        entreprise_number: formData.get('entreprise_number')
      }

      const res = await smartFetch(`${baseUrl}/prod/v1/api/update-profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
        setSuccess('Profile updated successfully!')
        
        // Check if verification documents were submitted
        const hasVerificationDocs = formData.get('entreprise_number') || 
                                   userProfile.trade_commerce || 
                                   userProfile.gerant_doc
        
        if (hasVerificationDocs) {
          setVerificationSubmitted(true)
        }
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data))
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        })
      } else {
        const errorData = await res.json()
        const errorMessage = errorData.detail || errorData.message || 'Failed to update profile'
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      const errorMessage = 'Failed to update profile'
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

  // Helper function to get user initials
  const getUserInitials = () => {
    if (!userProfile) return ''
    const firstName = userProfile.first_name || ''
    const lastName = userProfile.last_name || ''
    const firstInitial = firstName.charAt(0).toUpperCase()
    const lastInitial = lastName.charAt(0).toUpperCase()
    return `${firstInitial}${lastInitial}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/30 dark:bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-blue-600">{t("loadingProfile")}</span>
        </div>
      </div>
    )
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
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">{t("profile")}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">{t("manageAccountInfo")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-6 pt-8">
                <div className="relative mx-auto mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-500 via-slate-400 to-slate-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative shadow-lg">
                    {userProfile?.logo ? (
                      <img src={userProfile.logo} alt="Company logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold drop-shadow-sm">{getUserInitials()}</span>
                    )}
                  </div>
                  {/* Removed file upload label as it's now handled by Input */}
                </div>
                <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {userProfile.first_name} {userProfile.last_name}
                </CardTitle>
                <CardDescription className="text-neutral-600 dark:text-neutral-400">
                  {userProfile.entreprise_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{userProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{userProfile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{userProfile.country}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Globe className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{userProfile.website}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t("accountStatus")}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userProfile.account_status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : userProfile.account_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {userProfile.account_status === 'active' ? t("active") : 
                       userProfile.account_status === 'pending' ? t("pending") : 
                       userProfile.account_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Account Type</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userProfile.is_partner 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {userProfile.is_partner ? "Partner" : "Customer"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Fee Payment</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userProfile.customer_pay_fee 
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {userProfile.customer_pay_fee ? "Customer Pays" : "Platform Pays"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-8">
                <div>
                  <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t("personalInformation")}
                  </CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400">
                    {t("updatePersonalBusinessInfo")}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {/* Removed edit button as it's now handled by Input */}
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <form onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{t("personalDetails")}</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("firstName")}
                        </Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={userProfile.first_name || ''}
                          onChange={(e) => setUserProfile((prev: typeof userProfile) => ({ ...prev, first_name: e.target.value }))}
                          disabled={isLoading}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("lastName")}
                        </Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={userProfile.last_name || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, last_name: e.target.value }))}
                          disabled={isLoading}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("emailAddress")}
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={userProfile.email || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, email: e.target.value }))}
                          disabled={isLoading}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("phoneNumber")}
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={userProfile.phone || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, phone: e.target.value }))}
                          disabled={isLoading}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("country")}
                        </Label>
                        <Input
                          id="country"
                          name="country"
                          value={userProfile.country || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, country: e.target.value }))}
                          disabled={isLoading}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Business Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{t("businessDetails")}</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="entreprise_name" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("companyName")}
                        </Label>
                        <Input
                          id="entreprise_name"
                          name="entreprise_name"
                          value={userProfile.entreprise_name || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, entreprise_name: e.target.value }))}
                          disabled={isLoading}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("website")}
                        </Label>
                        <Input
                          id="website"
                          name="website"
                          value={userProfile.website || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, website: e.target.value }))}
                          disabled={isLoading}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="logo" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("companyLogo")}
                        </Label>
                        <div className="relative">
                          <Input
                            id="logo"
                            name="logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'logo')}
                            disabled={isLoading}
                            className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent pr-12"
                          />
                          {isLoading && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-600 text-white p-2 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                              <Upload className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        {success && (
                          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 mt-2">
                            <Check className="w-4 h-4" />
                            <span>{success}</span>
                          </div>
                        )}
                        {error && (
                          <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 mt-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ip_adress" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          IP Address
                        </Label>
                        <Input
                          id="ip_adress"
                          name="ip_adress"
                          value={userProfile.ip_adress || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, ip_adress: e.target.value }))}
                          disabled={isLoading}
                          placeholder="192.168.1.1"
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Verification Section */}
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-neutral-700">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Documents de Vérification</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Documents requis pour la vérification du compte</p>
                      </div>
                    </div>

                    {verificationSubmitted && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                        <div className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              Documents soumis avec succès
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Un message sera envoyé à votre adresse e-mail pour vous informer que le statut de votre compte est en cours de traitement.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="entreprise_number" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Numéro d'Enregistrement de l'Entreprise
                        </Label>
                        <Input
                          id="entreprise_number"
                          name="entreprise_number"
                          value={userProfile.entreprise_number || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, entreprise_number: e.target.value }))}
                          disabled={isLoading}
                          placeholder="Entrez le numéro d'enregistrement de l'entreprise"
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trade_commerce" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Document de Commerce
                        </Label>
                        <div className="relative">
                          <Input
                            id="trade_commerce"
                            name="trade_commerce"
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, 'trade_commerce')}
                            disabled={isLoading}
                            className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent pr-12"
                          />
                          {isLoading && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-600 text-white p-2 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        {userProfile.trade_commerce && (
                          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 mt-2">
                            <Check className="w-4 h-4" />
                            <span>Document téléchargé: {userProfile.trade_commerce.split('/').pop()}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="gerant_doc" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Document du Gérant
                        </Label>
                        <div className="relative">
                          <Input
                            id="gerant_doc"
                            name="gerant_doc"
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, 'gerant_doc')}
                            disabled={isLoading}
                            className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent pr-12"
                          />
                          {isLoading && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-600 text-white p-2 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        {userProfile.gerant_doc && (
                          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 mt-2">
                            <Check className="w-4 h-4" />
                            <span>Document téléchargé: {userProfile.gerant_doc.split('/').pop()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{t("accountInformation")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {t("memberSince")}
                        </Label>
                        <div className="h-12 bg-slate-50/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl flex items-center px-4 text-neutral-600 dark:text-neutral-400">
                          {new Date(userProfile.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Last Updated
                        </Label>
                        <div className="h-12 bg-slate-50/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl flex items-center px-4 text-neutral-600 dark:text-neutral-400">
                          {new Date(userProfile.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      type="button"
                      onClick={() => setUserProfile((prev: typeof userProfile) => ({
                        ...prev,
                        first_name: prev.first_name,
                        last_name: prev.last_name,
                        email: prev.email,
                        phone: prev.phone,
                        country: prev.country,
                        entreprise_name: prev.entreprise_name,
                        website: prev.website,
                        success_url: prev.success_url,
                        cancel_url: prev.cancel_url,
                        callback_url: prev.callback_url,
                        logo: prev.logo,
                      }))}
                      variant="outline"
                      className="rounded-2xl border-slate-200 dark:border-neutral-700"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-crimson-600 hover:bg-slate-700 text-black dark:text-white  rounded-2xl"
                    >
                      {(isLoading) ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isLoading ? t("saving") : t("save")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
