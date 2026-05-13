import { Property } from '../types';
import { PROPERTIES } from '../data/properties';
import { REVIEWS } from '../data/reviews';
import { OSAKA_INFOS } from '../data/osakaInfo';
import { SITE_SETTINGS } from '../data/siteConfig';

export const firebaseService = {
  // Check if current user is admin (Always false in static mode, or mock check)
  async checkAdminStatus(_uid: string): Promise<boolean> {
    return false;
  },

  // Public: Get all properties
  async getProperties(type?: string): Promise<Property[]> {
    if (type && type !== 'all') {
      return PROPERTIES.filter(p => p.type === type);
    }
    return [...PROPERTIES].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  // Admin: Add property (Mock - does nothing)
  async addProperty(_data: any): Promise<string> {
    console.warn("Write operations are disabled in static mode.");
    return "";
  },

  // Admin: Update property (Mock - does nothing)
  async updateProperty(_id: string, _data: Partial<Property>): Promise<void> {
    console.warn("Write operations are disabled in static mode.");
  },

  // Admin: Delete property (Mock - does nothing)
  async deleteProperty(_id: string): Promise<void> {
    console.warn("Write operations are disabled in static mode.");
  },

  // Public: Get single property
  async getPropertyById(id: string): Promise<Property | null> {
    return PROPERTIES.find(p => p.id === id) || null;
  },

  // Site Settings
  async getSettings(): Promise<any> {
    return SITE_SETTINGS;
  },

  async updateSettings(_data: any): Promise<void> {
    console.warn("Write operations are disabled in static mode.");
  },

  // Reviews
  async getReviews(): Promise<any[]> {
    return [...REVIEWS].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async addReview(_data: any): Promise<string> {
    console.warn("Write operations are disabled in static mode.");
    return "";
  },

  async deleteReview(_id: string): Promise<void> {
    console.warn("Write operations are disabled in static mode.");
  },

  async updateReview(_id: string, _data: any): Promise<void> {
    console.warn("Write operations are disabled in static mode.");
  },

  // Osaka Info
  async getOsakaInfos(): Promise<any[]> {
    return [...OSAKA_INFOS].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async addOsakaInfo(_data: any): Promise<string> {
    console.warn("Write operations are disabled in static mode.");
    return "";
  },

  async updateOsakaInfo(_id: string, _data: any): Promise<void> {
    console.warn("Write operations are disabled in static mode.");
  },

  async deleteOsakaInfo(_id: string): Promise<void> {
    console.warn("Write operations are disabled in static mode.");
  }
};

