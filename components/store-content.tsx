"use client"

import React, { useState, useEffect } from "react"
import { smartFetch } from "@/utils/auth"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Upload,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Link,
  Settings
} from "lucide-react"
import { format } from "date-fns"

interface Product {
  uid: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  status: string
  image_url: string | null
  created_at: string
  updated_at: string
  total_sales: number
  revenue: number
  stock_quantity: number
}

interface StoreStats {
  total_products: number
  total_sales: number
  total_revenue: number
  active_products: number
  low_stock_products: number
}

export function StoreContent() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [storeStats, setStoreStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")
  
  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "XOF",
    category: "",
    status: "active",
    stock_quantity: ""
  })
  const [productLoading, setProductLoading] = useState(false)

  useEffect(() => {
    loadStoreData()
  }, [])

  const loadStoreData = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockProducts: Product[] = [
        {
          uid: "1",
          name: "Premium T-Shirt",
          description: "High-quality cotton t-shirt with modern design",
          price: 15000,
          currency: "XOF",
          category: "Clothing",
          status: "active",
          image_url: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-15T10:30:00Z",
          total_sales: 25,
          revenue: 375000,
          stock_quantity: 50
        },
        {
          uid: "2",
          name: "Wireless Headphones",
          description: "Noise-cancelling wireless headphones",
          price: 45000,
          currency: "XOF",
          category: "Electronics",
          status: "active",
          image_url: null,
          created_at: "2025-01-02T00:00:00Z",
          updated_at: "2025-01-14T09:15:00Z",
          total_sales: 12,
          revenue: 540000,
          stock_quantity: 8
        },
        {
          uid: "3",
          name: "Coffee Mug",
          description: "Ceramic coffee mug with logo",
          price: 5000,
          currency: "XOF",
          category: "Accessories",
          status: "inactive",
          image_url: null,
          created_at: "2025-01-03T00:00:00Z",
          updated_at: "2025-01-10T14:20:00Z",
          total_sales: 5,
          revenue: 25000,
          stock_quantity: 0
        }
      ]
      
      const mockStats: StoreStats = {
        total_products: mockProducts.length,
        total_sales: mockProducts.reduce((sum, p) => sum + p.total_sales, 0),
        total_revenue: mockProducts.reduce((sum, p) => sum + p.revenue, 0),
        active_products: mockProducts.filter(p => p.status === "active").length,
        low_stock_products: mockProducts.filter(p => p.stock_quantity < 10).length
      }
      
      setProducts(mockProducts)
      setStoreStats(mockStats)
    } catch (error) {
      console.error("Failed to load store data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductLoading(true)
    
    try {
      // Mock API call - replace with actual implementation
      console.log("Product form submitted:", productForm)
      
      setProductDialogOpen(false)
      setProductForm({ name: "", description: "", price: "", currency: "XOF", category: "", status: "active", stock_quantity: "" })
      setEditingProduct(null)
      loadStoreData()
    } catch (error) {
      console.error("Failed to save product:", error)
    } finally {
      setProductLoading(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency,
      category: product.category,
      status: product.status,
      stock_quantity: product.stock_quantity.toString()
    })
    setProductDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        // Mock API call - replace with actual implementation
        console.log("Deleting product:", productId)
        loadStoreData()
      } catch (error) {
        console.error("Failed to delete product:", error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: "bg-red-100 text-red-800", text: "Out of Stock" }
    if (quantity < 10) return { color: "bg-yellow-100 text-yellow-800", text: "Low Stock" }
    return { color: "bg-green-100 text-green-800", text: "In Stock" }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    const matchesStatus = statusFilter === "all" || product.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-crimson-600" />
          <span className="text-lg font-medium">{t("loading")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t("myStore")}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your products and track sales performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStoreData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Update product information" : "Add a new product to your store"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-price">Price</Label>
                    <Input
                      id="product-price"
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-currency">Currency</Label>
                    <Select
                      value={productForm.currency}
                      onValueChange={(value) => setProductForm({ ...productForm, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">XOF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-category">Category</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-stock">Stock Quantity</Label>
                    <Input
                      id="product-stock"
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                      placeholder="Enter stock quantity"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="product-status">Status</Label>
                  <Select
                    value={productForm.status}
                    onValueChange={(value) => setProductForm({ ...productForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={productLoading}>
                  {productLoading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {storeStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.total_products}</div>
              <p className="text-xs text-muted-foreground">
                All products in store
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.active_products}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.total_sales}</div>
              <p className="text-xs text-muted-foreground">
                All time sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.total_revenue.toLocaleString()} XOF</div>
              <p className="text-xs text-muted-foreground">
                All time revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.low_stock_products}</div>
              <p className="text-xs text-muted-foreground">
                Need restocking
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Home">Home</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage and view all your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock_quantity)
              return (
                <div key={product.uid} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>{product.category}</span>
                        <span>{product.price.toLocaleString()} {product.currency}</span>
                        <span>{product.stock_quantity} in stock</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{product.total_sales} sales</p>
                      <p className="text-xs text-muted-foreground">
                        {product.revenue.toLocaleString()} XOF revenue
                      </p>
                    </div>
                    <Badge className={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                    <Badge className={stockStatus.color}>
                      {stockStatus.text}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.uid)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

