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
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { authenticatedFetch } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  entreprise_name: string
  website: string
  logo: string | null
  date_joined: string
  last_login: string | null
  success_url: string | null
  cancel_url: string | null
  callback_url: string | null
  entreprise_doc: Record<string, any>
  is_verify: boolean
  is_block: boolean
  availavailable_fund: number
}

export function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [entrepriseDocFile, setEntrepriseDocFile] = useState<File | null>(null)
  const [entrepriseDocPreview, setEntrepriseDocPreview] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()

  // Helper function to get user initials
  const getUserInitials = () => {
    if (!profile) return ''
    const firstName = profile.first_name || ''
    const lastName = profile.last_name || ''
    const firstInitial = firstName.charAt(0).toUpperCase()
    const lastInitial = lastName.charAt(0).toUpperCase()
    return `${firstInitial}${lastInitial}`
  }

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      // First, try to get user data from localStorage as a fallback
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setProfile(parsedUser)
          setFormData({
            first_name: parsedUser.first_name,
            last_name: parsedUser.last_name,
            email: parsedUser.email,
            phone: parsedUser.phone,
            country: parsedUser.country,
            entreprise_name: parsedUser.entreprise_name,
            website: parsedUser.website,
            success_url: parsedUser.success_url,
            cancel_url: parsedUser.cancel_url,
            callback_url: parsedUser.callback_url,
          })
        } catch (localStorageError) {
          console.error('Failed to parse user data from localStorage:', localStorageError)
        }
      }

      // Then try to fetch fresh data from API
      const accessToken = localStorage.getItem('access')
      if (!accessToken) {
        console.log('No access token available, using cached data')
        setIsLoading(false)
        return
      }

      // Check if token is expired
      const exp = localStorage.getItem('exp')
      if (exp) {
        const expDate = new Date(exp)
        const now = new Date()
        if (expDate <= now) {
          console.log('Token expired, using cached data')
          setIsLoading(false)
          return
        }
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user-details`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })
        
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          console.error('User profile API error:', response.status, response.statusText)
          setIsLoading(false)
          return
        }
        
        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Expected JSON response but got:', contentType)
          setIsLoading(false)
          return
        }
        
        const data = await response.json()
        setProfile(data)
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          country: data.country,
          entreprise_name: data.entreprise_name,
          website: data.website,
          success_url: data.success_url,
          cancel_url: data.cancel_url,
          callback_url: data.callback_url,
        })
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(data))
      } catch (apiError) {
        console.error('API call failed:', apiError)
        // Don't throw, just use cached data
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      toast({
        title: "Image Selected",
        description: "Click Save to update your profile",
      })
    }
  }

  const handleEntrepriseDocChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid document file (PDF, DOC, or DOCX)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please select a document smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setEntrepriseDocFile(file)
      setEntrepriseDocPreview(file.name)
      
      toast({
        title: "Document Selected",
        description: "Click Save to upload your document",
      })
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null

    const formData = new FormData()
    formData.append('file', file)

    try {
      console.log('Uploading file to:', `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`)
      
      // For file uploads, we need to handle authentication manually to avoid Content-Type conflicts
      const accessToken = localStorage.getItem('access')
      if (!accessToken) {
        toast({
          title: "Upload Error",
          description: "No access token available",
          variant: "destructive",
        })
        return null
      }

      // Check if token is expired and refresh if needed
      const exp = localStorage.getItem('exp')
      if (exp) {
        const expDate = new Date(exp)
        const now = new Date()
        if (expDate <= now) {
          // Try to refresh token
          const { refreshAccessToken } = await import('@/utils/auth')
          const refreshed = await refreshAccessToken(process.env.NEXT_PUBLIC_BASE_URL!)
          if (!refreshed) {
            toast({
              title: "Upload Error",
              description: "Token expired and refresh failed. Please log in again.",
              variant: "destructive",
            })
            return null
          }
        }
      }

      // Get the current access token (might be refreshed)
      const currentAccessToken = localStorage.getItem('access')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${currentAccessToken}`,
          // Don't set Content-Type for FormData - browser will set it automatically
        },
        body: formData,
      })

      console.log('Document upload response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Document upload error response:', errorText)
        throw new Error(`Document upload failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Document upload success data:', data)
      
      toast({
        title: "Document Upload Success",
        description: "Document uploaded successfully",
      })
      return data.file
    } catch (error) {
      console.error('Document upload error:', error)
      toast({
        title: "Document Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      })
      return null
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Handle logo - send file name as a regular string
      let logoValue = profile?.logo || null
      if (logoFile) {
        // Send just the file name as a string
        logoValue = logoFile.name
      }

      // Upload entreprise document if there's a new one
      let entrepriseDoc = profile?.entreprise_doc || {}
      if (entrepriseDocFile) {
        setIsUploading(true)
        const uploadedDoc = await uploadFile(entrepriseDocFile)
        setIsUploading(false)
        if (uploadedDoc) {
          entrepriseDoc = {
            ...entrepriseDoc,
            document: uploadedDoc // Add the uploaded document URL
          }
        } else {
          // If upload failed, don't proceed with profile update
          return
        }
      }

      const updateData = {
        ...formData,
        logo: logoValue,
        date_joined: profile?.date_joined,
        last_login: profile?.last_login,
        entreprise_doc: entrepriseDoc
      }

      // Use authenticatedFetch for automatic token refresh
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/update-profile`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      console.log('Profile update response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Profile update error response:', errorText)
        throw new Error(`Profile update failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Profile update success data:', data)
      
      setProfile(data)
      setIsEditing(false)
      setLogoFile(null)
      setLogoPreview(null)
      setEntrepriseDocFile(null)
      setEntrepriseDocPreview(null)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      email: profile?.email,
      phone: profile?.phone,
      country: profile?.country,
      entreprise_name: profile?.entreprise_name,
      website: profile?.website,
      success_url: profile?.success_url,
      cancel_url: profile?.cancel_url,
      callback_url: profile?.callback_url,
    })
    setLogoFile(null)
    setLogoPreview(null)
    setEntrepriseDocFile(null)
    setEntrepriseDocPreview(null)
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

  if (!profile) {
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
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : profile?.logo ? (
                      <img src={profile.logo} alt="Company logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold drop-shadow-sm">{getUserInitials()}</span>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-slate-600 text-white p-2 rounded-full cursor-pointer hover:bg-slate-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {profile.first_name} {profile.last_name}
                </CardTitle>
                <CardDescription className="text-neutral-600 dark:text-neutral-400">
                  {profile.entreprise_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{profile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{profile.country}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Globe className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">{profile.website}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t("verificationStatus")}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile.is_verify 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {profile.is_verify ? t("verified") : t("pending")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t("accountStatus")}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile.is_block 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {profile.is_block ? t("blocked") : t("active")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t("availableFunds")}</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {(profile.availavailable_fund || 0).toLocaleString()} FCFA
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
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-crimson-600 hover:bg-crimson-700 text-black dark:text-white rounded-2xl"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t("edit")}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="rounded-2xl border-slate-200 dark:border-neutral-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {t("cancel")}
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving || isUploading}
                        className="bg-crimson-600 hover:bg-crimson-700 text-white rounded-2xl"
                      >
                        {(isSaving || isUploading) ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isUploading ? t("uploading") : isSaving ? t("saving") : t("save")}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
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
                        value={formData.first_name || ''}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        disabled={!isEditing}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("lastName")}
                      </Label>
                      <Input
                        id="last_name"
                        value={formData.last_name || ''}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        disabled={!isEditing}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("emailAddress")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("phoneNumber")}
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("country")}
                      </Label>
                      <Input
                        id="country"
                        value={formData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        disabled={!isEditing}
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
                        value={formData.entreprise_name || ''}
                        onChange={(e) => handleInputChange('entreprise_name', e.target.value)}
                        disabled={!isEditing}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("website")}
                      </Label>
                      <Input
                        id="website"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={!isEditing}
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="success_url" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("successUrl")}
                      </Label>
                      <Input
                        id="success_url"
                        value={formData.success_url || ''}
                        onChange={(e) => handleInputChange('success_url', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://yoursite.com/success"
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cancel_url" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("cancelUrl")}
                      </Label>
                      <Input
                        id="cancel_url"
                        value={formData.cancel_url || ''}
                        onChange={(e) => handleInputChange('cancel_url', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://yoursite.com/cancel"
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="callback_url" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("callbackUrl")}
                      </Label>
                      <Input
                        id="callback_url"
                        value={formData.callback_url || ''}
                        onChange={(e) => handleInputChange('callback_url', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://yoursite.com/callback"
                        className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="entreprise_doc" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("companyDocument")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="entreprise_doc"
                          value={entrepriseDocPreview || profile?.entreprise_doc?.document || ''}
                          disabled={true}
                          placeholder={t("selectDocument")}
                          className="h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent pr-12"
                        />
                        {isEditing && (
                          <label className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-600 text-white p-2 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                            <Upload className="w-4 h-4" />
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleEntrepriseDocChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {entrepriseDocPreview && (
                        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          <span>{t("documentSelected")}: {entrepriseDocPreview}</span>
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
                        {new Date(profile.date_joined).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("lastLogin")}
                      </Label>
                      <div className="h-12 bg-slate-50/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl flex items-center px-4 text-neutral-600 dark:text-neutral-400">
                        {profile.last_login ? new Date(profile.last_login).toLocaleDateString() : t("never")}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
