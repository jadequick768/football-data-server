import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { getMatches, type MatchStatus } from '../api';
import { yyyyMmDd } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type AnyObj = Record<string, any>;

function extractMatchId(item: AnyObj): string | null {
  return (
    item?.id ??
    item?.match_id ??
    item?.event_id ??
    item?.slug ??
    item?.data?.id ??
    null
  )?.toString?.() ?? null;
}

function extractTitle(item: AnyObj): string {
  const home = item?.home?.name ?? item?.home_team?.name ?? item?.home_name ?? item?.home;
  const away = item?.away?.name ?? item?.away_team?.name ?? item?.away_name ?? item?.away;
  if (home && away) return `${home} vs ${away}`;
  return item?.name ?? item?.title ?? 'Match';
}

export default function HomeScreen({ navigation }: Props) {
  const [status, setStatus] = useState<MatchStatus>('inprogress');
  const date = useMemo(() => yyyyMmDd(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getMatches({ date, status });
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
  }, [status]);

  const items: AnyObj[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.matches)
        ? data.matches
        : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ padding: 12, gap: 8 }}>
        <Text style={{ color: '#fff', fontSize: 12, opacity: 0.8 }}>Date: {date}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['inprogress', 'upcoming', 'finished'] as MatchStatus[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: status === s ? '#f5c400' : '#222',
              }}
            >
              <Text style={{ color: status === s ? '#000' : '#fff', fontWeight: '700' }}>{s}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={load}
            style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#333' }}
          >
            <Text style={{ color: '#fff' }}>Reload</Text>
          </Pressable>
        </View>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={{ color: '#ff6b6b' }}>{error}</Text> : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, idx) => (extractMatchId(item) ?? `${idx}`)}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item }) => {
          const matchId = extractMatchId(item);
          const title = extractTitle(item);
          return (
            <Pressable
              onPress={() => {
                if (!matchId) return;
                navigation.navigate('Match', { matchId: String(matchId), title });
              }}
              style={{ backgroundColor: '#111', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{title}</Text>
              <Text style={{ color: '#aaa', marginTop: 6 }} numberOfLines={1}>
                id: {matchId ?? '(unknown)'}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 12 }}>
            <Text style={{ color: '#aaa' }}>No matches found (or response schema differs). Open API JSON and adjust extractors.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
