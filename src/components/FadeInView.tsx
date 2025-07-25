import React, { useEffect, useRef } from "react";
import { View, Text, Button, Animated } from "react-native";

const FadeInView = ({
  children,
  visible,
}: {
  children: React.ReactNode;
  visible: boolean;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(visible);
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150, // ms
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150, // ms
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
};

export default FadeInView;
