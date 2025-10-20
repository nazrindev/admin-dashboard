import { Injectable } from '@angular/core';
import { ProductInfo } from './ai-form-fill.service';

@Injectable({
  providedIn: 'root',
})
export class LocalAiFallbackService {
  constructor() {}

  async extractFromImageFallback(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    try {
      // Extract basic information from filename
      const filename = imageFile.name.toLowerCase();
      const extractedInfo = this.extractFromFilename(filename);

      if (Object.keys(extractedInfo).length === 0) {
        return {
          success: false,
          error: 'Could not extract product information from filename',
        };
      }

      return { success: true, data: extractedInfo };
    } catch (error) {
      return {
        success: false,
        error: `Local analysis failed: ${error}`,
      };
    }
  }

  private extractFromFilename(filename: string): ProductInfo {
    const info: ProductInfo = {};

    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Extract product name (capitalize first letter of each word)
    const words = nameWithoutExt.split(/[-_\s]+/);
    const productName = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (productName) {
      info.productName = productName;
    }

    // Extract category based on keywords
    const category = this.extractCategory(filename);
    if (category) {
      info.category = category;
    }

    // Extract brand based on common brand patterns
    const brand = this.extractBrand(filename);
    if (brand) {
      info.brand = brand;
    }

    // Extract color based on common color names
    const color = this.extractColor(filename);
    if (color) {
      info.color = color;
    }

    // Extract size based on common size patterns
    const size = this.extractSize(filename);
    if (size) {
      info.size = size;
    }

    // Extract gender based on keywords
    const gender = this.extractGender(filename);
    if (gender) {
      info.gender = gender;
    }

    // Extract material based on common materials
    const material = this.extractMaterial(filename);
    if (material) {
      info.material = material;
    }

    // Extract occasion based on keywords
    const occasion = this.extractOccasion(filename);
    if (occasion) {
      info.occasion = occasion;
    }

    // Generate tags based on extracted information
    const tags = this.generateTags(info);
    if (tags.length > 0) {
      info.tags = tags.join(', ');
    }

    return info;
  }

  private extractCategory(filename: string): string | null {
    const categories = {
      clothing: [
        'shirt',
        'tshirt',
        't-shirt',
        'pants',
        'jeans',
        'dress',
        'skirt',
        'jacket',
        'coat',
        'hoodie',
        'sweater',
      ],
      shoes: ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'loafer', 'oxford'],
      accessories: [
        'bag',
        'handbag',
        'purse',
        'wallet',
        'belt',
        'watch',
        'necklace',
        'ring',
        'bracelet',
      ],
      electronics: [
        'phone',
        'laptop',
        'tablet',
        'headphone',
        'speaker',
        'camera',
      ],
      home: ['chair', 'table', 'lamp', 'sofa', 'bed', 'desk', 'shelf'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => filename.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return null;
  }

  private extractBrand(filename: string): string | null {
    const brands = [
      'nike',
      'adidas',
      'puma',
      'reebok',
      'converse',
      'vans',
      'gucci',
      'prada',
      'versace',
      'armani',
      'calvin',
      'ralph',
      'tommy',
      'hugo',
      'boss',
      'zara',
      'h&m',
      'uniqlo',
      'apple',
      'samsung',
      'sony',
      'lg',
      'dell',
      'hp',
    ];

    for (const brand of brands) {
      if (filename.includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }

    return null;
  }

  private extractColor(filename: string): string | null {
    const colors = [
      'black',
      'white',
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'pink',
      'brown',
      'gray',
      'grey',
      'navy',
      'beige',
      'cream',
      'maroon',
      'burgundy',
      'turquoise',
      'coral',
      'gold',
      'silver',
      'bronze',
      'copper',
    ];

    for (const color of colors) {
      if (filename.includes(color)) {
        return color.charAt(0).toUpperCase() + color.slice(1);
      }
    }

    return null;
  }

  private extractSize(filename: string): string | null {
    const sizes = [
      'xs',
      's',
      'm',
      'l',
      'xl',
      'xxl',
      'xxxl',
      'small',
      'medium',
      'large',
      'extra-large',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '39',
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
    ];

    for (const size of sizes) {
      if (filename.includes(size)) {
        return size.toUpperCase();
      }
    }

    return null;
  }

  private extractGender(filename: string): string | null {
    if (
      filename.includes('men') ||
      filename.includes('male') ||
      filename.includes('boy')
    ) {
      return 'Men';
    }
    if (
      filename.includes('women') ||
      filename.includes('female') ||
      filename.includes('girl') ||
      filename.includes('lady')
    ) {
      return 'Women';
    }
    if (filename.includes('unisex')) {
      return 'Unisex';
    }

    return null;
  }

  private extractMaterial(filename: string): string | null {
    const materials = [
      'cotton',
      'polyester',
      'wool',
      'silk',
      'leather',
      'denim',
      'canvas',
      'nylon',
      'spandex',
      'linen',
      'cashmere',
      'suede',
      'rubber',
      'plastic',
      'metal',
      'wood',
      'glass',
      'ceramic',
    ];

    for (const material of materials) {
      if (filename.includes(material)) {
        return material.charAt(0).toUpperCase() + material.slice(1);
      }
    }

    return null;
  }

  private extractOccasion(filename: string): string | null {
    if (filename.includes('casual') || filename.includes('everyday')) {
      return 'Casual';
    }
    if (
      filename.includes('formal') ||
      filename.includes('business') ||
      filename.includes('suit')
    ) {
      return 'Formal';
    }
    if (
      filename.includes('sport') ||
      filename.includes('athletic') ||
      filename.includes('gym')
    ) {
      return 'Sports';
    }
    if (
      filename.includes('party') ||
      filename.includes('evening') ||
      filename.includes('dressy')
    ) {
      return 'Party';
    }

    return null;
  }

  private generateTags(info: ProductInfo): string[] {
    const tags: string[] = [];

    if (info.productName) {
      tags.push(info.productName.toLowerCase());
    }
    if (info.category) {
      tags.push(info.category.toLowerCase());
    }
    if (info.brand) {
      tags.push(info.brand.toLowerCase());
    }
    if (info.color) {
      tags.push(info.color.toLowerCase());
    }
    if (info.gender) {
      tags.push(info.gender.toLowerCase());
    }
    if (info.occasion) {
      tags.push(info.occasion.toLowerCase());
    }
    if (info.material) {
      tags.push(info.material.toLowerCase());
    }

    // Remove duplicates
    return [...new Set(tags)];
  }
}
