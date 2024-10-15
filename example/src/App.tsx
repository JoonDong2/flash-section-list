import FlashSectionList, { type Section } from 'flash-section-list';
import { Dimensions, Text, View } from 'react-native';

const screenWidth = Dimensions.get('screen').width;

function getRandomColor() {
  // 16진수 색상 코드를 생성합니다.
  const randomColor =
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0');
  return randomColor;
}

const sections: Section[] = [
  {
    data: Array.from({ length: 50 }).map(getRandomColor),
    renderItem: ({ item: color, index }) => {
      const width = screenWidth / 3;
      const height = width * 1.5;
      return (
        <View
          style={{
            width,
            height,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'black' }}>{index}</Text>
        </View>
      );
    },
    numOfColumns: 3,
    type: 'block',
  },
  {
    header: {
      element: <View style={{ height: 10 }} />,
    },
    data: Array.from({ length: 31 }).map(getRandomColor),
    renderItem: ({ item: color, index }) => {
      const width = screenWidth / 2;
      const height = width * 1.5;
      return (
        <View
          style={{
            width,
            height,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>{index}</Text>
        </View>
      );
    },
    numOfColumns: 2,
    type: 'block',
  },
  {
    element: (
      <View
        style={{
          width: screenWidth,
          height: 300,
          marginVertical: 10,
          backgroundColor: getRandomColor(),
        }}
      />
    ),
    type: 'element',
  },
  {
    element: (
      <View
        style={{
          width: screenWidth,
          height: 300,
          marginVertical: 10,
          backgroundColor: getRandomColor(),
        }}
      />
    ),
    type: 'element',
  },
  {
    data: Array.from({ length: 101 }).map(getRandomColor),
    renderItem: ({ item: color, index }) => {
      const width = screenWidth / 4;
      const height = width * 1.5;
      return (
        <View
          style={{
            width,
            height,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>{index}</Text>
        </View>
      );
    },
    numOfColumns: 4,
    type: 'block',
  },
  {
    data: Array.from({ length: 30 }).map(getRandomColor),
    renderItem: ({ item: color, index }) => {
      const width = screenWidth;
      const height = 100;
      return (
        <View
          style={{
            width,
            height,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>{index}</Text>
        </View>
      );
    },
    numOfColumns: 1,
    type: 'block',
  },
];

export default function App() {
  return (
    <FlashSectionList
      contentContainerStyle={{ backgroundColor: 'white' }}
      estimatedItemSize={110}
      sections={sections}
    />
  );
}
