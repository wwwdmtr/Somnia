import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ScreenName from '../constants/ScreenName';
import TabName from '../constants/TabName';
import { UserDreamScreen } from '../screens/AddYourDream';
import { DreamScreen } from '../screens/DreamScreen';
import { AllDreamsScreen } from '../screens/FeedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SignOutScreen } from '../screens/SignOutScreen';
import { UpdateDreamScreen } from '../screens/UpdateDreamModalScreen';

import { FeedStackParamList } from './FeedStackParamList';
import { ProfileStackParamList } from './ProfileStackParamList';
import { RootTabParamList } from './RootTabParamList';
import { UserDreamStackParamList } from './UserDreamStackParamList';

import type { ComponentProps } from 'react';

const FeedStack = createNativeStackNavigator<FeedStackParamList>();
function FeedStackNav() {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen name={ScreenName.Feed} component={AllDreamsScreen} />
      <FeedStack.Screen name={ScreenName.Dream} component={DreamScreen} />
      <FeedStack.Screen
        name={ScreenName.EditDream}
        component={UpdateDreamScreen}
        options={{
          presentation: 'modal',
          title: 'Edit dream',
        }}
      />
    </FeedStack.Navigator>
  );
}

const UserDreamStack = createNativeStackNavigator<UserDreamStackParamList>();
function UserDreamStackNav() {
  return (
    <UserDreamStack.Navigator>
      <UserDreamStack.Screen
        name={ScreenName.UserDreams}
        component={UserDreamScreen}
      />
      <UserDreamStack.Screen name={ScreenName.Dream} component={DreamScreen} />
    </UserDreamStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNav() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name={ScreenName.Profile}
        component={ProfileScreen}
      />
      <ProfileStack.Screen
        name={ScreenName.SignOut}
        component={SignOutScreen}
      />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNav() {
  return (
    <Tab.Navigator
      initialRouteName={TabName.FeedTab}
      screenOptions={({ route }) => {
        type IoniconName = ComponentProps<typeof Ionicons>['name'];
        const iconMap: Record<
          string,
          { active: IoniconName; inactive: IoniconName }
        > = {
          [TabName.FeedTab]: { active: 'home', inactive: 'home-outline' },
          [TabName.UserDreamTab]: {
            active: 'clipboard',
            inactive: 'clipboard-outline',
          },
          [TabName.ProfileTab]: {
            active: 'person',
            inactive: 'person-outline',
          },
        };
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, size }) => {
            const pair = iconMap[route.name] ?? {
              active: 'ellipse',
              inactive: 'ellipse-outline',
            };
            const name = focused ? pair.active : pair.inactive;
            return <Ionicons name={name} size={size} />;
          },
        };
      }}
    >
      <Tab.Screen name={TabName.FeedTab} component={FeedStackNav} />
      <Tab.Screen name={TabName.UserDreamTab} component={UserDreamStackNav} />
      <Tab.Screen name={TabName.ProfileTab} component={ProfileStackNav} />
    </Tab.Navigator>
  );
}
