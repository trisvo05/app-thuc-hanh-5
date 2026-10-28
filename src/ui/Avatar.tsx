import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {colors} from './theme';

export function Avatar({name, uri, online, size = 48}: {name: string; uri?: string; online?: boolean; size?: number}) {
  return <View style={[styles.outer, {width: size, height: size, borderRadius: size / 2}]}>
    {uri ? <Image source={{uri}} style={{width: size, height: size, borderRadius: size / 2}} />
      : <Text style={[styles.initial, {fontSize: size * 0.4}]}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>}
    {online !== undefined && <View style={[styles.dot, online ? styles.online : styles.offline]} />}
  </View>;
}
const styles = StyleSheet.create({outer: {backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center'}, initial: {fontWeight: '700', color: colors.primary}, dot: {position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.white}, online: {backgroundColor: colors.online}, offline: {backgroundColor: '#9ca3af'}});
