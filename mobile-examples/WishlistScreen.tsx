import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';

interface WishItem {
  id: number;
  title: string;
  imageUrl: string;
  url: string;
  price?: string;
  reserved: boolean;
  received: boolean;
}

interface Wishlist {
  id: number;
  name: string;
  shareableLink: string;
  items: WishItem[];
}

export default function WishlistScreen() {
  const queryClient = useQueryClient();

  const { data: wishlists, isLoading, refetch } = useQuery<Wishlist[]>({
    queryKey: ['/api/wishlist'],
    queryFn: () => apiRequest('/api/wishlist'),
  });

  const addItemMutation = useMutation({
    mutationFn: (url: string) =>
      apiRequest(`/api/wishlist/${wishlists?.[0]?.id}/items`, {
        method: 'POST',
        body: { url },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
  });

  const shareWishlist = async (wishlist: Wishlist) => {
    try {
      await Share.share({
        message: `Mira mi lista de deseos: https://watawan.com/user/${wishlist.shareableLink}`,
        url: `https://watawan.com/user/${wishlist.shareableLink}`,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir la lista');
    }
  };

  const handleAddItem = () => {
    Alert.prompt(
      'Añadir producto',
      'Pega la URL del producto:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Añadir',
          onPress: (url) => {
            if (url) addItemMutation.mutate(url);
          },
        },
      ],
      'plain-text',
      '',
      'url'
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando listas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {wishlists?.map((wishlist) => (
          <View key={wishlist.id} style={styles.wishlistCard}>
            <View style={styles.wishlistHeader}>
              <Text style={styles.wishlistTitle}>{wishlist.name}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => shareWishlist(wishlist)}
                  style={styles.shareButton}
                >
                  <MaterialIcons name="share" size={24} color="#FFE066" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {wishlist.items.map((item) => (
                <TouchableOpacity key={item.id} style={styles.itemCard}>
                  <View style={styles.itemImageContainer}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                    {item.reserved && (
                      <View style={styles.reservedBadge}>
                        <Text style={styles.reservedText}>Reservado</Text>
                      </View>
                    )}
                    {item.received && (
                      <View style={styles.receivedBadge}>
                        <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.price && (
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={handleAddItem}
                style={styles.addItemCard}
              >
                <MaterialIcons name="add" size={40} color="#FFE066" />
                <Text style={styles.addItemText}>Añadir producto</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  wishlistCard: {
    backgroundColor: '#1e1e1e',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  wishlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wishlistTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  shareButton: {
    padding: 8,
  },
  itemCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 8,
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  reservedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFE066',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reservedText: {
    color: '#121212',
    fontSize: 10,
    fontWeight: 'bold',
  },
  receivedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  itemTitle: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
  itemPrice: {
    color: '#FFE066',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  addItemCard: {
    width: 150,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFE066',
    borderStyle: 'dashed',
  },
  addItemText: {
    color: '#FFE066',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});