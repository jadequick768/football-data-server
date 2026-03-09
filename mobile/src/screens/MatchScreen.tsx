import React from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { getMatchDeep, getMatchDetail } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Match'>;

type Tab = 'detail' | 'lineups' | 'stats' | 'incidents' | 'odds' | 'votes' | 'shotmap' | 'graph' | 'standing' | 'last_matches' | 'h2h';

export default function MatchScreen({ route, navigation }: Props) {
  const { matchId, title } = route.params;
  const [tab, setTab] = React.useState<Tab>('detail');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (title) navigation.setOptions({ title });
  }, [navigation, title]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = tab === 'detail' ? await getMatchDetail(matchId) : await getMatchDeep(matchId, tab);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, matchId]);

  const tabs: Tab[] = ['detail', 'lineups', 'stats', 'incidents', 'odds', 'votes', 'shotmap', 'graph', 'standing', 'last_matches', 'h2h'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ padding: 12, gap: 10 }}>
        <Text style={{ color: '#aaa' }}>matchId: {matchId}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tabs.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: tab === t ? '#f5c400' : '#222',
              }}
            >
              <Text style={{ color: tab === t ? '#000' : '#fff', fontWeight: '700' }}>{t}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={load}
            style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#333' }}
          >
            <Text style={{ color: '#fff' }}>Reload</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Watch', { matchId, title })}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#1d4ed8' }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>Watch stream</Text>
        </Pressable>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={{ color: '#ff6b6b' }}>{error}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <View style={{ backgroundColor: '#111', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#222' }}>
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Response ({tab})</Text>
          <Text style={{ color: '#ddd', fontFamily: 'Menlo' }}>{JSON.stringify(data, null, 2)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
