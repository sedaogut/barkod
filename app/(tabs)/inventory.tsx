import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Package, Search, Trash2, Plus, Minus, Sparkles, Hash } from 'lucide-react-native';
import { useInventory } from '@/contexts/inventory';

export default function InventoryScreen() {
  const { items, loading, updateQuantity, removeItem, clearInventory } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearInventory = () => {
    Alert.alert(
      '⚠️ Dikkat',
      'Tüm envanteri silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: clearInventory,
        },
      ]
    );
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      '❓ Emin misiniz?',
      'Bu ürünü envanterden silmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => removeItem(id),
        },
      ]
    );
  };

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Package size={28} color="#fff" />
        <Text style={styles.headerTitle}>Envanter</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Envanter yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Package size={32} color="#2563eb" />
              <Text style={styles.statValue}>{totalItems}</Text>
              <Text style={styles.statLabel}>Ürün Çeşidi</Text>
            </View>
            <View style={styles.statCard}>
              <Hash size={32} color="#16a34a" />
              <Text style={styles.statValue}>{totalQuantity}</Text>
              <Text style={styles.statLabel}>Toplam Adet</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Barkod numarasına göre ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {items.length > 0 && (
            <View style={styles.clearContainer}>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearInventory}
              >
                <Trash2 size={18} color="#ef4444" />
                <Text style={styles.clearAllText}>Tüm Envanteri Temizle</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Package size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Sonuç Bulunamadı' : 'Envanter Boş'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Arama kriterlerine uygun ürün bulunamadı.'
                  : 'Barkod tarayıcıyı kullanarak ürün ekleyebilirsiniz.'}
              </Text>
            </View>
          ) : (
            <View style={styles.itemsContainer}>
              {filteredItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemBarcode}>{item.barcode}</Text>
                      {item.product_name && (
                        <View style={styles.productNameRow}>
                          {item.is_ai_generated && (
                            <Sparkles size={12} color="#9333ea" />
                          )}
                          <Text style={styles.itemProductName}>{item.product_name}</Text>
                        </View>
                      )}
                      <Text style={styles.itemTimestamp}>
                        {new Date(item.scanned_at).toLocaleString('tr-TR')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.id)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.quantityRow}>
                    <Text style={styles.quantityLabel}>Adet:</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        onPress={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.id, item.quantity - 1);
                          }
                        }}
                        style={[
                          styles.quantityButton,
                          item.quantity <= 1 && styles.quantityButtonDisabled,
                        ]}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={18} color={item.quantity <= 1 ? '#cbd5e1' : '#fff'} />
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        style={styles.quantityButton}
                      >
                        <Plus size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  clearContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemBarcode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemProductName: {
    fontSize: 14,
    color: '#9333ea',
    fontWeight: '500',
  },
  itemTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteButton: {
    padding: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    minWidth: 40,
    textAlign: 'center',
  },
});
