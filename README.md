# flash-section-list

The library, which is dependent on `@shopify/flash-list`, overrides the [`overrideItemLayout` function internally](./src/FlashSectionList.tsx#L234-L258) to ensure that sections with different `numOfColumns` are rendered properly.

Additionally, for enhanced performance, the library also [overrides the `getItemType` function internally](./src/FlashSectionList.tsx#L212-L233) based on the type information of the section and the header or footer.

You can [set `sticky` properties](./example/src/App.tsx#L31) not only for section items but also for footers or headers.

```ts
interface ElementSection {
  element: React.ReactElement | null;
  sticky?: boolean;
  type?: string;
}

interface DataSection<ItemT> {
  data: ItemT[];
  renderItem: ListRenderItem<ItemT>;
  type?: string; // <- default: sectionIndex
  header?: ElementSection;
  footer?: ElementSection;
  stickyHeaderIndices?: number[];
  numOfColumns?: number;
}
```

## Example

https://github.com/JoonDong2/flash-section-list-example

## Installation

```sh
npm install @shopify/flash-list flash-section-list
```

## Usage

```js
import FlashSectionList from 'flash-section-list';
import { Dimensions, View } from 'react-native';

const screenWidth = Dimensions.get('screen').width;

const sections: (DataSection<any> | ElementSection)[] = [
  {
    data: Array.from({ length: 100 }),
    numOfColumns: 1, // !
    renderItem: () => {
      return <View />;
    },
    header: {
      element: <View />,
      sticky: true,
    },
    footer: {
      element: <View/>,
      sticky: true,
    },
  },
  {
    element: <View />,
    sticky: true,
  }
  {
    data: Array.from({ length: 100 }),
    numOfColumns: 2, // !!
    header: {
      element:<View />,
      sticky: true,
    },
    renderItem: ({ index }: { index: number }) => {
      return <View  />;
    },
  },
];

export default function App() {
  return <FlashSectionList estimatedItemSize={110} sections={sections} />;
}

```

## Known Issues

### Item Type

The `data` for each section may differ, and the type of the item property in each section's `renderItem` cannot be inferred correctly.  
Therefore, you must manually cast the types.

```js
interface Item {
  id: number;
}

const sections =[{
  data: Array.from({length: 10}).map((_, index) => ({id: index})),
  renderItem: ({item}: {item: Item}) => <View />
}]
```

### Sections

This library [parses the `sections` array whenever it changes.](./src/FlashSectionList.tsx#L65-L142)  
Therefore, you should avoid changing the sections array.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
