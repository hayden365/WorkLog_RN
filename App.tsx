import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuProvider } from 'react-native-popup-menu';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import { useTheme } from './src/hooks/useTheme';
import { runWorkplaceMigration } from './src/store/migrations/runWorkplaceMigration';
import { useScheduleStore } from './src/store/shiftStore';
import { useWorkplaceStore } from './src/store/workplaceStore';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { scheme, colors } = useTheme();

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator>
        {/* HomeScreen renders its own branded header (logo + settings gear). */}
        <Stack.Screen name='Home' component={HomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  // Pretendard is embedded natively via the expo-font config plugin (app.json),
  // so it is available at launch — no runtime font loading/gating needed.
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    runWorkplaceMigration();
    // MMKV를 직접 수정했으므로 persist 스토어를 재수화한다.
    Promise.all([
      useWorkplaceStore.persist.rehydrate(),
      useScheduleStore.persist.rehydrate(),
    ]).finally(() => setReady(true));
  }, []);

  if (!ready) return null; // 스플래시/빈 화면 (짧음, 동기 MMKV)

  return (
    <SafeAreaProvider>
      <MenuProvider>
        <AppContent />
      </MenuProvider>
    </SafeAreaProvider>
  );
}
