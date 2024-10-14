import FlashSectionList from 'flash-section-list';
import { Dimensions, View } from 'react-native';

const screenWidth = Dimensions.get('screen').width;

const sections = [
  {
    data: Array.from({ length: 100 }),
    renderItem: () => {
      return (
        <View
          style={{
            height: 100,
            width: screenWidth,
            backgroundColor: 'yellow',
            marginBottom: 10,
          }}
        />
      );
    },
    header: {
      element: (
        <View
          style={{
            width: screenWidth,
            height: 100,
            backgroundColor: 'skyblue',
          }}
        />
      ),
      sticky: true,
    },
    footer: {
      element: (
        <View
          style={{
            width: screenWidth,
            height: 100,
            backgroundColor: 'tomato',
          }}
        />
      ),
      sticky: true,
    },
  },
  {
    data: Array.from({ length: 100 }),
    numOfColumns: 2,
    header: {
      element: (
        <View
          style={{
            width: screenWidth,
            height: 100,
            backgroundColor: 'orange',
          }}
        />
      ),
      sticky: true,
    },
    renderItem: ({ index }: { index: number }) => {
      return (
        <View
          style={{
            height: 100,
            width: screenWidth / 2,
            backgroundColor: index % 2 === 0 ? 'blue' : 'green',
            marginBottom: 10,
          }}
        />
      );
    },
  },
  {
    data: Array.from({ length: 90 }),
    numOfColumns: 3,
    renderItem: ({ index }: { index: number }) => {
      return (
        <View
          style={{
            height: 100,
            width: screenWidth / 3,
            backgroundColor:
              index % 3 === 0
                ? 'yellow'
                : index % 3 === 1
                  ? 'skyblue'
                  : 'tomato',
            marginBottom: 10,
          }}
        />
      );
    },
    header: {
      element: (
        <View
          style={{
            width: screenWidth,
            height: 100,
            backgroundColor: 'skyblue',
          }}
        />
      ),
      sticky: true,
    },
    footer: {
      element: (
        <View
          style={{
            width: screenWidth,
            height: 100,
            backgroundColor: 'tomato',
          }}
        />
      ),
      sticky: true,
    },
  },
];

export default function App() {
  return <FlashSectionList estimatedItemSize={110} sections={sections} />;
}
