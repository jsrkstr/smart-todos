"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTagStore } from "@/lib/store/useTagStore"
import { useToast } from "@/hooks/use-toast"
import type { Tag, TagCategory } from "@/types/task"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagCreated?: (tag: Tag) => void
}

export function TagDialog({ open, onOpenChange, onTagCreated }: TagDialogProps) {
  const { addTag, addCategory, categories } = useTagStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("tag")
  
  // Tag form state
  const [tagName, setTagName] = useState<string>("")
  const [tagColor, setTagColor] = useState<string>("#6366F1") // Default color
  const [categoryId, setCategoryId] = useState<string>("")
  
  // Category form state
  const [categoryName, setCategoryName] = useState<string>("")

  // Color options
  const colorOptions = [
    { value: "#6366F1", label: "Indigo" },
    { value: "#8B5CF6", label: "Violet" },
    { value: "#EC4899", label: "Pink" },
    { value: "#EF4444", label: "Red" },
    { value: "#F97316", label: "Orange" },
    { value: "#EAB308", label: "Yellow" },
    { value: "#22C55E", label: "Green" },
    { value: "#06B6D4", label: "Cyan" },
    { value: "#3B82F6", label: "Blue" },
    { value: "#64748B", label: "Slate" },
  ]

  const resetForm = () => {
    setTagName("")
    setTagColor("#6366F1")
    setCategoryId("")
    setCategoryName("")
  }

  const handleCreateTag = async () => {
    try {
      if (!tagName.trim()) {
        toast({
          title: "Error",
          description: "Tag name is required",
          variant: "destructive",
        })
        return
      }
      
      const newTag = await addTag({
        name: tagName.trim(),
        color: tagColor,
        categoryId: categoryId || undefined
      })
      
      if (newTag) {
        toast({
          title: "Success",
          description: "Tag created successfully",
        })
        
        if (onTagCreated) {
          onTagCreated(newTag)
        }
        
        resetForm()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to create tag:", error)
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateCategory = async () => {
    try {
      if (!categoryName.trim()) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive",
        })
        return
      }
      
      const newCategory = await addCategory({
        name: categoryName.trim()
      })
      
      if (newCategory) {
        toast({
          title: "Success",
          description: "Category created successfully",
        })
        
        resetForm()
        setActiveTab("tag") // Switch to tag tab after creating category
      }
    } catch (error) {
      console.error("Failed to create category:", error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tag">Create Tag</TabsTrigger>
            <TabsTrigger value="category">Create Category</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tag" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                placeholder="Enter tag name"
                value={tagName}
                onChange={e => setTagName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tag-color">Tag Color</Label>
              <div className="flex space-x-2">
                <Select value={tagColor} onValueChange={setTagColor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div 
                  className="w-10 h-10 rounded-md border" 
                  style={{ backgroundColor: tagColor }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tag-category">Category (Optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id as string}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="submit" onClick={handleCreateTag}>Create Tag</Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="category" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="Enter category name"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" onClick={handleCreateCategory}>Create Category</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 