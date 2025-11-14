import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface InventoryItem {
  id: string;
  barcode: string;
  quantity: number;
  scanned_at: string;
  product_name?: string;
  is_ai_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface InventoryContextType {
  items: InventoryItem[];
  loading: boolean;
  addItems: (items: { barcode: string; quantity: number; product_name?: string; is_ai_generated?: boolean }[]) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearInventory: () => Promise<void>;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItems = async (newItems: { barcode: string; quantity: number; product_name?: string; is_ai_generated?: boolean }[]) => {
    try {
      const itemsToAdd = newItems.map(item => ({
        barcode: item.barcode,
        quantity: item.quantity,
        product_name: item.product_name,
        is_ai_generated: item.is_ai_generated || false,
        scanned_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToAdd);

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Error adding items:', error);
      throw error;
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const clearInventory = async () => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Error clearing inventory:', error);
    }
  };

  const refreshInventory = async () => {
    await loadInventory();
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        loading,
        addItems,
        updateQuantity,
        removeItem,
        clearInventory,
        refreshInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
}
