import { Image } from 'expo-image';
import FlashSectionList, { type Section } from 'flash-section-list';
import { Dimensions, View } from 'react-native';

const screenWidth = Dimensions.get('screen').width;

const getImage = (id: number) => {
  return `https://picsum.photos/id/${id}/100/150`;
};

const sections: Section[] = [
  {
    data: Array.from({ length: 500 }).map((_, index) => getImage(index)),
    renderItem: ({ item: uri }) => {
      const width = screenWidth / 8;
      const height = width * 1.5;
      return (
        <Image
          source={{ uri }}
          style={{
            width,
            height,
          }}
        />
      );
    },
    numOfColumns: 8,
    type: 'image',
  },
  {
    header: {
      element: <View style={{ height: 10 }} />,
    },
    data: Array.from({ length: 300 }).map((_, index) => getImage(index)),
    renderItem: ({ item: uri }) => {
      const width = screenWidth / 6;
      const height = width * 1.5;
      return (
        <Image
          source={{ uri }}
          style={{
            width,
            height,
          }}
        />
      );
    },
    numOfColumns: 6,
    type: 'image', // recyclable as long as the structure remains the same, even if the size differs.
  },
  {
    element: (
      <Image
        source={{ uri: getImage(100) }}
        style={{
          width: screenWidth,
          height: screenWidth * 1.5,
          marginVertical: 10,
        }}
      />
    ),
    type: 'element',
  },
  {
    element: (
      <Image
        source={{ uri: getImage(101) }}
        style={{
          width: screenWidth,
          height: screenWidth * 1.5,
          marginVertical: 10,
        }}
      />
    ),
    type: 'element',
  },
  {
    data: Array.from({ length: 300 }).map((_, index) => getImage(index)),
    renderItem: ({ item: uri }) => {
      const width = screenWidth / 12;
      const height = width * 1.5;
      return (
        <Image
          source={{ uri }}
          style={{
            width,
            height,
          }}
        />
      );
    },
    numOfColumns: 12,
    type: 'image',
  },
  {
    data: Array.from({ length: 755 }).map((_, index) => getImage(index)),
    renderItem: ({ item: uri }) => {
      const width = screenWidth / 10;
      const height = width * 1.5;
      return (
        <Image
          source={{ uri }}
          style={{
            width,
            height,
          }}
        />
      );
    },
    numOfColumns: 10,
    type: 'image',
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
  // vs FlatList
  // return (
  //   <FlatList
  //     data={sections}
  //     renderItem={({ item }) => {
  //       if (item.data) {
  //         return (
  //           <FlatList
  //             data={item.data}
  //             renderItem={item.renderItem}
  //             numColumns={item.numOfColumns ?? 1}
  //           />
  //         );
  //       }
  //       return null;
  //     }}
  //   />
  // );
}
