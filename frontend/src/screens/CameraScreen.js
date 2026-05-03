import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionSub}>MenuLens needs the camera to scan menus</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });

      // Resize to keep upload size manageable
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      navigation.navigate('Results', { imageBase64: resized.base64, imageUri: resized.uri });
    } catch (err) {
      Alert.alert('Capture failed', 'Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />

      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Scan Menu</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Overlay frame guide */}
        <View style={styles.frameGuide}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.hint}>Position the menu within the frame</Text>

        {/* Shutter */}
        <View style={styles.shutterArea}>
          <TouchableOpacity
            style={[styles.shutterBtn, isCapturing && styles.shutterBtnCapturing]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            {isCapturing
              ? <ActivityIndicator color="#1A1A1A" />
              : <View style={styles.shutterInner} />
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FRAME_W = width * 0.85;
const FRAME_H = height * 0.45;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },

  permissionScreen: {
    flex: 1, backgroundColor: '#FAFAF8',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  permissionSub: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32 },
  permissionBtn: {
    backgroundColor: '#1A1A1A', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  permissionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: '#FFF', fontSize: 16 },
  topBarTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  frameGuide: {
    width: FRAME_W, height: FRAME_H,
    marginTop: 24, position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },

  hint: {
    color: 'rgba(255,255,255,0.65)', fontSize: 13,
    marginTop: 16, letterSpacing: 0.2,
  },

  shutterArea: {
    position: 'absolute', bottom: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
  },
  shutterBtnCapturing: { backgroundColor: 'rgba(255,255,255,0.8)' },
  shutterInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: '#E0E0E0',
  },
});
