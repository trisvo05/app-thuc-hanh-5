import React from 'react';
import {Text, View} from 'react-native';
import {common} from '../ui/theme';

// Workspace ban đầu không có màn hình Thông báo Bài 4 để tái sử dụng.
export function NotificationsScreen() {
  return <View style={common.screen}><View style={common.content}><Text style={common.title}>Thông báo</Text><Text style={common.subtitle}>Cập nhật của bạn</Text></View><Text style={common.empty}>Chưa có thông báo.</Text></View>;
}
