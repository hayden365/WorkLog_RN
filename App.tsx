import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuProvider } from 'react-native-popup-menu';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import HomeScreen from './src/screens/HomeScreen';
import { SettingsModal } from './src/components/SettingsModal';
import { useTheme } from './src/hooks/useTheme';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { scheme, colors } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);

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
        <Stack.Screen
          name='Home'
          component={HomeScreen}
          options={{
            headerTitle: 'WorkLog',
            headerTitleAlign: 'left',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setSettingsVisible(true)}
                hitSlop={12}
              >
                <Feather name='settings' size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack.Navigator>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MenuProvider>
        <AppContent />
      </MenuProvider>
    </SafeAreaProvider>
  );
}
