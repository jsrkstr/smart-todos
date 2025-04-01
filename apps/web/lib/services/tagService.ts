import { Tag, TagCategory, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface CreateTagInput {
  name: string;
  color: string;
  categoryId?: string;
}

export interface UpdateTagInput {
  id: string;
  name?: string;
  color?: string;
  categoryId?: string;
}

export interface CreateTagCategoryInput {
  name: string;
}

export interface UpdateTagCategoryInput {
  id: string;
  name?: string;
}

export class TagService {
  static async createTag(input: CreateTagInput): Promise<Tag> {
    const { categoryId, ...tagData } = input

    return prisma.tag.create({
      data: {
        ...tagData,
        category: categoryId ? {
          connect: { id: categoryId }
        } : undefined
      },
      include: { category: true }
    })
  }

  static async updateTag(input: UpdateTagInput): Promise<Tag> {
    const { id, categoryId, ...updates } = input

    return prisma.tag.update({
      where: { id },
      data: {
        ...updates,
        category: categoryId ? {
          connect: { id: categoryId }
        } : categoryId === null ? {
          disconnect: true
        } : undefined
      },
      include: { category: true }
    })
  }

  static async deleteTag(id: string): Promise<void> {
    await prisma.tag.delete({
      where: { id }
    })
  }

  static async getTags(): Promise<Tag[]> {
    return prisma.tag.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    })
  }

  static async getTag(id: string): Promise<Tag | null> {
    return prisma.tag.findUnique({
      where: { id },
      include: { category: true }
    })
  }

  // Tag Category Methods
  static async createTagCategory(input: CreateTagCategoryInput): Promise<TagCategory> {
    return prisma.tagCategory.create({
      data: input,
      include: { tags: true }
    })
  }

  static async updateTagCategory(input: UpdateTagCategoryInput): Promise<TagCategory> {
    const { id, ...updates } = input

    return prisma.tagCategory.update({
      where: { id },
      data: updates,
      include: { tags: true }
    })
  }

  static async deleteTagCategory(id: string): Promise<void> {
    // This will disconnect all tags from this category
    await prisma.tagCategory.delete({
      where: { id }
    })
  }

  static async getTagCategories(): Promise<TagCategory[]> {
    return prisma.tagCategory.findMany({
      include: { tags: true },
      orderBy: { name: 'asc' }
    })
  }

  static async getTagCategory(id: string): Promise<TagCategory | null> {
    return prisma.tagCategory.findUnique({
      where: { id },
      include: { tags: true }
    })
  }
} 