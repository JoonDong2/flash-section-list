# flash-section-list

The library, which is dependent on `@shopify/flash-list`, overrides the [`overrideItemLayout` function internally](./src/FlashSectionList.tsx#295-L320) to ensure that sections with different `numOfColumns` are rendered properly.

Additionally, for enhanced performance, the library also [overrides the `getItemType` function internally](./src/FlashSectionList.tsx#L263-L294) based on the type information of the section and the header or footer.

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

### Simple

[./example/src/App.tsx](./example/src/App.tsx)

### Complex (with NestedScrollView and TabView)

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

### Type

The `type` of a Section refers to the type that will be applied to all items, excluding the `header` and `footer`.

By default, the `index` of the Section is used. However, if items in different Sections share the same type, you may use the same type for them. (e.g., [Example](./example/src/App.tsx#L49))

It's recommended to use the same type for items with the same structure to encourage optimal reuse.

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

This library [parses the `sections` array whenever it changes.](./src/FlashSectionList.tsx#L75-L155)  
Therefore, you should avoid changing the sections array.

### Blank

When `numOfColumns` is set to 3 and there are 5 items, an empty space will occur in the second row.

If this empty space is not physically filled, the next row will move up, causing an alignment issue.

To resolve this, [I wrap the item with a View and use the `onLayout` of that View to calculate the size of the blank space.](./src/FlashSectionList.tsx#L246-L254)

To fully take advantage of reusability, I didn't limit the wrapping to just the last item.

As a result, the layout of all items within a section must be consistent.

However, I am unsure of what issues this approach might cause.

### Screen Jitter

There is an issue in the iPhone simulator where the screen shakes when scrolling to the edges.

This issue was not observed on the Android emulator, or on actual iPhone and Android devices.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
