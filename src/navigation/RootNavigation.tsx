import React, {useEffect, useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackNavigationProp} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {UserProfile} from '../services/userService';
import {AuthScreen} from '../screens/AuthScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {ContactsScreen} from '../screens/ContactsScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {NotificationsScreen} from '../screens/NotificationsScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {colors} from '../ui/theme';
import {AuthAccount} from '../services/authService';
import {getConversationPeer} from '../services/chatService';
import {AppNotification, subscribeNotifications} from '../services/notificationService';

export type RootStackParams = {Tabs: undefined; Chat: {peer: UserProfile}};
const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator();
const iconNames: Record<string, string> = {Home: '◉', Contacts: '♧', Notifications: '♧', Settings: '⚙'};
function TabIcon({name, color}: {name: string; color: string}) {return <Text style={[styles.icon, {color}]}>{iconNames[name]}</Text>;}
const tabIcons: Record<string, ({color}: {color: string}) => React.JSX.Element> = {
  Home: ({color}) => <TabIcon name="Home" color={color} />,
  Contacts: ({color}) => <TabIcon name="Contacts" color={color} />,
  Notifications: ({color}) => <TabIcon name="Notifications" color={color} />,
  Settings: ({color}) => <TabIcon name="Settings" color={color} />,
};
function Tabs({uid, profile, navigation}: {uid: string; profile: UserProfile; navigation: NativeStackNavigationProp<RootStackParams, 'Tabs'>}) {
  const [unread, setUnread] = useState(0);
  useEffect(() => subscribeNotifications(uid, items => setUnread(items.filter((item: AppNotification) => !item.read).length), error => console.warn(error)), [uid]);
  const openConversation = async (id: string) => {try {const peer = await getConversationPeer(uid, id); navigation.navigate('Chat', {peer});} catch (error) {console.warn(error);}};
  return <Tab.Navigator screenOptions={({route}) => ({tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, headerShown: false, tabBarIcon: tabIcons[route.name]})}>
    <Tab.Screen name="Home" options={{title: 'Tin nhắn'}}>{() => <HomeScreen uid={uid} openChat={peer => navigation.navigate('Chat', {peer})} />}</Tab.Screen>
    <Tab.Screen name="Contacts" options={{title: 'Danh bạ'}}>{() => <ContactsScreen uid={uid} openChat={peer => navigation.navigate('Chat', {peer})} />}</Tab.Screen>
    <Tab.Screen name="Notifications" options={{title: 'Thông báo', tabBarBadge: unread || undefined}}>{() => <NotificationsScreen uid={uid} openConversation={openConversation} />}</Tab.Screen>
    <Tab.Screen name="Settings" options={{title: 'Cài đặt'}}>{() => <SettingsScreen profile={profile} />}</Tab.Screen>
  </Tab.Navigator>;
}
const styles = StyleSheet.create({icon: {fontSize: 20}});
export function RootNavigation({account, profile}: {account: AuthAccount | null; profile: UserProfile | null}) {
  return <NavigationContainer>
    {!account || !profile ? <AuthScreen /> : <Stack.Navigator>
      <Stack.Screen name="Tabs" options={{headerShown: false}}>{({navigation}) => <Tabs uid={account.uid} profile={profile} navigation={navigation} />}</Stack.Screen>
      <Stack.Screen name="Chat" options={{headerShown: false}}>{props => <ChatScreen {...props} uid={account.uid} />}</Stack.Screen>
    </Stack.Navigator>}
  </NavigationContainer>;
}
