import React, { useEffect, useRef } from "react";
import { View, Text, Button, Animated } from "react-native";

const SlideInView = ({
  children,
  visible,
  direction = "left", // 'left', 'right', 'up', 'down'
}: {
  children: React.ReactNode;
  visible: boolean;
  direction?: "left" | "right" | "up" | "down";
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // visible이 true인 경우 즉시 보이도록 설정 (애니메이션 없음)
      translateX.setValue(0);
      translateY.setValue(0);
      opacity.setValue(1);
    } else {
      // 슬라이드 아웃 + 페이드 아웃 애니메이션
      const slideDistance = 50; // 슬라이드 거리

      const animations = [
        Animated.timing(opacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ];

      if (direction === "left") {
        animations.push(
          Animated.timing(translateX, {
            toValue: -slideDistance,
            duration: 300,
            useNativeDriver: true,
          })
        );
      } else if (direction === "right") {
        animations.push(
          Animated.timing(translateX, {
            toValue: slideDistance,
            duration: 300,
            useNativeDriver: true,
          })
        );
      } else if (direction === "down") {
        animations.push(
          Animated.timing(translateY, {
            toValue: -slideDistance,
            duration: 300,
            useNativeDriver: true,
          })
        );
      } else if (direction === "up") {
        animations.push(
          Animated.timing(translateY, {
            toValue: slideDistance,
            duration: 300,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    }
  }, [visible, direction]);

  // 초기 위치 설정 - visible 상태에 따라 다르게 설정
  useEffect(() => {
    const slideDistance = 50;

    if (visible) {
      // visible이 true인 경우 즉시 보이도록 설정
      translateX.setValue(0);
      translateY.setValue(0);
      opacity.setValue(1);
    } else {
      // visible이 false인 경우 슬라이드 위치에 설정
      if (direction === "left") {
        translateX.setValue(slideDistance);
      } else if (direction === "right") {
        translateX.setValue(-slideDistance);
      } else if (direction === "down") {
        translateY.setValue(slideDistance);
      } else if (direction === "up") {
        translateY.setValue(-slideDistance);
      }
      opacity.setValue(0);
    }
  }, [visible, direction]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default SlideInView;
