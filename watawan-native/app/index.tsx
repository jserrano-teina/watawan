import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>WataWan</Text>
        <Text style={styles.subtitle}>Tu aplicación móvil nativa</Text>
        <Text style={styles.description}>
          Versión React Native de WataWan con todas las funcionalidades optimizadas para móvil
        </Text>
        
        <View style={styles.features}>
          <Text style={styles.featureTitle}>Funcionalidades nativas:</Text>
          <Text style={styles.feature}>• Rendimiento superior a PWA</Text>
          <Text style={styles.feature}>• Notificaciones push</Text>
          <Text style={styles.feature}>• Compartir nativo</Text>
          <Text style={styles.feature}>• Distribución en app stores</Text>
        </View>

        <Link href="/auth" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Probar Autenticación</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFE066',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    marginBottom: 40,
  },
  featureTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  feature: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FFE066',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
});