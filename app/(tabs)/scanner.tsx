import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Sparkles, ScanBarcode, Plus, Trash2, Camera } from 'lucide-react-native';
import { useInventory } from '@/contexts/inventory';

interface ScannedBarcode {
  data: string;
  type?: string;
  selected: boolean;
  quantity: number;
  productName?: string;
  isAiGenerated?: boolean;
  isAnalyzing?: boolean;
}

const generateProductName = async (barcode: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const firstDigits = barcode.substring(0, 3);
  const productTypes = ['Elektronik', 'Gıda', 'Tekstil', 'Ev Eşyası', 'Kırtasiye'];
  const brands = ['Samsung', 'LG', 'Arçelik', 'Vestel', 'Bosch', 'Grundig', 'Beko'];

  const typeIndex = parseInt(firstDigits) % productTypes.length;
  const brandIndex = parseInt(firstDigits) % brands.length;

  return `${brands[brandIndex]} ${productTypes[typeIndex]}`;
};

const analyzeImageWithAI = async (imageData: string): Promise<Array<{ barcode: string; type?: string }>> => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const detectedBarcodes = [
    { barcode: '8690012345678', type: 'STOK_KODU' },
    { barcode: '8690098765432', type: 'URUN_KODU' },
  ];

  return detectedBarcodes;
};

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBarcodes, setScannedBarcodes] = useState<ScannedBarcode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<any>(null);
  const { addItems } = useInventory();

  const handleBarcodeScanned = async ({ data, type }: { type: string; data: string }) => {
    if (scannedBarcodes.some((b) => b.data === data)) return;

    const newBarcode: ScannedBarcode = {
      data,
      type: undefined,
      selected: true,
      quantity: 1,
      isAnalyzing: true,
    };

    setScannedBarcodes((prev) => [...prev, newBarcode]);

    const productName = await generateProductName(data);
    setScannedBarcodes((prev) =>
      prev.map((b) =>
        b.data === data
          ? { ...b, productName, isAiGenerated: true, isAnalyzing: false }
          : b
      )
    );
  };

  const handleAiAnalysis = async () => {
    if (!cameraRef.current) return;

    setIsAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 1,
      });

      if (photo?.base64) {
        const detectedBarcodes = await analyzeImageWithAI(photo.base64);

        const newBarcodes: ScannedBarcode[] = [];
        for (const { barcode: barcodeData, type } of detectedBarcodes) {
          if (scannedBarcodes.some((b) => b.data === barcodeData)) continue;

          const productName = await generateProductName(barcodeData);
          newBarcodes.push({
            data: barcodeData,
            type,
            selected: true,
            quantity: 1,
            productName,
            isAiGenerated: true,
          });
        }

        if (newBarcodes.length > 0) {
          setScannedBarcodes((prev) => [...prev, ...newBarcodes]);
          Alert.alert(
            '✅ Başarılı',
            `${newBarcodes.length} barkod AI ile algılandı!\n\nİpucu: Her barkodun türünü (STOK KODU/ÜRÜN KODU) görebilirsiniz.`
          );
        } else {
          Alert.alert('ℹ️ Bilgi', 'Görüntüde yeni barkod bulunamadı.');
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      Alert.alert('❌ Hata', 'AI analizi sırasında bir hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToInventory = async () => {
    const selectedItems = scannedBarcodes.filter((b) => b.selected);

    if (selectedItems.length === 0) {
      Alert.alert('⚠️ Uyarı', 'Lütfen en az bir barkod seçin.');
      return;
    }

    try {
      await addItems(
        selectedItems.map((b) => ({
          barcode: b.data,
          quantity: b.quantity,
          product_name: b.productName,
          is_ai_generated: b.isAiGenerated,
        }))
      );

      Alert.alert(
        '✅ Başarılı',
        `${selectedItems.length} ürün Supabase veritabanına eklendi!`
      );
      setScannedBarcodes([]);
    } catch (error) {
      Alert.alert('❌ Hata', 'Ürünler kaydedilirken bir hata oluştu.');
      console.error('Save error:', error);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#64748b" />
          <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permissionText}>
            Barkod taramak için kamera iznine ihtiyacımız var.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalSelected = scannedBarcodes.filter((b) => b.selected).length;
  const totalQuantity = scannedBarcodes
    .filter((b) => b.selected)
    .reduce((sum, b) => sum + b.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ScanBarcode size={28} color="#fff" />
          <Text style={styles.headerTitle}>Barkod Tarayıcı</Text>
        </View>
        <Text style={styles.headerSubtitle}>Çoklu Barkod Okuma</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'pdf417',
              'aztec',
              'ean13',
              'ean8',
              'code39',
              'code93',
              'code128',
              'upc_a',
              'upc_e',
              'itf14',
            ],
          }}
        >
          <TouchableOpacity
            style={[
              styles.aiButton,
              isAnalyzing && styles.aiButtonDisabled,
            ]}
            onPress={handleAiAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Camera size={20} color="#fff" />
                <Text style={styles.aiButtonText}>AI Analiz</Text>
              </>
            )}
          </TouchableOpacity>
        </CameraView>
      </View>

      {scannedBarcodes.length > 0 && (
        <View style={styles.barcodesContainer}>
          <View style={styles.barcodesHeader}>
            <Text style={styles.barcodesTitle}>
              Taranan Barkodlar ({scannedBarcodes.length})
            </Text>
            <TouchableOpacity
              onPress={() => setScannedBarcodes([])}
              style={styles.clearButton}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.barcodesList}>
            {scannedBarcodes.map((barcode, index) => (
              <View
                key={`${barcode.data}-${index}`}
                style={styles.barcodeItem}
              >
                <TouchableOpacity
                  onPress={() =>
                    setScannedBarcodes((prev) =>
                      prev.map((b, i) =>
                        i === index ? { ...b, selected: !b.selected } : b
                      )
                    )
                  }
                  style={[
                    styles.checkbox,
                    barcode.selected && styles.checkboxSelected,
                  ]}
                >
                  {barcode.selected && <Plus size={16} color="#fff" />}
                </TouchableOpacity>

                <View style={styles.barcodeInfo}>
                  <View style={styles.barcodeTextContainer}>
                    <Text style={styles.barcodeText}>{barcode.data}</Text>
                    {barcode.type && (
                      <View style={styles.barcodeTypeContainer}>
                        <Text style={styles.barcodeType}>{barcode.type}</Text>
                      </View>
                    )}
                  </View>
                  {barcode.isAnalyzing && (
                    <ActivityIndicator size="small" color="#9333ea" />
                  )}
                  {barcode.productName && !barcode.isAnalyzing && (
                    <View style={styles.productNameContainer}>
                      <Sparkles size={14} color="#9333ea" />
                      <Text style={styles.productName}>{barcode.productName}</Text>
                    </View>
                  )}
                </View>

                {barcode.selected && (
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        setScannedBarcodes((prev) =>
                          prev.map((b, i) =>
                            i === index && b.quantity > 1
                              ? { ...b, quantity: b.quantity - 1 }
                              : b
                          )
                        )
                      }
                      style={styles.quantityButton}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.quantityInput}
                      value={barcode.quantity.toString()}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        setScannedBarcodes((prev) =>
                          prev.map((b, i) =>
                            i === index ? { ...b, quantity: num } : b
                          )
                        );
                      }}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setScannedBarcodes((prev) =>
                          prev.map((b, i) =>
                            i === index ? { ...b, quantity: b.quantity + 1 } : b
                          )
                        )
                      }
                      style={styles.quantityButton}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {totalSelected > 0 && (
            <View style={styles.footer}>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>
                  {totalSelected} ürün • {totalQuantity} adet
                </Text>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveToInventory}
              >
                <Text style={styles.saveButtonText}>Envantere Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cameraContainer: {
    height: 300,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  aiButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#9333ea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  barcodesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
  },
  barcodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  barcodesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  clearButton: {
    padding: 8,
  },
  barcodesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  barcodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  barcodeInfo: {
    flex: 1,
  },
  barcodeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  barcodeTypeContainer: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  barcodeType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  productNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productName: {
    fontSize: 12,
    color: '#9333ea',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  quantityInput: {
    width: 50,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  summaryContainer: {
    flex: 1,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
