"use client"

import React, { useState, useEffect, useRef } from "react"
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
  FileText,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { smartFetch } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"
import { useUserProfile, UserProfile as UserProfileType } from "@/contexts/user-profile-context"
import { useUserConfig } from "@/contexts/user-config-context"

type UserProfile = UserProfileType

export function ProfileContent() {
  const {
    userProfile: contextProfile,
    isLoading: isProfileLoading,
    refreshUserProfile,
    updateCachedProfile
  } = useUserProfile()
  const { userConfig } = useUserConfig()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(contextProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verificationSubmitted, setVerificationSubmitted] = useState(false)

  // State to store uploaded file URLs temporarily
  const [uploadedFiles, setUploadedFiles] = useState<{
    logo?: string
    trade_commerce?: string
    gerant_doc?: string
  }>({})

  // State to store individual file upload success messages
  const [fileUploadSuccess, setFileUploadSuccess] = useState<{
    logo?: string
    trade_commerce?: string
    gerant_doc?: string
  }>({})

  // State to store selected file names
  const [selectedFileNames, setSelectedFileNames] = useState<{
    logo?: string
    trade_commerce?: string
    gerant_doc?: string
  }>({})

  // Loading state per upload field
  const [uploading, setUploading] = useState<{
    logo?: boolean
    trade_commerce?: boolean
    gerant_doc?: boolean
  }>({})

  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const tradeCommerceInputRef = useRef<HTMLInputElement | null>(null)
  const gerantDocInputRef = useRef<HTMLInputElement | null>(null)

  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const updateProfileState = (patch: Partial<UserProfile>) => {
    setUserProfile((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  useEffect(() => {
    setUserProfile(contextProfile ?? null)
  }, [contextProfile])

  useEffect(() => {
    if (!contextProfile) {
      refreshUserProfile().catch(() => null)
    }
  }, [contextProfile, refreshUserProfile])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'trade_commerce' | 'gerant_doc') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Store the selected file name
    setSelectedFileNames((prev) => ({ ...prev, [field]: file.name }))

    setUploading((prev) => ({ ...prev, [field]: true }))
    setError(null)
    // Don't clear global success state for file uploads - use individual success states

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

        const successMessage = `${field === 'logo' ? 'Logo' : field === 'trade_commerce' ? 'Trade Commerce Document' : 'Manager Document'} uploaded successfully!`

        // Store individual success message
        setFileUploadSuccess((prev) => ({ ...prev, [field]: successMessage }))

        // Clear success message after 3 seconds
        setTimeout(() => {
          setFileUploadSuccess((prev) => {
            const newSuccess = { ...prev }
            delete newSuccess[field]
            return newSuccess
          })
        }, 3000)

        // Store uploaded file URL in temporary state
        if (data.file || data.url || data.logo) {
          const fileUrl = data.file || data.url || data.logo
          setUploadedFiles((prev) => {
            const newFiles = { ...prev, [field]: fileUrl }
            return newFiles
          })
        } else {
        }
      } else {
        const errorData = await res.json()
        const errorMessage = typeof errorData.detail === 'string' ? errorData.detail :
          typeof errorData.message === 'string' ? errorData.message :
            'Failed to upload file'
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload file')
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!userProfile) return
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData(e.currentTarget)
      const payload = {
        email: emptyStringToNull(formData.get('email')),
        phone: emptyStringToNull(formData.get('phone')),
        first_name: emptyStringToNull(formData.get('first_name')),
        last_name: emptyStringToNull(formData.get('last_name')),
        country: emptyStringToNull(formData.get('country')),
        entreprise_name: emptyStringToNull(formData.get('entreprise_name')),
        website: emptyStringToNull(formData.get('website')),
        logo: uploadedFiles.logo || userProfile.logo || null,
        ip_adress: emptyStringToNull(formData.get('ip_adress')),
        trade_commerce: uploadedFiles.trade_commerce || userProfile.trade_commerce || null,
        gerant_doc: uploadedFiles.gerant_doc || userProfile.gerant_doc || null,
        entreprise_number: emptyStringToNull(formData.get('entreprise_number')),
        success_url: emptyStringToNull(formData.get('success_url')) || userProfile.success_url || `${window.location.origin}/success`,
        cancel_url: emptyStringToNull(formData.get('cancel_url')) || userProfile.cancel_url || `${window.location.origin}/cancel`,
        callback_url: emptyStringToNull(formData.get('callback_url')) || userProfile.callback_url || `${window.location.origin}/callback`
      }

      // Debug logging

      const res = await smartFetch(`${baseUrl}/v1/api/update-profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
        updateCachedProfile(data)
        setSuccess('Profile updated successfully!')

        // Clear uploaded files state after successful update
        setUploadedFiles({})
        setFileUploadSuccess({})
        setSelectedFileNames({})

        // Check if verification documents were submitted
        const hasVerificationDocs = formData.get('entreprise_number') ||
          uploadedFiles.trade_commerce || userProfile.trade_commerce ||
          uploadedFiles.gerant_doc || userProfile.gerant_doc

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
        let errorMessage = 'Failed to update profile'

        if (Array.isArray(errorData.detail)) {
          // Handle validation errors array
          const validationErrors = errorData.detail.map((err: any) =>
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ')
          errorMessage = `Validation errors: ${validationErrors}`
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        }

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
      setIsSaving(false)
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

  // Helper function to get current file URL (uploaded or existing)
  const getCurrentFileUrl = (field: 'logo' | 'trade_commerce' | 'gerant_doc') => {
    return uploadedFiles[field] || userProfile?.[field]
  }

  // Helper function to clear uploaded file
  const clearUploadedFile = (field: 'logo' | 'trade_commerce' | 'gerant_doc') => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev }
      delete newFiles[field]
      return newFiles
    })
    setFileUploadSuccess((prev) => {
      const newSuccess = { ...prev }
      delete newSuccess[field]
      return newSuccess
    })
    setSelectedFileNames((prev) => {
      const newNames = { ...prev }
      delete newNames[field]
      return newNames
    })
  }

  // Helper function to convert empty strings to null
  const emptyStringToNull = (value: any) => {
    if (value === '' || value === undefined) return null
    return value
  }

  if (isProfileLoading && !userProfile) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-border border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-blue-600">{t("loadingProfile")}</span>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t("profileNotFound")}</h2>
          <p className="text-muted-foreground">{t("unableToLoadProfile")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">{t("profile")}</h1>
          <p className="text-muted-foreground text-lg">{t("manageAccountInfo")}</p>
        </div>

        {userConfig && (
          <Card className="mb-8 bg-card border-border shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Configuration
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Settings applied to your API and payouts
                </CardDescription>
              </div>
              <Badge className={userConfig.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {userConfig.is_active ? t("balanceActive") : t("balanceInactive")}
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fees</p>
                  <p className="text-lg font-semibold text-foreground">
                    Payin: {userConfig.use_fixed_fees && userConfig.payin_fee_fixed != null ? `${userConfig.payin_fee_fixed.toLocaleString()} XOF` : `${userConfig.payin_fee_rate}%`}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    Payout: {userConfig.use_fixed_fees && userConfig.payout_fee_fixed != null ? `${userConfig.payout_fee_fixed.toLocaleString()} XOF` : `${userConfig.payout_fee_rate}%`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Webhook</p>
                  <p className="text-sm text-foreground break-all">
                    {userConfig.webhook_url || "Not configured"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {(userConfig.daily_payin_limit || userConfig.daily_payout_limit) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Daily limits</p>
                    <ul className="text-sm text-foreground space-y-1">
                      {userConfig.daily_payin_limit && <li>Payin: {userConfig.daily_payin_limit.toLocaleString()} XOF</li>}
                      {userConfig.daily_payout_limit && <li>Payout: {userConfig.daily_payout_limit.toLocaleString()} XOF</li>}
                    </ul>
                  </div>
                )}
                {(userConfig.monthly_payin_limit || userConfig.monthly_payout_limit) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly limits</p>
                    <ul className="text-sm text-foreground space-y-1">
                      {userConfig.monthly_payin_limit && <li>Payin: {userConfig.monthly_payin_limit.toLocaleString()} XOF</li>}
                      {userConfig.monthly_payout_limit && <li>Payout: {userConfig.monthly_payout_limit.toLocaleString()} XOF</li>}
                    </ul>
                  </div>
                )}
                {userConfig.ip_whitelist?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Whitelisted IPs</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {userConfig.ip_whitelist?.map((ip) => (
                        <Badge key={ip} className="bg-muted text-foreground/80">
                          {ip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="text-center pb-6 pt-8">
                <div className="relative mx-auto mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-500 via-slate-400 to-slate-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative shadow-lg">
                    {getCurrentFileUrl('logo') ? (
                      <img src={getCurrentFileUrl('logo') as string} alt="Company logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold drop-shadow-sm">{getUserInitials()}</span>
                    )}
                  </div>
                  {/* Removed file upload label as it's now handled by Input */}
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {userProfile.first_name} {userProfile.last_name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {userProfile.entreprise_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{userProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{userProfile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{userProfile.country}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{userProfile.website}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("accountStatus")}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${userProfile.account_status === 'active' || userProfile.account_status === 'verify'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : userProfile.account_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                      {userProfile.account_status === 'active' ? t("active") :
                        userProfile.account_status === 'pending' ? t("pending") :
                          userProfile.account_status === 'verify' ? t("verified") :
                            userProfile.account_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Type</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${userProfile.is_partner
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-muted text-foreground'
                      }`}>
                      {userProfile.is_partner ? "Partner" : "Customer"}
                    </span>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-8">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {t("personalInformation")}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
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
                      <h3 className="text-lg font-semibold text-foreground mb-4">{t("personalDetails")}</h3>

                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-semibold text-foreground/80">
                          {t("firstName")}
                        </Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={userProfile.first_name || ''}
                          onChange={(e) => updateProfileState({ first_name: e.target.value })}
                          disabled={isSaving}
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-semibold text-foreground/80">
                          {t("lastName")}
                        </Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={userProfile.last_name || ''}
                          onChange={(e) => updateProfileState({ last_name: e.target.value })}
                          disabled={isSaving}
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">
                          {t("emailAddress")}
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={userProfile.email || ''}
                          onChange={(e) => updateProfileState({ email: e.target.value })}
                          disabled={isSaving}
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-foreground/80">
                          {t("phoneNumber")}
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={userProfile.phone || ''}
                          onChange={(e) => updateProfileState({ phone: e.target.value })}
                          disabled={isSaving}
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-semibold text-foreground/80">
                          {t("country")}
                        </Label>
                        <Input
                          id="country"
                          name="country"
                          value={userProfile.country || ''}
                          onChange={(e) => updateProfileState({ country: e.target.value })}
                          disabled={isSaving}
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Business Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground mb-4">{t("businessDetails")}</h3>

                      <div className="space-y-2">
                        <Label htmlFor="entreprise_name" className="text-sm font-semibold text-foreground/80">
                          {t("companyName")}
                        </Label>
                        <Input
                          id="entreprise_name"
                          name="entreprise_name"
                          value={userProfile.entreprise_name || ''}
                          onChange={(e) => updateProfileState({ entreprise_name: e.target.value })}
                          disabled={isSaving}
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-semibold text-foreground/80">
                          {t("website")}
                        </Label>
                        <Input
                          id="website"
                          name="website"
                          value={userProfile.website || ''}
                          onChange={(e) => updateProfileState({ website: e.target.value })}
                          disabled={isSaving}
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="logo" className="text-sm font-semibold text-foreground/80">
                          {t("companyLogo")}
                        </Label>
                        <div className="relative">
                          <Input
                            id="logo"
                            name="logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'logo')}
                            disabled={isSaving}
                            ref={logoInputRef}
                            className="hidden"
                          />
                          <div className="h-12 bg-muted/50 border border-border rounded-xl flex items-center justify-between px-4">
                            <span className="text-sm text-muted-foreground truncate">
                              {selectedFileNames.logo || getCurrentFileUrl('logo')?.split('/').pop() || t("noFileChosen")}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                              className="h-8 px-3"
                              disabled={uploading.logo}
                            >
                              {uploading.logo ? (
                                <span className="flex items-center space-x-2">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>{t("uploading") || "Uploading..."}</span>
                                </span>
                              ) : (
                                t("chooseFile")
                              )}
                            </Button>
                          </div>
                        </div>
                        {fileUploadSuccess.logo && (
                          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 mt-2">
                            <Check className="w-4 h-4" />
                            <span>{fileUploadSuccess.logo}</span>
                          </div>
                        )}
                        {selectedFileNames.logo && !fileUploadSuccess.logo && (
                          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                              <FileText className="w-4 h-4" />
                              <span>{selectedFileNames.logo}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => clearUploadedFile('logo')}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {getCurrentFileUrl('logo') && !selectedFileNames.logo && !fileUploadSuccess.logo && (
                          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-2">
                            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span>{getCurrentFileUrl('logo')?.split('/').pop()}</span>
                            </div>
                          </div>
                        )}
                        {error && (
                          <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 mt-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ip_adress" className="text-sm font-semibold text-foreground/80">
                          IP Address
                        </Label>
                        <Input
                          id="ip_adress"
                          name="ip_adress"
                          value={userProfile.ip_adress || ''}
                          onChange={(e) => updateProfileState({ ip_adress: e.target.value })}
                          disabled={isSaving}
                          placeholder="192.168.1.1"
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Verification Section */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Vérification de compte</h3>
                        <p className="text-sm text-muted-foreground">Documents requis pour la vérification du compte</p>
                      </div>
                    </div>

                    {verificationSubmitted && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
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

                    {/* Show verification message for pending/approved/verify accounts */}
                    {(userProfile?.account_status === 'pending' || userProfile?.account_status === 'approved' || userProfile?.account_status === 'verify') && (
                      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                              {userProfile?.account_status === 'pending'
                                ? 'Documents en cours de vérification'
                                : userProfile?.account_status === 'approved'
                                  ? 'Compte approuvé - Documents vérifiés'
                                  : 'Compte vérifié - Documents vérifiés'}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {userProfile?.account_status === 'pending'
                                ? 'Vos documents sont en cours de vérification. Vous serez notifié par e-mail une fois la vérification terminée.'
                                : userProfile?.account_status === 'approved'
                                  ? 'Votre compte a été approuvé et vos documents ont été vérifiés avec succès.'
                                  : 'Votre compte est vérifié et vos documents ont été validés avec succès.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Only show document upload form if account status is not pending, approved, or verify */}
                    {userProfile?.account_status !== 'pending' && userProfile?.account_status !== 'approved' && userProfile?.account_status !== 'verify' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="entreprise_number" className="text-sm font-semibold text-foreground/80">
                            Numéro d&apos;Enregistrement de l&apos;Entreprise
                          </Label>
                          <Input
                            id="entreprise_number"
                            name="entreprise_number"
                            value={userProfile.entreprise_number || ''}
                            onChange={(e) => updateProfileState({ entreprise_number: e.target.value })}
                            disabled={isSaving}
                            placeholder="Entrez le numéro d'enregistrement de l'entreprise"
                            className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="trade_commerce" className="text-sm font-semibold text-foreground/80">
                            Document de Commerce
                          </Label>
                          <div className="relative">
                            <Input
                              id="trade_commerce"
                              name="trade_commerce"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, 'trade_commerce')}
                              disabled={isSaving}
                              ref={tradeCommerceInputRef}
                              className="hidden"
                            />
                            <div className="h-12 bg-muted/50 border border-border rounded-xl flex items-center justify-between px-4">
                              <span className="text-sm text-muted-foreground truncate">
                                {selectedFileNames.trade_commerce || getCurrentFileUrl('trade_commerce')?.split('/').pop() || t("noFileChosen")}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => tradeCommerceInputRef.current?.click()}
                                className="h-8 px-3"
                                disabled={uploading.trade_commerce}
                              >
                                {uploading.trade_commerce ? (
                                  <span className="flex items-center space-x-2">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>{t("uploading") || "Uploading..."}</span>
                                  </span>
                                ) : (
                                  t("chooseFile")
                                )}
                              </Button>
                            </div>
                          </div>
                          {fileUploadSuccess.trade_commerce && (
                            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 mt-2">
                              <Check className="w-4 h-4" />
                              <span>{fileUploadSuccess.trade_commerce}</span>
                            </div>
                          )}
                          {selectedFileNames.trade_commerce && !fileUploadSuccess.trade_commerce && (
                            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                                <FileText className="w-4 h-4" />
                                <span>{selectedFileNames.trade_commerce}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => clearUploadedFile('trade_commerce')}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {getCurrentFileUrl('trade_commerce') && !selectedFileNames.trade_commerce && !fileUploadSuccess.trade_commerce && (
                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-2">
                              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                                <Check className="w-4 h-4" />
                                <span>{getCurrentFileUrl('trade_commerce')?.split('/').pop()}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="gerant_doc" className="text-sm font-semibold text-foreground/80">
                            Document du Gérant
                          </Label>
                          <div className="relative">
                            <Input
                              id="gerant_doc"
                              name="gerant_doc"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, 'gerant_doc')}
                              disabled={isSaving}
                              ref={gerantDocInputRef}
                              className="hidden"
                            />
                            <div className="h-12 bg-muted/50 border border-border rounded-xl flex items-center justify-between px-4">
                              <span className="text-sm text-muted-foreground truncate">
                                {selectedFileNames.gerant_doc || getCurrentFileUrl('gerant_doc')?.split('/').pop() || t("noFileChosen")}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => gerantDocInputRef.current?.click()}
                                className="h-8 px-3"
                                disabled={uploading.gerant_doc}
                              >
                                {uploading.gerant_doc ? (
                                  <span className="flex items-center space-x-2">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>{t("uploading") || "Uploading..."}</span>
                                  </span>
                                ) : (
                                  t("chooseFile")
                                )}
                              </Button>
                            </div>
                          </div>
                          {fileUploadSuccess.gerant_doc && (
                            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 mt-2">
                              <Check className="w-4 h-4" />
                              <span>{fileUploadSuccess.gerant_doc}</span>
                            </div>
                          )}
                          {selectedFileNames.gerant_doc && !fileUploadSuccess.gerant_doc && (
                            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                                <FileText className="w-4 h-4" />
                                <span>{selectedFileNames.gerant_doc}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => clearUploadedFile('gerant_doc')}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {getCurrentFileUrl('gerant_doc') && !selectedFileNames.gerant_doc && !fileUploadSuccess.gerant_doc && (
                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-2">
                              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                                <Check className="w-4 h-4" />
                                <span>{getCurrentFileUrl('gerant_doc')?.split('/').pop()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* URL Configuration */}
                  {/* <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">URL Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="success_url" className="text-sm font-semibold text-foreground/80">
                          Success URL
                        </Label>
                        <Input
                          id="success_url"
                          name="success_url"
                          value={userProfile.success_url || `${window.location.origin}/success`}
                          onChange={(e) => updateProfileState({ success_url: e.target.value })}
                          disabled={isSaving}
                          placeholder="https://yoursite.com/success"
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cancel_url" className="text-sm font-semibold text-foreground/80">
                          Cancel URL
                        </Label>
                        <Input
                          id="cancel_url"
                          name="cancel_url"
                          value={userProfile.cancel_url || `${window.location.origin}/cancel`}
                          onChange={(e) => updateProfileState({ cancel_url: e.target.value })}
                          disabled={isSaving}
                          placeholder="https://yoursite.com/cancel"
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="callback_url" className="text-sm font-semibold text-foreground/80">
                          Callback URL
                        </Label>
                        <Input
                          id="callback_url"
                          name="callback_url"
                          value={userProfile.callback_url || `${window.location.origin}/callback`}
                          onChange={(e) => updateProfileState({ callback_url: e.target.value })}
                          disabled={isSaving}
                          placeholder="https://yoursite.com/callback"
                          className="h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div> */}

                  {/* Account Information */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t("accountInformation")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground/80">
                          {t("memberSince")}
                        </Label>
                        <div className="h-12 bg-muted/50 border border-border rounded-xl flex items-center px-4 text-muted-foreground">
                          {new Date(userProfile.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground/80">
                          Last Updated
                        </Label>
                        <div className="h-12 bg-muted/50 border border-border rounded-xl flex items-center px-4 text-muted-foreground">
                          {new Date(userProfile.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      type="button"
                      onClick={() => setUserProfile((prev) => (prev ? { ...prev } : prev))}
                      variant="outline"
                      className="rounded-xl border-border"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    >
                      {(isSaving) ? (
                        <div className="w-4 h-4 border-2 border-border border-t-white rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSaving ? t("saving") : t("save")}
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
