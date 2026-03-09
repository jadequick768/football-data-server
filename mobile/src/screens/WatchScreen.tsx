import React from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';

import type { RootStackParamList } from '../navigation/types';
import { WATCH_BASE_URL } from '../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Watch'>;

export default function WatchScreen({ route, navigation }: Props) {
  const { matchId, title } = route.params;
  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    navigation.setOptions({ title: title ? `Watch: ${title}` : 'Watch' });
  }, [navigation, title]);

  const watchUrl = `${WATCH_BASE_URL}/watch/${encodeURIComponent(matchId)}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Pressable
          onPress={() => setKey((k) => k + 1)}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#333' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Reload</Text>
        </Pressable>
        <Text style={{ color: '#aaa', flex: 1 }} numberOfLines={1}>
          {watchUrl}
        </Text>
      </View>

      <WebView
        key={key}
        source={{ uri: watchUrl }}
        style={{ flex: 1, backgroundColor: '#000' }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
            <Text style={{ color: '#aaa', marginTop: 8 }}>Loading stream…</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
